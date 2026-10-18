#!/usr/bin/env python3
"""Two manually source-reviewed 2024 Tata Power original consolidated financial statements.

Read the 2024 financial row/column from the *exact signed original* previously
rendered for independent visual review. Every amount and EPS choice is pinned
to one SHA-256 file, not inferred from a parser's ambiguous glyph geometry.
The two supported original pages and identical-byte R2 archive must qualify
before any R5-only observations. NEVER modify canonical R4 selections or
claim publication-bounded trade-time grades.
"""
from __future__ import annotations
import hashlib, json, os, re
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse
import boto3, fitz, psycopg, requests
from botocore.config import Config
from botocore.exceptions import ClientError
from psycopg.types.json import Jsonb

PROJECT="lrgpjimipfkyoqbpsqzz"
BUCKET="portfolioai-history-dev"
SYMBOL="TATAPOWER"
ISIN="INE245A01021"
KIND="RESULTS_R5_TATAPOWER_SOURCE_LOCKED_2024_V1"
SOURCE="COMPANY_EXCHANGE_FILING"
PROOF="R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION"
BASE=("https://www.tatapower.com/company-financials/quarterly-reports/"
      "fy2024---2025/")
# SHA digests were verified from signed issuer original PDFs in 18-Oct-2026
# GitHub Actions run 39145065784 and source tables visually inspected.
PERIODS={
    "2024-09-30":dict(
        start="2024-07-01",
        filename="consolidated-and-standalone-financial-results-for-the-quarter-and-half-year-ended-30th-september-2024.pdf",
        sha="d04f36345f5ee6d94a19ba99385bf30a5937e5d37f862c019903681c4ba1c4bc",
        expected_title="SEPTEMBER",page=7,revenue="15697.67",
        pat="1093.08",eps="2.90"),
    "2024-12-31":dict(
        start="2024-10-01",
        filename="consolidated-and-standalone-financial-results-for-the-quarter-and-nine-months-ended-31st-december-2024.pdf",
        sha="eadab3f13b927c614814c1cb2ee4b4f9e0b13fe73268f0646cc6a9efc420bc33",
        expected_title="DECEMBER",page=7,revenue="15391.06",
        pat="1187.54",eps="3.22"),
}
def sha(payload:bytes)->str: return hashlib.sha256(payload).hexdigest()
def compact(obj)->bytes: return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()
def account():
    value=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip()
    if re.fullmatch(r"[a-f0-9]{32}",value):
        return "https://"+value+".r2.cloudflarestorage.com"
    p=urlparse(value)
    if p.scheme!="https" or not re.fullmatch(r"[a-f0-9]{32}\.r2\.cloudflarestorage\.com",p.hostname or "") or p.path not in ("","/") or p.query or p.fragment:
        raise RuntimeError("R2_ACCOUNT_OR_ENDPOINT_NOT_DEVELOPMENT")
    return value.rstrip("/")
def s3():
    return boto3.client("s3",endpoint_url=account(),region_name="auto",
      aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
      aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
      config=Config(retries={"max_attempts":2,"mode":"standard"}))
def preserve(client,key,raw,media):
    try:
        existing=client.get_object(Bucket=BUCKET,Key=key)["Body"].read()
    except ClientError as e:
        if e.response.get("Error",{}).get("Code") not in ("NoSuchKey","404"):
            raise
    else:
        if existing!=raw:raise RuntimeError("IMMUTABLE_R2_KEY_CONFLICT")
        return "REUSED"
    client.put_object(Bucket=BUCKET,Key=key,Body=raw,ContentType=media)
    if client.get_object(Bucket=BUCKET,Key=key)["Body"].read()!=raw:
        raise RuntimeError("R2_BYTE_FOR_BYTE_READBACK_MISMATCH")
    return "ARCHIVED"
def obtain_exact(period,config):
    url=BASE+config["filename"]
    response=requests.get(url,timeout=60,headers={"User-Agent":"Mozilla/5.0 (PortfolioAI Results source review)"})
    response.raise_for_status()
    p=urlparse(response.url)
    if p.scheme!="https" or p.hostname!="www.tatapower.com" or p.fragment:
        raise RuntimeError("ISSUER_URL_REDIRECT_OUTSIDE_DOMAIN")
    raw=response.content
    if not raw.startswith(b"%PDF") or sha(raw)!=config["sha"]:
        raise RuntimeError("TATA_ORIGINAL_SIGNED_SHA_MISMATCH")
    pdf=fitz.open(stream=raw,filetype="pdf")
    if not 12<=len(pdf)<=38 or config["page"]>=len(pdf):
        raise RuntimeError("TATA_SOURCE_ORIGINAL_PAGE_COUNT_CHANGED")
    cover=pdf[0].get_text("text").upper()
    table=pdf[config["page"]].get_text("text").upper()
    for word in ("500400","TATAPOWER","THE TATA POWER COMPANY LIMITED"):
        if word not in cover:raise RuntimeError("ISSUER_EXCHANGE_IDENTITY_NOT_PROVEN:"+word)
    for word in ("CONSOLIDATED FINANCIAL RESULTS","REVENUE FROM OPERATIONS",
                 "PROFIT","EARNINGS PER EQUITY SHARE",config["expected_title"]):
        if word not in table:raise RuntimeError("SIGNED_CONSOLIDATED_TABLE_LABEL_NOT_PROVEN:"+word)
    # This exact PDF byte hash (NOT OCR) pins the visually reviewed, specific
    # first-quarter column of the signed consolidated table. EPS is the
    # 'Diluted' row AFTER net regulatory deferral balances, not the separate
    # diluted EPS BEFORE regulatory movement.
    figures={
       "OPERATING_REVENUE_QUARTER":(config["revenue"],"INR_CRORE"),
       "NET_PROFIT_QUARTER":(config["pat"],"INR_CRORE"),
       "EPS_DILUTED":(config["eps"],"INR_PER_SHARE"),
    }
    if not all(Decimal(value)>0 for value,_ in figures.values()):
        raise RuntimeError("REVIEWED_SOURCE_NUMBERS_INVALID")
    return raw,figures,url
