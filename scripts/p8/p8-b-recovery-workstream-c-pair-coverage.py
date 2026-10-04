#!/usr/bin/env python3
import boto3,bisect,json,os
from collections import Counter,defaultdict
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlparse
import duckdb,psycopg
from botocore.config import Config

A=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_C_ACQUISITION_AUDIT_2026-10-04.json")
R=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_C_REPAIR_AUDIT_2026-10-04.json")
OUT=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_C_PAIR_COVERAGE_AUDIT_2026-10-04.json")
B2="portfolioai-history/development/p8/b2/universe-members/v1/"

def acct(raw):
 h=urlparse(raw).hostname if "://" in raw else raw;s=".r2.cloudflarestorage.com";return h[:-len(s)] if h.endswith(s) else h
def s3():
 a=acct(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
 return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],region_name="auto",config=Config(s3={"addressing_style":"path"}))
def parse(v):
 d=datetime.fromisoformat(str(v).replace("Z","+00:00"))
 if d.tzinfo is None:d=d.replace(tzinfo=timezone.utc)
 return d.astimezone(timezone.utc)

def main():
 c=s3();bucket=os.environ["CLOUDFLARE_R2_BUCKET"]
 with psycopg.connect(os.environ["SUPABASE_DB_URL"],connect_timeout=20) as db,db.cursor() as cur:
  cur.execute("select id::text,historical_isin from public.p8_historical_security_identities where experiment_id='P8_EXP_NSE_MONTHLY_6M_V1'")
  idmap={str(i):str(isin).strip().upper() for i,isin in cur.fetchall()}
 audit=json.loads(A.read_text());mk=audit["acquisition"]["manifest_r2_key"]
 rows=[json.loads(x) for x in c.get_object(Bucket=bucket,Key=mk)["Body"].read().decode().splitlines() if x.strip()]
 fin=defaultdict(list)
 for x in rows:
  if x.get("kind")=="FINANCIAL_RESULT" and x.get("state")!="SOURCE_UNAVAILABLE" and x.get("time"):
   fin[x["isin"]].append(parse(x["time"]))
 if R.exists():
  rr=json.loads(R.read_text())
  if rr.get("repair_overlay"):
   ovs=[json.loads(x) for x in c.get_object(Bucket=bucket,Key=rr["repair_overlay"])["Body"].read().decode().splitlines() if x.strip()]
   # repaired dead filings retain original dissemination time through dead_url lookup
   badtime={(x.get("isin"),x.get("url")):x.get("time") for x in rows if x.get("kind")=="FINANCIAL_RESULT"}
   for x in ovs:
    if x.get("state")=="REPAIRED":
     t=badtime.get((x.get("isin"),x.get("dead_url")))
     if t:fin[x["isin"]].append(parse(t))
 for v in fin.values():v.sort()
 keys=[];token=None
 while True:
  kw={"Bucket":bucket,"Prefix":B2}
  if token:kw["ContinuationToken"]=token
  p=c.list_objects_v2(**kw);keys += [z["Key"] for z in p.get("Contents",[]) if z["Key"].endswith("/part-00000.parquet")]
  if not p.get("IsTruncated"):break
  token=p["NextContinuationToken"]
 tmp=Path("tmp/p8-c-pair");tmp.mkdir(parents=True,exist_ok=True);files=[]
 for i,k in enumerate(sorted(keys)):
  f=tmp/f"m{i}.parquet";c.download_file(bucket,k,str(f));files.append(str(f))
 q=",".join("'"+x.replace("'","''")+"'" for x in files);con=duckdb.connect()
 pairs=con.execute(f"select historical_identity_id,decision_at from read_parquet([{q}]) where membership_state='ELIGIBLE' order by decision_at,historical_identity_id").fetchall();con.close()
 if len(pairs)!=121956:raise RuntimeError(f"eligible drift {len(pairs)}")
 covered=0;gaps=[];bydate=defaultdict(Counter);gap_isins=set()
 for hid,dv in pairs:
  isin=idmap[str(hid)];d=parse(dv);arr=fin.get(isin,[])
  ok=bisect.bisect_left(arr,d)>0
  day=d.date().isoformat()
  if ok:covered+=1;bydate[day]["covered"]+=1
  else:
   gaps.append((str(hid),isin,d.isoformat()));gap_isins.add(isin);bydate[day]["gap"]+=1
 out={"version":"P8_B_RECOVERY_WORKSTREAM_C_PAIR_COVERAGE_V1","generated_at":datetime.now(timezone.utc).isoformat(),
  "eligible_pairs":len(pairs),"nse_financial_source_covered_pairs":covered,"nse_financial_source_gap_pairs":len(gaps),
  "nse_financial_source_gap_unique_isins":len(gap_isins),"coverage_ratio":covered/len(pairs),
  "by_decision_date":{k:dict(v) for k,v in sorted(bydate.items())},
  "gap_sample":[{"historical_identity_id":a,"historical_isin":b,"decision_at":d} for a,b,d in gaps[:200]],
  "provider_calls":0,"production_changes":0,"performance_outcome_reads":0}
 OUT.write_text(json.dumps(out,indent=2,sort_keys=True)+"\n");print(json.dumps(out,indent=2,sort_keys=True))
if __name__=="__main__":main()
