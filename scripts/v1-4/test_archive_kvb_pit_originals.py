import unittest
import json
from archive_kvb_pit_originals import qualified_source, MANIFEST

class SourceScope(unittest.TestCase):
    source = {"exchange_url": "https://nsearchives.nseindia.com/corporate/KARURVYSYA_2021_Presentation.PDF", "exchange_original_sha256": "a" * 64}
    def test_exact_source_produces_content_addressed_development_key(self):
        self.assertEqual(qualified_source(self.source)[2], "portfolioai-history/development/v1-4/banking/pit-originals/" + "a" * 64 + ".pdf")
    def test_rejects_other_hosts_stocks_credentials_query_and_bad_hash(self):
        for url in ("https://attacker.example/corporate/KARURVYSYA_x.pdf", "https://nsearchives.nseindia.com/corporate/OTHER_x.pdf", "https://user@nsearchives.nseindia.com/corporate/KARURVYSYA_x.pdf", self.source["exchange_url"] + "?token=x"):
            with self.assertRaises(ValueError): qualified_source({**self.source, "exchange_url": url})
        with self.assertRaises(ValueError): qualified_source({**self.source, "exchange_original_sha256": "bad"})
    def test_official_annual_report_identity_is_exact(self):
        url = "https://nsearchives.nseindia.com/annual_reports/AR_27187_KARURVYSYA_2024_2025_A_30072025192827.pdf"
        self.assertEqual(qualified_source({**self.source, "exchange_url": url})[0], url)
        with self.assertRaises(ValueError): qualified_source({**self.source, "exchange_url": url.replace("KARURVYSYA", "OTHER")})
    def test_generic_exchange_filename_requires_exact_original_pin(self):
        pin = next(p for p in json.loads(MANIFEST.read_text()) if "/corporate/KVBResults_" in p["original_url"])
        row = {"exchange_url": pin["original_url"], "exchange_original_sha256": pin["original_sha256"]}
        self.assertEqual(qualified_source(row)[0], pin["original_url"])
        with self.assertRaises(ValueError): qualified_source({**row, "exchange_original_sha256": "a" * 64})

if __name__ == "__main__": unittest.main()
