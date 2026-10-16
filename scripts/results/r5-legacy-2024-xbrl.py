#!/usr/bin/env python3
"""R5: qualify original NSE pre-integrated (2024) financial-result XBRL.
The issuer's original XML is retained in Development R2; selection is owned
by the independent R4 verifier. Never substitute latest comparisons/TTM.
"""
from __future__ import annotations
from collections import defaultdict
from datetime import date,datetime
from decimal import Decimal,InvalidOperation
from urllib.parse import urlencode,urlparse
import hashlib,importlib.util,json,os,re,sys,time
import xml.etree.ElementTree as ET
import boto3,psycopg,requests

HERE=os.path.dirname(__file__)
_spec=importlib.util.spec_from_file_location("r3_results_original",os.path.join(HERE,"r3-live-public-filing-batch.py"))
_r3=importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_r3)
REF="lrgpjimipfkyoqbpsqzz"
BUCKET="portfolioai-history-dev"
PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
ROOT="portfolioai-results/development/v1/quarterly/"
KIND="RESULTS_QUARTERLY_NSE_LEGACY_XBRL_V1"
SOURCE="COMPANY_EXCHANGE_FILING"
CONTRACT="PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1"
PERIODS={"2024-09-30":"2024-07-01","2024-12-31":"2024-10-01"}
DOMAIN="https://nsearchives.nseindia.com"
XBRL_PATH=re.compile(r"^/corporate/xbrl/[A-Za-z0-9_.-]+\.xml$")
NSE_API="https://www.nseindia.com/api/corporates-financial-results"
XBRLI="http://www.xbrl.org/2003/instance"
FIELD_MAP={
 "OPERATING_REVENUE_QUARTER":("RevenueFromOperations",),
 "NET_PROFIT_QUARTER":("ProfitLossForPeriod",),
 "EPS_DILUTED":("DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations",),
}
BANK_FIELDS={
 "NET_PROFIT_QUARTER":("ProfitLossForThePeriod",),
 "EPS_DILUTED":("DilutedEarningsPerShareAfterExtraordinaryItems",),
}
def local(s):return s.rsplit("}",1)[-1]
def digest(b):return hashlib.sha256(b).hexdigest()
def canonical(x):return json.dumps(x,sort_keys=True,separators=(",",":")).encode()
def dateval(x):
 try:return datetime.strptime(x,"%d-%b-%Y").date().isoformat()
 except (ValueError,TypeError):return None
def origin(raw):
 p=urlparse(raw)
 return p.scheme=="https" and p.hostname=="nsearchives.nseindia.com" and not p.query and not p.fragment and bool(XBRL_PATH.fullmatch(p.path))
def list_filings(session,symbol):
 u=NSE_API+"?"+urlencode({"index":"equities","symbol":symbol,"period":"Quarterly",
                        "from_date":"01-10-2024","to_date":"01-03-2025"})
 response=session.get(u,timeout=30,headers={"Accept":"application/json","Referer":"https://www.nseindia.com/companies-listing/corporate-filings-financial-results"})
 if response.status_code in (401,403,429):raise RuntimeError("SOURCE_ACCESS_DENIED_"+str(response.status_code))
 response.raise_for_status()
 if "json" not in response.headers.get("content-type","").lower():raise RuntimeError("SOURCE_NOT_JSON")
 data=response.json()
 if not isinstance(data,list):raise RuntimeError("SOURCE_SCHEMA_UNKNOWN")
 return [v for v in data if isinstance(v,dict) and v.get("symbol")==symbol
         and v.get("period")=="Quarterly" and v.get("toDate") in ("30-Sep-2024","31-Dec-2024")
         and v.get("cumulative")=="Non-cumulative" and origin(v.get("xbrl",""))]

