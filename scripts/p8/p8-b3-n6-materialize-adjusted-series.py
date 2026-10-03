#!/usr/bin/env python3
import hashlib
import io
import json
import os
import re
from collections import defaultdict
from decimal import Decimal, Context, ROUND_HALF_EVEN, localcontext
from pathlib import Path

import boto3
import pyarrow as pa
import pyarrow.parquet as pq
import psycopg
from botocore.config import Config
from psycopg.rows import dict_row

PROJECT_REF = "lrgpjimipfkyoqbpsqzz"
PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
EXPERIMENT_ID = "P8_EXP_NSE_MONTHLY_6M_V1"
RAW_CAMPAIGN_ID = "P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1"
N6_CAMPAIGN_ID = "P8_B3_N6_R2_ADJUSTED_SERIES_20261003_V1"
NORMALIZATION_VERSION = "P8_B3_NORMALIZATION_V1"
ADJUSTMENT_VERSION = "P8_B3_ADJUSTMENT_V2"
ARITHMETIC_VERSION = "P8_B3_ARITHMETIC_V1"
N6_VERSION = "P8_B3_ADJUSTED_SERIES_R2_V1"
LEDGER_VERSION = "P8_B3_DECISION_LEDGER_R2_V1"
ROOT = "portfolioai-history/development/p8"
RAW_PREFIX = f"{ROOT}/b3/raw-prices/v1"
ADJ_PREFIX = f"{ROOT}/b3/adjusted-series/v1"
LEDGER_PREFIX = f"{ROOT}/b3/adjusted-decision-ledger/v1"
CATALOG_KEY = f"{ROOT}/catalog/v1/catalog.json"
COMPLETE_KEY = f"{ROOT}/manifests/v1/N6_COMPLETE.json"
CTX = Context(prec=50, rounding=ROUND_HALF_EVEN)
ZERO = Decimal("0")
ONE = Decimal("1")
TRI_BASE = Decimal("1000")

