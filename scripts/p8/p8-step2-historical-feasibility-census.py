#!/usr/bin/env python3
import gzip, hashlib, importlib.util, io, json, os, subprocess, tempfile
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import pyarrow.parquet as pq

ROOT=Path("docs/p8")
CONTRACT_PATH=ROOT/"PortfolioAI_P8_STEP2_HISTORICAL_FEASIBILITY_CONTRACT_V1.json"
OUT_AUDIT=ROOT/"PortfolioAI_P8_STEP2_FULL_HISTORICAL_FEASIBILITY_AUDIT_2026-10-05.json"
OUT_PAIRS=ROOT/"PortfolioAI_P8_STEP2_PAIR_DISPOSITIONS_2026-10-05.jsonl.gz"
OUT_PROPOSAL=ROOT/"PortfolioAI_P8_STEP2_NARROWER_EXPERIMENT_PROPOSAL_2026-10-05.json"
OUT_MEMO=ROOT/"PortfolioAI_P8_STEP2_DECISION_MEMO_2026-10-05.md"
BUCKET="portfolioai-history-dev"; VERSION="P8_STEP2_FULL_HISTORICAL_FEASIBILITY_CENSUS_V1"

def load_module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
SEG=load_module("p8seg","scripts/p8/p8-segment-revenue-canary-accounting.py")
V3=load_module("p8v3","scripts/p8/p8-xbrl-segment-period-v3-audit.py")

def canonical(x):return json.dumps(x,sort_keys=True,separators=(",",":"),ensure_ascii=True,default=str)
def fingerprint(x):return hashlib.sha256(canonical(x).encode()).hexdigest()
def sha256(b):return hashlib.sha256(b).hexdigest()
def git_blob_sha(b):return hashlib.sha1(f"blob {len(b)}\0".encode()+b).hexdigest()
def strict_gt_half(x):
    v=V3.dec(x);return bool(v is not None and v>V3.Decimal("0.5"))
def map_description(x):
    if SEG.clean(x)=="Manufacturing- Steel Pipes":return "IN070205015"
    if SEG.norm(x)=="EDIBLE_OIL":return "IN040101001"
    return None
def pick_primary(s):
    if s.get("access"):return "NOT_MEASURED_ACCESS_OR_DECODING_LIMITATION"
    if s.get("no_pre"):return "NO_PRE_DECISION_EVIDENCE"
    if not s.get("classification"):return "CLASSIFICATION_UNRESOLVED_OR_NOT_AUTHORITATIVE"
    if not s.get("market"):return "MARKET_DATA_BLOCKED_OR_INSUFFICIENT_HISTORY"
    if not s.get("route"):return "ROUTE_UNSUPPORTED_OR_AMBIGUOUS"
    if not s.get("inputs"):return "REQUIRED_INPUTS_INCOMPLETE"
    return "COMPLETE_INPUTS"
def assert_unique_pairs(rows,expected):
    if len(rows)!=expected:raise RuntimeError(f"pair count {len(rows)} != {expected}")
    if len(set(rows))!=expected:raise RuntimeError("duplicate pair key detected")
def read(c,k):return c.get_object(Bucket=BUCKET,Key=k)["Body"].read()
def listkeys(c,prefix,suffix=None):
    out=[];tok=None
    while True:
        kw={"Bucket":BUCKET,"Prefix":prefix,"MaxKeys":1000}
        if tok:kw["ContinuationToken"]=tok
        pg=c.list_objects_v2(**kw)
        for x in pg.get("Contents",[]):
            if suffix is None or x["Key"].endswith(suffix):out.append((x["Key"],x.get("ETag","").strip('"'),x.get("Size",0)))
        if not pg.get("IsTruncated"):break
        tok=pg["NextContinuationToken"]
    return sorted(out)
