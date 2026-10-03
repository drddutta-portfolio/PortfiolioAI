#!/usr/bin/env python3
import bisect
import hashlib
import json
import os
import tempfile
from collections import defaultdict
from decimal import Decimal, Context, ROUND_HALF_EVEN, localcontext
from functools import lru_cache
from pathlib import Path

import boto3
import duckdb
import psycopg
from botocore.config import Config
from psycopg.rows import dict_row

PROJECT_REF = "lrgpjimipfkyoqbpsqzz"
PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
EXPERIMENT_ID = "P8_EXP_NSE_MONTHLY_6M_V1"
RAW_CAMPAIGN_ID = "P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1"
FULL_CAMPAIGN_ID = "P8_B3_N4_N6_FULL_20261003_V1"
NORMALIZATION_VERSION = "P8_B3_NORMALIZATION_V1"
ADJUSTMENT_VERSION = "P8_B3_ADJUSTMENT_V2"
ARITHMETIC_VERSION = "P8_B3_ARITHMETIC_V1"
ROOT = "portfolioai-history/development/p8"
CTX = Context(prec=50, rounding=ROUND_HALF_EVEN)

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

def sha256_json(value):
    return hashlib.sha256(canonical_json(value).encode()).hexdigest()

def deterministic_uuid(seed):
    h = hashlib.sha256(seed.encode()).hexdigest()
    variant = ("8", "9", "a", "b")[int(h[16], 16) % 4]
    return f"{h[:8]}-{h[8:12]}-5{h[13:16]}-{variant}{h[17:20]}-{h[20:32]}"

def sig30(value):
    with localcontext(CTX):
        d = Decimal(str(value))
        if d == 0:
            return "0"
        adjusted = d.adjusted()
        quantum = Decimal(1).scaleb(adjusted - 29)
        q = d.quantize(quantum, rounding=ROUND_HALF_EVEN)
        return format(q.normalize(), "f")

def raw_partition_key(date):
    return (
        f"{ROOT}/b3/raw-prices/v1/year={date[:4]}/month={date[5:7]}/"
        f"trade_date={date}/part-00000.parquet"
    )

def load_partition(s3, bucket, date):
    key = raw_partition_key(date)
    data = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / "part.parquet"
        path.write_bytes(data)
        con = duckdb.connect()
        try:
            cols = [r[0] for r in con.execute(
                "describe select * from read_parquet(?)", [str(path)]
            ).fetchall()]
            required_cols = {
                "id","historical_identity_id","source_archive_id","trading_symbol","series",
                "source_format","previous_close","open","high","low","close","last_price",
                "volume","traded_value","trade_count","row_hash"
            }
            missing = required_cols - set(cols)
            if missing:
                raise RuntimeError(f"{date} missing raw columns {sorted(missing)}")
            rows = con.execute(
                """
                select id, historical_identity_id, source_archive_id, trading_symbol, series,
                       source_format, previous_close, open, high, low, close, last_price,
                       volume, traded_value, trade_count, row_hash
                from read_parquet(?)
                where historical_identity_id is not null
                """,
                [str(path)],
            ).fetchall()
        finally:
            con.close()
    grouped = defaultdict(list)
    for row in rows:
        (
            raw_id, identity_id, source_archive_id, trading_symbol, series,
            source_format, previous_close, open_value, high, low, close, last_price,
            volume, traded_value, trade_count, row_hash,
        ) = row
        identity_id = str(identity_id)
        canonical_key = (
            identity_id,
            str(trading_symbol or "").strip().upper(),
            str(series or "").strip().upper(),
        )
        economic = (
            str(source_format or ""),
            None if previous_close is None else str(previous_close),
            None if open_value is None else str(open_value),
            None if high is None else str(high),
            None if low is None else str(low),
            str(close),
            None if last_price is None else str(last_price),
            None if volume is None else str(volume),
            None if traded_value is None else str(traded_value),
            None if trade_count is None else str(trade_count),
        )
        grouped[canonical_key].append({
            "raw_price_observation_id": str(raw_id),
            "source_archive_id": str(source_archive_id),
            "row_hash": str(row_hash),
            "economic": economic,
            "close": str(close),
        })

    out = {}
    for canonical_key, candidates in grouped.items():
        unique_economics = {candidate["economic"] for candidate in candidates}
        if len(unique_economics) != 1:
            raise RuntimeError(
                f"{date} conflicting duplicate identity/symbol/series {canonical_key}: "
                f"{len(candidates)} rows / {len(unique_economics)} economic variants"
            )

        candidates.sort(key=lambda candidate: candidate["raw_price_observation_id"])
        chosen = candidates[0]
        out[canonical_key] = {
            "raw_price_observation_id": chosen["raw_price_observation_id"],
            "close": chosen["close"],
            "row_hash": chosen["row_hash"],
            "partition_key": key,
            "trading_symbol": canonical_key[1],
            "series": canonical_key[2],
            "equivalent_duplicate_count": len(candidates),
            "equivalent_raw_price_observation_ids": [
                candidate["raw_price_observation_id"] for candidate in candidates
            ],
            "equivalent_source_archive_ids": [
                candidate["source_archive_id"] for candidate in candidates
            ],
            "equivalent_row_hashes": [
                candidate["row_hash"] for candidate in candidates
            ],
        }
    return out