def extract(raw,metadata,symbol,isin):
 """Fail closed on unknown XBRL contexts, scope, currency and ambiguity."""
 if b"<!DOCTYPE" in raw.upper() or b"<!ENTITY" in raw.upper() or len(raw)>5_000_000:
  return None,"INVALID_XML_BYTES"
 try:root=ET.fromstring(raw)
 except ET.ParseError:return None,"MALFORMED_XBRL"
 if local(root.tag)!="xbrl":return None,"NOT_XBRL_INSTANCE"
 start=dateval(metadata.get("fromDate"));end=dateval(metadata.get("toDate"))
 if end not in PERIODS or start!=PERIODS[end]:return None,"INVALID_2024_QUARTER"
 if metadata.get("symbol")!=symbol:return None,"CATALOG_SYMBOL_MISMATCH"
 reported_isin=metadata.get("isin")
 independent_isin_evidence=None
 # Legacy NSE catalog sometimes omits ISIN entirely; that is not proof of
 # another security. Allow exactly the original AXISBANK share identity proven
 # by NSE CML/61473 (March 2024); all other companies remain fail-closed.
 if (reported_isin is None or str(reported_isin).strip().upper() in
     ("","NA","N/A","NONE","NOT AVAILABLE","-","NOTLISTED")) and symbol=="AXISBANK" and isin=="INE238A01034":
  embedded={((node.text or "").strip().upper()) for node in root.iter()
            if local(node.tag).lower() in ("isin","isinnumber","isincode")
            and (node.text or "").strip()}
  if embedded and embedded!={isin}:
   return None,"SOURCE_EMBEDDED_ISIN_MISMATCH"
  reported_isin=isin
  independent_isin_evidence="NSE_CML61473_2024_AXISBANK_INE238A01034"
 # CAMS old 2024 issuer/security identity is independently established by
 # NSE iXBRL 2025-05 original (INE596I01012), NSE Clearing NCL/CMPT/71607
 # and the December 2025 5:1 split into canonical INE596I01020.
 # A blank NSE legacy catalog ISIN cannot be guessed for any other company.
 if (reported_isin is None or str(reported_isin).strip().upper() in
     ("","NA","N/A","NONE","NOT AVAILABLE","-","NOTLISTED")) and symbol=="CAMS" and isin=="INE596I01020":
  embedded={((node.text or "").strip().upper()) for node in root.iter()
            if local(node.tag).lower() in ("isin","isinnumber","isincode")
            and (node.text or "").strip()}
  if embedded and embedded!={"INE596I01012"}:
   return None,"SOURCE_EMBEDDED_ISIN_MISMATCH"
  reported_isin="INE596I01012"
  independent_isin_evidence="NCL_CMPT71607_CAMS_2024_PRE_SPLIT_ISIN"
 # TD Power Systems old ISIN and 2:1 split are explicitly documented
 # in NSE/CML/75855 (2026-08-20). The 2024 NSE XBRL symbol and original
 # quarter must independently agree; this does not authorize rebasing EPS.
 if (reported_isin is None or str(reported_isin).strip().upper() in
     ("","NA","N/A","NONE","NOT AVAILABLE","-","NOTLISTED")) and symbol=="TDPOWERSYS" and isin=="INE419M01035":
  embedded={((node.text or "").strip().upper()) for node in root.iter()
            if local(node.tag).lower() in ("isin","isinnumber","isincode")
            and (node.text or "").strip()}
  if embedded and embedded!={"INE419M01027"}:
   return None,"SOURCE_EMBEDDED_ISIN_MISMATCH"
  reported_isin="INE419M01027"
  independent_isin_evidence="NSE_CML75855_TDPOWERSYS_2024_PRE_SPLIT_ISIN"
 link=_r3.historical_result_identity(symbol,isin,reported_isin,end) if reported_isin!=isin else None
 if reported_isin!=isin and not link:return None,"UNKNOWN_HISTORICAL_ISIN"
 v=metadata.get("consolidated")
 scope=("CONSOLIDATED" if v=="Consolidated" else
        "STANDALONE" if v=="Non-Consolidated" else None)
 if not scope:return None,"SCOPE_UNKNOWN"
 contexts={}
 for node in root:
  if local(node.tag)!="context":continue
  ctx=node.attrib.get("id")
  if not ctx or ctx in contexts: return None,"DUPLICATE_CONTEXT_ID"
  if ctx!="OneD":continue # FourD is cumulative/YTD even where XML dates look quarterly
  if any(local(e.tag) in ("scenario","segment") for e in node.iter()):continue
  identities=[e for e in node.iter() if local(e.tag)=="identifier"]
  if len(identities)!=1 or (identities[0].text or "").strip()!=symbol:continue
  starts=[(e.text or "").strip() for e in node.iter() if local(e.tag)=="startDate"]
  ends=[(e.text or "").strip() for e in node.iter() if local(e.tag)=="endDate"]
  if starts==[start] and ends==[end]:contexts[ctx]=node
 if not contexts:return None,"SOURCE_QUARTER_CONTEXT_MISSING"
 units={}
 for node in root:
  if local(node.tag)!="unit":continue
  name=node.attrib.get("id")
  units[name]=[e.text.strip() for e in node.iter() if local(e.tag)=="measure" and e.text]
 if not units:return None,"UNITS_UNPROVEN"
 def candidates(names,expected_unit):
  found=[]
  for node in root:
   if local(node.tag) not in names or node.attrib.get("contextRef") not in contexts:continue
   unit=units.get(node.attrib.get("unitRef"))
   if expected_unit=="money":
    if unit not in (["iso4217:INR"],["INR"]):continue
   elif unit not in (["iso4217:INR","xbrli:shares"],["INR","shares"]):continue
   raw_value=(node.text or "").strip()
   if not re.fullmatch(r"-?\d+(?:\.\d+)?",raw_value):continue
   try:value=Decimal(raw_value)
   except InvalidOperation:continue
   if not value.is_finite():continue
   found.append((value,node.attrib.get("contextRef"),raw_value))
  # Different XBRL contexts/duplicate financial facts must reconcile exactly.
  return found if len({v[0] for v in found})<=1 else []
 def fact(names,code):
  eps=code=="EPS_DILUTED"
  xs=candidates(names,"eps" if eps else "money")
  if not xs:return None
  amount=xs[0][0] if eps else xs[0][0]/Decimal(10000000)
  return {"value":str(amount),"unit":"INR_PER_SHARE" if eps else "INR_CRORE",
          "original_value":xs[0][2],"original_unit":"INR_PER_SHARE" if eps else "INR",
          "context_ids":sorted({x[1] for x in xs})}
 bank=symbol in _r3.BANK_TICKERS
 facts={}
 for code,tags in (BANK_FIELDS if bank else FIELD_MAP).items():
  item=fact(tags,code)
  if item:facts[code]=item
 if bank:
  earned=candidates(("InterestEarned",),"money")
  spent=candidates(("InterestExpended", "InterestExpenses"),"money")
  if earned and spent:
   ni=(earned[0][0]-spent[0][0])/Decimal(10000000)
   facts["NET_INTEREST_INCOME_QUARTER"]={
    "value":str(ni),"unit":"INR_CRORE","original_unit":"INR",
    "original_value":None,"formula":"InterestEarned - InterestExpended",
    "component_context_ids":sorted(set([x[1] for x in earned+spent]))}
 if not facts:return None,"NO_QUALIFIED_FINANCIAL_FACTS"
 return {"symbol":symbol,"isin":isin,"source_isin":reported_isin,"period_start":start,
         "period_end":end,"scope":scope,"facts":facts,
         "historical_identity_link":link,
         "independent_isin_evidence":independent_isin_evidence},None

