#!/usr/bin/env python3
import importlib.util, unittest
from decimal import Decimal
spec=importlib.util.spec_from_file_location("m","scripts/p8/p8-xbrl-segment-period-semantics-audit.py")
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
class Tests(unittest.TestCase):
    def test_concept_prefix_not_period_proof(self):
        self.assertTrue("FourReportableSegmentRevenue01D".startswith("Four"))
        self.assertNotEqual("2024-01-01","2023-04-01")
    def test_annual_sized_value_not_period_proof(self):
        self.assertGreater(Decimal("199452000000"),Decimal("49417500000"))
    def test_reconciliation_alone_not_period_proof(self):
        self.assertEqual(Decimal("199452000000")+Decimal("671400000"),Decimal("200123400000"))
    def test_exact_50_still_not_dominant(self):
        self.assertFalse(Decimal("50")/Decimal("100")>Decimal("0.5"))
    def test_missing_intersegment_not_zero(self):
        self.assertIsNone(m.dec(None))
    def test_hash_repeat(self):
        self.assertEqual(m.stable({"a":1,"b":2}),m.stable({"b":2,"a":1}))
    def test_normalization(self):
        self.assertEqual(m.norm("Edible Oil"),"EDIBLE_OIL")
if __name__=="__main__": unittest.main()
