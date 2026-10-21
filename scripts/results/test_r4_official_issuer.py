import copy,hashlib,json,sys,types,unittest
from unittest.mock import patch
from test_r4_pdf_geometry import fixture
import r4_official_issuer as o

class OfficialIssuerReplay(unittest.TestCase):
    def sample(self):
        pdf,page=fixture(first='30.09.2024',third='30.09.2023')
        raw=pdf.tobytes();pdf.close();digest=o.sha(raw)
        profile={'legal':'NATCO PHARMA LIMITED','hosts':['issuer.example'],'pages':[],'originals':[]}
        audit={'original_sha256':digest,'text_sha256':'a'*64,'pages':['Complete original statement notes']}
        fake=types.SimpleNamespace(audit_document=lambda raw,**kwargs:audit,extract_dated_page=None)
        with patch.dict(o.ISSUERS,{'TEST':profile}),patch.dict(sys.modules,{'r4_ocr_dated_geometry':fake}):
            parsed=o.extract_original(raw,'TEST','2024-09-30')[0]
        payload={'contract':o.CONTRACT,'symbol':'TEST','isin':'ISIN','sourceUrl':'https://issuer.example/q.pdf',
            'original_sha256':digest,'original_r2_key':o.PREFIX+'evidence/original_version='+digest+'/issuer-original.pdf',
            'period_end':'2024-09-30','parsed':parsed}
        source={'source_record_id':'source','source_url':payload['sourceUrl'],'raw_payload':payload,'payload_hash':o.sha(o.canonical(payload))}
        rows=[{'id':k,'symbol':'TEST','isin':'ISIN','source_record_id':'source','period_start':'2024-07-01','period_end':'2024-09-30',
            'consolidation_scope':parsed['scope'],'currency':'INR','source_code':'COMPANY_EXCHANGE_FILING','evidence_status':'AVAILABLE',
            'metric_code':k,'numeric_value':f['value'],'unit':f['unit']} for k,f in parsed['facts'].items()]
        return raw,source,rows,profile,audit,fake

    def test_original_replay_proves_same_quarter_trio(self):
        raw,source,rows,profile,audit,fake=self.sample()
        with patch.dict(o.ISSUERS,{'TEST':profile}),patch.dict(sys.modules,{'r4_ocr_dated_geometry':fake}):
            self.assertEqual(len(o.qualify(raw,source,rows)['eligible_observation_ids']),3)

    def test_source_url_cannot_escape_closed_official_hosts(self):
        profile={'hosts':['issuer.example'],'originals':[]}
        with patch.dict(o.ISSUERS,{'TEST':profile}):
            for url in ['http://issuer.example/q.pdf','https://issuer.example.evil.test/q.pdf','https://user@issuer.example/q.pdf','https://issuer.example:8443/q.pdf']:
                with self.assertRaises(ValueError):o.approved_url('TEST',url)

    def test_changed_pdf_and_payload_are_rejected(self):
        for change in ('pdf','payload'):
            raw,source,rows,profile,audit,fake=self.sample()
            if change=='pdf':raw+=b'changed'
            else:source['raw_payload']['isin']='OTHER'
            with patch.dict(o.ISSUERS,{'TEST':profile}),patch.dict(sys.modules,{'r4_ocr_dated_geometry':fake}):
                with self.assertRaises(ValueError):o.qualify(raw,source,rows)

    def test_wrong_quarter_scope_identity_units_or_values_are_rejected(self):
        for field,value in [('period_start','2024-04-01'),('consolidation_scope','STANDALONE'),('isin','OTHER'),('unit','INR_LAKH'),('numeric_value','999'),('source_record_id','OTHER')]:
            raw,source,rows,profile,audit,fake=self.sample();rows[0][field]=value
            with patch.dict(o.ISSUERS,{'TEST':profile}),patch.dict(sys.modules,{'r4_ocr_dated_geometry':fake}):
                with self.assertRaises(ValueError):o.qualify(raw,source,rows)

    def test_incomplete_or_duplicate_core_trio_cannot_be_selected(self):
        for indices in ((0,1),(0,0,1)):
            raw,source,rows,profile,audit,fake=self.sample();rows=[rows[i] for i in indices]
            with patch.dict(o.ISSUERS,{'TEST':profile}),patch.dict(sys.modules,{'r4_ocr_dated_geometry':fake}):
                with self.assertRaises(ValueError):o.qualify(raw,source,rows)

    def test_document_wide_carveout_note_blocks_even_native_table(self):
        raw,source,rows,profile,audit,fake=self.sample();audit['pages']=['Financial statements are carve-out financials']
        with patch.dict(o.ISSUERS,{'TEST':profile}),patch.dict(sys.modules,{'r4_ocr_dated_geometry':fake}):
            with self.assertRaisesRegex(ValueError,'CARVEOUT'):o.qualify(raw,source,rows)

    def test_restated_later_comparative_does_not_become_own_quarter(self):
        pdf,page=fixture(first='30.09.2025',third='30.09.2024');raw=pdf.tobytes();pdf.close()
        audit={'original_sha256':o.sha(raw),'text_sha256':'a'*64,'pages':['The comparative was restated']}
        fake=types.SimpleNamespace(audit_document=lambda raw,**kwargs:audit,extract_dated_page=None)
        profile={'legal':'NATCO PHARMA LIMITED'}
        with patch.dict(o.ISSUERS,{'TEST':profile}),patch.dict(sys.modules,{'r4_ocr_dated_geometry':fake}):
            with self.assertRaisesRegex(ValueError,'TRIO_UNPROVEN'):o.extract_original(raw,'TEST','2024-09-30')

    def test_document_audit_must_be_for_exact_pdf(self):
        raw,source,rows,profile,audit,fake=self.sample();audit['original_sha256']='0'*64
        with patch.dict(o.ISSUERS,{'TEST':profile}),patch.dict(sys.modules,{'r4_ocr_dated_geometry':fake}):
            with self.assertRaisesRegex(ValueError,'AUDIT_ORIGINAL'):o.qualify(raw,source,rows)

    def test_retrospective_share_basis_or_reclassified_revenue_requires_policy_decision(self):
        for note in ('EPS adjusted to consider the retrospective impact of the share split and bonus',
                     'Company regrouped interest income from "Revenue from Operations" to "Other Income"'):
            pdf,page=fixture(first='30.09.2025',third='30.09.2024');raw=pdf.tobytes();pdf.close()
            audit={'original_sha256':o.sha(raw),'text_sha256':'a'*64,'pages':[note]}
            fake=types.SimpleNamespace(audit_document=lambda raw,**kwargs:audit,extract_dated_page=None)
            with patch.dict(o.ISSUERS,{'TEST':{'legal':'NATCO PHARMA LIMITED'}}),patch.dict(sys.modules,{'r4_ocr_dated_geometry':fake}):
                with self.assertRaisesRegex(ValueError,'TRIO_UNPROVEN'):o.extract_original(raw,'TEST','2024-09-30')

    def test_scanned_cover_identity_can_be_read_from_full_original_audit(self):
        import fitz
        table,page=fixture(first='30.09.2024',third='30.09.2023')
        with fitz.open() as pdf:
            for _ in range(3):pdf.new_page()
            pdf.insert_pdf(table);raw=pdf.tobytes()
        table.close()
        audit={'original_sha256':o.sha(raw),'text_sha256':'a'*64,'pages':['NATCO PHARMA LIMITED','Auditor report','Original cover','Financial table']}
        fake=types.SimpleNamespace(audit_document=lambda raw,**kwargs:audit,extract_dated_page=None)
        with patch.dict(o.ISSUERS,{'TEST':{'legal':'NATCO PHARMA LIMITED'}}),patch.dict(sys.modules,{'r4_ocr_dated_geometry':fake}):
            self.assertEqual(len(o.extract_original(raw,'TEST','2024-09-30')),1)
            audit['pages'][0]='OTHER COMPANY LIMITED'
            with self.assertRaisesRegex(ValueError,'IDENTITY_UNPROVEN'):o.extract_original(raw,'TEST','2024-09-30')

    def test_reported_other_isin_cannot_be_silently_rebound_to_current_security(self):
        import fitz
        raw,source,rows,profile,audit,fake=self.sample()
        with fitz.open(stream=raw,filetype='pdf') as pdf:
            pdf[0].insert_text((25,520),'Equity ISIN INE111A01011',fontsize=10);raw=pdf.tobytes()
        digest=o.sha(raw);source['raw_payload']['original_sha256']=digest
        source['raw_payload']['original_r2_key']=o.PREFIX+'evidence/original_version='+digest+'/issuer-original.pdf'
        source['payload_hash']=o.sha(o.canonical(source['raw_payload']));audit['original_sha256']=digest
        with patch.dict(o.ISSUERS,{'TEST':profile}),patch.dict(sys.modules,{'r4_ocr_dated_geometry':fake}):
            with self.assertRaisesRegex(ValueError,'ISIN_REQUIRES_EXPLICIT_BRIDGE'):o.qualify(raw,source,rows)

