"""Unit tests for read-only R4 262x8 source-selection classification."""
import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location("r4_readback",Path(__file__).with_name("r4-eight-quarter-readback.py"))
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

def row(metric,source="a",scope="CONSOLIDATED",value="1",**kwargs):
    return {
      "source_code":"COMPANY_EXCHANGE_FILING","evidence_status":"AVAILABLE",
      "currency":"INR","numeric_value":value,"source_record_id":source,
      "consolidation_scope":scope,"metric_code":metric,
      "period_start":"2025-07-01","period_end":"2025-09-30",
      "unit":"INR_PER_SHARE" if metric=="EPS_DILUTED" else "INR_CRORE",
      "notes":"",**kwargs
    }

class EightQuarterReadbackTests(unittest.TestCase):
    def test_four_display_and_four_prior_year_only(self):
        self.assertEqual(len(m.PERIODS),8)
        self.assertEqual(len(set(m.PERIODS)),8)
        self.assertEqual(m.PERIODS[0],"2024-09-30")
        self.assertEqual(m.PERIODS[-1],"2026-06-30")
        self.assertEqual(m.required_for("FEDERALBNK"),{"NET_INTEREST_INCOME_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"})
        self.assertEqual(m.required_for("STARHEALTH"),{"NET_PREMIUM_EARNED_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"})

    def test_same_source_and_scope_qualifies(self):
        rows=[row(x) for x in m.required_for("RELIANCE")]
        self.assertEqual(m.classify("RELIANCE",rows,[])["status"],"QUALIFIED")
        self.assertEqual(m.classify("RELIANCE",rows,[])["complete_source_count"],1)

    def test_different_sources_do_not_mix(self):
        rows=[row("NET_PROFIT_QUARTER","a"),row("EPS_DILUTED","b"),row("OPERATING_REVENUE_QUARTER","a")]
        self.assertEqual(m.classify("RELIANCE",rows,[])["status"],"PARTIAL_SELECTED")

    def test_wrong_source_units_and_consolidation_scope_do_not_qualify(self):
        rows=[row("NET_PROFIT_QUARTER"),row("EPS_DILUTED"),row("OPERATING_REVENUE_QUARTER")]
        rows[0]["source_code"]="TRENDLYNE_MCP"
        self.assertEqual(m.classify("RELIANCE",rows,[])["status"],"PARTIAL_SELECTED")
        rows[0]["source_code"]="COMPANY_EXCHANGE_FILING"
        rows[1]["unit"]="INR_CRORE"
        self.assertEqual(m.classify("RELIANCE",rows,[])["status"],"PARTIAL_SELECTED")
        rows[1]["unit"]="INR_PER_SHARE"
        rows[2]["consolidation_scope"]="UNKNOWN"
        self.assertEqual(m.classify("RELIANCE",rows,[])["status"],"PARTIAL_SELECTED")

    def test_insurer_does_not_relabel_net_premium_as_revenue(self):
        rows=[row("OPERATING_REVENUE_QUARTER"),row("NET_PROFIT_QUARTER"),row("EPS_DILUTED")]
        self.assertEqual(m.classify("STARHEALTH",rows,[])["status"],"PARTIAL_SELECTED")
        rows[0]["metric_code"]="NET_PREMIUM_EARNED_QUARTER"
        self.assertEqual(m.classify("STARHEALTH",rows,[])["status"],"QUALIFIED")

    def test_raw_source_conflict_is_quarantined(self):
        rows=[row("NET_PROFIT_QUARTER","a",value="215.8835"),row("NET_PROFIT_QUARTER","b",value="215.8837")]
        self.assertEqual(m.classify("BDL",[],rows)["status"],"CONFLICT")
        rows=[row("NET_PROFIT_QUARTER","a",value="215.8835"),row("NET_PROFIT_QUARTER","b",value="215.8835")]
        self.assertEqual(m.classify("BDL",[],rows)["status"],"REVIEW_REQUIRED")

    def test_missing_is_not_unproved_not_applicable(self):
        result=m.classify("VAML",[],[])
        self.assertEqual(result["status"],"MISSING")
        self.assertEqual(result["not_applicable"],"UNPROVEN")

    def test_original_split_share_basis_blocks_implicit_yoy(self):
        rows=[row(x) for x in m.required_for("RELIANCE")]
        rows[0]["notes"]="REPORTED_PRE_SPLIT_EPS_NOT_ADJUSTED"
        self.assertTrue(m.classify("RELIANCE",rows,[])["historical_eps_share_basis_guard"])

    def test_period_must_be_single_three_month_span(self):
        r=row("NET_PROFIT_QUARTER")
        self.assertTrue(m.field_eligible(r))
        r["period_start"]="2025-04-01"
        self.assertFalse(m.field_eligible(r))

if __name__=="__main__":
    unittest.main()
