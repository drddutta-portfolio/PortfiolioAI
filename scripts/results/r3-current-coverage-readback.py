#!/usr/bin/env python3
"""Read-only Results R3 fixed-window acceptance report (Development only).

The Results grid must include every portfolio-linked equity, including fully
closed holdings. A period counts only if selected PAT, diluted EPS and
revenue (or banking NII) come from one source and consolidation scope.
Unselected captures and ETFs never count as completed company quarters.
"""
from __future__ import annotations

from collections import defaultdict
import argparse
import json
import os

import psycopg

EXPECTED_REF = "lrgpjimipfkyoqbpsqzz"
PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
PERIODS = ("2025-09-30", "2025-12-31", "2026-03-31", "2026-06-30")
BANKS = frozenset(
    "AUBANK AXISBANK BANDHANBNK BANKBARODA BANKINDIA CANBK FEDERALBNK "
    "HDFCBANK ICICIBANK IDBI IDFCFIRSTB INDIANB KARURVYSYA "
    "KOTAKBANK RBLBANK SBIN UNIONBANK".split()
)
BANK_CORE = frozenset(("NET_INTEREST_INCOME_QUARTER", "NET_PROFIT_QUARTER", "EPS_DILUTED"))
OTHER_CORE = frozenset(("OPERATING_REVENUE_QUARTER", "NET_PROFIT_QUARTER", "EPS_DILUTED"))
METRICS = sorted(BANK_CORE | OTHER_CORE)


def readback(db_url: str) -> dict:
    if EXPECTED_REF not in db_url:
        raise RuntimeError("NOT_DEVELOPMENT_DATABASE")
    with psycopg.connect(db_url) as db:
        with db.cursor() as cur:
            cur.execute("""
              SELECT DISTINCT s.id, s.symbol, s.asset_class
              FROM public.transactions t
              JOIN public.securities s ON s.id=t.security_id
              WHERE t.portfolio_id=%s AND t.superseded_at IS NULL
              ORDER BY s.asset_class,s.symbol
            """, (PORTFOLIO_ID,))
            all_members = cur.fetchall()
            cur.execute("""
              SELECT o.security_id,o.period_end,o.consolidation_scope,
                     o.source_record_id,o.metric_code
              FROM public.fundamental_observation_decisions d
              JOIN public.fundamental_observations o
                ON o.id=d.selected_observation_id
              WHERE o.period_type='QUARTER'
                AND o.period_end=ANY(%s::date[])
                AND o.metric_code=ANY(%s)
                AND o.evidence_status='AVAILABLE'
                AND o.numeric_value IS NOT NULL
                AND o.source_record_id IS NOT NULL
            """, (list(PERIODS), METRICS))
            chosen = cur.fetchall()

    selected = defaultdict(set)
    for sid, period, scope, source_id, metric in chosen:
        if scope and source_id:
            selected[(sid, str(period), scope, source_id)].add(metric)
    complete = defaultdict(set)
    equity = {sid: symbol for sid, symbol, cls in all_members if cls == "EQUITY"}
    etfs = sorted(symbol for _, symbol, cls in all_members if cls == "ETF")
    for (sid, end, _scope, _source), metrics in selected.items():
        symbol = equity.get(sid)
        if symbol and (BANK_CORE if symbol in BANKS else OTHER_CORE).issubset(metrics):
            complete[sid].add(end)
    details = []
    for sid, symbol in sorted(equity.items(), key=lambda row: row[1]):
        available = complete.get(sid, set())
        if len(available) != len(PERIODS):
            details.append({
                "symbol": symbol,
                "selected_quarters": len(available),
                "missing_period_ends": [q for q in PERIODS if q not in available],
            })
    return {
        "contract": "R3_CURRENT_4Q_SOURCE_SELECTED_V1",
        "target_period_ends": PERIODS,
        "equities": len(equity),
        "etfs_excluded": len(etfs),
        "complete_equities": len(equity) - len(details),
        "incomplete_equities": len(details),
        "incomplete": details,
        "database": "Development",
        "publication_time_validation": "SEPARATE_R4_GATE",
        "result": "PASS" if not details and len(equity) == 262 else "INCOMPLETE",
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true", help="exit non-zero until 262/262 pass")
    args = ap.parse_args()
    report = readback(os.environ.get("SUPABASE_DB_URL", ""))
    print(json.dumps(report, sort_keys=True, indent=2))
    return 2 if args.strict and report["result"] != "PASS" else 0


if __name__ == "__main__":
    raise SystemExit(main())
