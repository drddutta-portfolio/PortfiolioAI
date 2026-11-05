import unittest
import fitz
from test_r4_pdf_geometry import fixture
from r4_pdf_geometry import extract_page,iso_date,number

def statement(total='3,073',pbt='3,933',discontinued='14',omit=None,prefix=False):
    doc,page=fixture()
    page.add_redact_annot(fitz.Rect(20,145,990,240),fill=(1,1,1));page.apply_redactions()
    rows=[(160,'J|Revenue from operations' if prefix else 'I Revenue from operations',('34,099','32,581','23,184')),
          (190,'VII Profit before tax', (pbt,'3,402','2,892')),
          (220,'Total tax expense',('874','870','588')),
          (250,'IX Profitfortheperiod/yearfromcontinuingoperations',('3,059','2,532','2,304')),
          (280,'(Loss)/Profit after tax for the period/year from discontinued operations',(discontinued,'27','(12)')),
          (310,'Profitfortheperiod/year',(total,'2,559','2,292')),
          (340,'Diluted',('38.67','31.94','35.90'))]
    for y,label,values in rows:
        if y==omit:continue
        page.insert_text((25,y),label,fontsize=8)
        for x,value in zip((475,625,775),values):page.insert_text((x,y),value,fontsize=10)
    return doc,page

