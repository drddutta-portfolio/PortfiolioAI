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
 def test_bank_standalone_complete_when_consolidated_missing_eps(self):
  rs=[row("NET_INTEREST_INCOME_QUARTER",10,"c","CONSOLIDATED","FEDERALBNK"),
      row("NET_PROFIT_QUARTER",2,"c","CONSOLIDATED","FEDERALBNK")]
  rs.extend([row("NET_INTEREST_INCOME_QUARTER",8,"s","STANDALONE","FEDERALBNK"),
     row("NET_PROFIT_QUARTER",1,"s","STANDALONE","FEDERALBNK"),
     row("EPS_DILUTED",5,"s","STANDALONE","FEDERALBNK")])
  chosen,blocked,quarters=m.select_quarters(rs)
  self.assertEqual(len(chosen),3)
  self.assertEqual({r["consolidation_scope"] for r in chosen},{"STANDALONE"})
  self.assertEqual(blocked["STANDALONE_COMPLETE_CONSOLIDATED_INCOMPLETE_ADMITTED"],1)
 def test_conflicting_consolidated_never_falls_back(self):
  c=["OPERATING_REVENUE_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"]
  rs=[row(x,10,"a","CONSOLIDATED") for x in c]
  rs.append(row("NET_PROFIT_QUARTER",11,"new","CONSOLIDATED"))
  rs += [row(x,20,"b","STANDALONE") for x in c]
  selected,bad,_=m.select_quarters(rs)
  self.assertEqual(selected,[])
  self.assertEqual(bad["CONFLICTING_SAME_SCOPE_FILING_VALUES"],1)
 def test_bank_uses_nii(self):
  xs=[row("NET_INTEREST_INCOME_QUARTER",1,symbol="HDFCBANK"),
      row("NET_PROFIT_QUARTER",1,symbol="HDFCBANK"),row("EPS_DILUTED",1,symbol="HDFCBANK")]
  chosen,blocked,_=m.select_quarters(xs)
  self.assertEqual(len(chosen),3);self.assertFalse(blocked)
 def test_historical_isin_original_eps_qualification(self):
  e=dict(symbol="E2E",source_isin="INE255Z01019",isin="INE255Z01027",
     period_end="2026-03-31",eps_as_originally_reported_before_split=True,
     historical_identity_link=dict(source_isin="INE255Z01019",current_isin="INE255Z01027",
       ex_date="2026-06-05",split_new_per_old="10",
       evidence="MSE/LIST/19135/2026, 2026-06-03"))
  self.assertIsNone(m.historical_original_eps_proof(e))
  self.assertEqual(m.historical_original_eps_proof({**e,"period_end":"2026-06-30"}),"HISTORICAL_ORIGINAL_EPS_UNPROVEN")
  self.assertEqual(m.historical_original_eps_proof({**e,"source_isin":"fake"}),"HISTORICAL_IDENTITY_MISMATCH")
  p=dict(symbol="POCL",source_isin="INE063E01053",isin="INE063E01061",
     period_end="2025-09-30",eps_as_originally_reported_before_split=True,
     historical_identity_link=dict(source_isin="INE063E01053",current_isin="INE063E01061",
       ex_date="2026-07-21",split_new_per_old="2.5",
       evidence="NSE change in ISIN notice 2026-07-17 / BSE DR-676/2026-2027"))
  self.assertIsNone(m.historical_original_eps_proof(p))
  self.assertEqual(m.historical_original_eps_proof({**p,"eps_as_originally_reported_before_split":False}),"HISTORICAL_ORIGINAL_EPS_UNPROVEN")
 def test_issuer_supported_historical_isins_with_no_scope_relaxation(self):
  cases=[
   ("BECTORFOOD","INE495P01012","INE495P01020","2025-09-30","2025-12-12","5","MSE/LIST/18238/2025"),
   ("V2RETAIL","INE945H01013","INE945H01021","2025-12-31","2026-03-25","10","BSE DR-847/2025-2026"),
   ("KOTAKBANK","INE237A01028","INE237A01036","2025-12-31","2026-01-14","5","Kotak Mahindra Bank issuer split disclosure 2026-01-16")]
  for sym,old,new,q,exdate,factor,reference in cases:
   d=dict(symbol=sym,source_isin=old,isin=new,period_end=q,
    eps_as_originally_reported_before_split=True,
    historical_identity_link=dict(source_isin=old,current_isin=new,
     ex_date=exdate,split_new_per_old=factor,evidence=reference))
   self.assertIsNone(m.historical_original_eps_proof(d))
   self.assertEqual(m.historical_original_eps_proof({**d,"source_isin":"forged"}),"HISTORICAL_IDENTITY_MISMATCH")
 def test_exide_source_requires_exact_revised_values_and_notice(self):
  def r(code,value,source):
   return {"symbol":"EXIDEIND","period_end":"2025-12-31",
     "consolidation_scope":"CONSOLIDATED","isin":"INE302A01020",
     "source_record_id":source,"metric_code":code,"numeric_value":value}
  codes={"OPERATING_REVENUE_QUARTER":"4200.59",
         "NET_PROFIT_QUARTER":"194.97","EPS_DILUTED":"2.29"}
  old=[r(k,("0" if k=="EPS_DILUTED" else val),m.EXIDE_OLD_SOURCE) for k,val in codes.items()]
  revised=[r(k,val,m.EXIDE_REVISED_SOURCE) for k,val in codes.items()]
  class Original:
   def get_object(self,**kwargs):
    return {"Body":type("B",(),{"read":lambda self:b"%PDF-but-no-valid-hash"})()}
  selected,admitted=m.qualify_exide_correction(old+revised,Original())
  self.assertFalse(admitted)
  self.assertEqual(selected,old+revised)
  self.assertEqual(len(m.EXIDE_CORRECTION_SHA),64)
 def test_original_hash_and_source_match(self):
  src=dict(contract="PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1",period_end="2026-06-30",
     period_start="2026-04-01",consolidation_scope="CONSOLIDATED",
     issuer_filing_url="https://nsearchives.nseindia.com/corporate/ixbrl/x.html",
     original_sha256_unretained="a"*64,raw_nse_bytes_retained=False,facts={})
  record=dict(raw_payload={**src,"r2_key":"key","r2_manifest_sha256":"a"*64},
       source_url=src["issuer_filing_url"],source_retrieved="2026-10-14")
  record["payload_hash"]=m.sha(m.canonical_bytes(record["raw_payload"]))
  self.assertIsNone(m.check_manifest(record,src))
  self.assertEqual(m.check_manifest(record,{**src,"period_end":"2026-03-31"}),"SOURCE_MANIFEST_MISMATCH")

