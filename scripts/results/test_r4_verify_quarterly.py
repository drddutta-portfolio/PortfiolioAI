from pathlib import Path
import importlib.util
from decimal import Decimal
import unittest
spec=importlib.util.spec_from_file_location("r4",Path(__file__).with_name("r4-verify-quarterly.py"))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def row(code,value,source="a",scope="CONSOLIDATED",symbol="RELIANCE"):
 return dict(metric_code=code,numeric_value=Decimal(str(value)),source_record_id=source,
             consolidation_scope=scope,symbol=symbol,security_id="security",period_end="2026-06-30")
class R4Tests(unittest.TestCase):
 def test_preferred_reporting_scope(self):
  c=["OPERATING_REVENUE_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"]
  vals=[row(x,1) for x in c]+[row(x,10,"b","STANDALONE") for x in c]
  chosen,errors,quarters=m.select_quarters(vals)
  self.assertEqual(len(chosen),3)
  self.assertEqual(set(x["consolidation_scope"] for x in chosen),{"CONSOLIDATED"})
 def test_conflict_quarantined(self):
  xs=[row("OPERATING_REVENUE_QUARTER",1),row("NET_PROFIT_QUARTER",1),
      row("EPS_DILUTED",1),row("NET_PROFIT_QUARTER",2,"b")]
  chosen,blocked,_=m.select_quarters(xs)
  self.assertEqual(len(chosen),0)
  self.assertEqual(blocked["CONFLICTING_SAME_SCOPE_FILING_VALUES"],1)
 def test_cannot_mix_sources(self):
  xs=[row("OPERATING_REVENUE_QUARTER",1),row("NET_PROFIT_QUARTER",1),
      row("EPS_DILUTED",1,"b")]
  chosen,blocked,_=m.select_quarters(xs)
  self.assertEqual(len(chosen),0)
  self.assertEqual(blocked["NO_COMPLETE_SINGLE_SOURCE"],1)
 def test_bank_uses_nii(self):
  xs=[row("NET_INTEREST_INCOME_QUARTER",1,symbol="HDFCBANK"),
      row("NET_PROFIT_QUARTER",1,symbol="HDFCBANK"),row("EPS_DILUTED",1,symbol="HDFCBANK")]
  chosen,blocked,_=m.select_quarters(xs)
  self.assertEqual(len(chosen),3);self.assertFalse(blocked)
 def test_original_hash_and_source_match(self):
  src=dict(contract="PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1",period_end="2026-06-30",
     period_start="2026-04-01",consolidation_scope="CONSOLIDATED",
     issuer_filing_url="https://nsearchives.nseindia.com/corporate/ixbrl/x.html",
     original_sha256_unretained="a"*64,raw_nse_bytes_retained=False,facts={})
  record=dict(raw_payload={**src,r2_key="key",r2_manifest_sha256="a"*64},
       source_url=src["issuer_filing_url"],source_retrieved="2026-10-14")
  record["payload_hash"]=m.sha(m.canonical_bytes(record["raw_payload"]))
  self.assertIsNone(m.check_manifest(record,src))
  self.assertEqual(m.check_manifest(record,{**src,"period_end":"2026-03-31"}),"SOURCE_MANIFEST_MISMATCH")
if __name__=="__main__":unittest.main()
