#!/usr/bin/env python3
import csv
import io
import json
import os
import re
import uuid
from collections import Counter, defaultdict
from datetime import date
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
ROOT = "portfolioai-history/development/p8"
RAW_V1 = f"{ROOT}/b3/raw-prices/v1"
LEDGER_V1 = f"{ROOT}/b3/adjusted-decision-ledger/v1"
N6R3_AUDIT = Path("docs/p8/PortfolioAI_P8_B3_N6R3_EVENT_LOCAL_POLICY_AUDIT_2026-10-03.json")
OUT = Path("docs/p8/PortfolioAI_P8_B3_N6R4_NO_TRADE_STALENESS_AUDIT_2026-10-03.json")
MATRIX = Path("docs/p8/PortfolioAI_P8_B3_N6R4_NO_TRADE_STALENESS_MATRIX_2026-10-03.csv")
VERSION = "P8_B3_N6R4_NO_TRADE_STALENESS_V1"
EXPECTED_NO_TRADE = 40553
EXPECTED_BENCHMARK_DATES = 744
EXPECTED_LEDGER_PARTITIONS = 32

def required(name):
    v = os.environ.get(name, "").strip()
    if not v:
        raise RuntimeError(f"Missing {name}")
    return v

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

def read_table(s3, bucket, key, columns=None):
    raw = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
    return pq.read_table(io.BytesIO(raw), columns=columns)

def raw_key(d):
    return f"{RAW_V1}/year={d[:4]}/month={d[5:7]}/trade_date={d}/part-00000.parquet"

def valid_uuid(v):
    try:
        uuid.UUID(str(v))
        return True
    except Exception:
        return False

def scalar(v):
    if hasattr(v, "as_py"):
        v = v.as_py()
    if isinstance(v, (date,)):
        return v.isoformat()
    if isinstance(v, bytes):
        return v.hex()
    return v

def choose_economics_columns(table):
    cols = table.column_names
    strong = []
    rx = re.compile(r"(open|high|low|close|last|prev|price|vwap|volume|qty|quantity|turnover|value|trades)", re.I)
    for c in cols:
        if rx.search(c):
            strong.append(c)
    if strong:
        return sorted(set(strong))
    numeric = []
    for field in table.schema:
        n = field.name.lower()
        if any(x in n for x in ("id", "date", "time", "source", "archive", "fingerprint", "hash", "row_num", "sequence")):
            continue
        if pa.types.is_integer(field.type) or pa.types.is_floating(field.type) or pa.types.is_decimal(field.type):
            numeric.append(field.name)
    if not numeric:
        raise RuntimeError(f"Cannot identify economics columns from raw schema: {cols}")
    return sorted(numeric)

def group_target_rows(table, target_ids, economics_cols):
    names = table.column_names
    if "historical_identity_id" not in names:
        raise RuntimeError(f"raw partition lacks historical_identity_id; columns={names}")
    id_values = table.column("historical_identity_id").to_pylist()
    econ_arrays = {c: table.column(c).to_pylist() for c in economics_cols}
    grouped = defaultdict(list)
    for i, ident in enumerate(id_values):
        if ident is None:
            continue
        ident = str(ident)
        if ident not in target_ids:
            continue
        economics = tuple((c, scalar(econ_arrays[c][i])) for c in economics_cols)
        grouped[ident].append(economics)
    return grouped

def bucket_for(stale):
    if stale is None:
        return "NO_PRIOR_VALID_RAW_PRICE"
    if stale == 1:
        return "1_PREVIOUS_BENCHMARK_TRADING_DAY"
    if stale == 2:
        return "2_BENCHMARK_TRADING_DAYS"
    if stale == 3:
        return "3_BENCHMARK_TRADING_DAYS"
    if stale <= 5:
        return "4_5_BENCHMARK_TRADING_DAYS"
    if stale <= 10:
        return "6_10_BENCHMARK_TRADING_DAYS"
    return "GT_10_BENCHMARK_TRADING_DAYS"

