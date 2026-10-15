#!/usr/bin/env python3
"""Read-only R3 BSE issuer-original discovery using vendored shared PortfolioBSE.

Only output discovery metadata and optional official PDF hashes. No DB writes.
Financial figures are NOT selected without downstream R4 source qualification.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from portfolio_bse import PortfolioBSE  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--targets", required=True,
                    help="Comma-separated SYMBOL:BSE_6_DIGIT_CODE pairs. Codes are candidates, not verified identities.")
    ap.add_argument("--from-date", required=True, type=date.fromisoformat)
    ap.add_argument("--to-date", required=True, type=date.fromisoformat)
    ap.add_argument("--max-pages", type=int, default=2)
    ap.add_argument("--pdf-hash-limit", type=int, default=0,
                    help="Optional bounded original-PDF fetches per stock. Bytes are NOT stored.")
    ap.add_argument("--out", default="tmp/results-r3-bse/discovery.json")
    args = ap.parse_args()
    if not 0 <= args.pdf_hash_limit <= 3:
        ap.error("pdf-hash-limit must be 0 through 3")
    target_specs = [p.strip().split(":") for p in args.targets.split(",") if p.strip()]
    if not 1 <= len(target_specs) <= 12 or any(len(p) != 2 for p in target_specs):
        ap.error("targets must be 1–12 SYMBOL:CODE pairs")
    seen: set[str] = set()
    output: list[dict] = []
    with PortfolioBSE() as bse:
        for sym, code in target_specs:
            if sym in seen:
                ap.error("duplicate symbol")
            seen.add(sym)
            try:
                result = bse.financial_announcements(
                    code, args.from_date, args.to_date, max_pages=args.max_pages
                )
                result["symbol_candidate"] = sym
                result["identity_status"] = "CANONICAL_ISIN_NOT_YET_VERIFIED"
                result["pdf_evidence"] = []
                downloaded: set[str] = set()
                for filing in result["results"]:
                    att = filing["attachment_name"]
                    if not att or att in downloaded or len(downloaded) >= args.pdf_hash_limit:
                        continue
                    downloaded.add(att)
                    try:
                        _, evidence = bse.retrieve_original_pdf(att)
                        result["pdf_evidence"].append(evidence)
                    except (FileNotFoundError, RuntimeError, OSError) as e:
                        result["pdf_evidence"].append({
                            "attachment_name": att, "error": str(e)[:150]
                        })
                result["status"] = "DISCOVERY_SUCCESS"
            except (ConnectionError, TimeoutError, RuntimeError, ValueError, OSError) as e:
                result = {
                    "symbol_candidate": sym, "bse_scrip_code": code,
                    "status": "SOURCE_FAILURE",
                    "error_type": type(e).__name__, "error": str(e)[:150],
                }
            output.append(result)
            print("R3_BSE_DISCOVERY=" + json.dumps({
                "symbol": sym,
                "status": result["status"],
                "filings": len(result.get("results", [])),
                "pdf_hashes": len([x for x in result.get("pdf_evidence", []) if x.get("sha256")]),
                "error": result.get("error"),
            }, sort_keys=True), flush=True)

    artifact = {
        "contract": "PORTFOLIOAI_R3_BSE_DISCOVERY_ONLY_V1",
        "qualification_status": "NOT_SELECTED_OR_PERSISTED",
        "source_library": "VENDORED_BSEINDIAAPI_3_3_3",
        "read_only": True,
        "window": [args.from_date.isoformat(), args.to_date.isoformat()],
        "targets": output,
    }
    path = Path(args.out)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(artifact, indent=2, sort_keys=True), encoding="utf-8")
    return 0 if any(x.get("status") == "DISCOVERY_SUCCESS" for x in output) else 2


if __name__ == "__main__":
    raise SystemExit(main())
