#!/usr/bin/env python3
import importlib.util
import unittest
from pathlib import Path

path = Path(__file__).with_name("r5-f-live-coverage.py")
spec = importlib.util.spec_from_file_location("r5_coverage", path)
r5 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r5)


def report(historical=966, current=1030):
    periods = r5.HISTORICAL + r5.CURRENT
    counts = [236, 239, 240, historical-715, 255, 258, 256, current-769]
    return {
        "equities": 262, "total_slots": 2096, "period_ends": periods,
        "by_period": {date: {"QUALIFIED": qty, "MISSING": 262-qty}
                      for date, qty in zip(periods, counts)},
        "status_counts": {"QUALIFIED": historical+current,
                          "MISSING": 2096-historical-current},
        "displayed_four_quarter_complete_equities": 240,
        "baseline_period_pairs_with_both_qualified": 950,
        "potential_yoy_pairs_not_final_comparability": 930,
    }


class R5ProgressTest(unittest.TestCase):
    def test_verified_partial_progress_never_promotes_missing_quarters(self):
        result = r5.summarize(report())
        self.assertEqual(result["eight_quarter_qualified"], 1996)
        self.assertEqual(result["historical_remaining"], 82)
        self.assertEqual(result["current_remaining"], 18)
        self.assertEqual(result["r5_overall_status"], "PARTIAL_PENDING_R5_G")
        self.assertFalse(result["yoy_final_comparability_accepted"])

    def test_newly_selected_r4_source_improves_r5_eligibility(self):
        old = r5.summarize(report(historical=966))
        newer = r5.summarize(report(historical=976))
        self.assertEqual(old["historical_remaining"] - newer["historical_remaining"], 10)
        self.assertEqual(newer["current_qualified"], old["current_qualified"])

    def test_fails_closed_on_missing_period_or_source_count_mismatch(self):
        invalid = report()
        invalid["by_period"].pop("2024-09-30")
        with self.assertRaises(ValueError):
            r5.summarize(invalid)
        invalid = report()
        invalid["status_counts"]["QUALIFIED"] += 1
        with self.assertRaises(ValueError):
            r5.summarize(invalid)
        invalid = report()
        invalid["equities"] = 261
        with self.assertRaises(ValueError):
            r5.summarize(invalid)

    def test_yoy_evidence_is_candidate_only(self):
        invalid = report()
        invalid["potential_yoy_pairs_not_final_comparability"] = 951
        with self.assertRaises(ValueError):
            r5.summarize(invalid)


if __name__ == "__main__":
    unittest.main()
