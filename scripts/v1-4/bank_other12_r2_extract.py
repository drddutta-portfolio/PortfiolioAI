"""Read each shared Development monthly partition once for the other 12 banks.
No provider calls, R2 writes, denominator inference or canonical admission.
"""
import hashlib
import io
import json
import os
import re
from decimal import Decimal, InvalidOperation
from pathlib import Path

BASE = "portfolioai-history/development/p8/b3/adjusted-decision-ledger/v2/"
EARLIER = {m: "portfolioai-history/development/p8/b3/adjusted-series/v1/year=" + m[:4] + "/month=" + m[5:] + "/trade_date=" + d + "/part-00000.parquet" for m, d in {
    "2023-10": "2023-10-31", "2023-11": "2023-11-30", "2023-12": "2023-12-29", "2024-01": "2024-01-31"}.items()}

def monthly_keys(keys):
    candidates = {}
    for key in keys:
        found = re.search(r"decision_date=(\d{4}-\d{2}-\d{2})", key)
        if found:
            candidates.setdefault(found[1][:7], []).append((found[1], key))
    # Deterministic latest archived date. Conflicting same-date partitions block.
    result = dict(EARLIER)
    for month, values in candidates.items():
        latest = max(day for day, _ in values)
        matches = {key for day, key in values if day == latest}
        if len(matches) != 1:
            raise ValueError("AMBIGUOUS_MONTH_PARTITION:" + month)
        result[month] = matches.pop()
    return result

def exact_candidates(data, bank, month):
    names = set(data)
    identity = next((n for n in ("canonical_security_id", "security_id", "isin", "security_isin", "historical_isin", "canonical_link_symbol", "symbol", "trading_symbol") if n in names), None)
    if not identity:
        return {"state": "IDENTITY_SCHEMA_MISSING"}
    expected = bank["id"] if identity.endswith("security_id") else bank["isin"] if "isin" in identity else bank["symbol"]
    indices = [i for i, value in enumerate(data[identity]) if str(value).upper() == expected.upper()]
    if not indices:
        return {"state": "EXACT_IDENTITY_NOT_FOUND", "identity_column": identity, "identity_matches": 0}
    price_col = next((n for n in ("adjusted_close", "close", "raw_close", "price_close") if n in names), None)
    date_col = next((n for n in ("trade_date", "decision_date", "period_start") if n in names), None)
    if not price_col or not date_col:
        return {"state": "PRICE_OR_DATE_SCHEMA_MISSING"}
    values = {(str(data[date_col][i])[:10], str(data[price_col][i])) for i in indices}
    if len(values) != 1:
        return {"state": "DUPLICATE_OR_AMBIGUOUS_PRICE", "identity_matches": len(indices)}
    day, price = next(iter(values))
    if day[:7] != month:
        return {"state": "MONTH_MISMATCH"}
    try:
        number = Decimal(price)
        if not number.is_finite() or number <= 0:
            return {"state": "PRICE_INVALID"}
    except InvalidOperation:
        return {"state": "PRICE_INVALID"}
    return {"state": "PRICE_CANDIDATE_UNADMITTED", "identity_column": identity,
        "observed_identity": expected, "identity_matches": len(indices), "price_date": day,
        "price_column": price_col, "price_value": price, "corporate_action_basis": "NOT_QUALIFIED",
        "month_end_verified": False}

def main():
    import boto3
    import pyarrow.parquet as pq
    bucket = os.environ["CLOUDFLARE_R2_BUCKET"]
    account = os.environ["CLOUDFLARE_R2_ACCOUNT_ID"]
    assert bucket == "portfolioai-history-dev" and re.fullmatch(r"[a-f0-9]{32}", account)
    banks = json.loads(Path("scripts/v1-4/bank_other12_pit_identities.json").read_text())
    assert len(banks) == 12 and len({b["id"] for b in banks}) == 12 and all(b["symbol"] != "KARURVYSYA" for b in banks)
    s3 = boto3.client("s3", endpoint_url=f"https://{account}.r2.cloudflarestorage.com", region_name="auto")
    keys = [o["Key"] for page in s3.get_paginator("list_objects_v2").paginate(Bucket=bucket, Prefix=BASE) for o in page.get("Contents", []) if o["Key"].endswith("/part-00000.parquet")]
    available = monthly_keys(keys); rows = []; schemas = []; reads = 0
    for offset in range(36):
        number = 2023 * 12 + 9 + offset
        month = f"{number // 12:04d}-{number % 12 + 1:02d}"
        key = available.get(month)
        if key:
            raw = s3.get_object(Bucket=bucket, Key=key)["Body"].read(); reads += 1
            digest = hashlib.sha256(raw).hexdigest()
            table = pq.read_table(io.BytesIO(raw)); data = table.to_pydict()
            schemas.append({"month": month, "archive_key": key, "sha256": digest,
                "columns": table.column_names, "row_count": table.num_rows})
        for bank in banks:
            row = {"month": month, "security_id": bank["id"], "symbol": bank["symbol"],
                "archive_key": key, "pe_admitted": False, "pb_admitted": False}
            row.update(exact_candidates(data, bank, month) if key else {"state": "MONTH_PARTITION_MISSING"})
            if key: row["archive_sha256"] = digest
            rows.append(row)
    report = {"banks": 12, "months": 36, "shared_object_reads": reads,
        "provider_calls": 0, "r2_writes": 0, "canonical_admissions": 0,
        "per_bank_candidates": {b["symbol"]: sum(r["symbol"] == b["symbol"] and r["state"] == "PRICE_CANDIDATE_UNADMITTED" for r in rows) for b in banks},
        "rows": rows, "schemas": schemas}
    out = Path("bank-other12-r2-extraction"); out.mkdir(exist_ok=True)
    (out / "results.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k not in ("rows", "schemas")}))

if __name__ == "__main__": main()
