#!/usr/bin/env python3
import concurrent.futures
import hashlib
import importlib.util
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import boto3
import duckdb

DATE = "2024-09-19"
BASELINE_ROWS = 532575
BASELINE_PARTITIONS = 240
BASELINE_RUNTIME_OBJECTS = 6135
ROOT = "portfolioai-history/development/p8"
CANONICAL_PREFIX = f"{ROOT}/b3/raw-prices/v1"
RUNTIME_PREFIX = f"{ROOT}/runtime/raw-prices/v1"
CATALOG_KEY = f"{ROOT}/catalog/v1/catalog.json"
APPEND_MANIFEST_KEY = f"{ROOT}/manifests/v1/APPEND_{DATE}.json"
APPEND_VERSION = "P8_R2_CANONICAL_APPEND_V1"

def load_contract():
    path = Path(__file__).with_name("p8-b3-r2-append-dry-run.py")
    spec = importlib.util.spec_from_file_location("p8_b3_r2_dry_run", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load R2 append contract module")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def canonical_json(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()

def upload_verified(s3, bucket, key, data, content_type, metadata=None):
    digest = sha256_bytes(data)
    try:
        existing = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
        if existing == data:
            return {"key": key, "bytes": len(data), "sha256": digest, "write": "UNCHANGED"}
    except s3.exceptions.ClientError as exc:
        code = str(exc.response.get("Error", {}).get("Code", ""))
        if code not in {"404", "NoSuchKey", "NotFound"}:
            raise
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
        Metadata={"sha256": digest, **(metadata or {})},
    )
    got = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
    if got != data or sha256_bytes(got) != digest:
        raise RuntimeError(f"R2 read-back mismatch for {key}")
    return {"key": key, "bytes": len(data), "sha256": digest, "write": "UPDATED"}

def get_json(s3, bucket, key):
    raw = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
    return json.loads(raw), raw

def parquet_bytes(rows, created_at):
    fields = [
        "id","portfolio_id","experiment_id","historical_identity_id",
        "source_archive_id","trade_date","exchange","trading_symbol","series",
        "source_format","previous_close","open","high","low","close","last_price",
        "volume","traded_value","trade_count","row_hash","raw_metadata","created_at",
    ]
    complete = []
    for row in rows:
        item = {k: row.get(k) for k in fields}
        item["created_at"] = created_at
        complete.append(item)
    complete.sort(key=lambda r: r["id"])
    with tempfile.TemporaryDirectory() as td:
        nd = Path(td) / "rows.ndjson"
        pq = Path(td) / "part-00000.parquet"
        with nd.open("w", encoding="utf-8") as fh:
            for row in complete:
                fh.write(canonical_json(row) + "\n")
        schema = "{" + ",".join("'" + key + "':'VARCHAR'" for key in fields) + "}"
        con = duckdb.connect()
        try:
            src = str(nd).replace("'", "''")
            dst = str(pq).replace("'", "''")
            con.execute(
                f"COPY (SELECT * FROM read_json_auto('{src}', format='newline_delimited', "
                f"columns={schema}) ORDER BY id) TO '{dst}' "
                "(FORMAT PARQUET, COMPRESSION ZSTD, PARQUET_VERSION 'V2')"
            )
            count = con.execute("select count(*) from read_parquet(?)", [str(pq)]).fetchone()[0]
        finally:
            con.close()
        if count != len(complete):
            raise RuntimeError(f"Parquet row count mismatch {count} != {len(complete)}")
        return pq.read_bytes(), complete

def row_runtime(row):
    return {k: row.get(k) for k in [
        "trade_date","exchange","trading_symbol","series","source_format",
        "previous_close","open","high","low","close","last_price",
        "volume","traded_value","trade_count",
    ]}

def runtime_key(row):
    series = row.get("series") or ""
    return (
        f"{RUNTIME_PREFIX}/year={DATE[:4]}/"
        f"series={quote(series, safe='')}/symbol={quote(row['trading_symbol'], safe='')}.json"
    )

def update_runtime_one(s3, bucket, row):
    key = runtime_key(row)
    runtime_row = row_runtime(row)
    created = False
    try:
        payload, _ = get_json(s3, bucket, key)
    except s3.exceptions.ClientError as exc:
        code = str(exc.response.get("Error", {}).get("Code", ""))
        if code not in {"404", "NoSuchKey", "NotFound"}:
            raise
        payload = {
            "version": "P8_RAW_PRICE_RUNTIME_V1",
            "symbol": row["trading_symbol"],
            "series": row.get("series"),
            "year": int(DATE[:4]),
            "row_count": 0,
            "min_trade_date": None,
            "max_trade_date": None,
            "rows": [],
        }
        created = True

    if payload.get("version") != "P8_RAW_PRICE_RUNTIME_V1":
        raise RuntimeError(f"Unexpected runtime version for {key}")
    if payload.get("symbol") != row["trading_symbol"] or (payload.get("series") or "") != (row.get("series") or ""):
        raise RuntimeError(f"Runtime identity mismatch for {key}")

    rows = list(payload.get("rows") or [])
    existing = [x for x in rows if x.get("trade_date") == DATE]
    if existing:
        if len(existing) != 1 or existing[0] != runtime_row:
            raise RuntimeError(f"Existing day-241 runtime row mismatch for {key}")
        return {"key": key, "created": False, "changed": False}

    rows.append(runtime_row)
    rows.sort(key=lambda x: (x.get("trade_date") or "", x.get("trading_symbol") or "", x.get("series") or ""))
    payload["rows"] = rows
    payload["row_count"] = len(rows)
    payload["min_trade_date"] = rows[0]["trade_date"]
    payload["max_trade_date"] = rows[-1]["trade_date"]
    data = (canonical_json(payload) + "\n").encode()
    upload_verified(
        s3, bucket, key, data, "application/json",
        {"append_version": APPEND_VERSION, "last_trade_date": DATE},
    )
    return {"key": key, "created": created, "changed": True}

