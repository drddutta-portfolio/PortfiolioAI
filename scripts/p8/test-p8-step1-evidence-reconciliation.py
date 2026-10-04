#!/usr/bin/env python3
"""Validate source-index deduplication and reporting-period inventory, not scores."""
import json
import unittest
from datetime import date, datetime
from pathlib import Path

AUDIT = Path("docs/p8/PortfolioAI_P8_STEP1_EXISTING_EVIDENCE_RECONCILIATION_2026-10-05.json")

def annual_periods(sources, decision_at):
    decision = datetime.fromisoformat(decision_at)
    seen = set()
    periods = set()
    for entry in sources:
        source = entry["source"]
        if datetime.fromisoformat(source["published_at"]) >= decision:
            continue
        if not entry["hash_verified"] or entry["actual_sha256"] != source["source_hash"]:
            raise ValueError("Source hash mismatch")
        if source["source_hash"] in seen:
            continue
        seen.add(source["source_hash"])
        contexts = {}
        for fact in entry["facts"]:
            contexts.setdefault(fact["context"], {}).setdefault(fact["concept"], set()).add(fact["value"])
        for facts in contexts.values():
            def unique(name):
                values = facts.get(name, set())
                return next(iter(values)) if len(values) == 1 else None
            start = unique("DateOfStartOfReportingPeriod")
            end = unique("DateOfEndOfReportingPeriod")
            if unique("NatureOfReportStandaloneConsolidated") != "Consolidated" or not start or not end:
                continue
            days = (date.fromisoformat(end) - date.fromisoformat(start)).days + 1
            if 330 <= days <= 380:
                periods.add((start, end))
    return sorted(periods)

class EvidenceChecks(unittest.TestCase):
    def setUp(self):
        self.audit = json.loads(AUDIT.read_text())
        self.sources = self.audit["sources"]
        self.decision = self.audit["decision_at"]

    def test_distinct_years_not_filing_count(self):
        self.assertEqual(annual_periods(self.sources, self.decision),
                         [("2023-04-01", "2024-03-31")])
        self.assertLess(len(annual_periods(self.sources, self.decision)),
                        self.audit["history"]["required_annual_years"])

    def test_duplicates_do_not_supply_years(self):
        self.assertEqual(annual_periods(self.sources * 2, self.decision),
                         annual_periods(self.sources, self.decision))

    def test_standalone_does_not_supply_consolidated_history(self):
        standalone = [s for s in self.sources if any(
            f["concept"] == "NatureOfReportStandaloneConsolidated" and f["value"] == "Standalone"
            for f in s["facts"])]
        self.assertEqual(annual_periods(standalone, self.decision), [])

    def test_future_disclosure_excluded(self):
        future = json.loads(json.dumps(self.sources[0]))
        future["source"]["published_at"] = self.decision
        self.assertEqual(annual_periods([future], self.decision), [])

    def test_source_hash_failure_rejected(self):
        bad = json.loads(json.dumps(self.sources[0]))
        bad["actual_sha256"] = "bad"
        with self.assertRaises(ValueError):
            annual_periods([bad], self.decision)

    def test_legacy_sql_zero_is_not_missing_market_proof(self):
        market = self.audit["market"]
        self.assertEqual(market["legacy_sql_table_expected_rows"], 0)
        self.assertIsNone(market["identity_specific_market_rows"])
        self.assertEqual(market["identity_specific_history_state"], "NOT_MEASURED")
        self.assertEqual(market["canonical_storage"], "CLOUDFLARE_R2")

    def test_corrected_canary_preserves_unknown_market_count(self):
        audit = json.loads(Path("docs/p8/PortfolioAI_P8_STEEL_FERROUS_FROZEN_CANARY_AUDIT_2026-10-05.json").read_text())
        market = audit["steel_input_readiness"]["market_history"]
        self.assertIsNone(market["p8_b3_adjusted_rows_before_decision"])
        self.assertEqual(market["state"], "NOT_MEASURED_R2_CANONICAL_HISTORY")
        self.assertIn("not independent", audit["measurement_scope"])

if __name__ == "__main__":
    unittest.main()
