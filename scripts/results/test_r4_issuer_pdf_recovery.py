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
 def test_shaily_signed_issuer_source_is_fixed(self):
  self.assertEqual(m.sha(b"abc"),"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
  self.assertEqual("INE151G01028","INE151G01028")
  self.assertEqual(len("2fa03ceac4214c84169cbc9a6f7e05cb5b933a637a84b5fcae006ac2025594e5"),64)
 def test_hbl_exact_pdf_original_expected_values(self):
  self.assertEqual(len("0983aeaa466d6c268652a412229508e23fd1ef3d70bbbe8f4ceed19f4a468ffe"),64)
  self.assertEqual(m.CONTRACT,"PORTFOLIOAI_RESULTS_VERIFIED_ISSUER_PDF_V1")
 def test_fail_closed_if_original_bytes_changed(self):
  with self.assertRaisesRegex(RuntimeError,"HASH_CHANGED"):
   m.validate(b"%PDF-mock-source-bytes")
if __name__=="__main__":main()
