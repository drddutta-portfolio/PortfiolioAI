#!/usr/bin/env python3
"""Offline, no-network BSEIndiaApi source-discovery contract tests."""
import importlib.util
import unittest
from datetime import date
from pathlib import Path

spec=importlib.util.spec_from_file_location(
    "results_bse_live_discovery",
    Path(__file__).with_name("results_bse_live_discovery.py"),
)
source=importlib.util.module_from_spec(spec)
spec.loader.exec_module(source)

class BseLiveDiscoveryTests(unittest.TestCase):
    def test_latest_completed_quarter_rollover(self):
        self.assertEqual(source.last_completed_quarter(date(2026,11,7)),date(2026,9,30))
        self.assertEqual(source.last_completed_quarter(date(2027,1,1)),date(2026,12,31))
        self.assertEqual(source.last_completed_quarter(date(2026,7,1)),date(2026,6,30))
        self.assertEqual(source.period_label(date(2026,9,30)),"Sep-26")

    def test_only_explicit_current_quarter_field_is_a_hint(self):
        self.assertTrue(source.quarter_header_present({
            "results_in_crores":{"fields":["title","Sep-26","Jun-26","FY25-26"],"data":[]}
        },"Sep-26"))
        self.assertFalse(source.quarter_header_present({
            "results_in_crores":{"fields":["title","Jun-26","FY25-26"],"data":[]}
        },"Sep-26"))
        self.assertFalse(source.quarter_header_present({
            "results_in_crores":{"fields":"Sep-26"}
        },"Sep-26"))

    def test_discovery_never_bypasses_exchange_isin_and_scrip_identity(self):
        good={"ISIN":"INE038A01020","SecurityCode":"500440"}
        self.assertTrue(source.issuer_identity(good,"500440","INE038A01020"))
        self.assertFalse(source.issuer_identity(good,"500440","INE038A01021"))
        self.assertFalse(source.issuer_identity(good,"500441","INE038A01020"))
        self.assertFalse(source.issuer_identity(None,"500440","INE038A01020"))

if __name__=="__main__":unittest.main()
