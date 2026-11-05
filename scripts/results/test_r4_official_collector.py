"""Collector entry-point integration; the workflow installs its real SDK imports."""
import importlib.util
from pathlib import Path
from unittest import TestCase,main
from unittest.mock import patch
import types
import tempfile
import fitz

spec=importlib.util.spec_from_file_location('official_collector',Path(__file__).with_name('r4-official-issuer-recovery.py'))
collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)

class CollectorTransportIntegration(TestCase):
    def test_locally_verified_original_is_tried_before_unproven_candidates(self):
        profile={'originals':['https://issuer.example/proven.pdf','https://issuer.example/other.pdf'],
                 'verified_originals':['https://issuer.example/proven.pdf','https://issuer.example/not-pinned.pdf']}
        retained={'https://issuer.example/bse.pdf':{'candidate_priority':0}}
        discovered=profile['originals']+['https://issuer.example/not-pinned.pdf']
        with patch.dict(collector.ISSUERS,{'TEST':profile}):
            urls=collector.prioritize_originals('TEST',discovered,retained)
        self.assertEqual(urls[:2],['https://issuer.example/proven.pdf','https://issuer.example/bse.pdf'])
        self.assertEqual(len(urls),len(set(urls)))

    def test_statutory_title_regions_require_same_explicit_method_on_replay(self):
        from unittest.mock import Mock
        with fitz.open() as pdf:
            page=pdf.new_page()
            page.insert_text((20,30),'JASH ENGINEERING LIMITED')
            page.insert_text((20,60),'Statement of Consolidated Profit and Loss')
            page.insert_text((20,90),'Revenue from operations and diluted EPS')
            raw=pdf.tobytes()
        period='2024-09-30'
        parsed={'ocr_render_dpi':[300,450],'ocr_segmentation_mode':3}
        proof=Mock(return_value={period:{'parsed':parsed}})
        replay=Mock(side_effect=[ValueError('NATIVE_UNPROVEN'),[{'independently_replayed':True}]])
        with patch('r4_ocr_dated_geometry.audit_document',return_value={'pages':['']}), \
             patch('r4_ocr_dated_geometry.extract_dated_periods',proof), \
             patch.object(collector,'extract_original',replay):
            result=collector.extract_all(raw,'JASH',[period])
        proof.assert_called_once()
        self.assertEqual(proof.call_args.args[:2],(raw,1))
        self.assertEqual(proof.call_args.kwargs,{'header_region':True,'label_region':True})
        self.assertEqual(replay.call_args.args[3],'OCR_REGIONS')
        self.assertEqual(result['periods'][period],[{'independently_replayed':True}])

    def test_agreeing_native_and_two_rendered_headers_skip_only_absent_periods(self):
        import r4_ocr_dated_geometry as dated
        from test_r4_pdf_geometry import fixture
        pdf,page=fixture();raw=pdf.tobytes()
        with patch.object(dated,'render_page',side_effect=lambda p,d,m:p) as render, \
             patch.object(dated,'extract_page',side_effect=AssertionError('No financial parsing needed for absent quarter')):
            result=dated.extract_dated_periods(raw,1,['2025-03-31'])
        self.assertEqual(render.call_count,2)
        self.assertEqual(result['2025-03-31']['rejection'],'PERIOD_NOT_PRESENT_IN_THREE_WAY_REPLAYED_DATED_HEADERS')

    def test_disagreeing_or_incomplete_headers_preserve_all_render_attempts(self):
        import r4_ocr_dated_geometry as dated
        from test_r4_pdf_geometry import fixture
        pdf,page=fixture();raw=pdf.tobytes()
        native=frozenset({('2024-09-30','2024-06-30','2023-09-30')})
        other=frozenset({('2025-03-31','2024-06-30','2023-09-30')})
        for first,rendered in ((native,other),(None,native)):
            with self.subTest(native=first), \
                 patch.object(dated,'complete_header_dates',side_effect=[first]+[rendered,native]*9), \
                 patch.object(dated,'render_page',side_effect=lambda p,d,m:p) as render, \
                 patch.object(dated,'extract_page',side_effect=ValueError('NO_PROVEN_GEOMETRIC_QUARTER_TABLE')):
                result=dated.extract_dated_periods(raw,1,['2025-03-31'])
            self.assertEqual(render.call_count,18)
            self.assertEqual(result['2025-03-31']['rejection'],'NO_PROVEN_GEOMETRIC_QUARTER_TABLE')

    def test_present_period_is_never_removed_by_header_absence_check(self):
        import r4_ocr_dated_geometry as dated
        from test_r4_pdf_geometry import fixture
        pdf,page=fixture();raw=pdf.tobytes()
        with patch.object(dated,'render_page',side_effect=lambda p,d,m:p) as render, \
             patch.object(dated,'extract_page',side_effect=ValueError('FINANCIAL_REPLAY_REQUIRED')):
            result=dated.extract_dated_periods(raw,1,['2024-09-30'])
        self.assertEqual(render.call_count,18)
        self.assertEqual(result['2024-09-30']['rejection'],'FINANCIAL_REPLAY_REQUIRED')

    def test_unconfigured_recovery_still_covers_every_issuer(self):
        rows=[('SANSERA',),('SSWL',),('JASH',)]
        self.assertEqual(collector.target_cohort(rows,''),rows)

    def test_verified_targets_do_not_change_normal_cohort_or_invent_closed_gaps(self):
        rows=[('SANSERA',),('SSWL',),('JASH',)]
        self.assertEqual(collector.target_cohort(rows,'SANSERA,SSWL'),rows[:2])
        self.assertEqual(collector.target_cohort(rows,'IGL'),[])
        with self.assertRaisesRegex(ValueError,'UNAPPROVED_TARGET_ISSUERS'):
            collector.target_cohort(rows,'UNKNOWN')

    def identity_original(self,text):
        with fitz.open() as pdf:
            pdf.new_page().insert_text((40,40),text)
            return pdf.tobytes()

    def test_native_identity_prefilter_does_not_render_or_qualify(self):
        raw=self.identity_original('JASH ENGINEERING LIMITED')
        with patch('r4_ocr_geometry.OCRPage',side_effect=AssertionError('unneeded OCR')):
            self.assertIsNone(collector.preflight_identity(raw,'JASH'))

    def test_scanned_identity_uses_same_exact_cover_guard(self):
        raw=self.identity_original('Unreadable cover')
        with patch('r4_ocr_geometry.OCRPage') as render:
            render.return_value.get_text.return_value='JASH ENGINEERING LIMITED'
            self.assertIsNone(collector.preflight_identity(raw,'JASH'))
            render.assert_called_once()

    def test_wrong_issuer_cannot_start_full_audit(self):
        raw=self.identity_original('UNRELATED COMPANY LIMITED')
        with patch('r4_ocr_geometry.OCRPage') as render,patch('r4_ocr_dated_geometry.audit_document') as audit:
            render.return_value.get_text.return_value='UNRELATED COMPANY LIMITED'
            with self.assertRaisesRegex(ValueError,'COMPLETE_ISSUER_IDENTITY_UNPROVEN'):
                collector.extract_all(raw,'JASH',['2024-09-30'])
            audit.assert_not_called()

    def test_candidate_and_pinned_originals_precede_unproven_inventory_without_dropping_urls(self):
        pinned=collector.ISSUERS['JASH']['originals'][0]
        discovered=[pinned,'discovered']
        retained={'unknown':{'candidate_priority':1},'native-candidate':{'candidate_priority':0}}
        self.assertEqual(collector.prioritize_originals('JASH',discovered,retained),
                         ['native-candidate',pinned,'unknown','discovered'])
    def test_restated_acquisition_requires_app_guard_and_invalidates_legacy_cache(self):
        with patch.dict(collector.os.environ,{},clear=True):
            self.assertIsNone(collector.active_basis_policy())
            legacy=collector.replay_engine()
        with patch.dict(collector.os.environ,{'RESULTS_R4_RESTATED_DISPLAY_READY':'1'},clear=True):
            self.assertEqual(collector.active_basis_policy(),collector.CURRENT_DISPLAY_POLICY)
            self.assertNotEqual(legacy,collector.replay_engine())

    def test_collector_change_invalidates_cached_negative_replays(self):
        names=('r4-official-issuer-recovery.py','r4_official_issuer.py','r4_pdf_geometry.py',
            'r4_ocr_dated_geometry.py','r4_ocr_geometry.py','r4_ocr_cli.py')
        with tempfile.TemporaryDirectory() as directory:
            for name in names:(Path(directory)/name).write_text('original')
            original=collector.replay_engine(directory)
            self.assertEqual(original,collector.replay_engine(directory))
            (Path(directory)/names[0]).write_text('repaired collector')
            self.assertNotEqual(original,collector.replay_engine(directory))

    def test_native_table_labels_survive_failed_low_resolution_locator(self):
        from unittest.mock import Mock
        with fitz.open() as pdf:
            page=pdf.new_page()
            page.insert_text((40,40),'JASH ENGINEERING LIMITED')
            page.insert_text((40,70),'Revenue from operations and diluted earnings per share')
            raw=pdf.tobytes()
        period='2024-09-30'
        replay=Mock(return_value={period:{'rejection':'INDEPENDENT_RENDER_DISAGREEMENT'}})
        with patch('r4_ocr_dated_geometry.audit_document',return_value={'pages':['unreadable audit label']}), \
             patch('r4_ocr_dated_geometry.extract_dated_periods',replay), \
             patch.object(collector,'extract_original',side_effect=ValueError('NATIVE_TABLE_UNPROVEN')):
            proof=collector.extract_all(raw,'JASH',[period])
        replay.assert_called_once_with(raw,1,[period],False,False)
        self.assertEqual(proof['periods'][period],[])
        self.assertEqual(proof['rejections']['INDEPENDENT_RENDER_DISAGREEMENT'],1)

    def session(self,raw):
        class Response:
            status_code=200
            def __enter__(self):return self
            def __exit__(self,*args):return False
            def raise_for_status(self):pass
            def iter_content(self,*args):yield raw
        class Session:
            def get(self,*args,**kwargs):return Response()
        return Session()

    def test_real_collector_entry_point_binds_download_transport(self):
        url='https://jashindia.com/wp-content/uploads/2025/02/Outcome-JASH-Q2.pdf'
        self.assertEqual(collector.download_original(self.session(b'%PDF-source'),'JASH',url),(b'%PDF-source',url))

    def test_non_pdf_response_is_rejected_at_collector_entry_point(self):
        with self.assertRaisesRegex(ValueError,'NOT_PDF'):
            collector.download_original(self.session(b'<html>error</html>'),'JASH','https://jashindia.com/q.pdf')

    def test_explicit_bse_original_uses_existing_bounded_bse_adapter(self):
        calls=[]
        expected='38b751f3-1e7e-412c-9680-a3b80d0fcb27.pdf'
        live='https://www.bseindia.com/xml-data/corpfiling/AttachLive/'+expected
        class Client:
            def __enter__(self):return self
            def __exit__(self,*args):return False
            def retrieve_original_pdf(self,name,*,max_bytes):
                calls.append((name,max_bytes));return b'%PDF-original',{'source_url':live}
        with patch.object(collector,'batch',types.SimpleNamespace(PortfolioBSE=Client),create=True):
            raw,url=collector.download_original(None,'STARHEALTH','https://www.bseindia.com/xml-data/corpfiling/AttachHis/'+expected)
        self.assertEqual((raw,url),(b'%PDF-original',live));self.assertEqual(calls,[(expected,32_000_000)])

if __name__=='__main__':main()
