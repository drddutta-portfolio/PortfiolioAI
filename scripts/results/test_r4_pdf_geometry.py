import unittest
import fitz
from decimal import Decimal
from r4_pdf_geometry import extract_page,iso_date,number

def fixture(first="30.09.2024",quarter=True,profit="1,324",label="7 Profit for the period/year (5•6)",note=False,third="30.09.2023"):
    doc=fitz.open();p=doc.new_page(width=1000,height=850)
    p.insert_text((25,30),"NATCO PHARMA LIMITED",fontsize=10)
    p.insert_text((25,50),"Consolidated financial results",fontsize=10)
    p.insert_text((25,70),"Amounts in INR millions",fontsize=10)
    p.insert_text((460,100),"Quarter ended" if quarter else "Year ended",fontsize=10)
    for i,date in enumerate([first,"30.06.2024",third]):p.insert_text((450+i*150,125),date,fontsize=10)
    for y,label,values in [(160,"Revenue from operations",["4,748","13,711","7,586"]),
                           (190,label,[profit,"6,765","2,127"]),
                           (220,"(b) Diluted",["7.43","37.81","11.88"])]:
        p.insert_text((25,y),label,fontsize=10)
        for i,value in enumerate(values):p.insert_text((475+i*150,y),value,fontsize=10)
    if note:p.insert_text((25,260),"Notes to standalone and consolidated results",fontsize=10)
    return doc,p