def build_factor(norm, benchmark_dates, load_date):
    action = norm["action_type"]
    identity = str(norm["historical_identity_id"])
    effective_date = str(norm["effective_date"])
    terms = norm["normalized_terms"]
    norm_id = str(norm["id"])
    raw_symbol = str(norm.get("raw_symbol") or "").strip().upper()
    raw_series = str(norm.get("raw_series") or "").strip().upper()

    factor_state = "READY"
    blocker = None
    share_factor = None
    price_back = None
    cash = None
    total_link = None
    reference_price = None
    inputs = {
        "campaignId": FULL_CAMPAIGN_ID,
        "arithmeticPolicyVersion": ARITHMETIC_VERSION,
        "normalizationHash": norm["normalization_hash"],
    }

    if action == "SPLIT":
        old = Decimal(str(terms["oldFaceValue"]))
        new = Decimal(str(terms["newFaceValue"]))
        if old <= 0 or new <= 0:
            raise RuntimeError(f"invalid split terms for {norm_id}")
        with localcontext(CTX):
            share_factor = sig30(old / new)
            price_back = sig30(new / old)

    elif action == "BONUS":
        bonus = Decimal(str(terms["bonusShares"]))
        held = Decimal(str(terms["heldShares"]))
        if bonus <= 0 or held <= 0:
            raise RuntimeError(f"invalid bonus terms for {norm_id}")
        with localcontext(CTX):
            share_factor = sig30((held + bonus) / held)
            price_back = sig30(held / (held + bonus))

    elif action == "RIGHTS":
        factor_state = "BLOCKED"
        blocker = (
            "RIGHTS: subscription terms are normalized, but deterministic "
            "rights-price treatment is not owner-approved"
        )

    elif action == "CASH_DIVIDEND":
        cash = str(terms["cashDistributionPerShare"])
        cash_d = Decimal(cash)
        if cash_d < 0:
            raise RuntimeError(f"negative cash dividend for {norm_id}")

        idx = bisect.bisect_left(benchmark_dates, effective_date)
        if idx >= len(benchmark_dates) or benchmark_dates[idx] != effective_date or idx == 0:
            factor_state = "BLOCKED"
            blocker = "DIVIDEND: effective date is not a proven raw-price trading date"
        else:
            previous_date = benchmark_dates[idx - 1]
            prev_rows = load_date(previous_date)
            ex_rows = load_date(effective_date)
            lookup_key = (identity, raw_symbol, raw_series)
            prev = prev_rows.get(lookup_key)
            ex = ex_rows.get(lookup_key)
            if prev is None or ex is None:
                factor_state = "BLOCKED"
                blocker = (
                    "DIVIDEND: exact historical-identity-bound previous/ex-date "
                    "R2 price pair unavailable"
                )
                inputs.update({
                    "previousTradeDate": previous_date,
                    "previousPartitionKey": raw_partition_key(previous_date),
                    "exPartitionKey": raw_partition_key(effective_date),
                    "previousIdentityRowPresent": prev is not None,
                    "exIdentityRowPresent": ex is not None,
                })
            else:
                previous_close = Decimal(prev["close"])
                ex_close = Decimal(ex["close"])
                if previous_close <= 0 or ex_close < 0:
                    factor_state = "BLOCKED"
                    blocker = "DIVIDEND: invalid previous/ex-date raw close"
                else:
                    reference_price = prev["close"]
                    with localcontext(CTX):
                        total_link = sig30((ex_close + cash_d) / previous_close)
                    inputs.update({
                        "previousTradeDate": previous_date,
                        "rawSymbol": raw_symbol,
                        "rawSeries": raw_series,
                        "previousClose": prev["close"],
                        "exDateClose": ex["close"],
                        "previousRawPriceObservationId": prev["raw_price_observation_id"],
                        "exRawPriceObservationId": ex["raw_price_observation_id"],
                        "previousRawRowHash": prev["row_hash"],
                        "exRawRowHash": ex["row_hash"],
                        "previousPartitionKey": prev["partition_key"],
                        "exPartitionKey": ex["partition_key"],
                        "previousEquivalentDuplicateCount": prev["equivalent_duplicate_count"],
                        "exEquivalentDuplicateCount": ex["equivalent_duplicate_count"],
                        "previousEquivalentRawPriceObservationIds": prev["equivalent_raw_price_observation_ids"],
                        "exEquivalentRawPriceObservationIds": ex["equivalent_raw_price_observation_ids"],
                        "previousEquivalentSourceArchiveIds": prev["equivalent_source_archive_ids"],
                        "exEquivalentSourceArchiveIds": ex["equivalent_source_archive_ids"],
                        "previousEquivalentRowHashes": prev["equivalent_row_hashes"],
                        "exEquivalentRowHashes": ex["equivalent_row_hashes"],
                    })
    else:
        raise RuntimeError(f"READY normalization has unsupported N5 action {action}: {norm_id}")

    logical = {
        "normalizationId": norm_id,
        "historicalIdentityId": identity,
        "effectiveDate": effective_date,
        "adjustmentVersion": ADJUSTMENT_VERSION,
        "factorState": factor_state,
        "shareFactor": share_factor,
        "priceBackAdjustmentFactor": price_back,
        "cashDistributionPerShare": cash,
        "totalReturnLinkFactor": total_link,
        "referencePrice": reference_price,
        "blockerReason": blocker,
        "calculationInputs": inputs,
    }
    factor_hash = sha256_json(logical)
    factor_id = deterministic_uuid(
        f"P8_B3_FACTOR|{norm_id}|{ADJUSTMENT_VERSION}|{factor_hash}"
    )
    return {
        "id": factor_id,
        "portfolio_id": PORTFOLIO_ID,
        "experiment_id": EXPERIMENT_ID,
        "historical_identity_id": identity,
        "corporate_action_normalization_id": norm_id,
        "effective_date": effective_date,
        "adjustment_version": ADJUSTMENT_VERSION,
        "factor_state": factor_state,
        "share_factor": share_factor,
        "price_back_adjustment_factor": price_back,
        "cash_distribution_per_share": cash,
        "total_return_link_factor": total_link,
        "reference_price": reference_price,
        "blocker_reason": blocker,
        "calculation_inputs": inputs,
        "factor_hash": factor_hash,
    }

