#!/usr/bin/env python3
"""Read-only R4 Results source-selection status for 262 equities x eight quarters.

R3 may remain incomplete. This reports qualified current and prior-year
source selections without treating unselected Trendlyne captures as original
issuer financials, inferring unavailable quarters, or modifying V1-4.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import date
from decimal import Decimal
import json
import os

import psycopg

EXPECTED_REF = "lrgpjimipfkyoqbpsqzz"
PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
HISTORICAL = ("2024-09-30", "2024-12-31", "2025-03-31", "2025-06-30")
DISPLAYED = ("2025-09-30", "2025-12-31", "2026-03-31", "2026-06-30")
PERIODS = HISTORICAL + DISPLAYED
BANKS = set("AUBANK AXISBANK BANDHANBNK BANKBARODA BANKINDIA CANBK FEDERALBNK HDFCBANK ICICIBANK IDBI IDFCFIRSTB INDIANB KARURVYSYA KOTAKBANK RBLBANK SBIN UNIONBANK".split())
INSURERS = {"STARHEALTH"}
PAT_EPS = {"NET_PROFIT_QUARTER", "EPS_DILUTED"}
METRICS = {"OPERATING_REVENUE_QUARTER", "NET_INTEREST_INCOME_QUARTER", "NET_PREMIUM_EARNED_QUARTER", *PAT_EPS}
VALID_SCOPES = {"CONSOLIDATED", "STANDALONE"}
VALID_CLASSIFICATIONS = {"QUALIFIED", "CONFLICT", "PARTIAL_SELECTED", "REVIEW_REQUIRED", "MISSING"}


def required_for(symbol: str) -> set[str]:
    metric = ("NET_PREMIUM_EARNED_QUARTER" if symbol in INSURERS else
              "NET_INTEREST_INCOME_QUARTER" if symbol in BANKS else
              "OPERATING_REVENUE_QUARTER")
    return PAT_EPS | {metric}


def field_eligible(r: dict) -> bool:
    return (
        r["source_code"] == "COMPANY_EXCHANGE_FILING"
        and r["evidence_status"] == "AVAILABLE"
        and r["currency"] == "INR"
        and r["numeric_value"] is not None
        and r["source_record_id"] is not None
        and r["consolidation_scope"] in VALID_SCOPES
        and r["unit"] == ("INR_PER_SHARE" if r["metric_code"] == "EPS_DILUTED" else "INR_CRORE")
        and r.get("period_start") is not None
        and 75 <= (date.fromisoformat(str(r["period_end"])) -
                   date.fromisoformat(str(r["period_start"]))).days <= 100
    )


def classify(symbol: str, selections: list[dict], observations: list[dict]) -> dict:
    core = required_for(symbol)
    groups = defaultdict(set)
    share_basis_warning = False
    for r in selections:
        if r["metric_code"] in core and field_eligible(r):
            key = (str(r["source_record_id"]), r["consolidation_scope"])
            groups[key].add(r["metric_code"])
            if "REPORTED_PRE_SPLIT_EPS_NOT_ADJUSTED" in (r.get("notes") or ""):
                share_basis_warning = True
    complete_groups = [key for key, metrics in groups.items() if core.issubset(metrics)]
    if complete_groups:
        scopes = {scope for _source, scope in complete_groups}
        preferred_scope = "CONSOLIDATED" if "CONSOLIDATED" in scopes else "STANDALONE"
        return {"status": "QUALIFIED", "reason": "SAME_SOURCE_SAME_SCOPE_CORE_TRIO",
                "complete_source_count": len(complete_groups),
                "preferred_scope": preferred_scope,
                "historical_eps_share_basis_guard": share_basis_warning}
    if selections:
        return {"status": "PARTIAL_SELECTED", "reason": "SELECTED_FACTS_NOT_ONE_QUALIFIED_SOURCE",
                "selected_fact_count": len(selections)}
    candidates = [r for r in observations if r["metric_code"] in core and field_eligible(r)]
    scoped = defaultdict(set)
    for r in candidates:
        scoped[(r["consolidation_scope"], r["metric_code"])].add(Decimal(str(r["numeric_value"])))
    if any(len(vals) > 1 for vals in scoped.values()):
        return {"status": "CONFLICT", "reason": "DIFFERENT_ORIGINAL_VALUES_SAME_SCOPE_METRIC"}
    if observations:
        return {"status": "REVIEW_REQUIRED", "reason": "ORIGINAL_QUARTER_NOT_SELECTED_OR_INCOMPLETE",
                "source_candidate_count": len({r["source_record_id"] for r in observations if r["source_record_id"]})}
    if symbol == "VAML":
        return {"status": "MISSING",
                "reason": "PRE_DEMERGER_ISSUER_QUARTER_OR_PRO_FORMA_BASIS_UNPROVEN",
                "not_applicable": "UNPROVEN",
                "historical_issuer_event": {
                    "type": "VEDANTA_RESULTING_COMPANY_DEMERGER",
                    "effective_date": "2026-05-01",
                    "original_issuer_release": "https://vedantaaluminium.com/media/press-releases/list/vedanta-fixes-1st-may-as-record-date-for-demerger-announces-share-allotment-details/",
                    "treatment": "PENDING_SEPARATE_ORIGINAL_OR_RECAST_FINANCIAL_EVIDENCE",
                    "pro_forma_not_inferred": True
                }}
    return {"status": "MISSING", "reason": "NO_ORIGINAL_SOURCE_QUARTER",
            "not_applicable": "UNPROVEN"}


def readback(db_url: str) -> dict:
    if EXPECTED_REF not in db_url:
        raise RuntimeError("NOT_DEVELOPMENT_DATABASE")
    with psycopg.connect(db_url, options="-c default_transaction_read_only=on") as db:
        with db.cursor() as cur:
            cur.execute("""
            SELECT DISTINCT s.id::text, s.symbol FROM public.transactions t
            JOIN public.securities s ON s.id=t.security_id
            WHERE t.portfolio_id=%s AND t.superseded_at IS NULL
              AND s.asset_class='EQUITY'
            ORDER BY s.symbol
            """, (PORTFOLIO_ID,))
            equities = cur.fetchall()
            cur.execute("""
            SELECT o.id::text,o.security_id::text,o.period_start::text,o.period_end::text,
                   o.metric_code,o.numeric_value::text,o.consolidation_scope,
                   o.source_record_id::text,o.source_code,o.evidence_status,
                   o.currency,o.unit,d.notes
            FROM public.fundamental_observation_decisions d
            JOIN public.fundamental_observations o ON o.id=d.selected_observation_id
            WHERE d.period_type='QUARTER'
              AND o.period_type='QUARTER'
              AND d.security_id=o.security_id
              AND d.period_end=o.period_end
              AND d.metric_code=o.metric_code
              AND d.consolidation_scope=o.consolidation_scope
              AND o.period_end=ANY(%s::date[])
              AND o.metric_code=ANY(%s::text[])
            """, (list(PERIODS), list(METRICS)))
            selected = cur.fetchall()
            cur.execute("""
            SELECT o.id::text,o.security_id::text,o.period_start::text,o.period_end::text,
                   o.metric_code,o.numeric_value::text,o.consolidation_scope,
                   o.source_record_id::text,o.source_code,o.evidence_status,
                   o.currency,o.unit,NULL::text AS notes
            FROM public.fundamental_observations o
            WHERE o.period_type='QUARTER'
              AND o.period_end=ANY(%s::date[])
              AND o.metric_code=ANY(%s::text[])
              AND o.source_code='COMPANY_EXCHANGE_FILING'
            """, (list(PERIODS), list(METRICS)))
            candidates = cur.fetchall()
    keys = ("id", "security_id", "period_start", "period_end",
            "metric_code", "numeric_value", "consolidation_scope",
            "source_record_id", "source_code", "evidence_status",
            "currency", "unit", "notes")
    selected_by_slot, candidates_by_slot = defaultdict(list), defaultdict(list)
    for target, rows in ((selected_by_slot, selected), (candidates_by_slot, candidates)):
        for row in rows:
            item = dict(zip(keys, row))
            target[(item["security_id"], item["period_end"])].append(item)
    details = []
    counts = Counter()
    period_counts = {p: Counter() for p in PERIODS}
    for security_id, symbol in equities:
        for end in PERIODS:
            summary = classify(symbol,
                selected_by_slot[(security_id, end)],
                candidates_by_slot[(security_id, end)])
            counts[summary["status"]] += 1
            period_counts[end][summary["status"]] += 1
            details.append({"symbol": symbol, "period_end": end,
                            "window": "DISPLAYED" if end in DISPLAYED else "PRIOR_YEAR",
                            **summary})
    qualified_equities = sum(
        all(x["status"] == "QUALIFIED" for x in details
            if x["symbol"] == symbol and x["period_end"] in DISPLAYED)
        for _id, symbol in equities
    )
    year_benchmark_pairs = {"2025-09-30": "2024-09-30", "2025-12-31": "2024-12-31",
                            "2026-03-31": "2025-03-31", "2026-06-30": "2025-06-30"}
    per_symbol_period = {(x["symbol"], x["period_end"]): x for x in details}
    same_source_period_yoy_candidates = [
        (symbol, period, baseline,
         per_symbol_period[(symbol, period)], per_symbol_period[(symbol, baseline)])
        for _,symbol in equities for period,baseline in year_benchmark_pairs.items()
        if per_symbol_period[(symbol,period)]["status"] == "QUALIFIED"
        and per_symbol_period[(symbol,baseline)]["status"] == "QUALIFIED"
    ]
    qualified_baseline_pairs = len(same_source_period_yoy_candidates)
    pair_reasons = Counter()
    potential_yoy_pairs = 0
    for symbol, period, baseline, now, old in same_source_period_yoy_candidates:
        if now["preferred_scope"] != old["preferred_scope"]:
            pair_reasons["CROSS_PERIOD_SCOPE_MISMATCH"] += 1
        elif (now.get("historical_eps_share_basis_guard", False)
              or old.get("historical_eps_share_basis_guard", False)):
            pair_reasons["PRE_SPLIT_EPS_BASIS_NOT_ADJUSTED"] += 1
        else:
            potential_yoy_pairs += 1
    pair_reasons["SAME_SCOPE_AND_NOT_EXPLICITLY_SPLIT_GUARDED"] = potential_yoy_pairs
    total = len(equities) * len(PERIODS)
    if len(equities) != 262 or len(details) != total:
        raise RuntimeError("R4_COHORT_OR_SLOT_CARDINALITY_MISMATCH")
    return {
        "contract": "RESULTS_R4_262_EQUITY_EIGHT_QUARTER_SOURCE_SELECTED_V1",
        "environment": "Development",
        "read_only": True,
        "r3_incomplete_does_not_block_readback": True,
        "equities": len(equities),
        "period_ends": PERIODS,
        "total_slots": total,
        "displayed_four_quarter_complete_equities": qualified_equities,
        "baseline_period_pairs_with_both_qualified": qualified_baseline_pairs,
        "potential_yoy_pairs_not_final_comparability": potential_yoy_pairs,
        "yoy_candidate_diagnostics": dict(sorted(pair_reasons.items())),
        "status_counts": dict(sorted(counts.items())),
        "by_period": {p:dict(sorted(period_counts[p].items())) for p in PERIODS},
        "unresolved": [item for item in details if item["status"] != "QUALIFIED"],
        "status": "PASS" if counts["QUALIFIED"] == total else "PARTIAL",
        "limitations": [
            "Missing issuer existence is UNPROVEN, never auto-mark NOT_APPLICABLE",
            "Potential YoY pairs require identical selected Consolidated/Standalone scope",
            "Potential YoY pairs are NOT comparable until publication/share-basis/identity checks",
            "Stored Trendlyne-only review captures never count as selected issuer originals",
            "R3 protected selections and V1-4 research remain unchanged"
        ]
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--strict", action="store_true",
                        help="fail if fewer than 2096 slots have qualified original-source trios")
    opts = parser.parse_args()
    report = readback(os.getenv("SUPABASE_DB_URL", ""))
    print(json.dumps(report, indent=2, sort_keys=True))
    os.makedirs("tmp/results-r4", exist_ok=True)
    with open("tmp/results-r4/eight-quarter-readback.json", "w") as file:
        json.dump(report, file, indent=2, sort_keys=True)
    return 0 if report["status"] == "PASS" or not opts.strict else 2


if __name__ == "__main__":
    raise SystemExit(main())
