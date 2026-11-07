import unittest,json,base64,io,importlib.util,sys
from pathlib import Path
from unittest.mock import Mock,patch
from r4_scope_catalog import list_filings
from test_r4_scope_board import fixture
from r4_nse_catalog_revision import canonical,sha

class ScopeCatalogTests(unittest.TestCase):
    def response(self,rows):return Mock(status_code=200,content=json.dumps(rows).encode())
    def test_raw_catalog_preserves_metadata_without_r3_parser_import(self):
        row={'symbol':'NATCOPHARM','qe_Date':'30-SEP-2025','consolidated':'Standalone'};session=Mock();session.get.return_value=self.response([row])
        with patch.dict(sys.modules,{'bs4':None}):self.assertEqual(list_filings(session,'NATCOPHARM'),[row])
        self.assertFalse(session.get.call_args.kwargs['allow_redirects']);self.assertIn('size=100',session.get.call_args.args[0])
    def test_truncation_foreign_issuer_and_redirect_reject(self):
        for rows in ([{'symbol':'NATCOPHARM'}]*100,[{'symbol':'OTHER'}]):
            session=Mock();session.get.return_value=self.response(rows)
            with self.assertRaises(ValueError):list_filings(session,'NATCOPHARM')
        session=Mock();session.get.return_value=Mock(status_code=302,content=b'[]')
        with self.assertRaises(ValueError):list_filings(session,'NATCOPHARM')
    def test_xml_anchor_resolves_and_replays_exact_own_quarter_without_bs4(self):
        spec=importlib.util.spec_from_file_location('scope_board_transport',Path(__file__).with_name('r4-scope-board-recovery.py'));collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)
        doc,b=fixture();primary=base64.b64decode(b['nse_original_base64']);xml_url='https://nsearchives.nseindia.com/corporate/xbrl/INTEGRATED_FILING_INDAS_123_WEB.xml';facts={k:{'value':v,'unit':'INR_PER_SHARE' if k=='EPS_DILUTED' else 'INR_CRORE'} for k,v in [('OPERATING_REVENUE_QUARTER','474.8'),('NET_PROFIT_QUARTER','132.4'),('EPS_DILUTED','7.43')]}
        manifest={'contract':'PORTFOLIOAI_RESULTS_VERIFIED_NSE_INTEGRATED_CURRENT_XBRL_V1','symbol':'NATCOPHARM','isin':'INE987654321','period_end':'2025-09-30','consolidation_scope':'STANDALONE','issuer_filing_url':xml_url,'facts':facts};body=canonical(manifest);digest=sha(body);key='private/manifest.json';payload={**manifest,'r2_key':key,'r2_manifest_sha256':digest}
        class Client:
            def get_object(self,**kw):return {'Body':io.BytesIO(body)}
        class Cursor:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def execute(self,*args):pass
            def fetchall(self):return [('source',sha(canonical(payload)),payload,facts)]
        class Database:
            def cursor(self):return Cursor()
            def rollback(self):pass
        row={'symbol':'NATCOPHARM','xbrl':xml_url,'ixbrl':b['nse_original_url'],'qe_Date':'30-SEP-2025','consolidated':'Standalone'};session=Mock()
        session.get.side_effect=lambda url,**kwargs:self.response([row]) if 'integrated-filing-results?' in url else Mock(status_code=200,content=primary)
        with patch.dict(sys.modules,{'bs4':None}),patch.object(collector.batch,'immutable_put'):
            anchors,rejections=collector.anchors_for(Database(),Client(),session,'NATCOPHARM','INE987654321','security')
        self.assertEqual(len(anchors),1);self.assertEqual(rejections,{});self.assertEqual(anchors[0]['bridge']['nse_original_sha256'],sha(primary))

if __name__=='__main__':unittest.main()
