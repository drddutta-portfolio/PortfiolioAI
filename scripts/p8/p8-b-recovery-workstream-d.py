#!/usr/bin/env python3
import boto3,duckdb,hashlib,json,os,re,tempfile
from collections import Counter,defaultdict
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlparse
from botocore.config import Config
from lxml import etree

V="P8_B_RECOVERY_WORKSTREAM_D_V1"
BUCKET="portfolioai-history-dev"
C_MAN="portfolioai-history/development/p8/recovery/workstream-c/manifests/alias-backfill-"
MEM="portfolioai-history/development/p8/b2/universe-members/v1/"
OUT="portfolioai-history/development/p8/recovery/workstream-d/v1/"
AUDIT=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_D_AUDIT_2026-10-04.json")

def account(x):
 h=urlparse(x).hostname if "://" in x else x
 s=".r2.cloudflarestorage.com";return h[:-len(s)] if h.endswith(s) else h
def s3():
 a=account(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
 return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",
   aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
   aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
   region_name="auto",config=Config(retries={"max_attempts":8,"mode":"adaptive"},s3={"addressing_style":"path"}))
def keys(c,prefix,suffix=None):
 out=[];tok=None
 while True:
  kw={"Bucket":BUCKET,"Prefix":prefix,"MaxKeys":1000}
  if tok:kw["ContinuationToken"]=tok
  pg=c.list_objects_v2(**kw)
  for x in pg.get("Contents",[]):
   if suffix is None or x["Key"].endswith(suffix):out.append((x["Key"],x.get("LastModified")))
  if not pg.get("IsTruncated"):return out
  tok=pg["NextContinuationToken"]
def dt(x):
 try:
  d=datetime.fromisoformat(str(x).replace("Z","+00:00"))
  return (d if d.tzinfo else d.replace(tzinfo=timezone.utc)).astimezone(timezone.utc)
 except:return None
def local(tag):return tag.rsplit("}",1)[-1]
def segment_classification(raw):
 root=etree.fromstring(raw,etree.XMLParser(resolve_entities=False,huge_tree=True))
 ctx={}
 for e in root.iter():
  if local(e.tag)!="context" or not e.get("id"):continue
  members=[]
  for z in e.iter():
   if local(z.tag) in ("explicitMember","typedMember") and (z.text or "").strip():
    members.append((z.text or "").strip())
  ctx[e.get("id")]=members
 facts=[];segvals=defaultdict(float)
 for e in root.iter():
  cref=e.get("contextRef");text=(e.text or "").strip()
  if not cref or not text:continue
  name=local(e.tag);clean=text.replace(",","")
  num=None
  if re.fullmatch(r"[-+]?\d+(?:\.\d+)?",clean):
   try:num=float(clean)
   except:num=None
  members=ctx.get(cref,[])
  facts.append({"name":name,"context_ref":cref,"value":clean if num is not None else text[:300],
    "numeric":num is not None,"unit_ref":e.get("unitRef"),"members":members[:8]})
  n=name.lower()
  if num is not None and members and ("revenue" in n or "turnover" in n or "income" in n):
   for m in members:segvals[m]+=abs(num)
 if not segvals:return facts,None,"NO_SEGMENT_REVENUE"
 vals=sorted(segvals.items(),key=lambda x:x[1],reverse=True);total=sum(v for _,v in vals)
 if len(vals)==1:return facts,vals[0][0],"SINGLE_SEGMENT"
 if total>0 and vals[0][1]/total>0.5:return facts,vals[0][0],"DOMINANT_SEGMENT_GT_50"
 return facts,"DIVERSIFIED","MULTI_SEGMENT_NO_GT_50"
def latest_manifest(c):
 a=keys(c,C_MAN)
 if not a:raise RuntimeError("alias manifest missing")
 a.sort(key=lambda x:x[1] or datetime.min.replace(tzinfo=timezone.utc),reverse=True)
 k=a[0][0];b=c.get_object(Bucket=BUCKET,Key=k)["Body"].read()
 return k,hashlib.sha256(b).hexdigest(),[json.loads(x) for x in b.decode().splitlines() if x.strip()]
def pairs(c):
 a=sorted(k for k,_ in keys(c,MEM,"part-00000.parquet"))
 if len(a)!=32:raise RuntimeError(f"member partitions={len(a)}")
 td=Path(tempfile.mkdtemp());fs=[]
 for i,k in enumerate(a):
  p=td/f"{i}.parquet";c.download_file(BUCKET,k,str(p));fs.append(str(p))
 q=",".join("'"+x.replace("'","''")+"'" for x in fs);con=duckdb.connect()
 rows=con.execute(f"select historical_identity_id::varchar,decision_at::varchar from read_parquet([{q}]) where membership_state='ELIGIBLE' order by decision_at,historical_identity_id").fetchall();con.close()
 if len(rows)!=121956:raise RuntimeError(f"eligible pairs={len(rows)}")
 return [(str(a),dt(b)) for a,b in rows]
