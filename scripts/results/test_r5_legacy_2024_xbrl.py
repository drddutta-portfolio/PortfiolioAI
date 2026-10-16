#!/usr/bin/env python3
"""R5 2024 original NSE XBRL safety/regression tests (no network or writes)."""
from pathlib import Path
import importlib.util
import unittest
source=Path(__file__).with_name("r5-legacy-2024-xbrl.py")
spec=importlib.util.spec_from_file_location("results_r5_legacy",source)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
METADATA={"symbol":"RELIANCE","isin":"INE002A01018","period":"Quarterly",
 "fromDate":"01-Oct-2024","toDate":"31-Dec-2024",
 "consolidated":"Consolidated","cumulative":"Non-cumulative"}

def xml(fact="1500000000",currency="iso4217:INR",epsunit=True,dimensions=False):
  other='<xbrli:scenario><dim:explicitMember>con:Group</dim:explicitMember></xbrli:scenario>' if dimensions else ""
  return f"""<?xml version="1.0"?>
<xbrli:xbrl xmlns:xbrli="http://www.xbrl.org/2003/instance"
 xmlns:ind="http://example.org/indas" xmlns:dim="http://example.org/dim">
 <xbrli:context id="OneD"><xbrli:entity><xbrli:identifier
 scheme="http://www.nseindia.com/NSESymbol">RELIANCE</xbrli:identifier></xbrli:entity>
 <xbrli:period><xbrli:startDate>2024-10-01</xbrli:startDate><xbrli:endDate>2024-12-31</xbrli:endDate></xbrli:period>{other}</xbrli:context>
 <xbrli:unit id="INR"><xbrli:measure>{currency}</xbrli:measure></xbrli:unit>
 <xbrli:unit id="EPS"><xbrli:divide><xbrli:unitNumerator><xbrli:measure>iso4217:INR</xbrli:measure></xbrli:unitNumerator>
 <xbrli:unitDenominator><xbrli:measure>xbrli:shares</xbrli:measure></xbrli:unitDenominator></xbrli:divide></xbrli:unit>
 <ind:RevenueFromOperations contextRef="OneD" unitRef="INR">{fact}</ind:RevenueFromOperations>
 <ind:ProfitLossForPeriod contextRef="OneD" unitRef="INR">100000000</ind:ProfitLossForPeriod>
 <ind:DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations contextRef="OneD" unitRef="EPS">7.5</ind:DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations>
</xbrli:xbrl>""".encode()

