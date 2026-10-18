#!/usr/bin/env python3
"""GMBREW issuer-signed 2025-03-31 balancing quarter, R5-only provenance.

Original signed 15 April 2025 quarter table p2 visually reviewed and SHA pinned.
Figures are *printed* in the quarter, not derived or interpolated from annual
amounts. No production/main, no overwrite of R4 canonical choices.
"""
from __future__ import annotations
import hashlib,json,os,re
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse
import boto3,fitz,psycopg,requests
from botocore.config import Config
from botocore.exceptions import ClientError
from psycopg.types.json import Jsonb

REF="lrgpjimipfkyoqbpsqzz";BUCKET="portfolioai-history-dev"
SYMBOL="GMBREW"; ISIN="INE075D01018"
END="2025-03-31"; START="2025-01-01"
SOURCE="COMPANY_EXCHANGE_FILING"
KIND="RESULTS_R5_GMBREW_SIGNED_MARCH_2025_V1"
URL="https://gmbreweries.com/images/4th%20Quarterly%20Financial%20Statement%2024-25.pdf"
SHA="a44eb86f04bf11939963e6d3325feb6b0f5045b6c9846bc4ea49495bce941ca3"
APPROVAL="R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION"
# Exact signed original p2 first-quarter column: INR LAKH -> INR CRORE.
FACTS={
 "OPERATING_REVENUE_QUARTER":("663.13","INR_CRORE"),
 "NET_PROFIT_QUARTER":("60.46","INR_CRORE"),
 "EPS_DILUTED":("26.47","INR_PER_SHARE"),
}
def digest(b):return hashlib.sha256(b).hexdigest()
def compact(j):return json.dumps(j,sort_keys=True,separators=(",",":")).encode()
def client():
    acct=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip()
    if re.fullmatch("[a-f0-9]{32}",acct):
        endpoint="https://"+acct+".r2.cloudflarestorage.com"
    else:
        p=urlparse(acct)
        if p.scheme!="https" or not re.fullmatch(r"[a-f0-9]{32}\.r2\.cloudflarestorage\.com",p.hostname or "") or p.path not in ("","/") or p.query or p.fragment:
            raise RuntimeError("R2_NOT_VERIFIED_DEVELOPMENT_ENDPOINT")
        endpoint=acct.rstrip("/")
    return boto3.client("s3",endpoint_url=endpoint,region_name="auto",
        aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
        config=Config(retries={"max_attempts":2,"mode":"standard"}))
def preserve(s3,key,data,kind):
    try:
        existing=s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()
    except ClientError as e:
        if e.response.get("Error",{}).get("Code") not in ("404","NoSuchKey"):raise
    else:
        if existing!=data:raise RuntimeError("IMMUTABLE_R2_ORIGINAL_CONFLICT")
        return
    s3.put_object(Bucket=BUCKET,Key=key,Body=data,ContentType=kind)
    if s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()!=data:
        raise RuntimeError("R2_SOURCE_BYTE_READBACK_FAILED")
def obtain():
    response=requests.get(URL,timeout=55,headers={"User-Agent":"Mozilla/5.0 (PortfolioAI Results source qualification)"})
    response.raise_for_status()
    if urlparse(response.url).hostname not in ("gmbreweries.com","www.gmbreweries.com"):
        raise RuntimeError("GMBREW_ISSUER_HOST_CHANGED")
    data=response.content
    if not data.startswith(b"%PDF") or digest(data)!=SHA:
        raise RuntimeError("GMBREW_ORIGINAL_ISSUER_SHA_MISMATCH")
    pdf=fitz.open(stream=data,filetype="pdf")
    if len(pdf)!=17:raise RuntimeError("GMBREW_ORIGINAL_DOCUMENT_PAGE_COUNT_CHANGED")
    cover=pdf[0].get_text("text").upper()
    table=pdf[2].get_text("text").upper()
    if "GMBREW" not in cover or "APRIL" not in cover or "2025" not in cover:
        raise RuntimeError("GMBREW_SIGNED_NOTICE_NOT_VERIFIED")
    if "2025" not in table or "REVENUE" not in table:
        raise RuntimeError("GMBREW_SIGNED_FINANCIAL_TABLE_NOT_VERIFIED")
    # The PDF carries visibly signed first quarter figures in its scanned
    # table; fuzzy glyph extraction must not replace visually reviewed values.
    return data
