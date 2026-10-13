"""Capture exact total fully-paid shares, not sums of nested shareholding rows.

The exchange master and original XML identities are preserved separately.
Revised filings use their actual later exchange availability, never filenames.
"""
import argparse
import concurrent.futures
import hashlib
import json
import re
import urllib.request
from datetime import datetime
from pathlib import Path
from xml.etree import ElementTree as ET
from zoneinfo import ZoneInfo

MASTER = "https://www.nseindia.com/api/corporate-share-holdings-master?index=equities&symbol=KARURVYSYA"
PERIODS = {"30-SEP-2021", "31-MAR-2022", "30-SEP-2022", "31-MAR-2023", "30-SEP-2023",
           "31-MAR-2024", "30-SEP-2024", "31-MAR-2025", "30-SEP-2025", "31-MAR-2026"}
XBRL = "{http://www.xbrl.org/2003/instance}"


def extract_total(raw, expected_date):
    if re.search(br"<!\s*(?:DOCTYPE|ENTITY)", raw, re.I): raise ValueError("XML_DECLARATIONS_NOT_ALLOWED")
    root = ET.fromstring(raw)
    local = lambda element: element.tag.split("}")[-1]
    def one(name, context=None):
        found = [e for e in root if local(e) == name and (context is None or e.get("contextRef") == context)]
        if len(found) != 1: raise ValueError("EXACT_XBRL_FACT_REQUIRED:" + name)
        return found[0]
    if one("Symbol").text != "KARURVYSYA" or one("ISIN").text != "INE036D01028":
        raise ValueError("ORIGINAL_EQUITY_IDENTITY_MISMATCH")
    if one("NameOfTheCompany").text.strip().lower() != "karur vysya bank limited": raise ValueError("ORIGINAL_ISSUER_MISMATCH")
    contexts = [e for e in root if local(e) == "context" and
                any(local(m) == "explicitMember" and (m.text or "").split(":")[-1] == "ShareholdingPatternMember"
                    for m in e.iter())]
    if len(contexts) != 1: raise ValueError("EXACT_TOTAL_SHAREHOLDING_CONTEXT_REQUIRED")
    context = contexts[0]
    context_id = context.get("id")
    if not context_id: raise ValueError("EXACT_TOTAL_CONTEXT_ID_REQUIRED")
    identifier = context.find(XBRL + "entity/" + XBRL + "identifier")
    instant = context.find(XBRL + "period/" + XBRL + "instant")
    if identifier is None or identifier.text != "KARURVYSYA" or instant is None or instant.text != expected_date:
        raise ValueError("SHARE_PERIOD_OR_ENTITY_MISMATCH")
    members = [e.text for e in context.iter() if local(e) == "explicitMember"]
    if len(members) != 1 or members[0].split(":")[-1] != "ShareholdingPatternMember":
        raise ValueError("TOTAL_CONTEXT_DIMENSIONS_INVALID")
    total = one("NumberOfFullyPaidUpEquityShares", context_id)
    partly = [e for e in root if local(e) == "NumberOfPartlyPaidUpEquityShares" and e.get("contextRef") == context_id]
    if len(partly) > 1: raise ValueError("PARTLY_PAID_SOURCE_CONFLICT")
    if partly:
        if partly[0].text != "0": raise ValueError("PARTLY_PAID_CAPITAL_REQUIRES_SEPARATE_RECONCILIATION")
        partly_proof = {"fact": "NumberOfPartlyPaidUpEquityShares", "context": context_id, "value": partly[0].text}
    else:
        declaration = one("WhetherTheListedEntityHasIssuedAnyPartlyPaidUpShares")
        if declaration.text != "false": raise ValueError("PARTLY_PAID_CAPITAL_REQUIRES_SEPARATE_RECONCILIATION")
        declaration_context = [e for e in root if local(e) == "context" and e.get("id") == declaration.get("contextRef")]
        if len(declaration_context) != 1: raise ValueError("PARTLY_PAID_DECLARATION_CONTEXT_REQUIRED")
        declaration_date = declaration_context[0].find(XBRL + "period/" + XBRL + "instant")
        if declaration_date is None or declaration_date.text != expected_date: raise ValueError("PARTLY_PAID_DECLARATION_PERIOD_MISMATCH")
        partly_proof = {"fact": "WhetherTheListedEntityHasIssuedAnyPartlyPaidUpShares", "context": declaration.get("contextRef"), "value": "false"}
    if total.get("unitRef") != "shares" or total.get("decimals") != "INF" or not re.fullmatch(r"[1-9]\d*", total.text or ""):
        raise ValueError("EXACT_FULLY_PAID_SHARE_COUNT_REQUIRED")
    return {"fully_paid_shares": total.text, "partly_paid_shares": partly[0].text if partly else None, "partly_paid_proof": partly_proof, "unit": "SHARES",
            "context": context_id, "period_end": expected_date, "original_isin": one("ISIN").text,
            "fact": "NumberOfFullyPaidUpEquityShares", "source_precision": "EXACT_INTEGER"}


