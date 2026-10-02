#!/usr/bin/env python3
import csv
import hashlib
import io
import json
import os
import re
import tempfile
import urllib.parse
import zipfile
from datetime import datetime
from pathlib import Path

import boto3
import duckdb
import psycopg
from botocore.config import Config

PROJECT_REF = "lrgpjimipfkyoqbpsqzz"
PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
EXPERIMENT_ID = "P8_EXP_NSE_MONTHLY_6M_V1"
CAMPAIGN_ID = "P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1"
PLAN_HASH = "9367d9a55b5c7a6db176ef3e2b80da96cb97b3ac114f0ef884f124352a54919a"
ROOT = "portfolioai-history/development/p8"
SOURCE_PREFIX = f"{ROOT}/b3/source-authority/v1"
CANONICAL_PREFIX = f"{ROOT}/b3/raw-prices/v1"

RUNTIME_FIELDS = [
    "trade_date","exchange","trading_symbol","series","source_format",
    "previous_close","open","high","low","close","last_price",
    "volume","traded_value","trade_count",
]

def required(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value

def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()

def canonical_json(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

def deterministic_uuid(seed):
    h = sha256_bytes(seed.encode())
    variant = format((int(h[16], 16) & 0x3) | 0x8, "x")
    return (
        h[:8] + "-" + h[8:12] + "-5" + h[13:16] + "-" +
        variant + h[17:20] + "-" + h[20:32]
    )

def normalize_account(raw):
    raw = raw.strip().rstrip("/")
    if "://" in raw:
        host = urllib.parse.urlparse(raw).hostname or ""
    else:
        host = raw
    suffix = ".r2.cloudflarestorage.com"
    return host[:-len(suffix)] if host.endswith(suffix) else host

def s3_client():
    account = normalize_account(required("CLOUDFLARE_R2_ACCOUNT_ID"))
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=required("CLOUDFLARE_R2_ACCESS_KEY_ID"),
        aws_secret_access_key=required("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
        region_name="auto",
        config=Config(
            retries={"max_attempts": 10, "mode": "adaptive"},
            connect_timeout=30,
            read_timeout=180,
            s3={"addressing_style": "path"},
        ),
    )

def clean(value):
    return str(value or "").strip()

def normalize_date(value):
    raw = clean(value)
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
        return raw
    for fmt in ("%d-%b-%Y", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    raise RuntimeError(f"Unsupported embedded trade date: {raw}")

def decimal_text(value, label, nullable=True):
    text = clean(value).replace(",", "")
    if not text:
        if nullable:
            return None
        raise RuntimeError(f"{label} is required")
    if not re.fullmatch(r"-?\d+(?:\.\d+)?", text):
        raise RuntimeError(f"{label} is not canonical decimal: {text}")
    if float(text) < 0:
        raise RuntimeError(f"{label} must be non-negative")
    return text

def normalized_header(value):
    return re.sub(r"[ ._\-/()]+", "", clean(value).lstrip("\ufeff")).upper()

def pick(header_map, aliases, label, required_field=True):
    for alias in aliases:
        if alias in header_map:
            return header_map[alias]
    if required_field:
        raise RuntimeError(f"Missing {label} field")
    return None

def parse_csv(csv_bytes, date, source_format):
    text = csv_bytes.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    fields = reader.fieldnames or []
    header_map = {normalized_header(x): x for x in fields}
    legacy = source_format == "LEGACY_BHAVCOPY"
    if legacy:
        f = {
            "isin": pick(header_map, ["ISIN"], "ISIN"),
            "symbol": pick(header_map, ["SYMBOL"], "SYMBOL"),
            "series": pick(header_map, ["SERIES"], "SERIES"),
            "previous_close": pick(header_map, ["PREVCLOSE"], "PREVCLOSE"),
            "open": pick(header_map, ["OPEN"], "OPEN"),
            "high": pick(header_map, ["HIGH"], "HIGH"),
            "low": pick(header_map, ["LOW"], "LOW"),
            "close": pick(header_map, ["CLOSE"], "CLOSE"),
            "last_price": pick(header_map, ["LAST"], "LAST", False),
            "volume": pick(header_map, ["TOTTRDQTY"], "TOTTRDQTY", False),
            "traded_value": pick(header_map, ["TOTTRDVAL"], "TOTTRDVAL", False),
            "trade_count": pick(header_map, ["TOTALTRADES"], "TOTALTRADES", False),
            "date": pick(header_map, ["TIMESTAMP"], "TIMESTAMP"),
        }
    else:
        f = {
            "isin": pick(header_map, ["ISIN"], "ISIN"),
            "symbol": pick(header_map, ["TCKRSYMB","TCKRSYMBL","TCKRSYMBOL"], "ticker"),
            "series": pick(header_map, ["SCTYSRS"], "series"),
            "previous_close": pick(header_map, ["PRVSCLSGPRIC"], "previous close"),
            "open": pick(header_map, ["OPNPRIC"], "open"),
            "high": pick(header_map, ["HGHPRIC"], "high"),
            "low": pick(header_map, ["LWPRIC"], "low"),
            "close": pick(header_map, ["CLSPRIC"], "close"),
            "last_price": pick(header_map, ["LSTTRDDPRIC","LASTPRIC"], "last price", False),
            "volume": pick(header_map, ["TTLTRADGVOL"], "volume", False),
            "traded_value": pick(header_map, ["TTLTRADVAL","TTLTRADGVAL"], "value", False),
            "trade_count": pick(header_map, ["TTLNMBRTRADES","TTLTRADES"], "trades", False),
            "date": pick(header_map, ["TRADDT","TRADDATE"], "trade date"),
        }

    company_isin = re.compile(r"^IN[E9][A-Z0-9]{4}01[A-Z0-9]{3}$")
    out = []
    for source in reader:
        isin = clean(source.get(f["isin"]))
        if not company_isin.fullmatch(isin):
            continue
        embedded = normalize_date(source.get(f["date"]))
        if embedded != date:
            raise RuntimeError(f"Embedded date mismatch {embedded} != {date}")
        logical = {
            "historical_isin": isin,
            "trade_date": date,
            "exchange": "NSE",
            "trading_symbol": clean(source.get(f["symbol"])),
            "series": clean(source.get(f["series"])) or None,
            "source_format": source_format,
            "previous_close": decimal_text(source.get(f["previous_close"]), "previous_close"),
            "open": decimal_text(source.get(f["open"]), "open"),
            "high": decimal_text(source.get(f["high"]), "high"),
            "low": decimal_text(source.get(f["low"]), "low"),
            "close": decimal_text(source.get(f["close"]), "close", False),
            "last_price": decimal_text(source.get(f["last_price"]), "last_price") if f["last_price"] else None,
            "volume": decimal_text(source.get(f["volume"]), "volume") if f["volume"] else None,
            "traded_value": decimal_text(source.get(f["traded_value"]), "traded_value") if f["traded_value"] else None,
            "trade_count": decimal_text(source.get(f["trade_count"]), "trade_count") if f["trade_count"] else None,
        }
        if not logical["trading_symbol"]:
            raise RuntimeError(f"Missing symbol for {isin}")
        if logical["high"] is not None and logical["low"] is not None and float(logical["high"]) < float(logical["low"]):
            raise RuntimeError(f"High/low invariant failed for {isin}")
        out.append({**logical, "row_hash": sha256_bytes(canonical_json(logical).encode())})
    if not out:
        raise RuntimeError(f"No company-equity rows parsed for {date}")
    return out

def load_db_state(db_url, date):
    with psycopg.connect(db_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select id::text, source_kind, source_file_name, content_sha256,
                       compressed_sha256, archive_hash, retrieved_at::text, raw_metadata
                from public.p8_b3_source_archives
                where source_period_start=%s
                  and source_kind like 'NSE_CM_BHAVCOPY%%'
                  and raw_metadata->>'campaign_id'=%s
                order by created_at desc
                limit 1
                """,
                (date, CAMPAIGN_ID),
            )
            archive = cur.fetchone()
            if not archive:
                raise RuntimeError(f"No frozen-campaign archive metadata for {date}")
            cur.execute(
                """
                select id::text, historical_isin
                from public.p8_historical_security_identities
                where portfolio_id=%s and experiment_id=%s
                """,
                (PORTFOLIO_ID, EXPERIMENT_ID),
            )
            identities = cur.fetchall()
    by_isin = {}
    for identity_id, isin in identities:
        if isin in by_isin:
            raise RuntimeError(f"Duplicate historical ISIN {isin}")
        by_isin[isin] = identity_id
    return {
        "archive_id": archive[0],
        "source_kind": archive[1],
        "source_file_name": archive[2],
        "content_sha256": archive[3],
        "compressed_sha256": archive[4],
        "archive_hash": archive[5],
        "retrieved_at": archive[6],
        "raw_metadata": archive[7] or {},
        "identity_by_isin": by_isin,
    }

def load_source_csv(s3, bucket, date, state):
    member = state["raw_metadata"].get("csv_member")
    if member:
        content_key = f"{SOURCE_PREFIX}/content/trade_date={date}/{os.path.basename(member)}"
        try:
            obj = s3.get_object(Bucket=bucket, Key=content_key)
            data = obj["Body"].read()
            if sha256_bytes(data) != state["content_sha256"]:
                raise RuntimeError(f"R2 source content hash mismatch for {date}")
            return member, data, content_key
        except s3.exceptions.NoSuchKey:
            pass
        except s3.exceptions.ClientError as exc:
            code = str(exc.response.get("Error", {}).get("Code", ""))
            if code not in {"404","NoSuchKey","NotFound"}:
                raise

    zip_key = f"{SOURCE_PREFIX}/trade_date={date}/{state['source_file_name']}"
    zip_bytes = s3.get_object(Bucket=bucket, Key=zip_key)["Body"].read()
    if sha256_bytes(zip_bytes) != state["compressed_sha256"]:
        raise RuntimeError(f"R2 exact ZIP hash mismatch for {date}")
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        csv_members = [x for x in zf.namelist() if x.lower().endswith(".csv")]
        if not csv_members:
            raise RuntimeError(f"No CSV in source ZIP for {date}")
        chosen = next((x for x in csv_members if member and os.path.basename(x)==os.path.basename(member)), csv_members[0])
        data = zf.read(chosen)
    if sha256_bytes(data) != state["content_sha256"]:
        raise RuntimeError(f"Extracted source content hash mismatch for {date}")
    return chosen, data, zip_key

def materialize_rows(parsed, state):
    rows = []
    unknown = 0
    for row in parsed:
        identity_id = state["identity_by_isin"].get(row["historical_isin"])
        if not identity_id:
            unknown += 1
            continue
        row_hash = row["row_hash"]
        full = {
            "id": deterministic_uuid(
                f"{CAMPAIGN_ID}|price|{state['archive_id']}|{identity_id}|{row_hash}"
            ),
            "portfolio_id": PORTFOLIO_ID,
            "experiment_id": EXPERIMENT_ID,
            "historical_identity_id": identity_id,
            "source_archive_id": state["archive_id"],
            "trade_date": row["trade_date"],
            "exchange": row["exchange"],
            "trading_symbol": row["trading_symbol"],
            "series": row["series"],
            "source_format": row["source_format"],
            "previous_close": row["previous_close"],
            "open": row["open"],
            "high": row["high"],
            "low": row["low"],
            "close": row["close"],
            "last_price": row["last_price"],
            "volume": row["volume"],
            "traded_value": row["traded_value"],
            "trade_count": row["trade_count"],
            "row_hash": row_hash,
            "raw_metadata": canonical_json({
                "campaign_id": CAMPAIGN_ID,
                "historical_isin": row["historical_isin"],
                "plan_hash": PLAN_HASH,
            }),
        }
        rows.append(full)
    return rows, unknown

def normalized_fingerprint(rows):
    return sha256_bytes(
        "".join(canonical_json(row) + "\n" for row in sorted(rows, key=lambda x: x["id"])).encode()
    )

def validate_existing_partition(s3, bucket, date, rows):
    year, month = date[:4], date[5:7]
    key = f"{CANONICAL_PREFIX}/year={year}/month={month}/trade_date={date}/part-00000.parquet"
    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / "partition.parquet"
        path.write_bytes(s3.get_object(Bucket=bucket, Key=key)["Body"].read())
        con = duckdb.connect()
        try:
            result = con.execute(
                "select * exclude(created_at) from read_parquet(?) order by id",
                [str(path)],
            )
            names = [d[0] for d in result.description]
            existing = [dict(zip(names, record)) for record in result.fetchall()]
        finally:
            con.close()
    expected = sorted(rows, key=lambda x: x["id"])
    if len(existing) != len(expected):
        raise RuntimeError(f"Known-date row count mismatch {len(existing)} != {len(expected)}")
    for index, (left, right) in enumerate(zip(existing, expected)):
        for key_name in right:
            lv = left.get(key_name)
            rv = right.get(key_name)
            if key_name == "raw_metadata":
                try:
                    lv_norm = json.loads(lv) if isinstance(lv, str) else lv
                    rv_norm = json.loads(rv) if isinstance(rv, str) else rv
                except Exception as exc:
                    raise RuntimeError(
                        f"Known-date raw_metadata parse failure row={index}: {exc}"
                    ) from exc
                if lv_norm != rv_norm:
                    raise RuntimeError(
                        f"Known-date parity mismatch row={index} field={key_name}: "
                        f"{lv_norm!r} != {rv_norm!r}"
                    )
                continue
            if lv != rv:
                raise RuntimeError(
                    f"Known-date parity mismatch row={index} field={key_name}: {lv!r} != {rv!r}"
                )
    return {"key": key, "row_count": len(existing), "status": "PASS"}

def plan_date(s3, bucket, db_url, date, validate_existing=False):
    state = load_db_state(db_url, date)
    source_format = (
        "LEGACY_BHAVCOPY"
        if state["source_kind"] == "NSE_CM_BHAVCOPY_LEGACY"
        else "UDIFF_BHAVCOPY"
    )
    member, source_bytes, source_key = load_source_csv(s3, bucket, date, state)
    parsed = parse_csv(source_bytes, date, source_format)
    rows, unknown = materialize_rows(parsed, state)
    if not rows:
        raise RuntimeError(f"No identity-resolved rows for {date}")
    result = {
        "date": date,
        "source_key": source_key,
        "csv_member": member,
        "source_content_sha256": sha256_bytes(source_bytes),
        "source_rows": len(parsed),
        "resolved_rows": len(rows),
        "unknown_isin_rows": unknown,
        "normalized_fingerprint_sha256": normalized_fingerprint(rows),
        "canonical_partition_key":
            f"{CANONICAL_PREFIX}/year={date[:4]}/month={date[5:7]}/trade_date={date}/part-00000.parquet",
        "runtime_objects_touched":
            len({(row["trading_symbol"], row["series"] or "", date[:4]) for row in rows}),
    }
    if validate_existing:
        result["existing_partition_parity"] = validate_existing_partition(
            s3, bucket, date, rows
        )
    return result

def main():
    db_url = required("SUPABASE_DB_URL")
    if PROJECT_REF not in db_url:
        raise RuntimeError("Refusing non-Development database URL")
    bucket = required("CLOUDFLARE_R2_BUCKET")
    if bucket != "portfolioai-history-dev":
        raise RuntimeError("Refusing non-Development R2 bucket")
    s3 = s3_client()

    known = plan_date(s3, bucket, db_url, "2024-09-18", validate_existing=True)
    missing = plan_date(s3, bucket, db_url, "2024-09-19", validate_existing=False)

    output = {
        "version": "P8_B3_R2_APPEND_DRY_RUN_V1",
        "status": "PASS",
        "mutation": {
            "database_writes": 0,
            "r2_writes": 0,
            "provider_calls": 0,
        },
        "known_date_validation": known,
        "missing_day_241_plan": missing,
    }
    print(json.dumps(output, indent=2, sort_keys=True))

if __name__ == "__main__":
    main()