def main():
    url=os.environ["SUPABASE_DB_URL"]
    if REF not in url or os.environ.get("CLOUDFLARE_R2_BUCKET")!=BUCKET:
        raise RuntimeError("NOT_DEVELOPMENT_DB_AND_R2")
    with psycopg.connect(url) as db:
        with db.cursor() as c:
            c.execute("SELECT id FROM public.securities WHERE symbol=%s AND isin=%s AND asset_class='EQUITY'",(SYMBOL,ISIN))
            securities=c.fetchall()
            if len(securities)!=1:raise RuntimeError("GMBREW_CANONICAL_ISIN_IDENTITY_CHANGED")
            sid=securities[0][0]
            c.execute("""SELECT o.metric_code,o.numeric_value FROM public.fundamental_observations o
                WHERE o.security_id=%s AND o.period_end=%s
                  AND o.consolidation_scope='STANDALONE' AND o.evidence_status='AVAILABLE'
                  AND o.metric_code=ANY(%s::text[])""",(sid,END,list(FACTS)))
            for code,value in c.fetchall():
                if Decimal(value)!=Decimal(FACTS[code][0]):
                    raise RuntimeError("INDEPENDENT_MARCH_2025_ORIGINAL_VALUE_CONFLICT")
            c.execute("""SELECT id,raw_payload FROM public.data_source_records
              WHERE source_code=%s AND record_kind=%s AND external_record_id=%s""",
              (SOURCE,KIND,ISIN+":"+END))
            existing=c.fetchall()
            if len(existing)>1 or existing and existing[0][1].get("signedOriginalSHA256")!=SHA:
                raise RuntimeError("EXISTING_SIGNED_SOURCE_RECORD_DIVERGENT")
            source_id=existing[0][0] if existing else None
    if source_id is None:
        original=obtain()
        original_key=("portfolioai-results/development/v1/quarterly/security_id="+ISIN+
               "/period_end="+END+"/original_version="+SHA+"/issuer-original.pdf")
        manifest={
            "contract":"R5_GMBREW_SIGNED_ISSUER_Q4FY25_VISUAL_ORIGINAL_V1",
            "issuer":SYMBOL,"isin":ISIN,"sourceUrl":URL,
            "signedOriginalSHA256":SHA,"originalR2Key":original_key,
            "quarterEnd":END,"quarterStart":START,"reportingScope":"STANDALONE",
            "signedNoticeDate":"2025-04-15","financialPageZeroIndex":2,
            "printedQuarterColumnIndex":0,
            "balanceQuarterSourceNote":6,"currency":"INR",
            "financialUnits":"INR_LAKH","values":{code:{"value":v,"unit":unit} for code,(v,unit) in FACTS.items()},
            "comparisonPurpose":"RETROSPECTIVE_R5_ONLY",
            "publicationPreciseTimeQualified":False,
            "originalFinancialR4ChoicesUntouched":True}
        mb=compact(manifest)
        meta_key=original_key.rsplit("/",1)[0]+"/source-manifest-"+digest(mb)+".json"
        s3=client()
        preserve(s3,original_key,original,"application/pdf")
        preserve(s3,meta_key,mb,"application/json")
        full={**manifest,"sourceManifestR2Key":meta_key}
        with psycopg.connect(url) as db:
            with db.cursor() as c:
                c.execute("""INSERT INTO public.data_source_records
                     (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
                     VALUES (%s,%s,%s,%s,%s,%s,
                     '{"r5_comparison_only":true,"r4_selection_mutation":false,"publication_precision":"DATE_ONLY","original_hash_pinned":true}'::jsonb)
                     ON CONFLICT (source_code,record_kind,external_record_id,payload_hash)
                     DO NOTHING RETURNING id""",
                    (SOURCE,KIND,ISIN+":"+END,URL,digest(compact(full)),Jsonb(full)))
                admitted=c.fetchone()
                if admitted:source_id=admitted[0]
                else:
                    c.execute("""SELECT id FROM public.data_source_records WHERE source_code=%s
                        AND record_kind=%s AND external_record_id=%s AND payload_hash=%s""",
                        (SOURCE,KIND,ISIN+":"+END,digest(compact(full))))
                    source=c.fetchone()
                    if not source:raise RuntimeError("SIGNED_SOURCE_ALREADY_EXISTS_BUT_NOT_SAME_HASH")
                    source_id=source[0]
            db.commit()
    with psycopg.connect(url) as db:
        with db.cursor() as c:
            c.execute("SELECT id FROM public.securities WHERE symbol=%s AND isin=%s",(SYMBOL,ISIN))
            sid=c.fetchone()[0]
            observations={}
            for code,(value,unit) in FACTS.items():
                c.execute("""INSERT INTO public.fundamental_observations
                (security_id,source_record_id,source_code,metric_code,numeric_value,currency,unit,
                 period_start,period_end,period_type,consolidation_scope,evidence_status,retrieved_at,fresh_until)
                VALUES (%s,%s,'COMPANY_EXCHANGE_FILING',%s,%s,'INR',%s,%s,%s,
                    'QUARTER','STANDALONE','AVAILABLE',now(),now()+interval '120 days')
                ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,
                    consolidation_scope,source_record_id) DO NOTHING RETURNING id""",
                    (sid,source_id,code,Decimal(value),unit,START,END))
                result=c.fetchone()
                if result:oid=result[0]
                else:
                    c.execute("""SELECT id,numeric_value,unit FROM public.fundamental_observations
                      WHERE security_id=%s AND source_record_id=%s AND period_end=%s AND metric_code=%s""",
                      (sid,source_id,END,code))
                    row=c.fetchone()
                    if not row or Decimal(row[1])!=Decimal(value) or row[2]!=unit:
                        raise RuntimeError("IMMUTABLE_OBSERVATION_NOT_IDEMPOTENT")
                    oid=row[0]
                observations[code]=str(oid)
        db.commit()
    proof={"contract":"R5_GMBREW_SIGNED_2025_MARCH_ORIGINAL_V1","environment":"Development",
        "signedOriginalSHA256":SHA,
        "approvedSources":[{"symbol":SYMBOL,"securityId":str(sid),
            "periodEnd":END,"scope":"STANDALONE","sourceRecordId":str(source_id),
            "observations":observations,"approval":APPROVAL}]}
    out=Path("src/features/results/resultsR5GMBREWOriginalComparisonProof.json")
    out.write_text(json.dumps(proof,sort_keys=True,indent=2)+"\n")
    print("R5_GMBREW_2025_MARCH_ORIGINAL",json.dumps({
        "issuer":SYMBOL,"period":END,"sourceSHA":SHA,
        "qualifiedR5Comparative":True,"quarterFigures":3,
        "canonicalR4Changes":0,"estimatedFacts":0}))
if __name__=="__main__":main()
