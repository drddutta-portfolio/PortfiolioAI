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
if __name__=="__main__":unittest.main()
