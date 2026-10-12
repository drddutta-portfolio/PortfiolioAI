"""Bind retained originals to real NSE dissemination, not filename dates.
Matching extracted text is recorded separately from original PDF byte hashes.
"""
import argparse
import calendar
import concurrent.futures
import hashlib
import json
import re
import subprocess
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path


def compact(text): return " ".join(text.split())

def main():
    parser = argparse.ArgumentParser(); parser.add_argument("originals_dir"); parser.add_argument("prior_samples_dir")
    args = parser.parse_args(); ROOT = Path(args.originals_dir); SAMPLES = Path(args.prior_samples_dir)
    manifest = json.loads((ROOT / "original-acquisition-manifest.json").read_text())
    prior = json.loads((SAMPLES / "nse-publication-sample-findings.json").read_text())
    by_month = {p["month"]: p for p in prior}
    def bind(document):
        record = {"issuer_url": document["original_url"], "issuer_sha256": document["sha256"],
            "published_at": None, "state": "EXCHANGE_BINDING_UNPROVEN", "canonical_admitted": False}
        found = re.search(r"presentation-(\d{4})-?(\d{2})-?(\d{2})\.pdf$", document["original_url"])
        if not found: return record
        year, month, day = map(int, found.groups())
        label = f"{year:04d}-{month:02d}"
        # Filename date chooses a search window only; it never becomes publication.
        try:
            if label in by_month:
                p = by_month[label]
                if p["issuer_original_sha256"] != document["sha256"] or p.get("issuer_historical_table_exactly_bound") is not True:
                    raise ValueError("RETAINED_PUBLICATION_PROOF_HASH_MISMATCH")
                announcement = p["announcement"]
                record.update(published_at=datetime.strptime(announcement["exchdisstime"], "%d-%b-%Y %H:%M:%S").replace(tzinfo=timezone(timedelta(hours=5, minutes=30))).astimezone(timezone.utc).isoformat(),
                    exchange_original_sha256=p["nse_attachment_sha256"], announcement_api_sha256=p["announcement_api_sha256"],
                    exchange_url=announcement["attchmntFile"], state="REUSED_EXISTING_PUBLICATION_AND_PAGE_BINDING")
                return record
            url = f"https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=KARURVYSYA&from_date=01-{month:02d}-{year}&to_date={calendar.monthrange(year, month)[1]:02d}-{month:02d}-{year}"
            api_path = ROOT / ("nse-announcements-" + label + ".json")
            if not api_path.exists():
                with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.nseindia.com/"}), timeout=45) as response: api_path.write_bytes(response.read())
            raw = api_path.read_bytes(); data = json.loads(raw)
            matches = [a for a in data if a.get("symbol") == "KARURVYSYA" and ("presentation" in str(a.get("desc", "")).lower() or re.search(r"presentation|_ip_", str(a.get("attchmntFile", "")), re.I))]
            if len(matches) != 1:
                record.update(state="PRESENTATION_ANNOUNCEMENT_NOT_UNIQUE", matching_announcements=len(matches)); return record
            a = matches[0]; attachment = a.get("attchmntFile", "")
            if not attachment.startswith("https://nsearchives.nseindia.com/corporate/"):
                record["state"] = "ORIGINAL_EXCHANGE_ATTACHMENT_REQUIRED"; return record
            pdf = ROOT / ("exchange-" + Path(document["original_url"]).name)
            if not pdf.exists():
                with urllib.request.urlopen(urllib.request.Request(attachment, headers={"User-Agent": "Mozilla/5.0"}), timeout=45) as response: pdf.write_bytes(response.read())
            original = pdf.read_bytes()
            if not original.startswith(b"%PDF-"): raise ValueError("EXCHANGE_PDF_REQUIRED")
            subprocess.run(["pdftotext", "-layout", str(pdf), str(pdf.with_suffix(".txt"))], check=True, capture_output=True)
            issuer_text = Path(document["local_original"]).with_suffix(".txt").read_text()
            exchange_text = pdf.with_suffix(".txt").read_text()
            issuer_pages = issuer_text.split("\f")
            exchange_pages = exchange_text.split("\f")
            issuer_norm = compact(issuer_text)
            equal_text = any(compact("\f".join(exchange_pages[offset:])) == issuer_norm for offset in range(3))
            record.update(exchange_url=attachment, announcement_api_url=url,
                announcement_api_sha256=hashlib.sha256(raw).hexdigest(),
                exchange_original_sha256=hashlib.sha256(original).hexdigest(),
                source_identity_symbol=a["symbol"], observed_api_isin=a.get("sm_isin"),
                issuer_text_pages=len(issuer_pages)-1, exchange_text_pages=len(exchange_pages)-1,
                full_extracted_text_matches=equal_text, byte_identity_matches=original == Path(document["local_original"]).read_bytes(),
                exchange_published_at=datetime.strptime(a["exchdisstime"], "%d-%b-%Y %H:%M:%S").replace(tzinfo=timezone(timedelta(hours=5, minutes=30))).astimezone(timezone.utc).isoformat())
            if equal_text:
                published = datetime.strptime(a["exchdisstime"], "%d-%b-%Y %H:%M:%S").replace(tzinfo=timezone(timedelta(hours=5, minutes=30))).astimezone(timezone.utc)
                record.update(published_at=published.isoformat(), state="EXCHANGE_PUBLICATION_AND_EXTRACTED_TEXT_BOUND")
            else: record["state"] = "NSE_ORIGINAL_PUBLICATION_VERIFIED_ISSUER_VARIANT_UNBOUND"
            # The exchange API's obsolete ISIN is disclosed, never silently mapped.
        except Exception as error:
            record.update(state="SOURCE_BINDING_FAILED_NO_RETRY", error=type(error).__name__)
        return record
    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        rows = list(executor.map(bind, manifest["documents"]))
    report = {"documents": rows, "published_and_text_bound": sum(r["published_at"] is not None for r in rows),
        "official_exchange_original_publication_verified": sum(r["published_at"] is not None or r.get("exchange_published_at") is not None for r in rows),
        "expected_documents": len(rows), "canonical_admissions": 0, "paid_provider_calls": 0,
        "retries": 0, "elapsed_seconds": round(time.perf_counter() - started, 3)}
    (ROOT / "exchange-publication-binding.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "documents"}))
    print(json.dumps([{k: r[k] for k in ("issuer_url", "state", "published_at")} for r in rows]))

if __name__ == "__main__": main()
