#!/usr/bin/env python3
import boto3,hashlib,json,os,io
from collections import Counter,defaultdict
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlparse
import pyarrow.parquet as pq
from botocore.config import Config

V="P8_B_RECOVERY_WORKSTREAM_E_V1"
BUCKET="portfolioai-history-dev"
ROOT="portfolioai-history/development/p8"
LEDGER=f"{ROOT}/b3/adjusted-decision-ledger/v2"
OUT=f"{ROOT}/recovery/workstream-e/v1"
D_AUDIT=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_D_AUDIT_2026-10-04.json")
E_AUDIT=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_E_AUDIT_2026-10-04.json")
BFINAL=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_B_FINAL_RERUN_2026-10-04.json")

def acct(x):
 h=urlparse(x).hostname if "://" in x else x;s=".r2.cloudflarestorage.com"
 return h[:-len(s)] if h.endswith(s) else h
def s3():
 a=acct(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
 return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",
  aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
  aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
  region_name="auto",config=Config(max_pool_connections=32,retries={"max_attempts":8,"mode":"adaptive"},s3={"addressing_style":"path"}))
def read(c,key): return c.get_object(Bucket=BUCKET,Key=key)["Body"].read()
def sha(b): return hashlib.sha256(b).hexdigest()
def canon(x): return json.dumps(x,sort_keys=True,separators=(",",":"))
def put_immutable(c,key,body):
 digest=sha(body)
 try:
  old=read(c,key)
  if sha(old)!=digest: raise RuntimeError("immutable object mismatch "+key)
  return "UNCHANGED",digest
 except Exception as e:
  code=getattr(e,"response",{}).get("Error",{}).get("Code")
  if code not in (None,"NoSuchKey","404") and "immutable object mismatch" not in str(e): raise
  if "immutable object mismatch" in str(e): raise
 c.put_object(Bucket=BUCKET,Key=key,Body=body,Metadata={"sha256":digest,"version":V})
 if sha(read(c,key))!=digest: raise RuntimeError("R2 readback mismatch "+key)
 return "CREATED",digest
def list_ledger(c):
 out=[];tok=None
 while True:
  kw={"Bucket":BUCKET,"Prefix":LEDGER+"/","MaxKeys":1000}
  if tok:kw["ContinuationToken"]=tok
  p=c.list_objects_v2(**kw)
  out += [x["Key"] for x in p.get("Contents",[]) if x["Key"].endswith("/part-00000.parquet")]
  if not p.get("IsTruncated"):break
  tok=p["NextContinuationToken"]
 out=sorted(out)
 if len(out)!=32:raise RuntimeError(f"expected 32 B3 ledger partitions got {len(out)}")
 return out

