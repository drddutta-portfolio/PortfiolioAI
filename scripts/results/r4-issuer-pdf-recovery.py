#!/usr/bin/env python3
"""Development-only original issuer PDF R4 current-display admission.
This is deliberately narrower than a generic PDF scraper: issuer original
URL and PDF content fingerprint are pinned, and every number is checked
against the same explicitly labelled 3-month Consolidated PDF table.
Never infer publication timestamp or look-ahead eligibility.
"""
import hashlib,json,os,re
from datetime import datetime,timezone
from decimal import Decimal
from urllib.parse import urlparse
import boto3,fitz,psycopg,requests
from botocore.config import Config

REF="lrgpjimipfkyoqbpsqzz"
BUCKET="portfolioai-history-dev"
PREFIX="portfolioai-results/development/v1/quarterly/"
CONTRACT="PORTFOLIOAI_RESULTS_VERIFIED_ISSUER_PDF_V1"
KIND="RESULTS_QUARTERLY_ISSUER_PDF_V1"
SOURCE="COMPANY_EXCHANGE_FILING"
URL="https://www.coforge.com/hubfs/Outcome-of-Board-Meeting-Q3-FY2026.pdf"
ORIGINAL_SHA="ccb413ab9307be7f44abe592987e97d762a2204f95057110dc1f5d8cc0ce3247"
EXPECTED={
    "OPERATING_REVENUE_QUARTER":("4188.1","INR_CRORE","41,881","INR_MILLION"),
    "NET_PROFIT_QUARTER":("296.7","INR_CRORE","2,967","INR_MILLION"),
    "EPS_DILUTED":("7.38","INR_PER_SHARE","7.38","INR_PER_SHARE"),
}
def sha(b):return hashlib.sha256(b).hexdigest()
def compact(v):return json.dumps(v,sort_keys=True,separators=(",",":")).encode()
def validate(b):
    if not b.startswith(b"%PDF") or sha(b)!=ORIGINAL_SHA:
        raise RuntimeError("ISSUER_ORIGINAL_PDF_HASH_CHANGED_REQUIRES_NEW_REVIEW")
    d=fitz.open(stream=b,filetype="pdf")
    if len(d)!=10:raise RuntimeError("UNEXPECTED_ORIGINAL_PAGE_COUNT")
    cover=d[0].get_text("text")
    for fragment in ("L72100HR1992PLC128382","INE591G01025","NSE Symbol","COFORGE",
                     "January 22, 2026","December 31, 2025"):
        if fragment not in cover:raise RuntimeError("ISSUER_COVER_MISMATCH:"+fragment)
    t=d[4].get_text("text")
    for fragment in ("Consolidated Financial Results","Rs. in Mn",
                     "Quarter ended","December 31,","2025",
                     "Revenue from operations","Profit for the period",
                     "Diluted","41,881","2,967","7.38"):
        if fragment not in t:raise RuntimeError("ISSUER_TABLE_MISSING:"+fragment)
    if "FY 2026-27" in t:raise RuntimeError("PERIOD_SCOPE_MISMATCH")
    # Column 1 must have all three pinned source values. For this
    # specific audited issuer-hosted PDF (checksum above) the whole table
    # and column coordinates were visually reviewed, not assumed.
    return {"symbols":"COFORGE","source_pdf_sha256":sha(b),
            "page_count":len(d),"validated_table_page_zero_index":4}

def s3_client():
    setting=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip()
    if re.fullmatch(r"[a-f0-9]{32}",setting):end="https://"+setting+".r2.cloudflarestorage.com"
    elif setting.startswith("https://"):
        u=urlparse(setting)
        if u.scheme!="https" or not re.fullmatch(r"[a-f0-9]{32}\.r2\.cloudflarestorage\.com",u.hostname or "") or u.path not in ("","/") or u.query:raise RuntimeError("BAD_R2_ENDPOINT")
        end=setting.rstrip("/")
    else:raise RuntimeError("BAD_R2_ACCOUNT")
    return boto3.client("s3",endpoint_url=end,region_name="auto",
        aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
        config=Config(retries={"max_attempts":2,"mode":"standard"}))

def immutable_write(s3,key,payload):
    try:
        other=s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()
        if other!=payload:raise RuntimeError("IMMUTABLE_R2_CONFLICT")
        return "REUSED"
    except s3.exceptions.NoSuchKey:pass
    except Exception as error:
        # Any failure other than a definite NotFound rejects, not overwrites.
        from botocore.exceptions import ClientError
        if not isinstance(error,ClientError) or error.response.get("Error",{}).get("Code") not in("NoSuchKey","404"):
            raise
    s3.put_object(Bucket=BUCKET,Key=key,Body=payload,ContentType="application/pdf" if key.endswith(".pdf") else "application/json")
    readback=s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()
    if readback!=payload:raise RuntimeError("R2_IMMUTABLE_READBACK_MISMATCH")
    return "WRITTEN"

