import importlib.util,unittest,io
from unittest.mock import Mock,patch
from pathlib import Path
from copy import deepcopy
from test_r4_nse_catalog_revision import html
from test_r4_avanti_correction import xml
spec=importlib.util.spec_from_file_location('repair',Path(__file__).with_name('r4-bharti-scope-repair.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def originals():
    def identity(raw):return raw.replace(b'AVANTIFEED',b'BHARTIARTL').replace(b'INE871C01038',b'INE397D01024').replace(b'AVANTI FEEDS LIMITED',b'Bharti Airtel Limited').replace(b'512573',b'532454')
    return identity(html().replace(b'Diluted earnings per share',b'Diluted earnings (loss) per share from continuing and discontinued operations')),identity(xml())

def prior():return [{'metric_code':k,'numeric_value':str(v),'consolidation_scope':'STANDALONE','source_record_id':m.OLD_SOURCE} for k,v in m.OLD_VALUES.items()]

class BhartiScopeRepairTests(unittest.TestCase):
    def test_retained_catalog_cannot_change_or_claim_another_issuer(self):
        client=Mock();raw=b'[{"symbol":"OTHER"}]'
        client.get_object.return_value={'Body':io.BytesIO(raw)}
        with patch.object(m,'CATALOG_SHA',m.sha(raw)):
            with self.assertRaisesRegex(ValueError,'ISSUER_OR_COMPLETENESS'):m.retained_catalog(client)
        client.get_object.return_value={'Body':io.BytesIO(raw)}
        with self.assertRaisesRegex(ValueError,'HASH_MISMATCH'):m.retained_catalog(client)
    def test_exact_retained_catalog_is_reused_without_network_listing(self):
        client=Mock();raw=b'[{"symbol":"BHARTIARTL"}]';client.get_object.return_value={'Body':io.BytesIO(raw)}
        with patch.object(m,'CATALOG_SHA',m.sha(raw)):self.assertEqual(m.retained_catalog(client),[{'symbol':'BHARTIARTL'}])
    def test_both_original_formats_agree_on_exact_consolidated_quarter(self):
        h,x=originals();p=m.validate_pair(h,x)
        self.assertEqual(p['scope'],'CONSOLIDATED');self.assertEqual(p['period_start'],'2025-10-01');self.assertEqual(p['facts']['OPERATING_REVENUE_QUARTER']['value'],'1000')
    def test_disagreement_cannot_repair_selection(self):
        h,x=originals()
        with self.assertRaisesRegex(ValueError,'PAIRED_ORIGINALS_DISAGREE'):m.validate_pair(h,x.replace(b'>2<',b'>3<'))
    def test_wrong_issuer_scope_or_duration_fails_closed(self):
        h,x=originals()
        for bad in [x.replace(b'BHARTIARTL',b'OTHER'),x.replace(b'Consolidated',b'Standalone'),x.replace(b'2025-10-01',b'2025-04-01')]:
            with self.assertRaises(ValueError):m.validate_pair(h,bad)
    def test_incomplete_core_cannot_be_promoted(self):
        h,x=originals()
        with self.assertRaises(ValueError):m.validate_pair(h.replace(b'Total profit (loss) for period',b'Other label'),x)
    def test_exact_old_selection_is_explicitly_correctable(self):self.assertEqual(m.check_prior(prior(),'new'),'REPAIR_REQUIRED')
    def test_stale_selection_or_changed_values_abort(self):
        for field,value in [('source_record_id','other'),('numeric_value','999'),('consolidation_scope','CONSOLIDATED')]:
            rows=deepcopy(prior());rows[0][field]=value
            with self.assertRaises(ValueError):m.check_prior(rows,'new')
    def test_partial_or_duplicate_selection_aborts(self):
        rows=prior()
        for bad in [rows[:-1],rows+[rows[0]],[rows[0]]*3]:
            with self.assertRaises(ValueError):m.check_prior(bad,'new')
    def test_repeated_run_does_not_rewrite_repaired_source(self):
        rows=prior()
        for r in rows:r.update(consolidation_scope='CONSOLIDATED',source_record_id='new')
        self.assertEqual(m.check_prior(rows,'new'),'ALREADY_REPAIRED')

if __name__=='__main__':unittest.main()
