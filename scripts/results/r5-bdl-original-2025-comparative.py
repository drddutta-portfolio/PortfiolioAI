#!/usr/bin/env python3
"""R5-only BDL 31-Mar-2025 original issuer-reported comparative quarter.

The signed 12-Aug-2025 official June 2025 result has an *explicit* March 2025
quarter (note 4: issuer-reported balancing figures). The exact image/table
has been independently visually reviewed, signed PDF SHA pinned, and June
control figures cross-checked to existing R4 selections. No financial figures
are estimated or recomputed from full-year totals by this program.
"""
from __future__ import annotations
import hashlib,json,os,re
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse
import fitz,requests,boto3,psycopg
from psycopg.types.json import Jsonb
from botocore.exceptions import ClientError
from botocore.config import Config

REF="lrgpjimipfkyoqbpsqzz";BUCKET="portfolioai-history-dev"
SYMBOL="BDL";ISIN="INE171Z01026";END="2025-03-31";START="2025-01-01"
SOURCE="COMPANY_EXCHANGE_FILING"
KIND="RESULTS_R5_BDL_Q4FY25_ISSUER_COMPARATIVE_V1"
PDF_SHA="245c64bf766b99a5b62095fa1929bbe7f4a862547a98e3fbd45a6f87f2fd19b0"
URL="https://www.bdl-india.in/sites/default/files/BDL_2025_26_Q1_Financial_Results.pdf"
PROOF="R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION"
VALUES={
  "OPERATING_REVENUE_QUARTER":("1776.9764","INR_CRORE"),
  "NET_PROFIT_QUARTER":("272.7719","INR_CRORE"),
  "EPS_DILUTED":("7.44","INR_PER_SHARE"),
}
# Control June 2025 quarter from the SAME issuer original: pre-existing R4 values
CONTROL_JUNE={"OPERATING_REVENUE_QUARTER":"247.9290",
              "NET_PROFIT_QUARTER":"18.3498","EPS_DILUTED":"0.50"}
def sha(data):return hashlib.sha256(data).hexdigest()
def compact(obj):return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()
def client():
    value=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip()
    if re.fullmatch(r"[0-9a-f]{32}",value):endpoint="https://"+value+".r2.cloudflarestorage.com"
    else:
        parsed=urlparse(value)
        if parsed.scheme!="https" or not re.fullmatch(r"[0-9a-f]{32}\.r2\.cloudflarestorage\.com",parsed.hostname or "") or parsed.path not in ("","/") or parsed.query:
            raise RuntimeError("INVALID_R2_ACCOUNT_CONFIGURATION")
        endpoint=value.rstrip("/")
    return boto3.client("s3",endpoint_url=endpoint,region_name="auto",
        aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
        config=Config(retries={"max_attempts":2,"mode":"standard"}))
def preserve(c,key,data,kind):
    try: previous=c.get_object(Bucket=BUCKET,Key=key)["Body"].read()
    except ClientError as e:
        if e.response.get("Error",{}).get("Code") not in ("404","NoSuchKey"):raise
    else:
        if previous!=data:raise RuntimeError("IMMUTABLE_SOURCE_R2_CONFLICT")
        return
    c.put_object(Bucket=BUCKET,Key=key,Body=data,ContentType=kind)
    if c.get_object(Bucket=BUCKET,Key=key)["Body"].read()!=data:raise RuntimeError("R2_READBACK_FAILED")
