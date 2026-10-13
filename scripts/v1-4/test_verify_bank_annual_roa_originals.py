import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location("roa",Path(__file__).with_name("verify_bank_annual_roa_originals.py"))
roa=importlib.util.module_from_spec(spec)
spec.loader.exec_module(roa)

class AnnualColumnTests(unittest.TestCase):
    def rows(self):
        return [["NSE Symbol","BANK"],["ISIN","INE000000000"],
                ["Nature of report standalone or consolidated","Standalone"],
                ["A","Date of start of reporting period","01-01-2026","01-04-2025"],
                ["B","Date of end of reporting period","31-03-2026","31-03-2026"],
                ["","Return on assets","0.50","1.93"],
                ["A","Date of start of reporting period","01-04-2025"]]
    def test_annual_column_is_not_quarterly_column_or_scalar_metadata(self):
        result=roa.annual_cell(self.rows(),"BANK")
        self.assertEqual(result["numeric_value"],"1.93")
        self.assertEqual(result["column_index"],3)
    def test_missing_full_year_is_blocked(self):
        rows=self.rows();rows[3][3]="01-01-2026"
        with self.assertRaises(ValueError):roa.annual_cell(rows,"BANK")
    def test_two_nonidentical_roa_rows_are_blocked(self):
        rows=self.rows();rows.append(["","Return on assets","0.50","1.94"])
        with self.assertRaises(ValueError):roa.annual_cell(rows,"BANK")
    def test_identity_scope_and_invalid_values_are_blocked(self):
        with self.assertRaises(ValueError):roa.annual_cell(self.rows(),"OTHER")
        rows=self.rows();rows[2][1]="Consolidated"
        with self.assertRaises(ValueError):roa.annual_cell(rows,"BANK")
        rows=self.rows();rows[5][3]="-"
        with self.assertRaises(ValueError):roa.annual_cell(rows,"BANK")

if __name__=="__main__":unittest.main()
