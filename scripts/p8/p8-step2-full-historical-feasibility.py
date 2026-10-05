#!/usr/bin/env python3
import argparse,bisect,gzip,hashlib,importlib.util,io,json,os,re,subprocess,sys
from collections import Counter,defaultdict
from concurrent.futures import ThreadPoolExecutor,as_completed
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlparse

import boto3
import psycopg
import pyarrow.parquet as pq
from botocore.config import Config

BUCKET="portfolioai-history-dev"
PROJECT_REF="lrgpjimipfkyoqbpsqzz"
ROOT="portfolioai-history/development/p8"
B2_PREFIX=f"{ROOT}/b2/universe-members/v1/"
B3_PREFIX=f"{ROOT}/b3/adjusted-decision-ledger/v2/"
SOURCE_MANIFEST="portfolioai-history/development/p8/recovery/workstream-c/manifests/alias-backfill-8758fa8c8340ec0006f4a74fab76b783806bf009ba668148f0d771015d46ed79.jsonl"
SOURCE_MANIFEST_SHA="8758fa8c8340ec0006f4a74fab76b783806bf009ba668148f0d771015d46ed79"
D_PAIR_KEY="portfolioai-history/development/p8/recovery/workstream-d/v2/pair-dispositions-b3f734704585e3fe9b833f84fc711af8505bc6c4ff1c38d447c5ca792c720e39.jsonl"
D_PAIR_SHA="b3f734704585e3fe9b833f84fc711af8505bc6c4ff1c38d447c5ca792c720e39"
EXPECTED_PAIRS=121956
EXPECTED_IDENTITIES=4524
EXPECTED_DATES=32
EXPECTED_CANARY_FP="b159764fd342aad3901717e04446596e93aa87d9c6726b7b3dd7ef8b55026dce"
EXPECTED_CONTRACT_BLOB="de02b6984fc715c81433a42a523e0a00f022b73d"
CONTRACT=Path("docs/p8/PortfolioAI_P8_STEP2_HISTORICAL_FEASIBILITY_CONTRACT_V1.json")
TAX=Path("docs/p8/PortfolioAI_P8_NSE_FOUR_TIER_TAXONOMY_NOVEMBER_2022.json")
OUT=Path("docs/p8/PortfolioAI_P8_STEP2_FULL_HISTORICAL_FEASIBILITY_AUDIT_2026-10-05.json")
PAIR_OUT=Path("docs/p8/PortfolioAI_P8_STEP2_PAIR_DISPOSITIONS_2026-10-05.jsonl.gz")
PROPOSAL=Path("docs/p8/PortfolioAI_P8_STEP2_NARROWER_EXPERIMENT_PROPOSAL_2026-10-05.json")
MEMO=Path("docs/p8/PortfolioAI_P8_STEP2_FEASIBILITY_DECISION_MEMO_2026-10-05.md")
VERSION="P8_STEP2_FULL_HISTORICAL_FEASIBILITY_AUDIT_V1"
SIGNALS=[
("THROUGH_CYCLE_MARGIN_QUALITY",12,"fundamental"),
("ROCE_OR_ROIC_THROUGH_CYCLE",5,"fundamental"),
("CFO_OR_FCF_CONVERSION_THROUGH_CYCLE",5,"fundamental"),
("NET_DEBT_AND_INTEREST_COVERAGE_MID_CYCLE",5,"fundamental"),
("METALS_BUSINESS_DURABILITY",5,"fundamental"),
("VALUATION_THROUGH_CYCLE",5,"fundamental"),
("MOMENTUM_12M_RELATIVE",252,"market"),
("COMMODITY_CYCLE_DRAWDOWN_RISK",252,"market"),
("OWNERSHIP_GOVERNANCE",1,"fundamental"),
("VOLUME_REALIZATION_AND_SPREAD_GROWTH",12,"fundamental"),
("COMMODITY_EXPOSURE_METADATA",1,"fundamental"),
]

def load_module(name,path):
    spec=importlib.util.spec_from_file_location(name,path)
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
V1=load_module("p8_v1","scripts/p8/p8-segment-revenue-canary-accounting.py")
V3=load_module("p8_v3","scripts/p8/p8-xbrl-segment-period-v3-audit.py")

