#!/usr/bin/env python3
import boto3,duckdb,hashlib,json,os,re,tempfile,bisect
from collections import Counter,defaultdict
from concurrent.futures import ThreadPoolExecutor,as_completed
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlparse
from botocore.config import Config
from lxml import etree

V="P8_B_RECOVERY_WORKSTREAM_D_V2"; BUCKET="portfolioai-history-dev"
C_MAN="portfolioai-history/development/p8/recovery/workstream-c/manifests/alias-backfill-"
MEM="portfolioai-history/development/p8/b2/universe-members/v1/"
OUT="portfolioai-history/development/p8/recovery/workstream-d/v2/"
AUDIT=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_D_AUDIT_2026-10-04.json")

def acct(x):
 h=urlparse(x).hostname if "://" in x else x;s=".r2.cloudflarestorage.com"
 return h[:-len(s)] if h.endswith(s) else h
def s3():
 a=acct(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
 return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",
  aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
  region_name="auto",config=Config(max_pool_connections=64,retries={"max_attempts":8,"mode":"adaptive"},s3={"addressing_style":"path"}))
def listkeys(c,prefix,suffix=None):
 out=[];tok=None
 while True:
  kw={"Bucket":BUCKET,"Prefix":prefix,"MaxKeys":1000}
  if tok:kw["ContinuationToken"]=tok
  pg=c.list_objects_v2(**kw)
  out.extend((x["Key"],x.get("LastModified")) for x in pg.get("Contents",[]) if suffix is None or x["Key"].endswith(suffix))
  if not pg.get("IsTruncated"):return out
  tok=pg["NextContinuationToken"]
def dt(x):
 try:
  d=datetime.fromisoformat(str(x).replace("Z","+00:00"));return (d if d.tzinfo else d.replace(tzinfo=timezone.utc)).astimezone(timezone.utc)
 except:return None
def local(t):return t.rsplit("}",1)[-1]
def parse_xml(raw):
 root=etree.fromstring(raw,etree.XMLParser(resolve_entities=False,huge_tree=True))
 ctx={}
 for e in root.iter():
  if local(e.tag)!="context" or not e.get("id"):continue
  ctx[e.get("id")]=[(z.text or "").strip() for z in e.iter() if local(z.tag) in ("explicitMember","typedMember") and (z.text or "").strip()]
 facts=[];seg=defaultdict(float)
 for e in root.iter():
  cref=e.get("contextRef");txt=(e.text or "").strip()
  if not cref or not txt:continue
  name=local(e.tag);clean=txt.replace(",","");num=None
  if re.fullmatch(r"[-+]?\d+(?:\.\d+)?",clean):
   try:num=float(clean)
   except:num=None
  members=ctx.get(cref,[])
  if num is not None or members:facts.append({"name":name,"context_ref":cref,"value":clean if num is not None else txt[:300],"numeric":num is not None,"unit_ref":e.get("unitRef"),"members":members[:8]})
  n=name.lower()
  if num is not None and members and ("revenue" in n or "turnover" in n or "income" in n):
   for m in members:seg[m]+=abs(num)
 if not seg:return facts,None,"NO_SEGMENT_REVENUE"
 vals=sorted(seg.items(),key=lambda x:x[1],reverse=True);total=sum(v for _,v in vals)
 if len(vals)==1:return facts,vals[0][0],"SINGLE_SEGMENT"
 if total and vals[0][1]/total>0.5:return facts,vals[0][0],"DOMINANT_SEGMENT_GT_50"
 return facts,"DIVERSIFIED","MULTI_SEGMENT_NO_GT_50"
def manifest(c):
 a=listkeys(c,C_MAN)
 if not a:raise RuntimeError("alias manifest missing")
 a.sort(key=lambda x:x[1] or datetime.min.replace(tzinfo=timezone.utc),reverse=True)
 k=a[0][0];b=c.get_object(Bucket=BUCKET,Key=k)["Body"].read()
 return k,hashlib.sha256(b).hexdigest(),[json.loads(x) for x in b.decode().splitlines() if x.strip()]
def eligible_pairs(c):
 a=sorted(k for k,_ in listkeys(c,MEM,"part-00000.parquet"))
 if len(a)!=32:raise RuntimeError(f"member partitions={len(a)}")
 td=Path(tempfile.mkdtemp());fs=[]
 for i,k in enumerate(a):
  p=td/f"{i}.parquet";c.download_file(BUCKET,k,str(p));fs.append(str(p))
 q=",".join("'"+x.replace("'","''")+"'" for x in fs);con=duckdb.connect()
 rows=con.execute(f"select historical_identity_id::varchar,decision_at::varchar from read_parquet([{q}]) where membership_state='ELIGIBLE' order by decision_at,historical_identity_id").fetchall();con.close()
 if len(rows)!=121956:raise RuntimeError(f"eligible pairs={len(rows)}")
 return [(str(a),dt(b)) for a,b in rows]