def source_diagnostic(raw):
 try:root=ET.fromstring(raw)
 except ET.ParseError:return {"reason":"XML_INVALID"}
 units={}
 for node in root:
  if local(node.tag)=="unit":
   units[node.attrib.get("id")]=[e.text for e in node.iter() if local(e.tag)=="measure"]
 example=[]
 for node in root:
  name=local(node.tag)
  if any(term in name.lower() for term in ("revenuefromoperations","profitlossforperiod","dilutedearnings","profitlossfortheperiod","interestearned","interestexpenses")):
   example.append({"field":name,"context":node.attrib.get("contextRef"),"unit":node.attrib.get("unitRef"),
                   "value_excerpt":(node.text or "").strip()[:36],"has_number":bool(re.fullmatch(r"-?\\d+(?:\\.\\d+)?",(node.text or "").strip()))})
 return {"units":units,"fields":example[:12]}

def put_original_xml(s3,raw,key):
 try:
  old=s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()
  if digest(old)!=digest(raw):raise RuntimeError("IMMUTABLE_ORIGINAL_XBRL_CONFLICT")
  return
 except Exception as exc:
  code=getattr(exc,"response",{}).get("Error",{}).get("Code","")
  if code not in ("NoSuchKey","404","NotFound"):raise
 s3.put_object(Bucket=BUCKET,Key=key,Body=raw,ContentType="application/xml",IfNoneMatch="*")
 reread=s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()
 if digest(reread)!=digest(raw):raise RuntimeError("ORIGINAL_XBRL_R2_READBACK_MISMATCH")