def sha(b): return hashlib.sha256(b).hexdigest()
def stable(x): return sha(json.dumps(x,sort_keys=True,separators=(",",":"),ensure_ascii=False,default=str).encode())
def gitblob(b): return hashlib.sha1(f"blob {len(b)}\0".encode()+b).hexdigest()
def dt(x):
    d=datetime.fromisoformat(str(x).replace("Z","+00:00"))
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
def norm(x): return re.sub(r"[^A-Z0-9]+","_",str(x or "").strip().upper()).strip("_")
def acct_id(raw):
    h=urlparse(raw).hostname if "://" in raw else raw
    s=".r2.cloudflarestorage.com"
    return h[:-len(s)] if h.endswith(s) else h
def s3():
    a=acct_id(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
    return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",
      aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
      aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
      region_name="auto",config=Config(max_pool_connections=48,retries={"max_attempts":8,"mode":"adaptive"},s3={"addressing_style":"path"}))
def read(c,k): return c.get_object(Bucket=BUCKET,Key=k)["Body"].read()
def listkeys(c,prefix,suffix):
    out=[];tok=None
    while True:
        kw={"Bucket":BUCKET,"Prefix":prefix,"MaxKeys":1000}
        if tok:kw["ContinuationToken"]=tok
        p=c.list_objects_v2(**kw)
        for x in p.get("Contents",[]):
            if x["Key"].endswith(suffix):out.append({"key":x["Key"],"size":x["Size"],"etag":str(x.get("ETag") or "").strip('"')})
        if not p.get("IsTruncated"):break
        tok=p["NextContinuationToken"]
    return sorted(out,key=lambda x:x["key"])

def verify_repo_authorities(contract):
    if gitblob(CONTRACT.read_bytes())!=EXPECTED_CONTRACT_BLOB: raise RuntimeError("Step2 contract blob drift")
    for k,v in contract["adopted_authorities"].items():
        if isinstance(v,dict) and v.get("path") and v.get("git_blob_sha"):
            if gitblob(Path(v["path"]).read_bytes())!=v["git_blob_sha"]: raise RuntimeError(f"authority blob drift: {k}")
    if contract["adopted_authorities"]["step1_canary_fingerprint"]!=EXPECTED_CANARY_FP: raise RuntimeError("canary fingerprint drift")

def load_b2(c):
    parts=listkeys(c,B2_PREFIX,"part-00000.parquet")
    if len(parts)!=EXPECTED_DATES:raise RuntimeError(f"B2 partitions={len(parts)}")
    pairs=[];ids=set();dates=set()
    for p in parts:
        t=pq.read_table(io.BytesIO(read(c,p["key"])),columns=["historical_identity_id","decision_at","membership_state"])
        for r in t.to_pylist():
            if str(r["membership_state"])!="ELIGIBLE":continue
            hid=str(r["historical_identity_id"]);d=str(r["decision_at"])[:10]
            pairs.append((hid,d));ids.add(hid);dates.add(d)
    pairs=sorted(set(pairs),key=lambda x:(x[1],x[0]))
    if len(pairs)!=EXPECTED_PAIRS or len(ids)!=EXPECTED_IDENTITIES or len(dates)!=EXPECTED_DATES:
        raise RuntimeError(f"B2 population drift pairs={len(pairs)} ids={len(ids)} dates={len(dates)}")
    return pairs,parts

def verify_d_pairs(c,pairs):
    b=read(c,D_PAIR_KEY)
    if sha(b)!=D_PAIR_SHA:raise RuntimeError("Workstream-D pair hash drift")
    ks=set()
    states=Counter()
    for line in b.decode().splitlines():
        if not line.strip():continue
        r=json.loads(line);k=(str(r["historical_identity_id"]),str(r["decision_at"])[:10]);ks.add(k);states[str(r["state"])]+=1
    if ks!=set(pairs):raise RuntimeError("Workstream-D pair keys differ from B2")
    return dict(states)

def load_b3(c,pairs):
    parts=listkeys(c,B3_PREFIX,"part-00000.parquet")
    if len(parts)!=EXPECTED_DATES:raise RuntimeError(f"B3 partitions={len(parts)}")
    inv=stable(parts);m={}
    for p in parts:
        t=pq.read_table(io.BytesIO(read(c,p["key"])),columns=["historical_identity_id","decision_date","state","blocker_reason"])
        for r in t.to_pylist():
            k=(str(r["historical_identity_id"]),str(r["decision_date"])[:10])
            if k in m:raise RuntimeError(f"duplicate B3 pair {k}")
            m[k]={"state":str(r["state"]),"blocker_reason":r.get("blocker_reason")}
    if set(m)!=set(pairs):raise RuntimeError(f"B3 pair-key drift {len(m)}")
    return m,parts,inv

