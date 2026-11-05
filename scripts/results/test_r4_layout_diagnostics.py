import importlib.util,pathlib,unittest
spec=importlib.util.spec_from_file_location('layout',pathlib.Path(__file__).with_name('r4-layout-diagnostics.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class LayoutTest(unittest.TestCase):
    def test_header_retains_printed_dates_and_removes_amounts_outside_date_columns(self):
        rows=[(100,[(10,99,40,101,'Profit'),(50,99,95,101,'1,234.56'),(120,99,180,101,'31.12.2025')])]
        words=m.header_words(rows,0,0,100,[('2025-12-31',120,180)])
        self.assertEqual([w[2] for w in words],['Profit','31.12.2025'])
    def test_body_labels_never_export_amounts(self):
        value=m.label_without_amounts('12 Profit before tax (1,234.56) 89.00')
        self.assertNotRegex(value,r'[0-9]')
        self.assertIn('Profit before tax',value)
if __name__=='__main__':unittest.main()
