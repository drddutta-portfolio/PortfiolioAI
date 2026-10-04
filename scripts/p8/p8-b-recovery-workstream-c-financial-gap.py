#!/usr/bin/env python3
import boto3,json,os
from urllib.parse import urlparse
from botocore.config import Config
from pathlib import Path
A=json.loads(Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_C_ACQUISITION_AUDIT_2026-10-04.json").read_text())
raw=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/")
h=urlparse(raw).hostname if "://" in raw else raw
s=".r2.cloudflarestorage.com"; account=h[:-len(s)] if h.endswith(s) else h
c=boto3.client("s3",endpoint_url=f"https://{account}.r2.cloudflarestorage.com",aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],region_name="auto",config=Config(s3={"addressing_style":"path"}))
body=c.get_object(Bucket=os.environ["CLOUDFLARE_R2_BUCKET"],Key=A["acquisition"]["manifest_r2_key"])["Body"].read().decode()
rows=[json.loads(x) for x in body.splitlines() if x.strip()]
good={x["isin"] for x in rows if x.get("kind")=="FINANCIAL_RESULT" and x.get("state")!="SOURCE_UNAVAILABLE"}
all_isins=set()
import psycopg
with psycopg.connect(os.environ["SUPABASE_DB_URL"],connect_timeout=20) as db, db.cursor() as cur:
 cur.execute("select historical_isin from public.p8_historical_security_identities where experiment_id='P8_EXP_NSE_MONTHLY_6M_V1'")
 all_isins={str(r[0]).strip().upper() for r in cur.fetchall()}
out={"verified_nse_financial_isins":len(good),"historical_isins":len(all_isins),"financial_gap_isins":len(all_isins-good),"gap_isins":sorted(all_isins-good)}
Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_C_FINANCIAL_GAP_AUDIT_2026-10-04.json").write_text(json.dumps(out,indent=2,sort_keys=True)+"\n")
print(json.dumps(out,indent=2,sort_keys=True))
