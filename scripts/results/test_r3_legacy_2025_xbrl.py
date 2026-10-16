#!/usr/bin/env python3
"""R4-only historical 2025 original NSE XBRL issuer/period regression tests."""
from pathlib import Path
import importlib.util
import unittest

source=Path(__file__).with_name("r3-legacy-2025-xbrl.py")
spec=importlib.util.spec_from_file_location("legacy_2025_original",source)
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
META={"symbol":"CAMS","fromDate":"01-Apr-2025","toDate":"30-Jun-2025",
      "consolidated":"Consolidated",
      "xbrl":"https://nsearchives.nseindia.com/corporate/xbrl/INTEGRATED_FILING_INDAS_123456.xml"}

def xml(symbol="CAMS",isin="INE596I01020",start="2025-04-01",end="2025-06-30",revenue="1000000000"):
    return f"""<?xml version="1.0"?>
<xbrli:xbrl xmlns:xbrli="http://www.xbrl.org/2003/instance" xmlns:ind="http://example.com/ind">
<ind:Symbol>{symbol}</ind:Symbol><ind:ISIN>{isin}</ind:ISIN><ind:ScripCode>111111</ind:ScripCode>
<xbrli:context id="OneD"><xbrli:entity><xbrli:identifier scheme="urn:nse">111111</xbrli:identifier></xbrli:entity>
<xbrli:period><xbrli:startDate>{start}</xbrli:startDate><xbrli:endDate>{end}</xbrli:endDate></xbrli:period></xbrli:context>
<xbrli:unit id="rupees"><xbrli:measure>iso4217:INR</xbrli:measure></xbrli:unit>
<xbrli:unit id="perShare"><xbrli:divide><xbrli:unitNumerator><xbrli:measure>iso4217:INR</xbrli:measure></xbrli:unitNumerator><xbrli:unitDenominator><xbrli:measure>xbrli:shares</xbrli:measure></xbrli:unitDenominator></xbrli:divide></xbrli:unit>
<ind:RevenueFromOperations contextRef="OneD" unitRef="rupees">{revenue}</ind:RevenueFromOperations>
<ind:ProfitLossForPeriod contextRef="OneD" unitRef="rupees">100000000</ind:ProfitLossForPeriod>
<ind:DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations contextRef="OneD" unitRef="perShare">5.25</ind:DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations>
</xbrli:xbrl>""".encode()

class Legacy2025Tests(unittest.TestCase):
    def test_original_isin_quarter_and_units(self):
        p,err=m.extract(xml(),META,"CAMS","INE596I01020")
        self.assertIsNone(err)
        self.assertEqual(p["scope"],"CONSOLIDATED")
        self.assertEqual(p["period_end"],"2025-06-30")
        self.assertEqual(p["facts"]["OPERATING_REVENUE_QUARTER"]["value"],"100")
        self.assertEqual(p["facts"]["NET_PROFIT_QUARTER"]["value"],"10")
        self.assertEqual(p["facts"]["EPS_DILUTED"]["value"],"5.25")

    def test_old_or_unapproved_identity_rejected(self):
        p,err=m.extract(xml(isin="INE999A01011"),META,"CAMS","INE596I01020")
        self.assertIsNone(p)
        self.assertEqual(err,"UNKNOWN_HISTORICAL_ISIN")
        p,err=m.extract(xml(symbol="OTHER"),META,"CAMS","INE596I01020")
        self.assertIsNone(p)
        self.assertEqual(err,"ISSUER_XML_SYMBOL_MISMATCH")

    def test_only_exact_single_quarter_context(self):
        p,err=m.extract(xml(start="2025-01-01"),META,"CAMS","INE596I01020")
        self.assertIsNone(p)
        self.assertEqual(err,"SOURCE_QUARTER_CONTEXT_MISSING")

    def test_duplicate_disagreeing_revenue_rejected(self):
        raw=xml().replace(b"</xbrli:xbrl>",b'<ind:RevenueFromOperations contextRef="OneD" unitRef="rupees">2000000000</ind:RevenueFromOperations></xbrli:xbrl>')
        p,err=m.extract(raw,META,"CAMS","INE596I01020")
        self.assertIsNone(err)
        self.assertNotIn("OPERATING_REVENUE_QUARTER",p["facts"])

    def test_origin_exact(self):
        self.assertTrue(m.origin(META["xbrl"]))
        self.assertFalse(m.origin("https://example.invalid/corporate/xbrl/INTEGRATED_FILING_INDAS_123456.xml"))

if __name__=="__main__":unittest.main()
