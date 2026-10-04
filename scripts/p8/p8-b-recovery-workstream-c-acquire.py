#!/usr/bin/env python3
import boto3, hashlib, json, os, sys, time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse
import psycopg, requests
from botocore.config import Config

V="P8_B_RECOVERY_WORKSTREAM_C_ACQUISITION_V1"
START=date(2021,4,1); END=date(2026,9,30)
DOC=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_C_ACQUISITION_AUDIT_2026-10-04.json")
RAW="portfolioai-history/development/p8/recovery/workstream-c/raw/"
MAN="portfolioai-history/development/p8/recovery/workstream-c/manifests/"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/152 Safari/537.36"
FIN_PAGE="https://www.nseindia.com/companies-listing/corporate-filings-financial-results"
FIN_API="https://www.nseindia.com/api/corporates-financial-results"
ANN_PAGE="https://www.nseindia.com/companies-listing/corporate-filings-application?id=allAnnouncements"
ANN_API="https://www.nseindia.com/api/corporate-announcements"

def acct(raw):
    h=urlparse(raw).hostname if "://" in raw else raw
    s=".r2.cloudflarestorage.com"
    return h[:-len(s)] if h.endswith(s) else h

def s3():
    a=acct(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
    return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",
      aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
      aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
      region_name="auto",config=Config(retries={"max_attempts":8,"mode":"adaptive"},s3={"addressing_style":"path"}))

def sess(page):
    q=requests.Session(); q.headers.update({"User-Agent":UA,"Accept":"application/json,text/plain,*/*","Referer":page})
    if q.get(page,timeout=30).status_code!=200: raise RuntimeError("official landing unavailable")
    return q

def getj(q,url,params):
    last=None; err=None
    for i in range(8):
        try:
            last=q.get(url,params=params,timeout=90)
            if last.status_code==200:
                try:return last.json()
                except ValueError:pass
        except requests.RequestException as e:
            err=e
        time.sleep(min(30,2**i))
    raise RuntimeError(f"official metadata unavailable HTTP {getattr(last,'status_code',None)} error={type(err).__name__ if err else None}")

def ids():
    db=os.environ["SUPABASE_DB_URL"]
    if "lrgpjimipfkyoqbpsqzz" not in db: raise RuntimeError("wrong database")
    with psycopg.connect(db,connect_timeout=20) as c, c.cursor() as x:
        x.execute("select historical_isin from public.p8_historical_security_identities where experiment_id='P8_EXP_NSE_MONTHLY_6M_V1'")
        a={str(r[0]).strip().upper() for r in x.fetchall()}
    if len(a)!=4524: raise RuntimeError(f"identity drift {len(a)}")
    return a

def dt(v):
    if not v:return None
    from zoneinfo import ZoneInfo
    for f in ("%d-%b-%Y %H:%M:%S","%d-%b-%Y %H:%M"):
        try:return datetime.strptime(str(v),f).replace(tzinfo=ZoneInfo("Asia/Kolkata")).astimezone(timezone.utc)
        except:pass
    return None

def finmeta(target):
    q=sess(FIN_PAGE); out=[]; n=0
    for period in ("Quarterly","Annual","Half-Yearly","Others"):
        d=START
        while d<=END:
            e=min(END,d+timedelta(days=30))
            a=getj(q,FIN_API,{"index":"equities","period":period,"from_date":d.strftime("%d-%m-%Y"),"to_date":e.strftime("%d-%m-%Y")}); n+=1
            if not isinstance(a,list):raise RuntimeError("financial metadata shape")
            for r in a:
                if str(r.get("isin") or "").strip().upper() in target: out.append(r)
            d=e+timedelta(days=1); time.sleep(.04)
    u={}
    for r in out:u[str(r.get("seqNumber") or hashlib.sha256(json.dumps(r,sort_keys=True).encode()).hexdigest())]=r
    return list(u.values()),n

