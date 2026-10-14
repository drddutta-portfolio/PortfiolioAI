import importlib.util
from pathlib import Path
from unittest import TestCase,main
from unittest.mock import MagicMock
spec=importlib.util.spec_from_file_location("r4pdf",Path(__file__).with_name("r4-issuer-pdf-recovery.py"))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class PdfChecks(TestCase):
 def test_exact_issuer_url_and_sha256(self):
  self.assertEqual(m.URL,"https://www.coforge.com/hubfs/Outcome-of-Board-Meeting-Q3-FY2026.pdf")
  self.assertEqual(len(m.ORIGINAL_SHA),64)
 def test_values_and_currency(self):
  self.assertEqual(m.EXPECTED["OPERATING_REVENUE_QUARTER"][0],"4188.1")
  self.assertEqual(m.EXPECTED["NET_PROFIT_QUARTER"][0],"296.7")
  self.assertEqual(m.EXPECTED["EPS_DILUTED"][0],"7.38")
  self.assertEqual(m.EXPECTED["OPERATING_REVENUE_QUARTER"][3],"INR_MILLION")
 def test_fail_closed_if_original_bytes_changed(self):
  with self.assertRaisesRegex(RuntimeError,"HASH_CHANGED"):
   m.validate(b"%PDF-mock-source-bytes")
if __name__=="__main__":main()
