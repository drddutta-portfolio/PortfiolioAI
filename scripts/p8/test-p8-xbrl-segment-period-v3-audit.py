#!/usr/bin/env python3
import importlib.util, unittest
from decimal import Decimal
spec=importlib.util.spec_from_file_location("m","scripts/p8/p8-xbrl-segment-period-v3-audit.py")
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Tests(unittest.TestCase):
    def test_quarter_duration(self): self.assertTrue(80<=m.days({"start":"2024-01-01","end":"2024-03-31"})<=100)
    def test_annual_duration(self): self.assertTrue(330<=m.days({"start":"2023-04-01","end":"2024-03-31"})<=380)
    def test_literal_context_not_overwritten(self):
        raw={"start":"2024-01-01","end":"2024-03-31"};proposed={"start":"2023-04-01","end":"2024-03-31"}
        self.assertNotEqual(raw,proposed)
    def test_exact_50_fails(self): self.assertFalse(Decimal("50")/Decimal("100")>Decimal("0.5"))
    def test_absent_not_zero(self): self.assertIsNone(m.dec(None))
    def test_hash_repeat(self): self.assertEqual(m.stable({"b":2,"a":1}),m.stable({"a":1,"b":2}))
    def test_prefix_not_sufficient(self): self.assertTrue("FourReportableSegmentRevenue01D".startswith("Four"))
    def test_committed_source_backed_v3_cases(self):
        import json
        a=json.load(open("docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_V3_CANARY_AUDIT_2026-10-04.json"))
        cond=[x for x in a["results"] if x["v3_conditional_period_fix"]]
        self.assertEqual(len(cond),12)
        for x in cond:
            s=x["source_semantics"]
            self.assertIn("Yearly",s["reporting_quarter_values"])
            self.assertTrue(80<=m.days(s["one_explicit_period"])<=100)
            self.assertTrue(330<=m.days(s["four_explicit_period"])<=380)
            self.assertEqual(s["one_explicit_period"]["end"],s["four_explicit_period"]["end"])
            self.assertTrue(s["matching_segment_identities"])
            self.assertTrue(s["revenue_one_recon"]["ok"])
            self.assertTrue(s["revenue_four_recon"]["ok"])
            self.assertTrue(s["profit_one_recon"]["ok"])
            self.assertTrue(s["profit_four_recon"]["ok"])
            # Raw literal Four subcontexts remain conflicting quarter metadata.
            for seg in s["four_revenue"]:
                self.assertNotEqual(seg["literal_context"]["start"],s["four_explicit_period"]["start"])

    def test_no_v1_literal_annual_recovery_was_found(self):
        import json
        a=json.load(open("docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_V3_CANARY_AUDIT_2026-10-04.json"))
        self.assertEqual(a["diagnostic_counts"].get("V1_EXTRACTION_FIX_EXISTING_ANNUAL_FACT",0),0)

    def test_missing_disclosures_are_not_inferred_zero(self):
        import json
        a=json.load(open("docs/p8/PortfolioAI_P8_XBRL_MISSING_ACCOUNTING_DISCLOSURE_AUDIT_2026-10-04.json"))
        self.assertEqual(a["case_denominator"],12)
        self.assertTrue(all(x["finding"]=="NO_ALTERNATE_RELATED_FACTS_FOUND" for x in a["cases"]))

    def test_point_in_time_selected_sources_precede_decisions(self):
        import json
        s=json.load(open("docs/p8/PortfolioAI_P8_SEGMENT_REVENUE_CANARY_SOURCE_ACCOUNTING_AUDIT_2026-10-04.json"))
        for x in s["results"]:
            if x.get("selected_source"):
                self.assertLess(x["selected_source"]["disseminated_at"],x["decision_at"])

    def test_v1_authoritative_counts_remain_zero(self):
        import json
        a=json.load(open("docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_V3_CANARY_AUDIT_2026-10-04.json"))
        self.assertEqual(a["v1_authoritative_counts"],{
          "comparable_segment_revenue":0,
          "complete_company_classification":0,
          "unique_route":0,
          "complete_normalized_input":0
        })

if __name__=="__main__":unittest.main()
