#!/usr/bin/env python3
import boto3, hashlib, json, os, sys
from datetime import datetime, timezone
from urllib.parse import urljoin
import requests
from botocore.config import Config

UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/152 Safari/537.36"
LANDING="https://www.nseindia.com/companies-listing/corporate-filings-financial-results"
API="https://www.nseindia.com/api/corporates-financial-results"
OUT="docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_C_CANARY_2026-10-04.json"
PREFIX="portfolioai-history/development/p8/recovery/workstream-c/canary/"\n# CI trigger: workflow now present

def r2():
    raw=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/")
    if "://" in raw:
        from urllib.parse import urlparse
        host=urlparse(raw).hostname or ""
    else: host=raw
    suffix=".r2.cloudflarestorage.com"
    account=host[:-len(suffix)] if host.endswith(suffix) else host
    return boto3.client("s3",endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
        region_name="auto",config=Config(s3={"addressing_style":"path"}))

def main():
    bucket=os.environ["CLOUDFLARE_R2_BUCKET"]
    if bucket!="portfolioai-history-dev": raise RuntimeError("Refusing non-Development bucket")
    s=requests.Session(); s.headers.update({"User-Agent":UA,"Accept":"application/json,text/plain,*/*","Referer":LANDING})
    if s.get(LANDING,timeout=30).status_code!=200: raise RuntimeError("NSE landing unavailable")
    params={"index":"equities","period":"Quarterly","from_date":"01-01-2025","to_date":"07-01-2025"}
    r=s.get(API,params=params,timeout=60)
    audit={"version":"P8_B_RECOVERY_WORKSTREAM_C_CANARY_V1","generated_at":datetime.now(timezone.utc).isoformat(),
           "endpoint":r.url,"status_code":r.status_code,"scope":{"provider_calls":0,"production_changes":0}}
    if r.status_code!=200: raise RuntimeError(f"NSE financial-results HTTP {r.status_code}")
    rows=r.json()
    if not isinstance(rows,list): raise RuntimeError("Unexpected NSE payload")
    audit["rows"]=len(rows); audit["first_keys"]=sorted(rows[0].keys()) if rows else []
    candidates=[]
    for row in rows:
        if not isinstance(row,dict): continue
        for key in ("xbrl","xbrlLink","xml","link","attachment","attchmntFile"):
            val=row.get(key)
            if isinstance(val,str) and val.strip():
                u=urljoin("https://www.nseindia.com",val.strip())
                if u.startswith("http"): candidates.append((row,key,u)); break
    audit["candidate_links"]=len(candidates)
    saved=[]
    client=r2()
    for row,key,url in candidates[:2]:
        rr=s.get(url,timeout=90)
        if rr.status_code!=200 or not rr.content: continue
        sha=hashlib.sha256(rr.content).hexdigest()
        ext=".xml" if "xml" in rr.headers.get("content-type","").lower() or url.lower().endswith(".xml") else ".bin"
        obj=PREFIX+sha+ext
        try:
            head=client.head_object(Bucket=bucket,Key=obj)
            state="VERIFIED_EXISTING" if head.get("Metadata",{}).get("sha256")==sha else "EXISTS_METADATA_MISMATCH"
        except Exception:
            client.put_object(Bucket=bucket,Key=obj,Body=rr.content,Metadata={"sha256":sha,"source":"nse-official"})
            state="WRITTEN"
        saved.append({"source_url":url,"field":key,"sha256":sha,"bytes":len(rr.content),"r2_key":obj,"state":state})
    audit["saved_objects"]=saved
    audit["status"]="PASS" if rows and candidates and saved and all(x["state"]!="EXISTS_METADATA_MISMATCH" for x in saved) else "BLOCKED"
    os.makedirs("docs/p8",exist_ok=True)
    open(OUT,"w").write(json.dumps(audit,indent=2,sort_keys=True)+"\n")
    print(json.dumps(audit,indent=2,sort_keys=True))
    return 0 if audit["status"]=="PASS" else 2
if __name__=="__main__":
    try: sys.exit(main())
    except Exception as e:
        os.makedirs("docs/p8",exist_ok=True)
        failure={"version":"P8_B_RECOVERY_WORKSTREAM_C_CANARY_V1","status":"BLOCKED_FAIL_CLOSED","error":type(e).__name__+":"+str(e)}
        open(OUT,"w").write(json.dumps(failure,indent=2,sort_keys=True)+"\n"); print(json.dumps(failure),file=sys.stderr); sys.exit(2)