class StatementLayoutTests(unittest.TestCase):
    def test_compact_named_dates_retain_every_printed_digit(self):
        for value in ('Mar312026','Mar 312026','Mar31 2026','31Mar2026'):
            self.assertEqual(iso_date(value,True,True),'2026-03-31')
        self.assertIsNone(iso_date('Dec3i2025',True,True))
        doc,page=fixture(first='Mar312026',third='Mar312025')
        result=extract_page(page,1,'2025-03-31',allow_comparative=True,statement_layout=True,advanced_statement_layout=True)
        self.assertEqual(result['column_index'],2)
        self.assertEqual(result['facts']['EPS_DILUTED']['original_value'],'11.88')
        with self.assertRaises(ValueError):extract_page(page,1,'2025-03-31',allow_comparative=True,statement_layout=True)

    def test_unreadable_compact_day_does_not_shift_or_become_an_annual_quarter(self):
        doc,page=fixture(first='Mar312026',third='Mar3i2025')
        with self.assertRaises(ValueError):extract_page(page,1,'2025-03-31',allow_comparative=True,statement_layout=True,advanced_statement_layout=True)

    def test_only_edge_vertical_rules_are_excluded_from_numeric_cells(self):
        def words(text):return [(0,0,20,10,text)]
        value,original=number(words('|1,324|'),edge_vertical_rules=True)
        self.assertEqual(str(value),'1324');self.assertEqual(original,'1,324')
        for raw in ('_—-9,170.9|','o.23|','1|234'):
            with self.subTest(raw=raw),self.assertRaises(ValueError):number(words(raw),edge_vertical_rules=True)
        with self.assertRaises(ValueError):number(words('|1,324|'))

    def test_eps_explanatory_sentence_is_not_a_numeric_row_in_v5(self):
        doc,page=fixture()
        page.insert_text((25,400),'decreases as a result of a reverse split, the calculation of basic and diluted',fontsize=8)
        page.insert_text((475,400),'has been adjusted',fontsize=8)
        result=extract_page(page,1,'2024-09-30',allow_comparative=True,statement_layout=True,advanced_statement_layout=True)
        self.assertEqual(result['facts']['EPS_DILUTED']['original_value'],'7.43')
        with self.assertRaises(ValueError):extract_page(page,1,'2024-09-30',allow_comparative=True,statement_layout=True)

    def test_v5_never_ignores_a_corrupt_actual_diluted_eps_cell(self):
        doc,page=fixture()
        page.add_redact_annot(fitz.Rect(450,205,550,225),fill=(1,1,1));page.apply_redactions()
        page.insert_text((475,220),'o.23',fontsize=10)
        with self.assertRaisesRegex(ValueError,'CORRUPT_OR_MISSING_NUMERIC_CELL'):
            extract_page(page,1,'2024-09-30',allow_comparative=True,statement_layout=True,advanced_statement_layout=True)

    def test_spaced_ruling_glyphs_are_not_row_numbers_or_financial_characters(self):
        doc,page=fixture(label='V_ | Profit for the period/year')
        result=extract_page(page,1,'2024-09-30',allow_comparative=True,statement_layout=True,advanced_statement_layout=True)
        self.assertEqual(result['facts']['NET_PROFIT_QUARTER']['original_value'],'1,324')
        self.assertIn('V_ |',result['facts']['NET_PROFIT_QUARTER']['evidence_line'])
        with self.assertRaises(ValueError):extract_page(page,1,'2024-09-30',allow_comparative=True,statement_layout=True)

    def split_font_rows(self,accounting=True,collision=False,overlap=True,distance=3.2):
        doc,page=fixture()
        if accounting:
            page.insert_text((25,260),'Profit before tax',fontsize=10)
            page.insert_text((25,290),'Total tax expense',fontsize=10)
            for x,pbt,tax in ((475,'2000','676'),(625,'7000','235'),(775,'3000','873')):
                page.insert_text((x,260),pbt,fontsize=10);page.insert_text((x,290),tax,fontsize=10)
        words=[]
        for word in page.get_text('words'):
            w=list(word)
            if w[1]>140:
                if w[0]>=450:w[1]-=distance;w[3]-=distance
                if not overlap:
                    center=(w[1]+w[3])/2;w[1]=center-.5;w[3]=center+.5
            words.append(tuple(w))
        if collision:
            original=next(w for w in page.get_text('words') if w[4]=='4,748')
            words.append((*original[:4],'999',*original[5:]))
        class Words:
            def get_text(self,kind):return words
        return doc,Words()

    def test_overlapping_original_font_rows_preserve_every_financial_character(self):
        doc,page=self.split_font_rows()
        result=self.extract(page)
        self.assertEqual(result['facts']['OPERATING_REVENUE_QUARTER']['original_value'],'4,748')
        self.assertEqual(result['facts']['NET_PROFIT_QUARTER']['original_value'],'1,324')
        self.assertFalse(result['facts']['EPS_DILUTED']['row_alignment_evidence']['amount_characters_changed'])
        self.assertEqual(result['arithmetic_validation']['difference_crore'],'0.0')

    def test_font_row_alignment_requires_accounting_proof(self):
        doc,page=self.split_font_rows(accounting=False)
        with self.assertRaisesRegex(ValueError,'OVERLAPPING_ROWS_REQUIRE'):self.extract(page)

    def test_column_collision_nonoverlap_and_distant_rows_are_not_joined(self):
        for options in ({'collision':True},{'overlap':False},{'distance':5.5}):
            with self.subTest(options=options):
                doc,page=self.split_font_rows(**options)
                with self.assertRaises(ValueError):self.extract(page)

    def test_named_month_abbreviations_require_the_explicit_versioned_path(self):
        doc,page=fixture(first='Sept 30 2025',third='Sep 30 2024')
        result=extract_page(page,1,'2024-09-30',allow_comparative=True,statement_layout=True)
        self.assertEqual(result['column_index'],2)
        self.assertEqual(result['facts']['EPS_DILUTED']['original_value'],'11.88')
        with self.assertRaises(ValueError):extract_page(page,1,'2024-09-30',allow_comparative=True)

    def test_month_aliases_never_fix_an_ocr_character_or_invent_a_calendar_day(self):
        self.assertEqual(iso_date('Sept 30 2024',True),'2024-09-30')
        self.assertIsNone(iso_date('Sepl 30 2024',True))
        self.assertIsNone(iso_date('Sept 31 2024',True))
        self.assertIsNone(iso_date('Sep 2024',True))
        self.assertIsNone(iso_date('Sept 30 2024'))

    def test_unreadable_first_year_keeps_its_column_instead_of_shifting_later_quarters(self):
        doc,page=fixture(first='Sept 30 202S',third='Sep 30 2024')
        with self.assertRaises(ValueError):extract_page(page,1,'2024-09-30',allow_comparative=True,statement_layout=True)

    def test_explicit_named_dates_do_not_turn_an_annual_column_into_a_quarter(self):
        doc,page=fixture(first='Sept 30 2025',third='Sep 30 2024',quarter=False)
        with self.assertRaises(ValueError):extract_page(page,1,'2024-09-30',allow_comparative=True,statement_layout=True)

    def extract(self,page):return extract_page(page,1,'2024-09-30',allow_comparative=True,statement_layout=True)

    def test_only_printed_total_is_selected_after_both_accounting_equalities(self):
        doc,page=statement(prefix=True)
        result=self.extract(page)
        self.assertEqual(result['facts']['NET_PROFIT_QUARTER']['original_value'],'3,073')
        proof=result['arithmetic_validation']
        self.assertEqual(proof['contract'],'PRINTED_PBT_MINUS_TAX_EQUALS_CONTINUING_PAT_AND_COMPONENTS_EQUAL_TOTAL_PAT_V1')
        self.assertEqual(proof['difference_crore'],'0.0')
        self.assertEqual(proof['component_difference_crore'],'0.0')
        self.assertEqual(proof['continuing_pat']['original_value'],'3,059')
        self.assertEqual(proof['discontinued_pat']['original_value'],'14')

    def test_discontinued_loss_retains_its_printed_sign(self):
        doc,page=statement(total='3,045',discontinued='(14)')
        result=self.extract(page)
        self.assertEqual(result['facts']['NET_PROFIT_QUARTER']['value'],'304.5')
        self.assertEqual(result['arithmetic_validation']['discontinued_pat']['value'],'-1.4')

    def test_mismatched_printed_total_never_gets_replaced_by_component_sum(self):
        doc,page=statement(total='3,074')
        with self.assertRaisesRegex(ValueError,'TOTAL_PAT_MISMATCH'):self.extract(page)

    def test_continuing_profit_must_also_reconcile_to_pbt_and_tax(self):
        doc,page=statement(pbt='3,934')
        with self.assertRaisesRegex(ValueError,'PROFIT_TAX_RECONCILIATION_FAILED'):self.extract(page)

    def test_missing_component_or_total_cannot_be_calculated(self):
        for omit in (250,280,310):
            with self.subTest(omit=omit):
                doc,page=statement(omit=omit)
                with self.assertRaises(ValueError):self.extract(page)

    def test_existing_parser_path_does_not_admit_the_new_layout(self):
        doc,page=statement(prefix=True)
        with self.assertRaises(ValueError):extract_page(page,1,'2024-09-30',allow_comparative=True)

if __name__=='__main__':unittest.main()
