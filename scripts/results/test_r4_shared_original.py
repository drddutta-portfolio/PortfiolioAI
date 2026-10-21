import hashlib,json,unittest
from copy import deepcopy
from unittest.mock import patch
from test_r4_pdf_geometry import fixture
from r4_pdf_geometry import extract_page
from r4_shared_original import PROFILES,context,qualify

def sample():
    doc,page=fixture(first='30.09.2025',third='30.09.2024')
    page.insert_text((25,300),'Issuer identity marker 123456',fontsize=10)
    raw=doc.tobytes();digest=hashlib.sha256(raw).hexdigest();url='https://issuer.example/original.pdf'
    profile={'symbol':'NATCOPHARM','isin':'INE987654321','legal':'NATCO PHARMA LIMITED','identity_marker':'123456','bank':False,'originals':{'2024-09-30':(digest,url)},'periods':{'2024-09-30':'2024-07-01'}}
    payload={'contract':'TEST_ORIGINAL','issuer':profile['symbol'],'isin':profile['isin'],'scope':'CONSOLIDATED','sourceUrl':url,'sourceOriginalSHA256':digest}
    source={'source_record_id':'source','raw_payload':payload,'source_url':url,'payload_hash':hashlib.sha256(json.dumps(payload,separators=(',',':'),sort_keys=True).encode()).hexdigest()}
    facts=extract_page(page,1,'2024-09-30',allow_comparative=True)['facts']
    rows=[{'id':metric,'symbol':profile['symbol'],'isin':profile['isin'],'source_record_id':'source','period_end':'2024-09-30','period_start':'2024-07-01','currency':'INR','consolidation_scope':'CONSOLIDATED','evidence_status':'AVAILABLE','metric_code':metric,'numeric_value':fact['value'],'unit':fact['unit']} for metric,fact in facts.items()]
    return raw,source,rows,profile

class SharedOriginalTests(unittest.TestCase):
    def test_existing_complete_trio_requires_actual_original_replay(self):
        raw,source,rows,p=sample()
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}):self.assertEqual(len(qualify(raw,source,rows)['eligible_observation_ids']),3)
    def test_changed_observation_does_not_admit_any_of_the_trio(self):
        raw,source,rows,p=sample();rows[0]['numeric_value']='999'
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}):self.assertEqual(qualify(raw,source,rows)['eligible_observation_ids'],[])
    def test_partial_trio_is_not_admitted(self):
        raw,source,rows,p=sample()
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}):self.assertEqual(qualify(raw,source,rows[:2])['eligible_observation_ids'],[])
    def test_changed_original_hash_is_rejected(self):
        raw,source,rows,p=sample()
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}),self.assertRaisesRegex(ValueError,'HASH_MISMATCH'):qualify(raw+b'changed',source,rows)
    def test_wrong_company_or_period_cannot_reuse_a_proof(self):
        for field,value in [('isin','WRONG'),('period_end','2024-12-31'),('source_record_id','other-source')]:
            raw,source,rows,p=sample();rows[0][field]=value
            with patch.dict(PROFILES,{'TEST_ORIGINAL':p}),self.assertRaises(ValueError):qualify(raw,source,rows)
    def test_unsupported_review_contract_is_not_authority(self):
        raw,source,rows,p=sample()
        with self.assertRaisesRegex(ValueError,'UNSUPPORTED'):context(source)
    def test_mutated_payload_is_rejected(self):
        raw,source,rows,p=sample();source['raw_payload']['extra']='changed'
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}),self.assertRaisesRegex(ValueError,'PAYLOAD_HASH'):context(source)


class RenderedOriginalTests(unittest.TestCase):
    def test_failed_native_requires_independent_render_and_exact_existing_cells(self):
        raw,source,rows,p=sample();p['ocr_page']=1
        facts={r['metric_code']:{'value':r['numeric_value'],'unit':r['unit']} for r in rows}
        rendered={'scope':'CONSOLIDATED','first_column_period':'2024-09-30','facts':facts}
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}),patch('r4_shared_original.extract_page',side_effect=ValueError('UNREADABLE')),patch('r4_shared_original.rendered_facts',return_value=rendered):
            self.assertEqual(len(qualify(raw,source,rows)['eligible_observation_ids']),3)
            rows[0]['numeric_value']='999'
            self.assertEqual(qualify(raw,source,rows)['eligible_observation_ids'],[])

    def test_render_disagreement_cannot_be_approved_by_existing_values(self):
        raw,source,rows,p=sample();p['ocr_page']=1
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}),patch('r4_shared_original.extract_page',side_effect=ValueError('UNREADABLE')),patch('r4_shared_original.rendered_facts',side_effect=ValueError('OCR_DISAGREEMENT')):
            self.assertEqual(qualify(raw,source,rows)['eligible_observation_ids'],[])

