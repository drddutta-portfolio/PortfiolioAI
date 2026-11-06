"""Quarter dates retain printed digits while cumulative dates remain ineligible."""
import unittest
from r4_pdf_geometry import dated_headers

def words(y,values):
    return [(x,y-2,x+width,y+2,text) for x,width,text in values]

def header(corrupt=False):
    rows=[(5,words(5,[(510,55,'June 23,')])),
          (10,words(10,[(10,55,'December 31,'),(110,65,'September 30,'),(210,55,'December 31,'),(310,55,'December 31,'),(410,55,'December 31,'),(510,55,'March 31,')])),
          (20,words(20,[(10,55,'2025'),(110,65,'2025'),(210,55,'2024*' if not corrupt else '202x*'),(310,55,'2025'),(410,55,'2024*'),(510,55,'2025*')]))]
    return rows

class FootnotedHeadersTest(unittest.TestCase):
    def test_literal_footnoted_year_is_available_only_in_new_replay(self):
        old=list(dated_headers(header(),True,True))
        self.assertFalse(any(len(d)>2 and d[2][0]=='2024-12-31' for _,_,d in old))
        new=list(dated_headers(header(),True,True,True))
        self.assertTrue(any([x[0] for x in dates[:3]]==['2025-12-31','2025-09-30','2024-12-31'] for _,_,dates in new))

    def test_bullet_year_marker_is_separate_from_previous_replay_version(self):
        rows=[(y,[(*w[:4],str(w[4]).replace('2024*','2024•'),*w[5:]) for w in ws]) for y,ws in header()]
        old=list(dated_headers(rows,True,True,True))
        new=list(dated_headers(rows,True,True,True,True))
        self.assertFalse(any(len(d)>2 and d[2][0]=='2024-12-31' for _,_,d in old))
        self.assertTrue(any([x[0] for x in d[:3]]==['2025-12-31','2025-09-30','2024-12-31'] for _,_,d in new))

    def test_corrupt_year_never_becomes_requested_quarter(self):
        new=list(dated_headers(header(True),True,True,True))
        self.assertFalse(any(len(d)>2 and d[2][0]=='2024-12-31' for _,_,d in new))

    def test_ambiguous_selected_date_remains_rejected(self):
        rows=header()
        rows.append((25,words(25,[(210,55,'2023')])))
        new=list(dated_headers(sorted(rows),True,True,True))
        self.assertFalse(any(len(d)>2 and d[2][0]=='2024-12-31' for _,_,d in new))

class InitialIssuerLayoutTest(unittest.TestCase):
    def fixture(self,selected_bad=False):
        import fitz
        from test_r4_pdf_geometry import fixture
        doc,p=fixture()
        p.add_redact_annot(fitz.Rect(20,55,400,75),fill=(1,1,1))
        p.add_redact_annot(fitz.Rect(450,205,680,225),fill=(1,1,1))
        if selected_bad:p.add_redact_annot(fitz.Rect(770,205,820,225),fill=(1,1,1))
        p.apply_redactions()
        p.insert_text((25,70),'Amounts in INR incrores',fontsize=10)
        p.insert_text((475,220),'3,83',fontsize=10)
        p.insert_text((625,220),'(2,77)',fontsize=10)
        if selected_bad:p.insert_text((775,220),'bad',fontsize=10)
        p.insert_text((900,100),'Year ended',fontsize=10)
        p.insert_text((900,125),'31.03.2024',fontsize=10)
        p.insert_text((930,220),'9.45',fontsize=10)
        return doc,p

    def parse(self,page,period='2023-09-30',initial=True):
        from r4_pdf_geometry import extract_page
        return extract_page(page,1,period,allow_comparative=True,statement_layout=True,
            advanced_statement_layout=True,footnoted_quarter_headers=True,initial_issuer_layout=initial)

    def test_supporting_annual_cell_never_supplies_selected_quarter_value(self):
        doc,p=self.fixture();result=self.parse(p)
        self.assertEqual(result['facts']['EPS_DILUTED']['original_value'],'11.88')
        self.assertEqual(result['column_index'],2)
        self.assertEqual(result['unit'],'INR_CRORE')
        with self.assertRaises(ValueError):self.parse(p,initial=False)
        with self.assertRaises(ValueError):self.parse(p,period='2024-03-31')

    def test_bad_selected_value_cannot_be_replaced_with_good_annual_cell(self):
        doc,p=self.fixture(True)
        with self.assertRaisesRegex(ValueError,'CORRUPT_OR_MISSING_NUMERIC_CELL'):self.parse(p)

    def test_cin_exception_is_exact_original_method_and_issuer_only(self):
        from r4_official_issuer import historical_cin_original
        digest='d9c5ae2fd7afe79708a026dfc0eeb8fe31ea8654c87b40023f7a614b524ab0c4'
        self.assertTrue(historical_cin_original('TMCV','NATIVE_INITIAL_ISSUER_LAYOUT_V7',digest))
        self.assertFalse(historical_cin_original('TMCV','NATIVE_FOOTNOTED_HEADERS_V6',digest))
        self.assertFalse(historical_cin_original('TMPV','NATIVE_INITIAL_ISSUER_LAYOUT_V7',digest))
        self.assertFalse(historical_cin_original('TMCV','NATIVE_INITIAL_ISSUER_LAYOUT_V7','0'*64))

if __name__=='__main__':unittest.main()