def taxonomy():
    tax=json.loads(TAX.read_text());by={n["code"]:n for n in tax["nodes"]}
    def path(code):
        a=[];c=code
        while c:
            n=by[c];a.append(n);c=n.get("parent_code")
        return list(reversed(a))
    return path

def mapped_hierarchy(desc,pathfn):
    n=norm(desc)
    code=None;kind=None
    if n=="EDIBLE_OIL":code="IN040101001";kind="APPROVED_EXACT_EDIBLE_OIL"
    elif n=="MANUFACTURING_STEEL_PIPES":code="IN070205015";kind="APPROVED_OD2_STEEL_PIPES"
    if not code:return None
    p=pathfn(code)
    q={x["level"]:x for x in p}
    need=("MACRO_ECONOMIC_SECTOR","SECTOR","INDUSTRY","BASIC_INDUSTRY")
    if any(x not in q for x in need):raise RuntimeError(f"incomplete taxonomy path {code}")
    return {
      "mapping_rule":kind,
      "macroEconomicSectorCode":q["MACRO_ECONOMIC_SECTOR"]["code"],"macroEconomicSectorName":q["MACRO_ECONOMIC_SECTOR"]["name"],
      "sectorCode":q["SECTOR"]["code"],"sectorName":q["SECTOR"]["name"],
      "industryCode":q["INDUSTRY"]["code"],"industryName":q["INDUSTRY"]["name"],
      "basicIndustryCode":q["BASIC_INDUSTRY"]["code"],"basicIndustryName":q["BASIC_INDUSTRY"]["name"],
    }

def v3_dominant(accounting,sem):
    if not sem or not sem.get("v3_bridge_pass"):return None,"V3_PREREQUISITES_NOT_MET"
    denom=V3.dec(accounting.get("company_revenue"));inter=V3.dec(accounting.get("intersegment_revenue"))
    if denom is None or denom<=0 or inter is None:return None,"V3_DENOMINATOR_OR_INTERSEGMENT_MISSING"
    if inter!=0:return None,"V3_NONZERO_INTERSEGMENT_EXTERNAL_UNRESOLVED"
    ds=[]
    for s in sem.get("four_revenue",[]):
        sv=V3.dec(s.get("value"))
        ratio=(sv/denom) if sv is not None and sv>=0 else None
        if ratio is not None and ratio>V3.Decimal("0.5"):ds.append((s,ratio))
    if len(ds)!=1:return None,("V3_NO_GT50_DOMINANT" if not ds else "V3_MULTIPLE_GT50")
    return {"description":ds[0][0]["description"],"ratio":str(ds[0][1]),"basis":"V3_APPROVED_PERIOD_NORMALIZATION"},None

def analyze_source(c,row):
    base={"hid":str(row.get("historical_identity_id") or ""),"published_at":str(row.get("time") or ""),"sha":row.get("sha256"),"key":row.get("r2_key")}
    try:
        raw=read(c,base["key"])
        if sha(raw)!=base["sha"]:return {"error":"SOURCE_HASH_MISMATCH",**base,"candidates":[]}
        _,ctx,fs,bases=V1.source_snapshot(raw)
        sem=None
        candidates=[]
        for b in bases:
            a=V1.accounting({"facts":fs,"ctx":ctx,"base":b})
            desc=None;ratio=None;basis=None;diag=[]
            if a.get("state")=="DOMINANT_BUSINESS_CANDIDATE" and len(a.get("dominant_segments",[]))==1:
                z=a["dominant_segments"][0];desc=z.get("description");ratio=z.get("dominance_ratio");basis="V1_STRICT_GT50"
            elif "REPORTABLE_SEGMENT_FACTS_PRESENT_BUT_PERIOD_CONTEXT_MISMATCH" in a.get("blockers",[]):
                if sem is None:sem=V3.analyze_source(raw)
                d,err=v3_dominant(a,sem)
                if d:desc=d["description"];ratio=d["ratio"];basis=d["basis"]
                elif err:diag.append(err)
            candidates.append({"annual_start":b.get("start"),"annual_end":b.get("end"),"accounting_state":a.get("state"),
              "accounting_blockers":a.get("blockers",[]),"dominant_description":desc,"dominance_ratio":ratio,"classification_basis":basis,
              "diagnostics":diag,**base})
        return {"error":None,**base,"candidates":candidates}
    except Exception as e:
        return {"error":"SOURCE_READ_OR_PARSE_ERROR","detail":str(e)[:240],**base,"candidates":[]}