def validate_original():
    r=requests.get(URL,timeout=55,headers={"User-Agent":"Mozilla/5.0 (PortfolioAI Results source audit)"})
    r.raise_for_status()
    if urlparse(r.url).hostname not in ("bdl-india.in","www.bdl-india.in"):
        raise RuntimeError("BDL_ISSUER_ORIGINAL_DOMAIN_INVALID")
    data=r.content
    if sha(data)!=PDF_SHA or not data.startswith(b"%PDF"):
        raise RuntimeError("PINNED_BDL_ORIGINAL_SHA_MISMATCH")
    doc=fitz.open(stream=data,filetype="pdf")
    if len(doc)!=5:raise RuntimeError("BDL_SIGNED_ORIGINAL_PAGE_COUNT_CHANGED")
    identity=doc[0].get_text("text").upper()
    table=doc[1].get_text("text").upper()
    for mark in ("BHARAT DYNAMICS","L24292TG1970GOI001353","BDL"):
        if mark not in identity:raise RuntimeError("BDL_ISSUER_SIGNATURE_OR_CIN_MISMATCH:"+mark)
    for mark in ("STANDALONE","2025","REVENUE","PROFIT"):
        if mark not in table:raise RuntimeError("BDL_ORIGINAL_COMPARATIVE_MISSING:"+mark)
    # The original SHA binds the reviewed second financial column exactly.
    # Note 4 explicitly qualifies the March 2025 quarter as reported balancing
    # figures; it is NOT a new independent R5 computation or fabricated quarter.
    note=doc[2].get_text("text").upper()
    if "BALANCING" not in note or "31 MARCH 2025" not in note:
        raise RuntimeError("BDL_MARCH_QUARTER_DISCLOSURE_NOTE_NOT_PROVEN")
    return data
