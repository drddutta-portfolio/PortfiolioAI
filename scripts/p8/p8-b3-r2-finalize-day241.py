#!/usr/bin/env python3
import concurrent.futures
import importlib.util
import json
import os
import tempfile
from pathlib import Path

import duckdb

DATE = "2024-09-19"
BASELINE_ROWS = 532575
BASELINE_PARTITIONS = 240
BASELINE_RUNTIME_OBJECTS = 6135
EXPECTED_ROWS = 2371
ROOT = "portfolioai-history/development/p8"
CANONICAL_PREFIX = f"{ROOT}/b3/raw-prices/v1"
RUNTIME_PREFIX = f"{ROOT}/runtime/raw-prices/v1"
CATALOG_KEY = f"{ROOT}/catalog/v1/catalog.json"
APPEND_MANIFEST_KEY = f"{ROOT}/manifests/v1/APPEND_{DATE}.json"
APPEND_VERSION = "P8_R2_CANONICAL_APPEND_V1"

def load_module(filename, name):
    path = Path(__file__).with_name(filename)
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {filename}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def canonical_json(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

def put_immutable(module, s3, bucket, key, data, content_type, metadata):
    try:
        existing = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
        if existing != data:
            raise RuntimeError(f"Immutable object exists with different bytes: {key}")
        return {"key": key, "bytes": len(data), "sha256": module.sha256_bytes(data), "write": "UNCHANGED"}
    except s3.exceptions.ClientError as exc:
        code = str(exc.response.get("Error", {}).get("Code", ""))
        if code not in {"404","NoSuchKey","NotFound"}:
            raise
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
        Metadata={"sha256": module.sha256_bytes(data), **metadata},
    )
    got = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
    if got != data:
        raise RuntimeError(f"R2 immutable write/read-back mismatch: {key}")
    return {"key": key, "bytes": len(data), "sha256": module.sha256_bytes(data), "write": "UPDATED"}

def put_replace_verified(module, s3, bucket, key, data, content_type, metadata):
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
        Metadata={"sha256": module.sha256_bytes(data), **metadata},
    )
    got = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
    if got != data:
        raise RuntimeError(f"R2 replace/read-back mismatch: {key}")
    return {"key": key, "bytes": len(data), "sha256": module.sha256_bytes(data), "write": "UPDATED"}

def get_json(s3, bucket, key):
    raw = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
    return json.loads(raw), raw

def expected_rows(contract, s3, bucket, db_url):
    state = contract.load_db_state(db_url, DATE)
    member, source_bytes, source_key = contract.load_source_csv(s3, bucket, DATE, state)
    source_format = "LEGACY_BHAVCOPY" if state["source_kind"] == "NSE_CM_BHAVCOPY_LEGACY" else "UDIFF_BHAVCOPY"
    parsed = contract.parse_csv(source_bytes, DATE, source_format)
    rows, unknown = contract.materialize_rows(parsed, state)
    if len(rows) != EXPECTED_ROWS or unknown != 0:
        raise RuntimeError(f"Day-241 expected-row contract failed rows={len(rows)} unknown={unknown}")
    return state, member, source_bytes, source_key, parsed, rows

def verify_partition(contract, s3, bucket, rows):
    key = f"{CANONICAL_PREFIX}/year=2024/month=09/trade_date={DATE}/part-00000.parquet"
    data = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / "p.parquet"
        path.write_bytes(data)
        con = duckdb.connect()
        try:
            result = con.execute("select * exclude(created_at) from read_parquet(?) order by id", [str(path)])
            names = [d[0] for d in result.description]
            actual = [dict(zip(names, rec)) for rec in result.fetchall()]
        finally:
            con.close()
    expected = sorted(rows, key=lambda x: x["id"])
    if len(actual) != len(expected):
        raise RuntimeError(f"Day-241 parquet count mismatch {len(actual)} != {len(expected)}")
    for idx, (left, right) in enumerate(zip(actual, expected)):
        for field, rv in right.items():
            lv = left.get(field)
            if field == "raw_metadata":
                lv = json.loads(lv) if isinstance(lv, str) else lv
                rv = json.loads(rv) if isinstance(rv, str) else rv
            if lv != rv:
                raise RuntimeError(f"Day-241 parquet mismatch row={idx} field={field}: {lv!r} != {rv!r}")
    return {"key": key, "bytes": len(data), "sha256": contract.sha256_bytes(data), "row_count": len(actual), "status": "PASS"}

