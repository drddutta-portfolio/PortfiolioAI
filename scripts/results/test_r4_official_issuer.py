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
        fake=types.SimpleNamespace(audit_document=lambda raw:audit,extract_dated_page=None)
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
        fake=types.SimpleNamespace(audit_document=lambda raw:audit,extract_dated_page=None)
        profile={'legal':'NATCO PHARMA LIMITED'}
        with patch.dict(o.ISSUERS,{'TEST':profile}),patch.dict(sys.modules,{'r4_ocr_dated_geometry':fake}):
            with self.assertRaisesRegex(ValueError,'TRIO_UNPROVEN'):o.extract_original(raw,'TEST','2024-09-30')

    def test_document_audit_must_be_for_exact_pdf(self):
        raw,source,rows,profile,audit,fake=self.sample();audit['original_sha256']='0'*64
        with patch.dict(o.ISSUERS,{'TEST':profile}),patch.dict(sys.modules,{'r4_ocr_dated_geometry':fake}):
            with self.assertRaisesRegex(ValueError,'AUDIT_ORIGINAL'):o.qualify(raw,source,rows)

if __name__=='__main__':unittest.main()