def main():
    url=os.environ["SUPABASE_DB_URL"]
    if REF not in url or os.environ["CLOUDFLARE_R2_BUCKET"]!=BUCKET:
        raise RuntimeError("DEVELOPMENT_ONLY_SOURCE_ADMISSION")
    with psycopg.connect(url) as db:
        with db.cursor() as cur:
            cur.execute("""SELECT id FROM public.securities WHERE symbol=%s AND isin=%s AND asset_class='EQUITY'""",(SYMBOL,ISIN))
            identity=cur.fetchall()
            if len(identity)!=1:raise RuntimeError("BDL_CANONICAL_IDENTITY_INVALID")
            sid=identity[0][0]
            cur.execute("""SELECT o.metric_code,o.numeric_value FROM public.fundamental_observation_decisions d
              JOIN public.fundamental_observations o ON o.id=d.selected_observation_id
              WHERE d.security_id=%s AND o.period_end='2025-06-30'
                AND o.consolidation_scope='STANDALONE'
                AND o.metric_code=ANY(%s::text[])""",(sid,list(CONTROL_JUNE)))
            current={code:Decimal(value) for code,value in cur.fetchall()}
            if set(current)!=set(CONTROL_JUNE) or any(current[code]!=Decimal(val) for code,val in CONTROL_JUNE.items()):
                raise RuntimeError("BDL_JUNE_2025_CONTROL_FIGURES_NOT_R4_MATCH")
            cur.execute("""SELECT id,raw_payload FROM public.data_source_records
                WHERE source_code=%s AND record_kind=%s AND external_record_id=%s""",
                (SOURCE,KIND,ISIN+":"+END))
            prior=cur.fetchall()
            if len(prior)>1 or prior and prior[0][1].get("originalSha256")!=PDF_SHA:
                raise RuntimeError("BDL_COMPETING_COMPARATIVE_SOURCE")
            if prior:
                source_id=prior[0][0]
                print("R5_BDL_ORIGINAL_REUSED_WITHOUT_PROVIDER_CALL")
            else:
                source_id=None
    if source_id is None:
        raw=validate_original()
        key=("portfolioai-results/development/v1/quarterly/security_id="+ISIN+
             "/period_end="+END+"/original_version="+PDF_SHA+"/issuer-original.pdf")
        manifest={"contract":"R5_BDL_SIGNED_PDF_COMPARATIVE_Q4FY25_V1",
          "issuer":SYMBOL,"isin":ISIN,"scope":"STANDALONE",
          "sourceUrl":URL,"originalSha256":PDF_SHA,"originalR2Key":key,
          "quarterStart":START,"quarterEnd":END,"tablePageZeroIndex":1,
          "printedQuarterColumnIndex":1,"currency":"INR",
          "originalRevenueLakh":"177697.64","originalProfitLakh":"27277.19",
          "originalDilutedEPS":"7.44",
          "basis":"ISSUER_DISCLOSED_BALANCING_QUARTER_AS_PER_NOTE_4",
          "sourceReview":"EXACT_SIGNED_ORIGINAL_VISUAL_COLUMN_REVIEW_2026_10_18",
          "r5Only":True,"pointInTimeTradingAction":False,"r4Changes":False}
        b=compact(manifest)
        mkey=key.rsplit("/",1)[0]+"/source-manifest-"+sha(b)+".json"
        r2=client();preserve(r2,key,raw,"application/pdf");preserve(r2,mkey,b,"application/json")
        with psycopg.connect(url) as db:
            with db.cursor() as cur:
                cur.execute("""INSERT INTO public.data_source_records
                (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
                VALUES (%s,%s,%s,%s,%s,%s,
                  '{"r5_only":true,"r4_selection_modified":false,"quarter_belongs_to_issuer_original":true,"pit":"UNKNOWN"}'::jsonb)
                ON CONFLICT (source_code,record_kind,external_record_id,payload_hash) DO NOTHING
                RETURNING id""",
                (SOURCE,KIND,ISIN+":"+END,URL,sha(compact({**manifest,"sourceManifestR2Key":mkey})),
                 Jsonb({**manifest,"sourceManifestR2Key":mkey})))
                inserted=cur.fetchone()
                if inserted:source_id=inserted[0]
                else:
                    cur.execute("""SELECT id FROM public.data_source_records WHERE source_code=%s
                      AND record_kind=%s AND external_record_id=%s""",(SOURCE,KIND,ISIN+":"+END))
                    old=cur.fetchall()
                    if len(old)!=1:raise RuntimeError("BDL_R5_SOURCE_UPSERT_READBACK_INVALID")
                    source_id=old[0][0]
            db.commit()
    with psycopg.connect(url) as db:
        with db.cursor() as cur:
            cur.execute("SELECT id FROM public.securities WHERE symbol=%s AND isin=%s",(SYMBOL,ISIN))
            sid=cur.fetchone()[0]
            cur.execute("""SELECT metric_code,numeric_value FROM public.fundamental_observations
              WHERE security_id=%s AND period_end=%s AND consolidation_scope='STANDALONE'
              AND evidence_status='AVAILABLE' AND metric_code=ANY(%s::text[])""",
              (sid,END,list(VALUES)))
            for code,old in cur.fetchall():
                if Decimal(old)!=Decimal(VALUES[code][0]):
                    raise RuntimeError("BDL_ALREADY_ADMITTED_DIFFERENT_SAME_SCOPE_VALUES")
            observations={}
            for code,(val,unit) in VALUES.items():
                cur.execute("""INSERT INTO public.fundamental_observations
                  (security_id,source_record_id,source_code,metric_code,numeric_value,currency,unit,
                   period_start,period_end,period_type,consolidation_scope,evidence_status,retrieved_at,fresh_until)
                  VALUES (%s,%s,'COMPANY_EXCHANGE_FILING',%s,%s,'INR',%s,%s,%s,
                    'QUARTER','STANDALONE','AVAILABLE',now(),now()+interval '120 days')
                  ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,
                    consolidation_scope,source_record_id) DO NOTHING RETURNING id""",
                  (sid,source_id,code,Decimal(val),unit,START,END))
                inserted=cur.fetchone()
                if inserted:oid=inserted[0]
                else:
                    cur.execute("""SELECT id,numeric_value,unit FROM public.fundamental_observations
                        WHERE security_id=%s AND source_record_id=%s AND metric_code=%s""",
                        (sid,source_id,code))
                    got=cur.fetchone()
                    if not got or Decimal(got[1])!=Decimal(val) or got[2]!=unit:
                        raise RuntimeError("BDL_ORIGINAL_FACT_REPLAY_NOT_IDENTICAL")
                    oid=got[0]
                observations[code]=str(oid)
        db.commit()
    proof={"contract":"R5_BDL_SIGNED_2025_Q4_COMPARATIVE_ORIGINAL_V1",
           "environment":"Development","approvedSources":[{
               "symbol":SYMBOL,"securityId":str(sid),"periodEnd":END,"scope":"STANDALONE",
               "sourceRecordId":str(source_id),
               "observations":observations,
               "approval":"R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION"}]}
    p=Path("src/features/results/resultsR5BDLOriginalComparisonProof.json")
    p.write_text(json.dumps(proof,sort_keys=True,indent=2)+"\n")
    print("R5_BDL_MARCH_QUARTER_PROVEN",json.dumps({
       "issuer":SYMBOL,"sourceOriginalSHA256":PDF_SHA,"quarter":END,
       "proofTrio":len(observations),"canonicalR4Changes":0,"estimatedFigures":0}))
if __name__=="__main__":main()
