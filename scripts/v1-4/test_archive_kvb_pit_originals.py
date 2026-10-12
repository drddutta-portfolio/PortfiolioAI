import unittest
from archive_kvb_pit_originals import qualified_source

class SourceScope(unittest.TestCase):
    source = {"exchange_url": "https://nsearchives.nseindia.com/corporate/KARURVYSYA_2021_Presentation.PDF", "exchange_original_sha256": "a" * 64}
    def test_exact_source_produces_content_addressed_development_key(self):
        self.assertEqual(qualified_source(self.source)[2], "portfolioai-history/development/v1-4/banking/pit-originals/" + "a" * 64 + ".pdf")
    def test_rejects_other_hosts_stocks_credentials_query_and_bad_hash(self):
        for url in ("https://attacker.example/corporate/KARURVYSYA_x.pdf", "https://nsearchives.nseindia.com/corporate/OTHER_x.pdf", "https://user@nsearchives.nseindia.com/corporate/KARURVYSYA_x.pdf", self.source["exchange_url"] + "?token=x"):
            with self.assertRaises(ValueError): qualified_source({**self.source, "exchange_url": url})
        with self.assertRaises(ValueError): qualified_source({**self.source, "exchange_original_sha256": "bad"})

if __name__ == "__main__": unittest.main()
