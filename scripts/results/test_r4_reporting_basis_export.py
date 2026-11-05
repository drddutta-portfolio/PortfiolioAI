import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('r5_input',Path(__file__).with_name('r5-g-live-input.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class ReportingBasisExport(unittest.TestCase):
    def test_alternative_scope_cannot_evade_canonical_reporting_basis_guard(self):
        canonical=dict(id='selected',securityId='issuer',periodEnd='2024-09-30',
                       selected=True,reportingBasisUnproven=True,value='100',scope='CONSOLIDATED')
        alternative={**canonical,'id':'alternative','selected':False,'reportingBasisUnproven':False,'scope':'STANDALONE'}
        other_quarter={**alternative,'id':'other-quarter','periodEnd':'2024-12-31'}
        other_issuer={**alternative,'id':'other-issuer','securityId':'other'}
        result=module.propagate_reporting_basis_guards([canonical,alternative,other_quarter,other_issuer])
        self.assertEqual([r['reportingBasisUnproven'] for r in result],[True,True,False,False])
        self.assertFalse(alternative['reportingBasisUnproven'])
        self.assertEqual(result[1]['value'],'100')
        self.assertFalse(result[1]['selected'])

    def test_census_preserves_the_same_restated_comparison_guard_as_the_app(self):
        row=('obs','security','NET_PROFIT_QUARTER','123.45','2024-07-01','2024-09-30',
            'INR_CRORE','INR','CONSOLIDATED','COMPANY_EXCHANGE_FILING','source',None,None,
            'ISSUER_RESTATED_BASIS_COMPARABILITY_UNPROVEN; HISTORICAL_ORIGINAL_EPS_COMPARABILITY_UNPROVEN')
        exported=module.selected_fact(row)
        self.assertTrue(exported['reportingBasisUnproven'])
        self.assertTrue(exported['originalShareBasis'])
        self.assertEqual(exported['value'],'123.45')
        self.assertTrue(exported['selected'])
        original=module.selected_fact((*row[:-1],None),selected=False)
        self.assertFalse(original['reportingBasisUnproven'])
        self.assertFalse(original['selected'])

if __name__=='__main__':unittest.main()