def annkind(r):
    t=(str(r.get("desc") or "")+" "+str(r.get("attchmntText") or "")).upper()
    if "ANNUAL REPORT" in t:return "ANNUAL_REPORT"
    if any(x in t for x in ("RED HERRING PROSPECTUS","PROSPECTUS","INFORMATION MEMORANDUM")):return "RHP_INFORMATION_MEMORANDUM"
    if any(x in t for x in ("MERGER","DEMERGER","SCHEME OF ARRANGEMENT","AMALGAMATION")):return "CORPORATE_RESTRUCTURING"
    return None

def annmeta(target):
    q=sess(ANN_PAGE); out=[]; n=0; d=START
    while d<=END:
        e=min(END,d+timedelta(days=6))
        a=getj(q,ANN_API,{"index":"equities","from_date":d.strftime("%d-%m-%Y"),"to_date":e.strftime("%d-%m-%Y")}); n+=1
        if not isinstance(a,list):raise RuntimeError("announcement metadata shape")
        for r in a:
            if str(r.get("sm_isin") or "").strip().upper() in target:
                k=annkind(r)
                if k:r=dict(r);r["_kind"]=k;out.append(r)
        d=e+timedelta(days=1); time.sleep(.04)
    u={}
    for r in out:u[str(r.get("seq_id") or hashlib.sha256(json.dumps(r,sort_keys=True).encode()).hexdigest())]=r
    return list(u.values()),n

def link(v):
    if not isinstance(v,str) or not v.strip():return None
    u=urljoin("https://www.nseindia.com",v.strip())
    return u if u.startswith("https://") else None

def sources(fin,ann):
    a={}
    for r in fin:
        u=link(r.get("xbrl")) or link(r.get("resultDetailedDataLink"))
        if not u:continue
        isin=str(r.get("isin") or "").strip().upper(); t=dt(r.get("exchdisstime") or r.get("broadCastDate") or r.get("filingDate"))
        h=hashlib.sha256(u.encode()).hexdigest();a[h]={"url":u,"isin":isin,"kind":"FINANCIAL_RESULT","time":t.isoformat() if t else None}
    for r in ann:
        u=link(r.get("attchmntFile")) or link(r.get("csvName"))
        if not u:continue
        isin=str(r.get("sm_isin") or "").strip().upper(); t=dt(r.get("exchdisstime") or r.get("an_dt"))
        h=hashlib.sha256(u.encode()).hexdigest();a[h]={"url":u,"isin":isin,"kind":r["_kind"],"time":t.isoformat() if t else None}
    return a

def one(item,bucket):
    keyhash,meta=item; c=s3(); pref=RAW+keyhash[:2]+"/"+keyhash
    x=c.list_objects_v2(Bucket=bucket,Prefix=pref,MaxKeys=1).get("Contents",[])
    if x:
        k=x[0]["Key"];h=c.head_object(Bucket=bucket,Key=k)
        if h.get("Metadata",{}).get("sha256"):return {**meta,"r2_key":k,"sha256":h["Metadata"]["sha256"],"bytes":h["ContentLength"],"state":"VERIFIED_EXISTING"}
    q=requests.Session();q.headers.update({"User-Agent":UA,"Referer":"https://www.nseindia.com/"})
    r=None; err=None
    for i in range(8):
        try:
            r=q.get(meta["url"],timeout=120)
            if r.status_code==200 and r.content:break
        except requests.RequestException as e:
            err=e
            r=None
        time.sleep(min(30,2**i))
    if r is None or r.status_code!=200 or not r.content:
        return {**meta,"state":"SOURCE_UNAVAILABLE","http":getattr(r,"status_code",None),"transport_error":type(err).__name__ if err else None}
    sh=hashlib.sha256(r.content).hexdigest(); p=urlparse(meta["url"]).path.lower()
    ext=".xml" if p.endswith(".xml") or "xml" in r.headers.get("content-type","").lower() else ".pdf" if p.endswith(".pdf") or "pdf" in r.headers.get("content-type","").lower() else ".bin"
    k=pref+ext;c.put_object(Bucket=bucket,Key=k,Body=r.content,Metadata={"sha256":sh,"source-url-sha256":keyhash,"kind":meta["kind"].lower()})
    return {**meta,"r2_key":k,"sha256":sh,"bytes":len(r.content),"state":"WRITTEN"}

