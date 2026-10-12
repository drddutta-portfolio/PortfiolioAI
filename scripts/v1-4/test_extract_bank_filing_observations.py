import unittest
from extract_bank_filing_observations import extract, numeric

class ExtractionTests(unittest.TestCase):
    def rows(self):
        return [["NSE Symbol", "BANK"], ["Description of presentation currency", "INR"],
            ["Level of rounding used in financial results", "Lakhs"],
            ["A", "Date of start of reporting period", "01-01-2026", "01-04-2025"],
            ["B", "Date of end of reporting period", "31-03-2026", "31-03-2026"],
            ["D", "Nature of report standalone or consolidated", "Standalone", "Standalone"],
            ["C", "Whether results are audited or unaudited", "Audited", "Audited"],
            ["", "Return on assets", "2.100", "1.9300"],
            ["", "Diluted earnings per share after extraordinary items", "7.5", "25.97"],
            ["", "Total interest earned", "2,90,365.00", "11,07,435.00"]]
    def test_periods_units_and_exact_values(self):
        facts, _ = extract(self.rows(), "BANK")
        roa = [r for r in facts if r["code"] == "ROA_REPORTED"]
        self.assertEqual([r["value"] for r in roa], ["2.100", "1.9300"])
        self.assertEqual(roa[1]["period_start"], "2025-04-01")
        eps = next(r for r in facts if r["code"] == "EPS_DILUTED")
        self.assertEqual(eps["unit"], "CURRENCY_PER_SHARE")
        self.assertIsNone(eps["document_scale"])
    def test_conflicting_row_is_not_chosen(self):
        rows = self.rows() + [["", "Return on assets", "2.100", "1.9200"]]
        facts, gaps = extract(rows, "BANK")
        self.assertFalse(any(r["code"] == "ROA_REPORTED" for r in facts))
        self.assertTrue(any(r["code"] == "ROA_REPORTED" for r in gaps))
    def test_identity_mismatch_blocks_entire_source(self):
        with self.assertRaisesRegex(ValueError, "IDENTITY"):
            extract(self.rows(), "OTHER")
    def test_missing_is_not_zero_and_invalid_grouping_is_rejected(self):
        self.assertEqual(numeric("(1,23,456.70)"), "-123456.70")
        for value in ("", "-", "1,2,3", "NaN", "Infinity"):
            with self.assertRaises(ValueError): numeric(value)

if __name__ == "__main__": unittest.main()