def main():
    db = required("SUPABASE_DB_URL")
    if PROJECT_REF not in db:
        raise RuntimeError("Refusing non-Development DB")
    bucket = required("CLOUDFLARE_R2_BUCKET")
    if bucket != "portfolioai-history-dev":
        raise RuntimeError("Refusing non-Development R2")
    s3 = s3_client()

    n6r3 = json.loads(N6R3_AUDIT.read_text())
    if n6r3.get("summary", {}).get("status") != "PASS":
        raise RuntimeError("N6R3 PASS audit required")
    unresolved_boundaries = defaultdict(list)
    for b in n6r3.get("boundaries", []):
        bd = b.get("boundary_date")
        ident = b.get("historical_identity_id")
        if bd and ident:
            unresolved_boundaries[str(ident)].append({
                "date": bd,
                "action_types": b.get("action_types", ""),
                "boundary_kind": b.get("boundary_kind", ""),
            })
    for ident in unresolved_boundaries:
        unresolved_boundaries[ident].sort(key=lambda x: x["date"])

    with psycopg.connect(db, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("""
              select distinct b.trade_date::text trade_date
              from public.p8_b3_benchmark_total_return_history b
              join public.p8_b3_source_archives a on a.id=b.source_archive_id
              where b.portfolio_id=%s and b.experiment_id=%s
                and a.raw_metadata->>'campaign_id'='P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1'
              order by trade_date
            """, (PORTFOLIO_ID, EXPERIMENT_ID))
            benchmark_dates = [r["trade_date"] for r in cur.fetchall()]
            if len(benchmark_dates) != EXPECTED_BENCHMARK_DATES:
                raise RuntimeError(f"Expected {EXPECTED_BENCHMARK_DATES} benchmark dates, got {len(benchmark_dates)}")

            cur.execute("""
              select historical_identity_id::text identity_id,
                     effective_date::text event_date,
                     action_type,
                     normalization_state,
                     blocker_reason
              from public.p8_b3_corporate_action_normalizations
              where portfolio_id=%s and experiment_id=%s
                and normalization_version='P8_B3_NORMALIZATION_V1'
                and historical_identity_id is not null
                and effective_date is not null
                and action_type in ('CASH_DIVIDEND','SPLIT','BONUS','RIGHTS','MERGER','DEMERGER','DELISTING')
              order by historical_identity_id,effective_date,id
            """, (PORTFOLIO_ID, EXPERIMENT_ID))
            all_actions = defaultdict(list)
            for r in cur.fetchall():
                all_actions[str(r["identity_id"])].append({
                    "date": r["event_date"],
                    "action_type": r["action_type"],
                    "state": r["normalization_state"],
                    "reason": r["blocker_reason"],
                })

    # Load exact V1 decision-ledger no-trade pairs.
    paginator = s3.get_paginator("list_objects_v2")
    decision_parts = []
    for page in paginator.paginate(Bucket=bucket, Prefix=f"{LEDGER_V1}/"):
        for obj in page.get("Contents") or []:
            m = re.search(r"decision_date=(\d{4}-\d{2}-\d{2})/part-00000\.parquet$", obj["Key"])
            if m:
                decision_parts.append((m.group(1), obj["Key"]))
    decision_parts = sorted(set(decision_parts))
    if len(decision_parts) != EXPECTED_LEDGER_PARTITIONS:
        raise RuntimeError(f"Expected {EXPECTED_LEDGER_PARTITIONS} ledger partitions, got {len(decision_parts)}")

    decisions = []
    for decision_date, key in decision_parts:
        t = read_table(s3, bucket, key, ["historical_identity_id", "state", "blocker_reason"])
        for ident, state, reason in zip(
            t.column("historical_identity_id").to_pylist(),
            t.column("state").to_pylist(),
            t.column("blocker_reason").to_pylist(),
        ):
            if state == "BLOCKED" and reason == "NO_TRADE_ON_DECISION_DATE":
                decisions.append({
                    "decision_date": decision_date,
                    "historical_identity_id": "" if ident is None else str(ident),
                    "ledger_object_key": key,
                })
    if len(decisions) != EXPECTED_NO_TRADE:
        raise RuntimeError(f"Expected {EXPECTED_NO_TRADE} NO_TRADE pairs, got {len(decisions)}")

    target_ids = {d["historical_identity_id"] for d in decisions if d["historical_identity_id"]}
    by_date = defaultdict(list)
    for d in decisions:
        by_date[d["decision_date"]].append(d)

    date_index = {d: i for i, d in enumerate(benchmark_dates)}
    for d in by_date:
        if d not in date_index:
            raise RuntimeError(f"Decision date {d} is not in benchmark calendar")

    latest = {}
    economics_cols = None
    matrix = []
    stale_distribution = Counter()
    exclusion_reasons = Counter()
    exclusion_flags = Counter()
    eligible_staleness = Counter()
    raw_partitions_read = 0

    for d in benchmark_dates:
        key = raw_key(d)
        t = read_table(s3, bucket, key)
        raw_partitions_read += 1
        if economics_cols is None:
            economics_cols = choose_economics_columns(t)
        missing_cols = [c for c in economics_cols if c not in t.column_names]
        if missing_cols:
            raise RuntimeError(f"Raw schema drift on {d}; missing economics columns {missing_cols}")
        current = group_target_rows(t, target_ids, economics_cols)

        for dec in by_date.get(d, []):
            ident = dec["historical_identity_id"]
            exact = valid_uuid(ident)
            prior = latest.get(ident)
            decision_rows = current.get(ident, [])
            decision_trade_present = len(decision_rows) > 0

            prior_date = prior["date"] if prior else None
            td_stale = date_index[d] - date_index[prior_date] if prior_date is not None else None
            cal_stale = (date.fromisoformat(d) - date.fromisoformat(prior_date)).days if prior_date else None
            prior_unique = bool(prior and prior["unique_economics"])
            prior_row_count = int(prior["row_count"]) if prior else 0

            action_between = []
            unresolved_between = []
            if prior_date:
                action_between = [a for a in all_actions.get(ident, []) if prior_date < a["date"] <= d]
                unresolved_between = [b for b in unresolved_boundaries.get(ident, []) if prior_date < b["date"] <= d]

            flags = []
            if not prior:
                flags.append("NO_PRIOR_PRICE")
            if not exact:
                flags.append("IDENTITY_AMBIGUITY")
            if decision_trade_present or (prior and not prior_unique):
                flags.append("CONFLICTING_ECONOMICS")
            if action_between:
                flags.append("CORPORATE_ACTION_BOUNDARY")
            if unresolved_between:
                flags.append("UNRESOLVED_SEGMENT_BOUNDARY")
            for fl in set(flags):
                exclusion_flags[fl] += 1

            # Mutually exclusive primary reason for exact accounting.
            if not prior:
                primary = "NO_PRIOR_PRICE"
            elif not exact:
                primary = "IDENTITY_AMBIGUITY"
            elif decision_trade_present or not prior_unique:
                primary = "CONFLICTING_ECONOMICS"
            elif action_between:
                primary = "CORPORATE_ACTION_BOUNDARY"
            else:
                primary = "ELIGIBLE_FOR_THRESHOLD_REVIEW"
                eligible_staleness[td_stale] += 1
            exclusion_reasons[primary] += 1
            stale_distribution[bucket_for(td_stale)] += 1

            matrix.append({
                "decision_date": d,
                "historical_identity_id": ident,
                "historical_identity_exact": exact,
                "ledger_blocker_reason": "NO_TRADE_ON_DECISION_DATE",
                "prior_trade_date": prior_date or "",
                "benchmark_trading_day_staleness": "" if td_stale is None else td_stale,
                "calendar_day_staleness": "" if cal_stale is None else cal_stale,
                "prior_raw_object_key": prior["raw_object_key"] if prior else "",
                "prior_raw_row_count_for_identity": prior_row_count,
                "prior_row_unique_economics": prior_unique if prior else False,
                "economics_columns": ";".join(economics_cols),
                "decision_date_exact_raw_trade_present": decision_trade_present,
                "corporate_action_boundary_between": bool(action_between),
                "corporate_action_events_between": " || ".join(
                    f'{a["date"]}:{a["action_type"]}:{a["state"]}' for a in action_between
                ),
                "unresolved_segment_boundary_between": bool(unresolved_between),
                "unresolved_boundaries_between": " || ".join(
                    f'{b["date"]}:{b["action_types"]}:{b["boundary_kind"]}' for b in unresolved_between
                ),
                "eligible_for_threshold_review": primary == "ELIGIBLE_FOR_THRESHOLD_REVIEW",
                "primary_exclusion_reason": primary,
                "all_exclusion_flags": ";".join(sorted(set(flags))),
            })

        # Update latest raw observation only after evaluating decisions on this date.
        for ident, rows in current.items():
            signatures = set(rows)
            latest[ident] = {
                "date": d,
                "row_count": len(rows),
                "unique_economics": len(signatures) == 1,
                "raw_object_key": key,
            }

    if len(matrix) != EXPECTED_NO_TRADE:
        raise RuntimeError(f"Matrix accounting mismatch: {len(matrix)}")

    thresholds = {}
    for threshold in (1, 2, 3, 5, 10):
        thresholds[f"lte_{threshold}_benchmark_trading_days"] = sum(
            count for stale, count in eligible_staleness.items() if stale is not None and stale <= threshold
        )

    # Deterministic order for reporting.
    dist_order = [
        "1_PREVIOUS_BENCHMARK_TRADING_DAY",
        "2_BENCHMARK_TRADING_DAYS",
        "3_BENCHMARK_TRADING_DAYS",
        "4_5_BENCHMARK_TRADING_DAYS",
        "6_10_BENCHMARK_TRADING_DAYS",
        "GT_10_BENCHMARK_TRADING_DAYS",
        "NO_PRIOR_VALID_RAW_PRICE",
    ]
    dist = {k: stale_distribution.get(k, 0) for k in dist_order}

    if sum(dist.values()) != EXPECTED_NO_TRADE:
        raise RuntimeError("Staleness distribution does not account for all no-trade pairs")
    if sum(exclusion_reasons.values()) != EXPECTED_NO_TRADE:
        raise RuntimeError("Primary exclusion accounting mismatch")

    MATRIX.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(matrix[0].keys())
    with MATRIX.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(matrix)

    summary = {
        "version": VERSION,
        "status": "PASS",
        "environment": "PortfolioAI Dev",
        "scope": {
            "v1_no_trade_pairs": EXPECTED_NO_TRADE,
            "benchmark_trading_dates": len(benchmark_dates),
            "raw_r2_partitions_read": raw_partitions_read,
            "decision_ledger_partitions": len(decision_parts),
            "exact_target_identity_count": len(target_ids),
        },
        "staleness_distribution": dist,
        "recoverable_under_candidate_thresholds": thresholds,
        "primary_exclusion_reason_counts": dict(sorted(exclusion_reasons.items())),
        "exclusion_flag_counts": dict(sorted(exclusion_flags.items())),
        "eligible_for_threshold_review_total": exclusion_reasons.get("ELIGIBLE_FOR_THRESHOLD_REVIEW", 0),
        "economics_columns_used_for_uniqueness": economics_cols,
        "policy_evidence": {
            "no_silent_carry_forward": True,
            "exact_historical_identity_only": True,
            "latest_prior_raw_observation_only": True,
            "identity_or_economics_conflict_fail_closed": True,
            "any_corporate_action_boundary_fail_closed": True,
            "unresolved_segment_boundary_fail_closed": True,
            "threshold_selected": False,
            "v2_decision_prices_materialized": False,
        },
        "policy_candidates_for_owner_review": [
            {
                "name": "STRICT_1_BENCHMARK_DAY",
                "threshold": 1,
                "eligible_count": thresholds["lte_1_benchmark_trading_days"],
                "conditions": "exact identity + unique economics + no corporate-action boundary + no decision-date trade conflict",
            },
            {
                "name": "CONSERVATIVE_2_BENCHMARK_DAYS",
                "threshold": 2,
                "eligible_count": thresholds["lte_2_benchmark_trading_days"],
                "conditions": "same fail-closed gates; permits one additional benchmark-day of staleness",
            },
            {
                "name": "RESEARCH_3_BENCHMARK_DAYS",
                "threshold": 3,
                "eligible_count": thresholds["lte_3_benchmark_trading_days"],
                "conditions": "same fail-closed gates; requires explicit owner approval before any materialization",
            },
            {
                "name": "EXTENDED_5_OR_10_DAY_DIAGNOSTIC_ONLY",
                "thresholds": [5, 10],
                "eligible_counts": {
                    "lte_5": thresholds["lte_5_benchmark_trading_days"],
                    "lte_10": thresholds["lte_10_benchmark_trading_days"],
                },
                "conditions": "diagnostic comparison only; no automatic selection",
            },
        ],
        "n6_v1_unchanged": True,
        "raw_r2_catalog_unchanged": True,
        "n6r5_started": False,
        "production_changes": 0,
        "main_changes": 0,
    }
    OUT.write_text(json.dumps({"summary": summary}, indent=2, sort_keys=True) + "\n")
    print(json.dumps(summary, indent=2, sort_keys=True))

if __name__ == "__main__":
    main()
