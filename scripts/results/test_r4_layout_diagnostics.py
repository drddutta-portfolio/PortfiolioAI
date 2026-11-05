import importlib.util,pathlib,unittest
spec=importlib.util.spec_from_file_location('layout',pathlib.Path(__file__).with_name('r4-layout-diagnostics.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class LayoutTest(unittest.TestCase):
    def test_failed_metric_is_located_without_exporting_its_financial_cell(self):
        from test_r4_pdf_geometry import fixture
        doc,page=fixture(profit='1 324')
        value=m.page_layout(page,1,['2024-09-30'])['parse_status']['2024-09-30']
        self.assertEqual(value['status'],'CORRUPT_OR_MISSING_NUMERIC_CELL')
        self.assertEqual(value['metric'],'NET_PROFIT_QUARTER')
        self.assertNotRegex(value['row_label'],r'[0-9]')
        self.assertNotIn('324',str(value))

    def test_header_retains_printed_dates_and_removes_amounts_outside_date_columns(self):
        rows=[(100,[(10,99,40,101,'Profit'),(50,99,95,101,'1,234.56'),(120,99,180,101,'31.12.2025')])]
        words=m.header_words(rows,0,0,100,[('2025-12-31',120,180)])
        self.assertEqual([w[2] for w in words],['Profit','31.12.2025'])
    def test_body_labels_never_export_amounts(self):
        value=m.label_without_amounts('12 Profit before tax (1,234.56) 89.00')
        self.assertNotRegex(value,r'[0-9]')
        self.assertIn('Profit before tax',value)
if __name__=='__main__':unittest.main()
