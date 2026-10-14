#!/usr/bin/env python3
"""Standalone parse safety tests for the Results quarterly filing collector."""
import importlib.util
from pathlib import Path
import unittest

source=Path(__file__).with_name("r3-live-public-filing-batch.py")
spec=importlib.util.spec_from_file_location("results_acquire",source)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

def fixture(qstart="01-04-2026",qend="30-06-2026",isin="INE002A01018",unit="Lakhs",scope="Consolidated"):
    return f"""<html><body>
    <table>
      <tr><td>NSE Symbol</td><td>RELIANCE</td></tr>
      <tr><td>ISIN</td><td>{isin}</td></tr>
      <tr><td>Level of rounding used in financial results</td><td>{unit}</td></tr>
      <tr><td>Reporting Type</td><td>Quarterly</td></tr>
    </table>
    <table>
      <tr><td>Date of start of reporting period</td><td>{qstart}</td><td>01-04-2026</td></tr>
      <tr><td>Date of end of reporting period</td><td>{qend}</td><td>30-06-2026</td></tr>
      <tr><td>Nature of report standalone or consolidated</td><td>{scope}</td><td>{scope}</td></tr>
      <tr><td>Revenue from operations</td><td>3,11,85,000.00</td><td>3,11,85,000.00</td></tr>
      <tr><td>Total profit (loss) for period</td><td>23,19,600.00</td><td>23,19,600.00</td></tr>
      <tr><td>Diluted earnings (loss) per share from continuing and discontinued operations</td><td>15.48</td><td>15.48</td></tr>
    </table>
    <table><tr><td>Revenue from operations</td><td>3,40,25,700.00</td></tr>
    <tr><td>Total Segment Revenue</td><td>3,76,61,400.00</td></tr></table>
    </body></html>"""

class ResultsAcquisitionTests(unittest.TestCase):
    def test_quarter_and_exact_unit_conversion(self):
        v,reason=module.extract(fixture(),"RELIANCE","INE002A01018")
        self.assertIsNone(reason)
        self.assertEqual(v["period_start"],"2026-04-01")
        self.assertEqual(v["period_end"],"2026-06-30")
        self.assertEqual(v["scope"],"CONSOLIDATED")
        self.assertEqual(v["facts"]["OPERATING_REVENUE_QUARTER"]["value"],"311850.0000")
        self.assertEqual(v["facts"]["NET_PROFIT_QUARTER"]["value"],"23196.0000")
        self.assertEqual(v["facts"]["EPS_DILUTED"]["value"],"15.48")
    def test_identity_must_match(self):
        v,reason=module.extract(fixture(isin="INE999999999"),"RELIANCE","INE002A01018")
        self.assertIsNone(v)
        self.assertEqual(reason,"IDENTITY_MISMATCH_OR_UNKNOWN")
    def test_period_not_three_months(self):
        v,reason=module.extract(fixture(qstart="01-04-2025"),"RELIANCE","INE002A01018")
        self.assertIsNone(v)
        self.assertEqual(reason,"PERIOD_NOT_THREE_MONTHS")
    def test_unit_not_proven(self):
        v,reason=module.extract(fixture(unit="Crores"),"RELIANCE","INE002A01018")
        self.assertIsNone(v)
        self.assertEqual(reason,"UNSUPPORTED_OR_UNKNOWN_UNIT")
    def test_listing_links_only_allow_trusted_source(self):
        items={"data":[{"symbol":"RELIANCE","ixbrl":"https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_175608_17072026195004_iXBRL_WEB.html"},
                       {"symbol":"SOMEBODY","ixbrl":"https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_444_fake.html"},
                       {"symbol":"RELIANCE","ixbrl":"https://example.com/download.html"}]}
        urls=module.listing_urls(items,"RELIANCE")
        self.assertEqual(len(urls),1)

if __name__=="__main__":unittest.main()