def persist(db,s3,raw,record,parsed):
 period=parsed["period_end"];symbol=parsed["symbol"];original_sha=digest(raw)
 xmlkey=(ROOT+f"security_id={parsed['isin']}/period_end={period}/"
         +f"original_version={original_sha}/original-xbrl.xml")
 put_original_xml(s3,raw,xmlkey)
 manifest={
  "contract":CONTRACT,"symbol":symbol,"isin":parsed["isin"],
  "period_start":parsed["period_start"],"period_end":period,
  "consolidation_scope":parsed["scope"],"issuer_filing_url":record["xbrl"],
  "original_sha256_retained":original_sha,"original_xbrl_retained":True,
  "original_r2_key":xmlkey,"reporting_currency":"INR",
  "original_filing_isin":parsed["source_isin"],
  "independent_isin_evidence":parsed.get("independent_isin_evidence"),
  "catalog_broadcast_date":record.get("broadCastDate"),
  "original_publication_precision":"CATALOG_ONLY_UNVERIFIED",
  "raw_nse_bytes_retained":True,"figures_review_pending":True,
  "facts":parsed["facts"]
 }
 if parsed["historical_identity_link"]:
  manifest.update(source_isin=parsed["source_isin"],
    historical_identity_link=parsed["historical_identity_link"],
    eps_as_originally_reported_before_split=True)
 pbytes=canonical(manifest);pHash=digest(pbytes)
 key=(ROOT+f"security_id={parsed['isin']}/period_end={period}/"
       +f"source_version={pHash}/manifest.json")
 _r3.put_immutable(s3,pbytes,key)
 payload={**manifest,"r2_key":key,"r2_manifest_sha256":pHash}
 h=digest(canonical(payload))
 with db.cursor() as cur:
  cur.execute("""SELECT id FROM public.securities
     WHERE symbol=%s AND isin=%s AND asset_class='EQUITY'""",
    (symbol,parsed["isin"]))
  sid=cur.fetchone()
  if not sid:raise RuntimeError("CANONICAL_SECURITY_NOT_FOUND")
  cur.execute("""INSERT INTO public.data_source_records
   (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
   VALUES (%s,%s,%s,%s,%s,%s::jsonb,%s::jsonb)
   ON CONFLICT (source_code,record_kind,external_record_id,payload_hash)
   DO NOTHING RETURNING id""",(SOURCE,KIND,symbol+":"+original_sha,record["xbrl"],h,
   canonical(payload).decode(),
   '{"retention":"ORIGINAL_XBRL_IN_DEV_R2","source_qualification":"REVIEW_PENDING"}'))
  saved=cur.fetchone()
  if not saved:
   cur.execute("""SELECT id FROM public.data_source_records WHERE source_code=%s
     AND record_kind=%s AND external_record_id=%s AND payload_hash=%s""",
     (SOURCE,KIND,symbol+":"+original_sha,h))
   saved=cur.fetchone()
  if not saved:raise RuntimeError("SOURCE_RECORD_NOT_READABLE")
  source_id=saved[0];new=0
  for code,f in parsed["facts"].items():
   cur.execute("""INSERT INTO public.fundamental_observations
    (security_id,metric_code,source_record_id,source_code,numeric_value,currency,
     unit,period_start,period_end,period_type,consolidation_scope,
     retrieved_at,fresh_until,evidence_status)
    VALUES (%s,%s,%s,%s,%s,'INR',%s,%s,%s,'QUARTER',%s,now(),now()+interval '120 days','AVAILABLE')
    ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,
                 consolidation_scope,source_record_id) DO NOTHING RETURNING id""",
    (sid[0],code,source_id,SOURCE,Decimal(f["value"]),f["unit"],
     parsed["period_start"],period,parsed["scope"]))
   if cur.fetchone():new+=1
 db.commit()
 return new

