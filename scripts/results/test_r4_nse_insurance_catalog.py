import unittest
from unittest.mock import MagicMock
from r4_nse_insurance_catalog import normalize,list_filings,verify_record
from r4_nse_issuer_bridge import bridge_from_sources

ROW={'symbol':'STARHEALTH','periodEnd':'31-Dec-2024','period':'Quarterly',
     'cumulative':'Non-cumulative','insuranceType':'General-Insurance',
     'consolidated':'Non-Consolidated','companyName':'Star Health and Allied Insurance Company Limited',
     'xbrl':'https://nsearchives.nseindia.com/corporate/xbrl/GI_123.xml'}
class InsuranceCatalogTests(unittest.TestCase):
    def test_explicit_period_alias_preserves_original_row(self):
        original=dict(ROW);meta=normalize([original],'STARHEALTH')[0]
        self.assertNotIn('toDate',original)
        self.assertEqual(meta['toDate'],'31-Dec-2024')
        self.assertEqual(meta['source_insurance_catalog_record'],original)
        verify_record(meta,'STARHEALTH')
    def test_cumulative_other_periods_and_external_originals_are_excluded(self):
        for changes in ({'cumulative':'Cumulative'},{'period':'Annual'},{'periodEnd':'30-Jun-2024'},
                        {'symbol':'OTHER'},{'xbrl':'https://example.com/GI_123.xml'},
                        {'insuranceType':'Life-Insurance'}):
            self.assertEqual(normalize([{**ROW,**changes}],'STARHEALTH'),[])
    def test_altered_alias_and_conflicting_dates_rejected(self):
        with self.assertRaises(ValueError):normalize([{**ROW,'toDate':'30-Sep-2024'}],'STARHEALTH')
        meta=normalize([ROW],'STARHEALTH')[0]
        with self.assertRaises(ValueError):verify_record({**meta,'companyName':'Other Company'},'STARHEALTH')
        with self.assertRaises(ValueError):verify_record({**meta,'toDate':'30-Sep-2024'},'STARHEALTH')
    def test_only_insurer_uses_separate_catalog(self):
        ordinary=MagicMock(return_value=['ordinary']);session=MagicMock()
        self.assertEqual(list_filings(session,'ACME',ordinary),['ordinary']);session.get.assert_not_called()
        response=session.get.return_value;response.headers={'content-type':'application/json'};response.json.return_value=[ROW]
        self.assertEqual(len(list_filings(session,'STARHEALTH',ordinary)),1)
        self.assertIn('index=insurance',session.get.call_args.args[0])
    def test_nse_symbol_tag_requires_exact_catalog_and_two_bse_identities(self):
        raw=b'<xbrl><NSESymbol>STARHEALTH</NSESymbol><ScripCode>543412</ScripCode><ISIN>INE575P01011</ISIN><NameOfTheCompany>Star Health and Allied Insurance Company Limited</NameOfTheCompany><NatureOfReportStandaloneConsolidated>Standalone</NatureOfReportStandaloneConsolidated><DescriptionOfPresentationCurrency>INR</DescriptionOfPresentationCurrency></xbrl>'
        meta=normalize([ROW],'STARHEALTH')[0]
        header={'SecurityCode':'543412','ISIN':'INE575P01011'}
        listing={'SCRIP_CD':'543412','ISIN_NUMBER':'INE575P01011','Issuer_Name':ROW['companyName']}
        proof=bridge_from_sources(raw,meta,'STARHEALTH','INE575P01011',header,listing)
        self.assertEqual(proof.symbol,'STARHEALTH')
        with self.assertRaises(ValueError):bridge_from_sources(raw,ROW,'STARHEALTH','INE575P01011',header,listing)
        with self.assertRaises(ValueError):bridge_from_sources(raw.replace(b'</xbrl>',b'<Symbol>OTHER</Symbol></xbrl>'),meta,'STARHEALTH','INE575P01011',header,listing)
        with self.assertRaises(ValueError):bridge_from_sources(raw,meta,'STARHEALTH','INE575P01011',header,{**listing,'ISIN_NUMBER':'OTHER'})
if __name__=='__main__':unittest.main()