class RenderedIssuerIdentityTests(unittest.TestCase):
    def test_both_original_renders_must_prove_issuer_and_registry_marker(self):
        raw,source,rows,p=sample();p['ocr_page']=1;p['identity_marker']='NOTONCOVER'
        facts={r['metric_code']:{'value':r['numeric_value'],'unit':r['unit']} for r in rows}
        parsed={'scope':'CONSOLIDATED','first_column_period':'2024-09-30','facts':facts,
            '_rendered_issuer_texts':['NATCO PHARMA LIMITED NOTONCOVER']*2}
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}),patch('r4_shared_original.rendered_facts',return_value=parsed):
            self.assertEqual(len(qualify(raw,source,rows)['eligible_observation_ids']),3)
            parsed['_rendered_issuer_texts'][1]='OTHER COMPANY LIMITED NOTONCOVER'
            with self.assertRaisesRegex(ValueError,'ISSUER_UNPROVEN'):qualify(raw,source,rows)

    def test_rendered_name_without_registry_marker_is_insufficient(self):
        raw,source,rows,p=sample();p['ocr_page']=1;p['identity_marker']='NOTONCOVER'
        parsed={'_rendered_issuer_texts':['NATCO PHARMA LIMITED']*2}
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}),patch('r4_shared_original.rendered_facts',return_value=parsed):
            with self.assertRaisesRegex(ValueError,'ISSUER_UNPROVEN'):qualify(raw,source,rows)

    def test_standalone_profile_requires_standalone_observations_and_table(self):
        raw,source,rows,p=sample();p['scope']='STANDALONE';p['ocr_page']=1
        source['raw_payload']['scope']='STANDALONE'
        source['payload_hash']=hashlib.sha256(json.dumps(source['raw_payload'],separators=(',',':'),sort_keys=True).encode()).hexdigest()
        for r in rows:r['consolidation_scope']='STANDALONE'
        facts={r['metric_code']:{'value':r['numeric_value'],'unit':r['unit']} for r in rows}
        rendered={'scope':'STANDALONE','first_column_period':'2024-09-30','facts':facts}
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}),patch('r4_shared_original.extract_page',side_effect=ValueError('UNREADABLE')),patch('r4_shared_original.rendered_facts',return_value=rendered):
            self.assertEqual(len(qualify(raw,source,rows)['eligible_observation_ids']),3)
            rendered['scope']='CONSOLIDATED'
            self.assertEqual(qualify(raw,source,rows)['eligible_observation_ids'],[])

class VisualOriginalReviewTests(unittest.TestCase):
    def reviewed(self):
        import fitz
        raw,source,rows,p=sample()
        with fitz.open(stream=raw,filetype='pdf') as pdf:
            image=pdf[0].get_pixmap(dpi=110,alpha=False).tobytes('jpeg',jpg_quality=65)
        facts={r['metric_code']:{'value':r['numeric_value'],'unit':r['unit']} for r in rows}
        p['visual_reviews']={'2024-09-30':{'page':1,'dpi':110,'jpeg_quality':65,
            'image_sha256':hashlib.sha256(image).hexdigest(),'scope':'CONSOLIDATED','facts':facts}}
        return raw,source,rows,p

    def test_independent_visual_review_reopens_exact_inspected_original_image(self):
        raw,source,rows,p=self.reviewed()
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}),patch('r4_shared_original.extract_page',side_effect=ValueError('CORRUPT_NATIVE_TEXT')):
            self.assertEqual(len(qualify(raw,source,rows)['eligible_observation_ids']),3)
            rows[0]['numeric_value']='999'
            self.assertEqual(qualify(raw,source,rows)['eligible_observation_ids'],[])

    def test_changed_page_image_cannot_reuse_a_visual_review(self):
        raw,source,rows,p=self.reviewed()
        p['visual_reviews']['2024-09-30']['image_sha256']='0'*64
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}):
            with self.assertRaisesRegex(ValueError,'IMAGE_CHANGED'):qualify(raw,source,rows)

    def test_visual_review_cannot_change_reporting_scope(self):
        raw,source,rows,p=self.reviewed()
        p['visual_reviews']['2024-09-30']['scope']='STANDALONE'
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}):
            with self.assertRaisesRegex(ValueError,'SCOPE_MISMATCH'):qualify(raw,source,rows)