def main():
 if os.environ["CLOUDFLARE_R2_BUCKET"]!=BUCKET:raise RuntimeError("wrong bucket")
 c=s3();d=json.loads(D_AUDIT.read_text())
 dp=d["artifacts"]["pair_dispositions"];raw=read(c,dp["r2_key"])
 if sha(raw)!=dp["sha256"]:raise RuntimeError("D disposition hash mismatch")
 drows=[json.loads(x) for x in raw.decode().splitlines() if x.strip()]
 if len(drows)!=121956:raise RuntimeError(f"D pair count {len(drows)}")
 dmap={(r["historical_identity_id"],r["decision_at"][:10]):r for r in drows}
 if len(dmap)!=121956:raise RuntimeError("duplicate D logical keys")

 market={};mcounts=Counter()
 for k in list_ledger(c):
  t=pq.read_table(io.BytesIO(read(c,k)),columns=["decision_date","historical_identity_id","state","blocker_reason"])
  for r in t.to_pylist():
   key=(str(r["historical_identity_id"]),str(r["decision_date"])[:10])
   market[key]={"state":str(r["state"]),"blocker_reason":r.get("blocker_reason")}
   mcounts[str(r["state"])]+=1
 if len(market)!=121956:raise RuntimeError(f"B3 ledger keys {len(market)}")

 b5=[];b6=[];b5c=Counter();b6c=Counter();bydate=defaultdict(Counter)
 for key in sorted(dmap,key=lambda z:(z[1],z[0])):
  dr=dmap[key];mr=market.get(key)
  if mr is None:raise RuntimeError("missing B3 pair")
  ds=dr["state"]
  if ds=="NO_PRE_DECISION_EVIDENCE":
   blocker="NO_PRE_DECISION_EVIDENCE";classification="BLOCKED";methodology="BLOCKED"
  elif ds=="EVIDENCE_PRESENT_CLASSIFICATION_UNRESOLVED":
   blocker="HISTORICAL_CLASSIFICATION_UNRESOLVED";classification="BLOCKED";methodology="BLOCKED"
  elif ds=="RESOLVED_CLASSIFICATION":
   # D structural classifier is not the full frozen four-tier taxonomy contract.
   blocker="HISTORICAL_CLASSIFICATION_CONTRACT_UNPROVEN";classification="PROVISIONAL_D_SIGNAL_ONLY";methodology="BLOCKED"
  else:
   blocker="UNKNOWN_D_STATE";classification="BLOCKED";methodology="BLOCKED"
  logical={"historical_identity_id":key[0],"decision_date":key[1],"classification_state":classification,
   "methodology_state":methodology,"route_version":"P8_R6_R10_REPLAY_V1","primary_blocker":blocker}
  fp=sha(canon(logical).encode());b5.append({**logical,"fingerprint":fp});b5c[blocker]+=1
  # B5 blocker has precedence; B3 state is still bound and reported.
  b6state="EXCLUDED"
  b6block="B5_"+blocker
  snap={"historical_identity_id":key[0],"decision_date":key[1],"state":b6state,"blocker":b6block,
        "b5_fingerprint":fp,"b3_market_state":mr["state"],"b3_market_blocker":mr["blocker_reason"],
        "methodology_version":"P8_R6_R10_REPLAY_V1","classification_version":"P8_HISTORICAL_CLASSIFICATION_V1"}
  sfp=sha(canon(snap).encode());b6.append({**snap,"snapshot_fingerprint":sfp});b6c[b6block]+=1;bydate[key[1]][b6state]+=1

 def body(rows):return "".join(json.dumps(x,sort_keys=True)+"\n" for x in rows).encode()
 b5body=body(b5);b6body=body(b6)
 # second serialization proves deterministic byte identity in-run
 if b5body!=body(b5) or b6body!=body(b6):raise RuntimeError("nondeterministic serialization")
 b5sha=sha(b5body);b6sha=sha(b6body)
 b5key=f"{OUT}/b5-corrected-{b5sha}.jsonl";b6key=f"{OUT}/b6-corrected-{b6sha}.jsonl"
 st5,_=put_immutable(c,b5key,b5body);st6,_=put_immutable(c,b6key,b6body)

 resolved=sum(1 for x in b5 if x["primary_blocker"] is None)
 replay=sum(1 for x in b6 if x["state"]=="REPLAY_READY")
 overall=replay/121956
 audit={"version":V,"generated_at":datetime.now(timezone.utc).isoformat(),"status":"COMPLETE_BLOCKED",
  "experiment_id":"P8_EXP_NSE_MONTHLY_6M_V1","eligible_pairs":121956,
  "b3":{"ready":mcounts["READY"],"blocked":mcounts["BLOCKED"]},
  "b5":{"rows":len(b5),"resolved_paths":resolved,"blocked_paths":len(b5)-resolved,"blockers":dict(b5c),
        "r2_key":b5key,"sha256":b5sha,"r2_write_state":st5,"deterministic_replay":True},
  "b6":{"rows":len(b6),"replay_ready":replay,"excluded":len(b6)-replay,"blockers":dict(b6c),
        "r2_key":b6key,"sha256":b6sha,"r2_write_state":st6,"deterministic_replay":True},
  "future_evidence_used":False,"current_state_fallback_used":False,"cross_security_imputation_used":False,
  "provider_calls":0,"supabase_writes":0,"production_changes":0,"performance_outcome_reads":0}
 E_AUDIT.write_text(json.dumps(audit,indent=2,sort_keys=True)+"\n")

 bf={"version":"P8_B_RECOVERY_B_FINAL_RERUN_V1","generated_at":datetime.now(timezone.utc).isoformat(),
  "experiment_id":"P8_EXP_NSE_MONTHLY_6M_V1","status":"BLOCKED","closure":"COMPLETE_BLOCKED_CLOSED",
  "pass_condition_matrix":{
   "minimum_decision_dates":{"result":"PASS","proven_dates":32,"minimum_required":24},
   "b2_eligible_denominator":{"result":"PASS","pairs":121956},
   "b3_market_foundation":{"result":"PASS_STRUCTURAL_WITH_BLOCKERS","ready":mcounts["READY"],"blocked":mcounts["BLOCKED"]},
   "corrected_b5":{"result":"FAIL","resolved_paths":resolved,"blocked_paths":len(b5)-resolved,"reason":"No pair has a fully proven frozen four-tier historical classification to deterministic methodology route."},
   "corrected_b6":{"result":"FAIL","replay_ready":replay,"excluded":len(b6)-replay,"coverage":overall},
   "owner_approved_exclusion_ceiling":{"result":"FAIL","state":"PENDING_OWNER_FREEZE"},
   "holdout_untouched":{"result":"PASS","performance_outcome_reads":0}},
  "coverage":{"replay_ready_pairs":replay,"eligible_pairs":121956,"replay_ready_ratio":overall,
              "recommended_overall_floor":0.80,"recommended_per_date_floor":0.70},
  "final_decision":{"workstream_e":"COMPLETE / BLOCKED / CLOSED","p8_b_final":"COMPLETE / BLOCKED / CLOSED",
                    "p8_b":"BLOCKED — V1 DATA FOUNDATION INSUFFICIENT","p8_c":"NOT AUTHORIZED",
                    "next_legitimate_step":"VERSION_NARROWER_EXPERIMENT_REQUIRED"},
  "boundaries":{"main_changed":False,"production_changed":False,"provider_calls":0,"p8_c_started":False,
                "holdout_or_performance_inspected":False}}
 BFINAL.write_text(json.dumps(bf,indent=2,sort_keys=True)+"\n")
 print(json.dumps({"workstream_e":audit,"b_final":bf},indent=2,sort_keys=True))

if __name__=="__main__":main()