def main():
    dburl=os.environ["SUPABASE_DB_URL"]
    if PROJECT not in dburl or os.environ["CLOUDFLARE_R2_BUCKET"]!=BUCKET:
        raise RuntimeError("NOT_DEVELOPMENT_DB_AND_BUCKET")
    client=s3()
    proof_rows=[]
    for period,config in PERIODS.items():
        url=BASE+config["filename"]
        with psycopg.connect(dburl) as db:
            with db.cursor() as cur:
                cur.execute("""SELECT id FROM public.securities
                  WHERE symbol=%s AND isin=%s AND asset_class='EQUITY'""",
                  (SYMBOL,ISIN))
                identities=cur.fetchall()
                if len(identities)!=1:raise RuntimeError("TATA_CANONICAL_EQUITY_IDENTITY_MISSING")
                sid=identities[0][0]
                cur.execute("""SELECT id,raw_payload FROM public.data_source_records
                 WHERE source_code=%s AND record_kind=%s AND external_record_id=%s""",
                 (SOURCE,KIND,ISIN+":"+period))
                old=cur.fetchall()
                if len(old)>1:raise RuntimeError("COMPETING_EXACT_SOURCE_RECORDS")
                if old:
                    saved=old[0][1]
                    if saved.get("sourceOriginalSHA256")!=config["sha"]:
                        raise RuntimeError("STORED_SOURCE_SHA_CONFLICT")
                    source_id=old[0][0]
                    # On an idempotent replay, re-read the exact facts, no provider call.
                    cur.execute("""SELECT id,metric_code,numeric_value,unit FROM public.fundamental_observations
                       WHERE security_id=%s AND source_record_id=%s
                       AND period_end=%s AND consolidation_scope='CONSOLIDATED'
                       AND evidence_status='AVAILABLE'""",(sid,source_id,period))
                    facts={code:(str(oid),Decimal(value),unit) for oid,code,value,unit in cur.fetchall()}
                    exp={"OPERATING_REVENUE_QUARTER":(config["revenue"],"INR_CRORE"),
                         "NET_PROFIT_QUARTER":(config["pat"],"INR_CRORE"),
                         "EPS_DILUTED":(config["eps"],"INR_PER_SHARE")}
                    if set(facts)!=set(exp) or any(facts[c][1]!=Decimal(v) or facts[c][2]!=unit for c,(v,unit) in exp.items()):
                        raise RuntimeError("TATA_PRIOR_VERIFIED_OBSERVATIONS_CHANGED")
                    proof_rows.append(dict(symbol=SYMBOL,securityId=str(sid),periodEnd=period,
                      scope="CONSOLIDATED",sourceRecordId=str(source_id),
                      observations={code:facts[code][0] for code in sorted(exp)},
                      approval=PROOF))
                    print("R5_TATA_SOURCE_REUSED",period,"no_provider_calls")
                    continue
        raw,figures,url=obtain_exact(period,config)
        original_key=("portfolioai-results/development/v1/quarterly/security_id="+ISIN+
                      "/period_end="+period+"/original_version="+config["sha"]+"/issuer-original.pdf")
        manifest={
          "contract":"R5_TATAPOWER_SOURCE_LOCKED_MANUAL_VISUAL_CONSOLIDATED_V1",
          "sourceOriginalSHA256":config["sha"],"originalR2Key":original_key,
          "issuer":SYMBOL,"isin":ISIN,"periodEnd":period,"periodStart":config["start"],
          "sourceUrl":url,"tablePageZeroIndex":config["page"],"scope":"CONSOLIDATED",
          "units":"INR_CRORE","epsBasis":"DILUTED_AFTER_NET_REGULATORY_DEFERRAL_BALANCES",
          "independentReview":"SIGNED_ISSUER_ORIGINAL_FIRST_QUARTER_COLUMN_VISUALLY_REVIEWED_2026_10_18",
          "values":{code:{"value":value,"unit":unit} for code,(value,unit) in figures.items()},
          "nonPITRetrospective":True,"canonicalR4SelectionsUntouched":True,
        }
        manifest_bytes=compact(manifest)
        other_key=original_key.rsplit("/",1)[0]+"/source-manifest-"+sha(manifest_bytes)+".json"
        preserve(client,original_key,raw,"application/pdf")
        preserve(client,other_key,manifest_bytes,"application/json")
        payload={**manifest,"sourceManifestR2Key":other_key}
        with psycopg.connect(dburl) as db:
            with db.cursor() as cur:
                cur.execute("""SELECT id FROM public.securities WHERE symbol=%s AND isin=%s AND asset_class='EQUITY'""",(SYMBOL,ISIN))
                sid=cur.fetchone()[0]
                cur.execute("""SELECT metric_code,numeric_value FROM public.fundamental_observations
                 WHERE security_id=%s AND period_end=%s AND consolidation_scope='CONSOLIDATED'
                 AND evidence_status='AVAILABLE' AND metric_code=ANY(%s::text[])""",
                  (sid,period,list(figures)))
                for old_code,old_value in cur.fetchall():
                    if Decimal(old_value)!=Decimal(figures[old_code][0]):
                        raise RuntimeError("DIFFERENT_SAME_SCOPE_ORIGINAL_VALUE_REQUIRES_INDEPENDENT_REVIEW")
                # Selected R4 periods and other scope originals are not changed
                # under any circumstances. Numeric values are source-validated.
                cur.execute("""INSERT INTO public.data_source_records
                  (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
                  VALUES (%s,%s,%s,%s,%s,%s,
                    '{"R5_only":true,"R4_selection_changes":false,"publication_precision":"UNKNOWN","original":"R2_PINNED"}'::jsonb)
                  ON CONFLICT (source_code,record_kind,external_record_id,payload_hash)
                  DO NOTHING RETURNING id""",
                  (SOURCE,KIND,ISIN+":"+period,url,sha(compact(payload)),Jsonb(payload)))
                result=cur.fetchone()
                if result:source_id=result[0]
                else:
                    cur.execute("""SELECT id FROM public.data_source_records WHERE
                      source_code=%s AND record_kind=%s AND external_record_id=%s AND payload_hash=%s""",
                      (SOURCE,KIND,ISIN+":"+period,sha(compact(payload))))
                    item=cur.fetchone()
                    if not item:raise RuntimeError("REPLAY_SOURCE_ROW_READBACK_FAILED")
                    source_id=item[0]
                saved={}
                for code,(value,unit) in figures.items():
                    cur.execute("""INSERT INTO public.fundamental_observations
                     (security_id,source_record_id,source_code,metric_code,numeric_value,
                      unit,currency,period_start,period_end,period_type,consolidation_scope,
                      evidence_status,retrieved_at,fresh_until)
                     VALUES (%s,%s,'COMPANY_EXCHANGE_FILING',%s,%s,%s,'INR',
                       %s,%s,'QUARTER','CONSOLIDATED','AVAILABLE',now(),now()+interval '120 days')
                     ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,
                       consolidation_scope,source_record_id) DO NOTHING RETURNING id""",
                     (sid,source_id,code,Decimal(value),unit,config["start"],period))
                    wrote=cur.fetchone()
                    if wrote:oid=wrote[0]
                    else:
                        cur.execute("""SELECT id,numeric_value,unit FROM public.fundamental_observations
                          WHERE source_record_id=%s AND security_id=%s AND period_end=%s AND metric_code=%s""",
                          (source_id,sid,period,code))
                        prev=cur.fetchone()
                        if not prev or Decimal(prev[1])!=Decimal(value) or prev[2]!=unit:
                            raise RuntimeError("IDEMPOTENT_SOURCE_FACT_CONFLICT")
                        oid=prev[0]
                    saved[code]=str(oid)
            db.commit()
        proof_rows.append(dict(symbol=SYMBOL,securityId=str(sid),periodEnd=period,
           scope="CONSOLIDATED",sourceRecordId=str(source_id),
           observations=saved,approval=PROOF))
        print("R5_TATAPOWER_SOURCE_VERIFIED",period,config["sha"],"R4_changes=0")
    assert len(proof_rows)==2 and len({r["periodEnd"] for r in proof_rows})==2
    out=Path("src/features/results/resultsR5TataPowerOriginalComparisonProof.json")
    data={"contract":"R5_TATAPOWER_SIGNED_ISSUER_2024_CONSOLIDATED_V1",
          "environment":"Development","signedOriginals":["2024-09-30","2024-12-31"],
          "approvedSources":proof_rows}
    out.write_text(json.dumps(data,sort_keys=True,indent=2)+"\n")
    print("R5_TATAPOWER_ORIGINAL_COMPLETION",json.dumps({"company":SYMBOL,
      "quarters":len(proof_rows),"R4_canonical_changes":0,"R5_source_proof_rows":len(proof_rows)}))
if __name__=="__main__":main()
