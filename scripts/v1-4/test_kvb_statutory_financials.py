import unittest
from acquire_kvb_statutory_financials import source_for_period


class PeriodAndPublication(unittest.TestCase):
    row = {"symbol": "KARURVYSYA", "desc": "Financial Result Updates", "attchmntText": "financial results for the period ended March 31, 2022.",
           "attchmntFile": "https://nsearchives.nseindia.com/corporate/KVB_Results_21052022124543.pdf", "exchdisstime": "21-May-2022 12:47:01"}

    def test_exact_period_and_exchange_publication(self):
        self.assertEqual(source_for_period([self.row], 2022, 3), self.row)
        for change in ({"symbol": "OTHER"}, {"desc": "Press Release"}, {"attchmntText": "results ended September 30, 2022"}):
            with self.assertRaises(ValueError): source_for_period([{**self.row, **change}], 2022, 3)

    def test_url_aliases_need_verified_identical_bytes_not_latest_retrieval(self):
        first = {**self.row, "attchmntFile": "https://nsearchives.nseindia.com/corporate/KARURVYSYA_first.pdf", "exchdisstime": "20-May-2022 13:26:21"}
        with self.assertRaises(ValueError): source_for_period([first, self.row], 2022, 3)
        hashes = {first["attchmntFile"]: "a" * 64, self.row["attchmntFile"]: "a" * 64}
        self.assertEqual(source_for_period([self.row, first], 2022, 3, hashes), first)
        with self.assertRaises(ValueError): source_for_period([first, self.row], 2022, 3, {**hashes, self.row["attchmntFile"]: "b" * 64})


if __name__ == "__main__": unittest.main()
