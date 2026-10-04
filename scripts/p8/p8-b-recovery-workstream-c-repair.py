#!/usr/bin/env python3
import boto3, collections, hashlib, json, os, sys, time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse, urljoin
import requests, psycopg
from botocore.config import Config

BASE_AUDIT=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_C_ACQUISITION_AUDIT_2026-10-04.json")
OUT=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_C_REPAIR_AUDIT_2026-10-04.json")
PAGE="https://www.nseindia.com/companies-listing/corporate-filings-financial-results"
API="https://www.nseindia.com/api/corporates-financial-results"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
RAW="portfolioai-history/development/p8/recovery/workstream-c/raw/"
OVERLAY="portfolioai-history/development/p8/recovery/workstream-c/manifests/repair-"

def acct(raw):
    h=urlparse(raw).hostname if "://" in raw else raw
    s=".r2.cloudflarestorage.com"
    return h[:-len(s)] if h.endswith(s) else h

def s3():
    a=acct(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
    return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",
      aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
      aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],region_name="auto",
      config=Config(s3={"addressing_style":"path"},retries={"max_attempts":8,"mode":"adaptive"}))

def ids():
    with psycopg.connect(os.environ["SUPABASE_DB_URL"],connect_timeout=20) as c, c.cursor() as x:
        x.execute("select historical_isin from public.p8_historical_security_identities where experiment_id='P8_EXP_NSE_MONTHLY_6M_V1'")
        a={str(r[0]).strip().upper() for r in x.fetchall()}
    if len(a)!=4524: raise RuntimeError(f"identity drift {len(a)}")
    return a

def session():
    q=requests.Session();q.headers.update({"User-Agent":UA,"Accept":"application/json,text/plain,*/*","Referer":PAGE})
    if q.get(PAGE,timeout=30).status_code!=200:raise RuntimeError("NSE landing unavailable")
    return q

def get_rows(q,day):
    d=datetime.fromisoformat(day).date()
    lo=(d-timedelta(days=1)).strftime("%d-%m-%Y"); hi=(d+timedelta(days=1)).strftime("%d-%m-%Y")
    out=[]
    for period in ("Quarterly","Annual","Half-Yearly","Others"):
        for attempt in range(5):
            r=q.get(API,params={"index":"equities","period":period,"from_date":lo,"to_date":hi},timeout=60)
            if r.status_code==200:
                try:
                    data=r.json()
                    if isinstance(data,list):out.extend(data);break
                except:pass
            time.sleep(min(8,2**attempt))
    return out

def valid(v):
    if not isinstance(v,str):return None
    raw=v.strip()
    if not raw or raw.lower() in {"-","na","n/a","null","none","#"}:return None
    u=urljoin("https://www.nseindia.com",raw)
    return u if u.startswith("https://") else None

def fetch(url):
    q=requests.Session();q.headers.update({"User-Agent":UA,"Referer":"https://www.nseindia.com/","Accept":"*/*"})
    last=None
    for i in range(5):
        last=q.get(url,timeout=90)
        if last.status_code==200 and last.content:return last
        time.sleep(min(8,2**i))
    return last

def main():
    bucket=os.environ["CLOUDFLARE_R2_BUCKET"]; c=s3()
    base=json.loads(BASE_AUDIT.read_text()); key=base["acquisition"]["manifest_r2_key"]
    body=c.get_object(Bucket=bucket,Key=key)["Body"].read().decode()
    rows=[json.loads(x) for x in body.splitlines() if x.strip()]
    bad=[x for x in rows if x.get("state")=="SOURCE_UNAVAILABLE" and x.get("kind")=="FINANCIAL_RESULT"]
    good_fin={x.get("isin") for x in rows if x.get("state")!="SOURCE_UNAVAILABLE" and x.get("kind")=="FINANCIAL_RESULT"}
    q=session(); cache={}; repairs=[]
    for n,x in enumerate(bad,1):
        day=str(x.get("time") or "")[:10]
        if day not in cache: cache[day]=get_rows(q,day)
        candidates=[]
        for r in cache[day]:
            if str(r.get("isin") or "").strip().upper()!=x.get("isin"):continue
            for field in ("resultDetailedDataLink","xbrl"):
                u=valid(r.get(field))
                if u and u!=x.get("url") and u not in candidates:candidates.append(u)
        recovered=None
        for u in candidates:
            rr=fetch(u)
            if rr is not None and rr.status_code==200 and rr.content:
                sh=hashlib.sha256(rr.content).hexdigest()
                primary_hash=hashlib.sha256(x["url"].encode()).hexdigest()
                p=urlparse(u).path.lower()
                ext=".xml" if p.endswith(".xml") or "xml" in rr.headers.get("content-type","").lower() else ".pdf" if p.endswith(".pdf") or "pdf" in rr.headers.get("content-type","").lower() else ".bin"
                rk=RAW+primary_hash[:2]+"/"+primary_hash+ext
                c.put_object(Bucket=bucket,Key=rk,Body=rr.content,Metadata={"sha256":sh,"source-url-sha256":hashlib.sha256(u.encode()).hexdigest(),"kind":"financial_result","repair":"alternate-official-link"})
                recovered={"isin":x["isin"],"dead_url":x["url"],"selected_url":u,"r2_key":rk,"sha256":sh,"bytes":len(rr.content),"state":"REPAIRED"}
                good_fin.add(x["isin"]);break
        repairs.append(recovered or {"isin":x["isin"],"dead_url":x["url"],"candidates":candidates,"state":"UNRESOLVED"})
        if n%25==0:print(f"repair {n}/{len(bad)}",file=sys.stderr)

    all_ids=ids(); gaps=sorted(all_ids-good_fin)
    text="".join(json.dumps(x,sort_keys=True)+"\n" for x in repairs)
    h=hashlib.sha256(text.encode()).hexdigest();okey=OVERLAY+h+".jsonl"
    c.put_object(Bucket=bucket,Key=okey,Body=text.encode(),Metadata={"sha256":h,"version":"P8_B_RECOVERY_WORKSTREAM_C_REPAIR_V1"})
    states=collections.Counter(x["state"] for x in repairs)
    out={"version":"P8_B_RECOVERY_WORKSTREAM_C_REPAIR_V1","generated_at":datetime.now(timezone.utc).isoformat(),
      "base_manifest":key,"repair_overlay":okey,"repair_overlay_sha256":h,
      "dead_financial_sources":len(bad),"repair_states":dict(states),
      "historical_identities":len(all_ids),"identities_with_verified_nse_financial_source":len(good_fin),
      "residual_financial_source_gap_identities":len(gaps),"residual_gap_isins":gaps,
      "provider_calls":0,"production_changes":0,"supabase_writes":0}
    OUT.write_text(json.dumps(out,indent=2,sort_keys=True)+"\n")
    print(json.dumps(out,indent=2,sort_keys=True))
if __name__=="__main__":main()
