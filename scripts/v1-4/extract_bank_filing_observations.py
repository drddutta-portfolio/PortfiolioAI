"""Extract many literal facts once from hash-pinned retained bank filings.

Candidates only: no source registration, financial derivation, review or admission.
Availability is the retained exchange broadcast, never the board-meeting date.
"""
import argparse
import hashlib
import json
import re
import time
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from verify_bank_annual_roa_originals import Tables, unique_row

FACTS = {
    "Total interest earned": ("INTEREST_EARNED", "DOCUMENT_CURRENCY_SCALE"),
    "Interest expenses": ("INTEREST_EXPENSE", "DOCUMENT_CURRENCY_SCALE"),
    "Net profit (loss) for the period": ("NET_PROFIT", "DOCUMENT_CURRENCY_SCALE"),
    "Paid-up equity share capital": ("PAID_UP_EQUITY_CAPITAL", "DOCUMENT_CURRENCY_SCALE"),
    "Face value of equity share capital": ("FACE_VALUE", "CURRENCY_PER_SHARE"),
    "Basic earnings per share after extraordinary items": ("EPS_BASIC", "CURRENCY_PER_SHARE"),
    "Diluted earnings per share after extraordinary items": ("EPS_DILUTED", "CURRENCY_PER_SHARE"),
    "CET 1 ratio": ("CET1_RATIO", "PERCENT"),
    "Return on assets": ("ROA_REPORTED", "PERCENT"),
    "% of gross NPAs": ("GNPA_RATIO", "PERCENT"),
    "% of net NPAs": ("NNPA_RATIO", "PERCENT"),
}

def scalar(rows, label):
    found = {r[1] for r in rows if len(r) > 1 and r[0] == label}
    if len(found) != 1:
        raise ValueError("SCALAR_MISSING_OR_CONFLICTING:" + label)
    return found.pop()

def date(value):
    for fmt in ("%d-%m-%Y", "%d-%b-%Y"):
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            pass
    raise ValueError("INVALID_REPORTING_DATE:" + value)

def numeric(value):
    # Indian and international digit grouping are accepted only when well formed.
    value = value.strip()
    if value.startswith("(") and value.endswith(")"):
        value = "-" + value[1:-1]
    if not re.fullmatch(r"-?(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d+)?", value):
        raise ValueError("INVALID_NUMERIC_CELL")
    return str(Decimal(value.replace(",", "")))

def extract(rows, symbol):
    if scalar(rows, "NSE Symbol") != symbol:
        raise ValueError("SECURITY_IDENTITY_MISMATCH")
    starts = unique_row(rows, "Date of start of reporting period")
    ends = unique_row(rows, "Date of end of reporting period")
    scopes = unique_row(rows, "Nature of report standalone or consolidated")
    audits = unique_row(rows, "Whether results are audited or unaudited")
    currency = scalar(rows, "Description of presentation currency")
    scale = scalar(rows, "Level of rounding used in financial results")
    observations, gaps = [], []
    for label, (code, unit) in FACTS.items():
        matches = list({tuple(r): r for r in rows if len(r) >= 4 and r[1] == label}.values())
        if len(matches) != 1:
            gaps.append({"code": code, "reason": "MISSING_OR_CONFLICTING_LITERAL_ROW"})
            continue
        row = matches[0]
        for column in range(2, min(len(starts), len(ends), len(scopes), len(audits))):
            if column >= len(row) or not row[column].strip():
                gaps.append({"code": code, "column": column, "reason": "EMPTY_CELL"})
                continue
            try:
                start, end = date(starts[column]), date(ends[column])
                if start > end or scopes[column] not in ("Standalone", "Consolidated"):
                    raise ValueError("PERIOD_OR_SCOPE_INVALID")
                observations.append({"code": code, "value": numeric(row[column]),
                    "literal_value": row[column], "literal_label": label, "column": column,
                    "period_start": start, "period_end": end, "scope": scopes[column].upper(),
                    "audit_state": audits[column], "currency": currency, "unit": unit,
                    "document_scale": scale if unit == "DOCUMENT_CURRENCY_SCALE" else None,
                    "literal_row": row, "state": "EXTRACTED_NOT_ADMITTED"})
            except ValueError as error:
                gaps.append({"code": code, "column": column, "reason": str(error)})
    return observations, gaps

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest"); parser.add_argument("retained_dir"); parser.add_argument("output")
    args = parser.parse_args(); results = []; started = time.perf_counter()
    for bank in json.loads(Path(args.manifest).read_text()):
        for filing in bank["filings"]:
            record = {"symbol": bank["symbol"], "security_id": bank["security_id"],
                "source_record_id": bank["source_record_id"], "filing_id": filing["filingId"],
                "original_url": filing["originalUrl"], "original_sha256": filing["originalSha256"],
                "exchange_broadcast_literal": filing["broadcastDateLiteral"],
                "published_at": None, "canonical_admitted": False}
            try:
                path = Path(args.retained_dir) / (bank["symbol"] + "-" + filing["filingId"] + ".html")
                original = path.read_bytes()
                if hashlib.sha256(original).hexdigest() != filing["originalSha256"] or len(original) != filing["originalBytes"]:
                    raise ValueError("ORIGINAL_HASH_OR_LENGTH_MISMATCH")
                parsed = Tables(); parsed.feed(original.decode("utf-8"))
                record["observations"], record["gaps"] = extract(parsed.rows, bank["symbol"])
            except (OSError, ValueError) as error:
                record["error"] = str(error)
            results.append(record)
    report = {"documents_reused": len(results), "source_acquisitions": 0, "provider_calls": 0,
        "literal_observations": sum(len(r.get("observations", [])) for r in results),
        "canonical_admissions": 0, "elapsed_seconds": round(time.perf_counter() - started, 6), "documents": results}
    Path(args.output).write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "documents"}))

if __name__ == "__main__":
    main()
