"""Collector entry-point integration; the workflow installs its real SDK imports."""
import importlib.util
from pathlib import Path
from unittest import TestCase,main

spec=importlib.util.spec_from_file_location('official_collector',Path(__file__).with_name('r4-official-issuer-recovery.py'))
collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)

class CollectorTransportIntegration(TestCase):
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

if __name__=='__main__':main()
