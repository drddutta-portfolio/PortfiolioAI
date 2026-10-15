"""Hermetic source-adapter tests; live BSE network is tested separately in CI."""
from __future__ import annotations

import sys
import unittest
from datetime import date
from hashlib import sha256
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from portfolio_bse import PortfolioBSE, _VENDOR_SRC


PDF = "8e326f69-8061-4281-bc39-d8ac639479bd.pdf"


class Response:
    def __init__(self, code: int, body: bytes = b""):
        self.status_code = code
        self.ok = 200 <= code < 300
        self.body = body
        self.closed = False

    def iter_content(self, chunk_size: int = 65536):
        yield self.body[:5]
        yield self.body[5:]

    def close(self):
        self.closed = True


class FakeSession:
    def __init__(self, first=404, second=200, body=b"%PDF-1.4\nabc\n"):
        self.responses = [Response(first), Response(second, body)]
        self.urls = []

    def get(self, url, **kwargs):
        self.urls.append(url)
        return self.responses.pop(0)


class FakeBSE:
    def __init__(self):
        self.calls = []
        self.session = FakeSession()
        self.closed = False

    def announcements(self, **kwargs):
        self.calls.append(kwargs)
        return {
            "Table1": [{"ROWCNT": 3}],
            "Table": [
                {"SCRIP_CD": 500180, "NEWS_DT": "2025-01-28T21:24:47.417",
                 "NEWSSUB": "Unaudited Financial Results December 2024",
                 "ATTACHMENTNAME": PDF, "NEWSID": "x1"},
                {"SCRIP_CD": 500180, "NEWSSUB": "Investor presentation",
                 "ATTACHMENTNAME": PDF},
                {"SCRIP_CD": 500049, "NEWSSUB": "Financial Results",
                 "ATTACHMENTNAME": PDF},
            ],
        }

    def resultsSnapshot(self, code):
        self.calls.append(("snapshot", code))
        return {
            "periods": ["Jun-26", "Mar-26", "FY25-26"],
            "currency_unit": "in Cr.",
            "results_in_crores": {
                "fields": ["title", "Jun-26", "Mar-26", "FY25-26"],
                "data": [["Revenue", "79,362.78", "76,610.02", "3,07,522.08"]],
            },
            "period_links": [],
        }

    def getScripCode(self, symbol):
        return "500180" if symbol == "HDFCBANK" else "BAD"

    def exit(self):
        self.closed = True


def adapter() -> tuple[PortfolioBSE, FakeBSE]:
    item = PortfolioBSE.__new__(PortfolioBSE)
    fake = FakeBSE()
    item._bse = fake
    return item, fake


class PortfolioBseTests(unittest.TestCase):
    def test_pinned_vendor_and_corrected_upstream_key(self):
        code = (_VENDOR_SRC / "bse" / "BSE.py").read_text()
        self.assertIn('"strScrip": scripcode,', code)
        self.assertNotIn('"strscrip": scripcode,', code)
        self.assertIn('version = "3.3.3"', code)

    def test_snapshot_is_discovery_only(self):
        instance, fake = adapter()
        snap = instance.results_snapshot("500180")
        self.assertEqual(snap["periods"][:2], ["Jun-26", "Mar-26"])
        self.assertEqual(snap["qualification_status"], "DISCOVERY_ONLY")
        self.assertEqual(fake.calls[-1], ("snapshot", "500180"))

    def test_reject_invalid_scrips(self):
        instance, _ = adapter()
        for candidate in ("500180/../../", "HDFCBANK", "50018", "1234567"):
            with self.subTest(candidate=candidate):
                with self.assertRaises(ValueError):
                    instance.results_snapshot(candidate)

    def test_announcements_bounded_and_company_filtered(self):
        instance, fake = adapter()
        res = instance.financial_announcements(
            "500180", date(2025, 1, 1), date(2025, 2, 28), max_pages=2
        )
        self.assertEqual(res["records_seen"], 3)
        self.assertEqual(len(res["results"]), 1)
        only = res["results"][0]
        self.assertEqual(only["attachment_name"], PDF)
        self.assertEqual(only["qualification_status"], "DISCOVERY_ONLY")
        self.assertTrue(only["official_pdf_candidates"][0].startswith(
            "https://www.bseindia.com/xml-data/corpfiling/AttachHis/"
        ))
        self.assertEqual(fake.calls[0]["scripcode"], "500180")
        self.assertEqual(fake.calls[0]["page_no"], 1)
        self.assertEqual(len(fake.calls), 1)

    def test_reject_unbounded_date_windows(self):
        instance, _ = adapter()
        with self.assertRaises(ValueError):
            instance.financial_announcements(
                "500180", date(2024, 1, 1), date(2025, 1, 1)
            )
        with self.assertRaises(ValueError):
            instance.financial_announcements(
                "500180", date(2025, 2, 2), date(2025, 1, 1)
            )
        with self.assertRaises(ValueError):
            instance.financial_announcements(
                "500180", date(2025, 1, 1), date(2025, 2, 1), max_pages=500
            )

    def test_attachment_rejects_arbitrary_urls_and_paths(self):
        instance, _ = adapter()
        for candidate in ("../../abc.pdf", "https://evil.invalid/x.pdf", "x.pdf"):
            with self.assertRaises(ValueError):
                instance.retrieve_original_pdf(candidate)

    def test_pdf_404_fallback_real_bytes_and_hash(self):
        instance, fake = adapter()
        body = b"%PDF-1.4\nabc\n"
        pdf, meta = instance.retrieve_original_pdf(PDF)
        self.assertEqual(pdf, body)
        self.assertEqual(meta["sha256"], sha256(body).hexdigest())
        self.assertTrue(meta["source_url"].endswith("/AttachLive/" + PDF))
        self.assertEqual(len(fake.session.urls), 2)

    def test_fail_closed_on_fake_pdf(self):
        instance, fake = adapter()
        fake.session = FakeSession(body=b"<!DOCTYPE html>")
        with self.assertRaisesRegex(RuntimeError, "NOT_PDF"):
            instance.retrieve_original_pdf(PDF)

    def test_pdf_byte_bound(self):
        instance, fake = adapter()
        fake.session = FakeSession(body=b"%PDF-" + b"a" * 2500)
        with self.assertRaisesRegex(RuntimeError, "TOO_LARGE"):
            instance.retrieve_original_pdf(PDF, max_bytes=1024)

    def test_unverified_scrip_lookup(self):
        instance, _ = adapter()
        found = instance.get_scrip_candidate("HDFCBANK")
        self.assertEqual(found["bse_scrip_code"], "500180")
        self.assertEqual(found["identity_status"], "CANDIDATE_NOT_ISIN_VERIFIED")

    def test_context_manager_closes_library(self):
        instance, fake = adapter()
        with instance as conn:
            self.assertIs(conn, instance)
        self.assertTrue(fake.closed)


if __name__ == "__main__":
    unittest.main()
