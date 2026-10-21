#!/usr/bin/env python3
"""Qualify one ICEMAKE June-2025 consolidated quarter from exact issuer signed June-2025 original PDF.

Official issuer PDF page 0 independently verified: original INR lakh figures,
EPS diluted rupees. Exact SHA and page label pinned. R5-only comparison source;
canonical R4 evidence choices are never changed.
"""
import hashlib,json,os,re
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse
import requests,fitz,psycopg,boto3
from psycopg.types.json import Jsonb
from botocore.exceptions import ClientError
from botocore.config import Config

REF="lrgpjimipfkyoqbpsqzz";BUCKET="portfolioai-history-dev"
SYMBOL="ICEMAKE";ISIN="INE520Y01019"
SOURCE="COMPANY_EXCHANGE_FILING"
KIND="RESULTS_R5_ICEMAKE_SIGNED_JUNE2025_CONSOLIDATED_V1"
URL="https://www.icemakeindia.com/wp-content/uploads/2025/08/Financial-Results-the-quarter-ended-June-30-2025.pdf"
SHA="496fa0108c00af4551d1e5d85944a1cb19e0627e930361a029176a3b3b790975"
APPROVAL="R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION"
# One exact consolidated June-2025 quarter column in the official issuer financial filing.
# Reconciled original PDF p0 June-2025 first quarter column: revenue 11,150.14 LAKH, PAT LOSS 146.90 LAKH; diluted EPS (0.90) on p1. Both converted crores with sign.
PERIODS={
 "2025-06-30":{"start":"2025-04-01","revenue_crore":"111.5014",
   "pat_crore":"-1.4690","diluted_eps":"-0.90","column":0},
}
def digest(b):return hashlib.sha256(b).hexdigest()
def compact(x):return json.dumps(x,sort_keys=True,separators=(",",":")).encode()
def r2():
 value=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip()
 if re.fullmatch(r"[a-f0-9]{32}",value):endpoint="https://"+value+".r2.cloudflarestorage.com"
 else:
  p=urlparse(value)
  if p.scheme!="https" or not re.fullmatch(r"[a-f0-9]{32}\.r2\.cloudflarestorage\.com",p.hostname or "") or p.path not in ("","/") or p.query or p.fragment:
   raise RuntimeError("R2_ENDPOINT_NOT_VERIFIED")
  endpoint=value.rstrip("/")
 return boto3.client("s3",endpoint_url=endpoint,region_name="auto",
  aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
  aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
  config=Config(retries={"max_attempts":2,"mode":"standard"}))
def immutable(s3,key,b,kind):
 try: prior=s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()
 except ClientError as e:
  if e.response.get("Error",{}).get("Code") not in ("404","NoSuchKey"):raise
 else:
  if prior!=b:raise RuntimeError("R2_ORIGINAL_IMMUTABILITY_VIOLATION")
  return
 s3.put_object(Bucket=BUCKET,Key=key,Body=b,ContentType=kind)
 if s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()!=b:raise RuntimeError("R2_ORIGINAL_READBACK_FAIL")
def values(f):
 return {"OPERATING_REVENUE_QUARTER":(Decimal(f["revenue_crore"]),"INR_CRORE"),
  "NET_PROFIT_QUARTER":(Decimal(f["pat_crore"]),"INR_CRORE"),
  "EPS_DILUTED":(Decimal(f["diluted_eps"]),"INR_PER_SHARE")}
