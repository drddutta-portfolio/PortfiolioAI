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
    def wrapped_bank_eps(self,gap=12):
        doc,p=fixture(first='30.09.2025',third='30.09.2024')
        p.add_redact_annot(fitz.Rect(20,205,900,225),fill=(1,1,1));p.apply_redactions()
        p.insert_text((25,220),'(b) Diluted EPS (before and after extraordinary',fontsize=10)
        p.insert_text((25,220+gap),'items)',fontsize=10)
        for x,value in ((475,'7.43'),(625,'37.81'),(775,'11.88')):p.insert_text((x,220+gap),value,fontsize=10)
        return doc,p

    def test_wrapped_bank_eps_keeps_explicit_row_label_and_cells(self):
        doc,p=self.wrapped_bank_eps()
        out=extract_page(p,1,'2024-09-30',allow_comparative=True)
        self.assertEqual(out['facts']['EPS_DILUTED']['value'],'11.88')
        self.assertIn('Diluted EPS',out['facts']['EPS_DILUTED']['evidence_line'])

    def test_distant_eps_heading_cannot_label_unrelated_items(self):
        doc,p=self.wrapped_bank_eps(gap=30)
        with self.assertRaises(ValueError):extract_page(p,1,'2024-09-30',allow_comparative=True)

    def test_split_numeric_date_keeps_first_physical_quarter(self):
        from r4_pdf_geometry import dated_headers
        def w(x,t):return (x,10,x+len(t)*2,12,t)
        rows=[(11,[w(100,'3'),w(103,'1.03.'),w(114,'20'),w(119,'26'),w(150,'31.12.2025'),w(200,'31.03.2025'),w(250,'31.03.20'),w(267,'25')])]
        dates=list(dated_headers(rows))[0][2]
        self.assertEqual([d[0] for d in dates],['2026-03-31','2025-12-31','2025-03-31','2025-03-31'])

    def test_adjacent_decimal_fragments_preserve_all_printed_characters(self):
        words=[(100,10,110,12,'235'),(111,10,120,12,'.16')]
        value,original=number(words)
        self.assertEqual(value,Decimal('235.16'))
        self.assertEqual(original,'235 .16')

    def test_separated_numbers_and_missing_decimal_are_not_joined(self):
        for words in ([(100,10,110,12,'235'),(120,10,130,12,'.16')],[(100,10,110,12,'235'),(111,10,120,12,'16')]):
            with self.assertRaises(ValueError):number(words)

    def auxiliary_tax_fixture(self,total=True):
        doc,p=fixture(first='30.09.2025',third='30.09.2024')
        rows=[(300,'Profit before tax','3,000'),(325,'Current tax','800'),(350,'Deferred tax','73'),(375,'Current tax expense relating to previous year','-')]
        if total:rows.append((400,'Total tax expense','873'))
        for y,label,value in rows:
            p.insert_text((25,y),label,fontsize=10)
            for x in (475,625,775):p.insert_text((x,y),value,fontsize=10)
        return doc,p

    def test_explicit_total_tax_survives_unavailable_prior_year_component(self):
        doc,p=self.auxiliary_tax_fixture()
        result=extract_page(p,1,'2024-09-30',allow_comparative=True)
        self.assertEqual(result['facts']['NET_PROFIT_QUARTER']['value'],'212.7')
        self.assertEqual(result['arithmetic_validation']['tax_crore'],'87.3')
        self.assertEqual(result['arithmetic_validation']['difference_crore'],'0.0')

    def test_unavailable_prior_tax_is_not_assumed_zero(self):
        doc,p=self.auxiliary_tax_fixture(total=False)
        result=extract_page(p,1,'2024-09-30',allow_comparative=True)
        self.assertIsNone(result['arithmetic_validation'])

    def test_dash_in_required_profit_is_still_rejected(self):
        doc,p=fixture(first='30.09.2025',third='30.09.2024',profit='-')
        with self.assertRaisesRegex(ValueError,'CORRUPT_OR_MISSING_NUMERIC_CELL'):extract_page(p,1,'2025-09-30',allow_comparative=True)

    def starred_eps(self,footnote=True):
        doc,p=fixture(first='30.09.2025',third='30.09.2024')
        p.add_redact_annot(fitz.Rect(450,206,850,225),fill=(1,1,1));p.apply_redactions()
        for x,value in ((475,'7.43*'),(625,'37.81*'),(775,'11.88*')):p.insert_text((x,220),value,fontsize=10)
        if footnote:p.insert_text((25,280),'* Not Annualised',fontsize=10)
        return doc,p

    def test_explicit_nonannualised_eps_footnote_preserves_printed_cell(self):
        doc,p=self.starred_eps()
        result=extract_page(p,1,'2024-09-30',allow_comparative=True)
        self.assertEqual(result['facts']['EPS_DILUTED']['value'],'11.88')
        self.assertEqual(result['facts']['EPS_DILUTED']['original_value'],'11.88*')

    def test_attached_eps_marker_without_explicit_footnote_is_rejected(self):
        doc,p=self.starred_eps(False)
        with self.assertRaisesRegex(ValueError,'CORRUPT_OR_MISSING_NUMERIC_CELL'):extract_page(p,1,'2024-09-30',allow_comparative=True)

    def test_eps_footnote_does_not_authorize_annotated_revenue(self):
        doc,p=self.starred_eps()
        p.add_redact_annot(fitz.Rect(760,146,850,166),fill=(1,1,1));p.apply_redactions()
        p.insert_text((775,160),'7,586*',fontsize=10)
        with self.assertRaisesRegex(ValueError,'CORRUPT_OR_MISSING_NUMERIC_CELL'):extract_page(p,1,'2024-09-30',allow_comparative=True)

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

    def test_month_above_the_explicit_day_and_year(self):
        doc,p=fixture(first="September",third="September")
        p.add_redact_annot(fitz.Rect(595,112,710,130),fill=(1,1,1));p.apply_redactions()
        p.insert_text((600,125),"June",fontsize=10)
        for x,rest in [(450,"30, 2025"),(600,"30, 2025"),(750,"30, 2024")]:p.insert_text((x,140),rest,fontsize=10)
        out=extract_page(p,1,"2024-09-30",allow_comparative=True)
        self.assertEqual(out["column_index"],2)
        self.assertEqual(out["facts"]["EPS_DILUTED"]["value"],"11.88")

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