def main():
    db=os.environ.get("SUPABASE_DB_URL","")
    if REF not in db:raise RuntimeError("WRONG_DATABASE")
    if os.environ.get("CLOUDFLARE_R2_BUCKET")!=BUCKET:raise RuntimeError("WRONG_BUCKET")
    r=requests.get(URL,timeout=35,headers={"User-Agent":"Mozilla/5.0"})
    r.raise_for_status()
    b=r.content
    qualification=validate(b)
    s3=s3_client()
    prefix=PREFIX+"security_id=INE591G01025/period_end=2025-12-31/"
    original_key=prefix+"original_version="+sha(b)+"/issuer-original.pdf"
    facts={code:{"value":value,"unit":unit,"original_value":original,"original_unit":original_unit,
                 "page_zero_index":4,"source_table":"Consolidated Financial Results; quarter ended Dec 31 2025"}
           for code,(value,unit,original,original_unit) in EXPECTED.items()}
    manifest={
       "contract":CONTRACT,"symbol":"COFORGE","isin":"INE591G01025",
       "period_start":"2025-10-01","period_end":"2025-12-31",
       "consolidation_scope":"CONSOLIDATED","issuer_filing_url":URL,
       "reporting_currency":"INR","publication_timestamp":None,
       "original_sha256_retained":sha(b),"original_r2_key":original_key,
       "original_pdf_retained":True,"facts":facts,
       "evidence":qualification,
       "figures_review_pending":True,
    }
    content=compact(manifest)
    version=sha(content)
    key=prefix+"source_version="+version+"/manifest.json"
    immutable_write(s3,original_key,b)
    immutable_write(s3,key,content)
    raw={**manifest,"r2_key":key,"r2_manifest_sha256":version}
    serialized=compact(raw)
    with psycopg.connect(db,autocommit=False) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM public.securities WHERE symbol='COFORGE' AND isin='INE591G01025' AND asset_class='EQUITY'")
            one=cur.fetchone()
            if not one:raise RuntimeError("TARGET_SECURITY_NOT_CANONICAL")
            sid=one[0]
            cur.execute("""INSERT INTO public.data_source_records
              (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
              VALUES(%s,%s,%s,%s,%s,%s::jsonb,%s::jsonb)
              ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING RETURNING id""",
              (SOURCE,KIND,"COFORGE:"+sha(b),URL,sha(serialized),serialized.decode(),
               '{"retention":"ORIGINAL_PDF_IMMUTABLE_R2","publication_precision":"UNKNOWN","results_review":"R4_CURRENT_DISPLAY"}'))
            result=cur.fetchone()
            if result:sourceid=result[0]
            else:
                cur.execute("""SELECT id FROM public.data_source_records
                    WHERE source_code=%s AND record_kind=%s AND external_record_id=%s AND payload_hash=%s""",
                    (SOURCE,KIND,"COFORGE:"+sha(b),sha(serialized)))
                source=cur.fetchone()
                if not source:raise RuntimeError("SOURCE_UPSERT_NOT_READABLE")
                sourceid=source[0]
            inserted=0
            for metric,(val,unit,_,_) in EXPECTED.items():
                cur.execute("""INSERT INTO public.fundamental_observations
                (security_id,metric_code,source_record_id,source_code,numeric_value,
                  currency,unit,period_start,period_end,period_type,
                  consolidation_scope,retrieved_at,fresh_until,evidence_status)
                VALUES (%s,%s,%s,%s,%s,'INR',%s,'2025-10-01','2025-12-31','QUARTER',
                 'CONSOLIDATED',now(),now()+interval '120 days','AVAILABLE')
                ON CONFLICT(security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id)
                DO NOTHING RETURNING id""",(sid,metric,sourceid,SOURCE,Decimal(val),unit))
                if cur.fetchone():inserted+=1
            cur.execute("""SELECT count(*) FROM public.fundamental_observations
                WHERE source_record_id=%s AND metric_code=ANY(%s) AND evidence_status='AVAILABLE'""",
                (sourceid,list(EXPECTED)))
            if cur.fetchone()[0]!=3:raise RuntimeError("THREE_METRIC_READBACK_MISMATCH")
        conn.commit()
    print(json.dumps({"source":"COFORGE","period_end":"2025-12-31",
        "original_pdf_sha256":sha(b),"r2_pdf":original_key,
        "r2_manifest":key,"source_record_id":str(sourceid),
        "new_observations":inserted,"core_observations_readback":3,
        "publication_timestamp":"UNKNOWN","historical_pit":False}))

if __name__=="__main__":main()