def main():
 dburl=os.environ["SUPABASE_DB_URL"]
 if REF not in dburl or os.environ["CLOUDFLARE_R2_BUCKET"]!=BUCKET:
  raise RuntimeError("DEVELOPMENT_ONLY")
 with psycopg.connect(dburl) as db:
  with db.cursor() as c:
   c.execute("SELECT id FROM public.securities WHERE symbol=%s AND isin=%s AND asset_class='EQUITY'",(SYMBOL,ISIN))
   ids=c.fetchall()
   if len(ids)!=1:raise RuntimeError("ICEMAKE_ISIN_IDENTITY_MISMATCH")
   sid=ids[0][0]
   c.execute("SELECT id,raw_payload FROM public.data_source_records WHERE source_code=%s AND record_kind=%s AND external_record_id=%s",(SOURCE,KIND,ISIN+":"+SHA))
   existing=c.fetchall()
   if len(existing)>1 or existing and existing[0][1].get("sha256")!=SHA:
    raise RuntimeError("ICEMAKE_CONFLICTING_REGISTERED_ORIGINAL")
   srcid=existing[0][0] if existing else None
 raw=None
 if srcid is None:
  response=requests.get(URL,timeout=55,headers={"User-Agent":"Mozilla/5.0 (PortfolioAI R5 Development)"})
  response.raise_for_status()
  host=urlparse(response.url).hostname
  if host not in ("www.icemakeindia.com","icemakeindia.com"):
   raise RuntimeError("ICEMAKE_ORIGINAL_HOST_INVALID")
  raw=response.content
  if digest(raw)!=SHA or not raw.startswith(b"%PDF"):raise RuntimeError("ICEMAKE_SOURCE_SHA_CHANGED")
  pdf=fitz.open(stream=raw,filetype="pdf")
  if len(pdf)!=8:raise RuntimeError("ICEMAKE_SIGNED_PDF_LENGTH_CHANGED")
  signed=pdf[0].get_text("text").upper()
  # The signed, visually reviewed page has OCR-fragmented text glyphs;
  # do not claim that text search independently proves the financial numbers.
  # Exact SHA256 locks the bytes to the inspected issuer original.
  # This original is readable; exact SHA + page and numeric row checks apply.
  # The EXACT immutable SHA-256, eight-page count, approved original URL,
  # independent visual review and verified row/column amounts are the
  # proof. Text extraction is NOT used as identity or numeric evidence.
  for marker in ("ICE MAKE REFRIGERATION LIMITED", "CONSOLIDATED FINANCIAL RESULTS",
                 "30TH JUNE, 2025", "11,150.14", "146.90"):
   if marker not in signed:raise RuntimeError("ICEMAKE_ORIGINAL_TABLE_FRAGMENT_MISSING:"+marker)
  eps_page=pdf[1].get_text("text").upper()
  if "DILUTED" not in eps_page or "0.90" not in eps_page:
   raise RuntimeError("ICEMAKE_SIGNED_DILUTED_EPS_NOT_PROVEN")
  root="portfolioai-results/development/v1/quarterly/security_id="+ISIN+"/period_end=2025-06-30/original_version="+SHA+"/"
  key=root+"issuer-original.pdf"
  manifest={"contract":"R5_SIGNED_ICEMAKE_2025_ORIGINAL_CONSOLIDATED_V1",
    "symbol":SYMBOL,"isin":ISIN,"sourceUrl":URL,"sha256":SHA,"r2OriginalKey":key,
    "fiscalQuarterDateColumns":["2025-06-30"],"scope":"CONSOLIDATED",
    "statementPageZeroIndex":0,"revenueProfitOriginalUnits":"INR_LAKH","storedUnits":"INR_CRORE",
    "values":PERIODS,"originalPublicationPrecision":"UNKNOWN",
    "r5Only":True,"r4DecisionsModified":False}
  metadata=compact(manifest)
  metakey=root+"manifest-"+digest(metadata)+".json"
  s3=r2();immutable(s3,key,raw,"application/pdf");immutable(s3,metakey,metadata,"application/json")
  payload={**manifest,"manifestR2Key":metakey}
  with psycopg.connect(dburl) as db:
   with db.cursor() as c:
    c.execute("""INSERT INTO public.data_source_records
     (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
     VALUES (%s,%s,%s,%s,%s,%s,'{"r5_only":true,"r4_unchanged":true,"retained_source":"DEV_R2","original_published":"2025-08-07"}'::jsonb)
     ON CONFLICT (source_code,record_kind,external_record_id,payload_hash) DO NOTHING RETURNING id""",
     (SOURCE,KIND,ISIN+":"+SHA,URL,digest(compact(payload)),Jsonb(payload)))
    saved=c.fetchone()
    if saved:srcid=saved[0]
    else:
     c.execute("SELECT id FROM public.data_source_records WHERE source_code=%s AND record_kind=%s AND external_record_id=%s AND payload_hash=%s",
       (SOURCE,KIND,ISIN+":"+SHA,digest(compact(payload))))
     match=c.fetchone()
     if not match:raise RuntimeError("SOURCE_INSERT_READBACK_INVALID")
     srcid=match[0]
   db.commit()
 proof=[]
 with psycopg.connect(dburl) as db:
  with db.cursor() as c:
   for end,f in PERIODS.items():
    core=values(f)
    c.execute("""SELECT metric_code,numeric_value FROM public.fundamental_observations
     WHERE security_id=%s AND period_end=%s AND consolidation_scope='CONSOLIDATED'
       AND evidence_status='AVAILABLE' AND metric_code=ANY(%s::text[])""",
       (sid,end,list(core)))
    for code,val in c.fetchall():
     if Decimal(val)!=core[code][0]:raise RuntimeError("COMPETING_SIGNED_CONSOLIDATED_FACT:"+end+":"+code)
    recorded={}
    for code,(value,unit) in core.items():
     c.execute("""INSERT INTO public.fundamental_observations
       (security_id,source_record_id,source_code,metric_code,numeric_value,unit,currency,
        period_start,period_end,period_type,consolidation_scope,evidence_status,retrieved_at,fresh_until)
       VALUES (%s,%s,'COMPANY_EXCHANGE_FILING',%s,%s,%s,'INR',%s,%s,'QUARTER',
        'CONSOLIDATED','AVAILABLE',now(),now()+interval '120 days')
       ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,
        consolidation_scope,source_record_id) DO NOTHING RETURNING id""",
        (sid,srcid,code,value,unit,f["start"],end))
     inserted=c.fetchone()
     if inserted:oid=inserted[0]
     else:
      c.execute("""SELECT id,numeric_value,unit FROM public.fundamental_observations
       WHERE security_id=%s AND source_record_id=%s AND metric_code=%s AND period_end=%s""",(sid,srcid,code,end))
      got=c.fetchone()
      if not got or Decimal(got[1])!=value or got[2]!=unit:raise RuntimeError("ICEMAKE_R5_REPLAY_SOURCE_CONFLICT")
      oid=got[0]
     recorded[code]=str(oid)
    proof.append(dict(symbol=SYMBOL,securityId=str(sid),periodEnd=end,
     scope="CONSOLIDATED",sourceRecordId=str(srcid),observations=recorded,approval=APPROVAL))
  db.commit()
 out=Path("src/features/results/resultsR5ICEMAKEOriginalComparisonProof.json")
 out.write_text(json.dumps({"contract":"R5_ICEMAKE_SIGNED_2025_CONSOLIDATED_ORIGINAL_V1",
   "environment":"Development","originalSHA256":SHA,"approvedSources":sorted(proof,key=lambda x:x["periodEnd"])},
  sort_keys=True,indent=2)+"\n")
 print("R5_ICEMAKE_SIGNED_ORIGINAL_2024",json.dumps({"originalSHA":SHA,
  "quarters":len(proof),"r4Changed":0,"sourceProviderCalls":0 if raw is None else 1}))
if __name__=="__main__":main()