class OfficialSourceTransport(unittest.TestCase):
    def test_resume_advances_to_other_issuers_after_an_interrupted_original(self):
        rows=[('A',1),('B',2),('C',3)]
        self.assertEqual(o.resume_issuer_order(rows,'B'),[('C',3),('A',1),('B',2)])
        self.assertEqual(o.resume_issuer_order(rows,'C'),rows)
        self.assertEqual(o.resume_issuer_order(rows,'REMOVED'),rows)

    class Response:
        def __init__(self,body=b'',status=200,location=None):
            self.body=body;self.status_code=status;self.headers={'Location':location} if location else {}
        def __enter__(self):return self
        def __exit__(self,*args):return False
        def raise_for_status(self):
            if self.status_code>=400:raise OSError('HTTP_FAILURE')
        def iter_content(self,size):yield self.body

    def test_foreign_first_pdf_does_not_hide_later_official_statement(self):
        body=b'<a href="https://other.example/results.pdf">Results 2024</a><a href="/results-2024.pdf">Financial results 2024</a>'
        profile={'hosts':['issuer.example'],'pages':['https://issuer.example/investors'],'originals':[]}
        session=types.SimpleNamespace(get=lambda *args,**kwargs:self.Response(body))
        with patch.dict(o.ISSUERS,{'TEST':profile}):urls,errors=o.discover(session,'TEST')
        self.assertEqual(urls,['https://issuer.example/results-2024.pdf'])
        self.assertGreaterEqual(errors['UNAPPROVED_DISCOVERY_LINK_SKIPPED'],1)

    def test_unapproved_redirect_is_rejected_before_outbound_request(self):
        calls=[]
        def get(url,**kwargs):calls.append(url);return self.Response(status=302,location='https://other.example/results.pdf')
        with patch.dict(o.ISSUERS,{'TEST':{'hosts':['issuer.example'],'originals':[]}}):
            with self.assertRaises(ValueError):o.get(types.SimpleNamespace(get=get),'TEST','https://issuer.example/results.pdf',1000)
        self.assertEqual(calls,['https://issuer.example/results.pdf'])

    def test_failed_discovery_page_does_not_block_next_page(self):
        def get(url,**kwargs):return self.Response(status=503) if url.endswith('/bad') else self.Response(b'<a href="/quarter-2024.pdf">Quarter results</a>')
        profile={'hosts':['issuer.example'],'pages':['https://issuer.example/bad','https://issuer.example/good'],'originals':[]}
        with patch.dict(o.ISSUERS,{'TEST':profile}):urls,errors=o.discover(types.SimpleNamespace(get=get),'TEST')
        self.assertEqual(urls,['https://issuer.example/quarter-2024.pdf']);self.assertEqual(errors['DISCOVERY_OSError'],1)

    def test_response_size_bound_cannot_be_silently_exceeded(self):
        session=types.SimpleNamespace(get=lambda *args,**kwargs:self.Response(b'x'*101))
        with patch.dict(o.ISSUERS,{'TEST':{'hosts':['issuer.example'],'originals':[]}}):
            with self.assertRaisesRegex(ValueError,'SIZE_BOUND'):o.get(session,'TEST','https://issuer.example/results.pdf',100)

