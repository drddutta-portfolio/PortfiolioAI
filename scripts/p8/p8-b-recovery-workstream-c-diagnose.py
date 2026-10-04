#!/usr/bin/env python3
import boto3, collections, hashlib, json, os, sys, time
from pathlib import Path
from urllib.parse import urlparse
import requests
from botocore.config import Config

AUDIT=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_C_ACQUISITION_AUDIT_2026-10-04.json")
OUT=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_C_BLOCKER_DIAGNOSTIC_2026-10-04.json")
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"

def acct(raw):
    h=urlparse(raw).hostname if "://" in raw else raw
    suf=".r2.cloudflarestorage.com"
    return h[:-len(suf)] if h.endswith(suf) else h

def s3():
    a=acct(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
    return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",
      aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
      aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],region_name="auto",
      config=Config(s3={"addressing_style":"path"}))

def probe(url):
    q=requests.Session()
    q.headers.update({
      "User-Agent":UA,"Accept":"*/*","Accept-Language":"en-US,en;q=0.9",
      "Referer":"https://www.nseindia.com/","Connection":"keep-alive"
    })
    out={"url":url}
    for mode in ("plain","archive_referer"):
        try:
            if mode=="archive_referer": q.headers["Referer"]="https://nsearchives.nseindia.com/"
            r=q.get(url,timeout=45,allow_redirects=True)
            out[mode]={"status":r.status_code,"bytes":len(r.content),"final_url":r.url,"content_type":r.headers.get("content-type")}
            if r.status_code==200 and r.content:
                out["recovered"]=True
                out["sha256"]=hashlib.sha256(r.content).hexdigest()
                break
        except Exception as e:
            out[mode]={"error":type(e).__name__+":"+str(e)[:160]}
    return out

def bse_probe():
    q=requests.Session()
    q.headers.update({
      "authority":"api.bseindia.com","accept":"application/json, text/plain, */*",
      "accept-language":"en-US,en;q=0.9","origin":"https://www.bseindia.com",
      "referer":"https://www.bseindia.com/","sec-fetch-dest":"empty",
      "sec-fetch-mode":"cors","sec-fetch-site":"same-site","user-agent":UA
    })
    landing=q.get("https://www.bseindia.com/corporates/ann.html",timeout=30)
    api=q.get("https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w",params={
      "pageno":1,"strCat":"-1","strPrevDate":"20250102","strScrip":"",
      "strSearch":"P","strToDate":"20250102","strType":"C"
    },timeout=45)
    out={"landing":landing.status_code,"api":api.status_code,"content_type":api.headers.get("content-type")}
    try:
        j=api.json(); out["json"]=True; out["keys"]=sorted(j.keys()) if isinstance(j,dict) else []; out["table_rows"]=len(j.get("Table",[])) if isinstance(j,dict) else None
    except Exception:
        out["json"]=False; out["body_prefix"]=api.text[:200]
    return out

def main():
    audit=json.loads(AUDIT.read_text())
    key=audit["acquisition"]["manifest_r2_key"]
    obj=s3().get_object(Bucket=os.environ["CLOUDFLARE_R2_BUCKET"],Key=key)["Body"].read().decode()
    rows=[json.loads(x) for x in obj.splitlines() if x.strip()]
    bad=[x for x in rows if x.get("state")=="SOURCE_UNAVAILABLE"]
    by_http=collections.Counter(str(x.get("http")) for x in bad)
    by_kind=collections.Counter(x.get("kind") for x in bad)
    hosts=collections.Counter(urlparse(x.get("url","")).hostname for x in bad)
    probes=[probe(x["url"]) for x in bad]
    recovered=sum(bool(x.get("recovered")) for x in probes)
    out={
      "version":"P8_B_RECOVERY_WORKSTREAM_C_BLOCKER_DIAGNOSTIC_V1",
      "manifest":key,"source_unavailable":len(bad),
      "by_http":dict(by_http),"by_kind":dict(by_kind),"by_host":dict(hosts),
      "reprobe_recovered":recovered,"reprobe_remaining":len(bad)-recovered,
      "bse":bse_probe(),
      "unavailable":[{k:x.get(k) for k in ("url","isin","kind","time","http","transport_error")} for x in bad],
      "reprobes":probes,
      "provider_calls":0,"production_changes":0
    }
    OUT.write_text(json.dumps(out,indent=2,sort_keys=True)+"\n")
    print(json.dumps(out,indent=2,sort_keys=True))
    return 0
if __name__=="__main__": sys.exit(main())