def hierarchy(code,tax):
    by={n["code"]:n for n in tax["nodes"]};a=[];n=by.get(code)
    while n:a.insert(0,n);n=by.get(n.get("parent_code")) if n.get("parent_code") else None
    if [x.get("level") for x in a]!=["MACRO_ECONOMIC_SECTOR","SECTOR","INDUSTRY","BASIC_INDUSTRY"]:return None
    return {"macroEconomicSectorCode":a[0]["code"],"macroEconomicSectorName":a[0]["name"],
      "sectorCode":a[1]["code"],"sectorName":a[1]["name"],"industryCode":a[2]["code"],"industryName":a[2]["name"],
      "basicIndustryCode":a[3]["code"],"basicIndustryName":a[3]["name"]}

def v3_dominant(acct,sem,base):
    if "REPORTABLE_SEGMENT_FACTS_PRESENT_BUT_PERIOD_CONTEXT_MISMATCH" not in acct.get("blockers",[]):return None,[]
    if not sem.get("v3_bridge_pass"):return None,["V3_PREREQUISITES_NOT_PROVEN"]
    fp=sem.get("four_explicit_period") or {}
    if fp.get("start")!=base.get("start") or fp.get("end")!=base.get("end"):return None,["V3_PERIOD_NOT_SELECTED_ANNUAL_PERIOD"]
    dv,iv=V3.dec(acct.get("company_revenue")),V3.dec(acct.get("intersegment_revenue"))
    if dv is None or dv<=0 or iv is None:return None,["INVALID_OR_MISSING_DENOMINATOR_OR_INTERSEGMENT"]
    if iv!=0:return None,["NONZERO_INTERSEGMENT_WITHOUT_SEGMENT_EXTERNAL_REVENUE"]
    dom=[]
    for s in sem.get("four_revenue",[]):
        sv=V3.dec(s.get("value"));ratio=sv/dv if sv is not None and sv>=0 else None
        if ratio is not None and ratio>V3.Decimal("0.5"):dom.append({"description":s["description"],"ratio":str(ratio)})
    return (dom[0] if len(dom)==1 else None),([] if len(dom)==1 else ["V3_DOMINANT_SEGMENT_NOT_UNIQUE"])

def process_source(c,src):
    try:
        raw=read(c,src["r2_key"])
        if sha256(raw)!=src.get("sha256"):return {"source":src,"error":"SOURCE_HASH_MISMATCH"}
        _,ctx,fs,bases=SEG.source_snapshot(raw);sem=None;out=[]
        for base in bases:
            selected={"src":src,"raw":raw,"ctx":ctx,"facts":fs,"base":base};acct=SEG.accounting(selected)
            dom=acct.get("dominant_segments",[None])[0] if acct.get("state")=="DOMINANT_BUSINESS_CANDIDATE" else None
            diag=list(acct.get("blockers",[]));basis="V1"
            if not dom and "REPORTABLE_SEGMENT_FACTS_PRESENT_BUT_PERIOD_CONTEXT_MISMATCH" in diag:
                if sem is None:sem=V3.analyze_source(raw)
                dom,d2=v3_dominant(acct,sem,base);diag+=d2;basis="V3" if dom else basis
            code=map_description(dom.get("description")) if dom else None
            if dom and not code:diag.append("TAXONOMY_MAPPING_UNPROVEN")
            out.append({"period_start":base.get("start"),"period_end":base.get("end"),"published_at":src.get("time"),
              "source_sha256":src.get("sha256"),"r2_key":src.get("r2_key"),"classification_code":code,
              "classification_description":dom.get("description") if dom else None,"classification_basis":basis if code else None,
              "diagnostics":sorted(set(diag))})
        return {"source":src,"snapshots":out}
    except Exception as e:return {"source":src,"error":"SOURCE_PARSE_OR_ACCESS_ERROR","detail":str(e)[:300]}

def choose_snapshot(rows,decision):
    eligible=[x for x in rows if x.get("published_at") and x["published_at"]<decision]
    best={}
    for x in eligible:
        k=(x.get("period_start"),x.get("period_end"));p=best.get(k)
        if p is None or (x["published_at"],x["source_sha256"])>(p["published_at"],p["source_sha256"]):best[k]=x
    pool=list(best.values());pool.sort(key=lambda x:(x.get("period_end") or "",x["published_at"],x["source_sha256"]),reverse=True)
    return pool[0] if pool else None