def main():
    db = required("SUPABASE_DB_URL")
    if PROJECT_REF not in db:
        raise RuntimeError("Refusing non-Development database")
    bucket = required("CLOUDFLARE_R2_BUCKET")
    if bucket != "portfolioai-history-dev":
        raise RuntimeError("Refusing non-Development R2 bucket")
    s3 = s3_client()

    catalog = json.loads(
        s3.get_object(
            Bucket=bucket,
            Key=f"{ROOT}/catalog/v1/catalog.json",
        )["Body"].read()
    )
    raw_ds = catalog["datasets"]["b3_raw_prices"]
    if (
        int(raw_ds["partition_count"]) != 744
        or int(raw_ds["row_count"]) != 1854978
        or raw_ds["max_date"] != "2026-09-30"
    ):
        raise RuntimeError("Raw R2 catalog drift")

    with psycopg.connect(db, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
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
            benchmark_dates = [r["trade_date"] for r in cur.fetchall()]
            if len(benchmark_dates) != 744:
                raise RuntimeError(f"Expected 744 benchmark dates, got {len(benchmark_dates)}")

            cur.execute(
                """
                select
                  n.id::text,
                  n.historical_identity_id::text,
                  n.effective_date::text,
                  n.action_type,
                  n.normalized_terms,
                  n.normalization_hash,
                  o.raw_symbol,
                  o.raw_series
                from public.p8_b3_corporate_action_normalizations n
                join public.p8_b3_corporate_action_observations o
                  on o.id=n.corporate_action_observation_id
                join public.p8_b3_source_archives a
                  on a.id=o.source_archive_id
                where n.portfolio_id=%s
                  and n.experiment_id=%s
                  and n.normalization_version=%s
                  and n.normalization_state='READY'
                  and a.raw_metadata->>'campaign_id'=%s
                order by n.effective_date,n.id
                """,
                (PORTFOLIO_ID, EXPERIMENT_ID, NORMALIZATION_VERSION, RAW_CAMPAIGN_ID),
            )
            ready = cur.fetchall()
            if len(ready) != 4982:
                raise RuntimeError(f"Expected 4982 READY normalizations, got {len(ready)}")

            cur.execute(
                """
                select corporate_action_normalization_id::text as normalization_id,
                       count(*) as rows
                from public.p8_b3_adjustment_factors
                where portfolio_id=%s
                  and experiment_id=%s
                  and adjustment_version=%s
                group by corporate_action_normalization_id
                """,
                (PORTFOLIO_ID, EXPERIMENT_ID, ADJUSTMENT_VERSION),
            )
            existing_counts = {r["normalization_id"]: int(r["rows"]) for r in cur.fetchall()}
            duplicates = {k: v for k, v in existing_counts.items() if v > 1}
            if duplicates:
                raise RuntimeError(f"Duplicate existing factors: {list(duplicates.items())[:10]}")

            @lru_cache(maxsize=12)
            def load_date(date):
                return load_partition(s3, bucket, date)

            prepared = []
            skipped_existing = 0
            by_action = defaultdict(int)
            by_state = defaultdict(int)

            for norm in ready:
                norm_id = norm["id"]
                if norm_id in existing_counts:
                    skipped_existing += 1
                    continue
                factor = build_factor(norm, benchmark_dates, load_date)
                prepared.append(factor)
                by_action[norm["action_type"]] += 1
                by_state[factor["factor_state"]] += 1

            insert_sql = """
                insert into public.p8_b3_adjustment_factors (
                  id,portfolio_id,experiment_id,historical_identity_id,
                  corporate_action_normalization_id,effective_date,
                  adjustment_version,factor_state,share_factor,
                  price_back_adjustment_factor,cash_distribution_per_share,
                  total_return_link_factor,reference_price,blocker_reason,
                  calculation_inputs,factor_hash
                ) values (
                  %(id)s,%(portfolio_id)s,%(experiment_id)s,%(historical_identity_id)s,
                  %(corporate_action_normalization_id)s,%(effective_date)s::date,
                  %(adjustment_version)s,%(factor_state)s,%(share_factor)s,
                  %(price_back_adjustment_factor)s,%(cash_distribution_per_share)s,
                  %(total_return_link_factor)s,%(reference_price)s,%(blocker_reason)s,
                  %(calculation_inputs)s::jsonb,%(factor_hash)s
                )
                on conflict (
                  portfolio_id,experiment_id,corporate_action_normalization_id,
                  adjustment_version,factor_hash
                ) do nothing
                returning id
            """

            inserted = 0
            for factor in prepared:
                payload = dict(factor)
                payload["calculation_inputs"] = canonical_json(payload["calculation_inputs"])
                cur.execute(insert_sql, payload)
                if cur.fetchone():
                    inserted += 1
            conn.commit()

            cur.execute(
                """
                with ready_norm as (
                  select n.id
                  from public.p8_b3_corporate_action_normalizations n
                  join public.p8_b3_corporate_action_observations o
                    on o.id=n.corporate_action_observation_id
                  join public.p8_b3_source_archives a
                    on a.id=o.source_archive_id
                  where n.portfolio_id=%s
                    and n.experiment_id=%s
                    and n.normalization_version=%s
                    and n.normalization_state='READY'
                    and a.raw_metadata->>'campaign_id'=%s
                ),
                factor_counts as (
                  select f.corporate_action_normalization_id,count(*) as rows
                  from public.p8_b3_adjustment_factors f
                  join ready_norm r on r.id=f.corporate_action_normalization_id
                  where f.portfolio_id=%s
                    and f.experiment_id=%s
                    and f.adjustment_version=%s
                  group by f.corporate_action_normalization_id
                )
                select
                  (select count(*) from ready_norm) as ready_normalizations,
                  (select count(*) from factor_counts) as covered_normalizations,
                  (select count(*) from ready_norm r
                   where not exists (
                     select 1 from factor_counts f
                     where f.corporate_action_normalization_id=r.id
                   )) as missing,
                  (select count(*) from factor_counts where rows <> 1) as non_singleton
                """,
                (
                    PORTFOLIO_ID, EXPERIMENT_ID, NORMALIZATION_VERSION, RAW_CAMPAIGN_ID,
                    PORTFOLIO_ID, EXPERIMENT_ID, ADJUSTMENT_VERSION,
                ),
            )
            coverage = cur.fetchone()
            if (
                int(coverage["ready_normalizations"]) != 4982
                or int(coverage["covered_normalizations"]) != 4982
                or int(coverage["missing"]) != 0
                or int(coverage["non_singleton"]) != 0
            ):
                raise RuntimeError(f"N5 coverage failed: {coverage}")

            cur.execute(
                """
                select factor_state,count(*) as rows
                from public.p8_b3_adjustment_factors f
                join public.p8_b3_corporate_action_normalizations n
                  on n.id=f.corporate_action_normalization_id
                join public.p8_b3_corporate_action_observations o
                  on o.id=n.corporate_action_observation_id
                join public.p8_b3_source_archives a
                  on a.id=o.source_archive_id
                where n.portfolio_id=%s
                  and n.experiment_id=%s
                  and n.normalization_version=%s
                  and n.normalization_state='READY'
                  and f.adjustment_version=%s
                  and a.raw_metadata->>'campaign_id'=%s
                group by factor_state
                order by factor_state
                """,
                (
                    PORTFOLIO_ID, EXPERIMENT_ID, NORMALIZATION_VERSION,
                    ADJUSTMENT_VERSION, RAW_CAMPAIGN_ID,
                ),
            )
            state_counts = {r["factor_state"]: int(r["rows"]) for r in cur.fetchall()}

            cur.execute(
                """
                select count(*) as rows
                from public.p8_b3_adjusted_market_price_series
                where portfolio_id=%s and experiment_id=%s
                """,
                (PORTFOLIO_ID, EXPERIMENT_ID),
            )
            adjusted_rows = int(cur.fetchone()["rows"])
            if adjusted_rows != 0:
                raise RuntimeError("Legacy PostgreSQL adjusted-series table must remain empty")

    result = {
        "version": "P8_B3_N5_FULL_FACTOR_MATERIALIZATION_AUDIT_V1",
        "status": "PASS",
        "campaign_id": FULL_CAMPAIGN_ID,
        "normalization_version": NORMALIZATION_VERSION,
        "adjustment_version": ADJUSTMENT_VERSION,
        "arithmetic_policy_version": ARITHMETIC_VERSION,
        "ready_normalizations": 4982,
        "skipped_existing_factors": skipped_existing,
        "prepared_new_factors": len(prepared),
        "inserted_new_factors": inserted,
        "new_factor_actions": dict(sorted(by_action.items())),
        "new_factor_states": dict(sorted(by_state.items())),
        "final_ready_normalization_factor_states": state_counts,
        "coverage": {k: int(v) for k, v in coverage.items()},
        "raw_r2": {
            "rows": int(raw_ds["row_count"]),
            "partitions": int(raw_ds["partition_count"]),
            "min_date": raw_ds["min_date"],
            "max_date": raw_ds["max_date"],
        },
        "legacy_postgres_adjusted_series_rows": adjusted_rows,
        "production_changes": 0,
        "main_changes": 0,
    }
    result["audit_fingerprint_sha256"] = sha256_json(result)
    print(json.dumps(result, indent=2, sort_keys=True))

if __name__ == "__main__":
    main()
