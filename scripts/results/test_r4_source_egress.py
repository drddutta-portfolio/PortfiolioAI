import importlib.util
from pathlib import Path
import unittest
from unittest.mock import Mock
spec=importlib.util.spec_from_file_location('verify',Path(__file__).with_name('r4-verify-quarterly.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class SourceEgressTests(unittest.TestCase):
    def rows(self):return [{'source_record_id':'source','payload_hash':'hash','raw_payload':None,'metric_code':x,'numeric_value':'123.45'} for x in ('OPERATING_REVENUE_QUARTER','NET_PROFIT_QUARTER','EPS_DILUTED')]
    def test_three_metrics_fetch_one_payload_and_keep_all_original_values(self):
        rows=self.rows();payload={'facts':{'exact':'source'}};cursor=Mock()
        cursor.fetchall.side_effect=[rows,[{'id':'source','payload_hash':'hash','raw_payload':payload}]]
        result=m.source_observations_once(cursor)
        self.assertEqual(len(result),3)
        self.assertEqual(cursor.execute.call_count,2)
        self.assertEqual(cursor.execute.call_args.args[1],(['source'],))
        self.assertTrue(all(r['raw_payload'] is payload for r in result))
        self.assertEqual([r['numeric_value'] for r in result],['123.45']*3)
        self.assertNotIn('d.raw_payload',m.SQL)
    def test_missing_or_changed_source_blocks_all_admission(self):
        for sources in ([],[{'id':'source','payload_hash':'changed','raw_payload':{}}]):
            cursor=Mock();cursor.fetchall.side_effect=[self.rows(),sources]
            with self.assertRaises(ValueError):m.source_observations_once(cursor)
    def test_empty_inventory_never_downloads_sources(self):
        cursor=Mock();cursor.fetchall.return_value=[]
        self.assertEqual(m.source_observations_once(cursor),[])
        self.assertEqual(cursor.execute.call_count,1)
if __name__=='__main__':unittest.main()
