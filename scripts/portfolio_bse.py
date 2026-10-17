"""Shared, Development-first BSE source adapter for PortfolioAI.

Source: vendored BennyThadikaran/BseIndiaApi v3.3.3.
Explicitly separates source discovery from financial observation admission.
No Supabase writes, R2 writes or research scoring are performed by this module.
"""
from __future__ import annotations

import hashlib
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

_ROOT = Path(__file__).resolve().parent.parent
_VENDOR_SRC = _ROOT / "vendor" / "bseindiaapi" / "src"
if not (_VENDOR_SRC / "bse" / "BSE.py").is_file():
    raise RuntimeError("VENDORED_BSEINDIAAPI_NOT_INSTALLED")
# Always use the pinned vendored code, not a system-wide bse package.
sys.path.insert(0, str(_VENDOR_SRC))

from bse import BSE  # noqa: E402

_SCRIP = re.compile(r"^[0-9]{6}$")
_PDF_NAME = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$",
    re.IGNORECASE,
)
_BSE_PDF_BASE = "https://www.bseindia.com/xml-data/corpfiling"
_RESULT_HINTS = (
    "financial result", "quarterly result", "unaudited", "audited financial",
    "results for the quarter", "results for the period", "financial statement",
)


def _scrip(value: str) -> str:
    code = str(value)
    if not _SCRIP.fullmatch(code):
        raise ValueError("BSE scrip code must be exactly six digits")
    return code


def _calendar_date(value: date | datetime) -> date:
    if isinstance(value, datetime):
        return value.date()
    if not isinstance(value, date):
        raise TypeError("Date must be datetime.date or datetime.datetime")
    return value