def build_source_inventory(c,valid_ids):
    raw=read(c,SOURCE_MANIFEST)
    if sha(raw)!=SOURCE_MANIFEST_SHA:raise RuntimeError("source manifest hash drift")
    rows=[json.loads(x) for x in raw.decode().splitlines() if x.strip()]
    evidence=defaultdict(list);xml=[];seen=set()
    for r in rows:
        hid=str(r.get("historical_identity_id") or "")
        if hid not in valid_ids:continue
        t=r.get("time")
        if t:evidence[hid].append(dt(t))
        k=(hid,r.get("sha256"))
        if r.get("r2_key") and str(r["r2_key"]).lower().endswith(".xml") and r.get("sha256") and k not in seen:
            seen.add(k);xml.append(r)
    analyses=defaultdict(list);errors=defaultdict(list)
    with ThreadPoolExecutor(max_workers=24) as ex:
        fut={ex.submit(analyze_source,c,r):r for r in xml}
        for i,f in enumerate(as_completed(fut),1):
            z=f.result();hid=z["hid"]
            if z.get("error"):errors[hid].append(z)
            analyses[hid].extend(z.get("candidates",[]))
            if i%2000==0:print(f"source-analysis {i}/{len(xml)}",flush=True)
    for hid in evidence:evidence[hid].sort()
    for hid in analyses:analyses[hid].sort(key=lambda x:(x.get("annual_end") or "",x["published_at"],x["sha"] or ""))
    return evidence,analyses,errors,{"manifest_rows":len(rows),"dedup_xml_sources":len(xml),"manifest_sha256":SOURCE_MANIFEST_SHA}

def selected_candidate(items,decision):
    cand=[x for x in items if x.get("published_at") and dt(x["published_at"])<decision]
    return max(cand,key=lambda x:(x.get("annual_end") or "",x["published_at"],x.get("sha") or "")) if cand else None

def db_signal_inventory():
    url=os.environ["SUPABASE_DB_URL"]
    if PROJECT_REF not in url:raise RuntimeError("Refusing non-Development Supabase")
    fcodes=[c for c,_,k in SIGNALS if k=="fundamental"];mcodes=[c for c,_,k in SIGNALS if k=="market"]
    inv={c:0 for c,_,_ in SIGNALS}
    with psycopg.connect(url,connect_timeout=30) as con,con.cursor() as cur:
        cur.execute("select metric_code,count(*) from public.fundamental_observations where metric_code=any(%s) group by metric_code",(fcodes,))
        for c,n in cur.fetchall():inv[str(c)]=int(n)
        cur.execute("select metric_code,count(*) from public.market_metric_observations where metric_code=any(%s) group by metric_code",(mcodes,))
        for c,n in cur.fetchall():inv[str(c)]=int(n)
    nonzero={k:v for k,v in inv.items() if v}
    if nonzero:raise RuntimeError(f"Frozen Step2 normalized-signal inventory changed; explicit historical identity linkage required before promotion: {nonzero}")
    return inv

def actual_routes(records):
    if not records:return {}
    p=subprocess.run(["npx","--yes","tsx@4.20.6","scripts/p8/p8-step2-route-readiness-bridge.mjs"],
      input="".join(json.dumps(x,separators=(",",":"))+"\n" for x in records),text=True,capture_output=True,check=True)
    out={}
    for line in p.stdout.splitlines():
        if line.strip():
            r=json.loads(line);out[r["pair_key"]]=r
    if len(out)!=len(records):raise RuntimeError(f"router bridge returned {len(out)} / {len(records)}")
    return out

def primary(row):
    if row["access_limitation"]:return "NOT_MEASURED_ACCESS_OR_DECODING_LIMITATION"
    if not row["predecision_evidence"]:return "NO_PRE_DECISION_EVIDENCE"
    if row["classification_state"]!="AUTHORITATIVE_COMPLETE":return "CLASSIFICATION_UNRESOLVED_OR_NOT_AUTHORITATIVE"
    if row["market_state"]!="READY":return "MARKET_DATA_BLOCKED_OR_INSUFFICIENT_HISTORY"
    if row["route_state"]!="ROUTED":return "ROUTE_UNSUPPORTED_OR_AMBIGUOUS"
    if row["input_state"]!="INPUTS_COMPLETE":return "REQUIRED_INPUTS_INCOMPLETE"
    return "COMPLETE_INPUTS"