def main():
 url=os.getenv("SUPABASE_DB_URL","")
 if REF not in url or os.getenv("CLOUDFLARE_R2_BUCKET")!=BUCKET:
  raise RuntimeError("DEVELOPMENT_ONLY")
 if os.getenv("RESULTS_R5_LEGACY_ACK")!="2024_SEP_DEC_ORIGINAL_XBRL":
  raise RuntimeError("R5_LEGACY_SCOPE_NOT_APPROVED")
 limit=int(os.getenv("RESULTS_R5_LEGACY_STOCK_LIMIT","262"))
 if not 1<=limit<=262:raise RuntimeError("STOCK_LIMIT_INVALID")
 dry=os.getenv("RESULTS_R5_LEGACY_DRY_RUN","1")!="0"
 target=set(x.strip().upper() for x in os.getenv("RESULTS_R5_LEGACY_SYMBOLS","").split(",") if x.strip())
 if len(target)>12:raise RuntimeError("TOO_MANY_EXPLICIT_TARGETS")
 with psycopg.connect(url,autocommit=False) as db:
  with db.cursor() as cur:
   cur.execute("""SELECT DISTINCT s.symbol,s.isin,s.id FROM public.transactions t
      JOIN public.securities s ON s.id=t.security_id
      WHERE t.portfolio_id=%s AND s.asset_class='EQUITY' AND s.isin IS NOT NULL
      ORDER BY s.symbol LIMIT %s""",(PORTFOLIO,limit))
   equities=cur.fetchall()
  db.rollback()
  if target:equities=[x for x in equities if x[0] in target]
  if target and set(x[0] for x in equities)!=target:raise RuntimeError("TARGET_NOT_IN_PORTFOLIO")
  shard_count=int(os.getenv("RESULTS_R5_LEGACY_SHARD_COUNT","1"))
  shard_index=int(os.getenv("RESULTS_R5_LEGACY_SHARD_INDEX","0"))
  if not (1<=shard_count<=4 and 0<=shard_index<shard_count):
   raise RuntimeError("LEGACY_SHARD_CONFIGURATION_INVALID")
  # Stable ordered, disjoint portfolio identities: never fetch one issuer
  # in multiple workers within the same acquisition. Replays are idempotent.
  equities=[company for index,company in enumerate(equities) if index%shard_count==shard_index]
  s3=None if dry else _r3.r2_client()
  session=requests.Session()
  session.headers.update({"User-Agent":"Mozilla/5.0 (compatible; PortfolioAIResearch/1.0)",
     "Accept-Language":"en-IN,en;q=0.8"})
  boot=session.get("https://www.nseindia.com/companies-listing/corporate-filings-financial-results",timeout=30)
  if boot.status_code in (401,403,429):raise RuntimeError("SOURCE_ACCESS_DENIED_"+str(boot.status_code))
  boot.raise_for_status()
  report={"mode":"DRY_RUN" if dry else "ACQUIRE","shard_index":shard_index,"shard_count":shard_count,"target_periods":sorted(PERIODS),
          "universe_size":len(equities),"checked":0,"qualified":0,"observations_inserted":0,
          "periods":defaultdict(int),"failures":defaultdict(int),"blocked":None}
  for symbol,isin,sid in equities:
   report["checked"]+=1
   with db.cursor() as cur:
    cur.execute("""SELECT period_end FROM public.fundamental_observation_decisions
     WHERE security_id=%s AND period_type='QUARTER'
       AND period_end=ANY(%s::date[]) AND selected_observation_id IS NOT NULL
     GROUP BY period_end HAVING COUNT(DISTINCT metric_code)>=3""",(sid,list(PERIODS)))
    complete={str(x[0]) for x in cur.fetchall()}
   db.rollback()
   if complete==set(PERIODS):continue
   try:
    records=list_filings(session,symbol)
    for item in records[:10]:
     period=dateval(item.get("toDate"))
     if period not in PERIODS or period in complete:continue
     original=item["xbrl"]
     response=session.get(original,timeout=35,headers={"Accept":"application/xml,text/xml"})
     if response.status_code in (401,403,429):
      report["blocked"]="ORIGINAL_ACCESS_DENIED_"+str(response.status_code)
      break
     if not response.ok or len(response.content)>5_000_000:
      report["failures"]["ORIGINAL_UNAVAILABLE"]+=1;continue
     parsed,error=extract(response.content,item,symbol,isin)
     if error:
      report["failures"][error]+=1
      if error=="UNKNOWN_HISTORICAL_ISIN" and symbol=="AXISBANK" and len(report.setdefault("axisbank_catalog_diagnostics",[]))<2:
       report["axisbank_catalog_diagnostics"].append({
          "period":period,"catalog_isin_raw":str(item.get("isin"))[:36],
          "catalog_isin_type":type(item.get("isin")).__name__,
          "catalog_field_names":sorted(str(k) for k in item.keys())[:35]})
      if error=="NO_QUALIFIED_FINANCIAL_FACTS" and len(report.setdefault("source_format_diagnostics",[]))<3:
       report["source_format_diagnostics"].append({"symbol":symbol,"period":period,
         "details":source_diagnostic(response.content)})
      continue
     if not dry:
      report["observations_inserted"]+=persist(db,s3,response.content,item,parsed)
     report["qualified"]+=1;report["periods"][period]+=1
     time.sleep(.9)
    if report["blocked"]:break
   except (requests.RequestException,ValueError,RuntimeError) as err:
    db.rollback()
    msg=str(err).upper()
    if "ACCESS_DENIED" in msg or "429" in msg or "403" in msg:
     report["blocked"]=msg[:90];break
    report["failures"]["STOCK_SOURCE_FAILURE"]+=1
   time.sleep(1.1)
  report["periods"]=dict(report["periods"]);report["failures"]=dict(report["failures"])
  print(json.dumps(report,sort_keys=True,indent=2))
  if report["blocked"]:return 2
  return 0
if __name__=="__main__":
 try:sys.exit(main())
 except Exception as exc:
  print(json.dumps({"status":"BLOCKED","error":str(exc)[:160]}),file=sys.stderr)
  sys.exit(3)
