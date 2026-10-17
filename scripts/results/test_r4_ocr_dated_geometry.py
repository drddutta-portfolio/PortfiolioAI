import hashlib,unittest
from copy import deepcopy
import fitz
from test_r4_pdf_geometry import fixture
from r4_ocr_dated_geometry import audit_document,extract_dated_page,REVISION
from r4_bse_dated_proof import validate_original

class DatedOCRTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        doc,page=fixture(first='30.09.2025',third='30.09.2024')
        for y,label,value in [(250,'Profit before tax','2,303'),(280,'Total tax expense','176')]:
            page.insert_text((25,y),label,fontsize=10)
            for x in (475,625,775):page.insert_text((x,y),value,fontsize=10)
        image=fitz.open();p=image.new_page(width=page.rect.width,height=page.rect.height)
        p.insert_image(p.rect,stream=page.get_pixmap(dpi=200).tobytes('png'));cls.raw=image.tobytes()
        cls.audit=audit_document(cls.raw);cls.parsed,cls.checks=extract_dated_page(cls.raw,1,'2024-09-30')
        sha=hashlib.sha256(cls.raw).hexdigest();url='https://www.bseindia.com/xml-data/corpfiling/AttachHis/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pdf'
        cls.manifest={'parser_revision':REVISION,'symbol':'NATCOPHARM','isin':'INE987654321','issuer_name':'NATCO PHARMA LIMITED','bse_scrip_code':'123456','original_sha256_retained':sha,'issuer_filing_url':url,'financial_page':1,'period_end':'2024-09-30','consolidation_scope':'CONSOLIDATED','original_unit':cls.parsed['unit'],'first_column_period':'2025-09-30','selected_column_period':'2024-09-30','selected_column_index':2,'source_reporting_basis':'LATER_FILING_REPORTED_COMPARATIVE','facts':cls.parsed['facts'],'ocr_document_text_sha256':cls.audit['text_sha256']}
        cls.identity={'header':{'SecurityCode':'123456','ISIN':cls.manifest['isin']},'listing':{'SCRIP_CD':'123456','ISIN_NUMBER':cls.manifest['isin'],'Issuer_Name':cls.manifest['issuer_name']},'issuer_name':cls.manifest['issuer_name'],'bse_scrip_code':'123456','original_sha256':sha,'source_url':url}
    def test_prior_year_quarter_is_double_rendered_and_independently_replayed(self):
        out=validate_original(self.raw,self.manifest,self.identity)
        self.assertEqual(out['column_index'],2)
        self.assertEqual(out['facts']['NET_PROFIT_QUARTER']['value'],'212.7')
        self.assertEqual(out['facts']['EPS_DILUTED']['value'],'11.88')
        self.assertEqual(len(self.checks['fingerprint']),64)
    def test_one_render_pair_checks_all_quarters_and_does_not_invent_absent_periods(self):
        from unittest.mock import patch
        from r4_ocr_geometry import OCRPage
        from r4_ocr_dated_geometry import extract_dated_periods
        with patch('r4_ocr_dated_geometry.GroupHeaderOCRPage',wraps=__import__('r4_ocr_dated_geometry').GroupHeaderOCRPage) as render:
            result=extract_dated_periods(self.raw,1,('2024-09-30','2024-12-31','2025-03-31','2025-06-30'))
        self.assertEqual(render.call_count,2)
        self.assertEqual(result['2024-09-30']['parsed']['facts']['EPS_DILUTED']['value'],'11.88')
        self.assertEqual(result['2024-12-31']['rejection'],'PERIOD_NOT_PRESENT_IN_PROVEN_QUARTER_COLUMNS')

    def test_identical_resolution_pair_cannot_supply_independent_proof(self):
        with self.assertRaisesRegex(ValueError,'UNAPPROVED'):
            extract_dated_page(self.raw,1,'2024-09-30',render_dpi=(300,300))

    def test_original_group_labels_can_supply_a_heading_omitted_by_ocr(self):
        from unittest.mock import patch
        from r4_ocr_geometry import OCRPage
        original=OCRPage.get_text
        def omitted(obj,kind="text",**kwargs):
            result=original(obj,kind,**kwargs)
            if kind=="words":return [w for w in result if not (85<w[1]<105 and str(w[4]).lower() in ('quarter','ended'))]
            return result
        # The original PDF's own quarter label remains the authority;
        # rendered date and monetary cells still require independent agreement.
        doc,page=fixture(first='30.09.2025',third='30.09.2024')
        for y,label,value in [(250,'Profit before tax','2,303'),(280,'Total tax expense','176')]:
            page.insert_text((25,y),label,fontsize=10)
            for x in (475,625,775):page.insert_text((x,y),value,fontsize=10)
        with patch.object(OCRPage,'get_text',omitted):
            from r4_ocr_dated_geometry import GroupHeaderOCRPage
            from r4_pdf_geometry import extract_page
            parsed=extract_page(GroupHeaderOCRPage(page,300),1,'2024-09-30',allow_comparative=True)
        self.assertEqual(parsed['facts']['EPS_DILUTED']['value'],'11.88')
        self.assertEqual(parsed['column_index'],2)

    def test_native_unit_metadata_never_supplies_numbers_or_scope(self):
        from unittest.mock import patch
        from r4_ocr_geometry import OCRPage
        from r4_ocr_dated_geometry import GroupHeaderOCRPage
        doc=fitz.open();page=doc.new_page()
        page.insert_text((20,50),'Standalone financial results')
        page.insert_text((20,70),'Rs. in Lakhs except EPS 345.67')
        page.insert_text((20,100),'Revenue from operations 900')
        wrapper=GroupHeaderOCRPage.__new__(GroupHeaderOCRPage);wrapper.page=page
        with patch.object(OCRPage,'get_text',return_value=[]):
            words=wrapper.get_text('words')
        tokens=[w[4] for w in words]
        self.assertIn('Rs.',tokens);self.assertIn('Lakhs',tokens)
        self.assertNotIn('345.67',tokens);self.assertNotIn('900',tokens)
        self.assertNotIn('Standalone',tokens);self.assertNotIn('EPS',tokens)

    def test_modified_document_basis_proof_is_rejected(self):
        m=deepcopy(self.manifest);m['ocr_document_text_sha256']='0'*64
        with self.assertRaisesRegex(ValueError,'FULL_DOCUMENT_REPLAY_MISMATCH'):validate_original(self.raw,m,self.identity)
    def test_modified_ocr_financial_value_is_rejected(self):
        m=deepcopy(self.manifest);m['facts']['EPS_DILUTED']['value']='99'
        with self.assertRaisesRegex(ValueError,'FACT_MISMATCH'):validate_original(self.raw,m,self.identity)
if __name__=='__main__':unittest.main()