def verify_runtime_one(materializer, s3, bucket, row):
    key = materializer.runtime_key(row)
    payload, _ = materializer.get_json(s3, bucket, key)
    matches = [x for x in payload.get("rows", []) if x.get("trade_date") == DATE]
    expected = materializer.row_runtime(row)
    if len(matches) != 1 or matches[0] != expected:
        raise RuntimeError(f"Runtime day-241 mismatch for {key}")
    return key

def count_runtime_objects(s3, bucket):
    paginator = s3.get_paginator("list_objects_v2")
    count = 0
    for page in paginator.paginate(Bucket=bucket, Prefix=RUNTIME_PREFIX + "/"):
        count += len(page.get("Contents") or [])
    return count

def main():
    contract = load_module("p8-b3-r2-append-dry-run.py", "contract")
    materializer = load_module("p8-b3-r2-materialize-day241.py", "materializer")
    db_url = contract.required("SUPABASE_DB_URL")
    if contract.PROJECT_REF not in db_url:
        raise RuntimeError("Refusing non-Development database")
    bucket = contract.required("CLOUDFLARE_R2_BUCKET")
    if bucket != "portfolioai-history-dev":
        raise RuntimeError("Refusing non-Development R2 bucket")
    s3 = contract.s3_client()

    known = contract.plan_date(s3, bucket, db_url, "2024-09-18", validate_existing=True)
    if known["existing_partition_parity"]["status"] != "PASS":
        raise RuntimeError("Known-date parity gate failed")

    state, member, source_bytes, source_key, parsed, rows = expected_rows(contract, s3, bucket, db_url)
    partition = verify_partition(contract, s3, bucket, rows)

    with concurrent.futures.ThreadPoolExecutor(max_workers=32) as pool:
        futures = [pool.submit(verify_runtime_one, materializer, s3, bucket, row) for row in rows]
        verified = [f.result() for f in concurrent.futures.as_completed(futures)]
    if len(verified) != EXPECTED_ROWS:
        raise RuntimeError("Runtime verification count mismatch")

    runtime_object_count = count_runtime_objects(s3, bucket)
    if runtime_object_count < BASELINE_RUNTIME_OBJECTS:
        raise RuntimeError(f"Runtime object count regressed: {runtime_object_count}")
    created_objects = runtime_object_count - BASELINE_RUNTIME_OBJECTS

    partition_manifest_key = f"{CANONICAL_PREFIX}/year=2024/month=09/trade_date={DATE}/manifest.json"
    pm_raw = s3.get_object(Bucket=bucket, Key=partition_manifest_key)["Body"].read()
    pm = json.loads(pm_raw)
    if pm.get("status") != "PASS" or pm.get("row_count") != EXPECTED_ROWS:
        raise RuntimeError("Day-241 partition manifest invalid")
    partition_manifest_ev = {
        "key": partition_manifest_key,
        "bytes": len(pm_raw),
        "sha256": contract.sha256_bytes(pm_raw),
        "write": "UPDATED",
    }

    append_manifest = {
        "version": APPEND_VERSION,
        "status": "PASS",
        "environment": "DEVELOPMENT",
        "date": DATE,
        "campaign_id": contract.CAMPAIGN_ID,
        "plan_hash": contract.PLAN_HASH,
        "source_key": source_key,
        "source_content_sha256": contract.sha256_bytes(source_bytes),
        "source_rows": len(parsed),
        "resolved_rows": len(rows),
        "unknown_isin_rows": 0,
        "canonical_partition": partition_manifest_ev,
        "runtime_objects_touched": EXPECTED_ROWS,
        "runtime_objects_created": created_objects,
        "runtime_objects_changed": EXPECTED_ROWS,
        "prewrite_known_date_parity": known["existing_partition_parity"],
        "new_canonical_row_count": BASELINE_ROWS + EXPECTED_ROWS,
        "new_partition_count": BASELINE_PARTITIONS + 1,
        "new_runtime_row_count": BASELINE_ROWS + EXPECTED_ROWS,
        "new_runtime_object_count": runtime_object_count,
        "database_writes": 0,
        "production_changes": 0,
    }
    append_bytes = (json.dumps(append_manifest, indent=2, sort_keys=True) + "\n").encode()
    append_ev = put_immutable(
        contract, s3, bucket, APPEND_MANIFEST_KEY, append_bytes, "application/json",
        {"append_version": APPEND_VERSION, "trade_date": DATE},
    )

    catalog, _ = get_json(s3, bucket, CATALOG_KEY)
    dataset = catalog["datasets"]["b3_raw_prices"]
    runtime = catalog["runtime"]["raw_prices"]
    allowed_rows = {BASELINE_ROWS, BASELINE_ROWS + EXPECTED_ROWS}
    allowed_parts = {BASELINE_PARTITIONS, BASELINE_PARTITIONS + 1}
    if int(dataset.get("row_count", -1)) not in allowed_rows:
        raise RuntimeError("Unexpected catalog raw-price row baseline")
    if int(dataset.get("partition_count", -1)) not in allowed_parts:
        raise RuntimeError("Unexpected catalog partition baseline")
    if int(runtime.get("row_count", -1)) not in allowed_rows:
        raise RuntimeError("Unexpected catalog runtime-row baseline")

    dataset["row_count"] = BASELINE_ROWS + EXPECTED_ROWS
    dataset["partition_count"] = BASELINE_PARTITIONS + 1
    dataset["max_date"] = DATE
    runtime["row_count"] = BASELINE_ROWS + EXPECTED_ROWS
    runtime["object_count"] = runtime_object_count
    runtime["last_append_date"] = DATE
    runtime["last_append_manifest"] = APPEND_MANIFEST_KEY
    catalog["append_version"] = APPEND_VERSION
    catalog["last_append_manifest_sha256"] = append_ev["sha256"]
    catalog_bytes = (json.dumps(catalog, indent=2, sort_keys=True) + "\n").encode()
    catalog_ev = put_replace_verified(
        contract, s3, bucket, CATALOG_KEY, catalog_bytes, "application/json",
        {"append_version": APPEND_VERSION, "last_append_date": DATE},
    )

    final_catalog, _ = get_json(s3, bucket, CATALOG_KEY)
    fd = final_catalog["datasets"]["b3_raw_prices"]
    fr = final_catalog["runtime"]["raw_prices"]
    if (
        fd["row_count"] != BASELINE_ROWS + EXPECTED_ROWS or
        fd["partition_count"] != BASELINE_PARTITIONS + 1 or
        fd["max_date"] != DATE or
        fr["row_count"] != BASELINE_ROWS + EXPECTED_ROWS or
        fr["object_count"] != runtime_object_count
    ):
        raise RuntimeError("Final catalog verification failed")

    print(json.dumps({
        "status":"PASS",
        "version":"P8_B3_DAY241_FINALIZER_V1",
        "date":DATE,
        "partition":partition,
        "runtime_rows_verified":len(verified),
        "runtime_objects_after":runtime_object_count,
        "runtime_objects_created":created_objects,
        "append_manifest":append_ev,
        "catalog":catalog_ev,
        "database_writes":0,
        "production_changes":0,
    }, indent=2, sort_keys=True))

if __name__ == "__main__":
    main()
