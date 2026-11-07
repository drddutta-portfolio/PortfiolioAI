import unittest,io,json,base64,contextlib,importlib.util
from copy import deepcopy
from pathlib import Path
from unittest.mock import patch,Mock
import fitz
import r4_ipo_board_pdf as m
from r4_scope_board import extract_ipo_restated_with_scope_board,extract_with_scope_board,make_bridge,match_board
from r4_pdf_rotation import DeclaredRotationPage
from test_r4_scope_board import fixture,audit

NOTE='The audited restated financial information was prepared for the purpose of Initial Public Offer (IPO).'
def ipo_fixture(rotation=0,note=NOTE):
    doc,b=fixture();doc[0].insert_text((25,600),note,fontsize=8)
    if rotation:
        rotated=fitz.open();page=rotated.new_page(width=850 if rotation in (90,270) else 1000,height=1000 if rotation in (90,270) else 850)
        page.show_pdf_page(page.rect,doc,0,rotate=rotation);page.set_rotation(rotation);doc=rotated
    return doc,b

def parse(doc,b):
    raw=doc.tobytes();return extract_ipo_restated_with_scope_board(raw,1,'2024-09-30','NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',b,document_audit=audit(raw))

class IpoBoardTests(unittest.TestCase):
    def test_declared_rotation_changes_coordinates_only_and_preserves_financial_facts(self):
        baseline,b=ipo_fixture();expected,_=parse(baseline,b)
        for rotation in (90,180,270):
            doc,b=ipo_fixture(rotation);before=doc[0].get_text('words');view=DeclaredRotationPage(doc[0]);self.assertEqual([w[4:] for w in before],[w[4:] for w in view.get_text('words')])
            parsed,evidence=parse(doc,b)
            self.assertEqual({k:f['value'] for k,f in parsed['facts'].items()},{k:f['value'] for k,f in expected['facts'].items()});self.assertEqual(evidence['declared_page_rotation']['rotation_degrees'],rotation);self.assertFalse(evidence['declared_page_rotation']['amount_characters_changed'])
    def test_old_contract_still_rejects_ipo_restatement(self):
        doc,b=ipo_fixture();raw=doc.tobytes()
        with self.assertRaisesRegex(ValueError,'BUSINESS_PERIMETER'):extract_with_scope_board(raw,1,'2024-09-30','NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',b,document_audit=audit(raw))
    def test_only_explicit_audited_ipo_restatement_and_no_business_perimeter_change(self):
        for note in ('Unaudited figures restated for convenience',NOTE+' Figures recast after demerger.',NOTE+' Includes carve-out pro forma figures.',NOTE+' Common-control transaction.'):
            doc,b=ipo_fixture(note=note)
            with self.assertRaises(ValueError):parse(doc,b)
    def test_group_context_and_other_scope_reject(self):
        for extra in ('Subsidiary financial statements','Consolidated financial statements','Joint venture results'):
            doc,b=ipo_fixture(note=NOTE+' '+extra)
            with self.assertRaises(ValueError):parse(doc,b)
    def test_padded_calendar_day_is_exact_same_date_not_a_fuzzy_match(self):
        from datetime import time
        self.assertTrue(match_board('December 08, 2025 commenced at 5:00 p.m. and concluded at 5:35 p.m.','2025-12-08',time(17),time(17,35)))
        with self.assertRaises(ValueError):match_board('December 09, 2025 commenced at 5:00 p.m. and concluded at 5:35 p.m.','2025-12-08',time(17),time(17,35))
    def test_current_quarter_cannot_be_relabelled_historical(self):
        doc,b=ipo_fixture()
        with self.assertRaisesRegex(ValueError,'HISTORICAL_NONBANK'):extract_ipo_restated_with_scope_board(doc.tobytes(),1,'2025-09-30','NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',b)
    def test_complete_private_original_and_canonical_trio_replay(self):
        doc,b=ipo_fixture(90);raw=doc.tobytes();parsed,evidence=parse(doc,b);digest=m.sha(raw);primary=base64.b64decode(b['nse_original_base64']);bk=m.PREFIX+'scope-board-primary/sha256='+b['nse_original_sha256']+'/original.html';compact={**{k:v for k,v in b.items() if k!='nse_original_base64'},'nse_original_r2_key':bk}
        url='https://www.bseindia.com/xml-data/corpfiling/AttachHis/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pdf';original_key=m.PREFIX+'evidence/original_version='+digest+'/issuer-original.pdf';review={'bse_identity':{'issuer_name':'NATCO PHARMA LIMITED'}};rb=m.canonical(review);rh=m.sha(rb);rk=m.PREFIX+'bse-dated-pdf-review/sha256='+rh+'/capture.json'
        manifest={'contract':m.CONTRACT,'symbol':'NATCOPHARM','isin':'INE987654321','security_id':'security','issuer_name':'NATCO PHARMA LIMITED','period_start':'2024-07-01','period_end':'2024-09-30','consolidation_scope':'STANDALONE','reporting_currency':'INR','issuer_filing_url':url,'original_sha256':digest,'original_r2_key':original_key,'original_pdf_retained':True,'raw_bse_bytes_retained':True,'bse_identity_reference':{'sha256':rh,'r2_key':rk},'scope_bridge':compact,'scope_board_evidence':evidence,'financial_page':1,'facts':parsed['facts'],'source_reporting_basis':'AUDITED_IPO_RESTATED_COMPARATIVE','comparison_basis_unproven':True,'share_or_eps_adjustment_authorized':False}
        encoded=m.canonical(manifest);mh=m.sha(encoded);key=m.PREFIX+'security_id=INE987654321/period_end=2024-09-30/source_version='+mh+'/manifest.json';payload={**manifest,'r2_key':key,'r2_manifest_sha256':mh};source={'raw_payload':payload,'payload_hash':m.sha(m.canonical(payload)),'source_url':url,'source_record_id':'source'};objects={key:encoded,rk:rb,bk:primary,original_key:raw}
        class Client:
            def get_object(self,**kw):return {'Body':io.BytesIO(objects[kw['Key']])}
        obs=[{'security_id':'security','symbol':'NATCOPHARM','isin':'INE987654321','period_start':'2024-07-01','period_end':'2024-09-30','consolidation_scope':'STANDALONE','source_record_id':'source','source_code':'COMPANY_EXCHANGE_FILING','currency':'INR','evidence_status':'AVAILABLE','metric_code':k,'numeric_value':f['value'],'unit':f['unit']} for k,f in parsed['facts'].items()]
        with patch.object(m,'bse_inventory_sources',return_value={url:{'original_sha256':digest,'original_r2_key':original_key}}),patch('r4_ocr_dated_geometry.audit_document',return_value=audit(raw)):
            self.assertEqual(m.qualify(source,obs,Client())['facts'],parsed['facts'])
            spec=importlib.util.spec_from_file_location('ipo_transport',Path(__file__).with_name('r4-ipo-board-recovery.py'));collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)
            writes=[]
            class Cursor:
                def __enter__(self):return self
                def __exit__(self,*args):pass
                def execute(self,query,args):writes.append((query,args))
                def fetchone(self):return ('source',)
            class Database:
                def cursor(self):return Cursor()
                def commit(self):pass
            src={'source_url':url,'original_sha256':digest,'original_r2_key':original_key,'bse_identity_reference':{'sha256':rh,'r2_key':rk}};identity={'issuer_name':'NATCO PHARMA LIMITED'};anchor={'bridge':b,'period':'2025-09-30'}
            groups,rejections=collector.replay(raw,src,identity,'NATCOPHARM','INE987654321',['2024-09-30'],[anchor]);self.assertEqual(len(groups['2024-09-30']),1);self.assertEqual(rejections,{})
            with patch.object(collector.batch,'immutable_put',side_effect=lambda client,key,body:objects.setdefault(key,body)):
                count=collector.persist(Database(),Client(),'security','NATCOPHARM','INE987654321','2024-09-30',identity,src,parsed,evidence,anchor)
            self.assertEqual(count,3);saved=next(args for query,args in writes if 'INSERT INTO data_source_records' in query);persisted={**source,'raw_payload':json.loads(saved[4]),'payload_hash':saved[3]}
            self.assertEqual(m.qualify(persisted,obs,Client())['facts'],parsed['facts'])
            for field,value in (('numeric_value','999'),('unit','INR_LAKH'),('period_start','2024-04-01'),('source_record_id','other')):
                changed=deepcopy(obs);changed[0][field]=value
                with self.assertRaises(ValueError):m.qualify(source,changed,Client())
            with self.assertRaises(ValueError):m.qualify(source,obs[:-1],Client())
            for key in objects:
                previous=objects[key];objects[key]+=b' '
                with self.assertRaises(ValueError):m.qualify(source,obs,Client())
                objects[key]=previous
    def test_collector_import_and_persistence_use_same_deployed_contract(self):
        spec=importlib.util.spec_from_file_location('ipo_collector',Path(__file__).with_name('r4-ipo-board-recovery.py'));collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector);self.assertEqual(collector.CONTRACT,m.CONTRACT);self.assertEqual(collector.PERIODS,m.PERIODS)

if __name__=='__main__':unittest.main()
