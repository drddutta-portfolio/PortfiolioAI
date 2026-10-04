#!/usr/bin/env python3
import boto3,bisect,hashlib,json,os,re,sys,tempfile,time
from collections import Counter,defaultdict
from concurrent.futures import ThreadPoolExecutor,as_completed
from datetime import date,datetime,timedelta,timezone
from pathlib import Path
from urllib.parse import urljoin,urlparse
import duckdb,psycopg,requests
from botocore.config import Config

V="P8_B_RECOVERY_WORKSTREAM_C_ALIAS_BACKFILL_V1"
EXP="P8_EXP_NSE_MONTHLY_6M_V1"; START=date(2021,4,1); END=date(2026,9,30)
LIST="portfolioai-history/development/p8/b2/listing-observations/v1/"
MEM="portfolioai-history/development/p8/b2/universe-members/v1/"
RAW="portfolioai-history/development/p8/recovery/workstream-c/raw-alias/"
MAN="portfolioai-history/development/p8/recovery/workstream-c/manifests/"
OUT=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_C_ALIAS_BACKFILL_AUDIT_2026-10-04.json")
PAGE="https://www.nseindia.com/companies-listing/corporate-filings-financial-results"
API="https://www.nseindia.com/api/corporates-financial-results"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/152 Safari/537.36"

def norm(x): return re.sub(r"[^A-Z0-9]+"," ",str(x or "").strip().upper()).strip()
def acct(raw):
 h=urlparse(raw).hostname if "://" in raw else raw;s=".r2.cloudflarestorage.com";return h[:-len(s)] if h.endswith(s) else h
def s3():
 a=acct(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
 return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],region_name="auto",config=Config(retries={"max_attempts":8,"mode":"adaptive"},s3={"addressing_style":"path"}))
def parse(v):
 if not v:return None
 from zoneinfo import ZoneInfo
 for f in ("%d-%b-%Y %H:%M:%S","%d-%b-%Y %H:%M"):
  try:return datetime.strptime(str(v),f).replace(tzinfo=ZoneInfo("Asia/Kolkata")).astimezone(timezone.utc)
  except:pass
 try:
  d=datetime.fromisoformat(str(v).replace("Z","+00:00"))
  if d.tzinfo is None:d=d.replace(tzinfo=timezone.utc)
  return d.astimezone(timezone.utc)
 except:return None
def parts(c,bucket,prefix):
 out=[];token=None
 while True:
  kw={"Bucket":bucket,"Prefix":prefix}
  if token:kw["ContinuationToken"]=token
  p=c.list_objects_v2(**kw);out += [x["Key"] for x in p.get("Contents",[]) if x["Key"].endswith("/part-00000.parquet")]
  if not p.get("IsTruncated"):break
  token=p["NextContinuationToken"]
 return sorted(out)
def identities():
 db=os.environ["SUPABASE_DB_URL"]
 if "lrgpjimipfkyoqbpsqzz" not in db:raise RuntimeError("wrong DB")
 with psycopg.connect(db,connect_timeout=20) as c,c.cursor() as x:
  x.execute("select id::text,historical_isin from public.p8_historical_security_identities where experiment_id=%s",(EXP,))
  rows=x.fetchall()
 if len(rows)!=4524:raise RuntimeError(f"identity drift {len(rows)}")
 return {str(i):str(s).strip().upper() for i,s in rows}

def load_r2(c,bucket):
 tmp=Path(tempfile.mkdtemp(prefix="p8-c-alias-"))
 lkeys=parts(c,bucket,LIST);mkeys=parts(c,bucket,MEM)
 if len(lkeys)!=32 or len(mkeys)!=32:raise RuntimeError(f"partition drift listing={len(lkeys)} member={len(mkeys)}")
 lf=[];mf=[]
 for i,k in enumerate(lkeys):
  p=tmp/f"l{i}.parquet";c.download_file(bucket,k,str(p));lf.append(str(p))
 for i,k in enumerate(mkeys):
  p=tmp/f"m{i}.parquet";c.download_file(bucket,k,str(p));mf.append(str(p))
 con=duckdb.connect()
 lq=",".join("'"+x.replace("'","''")+"'" for x in lf);mq=",".join("'"+x.replace("'","''")+"'" for x in mf)
 obs=con.execute(f"select historical_identity_id::varchar,source_date::varchar,trading_symbol::varchar,instrument_name::varchar from read_parquet([{lq}]) order by historical_identity_id,source_date").fetchall()
 pairs=con.execute(f"select historical_identity_id::varchar,decision_at::varchar from read_parquet([{mq}]) where membership_state='ELIGIBLE' order by decision_at,historical_identity_id").fetchall();con.close()
 if len(pairs)!=121956:raise RuntimeError(f"eligible drift {len(pairs)}")
 return obs,pairs