def required(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing {name}")
    return value

def normalize_account(raw):
    raw = raw.strip().rstrip("/")
    if "://" in raw:
        from urllib.parse import urlparse
        host = urlparse(raw).hostname or ""
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

def canonical_json(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

def sha256_bytes(value):
    return hashlib.sha256(value).hexdigest()

def sha256_json(value):
    return sha256_bytes(canonical_json(value).encode())

def deterministic_uuid(seed):
    h = hashlib.sha256(seed.encode()).hexdigest()
    variant = ("8", "9", "a", "b")[int(h[16], 16) % 4]
    return f"{h[:8]}-{h[8:12]}-5{h[13:16]}-{variant}{h[17:20]}-{h[20:32]}"

def dec(value):
    return Decimal(str(value))

def sig30(value):
    with localcontext(CTX):
        d = Decimal(str(value))
        if d == 0:
            return "0"
        adjusted = d.adjusted()
        quantum = Decimal(1).scaleb(adjusted - 29)
        q = d.quantize(quantum, rounding=ROUND_HALF_EVEN)
        return format(q.normalize(), "f")

def raw_key(date):
    return f"{RAW_PREFIX}/year={date[:4]}/month={date[5:7]}/trade_date={date}/part-00000.parquet"

def adj_key(date):
    return f"{ADJ_PREFIX}/year={date[:4]}/month={date[5:7]}/trade_date={date}/part-00000.parquet"

def adj_manifest_key(date):
    return f"{ADJ_PREFIX}/year={date[:4]}/month={date[5:7]}/trade_date={date}/manifest.json"

def ledger_key(date):
    return f"{LEDGER_PREFIX}/decision_date={date}/part-00000.parquet"

def ledger_manifest_key(date):
    return f"{LEDGER_PREFIX}/decision_date={date}/manifest.json"

def read_object(s3, bucket, key):
    return s3.get_object(Bucket=bucket, Key=key)["Body"].read()

def read_json(s3, bucket, key):
    raw = read_object(s3, bucket, key)
    return json.loads(raw), raw

def put_immutable(s3, bucket, key, data, content_type):
    digest = sha256_bytes(data)
    try:
        existing = read_object(s3, bucket, key)
    except s3.exceptions.NoSuchKey:
        existing = None
    except Exception as exc:
        code = getattr(exc, "response", {}).get("Error", {}).get("Code")
        if code in ("NoSuchKey", "404"):
            existing = None
        else:
            raise
    if existing is not None:
        if sha256_bytes(existing) != digest:
            raise RuntimeError(f"Immutable R2 object mismatch: {key}")
        return "UNCHANGED", digest, len(existing)
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
        Metadata={"sha256": digest, "n6-version": N6_VERSION},
    )
    check = read_object(s3, bucket, key)
    if sha256_bytes(check) != digest:
        raise RuntimeError(f"R2 read-back SHA mismatch: {key}")
    return "CREATED", digest, len(data)

def table_from_bytes(data):
    return pq.read_table(io.BytesIO(data))

def parquet_bytes(rows, schema):
    arrays = []
    for field in schema:
        values = [row.get(field.name) for row in rows]
        arrays.append(pa.array(values, type=field.type))
    table = pa.Table.from_arrays(arrays, schema=schema)
    out = io.BytesIO()
    pq.write_table(
        table,
        out,
        compression="zstd",
        compression_level=9,
        use_dictionary=True,
        write_statistics=True,
        version="2.6",
        data_page_version="2.0",
    )
    return out.getvalue()

ADJ_SCHEMA = pa.schema([
    ("id", pa.string()),
    ("raw_price_observation_id", pa.string()),
    ("historical_identity_id", pa.string()),
    ("trade_date", pa.string()),
    ("trading_symbol", pa.string()),
    ("series", pa.string()),
    ("adjustment_version", pa.string()),
    ("arithmetic_policy_version", pa.string()),
    ("series_state", pa.string()),
    ("cumulative_price_factor", pa.string()),
    ("adjusted_open", pa.string()),
    ("adjusted_high", pa.string()),
    ("adjusted_low", pa.string()),
    ("adjusted_close", pa.string()),
    ("daily_price_return", pa.string()),
    ("daily_total_return", pa.string()),
    ("total_return_index", pa.string()),
    ("blocker_reason", pa.string()),
    ("lineage_json", pa.string()),
    ("series_hash", pa.string()),
])

LEDGER_SCHEMA = pa.schema([
    ("id", pa.string()),
    ("decision_date", pa.string()),
    ("historical_identity_id", pa.string()),
    ("historical_isin", pa.string()),
    ("state", pa.string()),
    ("blocker_reason", pa.string()),
    ("adjusted_series_row_id", pa.string()),
    ("adjusted_close", pa.string()),
    ("total_return_index", pa.string()),
    ("lineage_json", pa.string()),
    ("row_hash", pa.string()),
])

def raw_rows(data, date):
    table = table_from_bytes(data)
    cols = set(table.column_names)
    required_cols = {
        "id","historical_identity_id","trading_symbol","series","open","high","low","close","row_hash"
    }
    missing = required_cols - cols
    if missing:
        raise RuntimeError(f"{date} raw partition missing {sorted(missing)}")
    rows = []
    for r in table.to_pylist():
        if r.get("historical_identity_id") is None:
            continue
        rows.append({
            "id": str(r["id"]),
            "historical_identity_id": str(r["historical_identity_id"]),
            "trading_symbol": str(r.get("trading_symbol") or "").strip().upper(),
            "series": str(r.get("series") or "").strip().upper(),
            "open": None if r.get("open") is None else str(r["open"]),
            "high": None if r.get("high") is None else str(r["high"]),
            "low": None if r.get("low") is None else str(r["low"]),
            "close": str(r["close"]),
            "row_hash": str(r["row_hash"]),
        })
    return rows

def load_b2_members(s3, bucket, date):
    key = f"{ROOT}/b2/universe-members/v1/decision_date={date}/part-00000.parquet"
    table = table_from_bytes(read_object(s3, bucket, key))
    cols = set(table.column_names)
    required_cols = {"historical_identity_id","membership_state"}
    if not required_cols.issubset(cols):
        raise RuntimeError(f"B2 {date} missing {sorted(required_cols-cols)}")
    return [
        str(r["historical_identity_id"])
        for r in table.to_pylist()
        if str(r.get("membership_state")) == "ELIGIBLE"
    ]

def source_isins(s3, bucket, date):
    prefix = f"{ROOT}/b3/source-authority/v1/content/trade_date={date}/"
    listing = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
    objs = listing.get("Contents") or []
    if len(objs) != 1:
        raise RuntimeError(f"Expected one canonical source-content object for {date}, got {len(objs)}")
    data = read_object(s3, bucket, objs[0]["Key"])
    text = data.decode("utf-8", errors="replace")
    return set(re.findall(r"\bIN[A-Z0-9]{10}\b", text)), objs[0]["Key"]

def action_state(cur):
    cur.execute(
        """
        select
          f.historical_identity_id::text as identity_id,
          f.effective_date::text as effective_date,
          f.factor_state,
          f.price_back_adjustment_factor::text as price_back_factor,
          f.cash_distribution_per_share::text as cash,
          f.total_return_link_factor::text as total_link,
          f.factor_hash,
          f.blocker_reason,
          n.action_type,
          n.normalization_state
        from public.p8_b3_adjustment_factors f
        join public.p8_b3_corporate_action_normalizations n
          on n.id=f.corporate_action_normalization_id
        where f.portfolio_id=%s
          and f.experiment_id=%s
          and f.adjustment_version=%s
        order by f.effective_date,f.id
        """,
        (PORTFOLIO_ID, EXPERIMENT_ID, ADJUSTMENT_VERSION),
    )
    factors = cur.fetchall()

    cur.execute(
        """
        select historical_identity_id::text as identity_id,
               action_type, blocker_reason
        from public.p8_b3_corporate_action_normalizations
        where portfolio_id=%s
          and experiment_id=%s
          and normalization_version=%s
          and normalization_state='BLOCKED'
          and historical_identity_id is not null
          and action_type in ('CASH_DIVIDEND','SPLIT','BONUS','RIGHTS','MERGER','DEMERGER','DELISTING')
        """,
        (PORTFOLIO_ID, EXPERIMENT_ID, NORMALIZATION_VERSION),
    )
    blocked_norms = cur.fetchall()

    price_events = defaultdict(lambda: defaultdict(list))
    dividends = defaultdict(lambda: defaultdict(list))
    blocked = defaultdict(set)
    same_day_types = defaultdict(lambda: defaultdict(set))
    factor_hashes = defaultdict(list)

    for row in factors:
        identity = row["identity_id"]
        factor_hashes[identity].append(row["factor_hash"])
        if row["factor_state"] == "BLOCKED":
            blocked[identity].add(f"FACTOR_BLOCKED:{row['blocker_reason']}")
            continue
        action = row["action_type"]
        date = row["effective_date"]
        same_day_types[identity][date].add(action)
        if action in ("SPLIT","BONUS"):
            if row["price_back_factor"] is None:
                raise RuntimeError(f"READY {action} factor missing price factor")
            price_events[date][identity].append(dec(row["price_back_factor"]))
        elif action == "CASH_DIVIDEND":
            if row["cash"] is None:
                raise RuntimeError("READY dividend missing cash")
            dividends[date][identity].append(dec(row["cash"]))
        else:
            raise RuntimeError(f"Unexpected READY N5 action in N6: {action}")

    for row in blocked_norms:
        blocked[row["identity_id"]].add(
            f"NORMALIZATION_BLOCKED:{row['action_type']}:{row['blocker_reason']}"
        )

    for identity, dates in same_day_types.items():
        for date, types in dates.items():
            if "CASH_DIVIDEND" in types and (("SPLIT" in types) or ("BONUS" in types)):
                blocked[identity].add(
                    f"SIMULTANEOUS_CAPITAL_ACTION_AND_DIVIDEND_UNAPPROVED:{date}"
                )

    schedule_hash = {
        identity: sha256_json(sorted(factor_hashes[identity]))
        for identity in factor_hashes
    }

    all_price_factor = defaultdict(lambda: ONE)
    for date, identities in price_events.items():
        for identity, factors_on_date in identities.items():
            with localcontext(CTX):
                product = ONE
                for factor in factors_on_date:
                    product *= factor
                all_price_factor[identity] *= product

    return price_events, dividends, blocked, schedule_hash, all_price_factor

def db_state(cur):
    cur.execute(
        """
        select distinct b.trade_date::text as trade_date
        from public.p8_b3_benchmark_total_return_history b
        join public.p8_b3_source_archives a on a.id=b.source_archive_id
        where b.portfolio_id=%s
          and b.experiment_id=%s
          and a.raw_metadata->>'campaign_id'=%s
        order by trade_date
        """,
        (PORTFOLIO_ID, EXPERIMENT_ID, RAW_CAMPAIGN_ID),
    )
    dates = [r["trade_date"] for r in cur.fetchall()]
    if len(dates) != 744:
        raise RuntimeError(f"Expected 744 raw trading dates, got {len(dates)}")

    cur.execute(
        """
        select id::text, historical_isin
        from public.p8_historical_security_identities
        where portfolio_id=%s and experiment_id=%s
        """,
        (PORTFOLIO_ID, EXPERIMENT_ID),
    )
    identity_isin = {
        r["id"]: str(r["historical_isin"] or "")
        for r in cur.fetchall()
    }

    cur.execute(
        """
        select count(*) as rows
        from public.p8_b3_adjusted_market_price_series
        where portfolio_id=%s and experiment_id=%s
        """,
        (PORTFOLIO_ID, EXPERIMENT_ID),
    )
    pg_rows = int(cur.fetchone()["rows"])
    if pg_rows != 0:
        raise RuntimeError("Legacy PostgreSQL adjusted-series compatibility table must remain empty")
    return dates, identity_isin, pg_rows

def main():
    db = required("SUPABASE_DB_URL")
    if PROJECT_REF not in db:
        raise RuntimeError("Refusing non-Development database")
    bucket = required("CLOUDFLARE_R2_BUCKET")
    if bucket != "portfolioai-history-dev":
        raise RuntimeError("Refusing non-Development R2 bucket")
    s3 = s3_client()

    catalog, catalog_raw = read_json(s3, bucket, CATALOG_KEY)
    raw_ds = catalog["datasets"]["b3_raw_prices"]
    if (
        int(raw_ds["partition_count"]) != 744
        or int(raw_ds["row_count"]) != 1854978
        or raw_ds["min_date"] != "2023-10-03"
        or raw_ds["max_date"] != "2026-09-30"
    ):
        raise RuntimeError("Raw R2 catalog drift")
    raw_catalog_dataset_fingerprint = sha256_json(raw_ds)

    with psycopg.connect(db, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            dates, identity_isin, pg_rows = db_state(cur)
            price_events, dividends, blocked_identity, schedule_hash, cumulative = action_state(cur)

    prev_adjusted = {}
    tri_state = {}
    runtime_blocked = defaultdict(set)
    adjusted_manifests = []
    adjusted_rows_total = 0
    adjusted_ready_total = 0
    adjusted_blocked_total = 0
    distinct_identities = set()
    created_objects = 0
    unchanged_objects = 0

    decision_dates = set()
    resp = s3.list_objects_v2(
        Bucket=bucket,
        Prefix=f"{ROOT}/b2/universe-members/v1/",
        MaxKeys=1000,
    )
    for obj in resp.get("Contents") or []:
        m = re.search(r"decision_date=(\d{4}-\d{2}-\d{2})/part-00000\.parquet$", obj["Key"])
        if m:
            decision_dates.add(m.group(1))
    decision_dates = sorted(decision_dates)
    if len(decision_dates) != 32:
        raise RuntimeError(f"Expected 32 B2 decision dates, got {len(decision_dates)}")

    decision_adjusted_cache = {}

    for date in dates:
        # Event-date prices are post-event, so remove that date's capital-action
        # factor before computing adjusted prices for the event date.
        for identity, factors_on_date in price_events.get(date, {}).items():
            with localcontext(CTX):
                for factor in factors_on_date:
                    cumulative[identity] = cumulative[identity] / factor

        raw_data = read_object(s3, bucket, raw_key(date))
        rows = raw_rows(raw_data, date)
        out_rows = []

        grouped_rows = defaultdict(list)
        for raw in rows:
            grouped_rows[raw["historical_identity_id"]].append(raw)

        for identity in sorted(grouped_rows):
            group = sorted(
                grouped_rows[identity],
                key=lambda r: (r["trading_symbol"], r["series"], r["raw_price_observation_id"] if "raw_price_observation_id" in r else r["id"]),
            )
            signatures = {
                (r["open"], r["high"], r["low"], r["close"])
                for r in group
            }
            if len(signatures) > 1:
                runtime_blocked[identity].add(
                    f"MULTIPLE_RAW_PRICE_ROWS_AMBIGUOUS:{date}"
                )

            distinct_identities.add(identity)
            blockers = sorted(
                set(blocked_identity.get(identity, set()))
                | set(runtime_blocked.get(identity, set()))
            )

            if blockers:
                blocker_reason = " | ".join(blockers)
                for raw in group:
                    lineage = {
                        "n6Version": N6_VERSION,
                        "campaignId": N6_CAMPAIGN_ID,
                        "rawPartitionKey": raw_key(date),
                        "rawPriceObservationId": raw["id"],
                        "rawRowHash": raw["row_hash"],
                        "factorScheduleHash": schedule_hash.get(identity),
                    }
                    logical = {
                        "rawPriceObservationId": raw["id"],
                        "historicalIdentityId": identity,
                        "tradeDate": date,
                        "adjustmentVersion": ADJUSTMENT_VERSION,
                        "seriesState": "BLOCKED",
                        "blockerReason": blocker_reason,
                        "lineage": lineage,
                    }
                    series_hash = sha256_json(logical)
                    row_id = deterministic_uuid(
                        f"P8_B3_SERIES|{raw['id']}|{ADJUSTMENT_VERSION}|{series_hash}"
                    )
                    out_rows.append({
                        "id": row_id,
                        "raw_price_observation_id": raw["id"],
                        "historical_identity_id": identity,
                        "trade_date": date,
                        "trading_symbol": raw["trading_symbol"],
                        "series": raw["series"],
                        "adjustment_version": ADJUSTMENT_VERSION,
                        "arithmetic_policy_version": ARITHMETIC_VERSION,
                        "series_state": "BLOCKED",
                        "cumulative_price_factor": None,
                        "adjusted_open": None,
                        "adjusted_high": None,
                        "adjusted_low": None,
                        "adjusted_close": None,
                        "daily_price_return": None,
                        "daily_total_return": None,
                        "total_return_index": None,
                        "blocker_reason": blocker_reason,
                        "lineage_json": canonical_json(lineage),
                        "series_hash": series_hash,
                    })
                    adjusted_blocked_total += 1
                continue

            representative = group[0]
            with localcontext(CTX):
                factor = cumulative.get(identity, ONE)
                open_v = None if representative["open"] is None else dec(representative["open"]) * factor
                high_v = None if representative["high"] is None else dec(representative["high"]) * factor
                low_v = None if representative["low"] is None else dec(representative["low"]) * factor
                close_v = dec(representative["close"]) * factor

                previous = prev_adjusted.get(identity)
                daily_price = None
                daily_total = None
                tri = TRI_BASE
                cash = sum(dividends.get(date, {}).get(identity, []), ZERO)

                if previous is not None:
                    if previous <= 0:
                        raise RuntimeError(f"Non-positive previous adjusted close for {identity}")
                    daily_price_d = close_v / previous - ONE
                    cash_adjusted = cash * factor
                    daily_total_d = (close_v + cash_adjusted) / previous - ONE
                    daily_price = sig30(daily_price_d)
                    daily_total = sig30(daily_total_d)
                    previous_tri = tri_state[identity]
                    tri = previous_tri * (ONE + daily_total_d)

                prev_adjusted[identity] = close_v
                tri_state[identity] = tri

                common_derived = {
                    "cumulative_price_factor": sig30(factor),
                    "adjusted_open": None if open_v is None else sig30(open_v),
                    "adjusted_high": None if high_v is None else sig30(high_v),
                    "adjusted_low": None if low_v is None else sig30(low_v),
                    "adjusted_close": sig30(close_v),
                    "daily_price_return": daily_price,
                    "daily_total_return": daily_total,
                    "total_return_index": sig30(tri),
                }

            for raw in group:
                lineage = {
                    "n6Version": N6_VERSION,
                    "campaignId": N6_CAMPAIGN_ID,
                    "rawPartitionKey": raw_key(date),
                    "rawPriceObservationId": raw["id"],
                    "rawRowHash": raw["row_hash"],
                    "factorScheduleHash": schedule_hash.get(identity),
                    "cumulativePriceFactor": common_derived["cumulative_price_factor"],
                    "cashDistributionPerShare": sig30(cash) if cash != 0 else "0",
                    "equivalentIdentityDateRowCount": len(group),
                }
                logical = {
                    "rawPriceObservationId": raw["id"],
                    "historicalIdentityId": identity,
                    "tradeDate": date,
                    "adjustmentVersion": ADJUSTMENT_VERSION,
                    "seriesState": "READY",
                    "cumulativePriceFactor": common_derived["cumulative_price_factor"],
                    "adjustedOpen": common_derived["adjusted_open"],
                    "adjustedHigh": common_derived["adjusted_high"],
                    "adjustedLow": common_derived["adjusted_low"],
                    "adjustedClose": common_derived["adjusted_close"],
                    "dailyPriceReturn": common_derived["daily_price_return"],
                    "dailyTotalReturn": common_derived["daily_total_return"],
                    "totalReturnIndex": common_derived["total_return_index"],
                    "lineage": lineage,
                }
                series_hash = sha256_json(logical)
                row_id = deterministic_uuid(
                    f"P8_B3_SERIES|{raw['id']}|{ADJUSTMENT_VERSION}|{series_hash}"
                )
                out_rows.append({
                    "id": row_id,
                    "raw_price_observation_id": raw["id"],
                    "historical_identity_id": identity,
                    "trade_date": date,
                    "trading_symbol": raw["trading_symbol"],
                    "series": raw["series"],
                    "adjustment_version": ADJUSTMENT_VERSION,
                    "arithmetic_policy_version": ARITHMETIC_VERSION,
                    "series_state": "READY",
                    "cumulative_price_factor": common_derived["cumulative_price_factor"],
                    "adjusted_open": common_derived["adjusted_open"],
                    "adjusted_high": common_derived["adjusted_high"],
                    "adjusted_low": common_derived["adjusted_low"],
                    "adjusted_close": common_derived["adjusted_close"],
                    "daily_price_return": common_derived["daily_price_return"],
                    "daily_total_return": common_derived["daily_total_return"],
                    "total_return_index": common_derived["total_return_index"],
                    "blocker_reason": None,
                    "lineage_json": canonical_json(lineage),
                    "series_hash": series_hash,
                })
                adjusted_ready_total += 1

        out_rows.sort(key=lambda r: (r["historical_identity_id"], r["trading_symbol"], r["series"], r["raw_price_observation_id"]))
        data = parquet_bytes(out_rows, ADJ_SCHEMA)
        state, parquet_sha, parquet_size = put_immutable(
            s3, bucket, adj_key(date), data, "application/vnd.apache.parquet"
        )
        created_objects += int(state == "CREATED")
        unchanged_objects += int(state == "UNCHANGED")

        normalized_fp = sha256_json([
            [r["id"], r["series_hash"], r["series_state"]]
            for r in out_rows
        ])
        manifest = {
            "version": N6_VERSION,
            "campaign_id": N6_CAMPAIGN_ID,
            "trade_date": date,
            "source_raw_partition_key": raw_key(date),
            "adjusted_partition_key": adj_key(date),
            "row_count": len(out_rows),
            "ready_rows": sum(r["series_state"] == "READY" for r in out_rows),
            "blocked_rows": sum(r["series_state"] == "BLOCKED" for r in out_rows),
            "parquet_sha256": parquet_sha,
            "parquet_bytes": parquet_size,
            "normalized_fingerprint_sha256": normalized_fp,
            "adjustment_version": ADJUSTMENT_VERSION,
            "arithmetic_policy_version": ARITHMETIC_VERSION,
        }
        manifest_data = (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode()
        state2, manifest_sha, _ = put_immutable(
            s3, bucket, adj_manifest_key(date), manifest_data, "application/json"
        )
        created_objects += int(state2 == "CREATED")
        unchanged_objects += int(state2 == "UNCHANGED")
        manifest["manifest_sha256"] = manifest_sha
        adjusted_manifests.append(manifest)
        adjusted_rows_total += len(out_rows)

        if date in decision_dates:
            decision_adjusted_cache[date] = out_rows

    if adjusted_rows_total != int(raw_ds["row_count"]):
        raise RuntimeError(
            f"Adjusted row count {adjusted_rows_total} != raw catalog {raw_ds['row_count']}"
        )

    ledger_manifests = []
    ledger_total = 0
    ledger_ready = 0
    ledger_blocked = 0
    blocker_counts = defaultdict(int)

    for date in decision_dates:
        eligible = sorted(load_b2_members(s3, bucket, date))
        adjusted = decision_adjusted_cache.get(date)
        if adjusted is None:
            raise RuntimeError(f"Decision-date adjusted partition missing from cache: {date}")
        by_identity = defaultdict(list)
        for row in adjusted:
            by_identity[row["historical_identity_id"]].append(row)
        source_set, source_key = source_isins(s3, bucket, date)
        ledger_rows = []

        for identity in eligible:
            isin = identity_isin.get(identity, "")
            candidates = by_identity.get(identity, [])
            state = "BLOCKED"
            blocker = None
            selected = None

            if candidates:
                signatures = {
                    (
                        r["series_state"],
                        r["adjusted_close"],
                        r["total_return_index"],
                        r["blocker_reason"],
                    )
                    for r in candidates
                }
                if len(signatures) == 1:
                    selected = sorted(candidates, key=lambda r: r["raw_price_observation_id"])[0]
                    if selected["series_state"] == "READY":
                        state = "READY"
                    else:
                        blocker = "COMPLEX_CORPORATE_ACTION_BLOCKER"
                else:
                    blocker = "MULTIPLE_RAW_PRICE_ROWS_AMBIGUOUS"
            else:
                if isin and isin in source_set:
                    blocker = "PRICE_IDENTITY_NOT_RESOLVED"
                else:
                    blocker = "NO_TRADE_ON_DECISION_DATE"

            lineage = {
                "ledgerVersion": LEDGER_VERSION,
                "decisionDate": date,
                "sourceContentKey": source_key,
                "adjustedPartitionKey": adj_key(date),
                "eligibleMembershipAuthority": f"{ROOT}/b2/universe-members/v1/decision_date={date}/part-00000.parquet",
            }
            logical = {
                "decisionDate": date,
                "historicalIdentityId": identity,
                "historicalIsin": isin or None,
                "state": state,
                "blockerReason": blocker,
                "adjustedSeriesRowId": selected["id"] if selected else None,
                "adjustedClose": selected["adjusted_close"] if state == "READY" and selected else None,
                "totalReturnIndex": selected["total_return_index"] if state == "READY" and selected else None,
                "lineage": lineage,
            }
            row_hash = sha256_json(logical)
            row_id = deterministic_uuid(
                f"P8_B3_DECISION|{date}|{identity}|{LEDGER_VERSION}|{row_hash}"
            )
            ledger_rows.append({
                "id": row_id,
                "decision_date": date,
                "historical_identity_id": identity,
                "historical_isin": isin or None,
                "state": state,
                "blocker_reason": blocker,
                "adjusted_series_row_id": selected["id"] if selected else None,
                "adjusted_close": selected["adjusted_close"] if state == "READY" and selected else None,
                "total_return_index": selected["total_return_index"] if state == "READY" and selected else None,
                "lineage_json": canonical_json(lineage),
                "row_hash": row_hash,
            })
            if state == "READY":
                ledger_ready += 1
            else:
                ledger_blocked += 1
                blocker_counts[blocker] += 1

        ledger_rows.sort(key=lambda r: r["historical_identity_id"])
        data = parquet_bytes(ledger_rows, LEDGER_SCHEMA)
        state1, parquet_sha, parquet_size = put_immutable(
            s3, bucket, ledger_key(date), data, "application/vnd.apache.parquet"
        )
        created_objects += int(state1 == "CREATED")
        unchanged_objects += int(state1 == "UNCHANGED")
        manifest = {
            "version": LEDGER_VERSION,
            "campaign_id": N6_CAMPAIGN_ID,
            "decision_date": date,
            "row_count": len(ledger_rows),
            "ready_rows": sum(r["state"] == "READY" for r in ledger_rows),
            "blocked_rows": sum(r["state"] == "BLOCKED" for r in ledger_rows),
            "parquet_sha256": parquet_sha,
            "parquet_bytes": parquet_size,
            "normalized_fingerprint_sha256": sha256_json(
                [[r["id"], r["row_hash"], r["state"]] for r in ledger_rows]
            ),
        }
        manifest_data = (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode()
        state2, manifest_sha, _ = put_immutable(
            s3, bucket, ledger_manifest_key(date), manifest_data, "application/json"
        )
        created_objects += int(state2 == "CREATED")
        unchanged_objects += int(state2 == "UNCHANGED")
        manifest["manifest_sha256"] = manifest_sha
        ledger_manifests.append(manifest)
        ledger_total += len(ledger_rows)

    if ledger_total != 121956:
        raise RuntimeError(f"Expected 121956 B2 eligible decision pairs, got {ledger_total}")

    adjusted_aggregate_fp = sha256_json([
        [m["trade_date"], m["row_count"], m["normalized_fingerprint_sha256"], m["parquet_sha256"]]
        for m in adjusted_manifests
    ])
    ledger_aggregate_fp = sha256_json([
        [m["decision_date"], m["row_count"], m["normalized_fingerprint_sha256"], m["parquet_sha256"]]
        for m in ledger_manifests
    ])

    completion = {
        "version": "P8_B3_N6_COMPLETION_MANIFEST_V1",
        "status": "PASS",
        "campaign_id": N6_CAMPAIGN_ID,
        "adjustment_version": ADJUSTMENT_VERSION,
        "arithmetic_policy_version": ARITHMETIC_VERSION,
        "raw_catalog_dataset_fingerprint": raw_catalog_dataset_fingerprint,
        "adjusted_series": {
            "row_count": adjusted_rows_total,
            "ready_rows": adjusted_ready_total,
            "blocked_rows": adjusted_blocked_total,
            "partition_count": len(adjusted_manifests),
            "min_date": dates[0],
            "max_date": dates[-1],
            "distinct_identities": len(distinct_identities),
            "aggregate_fingerprint_sha256": adjusted_aggregate_fp,
        },
        "decision_ledger": {
            "row_count": ledger_total,
            "ready_rows": ledger_ready,
            "blocked_rows": ledger_blocked,
            "partition_count": len(ledger_manifests),
            "min_date": decision_dates[0],
            "max_date": decision_dates[-1],
            "blocker_counts": dict(sorted(blocker_counts.items())),
            "aggregate_fingerprint_sha256": ledger_aggregate_fp,
        },
        "legacy_postgres_adjusted_series_rows": pg_rows,
        "production_changes": 0,
        "main_changes": 0,
    }
    completion["completion_fingerprint_sha256"] = sha256_json(completion)
    complete_data = (json.dumps(completion, indent=2, sort_keys=True) + "\n").encode()
    state3, complete_sha, _ = put_immutable(
        s3, bucket, COMPLETE_KEY, complete_data, "application/json"
    )
    created_objects += int(state3 == "CREATED")
    unchanged_objects += int(state3 == "UNCHANGED")

    # Catalog update is last. Preserve the raw dataset entry byte-for-byte logically.
    new_catalog = json.loads(json.dumps(catalog))
    new_catalog.setdefault("datasets", {})["b3_adjusted_series"] = {
        "version": N6_VERSION,
        "row_count": adjusted_rows_total,
        "ready_rows": adjusted_ready_total,
        "blocked_rows": adjusted_blocked_total,
        "partition_count": len(adjusted_manifests),
        "min_date": dates[0],
        "max_date": dates[-1],
        "adjustment_version": ADJUSTMENT_VERSION,
        "arithmetic_policy_version": ARITHMETIC_VERSION,
        "aggregate_fingerprint_sha256": adjusted_aggregate_fp,
        "completion_manifest_key": COMPLETE_KEY,
        "completion_manifest_sha256": complete_sha,
    }
    new_catalog["datasets"]["b3_adjusted_decision_ledger"] = {
        "version": LEDGER_VERSION,
        "row_count": ledger_total,
        "ready_rows": ledger_ready,
        "blocked_rows": ledger_blocked,
        "partition_count": len(ledger_manifests),
        "min_date": decision_dates[0],
        "max_date": decision_dates[-1],
        "aggregate_fingerprint_sha256": ledger_aggregate_fp,
        "completion_manifest_key": COMPLETE_KEY,
        "completion_manifest_sha256": complete_sha,
    }
    new_catalog["n6_status"] = "COMPLETE"
    new_catalog["n6_campaign_id"] = N6_CAMPAIGN_ID
    catalog_data = (json.dumps(new_catalog, indent=2, sort_keys=True) + "\n").encode()
    catalog_sha = sha256_bytes(catalog_data)
    s3.put_object(
        Bucket=bucket,
        Key=CATALOG_KEY,
        Body=catalog_data,
        ContentType="application/json",
        Metadata={
            "sha256": catalog_sha,
            "n6-status": "COMPLETE",
            "last-append-date": raw_ds["max_date"],
        },
    )
    check = read_object(s3, bucket, CATALOG_KEY)
    if sha256_bytes(check) != catalog_sha:
        raise RuntimeError("Catalog read-back SHA mismatch")
    if sha256_json(new_catalog["datasets"]["b3_raw_prices"]) != raw_catalog_dataset_fingerprint:
        raise RuntimeError("Raw catalog dataset entry drifted during N6")

    result = dict(completion)
    result.update({
        "status": "PASS",
        "created_objects": created_objects,
        "unchanged_objects": unchanged_objects,
        "completion_manifest_sha256": complete_sha,
        "catalog_sha256": catalog_sha,
    })
    result["audit_fingerprint_sha256"] = sha256_json(result)
    print(json.dumps(result, indent=2, sort_keys=True))

if __name__ == "__main__":
    main()
