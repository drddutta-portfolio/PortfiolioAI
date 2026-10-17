#!/usr/bin/env python3
"""Archive verified Federal Bank Dec-2024 issuer-original PDF, without making a financial grade.

Never substitute the original for canonical R4 selections. Historical R5 only
uses exact source originals after separately qualifying its NII/PAT/EPS fact
manifest through approved R2 hash + same-filing period/scope review.
"""
import hashlib,json,os,re
from urllib.parse import urlparse
import fitz,psycopg,requests,boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from psycopg.types.json import Jsonb
REF="lrgpjimipfkyoqbpsqzz"
BUCKET="portfolioai-history-dev"
SYMBOL="FEDERALBNK"
ISIN="INE171A01029"
KIND="RESULTS_R5_FEDERAL_2024_ORIGINAL_ARCHIVE_V1"
URL=("https://www.federal.bank.in/documents/10180/1124357561/"
     "Financial%2BResults%2B-%2BQ3%2BFY%2B25.pdf/"
     "b1e1c935-02cc-55eb-07bf-c4edd3b47123?t=1738032984384")
def digest(b): return hashlib.sha256(b).hexdigest()
def strict_host(url):
    p=urlparse(url)
    if p.scheme!="https" or p.hostname!="www.federal.bank.in" or p.fragment:
        raise RuntimeError("SOURCE_ISSUER_DOMAIN_INVALID")
def r2():
    acct=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip()
    if re.fullmatch("[0-9a-f]{32}",acct):
        endpoint="https://"+acct+".r2.cloudflarestorage.com"
    elif acct.startswith("https://"):
        parsed=urlparse(acct)
        if parsed.scheme!="https" or not re.fullmatch(r"[0-9a-f]{32}\.r2\.cloudflarestorage\.com",parsed.hostname or "") or parsed.path not in ("","/") or parsed.query or parsed.fragment:
            raise RuntimeError("R2_DEVELOPMENT_ENDPOINT_INVALID")
        endpoint=acct.rstrip("/")
    else:
        raise RuntimeError("R2_DEVELOPMENT_ACCOUNT_ID_INVALID")
    return boto3.client("s3",endpoint_url=endpoint,
        aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
        region_name="auto",config=Config(retries={"max_attempts":2,"mode":"standard"}))
def immutable(s3,key,payload):
    try:
        previous=s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()
    except ClientError as e:
        if e.response.get("Error",{}).get("Code") not in ("NoSuchKey","404"):
            raise
    else:
        if previous!=payload: raise RuntimeError("EXISTING_R2_ORIGINAL_BYTES_DISAGREE")
        return "REUSED"
    s3.put_object(Bucket=BUCKET,Key=key,Body=payload,ContentType="application/pdf" if key.endswith(".pdf") else "application/json")
    if s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()!=payload:
        raise RuntimeError("IMMUTABLE_R2_READBACK_DIFFERENT")
    return "ARCHIVED"
def main():
    if os.environ.get("CLOUDFLARE_R2_BUCKET")!=BUCKET or REF not in os.environ.get("SUPABASE_DB_URL",""):
        raise RuntimeError("DEV_R2_AND_SUPABASE_ONLY")
    strict_host(URL)
    with psycopg.connect(os.environ["SUPABASE_DB_URL"]) as db:
        with db.cursor() as cur:
            cur.execute("SELECT id FROM public.securities WHERE symbol=%s AND isin=%s AND asset_class='EQUITY'",(SYMBOL,ISIN))
            one=cur.fetchall()
            if len(one)!=1:raise RuntimeError("ISSUER_IDENTITY_NOT_UNIQUE")
            cur.execute("SELECT count(*) FROM public.data_source_records WHERE source_code='COMPANY_EXCHANGE_FILING' AND record_kind=%s AND source_url=%s",(KIND,URL))
            if cur.fetchone()[0]>0:
                print("R5_FEDERAL_ORIGINAL_SOURCE",json.dumps({"result":"ALREADY_ARCHIVED","financialObservationsInserted":0}))
                return
        response=requests.get(URL,timeout=50,headers={"User-Agent":"Mozilla/5.0 PortfolioAI-R5-Development"})
        response.raise_for_status()
        strict_host(response.url)
        raw=response.content
        if not raw.startswith(b"%PDF") or not 50000<len(raw)<10000000:
            raise RuntimeError("NOT_QUALIFIED_ORIGINAL_PDF_BYTES")
        pdf=fitz.open(stream=raw,filetype="pdf")
        if not 4<=len(pdf)<=12:raise RuntimeError("UNEXPECTED_ISSUER_REPORT_LENGTH")
        text=pdf[0].get_text("text").upper()
        for mark in ("FEDERAL BANK","L65191KL1931PLC000368",
                     "DECEMBER 31, 2024","STANDALONE","DILUTED EPS",
                     "31.12.2024","31.12.2023"):
            if mark not in text:raise RuntimeError("ISSUER_PERIOD_TABLE_FAILED:"+mark)
        prefix=("portfolioai-results/development/v1/quarterly/security_id="
                +ISIN+"/period_end=2024-12-31/original_version="+digest(raw)+"/")
        key=prefix+"issuer-original.pdf"
        manifest={
          "contract":"R5_ISSUER_ORIGINAL_ARCHIVE_PENDING_NUMERIC_REVIEW_V1",
          "symbol":SYMBOL,"isin":ISIN,"quarter":"2024-12-31",
          "scope":"STANDALONE","verifiedPage":0,"expectedCompanyCIN":"L65191KL1931PLC000368",
          "sourceUrl":URL,"sha256":digest(raw),"originalR2Key":key,
          "originalRetained":True,"financialFactsQualified":False,
          "r4SelectionModified":False,
          "independentFollowup":"R2 hash replay + verify quarter NII/PAT/diluted EPS and same reporting basis; no retrospective point-in-time inference",
        }
        manifest_data=json.dumps(manifest,sort_keys=True,separators=(",",":")).encode()
        skey=prefix+"source_version="+digest(manifest_data)+"/source-metadata.json"
        s3=r2()
        state=immutable(s3,key,raw)
        immutable(s3,skey,manifest_data)
        with db.cursor() as cur:
            cur.execute("""INSERT INTO public.data_source_records
               (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
               VALUES ('COMPANY_EXCHANGE_FILING',%s,%s,%s,%s,%s,
                  '{"retention":"IMMUTABLE_DEVELOPMENT_R2","admission":"SOURCE_ARCHIVE_ONLY","point_in_time":"UNKNOWN"}'::jsonb)
               ON CONFLICT (source_code,record_kind,external_record_id,payload_hash) DO NOTHING
               RETURNING id""",
                (KIND,SYMBOL+":"+digest(raw),URL,digest(manifest_data),Jsonb({**manifest,"manifestR2Key":skey})))
            created=bool(cur.fetchone())
        db.commit()
        print("R5_FEDERAL_ORIGINAL_SOURCE",json.dumps({
           "result":state,"sourceRecordRegistered":created,"issuer":SYMBOL,
           "quarter":"2024-12-31","scope":"STANDALONE",
           "originalSHA256":digest(raw),"financialObservationsInserted":0,
           "canonicalR4SelectionChanges":0,"R5AutoGrade":False}))
if __name__=="__main__":main()