def aliases(obs,ids):
 by=defaultdict(lambda:defaultdict(list));dates=sorted({str(r[1])[:10] for r in obs})
 for hid,d,s,n in obs:by[str(hid)][str(d)[:10]].append((str(s),str(n)))
 out=defaultdict(list)
 for hid in ids:
  active={}
  for d in dates:
   cur={(norm(s),norm(n)):(s,n) for s,n in by[hid].get(d,[]) if norm(s) and norm(n)}
   for k,state in list(active.items()):
    if k not in cur:
     out[(k[0],k[1])].append((hid,datetime.fromisoformat(state[0]+"T00:00:00+00:00"),datetime.fromisoformat(d+"T00:00:00+00:00")))
     del active[k]
   for k,v in cur.items():
    if k not in active:active[k]=(d,v)
  for k,state in active.items():out[(k[0],k[1])].append((hid,datetime.fromisoformat(state[0]+"T00:00:00+00:00"),None))
 return out

def nse():
 q=requests.Session();q.headers.update({"User-Agent":UA,"Accept":"application/json,text/plain,*/*","Referer":PAGE})
 if q.get(PAGE,timeout=30).status_code!=200:raise RuntimeError("NSE landing unavailable")
 return q
def fetch_meta():
 q=nse();out=[];req=0
 for period in ("Quarterly","Annual","Half-Yearly","Others"):
  d=START
  while d<=END:
   e=min(END,d+timedelta(days=30));data=None
   for a in range(6):
    r=q.get(API,params={"index":"equities","period":period,"from_date":d.strftime("%d-%m-%Y"),"to_date":e.strftime("%d-%m-%Y")},timeout=90)
    if r.status_code==200:
     try:
      data=r.json()
      if isinstance(data,list):break
     except:pass
    time.sleep(min(15,2**a))
   req+=1
   if not isinstance(data,list):raise RuntimeError(f"NSE financial metadata unavailable {d}..{e}")
   out.extend(x for x in data if isinstance(x,dict))
   d=e+timedelta(days=1);time.sleep(.04)
 # seq dedupe
 u={}
 for x in out:u[str(x.get("seqNumber") or hashlib.sha256(json.dumps(x,sort_keys=True,default=str).encode()).hexdigest())]=x
 return list(u.values()),req

def valid(v):
 if not isinstance(v,str):return None
 z=v.strip()
 if not z or z.lower() in {"-","na","n/a","null","none","#"}:return None
 u=urljoin("https://www.nseindia.com",z);return u if u.startswith("https://") else None

def resolve(rows,ids,al):
 byisin=defaultdict(list)
 for hid,isin in ids.items():byisin[isin].append(hid)
 resolved=[];stats=Counter()
 for r in rows:
  t=parse(r.get("exchdisstime") or r.get("broadCastDate") or r.get("filingDate"))
  if not t:stats["NO_TIME"]+=1;continue
  isin=str(r.get("isin") or "").strip().upper();hits=byisin.get(isin,[])
  hid=None;mode=None
  if len(hits)==1:hid=hits[0];mode="EXACT_ISIN"
  else:
   k=(norm(r.get("symbol")),norm(r.get("companyName")))
   cand=[x[0] for x in al.get(k,[]) if t>=x[1] and (x[2] is None or t<x[2])]
   cand=sorted(set(cand))
   if len(cand)==1:hid=cand[0];mode="DATED_NSE_SYMBOL_NAME"
  if not hid:stats["UNRESOLVED"]+=1;continue
  urls=[]
  for z in (r.get("xbrl"),r.get("resultDetailedDataLink")):
   u=valid(z)
   if u and u not in urls:urls.append(u)
  if not urls:stats["NO_BODY_LINK"]+=1;continue
  resolved.append({"historical_identity_id":hid,"historical_isin":ids[hid],"time":t.isoformat(),"urls":urls,"mode":mode,"symbol":str(r.get("symbol") or ""),"company_name":str(r.get("companyName") or "")})
  stats[mode]+=1
 return resolved,stats