class GeometryTest(unittest.TestCase):
    def test_financial_title_year_does_not_override_real_quarter_group(self):
        doc,p=fixture(first="30.09.2025",third="30.09.2024")
        p.insert_text((450,85),"FINANCIAL RESULTS FOR THE QUARTER AND YEAR ENDED",fontsize=10)
        parsed=extract_page(p,1,"2024-09-30",allow_comparative=True)
        self.assertEqual(parsed["column_index"],2)
        self.assertEqual(parsed["facts"]["NET_PROFIT_QUARTER"]["value"],"212.7")

    def test_explicit_split_date_years_preserve_physical_columns(self):
        doc,p=fixture(first="30 September",third="30 September")
        # Replace the fixture's middle numeric date with the explicit split form.
        p.add_redact_annot(fitz.Rect(595,112,710,130),fill=(1,1,1));p.apply_redactions()
        p.insert_text((600,125),"30 June",fontsize=10)
        for x,year in [(450,"2025"),(600,"2025"),(750,"2024")]:p.insert_text((x,140),year,fontsize=10)
        out=extract_page(p,1,"2024-09-30",allow_comparative=True)
        self.assertEqual(out["column_index"],2)
        self.assertEqual(out["facts"]["EPS_DILUTED"]["value"],"11.88")

    def test_split_date_missing_year_rejected(self):
        doc,p=fixture(first="30 September",third="30 September")
        p.insert_text((450,140),"2025",fontsize=10)
        with self.assertRaises(ValueError):extract_page(p,1,"2024-09-30",allow_comparative=True)

    def test_named_month_two_digit_year_and_three_months_heading(self):
        doc,p=fixture(first="30-Sep-25",third="30-Sep-24")
        p.add_redact_annot(fitz.Rect(450,85,550,104),fill=(1,1,1));p.apply_redactions()
        p.insert_text((460,100),"Three months ended",fontsize=10)
        self.assertEqual(extract_page(p,1,"2024-09-30",allow_comparative=True)["column_index"],2)

    def test_explicit_rs_mn_unit(self):
        doc,p=fixture(first="30.09.2025",third="30.09.2024")
        p.add_redact_annot(fitz.Rect(20,55,250,74),fill=(1,1,1));p.apply_redactions()
        p.insert_text((25,70),"Rs in Mn",fontsize=10)
        self.assertEqual(extract_page(p,1,"2024-09-30",allow_comparative=True)["unit"],"INR_MILLION")

    def test_component_operation_rows_do_not_replace_whole_company_profit(self):
        doc,p=fixture(first="30.09.2025",third="30.09.2024")
        p.insert_text((25,240),"Profit for the period from discontinued operations",fontsize=10)
        p.insert_text((25,260),"Diluted EPS from continuing operations",fontsize=10)
        for x in (475,625,775):
            p.insert_text((x,240),"999",fontsize=10)
            p.insert_text((x,260),"999",fontsize=10)
        out=extract_page(p,1,"2024-09-30",allow_comparative=True)
        self.assertEqual(out["facts"]["NET_PROFIT_QUARTER"]["value"],"212.7")
        self.assertEqual(out["facts"]["EPS_DILUTED"]["value"],"11.88")

    def test_unreadable_unselected_month_keeps_its_column_without_inventing_date(self):
        doc,p=fixture(first="30.09.2025",third="30.09.2024")
        p.add_redact_annot(fitz.Rect(595,112,710,130),fill=(1,1,1));p.apply_redactions()
        p.insert_text((600,125),"30 Oocombor 2025",fontsize=10)
        out=extract_page(p,1,"2024-09-30",allow_comparative=True)
        self.assertEqual(out["column_index"],2)
        self.assertEqual(out["facts"]["EPS_DILUTED"]["value"],"11.88")
        with self.assertRaises(ValueError):extract_page(p,1,"2025-12-30",allow_comparative=True)

    def test_all_explicit_tax_components_include_earlier_year_adjustment(self):
        doc,p=fixture()
        for y,label,value in [(250,"Profit before tax","1,500"),(280,"Current tax","200"),(310,"Deferred tax","(20)"),(340,"Tax relating to earlier years","(4)")]:
            p.insert_text((25,y),label,fontsize=10)
            for x in (475,625,775):p.insert_text((x,y),value,fontsize=10)
        out=extract_page(p,1,"2024-09-30",allow_comparative=True)
        self.assertEqual(out["arithmetic_validation"]["tax_crore"],"17.6")
        self.assertEqual(out["arithmetic_validation"]["difference_crore"],"0.0")

    def test_split_year_with_table_border_remains_a_printed_year(self):
        doc,p=fixture(first="30 September",third="30 September")
        p.add_redact_annot(fitz.Rect(595,112,710,130),fill=(1,1,1));p.apply_redactions()
        p.insert_text((600,125),"30 June",fontsize=10)
        for x,year in [(450,"2025"),(600,"|2025"),(750,"2024")]:p.insert_text((x,140),year,fontsize=10)
        self.assertEqual(extract_page(p,1,"2024-09-30",allow_comparative=True)["column_index"],2)

    def test_rs_comma_mn_unit_is_explicit(self):
        doc,p=fixture(first="30.09.2025",third="30.09.2024")
        p.add_redact_annot(fitz.Rect(20,55,250,74),fill=(1,1,1));p.apply_redactions()
        p.insert_text((25,70),"Rs, in Mn",fontsize=10)
        self.assertEqual(extract_page(p,1,"2024-09-30",allow_comparative=True)["unit"],"INR_MILLION")

    def test_compact_quarter_and_year_group_tokens_do_not_authorize_annual_cell(self):
        doc,p=fixture(first="30.09.2025",third="30.09.2024")
        p.insert_text((760,100),"Yearended",fontsize=10)
        with self.assertRaises(ValueError):extract_page(p,1,"2024-09-30",allow_comparative=True)

    def test_table_borders_are_not_part_of_the_numeric_cell(self):
        def ws(values):return [(0,0,1,1,v) for v in values]
        self.assertEqual(number(ws(['|','1,324','|']))[0],Decimal('1324'))
        with self.assertRaises(ValueError):number(ws(['1','324']))
        with self.assertRaises(ValueError):number(ws(['|']))

    def test_grid_attached_profit_labels_keep_the_reported_amount(self):
        doc,p=fixture(label="7|Net profit for the period/year")
        out=extract_page(p,1,"2024-09-30",allow_comparative=True)
        self.assertEqual(out["facts"]["NET_PROFIT_QUARTER"]["value"],"132.4")

    def test_bank_ordinary_pbt_checks_total_period_profit_without_replacing_it(self):
        doc,p=fixture()
        for y,label,value in [(250,"1|Interest earned","1,000"),(280,"4|Interest expended","500"),(310,"11 |Profit from Ordinary Activities before tax","1,500"),(340,"12 |Tax expense","176")]:
            p.insert_text((25,y),label,fontsize=10)
            for x in (475,625,775):p.insert_text((x,y),value,fontsize=10)
        out=extract_page(p,1,"2024-09-30",bank=True,allow_comparative=True)
        self.assertEqual(out["facts"]["NET_INTEREST_INCOME_QUARTER"]["value"],"50")
        self.assertEqual(out["facts"]["NET_PROFIT_QUARTER"]["value"],"132.4")
        self.assertEqual(out["arithmetic_validation"]["difference_crore"],"0.0")

    def test_unlabelled_scope_requires_a_separately_proven_hint(self):
        doc,p=fixture(first="30.09.2025",third="30.09.2024")
        p.add_redact_annot(fitz.Rect(20,35,250,54),fill=(1,1,1));p.apply_redactions()
        p.insert_text((25,50),"Quarterly financial results",fontsize=10)
        with self.assertRaises(ValueError):extract_page(p,1,"2024-09-30",allow_comparative=True)
        out=extract_page(p,1,"2024-09-30",allow_comparative=True,scope_hint="STANDALONE")
        self.assertTrue(out["scope_hint_used"])
        self.assertEqual(out["facts"]["EPS_DILUTED"]["value"],"11.88")

    def test_hint_cannot_override_an_explicit_reporting_scope(self):
        doc,p=fixture(first="30.09.2025",third="30.09.2024")
        with self.assertRaises(ValueError):extract_page(p,1,"2024-09-30",allow_comparative=True,scope_hint="STANDALONE")

    def test_exact_prior_year_quarter_uses_its_physical_column(self):
        doc,p=fixture(first="30.09.2025",third="30.09.2024")
        parsed=extract_page(p,1,"2024-09-30",allow_comparative=True)
        self.assertEqual(parsed["column_index"],2)
        self.assertEqual(parsed["facts"]["NET_PROFIT_QUARTER"]["value"],"212.7")
        self.assertEqual(parsed["facts"]["EPS_DILUTED"]["value"],"11.88")
        self.assertEqual(parsed["first_column_period"],"2025-09-30")
        self.assertEqual(parsed["selected_column_period"],"2024-09-30")

    def test_comparative_annual_heading_is_not_a_quarter(self):
        doc,p=fixture(first="30.09.2025",third="30.09.2024")
        p.insert_text((760,100),"Year ended",fontsize=10)
        with self.assertRaises(ValueError):extract_page(p,1,"2024-09-30",allow_comparative=True)

    def test_dated_mode_supports_exact_profit_loss_label_without_guessing_sign(self):
        doc,p=fixture(label="Profit / (loss) for the period",profit="(1,324)")
        self.assertEqual(extract_page(p,1,"2024-09-30",allow_comparative=True)["facts"]["NET_PROFIT_QUARTER"]["value"],"-132.4")
    def test_numeric_formula_in_label_is_not_a_financial_cell(self):
        doc,p=fixture()
        out=extract_page(p,1,"2024-09-30")
        self.assertEqual(out["facts"]["NET_PROFIT_QUARTER"]["value"],"132.4")
        self.assertEqual(out["facts"]["EPS_DILUTED"]["value"],"7.43")
        self.assertEqual(out["facts"]["NET_PROFIT_QUARTER"]["original_value"],"1,324")

    def test_later_notes_do_not_change_statement_scope(self):
        doc,p=fixture(note=True)
        self.assertEqual(extract_page(p,1,"2024-09-30")["scope"],"CONSOLIDATED")

    def test_wrong_first_date_rejected(self):
        doc,p=fixture(first="31.12.2024")
        with self.assertRaises(ValueError):extract_page(p,1,"2024-09-30")

    def test_annual_column_rejected(self):
        doc,p=fixture(quarter=False)
        with self.assertRaises(ValueError):extract_page(p,1,"2024-09-30")

    def test_missing_decimal_is_never_guessed(self):
        doc,p=fixture(profit="1 324")
        with self.assertRaises(ValueError):extract_page(p,1,"2024-09-30")

    def test_negative_profit_preserved(self):
        doc,p=fixture(profit="(1,324)")
        self.assertEqual(extract_page(p,1,"2024-09-30")["facts"]["NET_PROFIT_QUARTER"]["value"],"-132.4")

    def test_compact_month_date(self):
        self.assertEqual(iso_date("September 30,2024"),"2024-09-30")
        self.assertEqual(iso_date("30Sep2024"),"2024-09-30")

if __name__=="__main__":unittest.main()
