import hashlib,unittest
from copy import deepcopy
from test_r4_pdf_geometry import fixture
from r4_pdf_geometry import extract_page
from r4_bse_dated_proof import validate_original,REVISION

def proof_fixture():
    doc,p=fixture(first='30.09.2025',third='30.09.2024')
    raw=doc.tobytes();parsed=extract_page(p,1,'2024-09-30',allow_comparative=True)
    digest=hashlib.sha256(raw).hexdigest();url='https://www.bseindia.com/xml-data/corpfiling/AttachHis/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pdf'
    m={'symbol':'NATCOPHARM','isin':'INE987654321','issuer_name':'NATCO PHARMA LIMITED','bse_scrip_code':'123456','original_sha256_retained':digest,'issuer_filing_url':url,'financial_page':1,'period_end':'2024-09-30','consolidation_scope':'CONSOLIDATED','original_unit':parsed['unit'],'first_column_period':parsed['first_column_period'],'selected_column_period':'2024-09-30','selected_column_index':2,'source_reporting_basis':'LATER_FILING_REPORTED_COMPARATIVE','facts':parsed['facts']}
    identity={'header':{'SecurityCode':'123456','ISIN':m['isin']},'listing':{'SCRIP_CD':'123456','ISIN_NUMBER':m['isin'],'Issuer_Name':m['issuer_name']},'issuer_name':m['issuer_name'],'bse_scrip_code':'123456','original_sha256':digest,'source_url':url}
    return raw,m,identity

class DatedProofTest(unittest.TestCase):
    def test_original_column_and_full_trio_replay(self):
        raw,m,identity=proof_fixture();self.assertEqual(validate_original(raw,m,identity)['column_index'],2)
    def test_mutated_value_rejected(self):
        raw,m,identity=proof_fixture();m['facts']['EPS_DILUTED']['value']='999'
        with self.assertRaisesRegex(ValueError,'FACT_MISMATCH'):validate_original(raw,m,identity)
    def test_wrong_isin_rejected(self):
        raw,m,identity=proof_fixture();identity['listing']['ISIN_NUMBER']='WRONG'
        with self.assertRaisesRegex(ValueError,'IDENTITY_UNPROVEN'):validate_original(raw,m,identity)
    def test_wrong_selected_column_rejected(self):
        raw,m,identity=proof_fixture();m['selected_column_index']=0
        with self.assertRaisesRegex(ValueError,'CONTEXT_MISMATCH'):validate_original(raw,m,identity)
    def test_mutated_original_rejected(self):
        raw,m,identity=proof_fixture()
        with self.assertRaisesRegex(ValueError,'HASH_MISMATCH'):validate_original(raw+b'changed',m,identity)
    def test_restated_comparative_stays_for_review(self):
        import fitz
        raw,m,identity=proof_fixture()
        with fitz.open(stream=raw,filetype='pdf') as doc:
            doc[0].insert_text((25,310),'Comparatives restated for business combination',fontsize=10);raw=doc.tobytes()
        m['original_sha256_retained']=identity['original_sha256']=hashlib.sha256(raw).hexdigest()
        with self.assertRaisesRegex(ValueError,'RESTATED_COMPARATIVE'):validate_original(raw,m,identity)

if __name__=='__main__':unittest.main()
