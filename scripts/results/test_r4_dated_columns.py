import copy,unittest
from r4_dated_columns import extract_tables

def fixture():
    return [[["NSE Symbol","FIXTURE"],["ISIN","INE000000001"],["Reporting type","Quarterly"],["Level of rounding used in financial results","Lakhs"]],
        [["Date of start of reporting period","01-07-2025","01-04-2025","01-07-2024","01-04-2024"],
         ["Date of end of reporting period","30-09-2025","30-06-2025","30-09-2024","30-09-2024"],
         ["Nature of report standalone or consolidated","Consolidated","Consolidated","Consolidated","Consolidated"],
         ["Revenue from operations","900","700","500","1500"],
         ["Total profit (loss) for period","90","70","(50)","150"],
         ["Diluted earnings (loss) per share from continuing and discontinued operations","9","7","(5)","15"]]]

class DatedColumnTest(unittest.TestCase):
    def test_explicit_dates_select_comparative_quarter_and_exclude_same_end_ytd(self):
        p=extract_tables(fixture(),"FIXTURE","INE000000001","2024-09-30")
        self.assertEqual(p["facts"]["OPERATING_REVENUE_QUARTER"]["value"],"5")
        self.assertEqual(p["facts"]["NET_PROFIT_QUARTER"]["value"],"-0.5")
        self.assertEqual(p["facts"]["EPS_DILUTED"]["value"],"-5")
        self.assertEqual(p["facts"]["EPS_DILUTED"]["column_index"],2)

    def test_current_first_column_is_independent_anchor(self):
        p=extract_tables(fixture(),"FIXTURE","INE000000001","2025-09-30")
        self.assertEqual(p["facts"]["NET_PROFIT_QUARTER"]["value"],"0.9")

    def test_no_annual_subtraction_or_missing_number_inference(self):
        x=fixture();x[1][0][3]="01-04-2024"
        with self.assertRaises(ValueError):extract_tables(x,"FIXTURE","INE000000001","2024-09-30")
        x=fixture();x[1][-1][3]="-"
        with self.assertRaises(ValueError):extract_tables(x,"FIXTURE","INE000000001","2024-09-30")

    def test_wrong_identity_and_unknown_scope_or_unit_rejected(self):
        for args in (("OTHER","INE000000001"),("FIXTURE","OTHER")):
            with self.assertRaises(ValueError):extract_tables(fixture(),*args,"2024-09-30")
        x=fixture();x[1][2][3]="unknown"
        with self.assertRaises(ValueError):extract_tables(x,"FIXTURE","INE000000001","2024-09-30")
        x=fixture();x[0][-1][1]="unknown"
        with self.assertRaises(ValueError):extract_tables(x,"FIXTURE","INE000000001","2024-09-30")

    def test_conflicting_duplicated_statement_is_rejected(self):
        x=fixture();other=copy.deepcopy(x[1]);other[3][3]="999";x.append(other)
        with self.assertRaises(ValueError):extract_tables(x,"FIXTURE","INE000000001","2024-09-30")

    def test_empty_column_is_not_shifted_to_another_quarter(self):
        x=fixture();x[1][3][2]=""
        self.assertEqual(extract_tables(x,"FIXTURE","INE000000001","2024-09-30")["facts"]["OPERATING_REVENUE_QUARTER"]["value"],"5")

    def test_real_html_adapter_keeps_date_and_financial_cell_positions(self):
        from r4_dated_columns import extract
        html="".join("<table>"+"".join("<tr>"+"".join("<td>"+c+"</td>" for c in row)+"</tr>" for row in table)+"</table>" for table in fixture())
        self.assertEqual(extract(html,"FIXTURE","INE000000001","2024-09-30")["facts"]["EPS_DILUTED"]["value"],"-5")

class HTMLShapeTests(unittest.TestCase):
    def test_nested_tables_preserve_parent_text_and_preorder(self):
        from r4_dated_columns import tables_from_html
        html='<table><tr><td colspan="2">Name</td><td><b>A</b>&nbsp;B<table><tr><td>Inner</td><td>12</td></tr></table>C</td></tr></table>'
        self.assertEqual(tables_from_html(html),[[['Name','Name','A B Inner 12 C']],[['Inner','12']]])
    def test_script_style_comments_are_not_financial_values(self):
        from r4_dated_columns import parse_html
        text,tables=parse_html('<style>999</style><script>777</script><table><tr><td>Revenue</td><td>10<!--ignored-->00</td></tr></table>')
        self.assertNotIn('999',text);self.assertNotIn('777',text)
        self.assertEqual(tables,[[['Revenue','10 00']]])
    def test_invalid_expansion_is_rejected(self):
        from r4_dated_columns import tables_from_html
        for span in ('0','33','invalid'):
            with self.assertRaisesRegex(ValueError,'SPAN_BOUND'):tables_from_html('<table><tr><td colspan="'+span+'">1</td></tr></table>')

if __name__=="__main__":unittest.main()

