import copy,unittest
from r4_ocr_geometry import agree

def parsed(value="132.4"):
    return {"scope":"CONSOLIDATED","unit":"INR_MILLION","header_evidence":"Rs. in millions",
        "facts":{"NET_PROFIT_QUARTER":{"value":value,"unit":"INR_CRORE","original_unit":"INR_MILLION",
          "original_value":"1324","column_period":"2024-12-31","page":2,"column_index":0}},
        "arithmetic_validation":{"contract":"PBT_MINUS_TAX_EQUALS_PAT","difference_crore":"0"}}

class OCRTest(unittest.TestCase):
    def test_image_only_original_replays_actual_quarter_cells(self):
        import fitz
        from test_r4_pdf_geometry import fixture
        from r4_ocr_geometry import extract_ocr
        doc,page=fixture()
        for y,label,value in [(250,"Profit before tax","1,500"),(280,"Total tax expense","176")]:
            page.insert_text((25,y),label,fontsize=10)
            for x in (475,625,775):page.insert_text((x,y),value,fontsize=10)
        image=fitz.open();target=image.new_page(width=page.rect.width,height=page.rect.height)
        target.insert_image(target.rect,stream=page.get_pixmap(dpi=200).tobytes("png"))
        parsed=extract_ocr(image.tobytes(),"2024-09-30")
        self.assertEqual(parsed["facts"]["EPS_DILUTED"]["value"],"7.43")
        self.assertEqual(parsed["facts"]["NET_PROFIT_QUARTER"]["value"],"132.4")
        self.assertEqual(parsed["ocr_independent_checks"]["render_dpi"],[300,450])
        self.assertEqual(parsed["facts"]["EPS_DILUTED"]["column_index"],0)

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