def acquire(x,bucket):
 c=s3()
 # identity + dissemination + primary URL makes stable filing key
 seed=x["historical_identity_id"]+"|"+x["time"]+"|"+x["urls"][0]
 kh=hashlib.sha256(seed.encode()).hexdigest();pref=RAW+kh[:2]+"/"+kh
 old=c.list_objects_v2(Bucket=bucket,Prefix=pref,MaxKeys=1).get("Contents",[])
 if old:
  k=old[0]["Key"];h=c.head_object(Bucket=bucket,Key=k);sh=h.get("Metadata",{}).get("sha256")
  if sh:return {**x,"state":"VERIFIED_EXISTING","r2_key":k,"sha256":sh,"bytes":h.get("ContentLength",0)}
 q=requests.Session();q.headers.update({"User-Agent":UA,"Referer":"https://www.nseindia.com/","Accept":"*/*"})
 attempts=[]
 for u in x["urls"]:
  for a in range(4):
   try:r=q.get(u,timeout=120)
   except Exception as e:attempts.append({"url":u,"error":type(e).__name__});time.sleep(min(8,2**a));continue
   attempts.append({"url":u,"http":r.status_code})
   if r.status_code==200 and r.content:
    sh=hashlib.sha256(r.content).hexdigest();p=urlparse(u).path.lower();ct=r.headers.get("content-type","").lower()
    ext=".xml" if p.endswith(".xml") or "xml" in ct else ".pdf" if p.endswith(".pdf") or "pdf" in ct else ".bin"
    k=pref+ext;c.put_object(Bucket=bucket,Key=k,Body=r.content,Metadata={"sha256":sh,"identity-mode":x["mode"].lower(),"source-url-sha256":hashlib.sha256(u.encode()).hexdigest()})
    return {**x,"selected_url":u,"state":"WRITTEN","r2_key":k,"sha256":sh,"bytes":len(r.content)}
   time.sleep(min(8,2**a))
 return {**x,"state":"SOURCE_UNAVAILABLE","attempts":attempts}

def main():
 bucket=os.environ["CLOUDFLARE_R2_BUCKET"]
 if bucket!="portfolioai-history-dev":raise RuntimeError("wrong bucket")
 c=s3();ids=identities();obs,pairs=load_r2(c,bucket);al=aliases(obs,ids)
 meta,requests_n=fetch_meta();resolved,rstats=resolve(meta,ids,al)
 # dedupe same filing identity/time/URL
 ded={}
 for x in resolved:ded[x["historical_identity_id"]+"|"+x["time"]+"|"+x["urls"][0]]=x
 resolved=list(ded.values())
 results=[]
 with ThreadPoolExecutor(max_workers=24) as ex:
  fs=[ex.submit(acquire,x,bucket) for x in resolved]
  for i,f in enumerate(as_completed(fs),1):
   results.append(f.result())
   if i%1000==0:print(f"alias acquire {i}/{len(fs)}",file=sys.stderr)
 byid=defaultdict(list)
 for x in results:
  if x["state"]!="SOURCE_UNAVAILABLE":byid[x["historical_identity_id"]].append(parse(x["time"]))
 for v in byid.values():v.sort()
 covered=0;gaps=[];bydate=defaultdict(Counter)
 for hid,dv in pairs:
  d=parse(dv);arr=byid.get(hid,[]);ok=bisect.bisect_left(arr,d)>0
  day=d.date().isoformat()
  if ok:covered+=1;bydate[day]["covered"]+=1
  else:gaps.append((hid,ids[hid],d.isoformat()));bydate[day]["gap"]+=1
 state=Counter(x["state"] for x in results);modes=Counter(x["mode"] for x in results if x["state"]!="SOURCE_UNAVAILABLE")
 text="".join(json.dumps(x,sort_keys=True)+"\n" for x in results);mh=hashlib.sha256(text.encode()).hexdigest();mk=MAN+"alias-backfill-"+mh+".jsonl"
 c.put_object(Bucket=bucket,Key=mk,Body=text.encode(),Metadata={"sha256":mh,"version":V})
 audit={"version":V,"generated_at":datetime.now(timezone.utc).isoformat(),"status":"PASS" if not gaps and not state["SOURCE_UNAVAILABLE"] else "PARTIAL",
  "metadata_rows":len(meta),"metadata_requests":requests_n,"resolver":dict(rstats),"resolved_unique_filings":len(resolved),
  "acquisition_states":dict(state),"verified_identity_modes":dict(modes),"manifest_r2_key":mk,"manifest_sha256":mh,
  "eligible_pairs":len(pairs),"covered_pairs":covered,"gap_pairs":len(gaps),"coverage_ratio":covered/len(pairs),
  "gap_unique_historical_identities":len({x[0] for x in gaps}),"gap_sample":[{"historical_identity_id":a,"historical_isin":b,"decision_at":d} for a,b,d in gaps[:100]],
  "decision_date_coverage":{k:dict(v) for k,v in sorted(bydate.items())},
  "provider_calls":0,"supabase_writes":0,"production_changes":0,"performance_outcome_reads":0}
 OUT.write_text(json.dumps(audit,indent=2,sort_keys=True)+"\n");print(json.dumps(audit,indent=2,sort_keys=True))
if __name__=="__main__":main()