class ReviewedImageReplayEfficiency(VisualOriginalReviewTests):
    def test_reviewed_image_does_not_wait_on_unusable_whole_page_ocr(self):
        raw,source,rows,p=self.reviewed();p['ocr_page']=1
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}),patch('r4_shared_original.extract_page',side_effect=ValueError('UNREADABLE')),patch('r4_shared_original.rendered_facts',side_effect=AssertionError('UNNECESSARY_OCR')):
            self.assertEqual(len(qualify(raw,source,rows)['eligible_observation_ids']),3)

class ReviewedIssuerImageIdentity(VisualOriginalReviewTests):
    def test_inspected_exact_issuer_page_can_prove_image_backed_legal_identity(self):
        raw,source,rows,p=self.reviewed();p['ocr_page']=1
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}),patch('r4_shared_original.exact_legal_identity',return_value=False),patch('r4_shared_original.extract_page',side_effect=ValueError('IMAGE_BACKED')),patch('r4_shared_original.rendered_facts',side_effect=AssertionError('UNNECESSARY_OCR')):
            self.assertEqual(len(qualify(raw,source,rows)['eligible_observation_ids']),3)

    def test_restated_comparative_stays_excluded_before_ocr(self):
        import fitz
        raw,source,rows,p=sample();p['ocr_page']=1
        with fitz.open(stream=raw,filetype='pdf') as pdf:
            pdf[0].insert_text((25,340),'Previous period figures have been restated',fontsize=10)
            raw=pdf.tobytes()
        digest=hashlib.sha256(raw).hexdigest()
        p['originals']={'2024-12-31':(digest,source['source_url'])}
        source['raw_payload']['sourceOriginalSHA256']=digest
        source['payload_hash']=hashlib.sha256(json.dumps(source['raw_payload'],separators=(',',':'),sort_keys=True).encode()).hexdigest()
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}),patch('r4_shared_original.rendered_facts',side_effect=AssertionError('RESTATED_COMPARATIVE_MUST_STAY_EXCLUDED')):
            self.assertEqual(qualify(raw,source,rows)['eligible_observation_ids'],[])

class ReviewedCoverScope(VisualOriginalReviewTests):
    def test_visual_quarter_review_cannot_override_missing_signed_cover_scope(self):
        raw,source,rows,p=self.reviewed();p['required_cover_scope']='audited standalone financial results'
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}):
            with self.assertRaisesRegex(ValueError,'COVER_SCOPE_UNPROVEN'):qualify(raw,source,rows)

class RenderPairRecovery(unittest.TestCase):
    def test_bad_first_render_pair_does_not_block_other_approved_pairs(self):
        import sys,types
        from unittest.mock import Mock
        from r4_shared_original import rendered_facts
        extractor=Mock(side_effect=[ValueError('DAMAGED_HEADER'),({'facts':{}},{'issuer_text_first':'ISSUER','issuer_text_second':'ISSUER'})])
        module=types.SimpleNamespace(RENDER_PAIRS=((300,450),(200,400),(350,500)),extract_dated_page=extractor)
        with patch.dict(sys.modules,{'r4_ocr_dated_geometry':module}):
            result=rendered_facts(b'original',6,'2024-12-31')
        self.assertEqual(result['_rendered_issuer_texts'],['ISSUER','ISSUER'])
        self.assertEqual(extractor.call_args_list[1].kwargs['render_dpi'],(200,400))

    def test_all_failed_pairs_remain_unqualified(self):
        import sys,types
        from unittest.mock import Mock
        from r4_shared_original import rendered_facts
        extractor=Mock(side_effect=ValueError('NO_PROVEN_TABLE'))
        module=types.SimpleNamespace(RENDER_PAIRS=((300,450),(200,400),(350,500)),extract_dated_page=extractor)
        with patch.dict(sys.modules,{'r4_ocr_dated_geometry':module}):
            with self.assertRaisesRegex(ValueError,'UNPROVEN'):rendered_facts(b'original',6,'2024-12-31')
        self.assertEqual(extractor.call_count,9)

    def test_exact_source_comparative_warning_cannot_be_lost_by_native_ocr(self):
        raw,source,rows,p=sample();p['ocr_page']=1
        p['blocked_comparatives']={'2024-09-30':'RESTATED_COMPARATIVE'}
        with patch.dict(PROFILES,{'TEST_ORIGINAL':p}),patch('r4_shared_original.rendered_facts',side_effect=AssertionError('BLOCKED_COMPARATIVE')):
            self.assertEqual(qualify(raw,source,rows)['eligible_observation_ids'],[])

if __name__=='__main__':unittest.main()