class EarningSectionsTest(unittest.TestCase):
    def test_only_explicit_combined_eps_section_can_supply_total_eps(self):
        doc,page=fixture(first='30.09.2025',third='30.09.2024')
        page.add_redact_annot(fitz.Rect(20,205,950,230),fill=(1,1,1));page.apply_redactions()
        for y,heading,value in [(240,'Earnings per equity share - continuing operations','7.69'),(300,'Earnings per equity share - discontinued operations','-'),(360,'Earnings per equity share - continuing and discontinued operations','7.73')]:
            page.insert_text((25,y),heading,fontsize=10)
            page.insert_text((25,y+20),'Diluted',fontsize=10)
            for x in (475,625,775):page.insert_text((x,y+20),value,fontsize=10)
        out=extract_page(page,1,'2024-09-30',allow_comparative=True)
        self.assertEqual(out['facts']['EPS_DILUTED']['value'],'7.73')
    def test_compact_subsections_do_not_combine_two_component_headings(self):
        doc,page=fixture(first='30.09.2025',third='30.09.2024')
        page.add_redact_annot(fitz.Rect(20,205,950,230),fill=(1,1,1));page.apply_redactions()
        page.insert_text((25,240),'Earnings per equity share',fontsize=7)
        for y,heading,value in [(250,'a) from continuing operations','7.69'),(280,'b) from discontinued operations','-'),(310,'c) from continuing and discontinued operations','7.73')]:
            page.insert_text((25,y),heading,fontsize=7)
            page.insert_text((25,y+8),'Basic',fontsize=7)
            page.insert_text((25,y+16),'Diluted',fontsize=7)
            for x in (475,625,775):page.insert_text((x,y+16),value,fontsize=7)
        out=extract_page(page,1,'2024-09-30',allow_comparative=True)
        self.assertEqual(out['facts']['EPS_DILUTED']['value'],'7.73')

    def test_component_eps_alone_does_not_qualify_the_trio(self):
        doc,page=fixture(first='30.09.2025',third='30.09.2024')
        page.insert_text((25,205),'Earnings per equity share - continuing operations',fontsize=10)
        with self.assertRaisesRegex(ValueError,'NO_PROVEN'):extract_page(page,1,'2024-09-30',allow_comparative=True)

class NumericFootnoteTest(unittest.TestCase):
    def test_separate_footnote_markers_do_not_change_the_number(self):
        from r4_pdf_geometry import number
        self.assertEqual(number([(1,1,20,10,'(0.20)'),(22,1,25,10,'*')]),(Decimal('-0.20'),'(0.20)'))
    def test_missing_decimal_and_split_digits_remain_rejected(self):
        from r4_pdf_geometry import number
        for tokens in [('12','34'),('*',),('1.2','3')]:
            with self.assertRaises(ValueError):number([(i*20,1,i*20+10,10,x) for i,x in enumerate(tokens)])

if __name__=="__main__":unittest.main()

class RegulatoryEPS(unittest.TestCase):
    def test_explicit_before_after_regulatory_subgroups_select_after(self):
        doc,p=fixture()
        p.add_redact_annot(fitz.Rect(20,205,900,230),fill=(1,1,1));p.apply_redactions()
        for y,label,values in [
            (220,'Earnings per equity share',None),
            (240,'(i) Before Net Movement in Regulatory Deferral Balances',None),
            (260,'Diluted',['3.68','3.89','2.93']),
            (280,'(ii) After Net Movement in Regulatory Deferral Balances',None),
            (300,'Diluted',['2.90','3.03','2.74'])]:
            p.insert_text((25,y),label,fontsize=10)
            if values:
                for i,v in enumerate(values):p.insert_text((475+i*150,y),v,fontsize=10)
        parsed=extract_page(p,1,'2024-09-30',allow_comparative=True)
        self.assertEqual(parsed['facts']['EPS_DILUTED']['value'],'2.90')

    def test_before_regulatory_alone_cannot_supply_total_eps(self):
        doc,p=fixture()
        p.insert_text((25,205),'Earnings per equity share Before Net Movement in Regulatory Deferral Balances',fontsize=8)
        with self.assertRaises(ValueError):extract_page(p,1,'2024-09-30',allow_comparative=True)