def main():
    contract = load_contract()
    db_url = contract.required("SUPABASE_DB_URL")
    if contract.PROJECT_REF not in db_url:
        raise RuntimeError("Refusing non-Development database")
    bucket = contract.required("CLOUDFLARE_R2_BUCKET")
    if bucket != "portfolioai-history-dev":
        raise RuntimeError("Refusing non-Development R2 bucket")

    s3 = contract.s3_client()
    state = contract.load_db_state(db_url, DATE)
    member, source_bytes, source_key = contract.load_source_csv(s3, bucket, DATE, state)
    source_format = "LEGACY_BHAVCOPY" if state["source_kind"] == "NSE_CM_BHAVCOPY_LEGACY" else "UDIFF_BHAVCOPY"
    parsed = contract.parse_csv(source_bytes, DATE, source_format)
    rows, unknown = contract.materialize_rows(parsed, state)
    if unknown != 0 or len(rows) != 2371:
        raise RuntimeError(f"Day-241 contract mismatch resolved={len(rows)} unknown={unknown}")

    # Revalidate the preceding known date immediately before mutation.
    known = contract.plan_date(s3, bucket, db_url, "2024-09-18", validate_existing=True)
    if known["existing_partition_parity"]["status"] != "PASS":
        raise RuntimeError("Pre-write known-date parity did not pass")

    catalog, catalog_raw = get_json(s3, bucket, CATALOG_KEY)
    dataset = catalog.get("datasets", {}).get("b3_raw_prices")
    runtime = catalog.get("runtime", {}).get("raw_prices")
    if not dataset or not runtime:
        raise RuntimeError("Catalog is missing raw-price dataset/runtime contract")

    baseline_ok = (
        int(dataset.get("row_count", -1)) == BASELINE_ROWS
        and int(dataset.get("partition_count", -1)) == BASELINE_PARTITIONS
        and dataset.get("max_date") == "2024-09-18"
        and int(runtime.get("row_count", -1)) == BASELINE_ROWS
        and int(runtime.get("object_count", -1)) == BASELINE_RUNTIME_OBJECTS
    )
    already_appended = (
        int(dataset.get("row_count", -1)) == BASELINE_ROWS + len(rows)
        and int(dataset.get("partition_count", -1)) == BASELINE_PARTITIONS + 1
        and dataset.get("max_date") == DATE
        and int(runtime.get("row_count", -1)) == BASELINE_ROWS + len(rows)
    )
    if not baseline_ok and not already_appended:
        raise RuntimeError(
            "Catalog baseline is neither pre-append nor verified day-241 state: "
            + canonical_json({"dataset": dataset, "runtime": runtime})
        )

    created_at = state.get("retrieved_at") or datetime.now(timezone.utc).isoformat()
    pq_bytes, full_rows = parquet_bytes(rows, created_at)
    partition_key = f"{CANONICAL_PREFIX}/year=2024/month=09/trade_date={DATE}/part-00000.parquet"
    parquet_ev = upload_verified(
        s3, bucket, partition_key, pq_bytes, "application/octet-stream",
        {"append_version": APPEND_VERSION, "trade_date": DATE},
    )

    full_fingerprint = sha256_bytes(
        "".join(canonical_json(row) + "\n" for row in full_rows).encode()
    )
    partition_manifest = {
        "version": APPEND_VERSION,
        "status": "PASS",
        "table": "p8_b3_raw_market_price_observations",
        "dataset": "b3_raw_prices",
        "partition_date": DATE,
        "row_count": len(full_rows),
        "source_rows": len(parsed),
        "unknown_isin_rows": unknown,
        "source_content_sha256": sha256_bytes(source_bytes),
        "source_key": source_key,
        "csv_member": member,
        "normalized_fingerprint_sha256": full_fingerprint,
        "parquet": parquet_ev,
    }
    partition_manifest_bytes = (json.dumps(partition_manifest, indent=2, sort_keys=True) + "\n").encode()
    partition_manifest_key = f"{CANONICAL_PREFIX}/year=2024/month=09/trade_date={DATE}/manifest.json"
    partition_manifest_ev = upload_verified(
        s3, bucket, partition_manifest_key, partition_manifest_bytes, "application/json",
        {"append_version": APPEND_VERSION, "trade_date": DATE},
    )

    by_runtime = {}
    for row in rows:
        key = runtime_key(row)
        if key in by_runtime:
            raise RuntimeError(f"Multiple day-241 rows mapped to one runtime object: {key}")
        by_runtime[key] = row

    runtime_results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
        futures = [pool.submit(update_runtime_one, s3, bucket, row) for row in by_runtime.values()]
        for future in concurrent.futures.as_completed(futures):
            runtime_results.append(future.result())

    created_objects = sum(1 for x in runtime_results if x["created"])
    changed_objects = sum(1 for x in runtime_results if x["changed"])
    expected_runtime_object_count = BASELINE_RUNTIME_OBJECTS + created_objects

    # Verify every touched runtime object contains exactly the expected day row.
    for row in rows:
        payload, _ = get_json(s3, bucket, runtime_key(row))
        matches = [x for x in payload.get("rows", []) if x.get("trade_date") == DATE]
        if len(matches) != 1 or matches[0] != row_runtime(row):
            raise RuntimeError(f"Runtime read-back parity failed for {runtime_key(row)}")

    append_manifest = {
        "version": APPEND_VERSION,
        "status": "PASS",
        "environment": "DEVELOPMENT",
        "date": DATE,
        "campaign_id": contract.CAMPAIGN_ID,
        "plan_hash": contract.PLAN_HASH,
        "source_key": source_key,
        "source_content_sha256": sha256_bytes(source_bytes),
        "source_rows": len(parsed),
        "resolved_rows": len(rows),
        "unknown_isin_rows": unknown,
        "canonical_partition": partition_manifest_ev,
        "runtime_objects_touched": len(runtime_results),
        "runtime_objects_created": created_objects,
        "runtime_objects_changed": changed_objects,
        "prewrite_known_date_parity": known["existing_partition_parity"],
        "new_canonical_row_count": BASELINE_ROWS + len(rows),
        "new_partition_count": BASELINE_PARTITIONS + 1,
        "new_runtime_row_count": BASELINE_ROWS + len(rows),
        "new_runtime_object_count": expected_runtime_object_count,
        "database_writes": 0,
        "production_changes": 0,
    }
    append_bytes = (json.dumps(append_manifest, indent=2, sort_keys=True) + "\n").encode()
    append_ev = upload_verified(
        s3, bucket, APPEND_MANIFEST_KEY, append_bytes, "application/json",
        {"append_version": APPEND_VERSION, "trade_date": DATE},
    )

    # Catalog is updated last. If this fails, rerun is idempotent and finishes the catalog.
    catalog["datasets"]["b3_raw_prices"]["row_count"] = BASELINE_ROWS + len(rows)
    catalog["datasets"]["b3_raw_prices"]["partition_count"] = BASELINE_PARTITIONS + 1
    catalog["datasets"]["b3_raw_prices"]["max_date"] = DATE
    catalog["runtime"]["raw_prices"]["row_count"] = BASELINE_ROWS + len(rows)
    catalog["runtime"]["raw_prices"]["object_count"] = expected_runtime_object_count
    catalog["runtime"]["raw_prices"]["last_append_date"] = DATE
    catalog["runtime"]["raw_prices"]["last_append_manifest"] = APPEND_MANIFEST_KEY
    catalog["append_version"] = APPEND_VERSION
    catalog["last_append_manifest_sha256"] = append_ev["sha256"]
    catalog_bytes = (json.dumps(catalog, indent=2, sort_keys=True) + "\n").encode()
    catalog_ev = upload_verified(
        s3, bucket, CATALOG_KEY, catalog_bytes, "application/json",
        {"append_version": APPEND_VERSION, "last_append_date": DATE},
    )

    # Final catalog read-back assertions.
    final_catalog, _ = get_json(s3, bucket, CATALOG_KEY)
    fd = final_catalog["datasets"]["b3_raw_prices"]
    fr = final_catalog["runtime"]["raw_prices"]
    if (
        fd["row_count"] != BASELINE_ROWS + len(rows)
        or fd["partition_count"] != BASELINE_PARTITIONS + 1
        or fd["max_date"] != DATE
        or fr["row_count"] != BASELINE_ROWS + len(rows)
        or fr["object_count"] != expected_runtime_object_count
    ):
        raise RuntimeError("Final catalog verification failed")

    out = {
        "status": "PASS",
        "version": APPEND_VERSION,
        "date": DATE,
        "resolved_rows": len(rows),
        "unknown_isin_rows": unknown,
        "runtime_objects_touched": len(runtime_results),
        "runtime_objects_created": created_objects,
        "runtime_objects_changed": changed_objects,
        "canonical_rows_after": BASELINE_ROWS + len(rows),
        "canonical_partitions_after": BASELINE_PARTITIONS + 1,
        "runtime_objects_after": expected_runtime_object_count,
        "partition_manifest": partition_manifest_ev,
        "append_manifest": append_ev,
        "catalog": catalog_ev,
        "database_writes": 0,
        "production_changes": 0,
    }
    print(json.dumps(out, indent=2, sort_keys=True))

if __name__ == "__main__":
    main()