def pct(a,b):return round((100*a/b) if b else 0.0,6)

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--repeat-tag",default="A");args=ap.parse_args()
    if os.environ.get("CLOUDFLARE_R2_BUCKET")!=BUCKET:raise RuntimeError("Refusing non-Development R2")
    contract=json.loads(CONTRACT.read_text());verify_repo_authorities(contract);c=s3()
    pairs,b2parts=load_b2(c);baseline=verify_d_pairs(c,pairs);b3,b3parts,b3fp=load_b3(c,pairs)
    signal_inv=db_signal_inventory();pathfn=taxonomy();ids={x[0] for x in pairs}
    evidence,analyses,errors,srcmeta=build_source_inventory(c,ids)
    prelim=[];route_requests=[]
    for hid,d in pairs:
        decision=dt(d+"T23:59:59+00:00")
        pre=bool(evidence.get(hid) and bisect.bisect_left(evidence[hid],decision)>0)
        sel=selected_candidate(analyses.get(hid,[]),decision)
        err=any(dt(e["published_at"])<decision for e in errors.get(hid,[]) if e.get("published_at"))
        hierarchy=None;class_state="BLOCKED";class_reason="NO_ANNUAL_CLASSIFICATION"
        source_at=None;source_sha=None;basis=None
        if sel:
            source_at=sel["published_at"];source_sha=sel["sha"];basis=sel.get("classification_basis")
            hierarchy=mapped_hierarchy(sel.get("dominant_description"),pathfn) if sel.get("dominant_description") else None
            if hierarchy:
                class_state="AUTHORITATIVE_COMPLETE";class_reason=hierarchy["mapping_rule"]
            else:
                class_reason=(sel.get("accounting_state") or "CLASSIFICATION_UNRESOLVED")
        mr=b3[(hid,d)]
        row={"pair_key":hid+"|"+d,"historical_identity_id":hid,"decision_date":d,"predecision_evidence":pre,
          "access_limitation":bool(err),"classification_state":class_state,"classification_reason":class_reason,
          "classification_basis":basis,"economic_hierarchy":hierarchy,"source_disseminated_at":source_at,"source_sha256":source_sha,
          "market_state":mr["state"],"market_blocker_reason":mr.get("blocker_reason"),
          "route_state":"NOT_APPLICABLE","route_profile":None,"route_reason":None,"input_state":"NOT_APPLICABLE",
          "input_reason_codes":[],"signal_readiness":[]}
        if class_state=="AUTHORITATIVE_COMPLETE":
            req={"pair_key":row["pair_key"],"route":{
              "assetClass":"EQUITY","decisionAt":decision.isoformat(),"sourceDisseminatedAt":source_at,
              "classificationState":"AUTHORITATIVE_COMPLETE","taxonomyVersion":"NSE_NOVEMBER_2022","economicHierarchy":hierarchy,
              "accountingContractBlob":contract["adopted_authorities"]["accounting_contract"]["git_blob_sha"],
              "periodSemanticsBlob":contract["adopted_authorities"]["period_semantics"]["git_blob_sha"]}}
            route_requests.append(req)
        prelim.append(row)
    routed=actual_routes(route_requests)
    counts=Counter();diag=Counter();bydate=defaultdict(Counter);bymethod=defaultdict(Counter);bybasic=defaultdict(Counter)
    cohort=[];complete=0
    for row in prelim:
        rr=routed.get(row["pair_key"])
        if rr:
            route=rr["route"];ready=rr["readiness"]
            row["route_state"]=route["state"];row["route_profile"]=route.get("profileCode");row["route_reason"]=route.get("reasonCode")
            row["input_state"]=ready["state"];row["input_reason_codes"]=ready["reasonCodes"];row["signal_readiness"]=ready["signalReadiness"]
        row["primary_disposition"]=primary(row);counts[row["primary_disposition"]]+=1;bydate[row["decision_date"]][row["primary_disposition"]]+=1
        basic=(row.get("economic_hierarchy") or {}).get("basicIndustryCode") or "UNRESOLVED";bybasic[basic][row["primary_disposition"]]+=1
        meth=row.get("route_profile") or "NO_SUPPORTED_ROUTE";bymethod[meth][row["primary_disposition"]]+=1
        if row["access_limitation"]:diag["ACCESS_OR_DECODING_LIMITATION"]+=1
        if row["classification_state"]=="AUTHORITATIVE_COMPLETE":diag["AUTHORITATIVE_COMPLETE_CLASSIFICATION"]+=1
        if row["route_state"]=="ROUTED":diag["ACTUAL_ROUTER_ROUTED"]+=1
        if row["market_state"]!="READY":diag["B3_MARKET_NOT_READY"]+=1
        for s in row["signal_readiness"]:
            if s["state"]!="READY":diag[f"SIGNAL_{s['signalCode']}_{s['state']}"]+=1
        if row["predecision_evidence"] and row["classification_state"]=="AUTHORITATIVE_COMPLETE" and row["route_state"]=="ROUTED":
            cohort.append(row)
        if row["primary_disposition"]=="COMPLETE_INPUTS":complete+=1
    if sum(counts.values())!=EXPECTED_PAIRS:raise RuntimeError("exclusive dispositions do not reconcile")
    cohort_dates=sorted(set(r["decision_date"] for r in cohort));cohort_complete=sum(r["primary_disposition"]=="COMPLETE_INPUTS" for r in cohort)
    perdate={}
    each_date_pass=True
    for d in cohort_dates:
        rs=[r for r in cohort if r["decision_date"]==d];n=sum(r["primary_disposition"]=="COMPLETE_INPUTS" for r in rs);p=pct(n,len(rs));perdate[d]={"pairs":len(rs),"complete_inputs":n,"coverage_percent":p}
        if p<contract["acceptance_thresholds"]["minimum_each_included_decision_date_percent"]:each_date_pass=False
    methodcov={}
    for m in sorted(set(r["route_profile"] for r in cohort)):
        rs=[r for r in cohort if r["route_profile"]==m];n=sum(r["primary_disposition"]=="COMPLETE_INPUTS" for r in rs);methodcov[m]={"pairs":len(rs),"complete_inputs":n,"coverage_percent":pct(n,len(rs))}
    overall=pct(cohort_complete,len(cohort))
    standards={
      "minimum_decision_dates":{"required":24,"actual":len(cohort_dates),"pass":len(cohort_dates)>=24},
      "overall_complete_input_coverage":{"required_percent":80,"actual_percent":overall,"pass":overall>=80},
      "each_included_date_coverage":{"required_percent":70,"pass":bool(cohort_dates) and each_date_pass},
      "each_applicable_major_methodology_sector":{"required_percent":60,"pass":bool(methodcov) and all(x["coverage_percent"]>=60 for x in methodcov.values())},
    }
    recommendation="GO_RECOMMENDATION_FOR_OWNER_REVIEW" if all(x["pass"] for x in standards.values()) else "NO_GO"
    pair_core=[{k:v for k,v in r.items() if k not in ("signal_readiness",)} for r in prelim]
    pair_bytes="".join(json.dumps(r,sort_keys=True,separators=(",",":"))+"\n" for r in pair_core).encode()
    gz=gzip.compress(pair_bytes,compresslevel=9,mtime=0);PAIR_OUT.write_bytes(gz)
    audit_core={
      "version":VERSION,"contract_version":contract["version"],"contract_git_blob_sha":EXPECTED_CONTRACT_BLOB,
      "execution_status":"COMPLETE","research_feasibility":recommendation,"branch":"PortfolioAI-Development",
      "step1_status":"COMPLETE_PASS_CLOSED","source_inventory":{"b2_partition_count":len(b2parts),"b3_partition_count":len(b3parts),
        "b3_partition_inventory_fingerprint_sha256":b3fp,**srcmeta,"workstream_d_pair_states_baseline":baseline,
        "supabase_project_ref":PROJECT_REF,"normalized_signal_inventory":signal_inv},
      "population":{"pairs":len(pairs),"historical_identities":len(ids),"decision_dates":len(set(d for _,d in pairs))},
      "exclusive_primary_dispositions":dict(counts),"diagnostic_flags":dict(diag),
      "by_decision_date":{k:dict(v) for k,v in sorted(bydate.items())},
      "by_basic_industry":{k:dict(v) for k,v in sorted(bybasic.items())},
      "by_methodology":{k:dict(v) for k,v in sorted(bymethod.items())},
      "complete_input_pairs":complete,
      "proposed_cohort":{"name":contract["proposed_narrower_cohort"]["name"],"pairs":len(cohort),
        "unique_identities":len(set(r["historical_identity_id"] for r in cohort)),"decision_dates":len(cohort_dates),
        "complete_input_pairs":cohort_complete,"overall_coverage_percent":overall,"per_decision_date":perdate,"methodology_coverage":methodcov},
      "standards_evaluation":standards,
      "pair_manifest":{"path":str(PAIR_OUT),"uncompressed_rows":len(pair_core),"uncompressed_sha256":sha(pair_bytes),"gzip_sha256":sha(gz)},
      "regression":{"step1_canary_fingerprint":EXPECTED_CANARY_FP},
      "mutations":{"provider_calls":0,"supabase_writes":0,"r2_writes":0,"schema_migrations":0,"deployments":0,"production_changes":0,"main_changes":0,
        "scores_decisions_positions_returns":0,"holdout_reads":0},
    }
    fp=stable(audit_core);audit={**audit_core,"census_fingerprint_sha256":fp}
    OUT.write_text(json.dumps(audit,indent=2,sort_keys=True)+"\n")
    proposal={"version":"P8_STEP2_OBJECTIVE_ROUTED_HISTORICAL_COHORT_PROPOSAL_V1","status":"PROPOSED_NOT_FROZEN",
      "eligibility":contract["proposed_narrower_cohort"]["eligibility"],"exclusions_not_used":contract["proposed_narrower_cohort"]["exclusions_not_used"],
      "measured_pairs":len(cohort),"measured_identities":len(set(r["historical_identity_id"] for r in cohort)),"measured_decision_dates":len(cohort_dates),
      "complete_input_pairs":cohort_complete,"coverage_percent":overall,"standards":standards,"recommendation":recommendation,
      "experiment_freeze_authorized":False}
    PROPOSAL.write_text(json.dumps(proposal,indent=2,sort_keys=True)+"\n")
    MEMO.write_text(f"""# PortfolioAI P8 Step 2 Feasibility Decision Memo

Date: 5 October 2026  
Branch: `PortfolioAI-Development`  
Contract: `{contract["version"]}` / blob `{EXPECTED_CONTRACT_BLOB}`

## Decision

**{recommendation}**

Step 2 execution itself is **COMPLETE**. Research feasibility is evaluated separately and is **{recommendation}**.

## Full denominator

- B2 pairs: **{len(pairs):,}**
- Historical identities: **{len(ids):,}**
- Decision dates: **{len(set(d for _,d in pairs))}**
- Complete-input pairs: **{complete:,}**

Exclusive primary dispositions reconcile exactly to the B2 denominator:

{chr(10).join(f"- {k}: **{v:,}**" for k,v in sorted(counts.items()))}

## Predeclared narrower cohort

`{contract["proposed_narrower_cohort"]["name"]}` contains **{len(cohort):,} pairs**, **{len(set(r["historical_identity_id"] for r in cohort)):,} identities**, and **{len(cohort_dates)} decision dates**. Complete-input coverage is **{overall:.6f}%**.

The cohort was selected only by B2 eligibility + pre-decision official evidence + adopted authoritative four-tier classification + the actual historical router. Market/input completeness was measured after membership and was not used as a selector.

## Why

The actual historical router/readiness adapter was used. The Development normalized-signal inventory contained zero observations for every frozen STEEL_FERROUS required signal code, so raw XBRL facts and B3 prices were not promoted to canonical normalized scoring inputs. Missing inputs fail closed.

## Gate evaluation

{chr(10).join(f"- {k}: **{'PASS' if v['pass'] else 'FAIL'}**" for k,v in standards.items())}

## Boundary

No experiment was frozen or executed. No B5/B6/B-FINAL rebuild, P8-C work, provider acquisition, Supabase/R2 write, migration, deployment, Production/main mutation, score, decision, position, return, or holdout read occurred.
""")
    print(json.dumps({"repeat_tag":args.repeat_tag,"census_fingerprint_sha256":fp,"research_feasibility":recommendation,
      "pairs":len(pairs),"complete_inputs":complete,"cohort_pairs":len(cohort),"dispositions":dict(counts)},sort_keys=True))

if __name__=="__main__":
    main()