class PortfolioBSE:
    """Single integration surface usable from R3, V1-4 and later Python jobs.

    The returned snapshots/announcements are discovery evidence only; caller
    must use the independent issuer-original source qualification contract.
    """

    def __init__(self, download_folder: str | Path = "/tmp/portfolioai-bse"):
        self._bse = BSE(download_folder=str(download_folder))

    def __enter__(self) -> "PortfolioBSE":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def close(self) -> None:
        self._bse.exit()

    def get_scrip_candidate(self, symbol: str) -> dict[str, str]:
        """Candidate only. Verify canonical/historical ISIN separately."""
        if not re.fullmatch(r"[A-Z0-9.&-]{1,30}", symbol.upper()):
            raise ValueError("INVALID_SYMBOL")
        code = _scrip(str(self._bse.getScripCode(symbol.upper())))
        return {
            "symbol": symbol.upper(),
            "bse_scrip_code": code,
            "identity_status": "CANDIDATE_NOT_ISIN_VERIFIED",
        }

    def results_snapshot(self, scrip_code: str) -> dict[str, Any]:
        """Recent source dashboard only, NOT an eight-quarter history."""
        code = _scrip(scrip_code)
        payload = self._bse.resultsSnapshot(code)
        if not isinstance(payload, dict) or not isinstance(payload.get("periods"), list):
            raise RuntimeError("BSE_SNAPSHOT_SCHEMA_UNKNOWN")
        return {
            "source": "BSEINDIAAPI_VENDORED_3_3_3",
            "source_kind": "BSE_RESULTS_SNAPSHOT_DISCOVERY",
            "qualification_status": "DISCOVERY_ONLY",
            "bse_scrip_code": code,
            "periods": payload["periods"],
            "currency_unit": payload.get("currency_unit"),
            "results_in_crores": payload.get("results_in_crores"),
            "period_links": payload.get("period_links", []),
        }

    def result_calendar(self, scrip_code: str, start: date, end: date) -> dict[str, Any]:
        """Scheduled result dates are not reported historical financial facts."""
        code = _scrip(scrip_code)
        left, right = _calendar_date(start), _calendar_date(end)
        if left > right or right - left > timedelta(days=100):
            raise ValueError("INVALID_CALENDAR_RANGE")
        result = self._bse.resultCalendar(
            scripcode=code,
            from_date=datetime.combine(left, datetime.min.time()),
            to_date=datetime.combine(right, datetime.min.time()),
        )
        if not isinstance(result, list):
            raise RuntimeError("BSE_CALENDAR_SCHEMA_UNKNOWN")
        return {
            "bse_scrip_code": code,
            "source_kind": "BSE_RESULT_CALENDAR_DISCOVERY",
            "qualification_status": "DISCOVERY_ONLY",
            "results": result,
        }

    def financial_announcements(
        self,
        scrip_code: str,
        start: date,
        end: date,
        *,
        max_pages: int = 3,
    ) -> dict[str, Any]:
        """Bounded company-specific historical filing index.

        Uses the actual vendored BSE.announcements() method, with the verified
        upstream #18 'strScrip' patch, not a separate hand-written HTTP client.
        Limit each lookup to <=100 days to avoid bulk endpoint polling.
        """
        code = _scrip(scrip_code)
        left, right = _calendar_date(start), _calendar_date(end)
        if left > right or right - left > timedelta(days=100):
            raise ValueError("INVALID_ANNOUNCEMENT_RANGE")
        if not isinstance(max_pages, int) or not 1 <= max_pages <= 5:
            raise ValueError("INVALID_PAGE_BOUND")

        selected: list[dict[str, Any]] = []
        fetched = 0
        listed_total: int | None = None
        from_at = datetime.combine(left, datetime.min.time())
        to_at = datetime.combine(right, datetime.min.time())
        for page in range(1, max_pages + 1):
            data = self._bse.announcements(
                scripcode=code, page_no=page, from_date=from_at, to_date=to_at
            )
            if not isinstance(data, dict) or not isinstance(data.get("Table"), list):
                raise RuntimeError("BSE_ANNOUNCEMENTS_SCHEMA_UNKNOWN")
            rows = data["Table"]
            summary = data.get("Table1", [])
            if page == 1 and isinstance(summary, list) and summary:
                n = summary[0].get("ROWCNT") if isinstance(summary[0], dict) else None
                if isinstance(n, int) and n >= 0:
                    listed_total = n
            fetched += len(rows)
            for row in rows:
                if not isinstance(row, dict):
                    continue
                # Prevent cross-security data from entering discovery metadata.
                if str(row.get("SCRIP_CD", "")) != code:
                    continue
                title = str(row.get("NEWSSUB") or row.get("HEADLINE") or "")
                extra = str(row.get("HEADLINE") or "")
                if not any(t in (title + " " + extra).lower() for t in _RESULT_HINTS):
                    continue
                attachment = row.get("ATTACHMENTNAME")
                if not isinstance(attachment, str) or not _PDF_NAME.fullmatch(attachment):
                    attachment = None
                selected.append({
                    "bse_scrip_code": code,
                    "title": title[:480],
                    "published_at": row.get("NEWS_DT"),
                    "submission_at": row.get("News_submission_dt"),
                    "news_id": row.get("NEWSID"),
                    "quarter_id": row.get("QUARTER_ID"),
                    "attachment_name": attachment,
                    "official_pdf_candidates": (
                        [f"{_BSE_PDF_BASE}/AttachHis/{attachment}",
                         f"{_BSE_PDF_BASE}/AttachLive/{attachment}"]
                        if attachment else []
                    ),
                    "qualification_status": "DISCOVERY_ONLY",
                })
            if not rows or (listed_total is not None and fetched >= listed_total):
                break
        return {
            "bse_scrip_code": code,
            "start": left.isoformat(),
            "end": right.isoformat(),
            "source_kind": "BSE_CORPORATE_ANNOUNCEMENTS",
            "qualification_status": "DISCOVERY_ONLY",
            "page_limit": max_pages,
            "records_seen": fetched,
            "records_listed": listed_total,
            "may_have_more_pages": listed_total is not None and fetched < listed_total,
            "results": selected,
        }

    def retrieve_original_pdf(
        self,
        attachment_name: str,
        *,
        max_bytes: int = 12_000_000,
    ) -> tuple[bytes, dict[str, Any]]:
        """Get a named BSE issuer-original PDF with immutable byte hash.

        No persistence or interpretation; caller is responsible for strict
        period, issuer/ISIN, units, scope, revision and field qualification.
        Only BSE AttachHis/AttachLive paths can be used.
        """
        if not isinstance(attachment_name, str) or not _PDF_NAME.fullmatch(attachment_name):
            raise ValueError("INVALID_BSE_ATTACHMENT_NAME")
        if not isinstance(max_bytes, int) or not 1024 <= max_bytes <= 32_000_000:
            raise ValueError("INVALID_PDF_SIZE_LIMIT")
        for folder in ("AttachHis", "AttachLive"):
            url = f"{_BSE_PDF_BASE}/{folder}/{attachment_name}"
            response = self._bse.session.get(url, stream=True, timeout=25)
            try:
                if response.status_code == 404:
                    continue
                if not response.ok:
                    raise RuntimeError(f"BSE_PDF_HTTP_{response.status_code}")
                parts: list[bytes] = []
                length = 0
                for chunk in response.iter_content(chunk_size=65536):
                    if not chunk:
                        continue
                    length += len(chunk)
                    if length > max_bytes:
                        raise RuntimeError("BSE_PDF_TOO_LARGE")
                    parts.append(chunk)
                raw = b"".join(parts)
                if not raw.startswith(b"%PDF-"):
                    raise RuntimeError("BSE_ORIGINAL_NOT_PDF")
                return raw, {
                    "source_url": url,
                    "attachment_name": attachment_name,
                    "sha256": hashlib.sha256(raw).hexdigest(),
                    "bytes": len(raw),
                    "qualification_status": "ORIGINAL_BYTES_UNQUALIFIED_FINANCIAL_FACTS",
                }
            finally:
                response.close()
        raise FileNotFoundError("BSE_ORIGINAL_PDF_NOT_FOUND")