class ExistingSelectionIdentityTests(unittest.TestCase):
 def fixture(self,new_eps=1):
  core=["OPERATING_REVENUE_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"]
  rows=[]
  for source in ("a-new","z-accepted"):
   for metric in core:
    fact=row(metric,new_eps if source=="a-new" and metric=="EPS_DILUTED" else 1,source)
    fact["id"]=source+"-"+metric;rows.append(fact)
  prior={("security","2026-06-30","CONSOLIDATED",metric):"z-accepted-"+metric for metric in core}
  return rows,prior
 def test_equal_new_filing_preserves_accepted_record_identity(self):
  rows,prior=self.fixture()
  chosen,errors,_=m.select_quarters(rows,prior)
  self.assertEqual({x["source_record_id"] for x in chosen},{"z-accepted"})
  self.assertFalse(errors)
 def test_real_value_conflict_remains_quarantined(self):
  rows,prior=self.fixture(new_eps=2)
  chosen,errors,_=m.select_quarters(rows,prior)
  self.assertFalse(chosen);self.assertEqual(errors["CONFLICTING_SAME_SCOPE_FILING_VALUES"],1)
 def test_validated_source_can_complete_a_partial_existing_selection(self):
  rows,prior=self.fixture();prior.pop(("security","2026-06-30","CONSOLIDATED","EPS_DILUTED"))
  chosen,_,_=m.select_quarters(rows,prior)
  self.assertEqual({x["source_record_id"] for x in chosen},{"z-accepted"})
 def test_other_company_choice_cannot_influence_source_rank(self):
  rows,prior=self.fixture();other={("another-security",*key[1:]):value for key,value in prior.items()}
  chosen,_,_=m.select_quarters(rows,other)
  self.assertEqual({x["source_record_id"] for x in chosen},{"a-new"})

if __name__=="__main__":unittest.main()