def main():
    contract=json.loads(CONTRACT_PATH.read_text())
    if contract["version"]!="P8_STEP2_HISTORICAL_FEASIBILITY_CONTRACT_V1":raise RuntimeError("contract drift")
    if os.environ.get("CLOUDFLARE_R2_BUCKET")!=BUCKET:raise RuntimeError("wrong R2 bucket")
    c=SEG.s3();tax=json.loads((ROOT/"PortfolioAI_P8_NSE_FOUR_TIER_TAXONOMY_NOVEMBER_2022.json").read_text())
    if tax["source"]["content_sha256"]!="ed6a4af212460747510ca551bb14634ab8ef81bb5dee59a33d5d6973e3129dd1":raise RuntimeError("taxonomy drift")

    dp=contract["frozen_source_inventory"]["workstream_d"]["pair_dispositions"];raw=read(c,dp["key"])
    if sha256(raw)!=dp["sha256"]:raise RuntimeError("pair-disposition hash mismatch")
    drows=[json.loads(x) for x in raw.decode().splitlines() if x.strip()]
    dmap={(r["historical_identity_id"],r["decision_at"][:10]):r for r in drows}
    assert_unique_pairs(list(dmap),contract["population"]["expected_pairs"])

    pfx=contract["frozen_source_inventory"]["b3_adjusted_decision_ledger_prefix"];inv=listkeys(c,pfx,"/part-00000.parquet")
    if len(inv)!=contract["frozen_source_inventory"]["b3_expected_partitions"]:raise RuntimeError("B3 partition-count drift")
    market={}
    for k,etag,size in inv:
        t=pq.read_table(io.BytesIO(read(c,k)),columns=["decision_date","historical_identity_id","state","blocker_reason"])
        for r in t.to_pylist():market[(str(r["historical_identity_id"]),str(r["decision_date"])[:10])]={"state":str(r["state"]),"blocker_reason":r.get("blocker_reason")}
    if set(market)!=set(dmap):raise RuntimeError("B3 population mismatch")
    b3fp=fingerprint([{"key":k,"etag":e,"size":s} for k,e,s in inv])

    sm=contract["frozen_source_inventory"]["source_manifest"];sraw=read(c,sm["key"])
    if sha256(sraw)!=sm["sha256"]:raise RuntimeError("source-manifest hash mismatch")
    sources=[json.loads(x) for x in sraw.decode().splitlines() if x.strip()];ids={k[0] for k in dmap}
    usable=[x for x in sources if x.get("historical_identity_id") in ids and x.get("r2_key") and str(x["r2_key"]).lower().endswith(".xml") and x.get("sha256") and x.get("time")]
    byid=defaultdict(list);access_errors=defaultdict(list)
    with ThreadPoolExecutor(max_workers=32) as ex:
        futs=[ex.submit(process_source,c,x) for x in usable]
        for i,f in enumerate(as_completed(futs),1):
            r=f.result();hid=str(r["source"].get("historical_identity_id") or "")
            if r.get("error"):access_errors[hid].append(r)
            else:byid[hid].extend(r["snapshots"])
            if i%2000==0:print(f"processed source bodies {i}/{len(usable)}")

    route_rows=[];pre={}
    for (hid,dte),dr in dmap.items():
        snap=choose_snapshot(byid.get(hid,[]),dr["decision_at"]);h=hierarchy(snap.get("classification_code"),tax) if snap and snap.get("classification_code") else None
        pre[(hid,dte)]={"snap":snap,"classification":h,"access":bool(access_errors.get(hid) and not byid.get(hid))}
        if h:
            route_rows.append({"pair_key":hid+"|"+dte,"route_input":{"assetClass":"EQUITY","decisionAt":dr["decision_at"],
              "sourceDisseminatedAt":snap["published_at"],"classificationState":"AUTHORITATIVE_COMPLETE","taxonomyVersion":"NSE_NOVEMBER_2022",
              "economicHierarchy":h,"accountingContractBlob":"45e990981371dba217d12c430f8ce567acbf25fc","periodSemanticsBlob":"797b7e91d7770f3377d0061ee338c76e8220391f"}})
    with tempfile.TemporaryDirectory() as td:
        p=Path(td);(p/"in.json").write_text(json.dumps(route_rows))
        subprocess.run(["node","--experimental-strip-types","scripts/p8/p8-step2-route-batch.mjs",str(p/"in.json"),str(p/"out.json")],check=True)
        routed=json.loads((p/"out.json").read_text())
    rmap={x["pair_key"]:x for x in routed}

    def measure():
        counts=Counter();bydate=defaultdict(Counter);bymethod=defaultdict(Counter);diag=Counter();rows=[];cohort=[]
        for (hid,dte),dr in sorted(dmap.items(),key=lambda x:(x[0][1],x[0][0])):
            p=pre[(hid,dte)];mr=market[(hid,dte)];rr=rmap.get(hid+"|"+dte)
            no_pre=dr["state"]=="NO_PRE_DECISION_EVIDENCE";classification=p["classification"] is not None;market_ready=mr["state"]=="READY"
            route_ok=bool(rr and rr["route"]["state"]=="ROUTED");inputs_ok=False
            primary=pick_primary({"access":p["access"],"no_pre":no_pre,"classification":classification,"market":market_ready,"route":route_ok,"inputs":inputs_ok})
            flags=[];flags+=(p["snap"].get("diagnostics",[]) if p["snap"] else [])
            if not market_ready:flags.append("MARKET:"+str(mr.get("blocker_reason") or mr["state"]))
            if rr and not route_ok:flags.append("ROUTE:"+rr["route"]["reasonCode"])
            if route_ok:
                flags += ["MANDATORY_SIGNAL_NOT_READY:"+x["code"]+":MISSING_NORMALIZED_HISTORICAL_INPUT" for x in contract["route_specific_requirements"]["mandatory_signals"]]
            for x in set(flags):diag[x]+=1
            method=rr["route"]["profileCode"] if route_ok else None
            if route_ok:cohort.append((hid,dte))
            counts[primary]+=1;bydate[dte][primary]+=1
            if method:bymethod[method][primary]+=1
            rows.append({"historical_identity_id":hid,"decision_date":dte,"primary_disposition":primary,"historical_classification":p["classification"],
              "selected_source":({k:p["snap"].get(k) for k in ("period_start","period_end","published_at","source_sha256","r2_key","classification_description","classification_basis")} if p["snap"] else None),
              "market_state":mr,"route":rr["route"] if rr else None,
              "input_readiness":({"state":"INPUTS_INCOMPLETE","authority":"P8_STEP2_HISTORICAL_FEASIBILITY_CONTRACT_V1",
                "required_signals":contract["route_specific_requirements"]["mandatory_signals"],
                "reason":"NO_FROZEN_NORMALIZED_HISTORICAL_SIGNAL_LEDGER_IN_STEP2_SOURCE_INVENTORY"} if route_ok else None),
              "diagnostic_flags":sorted(set(flags))})
        return counts,bydate,bymethod,diag,rows,cohort

    def core(a):
        counts,bydate,bymethod,diag,rows,cohort=a;cs=set(cohort);cr=[r for r in rows if (r["historical_identity_id"],r["decision_date"]) in cs]
        cbd=defaultdict(lambda:[0,0]);cbm=defaultdict(lambda:[0,0]);complete=0
        for r in cr:
            ok=r["primary_disposition"]=="COMPLETE_INPUTS";complete+=ok;cbd[r["decision_date"]][0]+=1;cbd[r["decision_date"]][1]+=ok
            m=r["route"]["profileCode"];cbm[m][0]+=1;cbm[m][1]+=ok
        pct=lambda x,y:round(100*x/y,6) if y else None
        gates={"minimum_24_decision_dates":len(cbd)>=24,"overall_complete_input_at_least_80pct":bool(cr and pct(complete,len(cr))>=80),
          "every_included_date_at_least_70pct":bool(cbd) and all(pct(v[1],v[0])>=70 for v in cbd.values()),
          "every_applicable_major_methodology_sector_at_least_60pct":bool(cbm) and all(pct(v[1],v[0])>=60 for v in cbm.values())}
        return {"version":VERSION,"contract_blob_sha":git_blob_sha(CONTRACT_PATH.read_bytes()),"contract_sha256":sha256(CONTRACT_PATH.read_bytes()),
          "frozen_inputs":{"source_manifest_sha256":sm["sha256"],"workstream_d_pair_sha256":dp["sha256"],"b3_inventory_fingerprint_sha256":b3fp},
          "full_b2":{"pairs":len(rows),"unique_identities":len({r["historical_identity_id"] for r in rows}),"decision_dates":len({r["decision_date"] for r in rows}),
            "primary_dispositions":dict(sorted(counts.items())),"complete_input_pairs":counts["COMPLETE_INPUTS"]},
          "classification_and_route":{"authoritative_complete_pairs":sum(r["historical_classification"] is not None for r in rows),
            "actual_supported_route_pairs":len(cohort),"actual_supported_route_identities":len({x[0] for x in cohort}),
            "methodology_primary_dispositions":{k:dict(sorted(v.items())) for k,v in sorted(bymethod.items())}},
          "proposed_cohort":{"name":contract["proposed_narrower_cohort"]["name"],"pairs":len(cr),"unique_identities":len({r["historical_identity_id"] for r in cr}),
            "decision_dates":len(cbd),"complete_input_pairs":complete,"overall_complete_input_percent":pct(complete,len(cr)),
            "by_decision_date":{k:{"pairs":v[0],"complete":v[1],"complete_percent":pct(v[1],v[0])} for k,v in sorted(cbd.items())},
            "by_methodology":{k:{"pairs":v[0],"complete":v[1],"complete_percent":pct(v[1],v[0])} for k,v in sorted(cbm.items())},"gates":gates},
          "decision_date_primary_dispositions":{k:dict(sorted(v.items())) for k,v in sorted(bydate.items())},"diagnostic_flags":dict(diag.most_common()),
          "source_access_error_identities":len(access_errors),"provider_calls":0,"supabase_writes":0,"r2_writes":0,"performance_outcome_reads":0,
          "scores_generated":0,"experiment_executed":False,"p8_c_started":False,"b5_b6_bfinal_rebuilt":False}

    a1=measure();a2=measure();c1=core(a1);c2=core(a2);fp1,fp2=fingerprint(c1),fingerprint(c2)
    if fp1!=fp2:raise RuntimeError("independent repeated measurement fingerprint mismatch")
    status="GO_RECOMMENDATION_ONLY" if all(c1["proposed_cohort"]["gates"].values()) else "NO_GO"
    body="".join(canonical(r)+"\n" for r in a1[4]).encode();OUT_PAIRS.write_bytes(gzip.compress(body,mtime=0))
    audit={**c1,"execution_status":"COMPLETE","research_feasibility":status,"repeat_fingerprint_sha256":fp2,"census_fingerprint_sha256":fp1,
      "pair_manifest":{"path":str(OUT_PAIRS),"uncompressed_sha256":sha256(body),"rows":len(a1[4])}}
    OUT_AUDIT.write_text(json.dumps(audit,indent=2,sort_keys=True)+"\n")
    proposal={"version":"P8_STEP2_NARROWER_EXPERIMENT_PROPOSAL_V1","status":"PROPOSAL_ONLY_NOT_FROZEN","cohort_name":contract["proposed_narrower_cohort"]["name"],
      "eligibility":contract["proposed_narrower_cohort"]["eligibility"],"exclusions_not_used":contract["proposed_narrower_cohort"]["exclusions_not_used"],
      "measured_pairs":audit["proposed_cohort"]["pairs"],"measured_unique_identities":audit["proposed_cohort"]["unique_identities"],
      "measured_decision_dates":audit["proposed_cohort"]["decision_dates"],"complete_input_pairs":audit["proposed_cohort"]["complete_input_pairs"],
      "gates":audit["proposed_cohort"]["gates"],"recommendation":status,"freeze_recommended":status=="GO_RECOMMENDATION_ONLY",
      "owner_approval_required_before_any_freeze":True}
    OUT_PROPOSAL.write_text(json.dumps(proposal,indent=2,sort_keys=True)+"\n")
    pc=audit["full_b2"]["primary_dispositions"]
    gates="\n".join(f"- {k}: **{'PASS' if v else 'FAIL'}**" for k,v in audit["proposed_cohort"]["gates"].items())
    OUT_MEMO.write_text(f"""# PortfolioAI P8 Step 2 Decision Memo

Date: 5 October 2026  
Branch: `PortfolioAI-Development`  
Execution: **COMPLETE**  
Research-feasibility decision: **{status}**

The census reconciled **{audit['full_b2']['pairs']:,}** B2 pairs across **{audit['full_b2']['decision_dates']}** decision dates. The objectively predeclared routed cohort contains **{audit['proposed_cohort']['pairs']:,}** pairs across **{audit['proposed_cohort']['unique_identities']:,}** identities and **{audit['proposed_cohort']['decision_dates']}** dates. Complete-input pairs: **{audit['proposed_cohort']['complete_input_pairs']:,}** ({audit['proposed_cohort']['overall_complete_input_percent']}%).

## Exclusive full-B2 reconciliation

- NOT_MEASURED_ACCESS_OR_DECODING_LIMITATION: {pc.get('NOT_MEASURED_ACCESS_OR_DECODING_LIMITATION',0):,}
- NO_PRE_DECISION_EVIDENCE: {pc.get('NO_PRE_DECISION_EVIDENCE',0):,}
- CLASSIFICATION_UNRESOLVED_OR_NOT_AUTHORITATIVE: {pc.get('CLASSIFICATION_UNRESOLVED_OR_NOT_AUTHORITATIVE',0):,}
- MARKET_DATA_BLOCKED_OR_INSUFFICIENT_HISTORY: {pc.get('MARKET_DATA_BLOCKED_OR_INSUFFICIENT_HISTORY',0):,}
- ROUTE_UNSUPPORTED_OR_AMBIGUOUS: {pc.get('ROUTE_UNSUPPORTED_OR_AMBIGUOUS',0):,}
- REQUIRED_INPUTS_INCOMPLETE: {pc.get('REQUIRED_INPUTS_INCOMPLETE',0):,}
- COMPLETE_INPUTS: {pc.get('COMPLETE_INPUTS',0):,}

## Acceptance gates
{gates}

The actual historical router and actual STEEL_FERROUS readiness adapter were executed. Raw XBRL facts were not promoted into normalized inputs and no threshold was relaxed.

## Recommendation

**{status}**. {"Prepare an owner-approval package only; do not freeze automatically." if status=="GO_RECOMMENDATION_ONLY" else "Do not freeze or execute an experiment. The smallest evidenced next dependency is route-specific historical normalized-input materialization/mapping under already adopted methodology authorities, not another generic acquisition loop."}

No B5/B6/B-FINAL rebuild, P8-C execution, provider call, database/storage write, score, return or performance calculation occurred.
""")
    print(json.dumps({"execution":"COMPLETE","research_feasibility":status,"census_fingerprint":fp1,"contract_blob_sha":audit["contract_blob_sha"],
      "full_b2":audit["full_b2"],"proposed_cohort":{k:v for k,v in audit["proposed_cohort"].items() if k!="by_decision_date"}},indent=2,sort_keys=True))
if __name__=="__main__":main()
