#!/usr/bin/env python3
"""R5-F read-only live coverage proof over the same exact 262 x 8 R4 ledger.

R5 is permitted to progress on selected original issuer facts. No Trendlyne
capture is promoted, no missing baseline is imputed, no investment score is
written, and Production is never contacted.
"""
import importlib.util
import json
import os
from pathlib import Path

R4_PATH = Path(__file__).with_name("r4-eight-quarter-readback.py")
HISTORICAL = ("2024-09-30", "2024-12-31", "2025-03-31", "2025-06-30")
CURRENT = ("2025-09-30", "2025-12-31", "2026-03-31", "2026-06-30")
CONTRACT = "RESULTS_R5_F_INCREMENTAL_262_EQUITIES_V1"


def summarize(r4):
    if r4["equities"] != 262 or r4["total_slots"] != 2096:
        raise ValueError("R5 source cohort size mismatch")
    if tuple(r4["period_ends"]) != HISTORICAL + CURRENT:
        raise ValueError("R5 requires the approved eight exact source periods")
    per_period = r4["by_period"]
    if any(p not in per_period for p in HISTORICAL + CURRENT):
        raise ValueError("R5 historical or current quarter omitted")
    historical = sum(per_period[p].get("QUALIFIED", 0) for p in HISTORICAL)
    current = sum(per_period[p].get("QUALIFIED", 0) for p in CURRENT)
    selected = r4["status_counts"].get("QUALIFIED", 0)
    if historical + current != selected or selected > 2096:
        raise ValueError("R5 qualified stock-quarter census inconsistent")
    fully_current = r4["displayed_four_quarter_complete_equities"]
    if not 0 <= fully_current <= 262:
        raise ValueError("R5 current-cohort cardinality invalid")
    pairs = r4["baseline_period_pairs_with_both_qualified"]
    comparable = r4["potential_yoy_pairs_not_final_comparability"]
    if not 0 <= comparable <= pairs <= 1048:
        raise ValueError("R5 prior-year comparison census invalid")
    return {
        "contract": CONTRACT,
        "environment": "Development",
        "mode": "READ_ONLY_PROJECTION",
        "cohort_equities": 262,
        "historical_qualified": historical,
        "historical_remaining": 1048 - historical,
        "current_qualified": current,
        "current_remaining": 1048 - current,
        "eight_quarter_qualified": selected,
        "eight_quarter_remaining": 2096 - selected,
        "four_current_quarters_complete_equities": fully_current,
        "source_qualified_yoy_pairs": pairs,
        "same_scope_not_explicitly_split_guarded_yoy_candidates": comparable,
        "yoy_final_comparability_accepted": False,
        "grading_status": "PROGRESSIVE_ELIGIBILITY_ONLY",
        "r5_overall_status": "PARTIAL_PENDING_R5_G",
        "source_status_counts": r4["status_counts"],
        "by_period": per_period,
        "restrictions": [
            "Industry peer ranking remains exact-industry and uses only selected originals",
            "Unqualified or missing periods are not scored or filled by estimates",
            "YoY candidate pairs are not point-in-time or share-basis acceptance",
            "R5 uses canonical selections and leaves R4, Trendlyne, V1-4 and main unchanged",
        ],
    }


def main():
    spec = importlib.util.spec_from_file_location("r4_readback", R4_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    r4 = module.readback(os.environ["SUPABASE_DB_URL"])
    report = summarize(r4)
    path = Path("tmp/results-r5/r5-f-source-qualified-progress.json")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2, sort_keys=True))
    print("R5_F_SOURCE_SELECTED_PROGRESS", json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