def process(c,x):
 try:raw=c.get_object(Bucket=BUCKET,Key=x["r2_key"])["Body"].read()
 except Exception:return {"state":"R2_READ_ERROR","filing":None,"facts":[],"event":None}
 sha=hashlib.sha256(raw).hexdigest()
 if sha!=x["sha256"]:return {"state":"HASH_MISMATCH","filing":None,"facts":[],"event":None}
 pub=dt(x.get("time"));hid=x.get("historical_identity_id");ext=Path(x["r2_key"]).suffix.lower()
 base={"historical_identity_id":hid,"historical_isin":x.get("historical_isin"),"published_at":pub.isoformat() if pub else None,
       "source_hash":sha,"r2_key":x["r2_key"],"identity_mode":x.get("mode"),"body_type":ext.lstrip(".").upper()}
 if ext!=".xml":return {"state":"INDEXED_UNPARSED","filing":{**base,"parse_state":"INDEXED_UNPARSED","fact_count":0},"facts":[],"event":None}
 try:
  ff,label,rule=parse_xml(raw)
  facts=[{**base,**f} for f in ff]
  filing={**base,"parse_state":"PARSED","fact_count":len(ff),"classification_rule":rule,"classification_label":label}
  ev=(pub,label,rule,sha) if pub and hid and label else None
  return {"state":"XML_PARSED","filing":filing,"facts":facts,"event":ev}
 except Exception:return {"state":"XML_PARSE_ERROR","filing":{**base,"parse_state":"PARSE_ERROR","fact_count":0},"facts":[],"event":None}
def put(c,name,rows):
 body="".join(json.dumps(x,sort_keys=True)+"\n" for x in rows).encode();sha=hashlib.sha256(body).hexdigest();k=OUT+name+"-"+sha+".jsonl"
 c.put_object(Bucket=BUCKET,Key=k,Body=body,Metadata={"sha256":sha,"version":V});return {"r2_key":k,"sha256":sha,"rows":len(rows)}
def main():
 if os.environ["CLOUDFLARE_R2_BUCKET"]!=BUCKET:raise RuntimeError("wrong bucket")
 c=s3();mk,msha,src=manifest(c);pairs=eligible_pairs(c)
 usable=[x for x in src if x.get("state")!="SOURCE_UNAVAILABLE" and x.get("r2_key") and x.get("sha256")]
 filings=[];facts=[];events=defaultdict(list);states=Counter()
 with ThreadPoolExecutor(max_workers=32) as ex:
  fs={ex.submit(process,c,x):x for x in usable}
  for i,f in enumerate(as_completed(fs),1):
   r=f.result();states[r["state"]]+=1
   if r["filing"]:filings.append(r["filing"])
   facts.extend(r["facts"])
   if r["event"]:events[r["filing"]["historical_identity_id"]].append(r["event"])
   if i%2000==0:print(f"processed {i}/{len(usable)}")
 hash_bad=states["HASH_MISMATCH"]
 classes=[];filing_times=defaultdict(list)
 for f in filings:
  if f["historical_identity_id"] and f["published_at"]:filing_times[f["historical_identity_id"]].append(dt(f["published_at"]))
 for a in filing_times.values():a.sort()
 event_times={}
 for hid,a in events.items():
  a.sort(key=lambda z:z[0]);event_times[hid]=[z[0] for z in a]
  for j,(start,label,rule,sha) in enumerate(a):
   classes.append({"historical_identity_id":hid,"valid_from":start.isoformat(),"valid_to":a[j+1][0].isoformat() if j+1<len(a) else None,
    "classification_label":label,"classifier_rule":rule,"source_hash":sha,"classification_version":"P8_HISTORICAL_CLASSIFICATION_V1"})
 disp=[];counts=Counter();bydate=defaultdict(Counter)
 for hid,d in pairs:
  a=events.get(hid,[]);times=event_times.get(hid,[]);idx=bisect.bisect_left(times,d) if d else 0
  if idx>0:state="RESOLVED_CLASSIFICATION";label=a[idx-1][1]
  elif d and bisect.bisect_left(filing_times.get(hid,[]),d)>0:state="EVIDENCE_PRESENT_CLASSIFICATION_UNRESOLVED";label=None
  else:state="NO_PRE_DECISION_EVIDENCE";label=None
  counts[state]+=1;bydate[d.date().isoformat()][state]+=1;disp.append({"historical_identity_id":hid,"decision_at":d.isoformat(),"state":state,"classification_label":label})
 artifacts={"filings":put(c,"filing-index",filings),"facts":put(c,"xbrl-observations",facts),"classification_intervals":put(c,"classification-intervals",classes),"pair_dispositions":put(c,"pair-dispositions",disp)}
 audit={"version":V,"generated_at":datetime.now(timezone.utc).isoformat(),"status":"PASS_COMPLETE" if hash_bad==0 and len(disp)==121956 else "BLOCKED",
  "source_manifest":{"r2_key":mk,"sha256":msha,"rows":len(src)},"usable_source_bodies":len(usable),"parse_states":dict(states),"hash_mismatches":hash_bad,
  "artifacts":artifacts,"eligible_pairs":len(disp),"pair_states":dict(counts),"decision_date_matrix":{k:dict(v) for k,v in sorted(bydate.items())},
  "revision_lineage":"append-only source hash + publication timestamp + interval supersession","provider_calls":0,"supabase_writes":0,"production_changes":0,"performance_outcome_reads":0,
  "notes":["No current classification backdated.","Frozen P8_HISTORICAL_CLASSIFICATION_V1 applied only to pre-decision filing evidence.","D completion is structural materialization, not a coverage PASS for the stopped V1 experiment."]}
 AUDIT.write_text(json.dumps(audit,indent=2,sort_keys=True)+"\n");print(json.dumps(audit,indent=2,sort_keys=True))
 if audit["status"]!="PASS_COMPLETE":raise SystemExit(2)
if __name__=="__main__":main()
