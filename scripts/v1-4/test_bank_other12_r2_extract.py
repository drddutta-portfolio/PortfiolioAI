import unittest
from bank_other12_r2_extract import exact_candidates, monthly_keys

class ArchiveTests(unittest.TestCase):
    bank = {"id": "exact", "isin": "INE123456789", "symbol": "BANK"}
    def test_uses_latest_date_not_list_order(self):
        keys = ["x/decision_date=2026-01-30/a", "x/decision_date=2026-01-15/a"]
        self.assertEqual(monthly_keys(keys)["2026-01"], keys[0])
        with self.assertRaises(ValueError): monthly_keys(keys + ["y/decision_date=2026-01-30/a"])
    def test_retains_adjusted_column_identity_and_unadmitted_basis(self):
        row = exact_candidates({"isin": [self.bank["isin"]], "trade_date": ["2026-01-30"], "adjusted_close": ["10.25"]}, self.bank, "2026-01")
        self.assertEqual(row["price_column"], "adjusted_close")
        self.assertEqual(row["corporate_action_basis"], "NOT_QUALIFIED")
    def test_does_not_replace_historical_isin_with_same_symbol(self):
        row = exact_candidates({"isin": ["OLDER"], "symbol": ["BANK"], "close": ["10"], "trade_date": ["2026-01-30"]}, self.bank, "2026-01")
        self.assertEqual(row["state"], "EXACT_IDENTITY_NOT_FOUND")
    def test_conflicting_duplicates_block(self):
        row = exact_candidates({"security_id": ["exact", "exact"], "close": ["10", "11"], "trade_date": ["2026-01-30"] * 2}, self.bank, "2026-01")
        self.assertEqual(row["state"], "DUPLICATE_OR_AMBIGUOUS_PRICE")
    def test_missing_and_invalid_prices_never_become_candidates(self):
        for price in (None, "NaN", "Infinity", "0", "-1"):
            row = exact_candidates({"isin": [self.bank["isin"]], "close": [price], "trade_date": ["2026-01-30"]}, self.bank, "2026-01")
            self.assertEqual(row["state"], "PRICE_INVALID")

if __name__ == "__main__": unittest.main()
