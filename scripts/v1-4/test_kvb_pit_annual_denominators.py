import unittest
from extract_kvb_pit_annual_denominators import annual_series

class AnnualDenominators(unittest.TestCase):
    def test_binds_columns_to_actual_full_financial_years(self):
        rows = annual_series("Year 2020-21 2021-22\nEPS (Rs.) 4.50 8.42\nBook Value(Rs.) 87.07 94.95\n")
        self.assertEqual(len(rows), 4)
        self.assertEqual(rows[0]["period_end"], "2021-03-31")
        self.assertFalse(any(r["canonical_admitted"] for r in rows))
        self.assertEqual(rows[-1]["code"], "EPS_ANNUAL_REPORTED")
    def test_footnote_financial_year_is_not_a_second_header(self):
        rows = annual_series("Year 2020-21\nEPS (Rs.) 4.50\nBook Value(Rs.) 87.07\nDuring the Financial Year 2016-17, shares were split.\n")
        self.assertEqual(len(rows), 2)
    def test_never_treats_annual_eps_as_ttm(self):
        rows = annual_series("Year 2020-21\nEPS (Rs.) 4.50*\nBook Value(Rs.) 87.07\n")
        self.assertEqual(rows[-1]["footnote_markers"], "*")
        self.assertNotIn("EPS_TTM", {r["code"] for r in rows})
    def test_missing_or_conflicting_headers_do_not_guess_columns(self):
        self.assertEqual(annual_series("Book Value(Rs.) 87.07"), [])
        self.assertEqual(annual_series("Year 2020-21\nYear 2021-22\nBook Value(Rs.) 87.07"), [])
    def test_mismatched_column_count_and_invalid_fiscal_year_block(self):
        self.assertEqual(annual_series("Year 2020-21 2021-22\nBook Value(Rs.) 87.07"), [])
        self.assertEqual(annual_series("Year 2020-22\nBook Value(Rs.) 87.07"), [])

if __name__ == "__main__": unittest.main()