class OriginalShareIdentity(unittest.TestCase):
    sample=OfficialIssuerReplay.sample
    def notice(self,authority):
        import fitz
        with fitz.open() as pdf:
            page=pdf.new_page(width=1200,height=800)
            for y,line in enumerate([authority['circular'],authority['date_text'],authority['row'],'METROPOLITAN STOCK EXCHANGE OF INDIA LIMITED']):
                page.insert_text((25,40+y*25),line,fontsize=9)
            return pdf.tobytes()

    def test_exact_exchange_original_binds_old_and_new_identity_without_rebasing_eps(self):
        import fitz
        raw,source,rows,profile,audit,fake=self.sample()
        old='INE111A01011';new='INE222A01011'
        authority={'url':'https://www.msei.in/exact.pdf','old_isin':old,'current_isin':new,'ex_date':'2025-06-04',
            'circular':'TEST/1','date_text':'JUNE 04, 2025','row':'TEST NATCO PHARMA LIMITED '+old+' '+new+' SUB-DIVISION FROM RS. 10/- TO RS. 2/-'}
        with fitz.open(stream=raw,filetype='pdf') as pdf:
            pdf[0].insert_text((25,520),'Equity ISIN '+old,fontsize=10);raw=pdf.tobytes()
        digest=o.sha(raw);source['raw_payload'].update(isin=new,original_sha256=digest,original_r2_key=o.PREFIX+'evidence/original_version='+digest+'/issuer-original.pdf')
        for row in rows:row['isin']=new
        audit['original_sha256']=digest;notice=self.notice(authority)
        with patch.dict(o.ISSUERS,{'TEST':profile}),patch.dict(o.SPLIT_AUTHORITIES,{'TEST':authority}),patch.dict(sys.modules,{'r4_ocr_dated_geometry':fake}):
            source['raw_payload']['isin_bridge']=o.split_reference(notice,'TEST');source['payload_hash']=o.sha(o.canonical(source['raw_payload']))
            before=copy.deepcopy(rows)
            self.assertEqual(len(o.qualify(raw,source,rows,notice)['eligible_observation_ids']),3)
            self.assertEqual(rows,before)
            with self.assertRaisesRegex(ValueError,'SPLIT_ORIGINAL_REPLAY'):o.qualify(raw,source,rows)

    def test_different_original_notice_cannot_supply_identity(self):
        authority=o.SPLIT_AUTHORITIES['COFORGE'];notice=self.notice(authority)
        self.assertEqual(o.split_reference(notice,'COFORGE')['old_isin'],'INE591G01017')
        for field,value in [('date_text','JUNE 05, 2025'),('row',authority['row'].replace('INE591G01017','INE000A01011'))]:
            wrong={**authority,field:value}
            with self.assertRaisesRegex(ValueError,'CONTEXT_UNPROVEN'):o.split_reference(self.notice(wrong),'COFORGE')

if __name__=='__main__':unittest.main()
