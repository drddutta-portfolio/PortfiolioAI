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
            pdf.new_page().insert_text((40,40),'Revenue from operations and diluted earnings per share')
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