def main():
    parser = argparse.ArgumentParser(); parser.add_argument("source_dir"); args = parser.parse_args()
    root = Path(args.source_dir); master = root / "nse-shareholding-master.json"
    rows = json.loads(master.read_text()); selected = [r for r in rows if r.get("date") in PERIODS and r.get("symbol") == "KARURVYSYA"]
    if len(selected) != len(PERIODS) or len({r["date"] for r in selected}) != len(PERIODS): raise ValueError("EXACT_PERIOD_SET_REQUIRED")
    def capture(row):
        downloads = 0
        try:
            day = datetime.strptime(row["date"], "%d-%b-%Y").date().isoformat()
            url = row["xbrl"]
            if not re.fullmatch(r"https://nsearchives\.nseindia\.com/corporate/xbrl/SHP_[A-Za-z0-9_]+\.xml", url):
                raise ValueError("OFFICIAL_XBRL_URL_REQUIRED")
            path = root / ("shareholding-" + day[:7] + ".xml")
            if path.exists(): raw = path.read_bytes()
            else:
                with urllib.request.urlopen(url, timeout=30) as response: raw = response.read(2 * 1024 * 1024 + 1)
                if len(raw) > 2 * 1024 * 1024: raise ValueError("XML_SIZE_LIMIT")
                path.write_bytes(raw); downloads = 1
            fact = extract_total(raw, day)
            dates = [datetime.strptime(row[field], "%d-%b-%Y %H:%M:%S").replace(tzinfo=ZoneInfo("Asia/Kolkata"))
                     for field in ("broadcastDate", "systemDate") if row.get(field)]
            if not dates: raise ValueError("EXCHANGE_AVAILABILITY_REQUIRED")
            return {**fact, "original_url": url, "original_sha256": hashlib.sha256(raw).hexdigest(), "original_bytes": len(raw),
                    "proven_availability_at": max(dates).isoformat(), "original_master_isin": row.get("isin"),
                    "publication_proof_url": MASTER, "publication_proof_sha256": hashlib.sha256(master.read_bytes()).hexdigest(),
                    "publication_entry": row, "source_downloads": downloads, "canonical_admitted": False,
                    "state": "EXACT_ORIGINAL_SHARE_COUNT_CAPTURED_NOT_ADMITTED"}
        except Exception as error: return {"period": row["date"], "state": "FAILED_NO_RETRY_OR_ADMISSION", "source_downloads": downloads, "error": str(error)}
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor: results = list(executor.map(capture, selected))
    report = {"documents": results, "provider_calls": 0, "source_downloads": sum(r["source_downloads"] for r in results), "canonical_admissions": 0}
    (root / "exact-share-counts.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({**{k: v for k, v in report.items() if k != "documents"},
                      "periods": [{k: v for k, v in r.items() if k in ("period_end", "fully_paid_shares", "proven_availability_at", "state", "error")} for r in results]}))


if __name__ == "__main__": main()
