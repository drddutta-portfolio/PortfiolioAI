#!/usr/bin/env python3
import importlib.util, unittest
from pathlib import Path

def load():
    p=Path("scripts/p8/p8-step2-full-historical-feasibility.py")
    spec=importlib.util.spec_from_file_location("step2",p)
    m=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m

class Step2ContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m=load()

    def test_only_frozen_taxonomy_mappings_promote(self):
        path=self.m.taxonomy()
        a=self.m.mapped_hierarchy("Edible Oil",path)
        b=self.m.mapped_hierarchy("Manufacturing- Steel Pipes",path)
        self.assertEqual(a["basicIndustryCode"],"IN040101001")
        self.assertEqual(b["basicIndustryCode"],"IN070205015")
        self.assertIsNone(self.m.mapped_hierarchy("Steel Pipes",path))
        self.assertIsNone(self.m.mapped_hierarchy("Automotive Segment",path))

    def test_primary_disposition_precedence(self):
        base={"access_limitation":False,"predecision_evidence":True,"classification_state":"AUTHORITATIVE_COMPLETE",
              "market_state":"READY","route_state":"ROUTED","input_state":"INPUTS_INCOMPLETE"}
        self.assertEqual(self.m.primary(base),"REQUIRED_INPUTS_INCOMPLETE")
        self.assertEqual(self.m.primary(dict(base,route_state="REVIEW_REQUIRED")),"ROUTE_UNSUPPORTED_OR_AMBIGUOUS")
        self.assertEqual(self.m.primary(dict(base,market_state="BLOCKED")),"MARKET_DATA_BLOCKED_OR_INSUFFICIENT_HISTORY")
        self.assertEqual(self.m.primary(dict(base,classification_state="BLOCKED")),"CLASSIFICATION_UNRESOLVED_OR_NOT_AUTHORITATIVE")
        self.assertEqual(self.m.primary(dict(base,predecision_evidence=False)),"NO_PRE_DECISION_EVIDENCE")
        self.assertEqual(self.m.primary(dict(base,access_limitation=True)),"NOT_MEASURED_ACCESS_OR_DECODING_LIMITATION")

    def test_v3_strict_gt50_and_nonzero_intersegment_block(self):
        sem={"v3_bridge_pass":True,"four_revenue":[{"description":"Manufacturing- Steel Pipes","value":"51"},{"description":"Other","value":"49"}]}
        d,e=self.m.v3_dominant({"company_revenue":"100","intersegment_revenue":"0"},sem)
        self.assertIsNone(e)
        self.assertEqual(d["description"],"Manufacturing- Steel Pipes")
        sem50={"v3_bridge_pass":True,"four_revenue":[{"description":"Manufacturing- Steel Pipes","value":"50"},{"description":"Other","value":"50"}]}
        d,e=self.m.v3_dominant({"company_revenue":"100","intersegment_revenue":"0"},sem50)
        self.assertIsNone(d)
        self.assertEqual(e,"V3_NO_GT50_DOMINANT")
        d,e=self.m.v3_dominant({"company_revenue":"100","intersegment_revenue":"1"},sem)
        self.assertIsNone(d)
        self.assertEqual(e,"V3_NONZERO_INTERSEGMENT_EXTERNAL_UNRESOLVED")

    def test_signal_minimums_frozen(self):
        got={c:n for c,n,_ in self.m.SIGNALS}
        self.assertEqual(got["THROUGH_CYCLE_MARGIN_QUALITY"],12)
        self.assertEqual(got["ROCE_OR_ROIC_THROUGH_CYCLE"],5)
        self.assertEqual(got["MOMENTUM_12M_RELATIVE"],252)
        self.assertEqual(got["COMMODITY_CYCLE_DRAWDOWN_RISK"],252)
        self.assertEqual(len(got),11)

if __name__=="__main__":
    unittest.main()