def bse():
    q=requests.Session();q.headers.update({"User-Agent":UA,"Accept":"application/json,text/plain,*/*","Origin":"https://www.bseindia.com","Referer":"https://www.bseindia.com/corporates/ann.html"})
    q.get("https://www.bseindia.com/corporates/ann.html",timeout=30)
    r=q.get("https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w",params={"pageno":1,"strCat":"-1","strPrevDate":"20250102","strScrip":"","strSearch":"P","strToDate":"20250102","strType":"C"},timeout=45)
    ok=False
    try:ok=r.status_code==200 and isinstance(r.json(),dict)
    except:pass
    return {"status_code":r.status_code,"json_ready":ok}

def main():
    bucket=os.environ["CLOUDFLARE_R2_BUCKET"]
    if bucket!="portfolioai-history-dev":raise RuntimeError("wrong bucket")
    target=ids(); fin,nf=finmeta(target); ann,na=annmeta(target); src=sources(fin,ann)
    results=[]
    with ThreadPoolExecutor(max_workers=20) as ex:
        fs=[ex.submit(one,x,bucket) for x in src.items()]
        for i,f in enumerate(as_completed(fs),1):
            results.append(f.result())
            if i%500==0:print(f"{i}/{len(fs)}",file=sys.stderr)
    states=Counter(x["state"] for x in results);bykind=Counter(x["kind"] for x in results if x["state"]!="SOURCE_UNAVAILABLE")
    byisin=defaultdict(set)
    for x in results:
        if x["state"]!="SOURCE_UNAVAILABLE":byisin[x["isin"]].add(x["kind"])
    gap={i for i in target if "FINANCIAL_RESULT" not in byisin[i] or not ({"ANNUAL_REPORT","RHP_INFORMATION_MEMORANDUM"} & byisin[i])}
    bp=bse() if gap else {"status_code":None,"json_ready":True}
    text="".join(json.dumps(x,sort_keys=True)+"\n" for x in results);mh=hashlib.sha256(text.encode()).hexdigest();mk=MAN+"sources-"+mh+".jsonl";s3().put_object(Bucket=bucket,Key=mk,Body=text.encode(),Metadata={"sha256":mh,"version":V})
    audit={"version":V,"generated_at":datetime.now(timezone.utc).isoformat(),"status":"PASS","historical_identities":len(target),
      "metadata":{"financial_rows":len(fin),"classification_rows":len(ann),"requests":nf+na},
      "acquisition":{"unique_sources":len(src),"states":dict(states),"verified_kinds":dict(bykind),"manifest_r2_key":mk,"manifest_sha256":mh},
      "identity_source_gaps":len(gap),"bse_transport":bp,"provider_calls":0,"supabase_writes":0,"production_changes":0,"performance_outcome_reads":0,
      "idempotency":{"verified_existing_not_refetched":True,"content_sha256":True,"deterministic_url_hash_keys":True},"exclusion_ceiling_state":"PENDING_OWNER_FREEZE"}
    if states["SOURCE_UNAVAILABLE"]:audit["status"]="BLOCKED_SOURCE_DOWNLOADS"
    elif gap and not bp["json_ready"]:audit["status"]="BLOCKED_BSE_TRANSPORT"
    DOC.parent.mkdir(parents=True,exist_ok=True);DOC.write_text(json.dumps(audit,indent=2,sort_keys=True)+"\n");print(json.dumps(audit,indent=2,sort_keys=True))
    return 0 if audit["status"]=="PASS" else 2
if __name__=="__main__":
    try:sys.exit(main())
    except Exception as e:
        DOC.parent.mkdir(parents=True,exist_ok=True);DOC.write_text(json.dumps({"version":V,"status":"BLOCKED_FAIL_CLOSED","error":type(e).__name__+":"+str(e)},indent=2)+"\n");raise
