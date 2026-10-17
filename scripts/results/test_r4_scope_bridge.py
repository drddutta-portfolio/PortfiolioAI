import hashlib
import unittest
from copy import deepcopy
import fitz
from test_r4_pdf_geometry import fixture
from r4_scope_bridge import make_bridge,extract_with_scope_bridge,common_statement_note,original_origin

URL='https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_12345_WEB.html'
NOTE='The Statement of Financial Results includes results for the quarter ended September 30, 2024.'

def example(note=NOTE,revenue='474.8',isin='INE987654321'):
    doc,page=fixture(first='30.09.2025',third='30.09.2024')
    page.add_redact_annot(fitz.Rect(20,35,400,55),fill=(1,1,1));page.apply_redactions()
    page.insert_text((25,50),'Statement of financial results',fontsize=10)
    page.insert_text((25,500),NOTE,fontsize=8)
    page.insert_text((25,520),'Approved at the board meeting on November 1, 2025.',fontsize=8)
    general=[('NSE Symbol','NATCOPHARM'),('ISIN',isin),('Name of company','NATCO PHARMA LIMITED'),('Reporting Type','Quarterly'),('Description of presentation currency','INR'),('Level of rounding used in financial results','Crores'),('Date of board meeting when results were approved','01-11-2025')]
    financial=[('Date of start of reporting period','01-07-2025'),('Date of end of reporting period','30-09-2025'),('Nature of report standalone or consolidated','Consolidated'),('Revenue from operations',revenue),('Total profit (loss) for period','132.4'),('Diluted earnings (loss) per share from continuing and discontinued operations','7.43')]
    table=lambda rows:'<table>'+''.join('<tr><td>'+k+'</td><td>'+v+'</td></tr>' for k,v in rows)+'</table>'
    html=(table(general)+table(financial)+'<p>'+note+'</p>').encode()
    return doc,make_bridge(html,URL,'2025-09-30')

class ScopeBridgeBoundsTests(unittest.TestCase):
    def test_only_original_nse_archives_origin(self):
        self.assertTrue(original_origin(URL))
        self.assertFalse(original_origin(URL.replace('nseindia.com','nseindia.com.evil.test')))
        self.assertFalse(original_origin(URL+'?issuer=NATCOPHARM'))
    def test_same_explicit_historical_note_must_be_in_both_documents(self):
        self.assertTrue(common_statement_note(NOTE,NOTE,'2024-09-30'))
        with self.assertRaises(ValueError):common_statement_note(NOTE,'Annual report dated September 30, 2024','2024-09-30')
    def test_year_prefix_does_not_satisfy_the_quarter(self):
        with self.assertRaises(ValueError):common_statement_note(NOTE,NOTE.replace('2024','20240'),'2024-09-30')

class ScopeBridgeOriginalTests(unittest.TestCase):
    def test_exact_current_trio_and_same_statement_note_prove_only_explicit_quarter(self):
        doc,bridge=example()
        out,evidence=extract_with_scope_bridge(doc,1,'2024-09-30','NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',bridge)
        self.assertEqual(out['facts']['NET_PROFIT_QUARTER']['value'],'212.7')
        self.assertEqual(out['facts']['EPS_DILUTED']['value'],'11.88')
        self.assertEqual(evidence['scope'],'CONSOLIDATED')
        with self.assertRaises(ValueError):extract_with_scope_bridge(doc,1,'2024-12-31','NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',bridge)
    def test_current_trio_disagreement_rejects_scope_inference(self):
        doc,bridge=example(revenue='475.8')
        with self.assertRaisesRegex(ValueError,'CURRENT_TRIO_MISMATCH'):extract_with_scope_bridge(doc,1,'2024-09-30','NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',bridge)
    def test_unrelated_statement_with_same_current_numbers_is_rejected(self):
        doc,bridge=example(note='Annual financial results for 2024.')
        with self.assertRaisesRegex(ValueError,'HISTORICAL_NOTE_UNPROVEN'):extract_with_scope_bridge(doc,1,'2024-09-30','NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',bridge)
    def test_wrong_issuer_rejected(self):
        doc,bridge=example(isin='INE000000000')
        with self.assertRaisesRegex(ValueError,'EXACT_IDENTITY'):extract_with_scope_bridge(doc,1,'2024-09-30','NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',bridge)
    def test_modified_original_rejected(self):
        doc,bridge=example();bridge['nse_original_sha256']='0'*64
        with self.assertRaisesRegex(ValueError,'ORIGINAL_HASH'):extract_with_scope_bridge(doc,1,'2024-09-30','NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',bridge)
    def test_restated_statement_is_not_automatically_accepted(self):
        doc,bridge=example(note=NOTE+' Comparative figures restated for a business combination.')
        with self.assertRaisesRegex(ValueError,'BUSINESS_BASIS'):extract_with_scope_bridge(doc,1,'2024-09-30','NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',bridge)

if __name__=='__main__':unittest.main()
