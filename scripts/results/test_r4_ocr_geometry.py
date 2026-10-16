import copy,unittest
from r4_ocr_geometry import agree

def parsed(value="132.4"):
    return {"scope":"CONSOLIDATED","unit":"INR_MILLION","header_evidence":"Rs. in millions",
        "facts":{"NET_PROFIT_QUARTER":{"value":value,"unit":"INR_CRORE","original_unit":"INR_MILLION",
          "original_value":"1324","column_period":"2024-12-31","page":2,"column_index":0}},
        "arithmetic_validation":{"contract":"PBT_MINUS_TAX_EQUALS_PAT","difference_crore":"0"}}

class OCRTest(unittest.TestCase):
    def test_two_independent_renders_with_accounting_proof(self):
        self.assertEqual(len(agree(parsed(),copy.deepcopy(parsed()))),64)
    def test_render_disagreement_rejects(self):
        with self.assertRaises(ValueError):agree(parsed(),parsed("13.24"))
    def test_missing_accounting_crosscheck_rejects(self):
        one=parsed();one["arithmetic_validation"]=None
        with self.assertRaises(ValueError):agree(one,parsed())
    def test_currency_must_be_explicit(self):
        one=parsed();one["header_evidence"]="All amounts in millions"
        with self.assertRaises(ValueError):agree(one,copy.deepcopy(one))

if __name__=="__main__":unittest.main()