class LegacyTests(unittest.TestCase):
 def test_exact_positive_originals(self):
  x,e=module.extract(xml(),METADATA,"RELIANCE","INE002A01018")
  self.assertIsNone(e)
  self.assertEqual(x["period_end"],"2024-12-31")
  self.assertEqual(x["facts"]["OPERATING_REVENUE_QUARTER"]["value"],"150")
  self.assertEqual(x["facts"]["NET_PROFIT_QUARTER"]["value"],"10")
  self.assertEqual(x["facts"]["EPS_DILUTED"]["value"],"7.5")
 def test_missing_2024_catalog_isin_needs_exact_nse_circular(self):
  issuer_xml=(xml().replace(b"RELIANCE",b"AXISBANK")
    .replace(b"ProfitLossForPeriod",b"ProfitLossForThePeriod")
    .replace(b"DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations",
             b"DilutedEarningsPerShareAfterExtraordinaryItems"))
  issuer_xml=issuer_xml.replace(b"</xbrli:xbrl>",
    b'<ind:InterestEarned contextRef="OneD" unitRef="INR">2500000000</ind:InterestEarned>'
    b'<ind:InterestExpended contextRef="OneD" unitRef="INR">1000000000</ind:InterestExpended>'
    b'</xbrli:xbrl>')
  metadata={**METADATA,"symbol":"AXISBANK"}
  metadata.pop("isin")
  out,err=module.extract(issuer_xml,metadata,"AXISBANK","INE238A01034")
  self.assertIsNone(err)
  self.assertEqual(out["source_isin"],"INE238A01034")
  self.assertEqual(out["independent_isin_evidence"],"NSE_CML61473_2024_AXISBANK_INE238A01034")
  missing_literal,lit_reason=module.extract(issuer_xml,{**metadata,"isin":"NA"},"AXISBANK","INE238A01034")
  self.assertIsNone(lit_reason)
  self.assertEqual(missing_literal["source_isin"],"INE238A01034")
  wrong_literal,wrong_reason=module.extract(issuer_xml,{**metadata,"isin":"INE999A01011"},"AXISBANK","INE238A01034")
  self.assertIsNone(wrong_literal)
  self.assertEqual(wrong_reason,"UNKNOWN_HISTORICAL_ISIN")
  forged,reason=module.extract(issuer_xml,metadata,"AXISBANK","INE238A01035")
  self.assertIsNone(forged)
  self.assertEqual(reason,"UNKNOWN_HISTORICAL_ISIN")
  other_xml=xml()
  other_metadata={**METADATA}
  other_metadata.pop("isin")
  other,reason=module.extract(other_xml,other_metadata,"RELIANCE","INE002A01018")
  self.assertIsNone(other)
  self.assertEqual(reason,"UNKNOWN_HISTORICAL_ISIN")

 def test_cams_2024_original_historical_isin_uses_exact_split_proof(self):
  original=xml().replace(b"RELIANCE",b"CAMS")
  manifest={**METADATA,"symbol":"CAMS"}
  manifest.pop("isin")
  x,err=module.extract(original,manifest,"CAMS","INE596I01020")
  self.assertIsNone(err)
  self.assertEqual(x["source_isin"],"INE596I01012")
  self.assertIn("NCL/CMPT/71607",x["historical_identity_link"]["evidence"])
  self.assertEqual(x["independent_isin_evidence"],"NCL_CMPT71607_CAMS_2024_PRE_SPLIT_ISIN")
  self.assertEqual(x["facts"]["EPS_DILUTED"]["value"],"7.5")
  forged=original.replace(b"</xbrli:xbrl>",b'<ind:ISIN>INE999A01011</ind:ISIN></xbrli:xbrl>')
  fail,reason=module.extract(forged,manifest,"CAMS","INE596I01020")
  self.assertIsNone(fail)
  self.assertEqual(reason,"SOURCE_EMBEDDED_ISIN_MISMATCH")
  other,reason=module.extract(original,manifest,"CAMS","INE596I01021")
  self.assertIsNone(other)
  self.assertEqual(reason,"UNKNOWN_HISTORICAL_ISIN")

 def test_td_power_2024_split_identity_requires_official_old_isin(self):
  orig=xml().replace(b"RELIANCE",b"TDPOWERSYS")
  meta={**METADATA,"symbol":"TDPOWERSYS"}
  meta.pop("isin")
  parsed,error=module.extract(orig,meta,"TDPOWERSYS","INE419M01035")
  self.assertIsNone(error)
  self.assertEqual(parsed["source_isin"],"INE419M01027")
  self.assertEqual(parsed["historical_identity_link"]["split_new_per_old"],"2")
  self.assertEqual(parsed["independent_isin_evidence"],"NSE_CML75855_TDPOWERSYS_2024_PRE_SPLIT_ISIN")
  forged=orig.replace(b"</xbrli:xbrl>",b'<ind:ISIN>INE999A01011</ind:ISIN></xbrli:xbrl>')
  parsed,error=module.extract(forged,meta,"TDPOWERSYS","INE419M01035")
  self.assertIsNone(parsed)
  self.assertEqual(error,"SOURCE_EMBEDDED_ISIN_MISMATCH")

 def test_kotak_2024_original_bank_isin_uses_exchange_split_circular(self):
  original=(xml().replace(b"RELIANCE",b"KOTAKBANK")
    .replace(b"ProfitLossForPeriod",b"ProfitLossForThePeriod")
    .replace(b"DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations",
             b"DilutedEarningsPerShareAfterExtraordinaryItems"))
  original=original.replace(b"</xbrli:xbrl>",
    b'<ind:InterestEarned contextRef="OneD" unitRef="INR">2500000000</ind:InterestEarned>'
    b'<ind:InterestExpended contextRef="OneD" unitRef="INR">1000000000</ind:InterestExpended>'
    b'</xbrli:xbrl>')
  metadata={**METADATA,"symbol":"KOTAKBANK"}
  metadata.pop("isin")
  data,error=module.extract(original,metadata,"KOTAKBANK","INE237A01036")
  self.assertIsNone(error)
  self.assertEqual(data["source_isin"],"INE237A01028")
  self.assertIn("MSE/LIST/18443/2026",data["historical_identity_link"]["evidence"])
  self.assertEqual(data["independent_isin_evidence"],"MSE_LIST18443_KOTAKBANK_2024_PRE_SPLIT_ISIN")
  wrong,error=module.extract(original,metadata,"KOTAKBANK","INE237A01028")
  self.assertIsNone(wrong)
  self.assertEqual(error,"UNKNOWN_HISTORICAL_ISIN")

 def test_source_embedded_isin_must_not_disagree_with_nse_circular(self):
  issuer_xml=xml().replace(b"RELIANCE",b"AXISBANK")
  issuer_xml=issuer_xml.replace(b"</xbrli:xbrl>",b'<ind:ISIN>INE999A01011</ind:ISIN></xbrli:xbrl>')
  metadata={**METADATA,"symbol":"AXISBANK"}
  metadata.pop("isin")
  record,error=module.extract(issuer_xml,metadata,"AXISBANK","INE238A01034")
  self.assertIsNone(record)
  self.assertEqual(error,"SOURCE_EMBEDDED_ISIN_MISMATCH")

 def test_missing_identity(self):
  x,e=module.extract(xml(),METADATA,"INFY","INE009A01021")
  self.assertIsNone(x);self.assertEqual(e,"CATALOG_SYMBOL_MISMATCH")
 def test_wrong_quarter(self):
  x,e=module.extract(xml(),{**METADATA,"toDate":"30-Jun-2024"},"RELIANCE","INE002A01018")
  self.assertIsNone(x);self.assertEqual(e,"INVALID_2024_QUARTER")
 def test_unknown_currency(self):
  x,e=module.extract(xml(currency="iso4217:USD"),METADATA,"RELIANCE","INE002A01018")
  self.assertIsNone(e);self.assertNotIn("OPERATING_REVENUE_QUARTER",x["facts"])
 def test_context_dimension_not_accepted(self):
  x,e=module.extract(xml(dimensions=True),METADATA,"RELIANCE","INE002A01018")
  self.assertIsNone(x);self.assertEqual(e,"SOURCE_QUARTER_CONTEXT_MISSING")
 def test_reject_xml_dtd(self):
  x,e=module.extract(b"<!DOCTYPE x [ <!ENTITY probe SYSTEM 'file:///etc/passwd'> ]>"+xml(),METADATA,"RELIANCE","INE002A01018")
  self.assertIsNone(x);self.assertEqual(e,"INVALID_XML_BYTES")
 def test_conflicting_duplicate_source_facts_are_not_selected(self):
  sample=xml()
  sample=sample.replace(b"</xbrli:xbrl>",b'<ind:RevenueFromOperations contextRef="OneD" unitRef="INR">999999999</ind:RevenueFromOperations></xbrli:xbrl>')
  x,e=module.extract(sample,METADATA,"RELIANCE","INE002A01018")
  self.assertIsNone(e);self.assertNotIn("OPERATING_REVENUE_QUARTER",x["facts"])
 def test_allowlisted_source_origin_only(self):
  self.assertTrue(module.origin("https://nsearchives.nseindia.com/corporate/xbrl/INDAS_123.xml"))
  self.assertFalse(module.origin("https://evil.org/corporate/xbrl/INDAS_123.xml"))
if __name__=="__main__":unittest.main()
