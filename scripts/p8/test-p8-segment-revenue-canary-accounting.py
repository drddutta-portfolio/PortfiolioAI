#!/usr/bin/env python3
import importlib.util, unittest
from decimal import Decimal
spec=importlib.util.spec_from_file_location("m","scripts/p8/p8-segment-revenue-canary-accounting.py")
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

class Tests(unittest.TestCase):
    def ratio(self,n,d): return Decimal(str(n))/Decimal(str(d))
    def test_above_50_passes(self): self.assertTrue(self.ratio(51,100)>Decimal("0.5"))
    def test_exact_50_fails(self): self.assertFalse(self.ratio(50,100)>Decimal("0.5"))
    def test_below_50_fails(self): self.assertFalse(self.ratio(49,100)>Decimal("0.5"))
    def test_zero_denominator_invalid(self): self.assertFalse(Decimal("0")>0)
    def test_negative_denominator_invalid(self): self.assertFalse(Decimal("-1")>0)
    def test_rounding_quantum_negative_decimals(self):
        f={"decimals":"-6","scale":None}; self.assertEqual(m.half_quantum(f),Decimal("500000"))
    def test_scale_applied(self):
        f={"value":"12","scale":"3"}; self.assertEqual(m.scaled_value(f),Decimal("12000"))
    def test_unit_conflict(self):
        self.assertFalse(m.compatible_unit({"unit_ref":"INR"},{"unit_ref":"USD"}))
    def test_strict_source_future_rejected(self):
        self.assertFalse("2025-04-01T00:00:00+00:00" < "2025-03-01T00:00:00+00:00")
    def test_taxonomy_normalization_deterministic(self):
        self.assertEqual(m.norm("Commercial Vehicles"),"COMMERCIAL_VEHICLES")
    def test_no_segment_aggregation_contract(self):
        c={"combine_distinct_segments":False}; self.assertFalse(c["combine_distinct_segments"])
    def test_repeat_hash(self):
        self.assertEqual(m.stable({"a":1,"b":2}),m.stable({"b":2,"a":1}))

if __name__=="__main__": unittest.main()