def put(c,name,rows):
 body="".join(json.dumps(x,sort_keys=True)+"\n" for x in rows).encode();sha=hashlib.sha256(body).hexdigest()
 k=OUT+name+"-"+sha+".jsonl";c.put_object(Bucket=BUCKET,Key=k,Body=body,Metadata={"sha256":sha,"version":V})
 return {"r2_key":k,"sha256":sha,"rows":len(rows)}
def main():
 if os.environ["CLOUDFLARE_R2_BUCKET"]!=BUCKET:raise RuntimeError("wrong bucket")
 c=s3();mk,msha,src=latest_manifest(c);eligible=pairs(c)
 usable=[x for x in src if x.get("state")!="SOURCE_UNAVAILABLE" and x.get("r2_key") and x.get("sha256")]
 filings=[];facts=[];classes=[];events=defaultdict(list);states=Counter();hash_bad=0
 for i,x in enumerate(usable,1):
  try:raw=c.get_object(Bucket=BUCKET,Key=x["r2_key"])["Body"].read()
  except:states["R2_READ_ERROR"]+=1;continue
  sha=hashlib.sha256(raw).hexdigest()
  if sha!=x["sha256"]:hash_bad+=1;states["HASH_MISMATCH"]+=1;continue
  pub=dt(x.get("time"));hid=x.get("historical_identity_id");ext=Path(x["r2_key"]).suffix.lower()
  rec={"historical_identity_id":hid,"historical_isin":x.get("historical_isin"),"published_at":pub.isoformat() if pub else None,
    "source_hash":sha,"r2_key":x["r2_key"],"identity_mode":x.get("mode"),"body_type":ext.lstrip(".").upper()}
  if ext==".xml":
   try:
    ff,label,rule=segment_classification(raw);states["XML_PARSED"]+=1
    filings.append({**rec,"parse_state":"PARSED","fact_count":len(ff),"classification_rule":rule,"classification_label":label})
    for f in ff:
     if f["numeric"] or f["members"]:facts.append({**rec,**f})
    if pub and hid and label:
     events[hid].append((pub,label,rule,sha))
   except Exception:
    states["XML_PARSE_ERROR"]+=1;filings.append({**rec,"parse_state":"PARSE_ERROR","fact_count":0})
  else:
   states["INDEXED_UNPARSED"]+=1;filings.append({**rec,"parse_state":"INDEXED_UNPARSED","fact_count":0})
  if i%1000==0:print(f"{i}/{len(usable)}")
 for hid,arr in events.items():
  arr.sort(key=lambda z:z[0])
  for j,(start,label,rule,sha) in enumerate(arr):
   end=arr[j+1][0] if j+1<len(arr) else None
   classes.append({"historical_identity_id":hid,"valid_from":start.isoformat(),"valid_to":end.isoformat() if end else None,
    "classification_label":label,"classifier_rule":rule,"source_hash":sha,"classification_version":"P8_HISTORICAL_CLASSIFICATION_V1"})
 disp=[];bydate=defaultdict(Counter);counts=Counter()
 for hid,d in eligible:
  prior=[z for z in events.get(hid,[]) if d and z[0]<d]
  if prior:state="RESOLVED_CLASSIFICATION";label=prior[-1][1]
  elif any(f["historical_identity_id"]==hid and f["published_at"] and dt(f["published_at"])<d for f in filings):state="EVIDENCE_PRESENT_CLASSIFICATION_UNRESOLVED";label=None
  else:state="NO_PRE_DECISION_EVIDENCE";label=None
  counts[state]+=1;day=d.date().isoformat();bydate[day][state]+=1
  disp.append({"historical_identity_id":hid,"decision_at":d.isoformat(),"state":state,"classification_label":label})
 artifacts={"filings":put(c,"filing-index",filings),"facts":put(c,"xbrl-observations",facts),
            "classification_intervals":put(c,"classification-intervals",classes),"pair_dispositions":put(c,"pair-dispositions",disp)}
 audit={"version":V,"generated_at":datetime.now(timezone.utc).isoformat(),
  "status":"PASS_COMPLETE" if hash_bad==0 and len(disp)==121956 else "BLOCKED",
  "source_manifest":{"r2_key":mk,"sha256":msha,"rows":len(src)},"usable_source_bodies":len(usable),
  "parse_states":dict(states),"hash_mismatches":hash_bad,"artifacts":artifacts,
  "eligible_pairs":len(disp),"pair_states":dict(counts),"decision_date_matrix":{k:dict(v) for k,v in sorted(bydate.items())},
  "revision_lineage":"append-only source hash + publication timestamp + interval supersession",
  "provider_calls":0,"supabase_writes":0,"production_changes":0,"performance_outcome_reads":0,
  "notes":["Unresolved classifications remain explicit blockers; no current classification is backdated.",
           "Frozen P8_HISTORICAL_CLASSIFICATION_V1 is applied only to pre-decision filing evidence.",
           "Workstream D completion is structural evidence materialization, not a coverage PASS for the stopped V1 experiment."]}
 AUDIT.parent.mkdir(parents=True,exist_ok=True);AUDIT.write_text(json.dumps(audit,indent=2,sort_keys=True)+"\n");print(json.dumps(audit,indent=2,sort_keys=True))
 if audit["status"]!="PASS_COMPLETE":raise SystemExit(2)
if __name__=="__main__":main()
