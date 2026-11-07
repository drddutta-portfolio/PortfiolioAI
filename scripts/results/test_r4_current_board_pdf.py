import unittest,base64,io
from copy import deepcopy
from unittest.mock import patch
import fitz
import r4_current_board_pdf as m
from r4_scope_board import make_bridge,extract_current_with_scope_board,extract_with_scope_board
from test_r4_scope_board import fixture,audit

def current_fixture():
    doc,b=fixture();p=doc[0]
    for rect in (fitz.Rect(440,110,560,132),fitz.Rect(740,110,870,132)):
        p.add_redact_annot(rect,fill=(1,1,1))
    p.add_redact_annot(fitz.Rect(20,505,600,525),fill=(1,1,1))
    p.apply_redactions();p.insert_text((25,520),'Approved at the board meeting on February 1, 2026.',fontsize=8);p.insert_text((450,125),'31.12.2025',fontsize=10);p.insert_text((750,125),'30.09.2025',fontsize=10)
    raw=base64.b64decode(b['nse_original_base64']).replace(b'01-07-2025',b'01-10-2025').replace(b'30-09-2025',b'31-12-2025').replace(b'01-11-2025',b'01-02-2026')
    return doc,make_bridge(raw,b['nse_original_url'],'2025-12-31')

class CurrentBoardTests(unittest.TestCase):
    def parse(self,doc,b,period='2025-09-30'):
        raw=doc.tobytes();return extract_current_with_scope_board(raw,1,period,'NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',b,document_audit=audit(raw))
    def test_explicit_current_comparative_preserves_pdf_cells(self):
        doc,b=current_fixture();p,e=self.parse(doc,b);self.assertEqual(p['facts']['EPS_DILUTED']['value'],'11.88');self.assertTrue(e['current_comparative_values_from_pdf_only']);self.assertFalse(e['historical_values_from_pdf_only'])
    def test_historical_contract_remains_closed_to_current_window(self):
        doc,b=current_fixture()
        with self.assertRaisesRegex(ValueError,'HISTORICAL_NONBANK'):extract_with_scope_board(doc.tobytes(),1,'2025-09-30','NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',b)
    def test_current_contract_requires_earlier_explicit_current_column(self):
        doc,b=current_fixture()
        for period in ('2024-09-30','2025-12-31','2026-03-31'):
            with self.assertRaisesRegex(ValueError,'CURRENT_REPORTED_COMPARATIVE'):self.parse(doc,b,period)
    def test_changed_primary_trio_and_clock_fail(self):
        for old,new in ((b'474.8',b'999.8'),(b'14:00:00',b'14:01:00')):
            doc,b=current_fixture();raw=base64.b64decode(b['nse_original_base64']).replace(old,new);b=make_bridge(raw,b['nse_original_url'],'2025-12-31')
            with self.assertRaises(ValueError):self.parse(doc,b)
    def test_second_statement_and_business_perimeter_warning_fail(self):
        doc,b=current_fixture();doc[0].insert_text((25,590),'Comparative figures restated after demerger',fontsize=9)
        with self.assertRaises(ValueError):self.parse(doc,b)
        doc,b=current_fixture();other=fitz.open(stream=doc.tobytes(),filetype='pdf');doc.insert_pdf(other)
        with self.assertRaises(ValueError):self.parse(doc,b)
    def test_full_retained_manifest_original_and_canonical_trio_replay(self):
        doc,b=current_fixture();raw=doc.tobytes();parsed,evidence=extract_current_with_scope_board(raw,1,'2025-09-30','NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',b,document_audit=audit(raw))
        url='https://www.bseindia.com/xml-data/corpfiling/AttachHis/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pdf';digest=m.sha(raw);original_key=m.PREFIX+'evidence/original_version='+digest+'/issuer-original.pdf'
        review={'bse_identity':{'issuer_name':'NATCO PHARMA LIMITED'}};review_raw=m.canonical(review);rh=m.sha(review_raw);rk=m.PREFIX+'bse-dated-pdf-review/sha256='+rh+'/capture.json'
        primary=base64.b64decode(b['nse_original_base64']);bk=m.PREFIX+'scope-board-primary/sha256='+b['nse_original_sha256']+'/original.html';compact_bridge={**{k:v for k,v in b.items() if k!='nse_original_base64'},'nse_original_r2_key':bk}
        manifest={'contract':m.CONTRACT,'symbol':'NATCOPHARM','isin':'INE987654321','security_id':'security','issuer_name':'NATCO PHARMA LIMITED','period_start':'2025-07-01','period_end':'2025-09-30','consolidation_scope':'STANDALONE','reporting_currency':'INR','issuer_filing_url':url,'original_sha256':digest,'original_r2_key':original_key,'original_pdf_retained':True,'raw_bse_bytes_retained':True,'bse_identity_reference':{'sha256':rh,'r2_key':rk},'scope_bridge':compact_bridge,'scope_board_evidence':evidence,'financial_page':1,'facts':parsed['facts'],'source_reporting_basis':'LATER_FILING_REPORTED_COMPARATIVE'}
        encoded=m.canonical(manifest);mh=m.sha(encoded);key=m.PREFIX+'security_id=INE987654321/period_end=2025-09-30/source_version='+mh+'/manifest.json';payload={**manifest,'r2_key':key,'r2_manifest_sha256':mh}
        source={'raw_payload':payload,'payload_hash':m.sha(m.canonical(payload)),'source_url':url,'source_record_id':'source'};objects={key:encoded,rk:review_raw,original_key:raw,bk:primary}
        class Client:
            def get_object(self,**kw):return {'Body':io.BytesIO(objects[kw['Key']])}
        observations=[{'security_id':'security','symbol':'NATCOPHARM','isin':'INE987654321','period_start':'2025-07-01','period_end':'2025-09-30','consolidation_scope':'STANDALONE','source_record_id':'source','source_code':'COMPANY_EXCHANGE_FILING','currency':'INR','evidence_status':'AVAILABLE','metric_code':k,'numeric_value':f['value'],'unit':f['unit']} for k,f in parsed['facts'].items()]
        # Exchange-inventory validation has its own existing tests; isolate it
        # here while exercising the real board/numeric/original replay.
        inventory={url:{'original_sha256':digest,'original_r2_key':original_key}}
        with patch.object(m,'bse_inventory_sources',return_value=inventory),patch('r4_ocr_dated_geometry.audit_document',return_value=audit(raw)):
            self.assertEqual(m.qualify(source,observations,Client())['facts'],parsed['facts'])
            for field,value in [('numeric_value','999'),('source_record_id','other'),('currency','USD'),('period_start','2025-04-01')]:
                changed=deepcopy(observations);changed[0][field]=value
                with self.assertRaises(ValueError):m.qualify(source,changed,Client())
            with self.assertRaises(ValueError):m.qualify(source,observations[:-1],Client())
            for k in (key,rk,original_key,bk):
                old=objects[k];objects[k]+=b' '
                with self.assertRaises(ValueError):m.qualify(source,observations,Client())
                objects[k]=old

    def test_canonical_source_payload_mutation_fails_before_r2(self):
        with self.assertRaises(ValueError):m.qualify({'raw_payload':{'contract':m.CONTRACT},'payload_hash':'0'*64},[],None)
    def test_wrong_quarter_unavailable_or_foreign_source_rejected(self):
        p={'contract':m.CONTRACT,'period_end':'2024-09-30'}
        with self.assertRaises(ValueError):m.qualify({'raw_payload':p,'payload_hash':m.sha(m.canonical(p))},[],None)

if __name__=='__main__':unittest.main()
