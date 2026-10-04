#!/usr/bin/env python3
import boto3, hashlib, json, os, re
from collections import defaultdict, Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone, date
from decimal import Decimal, InvalidOperation, getcontext
from pathlib import Path
from urllib.parse import urlparse
from botocore.config import Config
from lxml import etree
import psycopg

getcontext().prec=40

BUCKET="portfolioai-history-dev"
SOURCE_MANIFEST_KEY="portfolioai-history/development/p8/recovery/workstream-c/manifests/alias-backfill-8758fa8c8340ec0006f4a74fab76b783806bf009ba668148f0d771015d46ed79.jsonl"
SOURCE_MANIFEST_SHA="8758fa8c8340ec0006f4a74fab76b783806bf009ba668148f0d771015d46ed79"
CONTRACT=Path("docs/p8/PortfolioAI_P8_HISTORICAL_SEGMENT_REVENUE_CLASSIFICATION_CONTRACT_V1.json")
CANARY=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_MANIFEST_2026-10-04.json")
TAX=Path("docs/p8/PortfolioAI_P8_NSE_FOUR_TIER_TAXONOMY_NOVEMBER_2022.json")
MANIFEST=Path("docs/p8/PortfolioAI_P8_NSE_FOUR_TIER_TAXONOMY_NOVEMBER_2022_ADOPTION_MANIFEST.json")
SOURCE_OUT=Path("docs/p8/PortfolioAI_P8_SEGMENT_REVENUE_CANARY_SOURCE_ACCOUNTING_AUDIT_2026-10-04.json")
CLASS_OUT=Path("docs/p8/PortfolioAI_P8_SEGMENT_REVENUE_CANARY_CLASSIFICATION_AUDIT_2026-10-04.json")
EXPECTED_CONTRACT_BLOB="45e990981371dba217d12c430f8ce567acbf25fc"
EXPECTED_CANARY_FP="b159764fd342aad3901717e04446596e93aa87d9c6726b7b3dd7ef8b55026dce"
VERSION="P8_SEGMENT_REVENUE_CANARY_ACCOUNTING_V1"

def sha256(b): return hashlib.sha256(b).hexdigest()
def git_blob_sha(b): return hashlib.sha1(f"blob {len(b)}\0".encode()+b).hexdigest()
def stable(x): return sha256(json.dumps(x,sort_keys=True,separators=(",",":"),default=str).encode())
def clean(x): return " ".join(str(x or "").strip().split())
def norm(x): return re.sub(r"[^A-Z0-9]+","_",clean(x).upper()).strip("_")
def local(tag):
    try: return etree.QName(tag).localname
    except: return str(tag).split(":",1)[-1]

def acct(raw):
    h=urlparse(raw).hostname if "://" in raw else raw
    suffix=".r2.cloudflarestorage.com"
    return h[:-len(suffix)] if h.endswith(suffix) else h

def s3():
    a=acct(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
    return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",
      aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
      aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
      region_name="auto",config=Config(max_pool_connections=32,retries={"max_attempts":8,"mode":"adaptive"},s3={"addressing_style":"path"}))

def read(c,key): return c.get_object(Bucket=BUCKET,Key=key)["Body"].read()

def parse_date(x):
    if not x: return None
    try: return date.fromisoformat(str(x)[:10])
    except: return None

def dec(x):
    try: return Decimal(str(x).strip())
    except (InvalidOperation,ValueError,TypeError): return None

def scaled_value(f):
    v=dec(f.get("value"))
    if v is None: return None
    s=f.get("scale")
    if s not in (None,""):
        try: v*=Decimal(10) ** int(s)
        except: return None
    return v

def half_quantum(f):
    d=f.get("decimals")
    if d is None or str(d).upper()=="INF": return Decimal(0)
    try:
        q=Decimal(10) ** (-int(d))
        s=f.get("scale")
        if s not in (None,""): q*=Decimal(10) ** int(s)
        return q/Decimal(2)
    except: return Decimal(0)

def contexts(root):
    out={}
    for e in root.iter():
        if local(e.tag)!="context" or not e.get("id"): continue
        p={"start":None,"end":None,"instant":None,"members":[]}
        for z in e.iter():
            ln=local(z.tag)
            if ln=="startDate": p["start"]=clean(z.text)
            elif ln=="endDate": p["end"]=clean(z.text)
            elif ln=="instant": p["instant"]=clean(z.text)
            elif ln=="explicitMember": p["members"].append({"dimension":z.get("dimension"),"member":clean(z.text)})
        out[e.get("id")]=p
    return out

def facts(root,ctx):
    out=[]
    for e in root.iter():
        cref=e.get("contextRef")
        if not cref: continue
        txt=clean(e.text)
        if not txt: continue
        q=etree.QName(e)
        out.append({
          "qname":f"{e.prefix}:{q.localname}" if e.prefix else q.localname,
          "local_name":q.localname,"context_ref":cref,"value":txt,
          "unit_ref":e.get("unitRef"),"decimals":e.get("decimals"),"scale":e.get("scale"),
          "context":ctx.get(cref,{"start":None,"end":None,"instant":None,"members":[]})
        })
    return out

def one(facts_,name,cref):
    rows=[f for f in facts_ if f["local_name"]==name and f["context_ref"]==cref]
    if len(rows)==1: return rows[0]
    return None

def text_value(facts_,name,cref):
    f=one(facts_,name,cref)
    return clean(f["value"]) if f else None

def base_candidates(facts_,ctx):
    refs=set(f["context_ref"] for f in facts_ if f["local_name"]=="WhetherResultsAreAuditedOrUnaudited")
    out=[]
    for cref in refs:
        audit=text_value(facts_,"WhetherResultsAreAuditedOrUnaudited",cref)
        scope=text_value(facts_,"NatureOfReportStandaloneConsolidated",cref)
        start=text_value(facts_,"DateOfStartOfReportingPeriod",cref) or ctx.get(cref,{}).get("start")
        end=text_value(facts_,"DateOfEndOfReportingPeriod",cref) or ctx.get(cref,{}).get("end")
        sd,ed=parse_date(start),parse_date(end)
        days=(ed-sd).days+1 if sd and ed else None
        no_dims=not ctx.get(cref,{}).get("members")
        if norm(audit)=="AUDITED" and norm(scope)=="CONSOLIDATED" and days is not None and 330<=days<=380 and no_dims:
            out.append({"context_ref":cref,"audit":audit,"scope":scope,"start":start,"end":end,"days":days})
    out.sort(key=lambda x:(x["end"],x["days"],x["context_ref"]),reverse=True)
    return out

def source_snapshot(raw):
    root=etree.fromstring(raw,etree.XMLParser(resolve_entities=False,huge_tree=True,recover=False))
    ctx=contexts(root); fs=facts(root,ctx)
    bases=base_candidates(fs,ctx)
    return root,ctx,fs,bases

def select_annual_source(c,sources,decision):
    candidates=[]
    parse_errors=[]
    eligible=[src for src in sources if str(src.get("time") or "") and str(src.get("time") or "")<decision and src.get("r2_key") and str(src["r2_key"]).lower().endswith(".xml")]
    def load(src):
        try:
            raw=read(c,src["r2_key"])
            if sha256(raw)!=src.get("sha256"):
                return None,{"r2_key":src["r2_key"],"blocker":"SOURCE_HASH_MISMATCH"}
            root,ctx,fs,bases=source_snapshot(raw)
            return [{"src":src,"raw":raw,"ctx":ctx,"facts":fs,"base":b} for b in bases],None
        except Exception as e:
            return None,{"r2_key":src.get("r2_key"),"blocker":"SOURCE_PARSE_ERROR","detail":str(e)[:300]}
    if eligible:
        with ThreadPoolExecutor(max_workers=min(12,len(eligible))) as pool:
            futs=[pool.submit(load,src) for src in eligible]
            for fut in as_completed(futs):
                rows,err=fut.result()
                if rows: candidates.extend(rows)
                if err: parse_errors.append(err)
    # One version per annual period: latest eligible dissemination wins. Then latest annual period end.
    best_by_period={}
    for x in candidates:
        k=(x["base"]["start"],x["base"]["end"])
        prev=best_by_period.get(k)
        if prev is None or (str(x["src"].get("time")),str(x["src"].get("sha256")))>(str(prev["src"].get("time")),str(prev["src"].get("sha256"))):
            best_by_period[k]=x
    pool=list(best_by_period.values())
    pool.sort(key=lambda x:(x["base"]["end"],str(x["src"].get("time")),str(x["src"].get("sha256"))),reverse=True)
    return (pool[0] if pool else None), candidates, parse_errors

def compatible_unit(*facts_):
    vals=[f.get("unit_ref") for f in facts_ if f is not None]
    return bool(vals) and all(v and v==vals[0] for v in vals)

def accounting(selected):
    if not selected: return {"state":"NO_ELIGIBLE_AUDITED_CONSOLIDATED_ANNUAL","blockers":["NO_ELIGIBLE_AUDITED_CONSOLIDATED_ANNUAL"]}
    fs=selected["facts"]; ctx=selected["ctx"]; b=selected["base"]; cref=b["context_ref"]
    total=one(fs,"SegmentRevenue",cref)
    inter=one(fs,"InterSegmentRevenue",cref)
    denom=one(fs,"SegmentRevenueFromOperations",cref) or one(fs,"RevenueFromOperations",cref)
    blockers=[]
    if not total: blockers.append("TOTAL_SEGMENT_REVENUE_MISSING")
    if not inter: blockers.append("INTERSEGMENT_REVENUE_MISSING")
    if not denom: blockers.append("COMPANY_REVENUE_DENOMINATOR_MISSING")
    if blockers: return {"state":"ACCOUNTING_INCOMPLETE","base":b,"blockers":blockers}
    tv,iv,dv=scaled_value(total),scaled_value(inter),scaled_value(denom)
    if tv is None or iv is None or dv is None: blockers.append("NON_NUMERIC_ACCOUNTING_FACT")
    if not compatible_unit(total,inter,denom): blockers.append("ACCOUNTING_UNIT_CONFLICT")
    if dv is not None and dv<=0: blockers.append("INVALID_ZERO_OR_NEGATIVE_DENOMINATOR")
    residual=(tv-iv-dv) if tv is not None and iv is not None and dv is not None else None
    tolerance=half_quantum(total)+half_quantum(inter)+half_quantum(denom)
    reconciled=residual is not None and abs(residual)<=tolerance
    if not reconciled: blockers.append("TOTAL_INTERSEGMENT_COMPANY_REVENUE_UNRECONCILED")

    # Identify segment revenue facts for the exact same audited annual duration period.
    # Facts present under a different context period are preserved as mismatch evidence
    # and never silently promoted based on context names such as "Four...".
    segs=[]; period_mismatches=[]
    for f in fs:
        if f["local_name"]!="SegmentRevenue" or f["context_ref"]==cref: continue
        cp=f.get("context") or {}
        members=cp.get("members") or []
        if not members: continue
        desc=one(fs,"DescriptionOfReportableSegment",f["context_ref"])
        if not desc: continue
        if cp.get("start")!=b["start"] or cp.get("end")!=b["end"]:
            period_mismatches.append({
              "context_ref":f["context_ref"],"description":clean(desc["value"]),
              "context_start":cp.get("start"),"context_end":cp.get("end"),
              "selected_annual_start":b["start"],"selected_annual_end":b["end"],
              "segment_revenue":str(scaled_value(f)) if scaled_value(f) is not None else None,
              "unit_ref":f.get("unit_ref"),"decimals":f.get("decimals"),"scale":f.get("scale")
            })
            continue
        fv=scaled_value(f)
        ext_rows=[x for x in fs if x["context_ref"]==f["context_ref"] and re.search(r"external.*revenue|revenue.*external",x["local_name"],re.I)]
        ext=ext_rows[0] if len(ext_rows)==1 else None
        extv=scaled_value(ext) if ext else None
        if ext and (not compatible_unit(ext,denom)): extv=None
        segs.append({
          "context_ref":f["context_ref"],"description":clean(desc["value"]),
          "segment_revenue":str(fv) if fv is not None else None,
          "segment_revenue_unit":f.get("unit_ref"),"segment_revenue_decimals":f.get("decimals"),"segment_revenue_scale":f.get("scale"),
          "explicit_external_revenue":str(extv) if extv is not None else None,
          "_gross":fv,"_external":extv
        })
    # deterministic dedupe by context; segment contexts should be unique.
    segs.sort(key=lambda x:x["context_ref"])
    inter_zero=iv is not None and abs(iv)<=half_quantum(inter)
    for s in segs:
        comparable=None; basis=None; sblock=[]
        if s["_external"] is not None:
            comparable=s["_external"]; basis="EXPLICIT_SEGMENT_EXTERNAL_REVENUE"
        elif inter_zero:
            comparable=s["_gross"]; basis="GROSS_EQUALS_EXTERNAL_BECAUSE_AGGREGATE_INTERSEGMENT_IS_ZERO"
        else:
            sblock.append("SEGMENT_EXTERNAL_REVENUE_UNRESOLVED")
        ratio=(comparable/dv) if comparable is not None and dv is not None and dv>0 and comparable>=0 else None
        if comparable is not None and comparable<0: sblock.append("NEGATIVE_SEGMENT_REVENUE")
        s["comparable_external_revenue"]=str(comparable) if comparable is not None else None
        s["comparable_basis"]=basis
        s["dominance_ratio"]=str(ratio) if ratio is not None else None
        s["strict_gt_50"]=bool(ratio is not None and ratio>Decimal("0.5"))
        s["exactly_50"]=bool(ratio is not None and ratio==Decimal("0.5"))
        s["blockers"]=sblock
        s.pop("_gross",None); s.pop("_external",None)
    dominant=[s for s in segs if s["strict_gt_50"] and not s["blockers"]]
    if len(dominant)>1: blockers.append("MULTIPLE_GT50_SEGMENTS_INTERNAL_INCONSISTENCY")
    state="ACCOUNTING_RECONCILED"
    if not segs and period_mismatches:
        blockers.append("REPORTABLE_SEGMENT_FACTS_PRESENT_BUT_PERIOD_CONTEXT_MISMATCH")
    if blockers: state="ACCOUNTING_BLOCKED"
    elif not segs: state="NO_REPORTABLE_SEGMENT_REVENUE"
    elif not dominant: state="NO_DOMINANT_BUSINESS_UNDER_CANDIDATE"
    elif len(dominant)==1: state="DOMINANT_BUSINESS_CANDIDATE"
    return {
      "state":state,"base":b,
      "total_segment_revenue":str(tv) if tv is not None else None,
      "intersegment_revenue":str(iv) if iv is not None else None,
      "company_revenue":str(dv) if dv is not None else None,
      "unit":denom.get("unit_ref"),"reconciliation_residual":str(residual) if residual is not None else None,
      "reconciliation_tolerance":str(tolerance),"reconciled":reconciled,
      "aggregate_intersegment_is_zero":inter_zero,
      "segments":segs,"segment_period_mismatch_evidence":period_mismatches,"dominant_segments":dominant,"blockers":sorted(set(blockers))
    }

def taxonomy_index(tax):
    nodes=tax["nodes"]; by={n["code"]:n for n in nodes}
    basic={norm(n["name"]):n for n in nodes if n["level"]=="BASIC_INDUSTRY"}
    def path(code):
        out=[]; cur=code
        while cur:
            n=by[cur]; out.append(n); cur=n.get("parent_code")
        return list(reversed(out))
    return basic,path

def db_crosswalk():
    db=os.environ["SUPABASE_DB_URL"]
    if "lrgpjimipfkyoqbpsqzz" not in db: raise RuntimeError("wrong Development DB")
    with psycopg.connect(db,connect_timeout=20) as conn, conn.cursor() as cur:
        cur.execute("""select i.id::text,i.code,i.name,s.id::text,s.code,s.name
                       from public.industries i join public.sectors s on s.id=i.sector_id
                       where i.is_active and s.is_active order by i.code""")
        rows=cur.fetchall()
    out={}
    for iid,icode,iname,sid,scode,sname in rows:
        rec={"applicationIndustry":iname,"applicationIndustryCode":icode,"applicationSector":sname,"applicationSectorCode":scode}
        for v in (iname,icode): out[norm(v)]=rec
    return out

def classify(accounting_,basic,pathfn,crosswalk,adopted,policies):
    result={"candidate_classification":None,"authoritative_classification":None,"route_input":None,"blockers":[]}
    if accounting_.get("state")!="DOMINANT_BUSINESS_CANDIDATE":
        result["blockers"].append("NO_VALID_DOMINANT_BUSINESS_CANDIDATE")
        return result
    dom=accounting_["dominant_segments"]
    if len(dom)!=1:
        result["blockers"].append("DOMINANT_SEGMENT_NOT_UNIQUE"); return result
    seg=dom[0]; leaf=basic.get(norm(seg["description"]))
    if not leaf:
        result["blockers"].append("DOMINANT_SEGMENT_BASIC_INDUSTRY_EXACT_MAPPING_MISSING_OD2_REQUIRED")
        return result
    path=pathfn(leaf["code"])
    result["candidate_classification"]={"segment_description":seg["description"],"ratio":seg["dominance_ratio"],"taxonomy_path":path,"rule":"STRICT_GT_50_EXACT_BASIC_INDUSTRY_V1"}
    # Application router consumes the canonical application sector/industry, not raw NSE hierarchy.
    cw=crosswalk.get(norm(leaf["name"]))
    if not cw:
        # Try NSE Industry exact name as a second exact-only crosswalk.
        ni=next((x for x in path if x["level"]=="INDUSTRY"),None)
        cw=crosswalk.get(norm(ni["name"])) if ni else None
    if cw: result["route_input"]={"assetClass":"EQUITY",**cw}
    else: result["blockers"].append("APPLICATION_CLASSIFICATION_CROSSWALK_UNRESOLVED")
    policy_ok=adopted and all(policies.get(k)=="APPROVED" for k in ("OD1","OD2","OD3")) and policies.get("OD4") in ("BLOCKED","APPROVED_BLOCK")
    if policy_ok:
        result["authoritative_classification"]=result["candidate_classification"]
    else:
        result["blockers"].append("OD1_OD3_OR_TAXONOMY_ADOPTION_PENDING")
    return result

def main():
    cb=CONTRACT.read_bytes()
    if git_blob_sha(cb)!=EXPECTED_CONTRACT_BLOB: raise RuntimeError("frozen contract changed")
    contract=json.loads(cb); can=json.loads(CANARY.read_text()); tax=json.loads(TAX.read_text()); adoption=json.loads(MANIFEST.read_text())
    if can["membership_fingerprint_sha256"]!=EXPECTED_CANARY_FP: raise RuntimeError("canary fingerprint drift")
    c=s3()
    sm=read(c,SOURCE_MANIFEST_KEY)
    if sha256(sm)!=SOURCE_MANIFEST_SHA: raise RuntimeError("source manifest hash mismatch")
    rows=[json.loads(x) for x in sm.decode().splitlines() if x.strip()]
    byid=defaultdict(list)
    for r in rows:
        hid=str(r.get("historical_identity_id") or "")
        if hid: byid[hid].append(r)
    basic,pathfn=taxonomy_index(tax); crosswalk=db_crosswalk()
    policies=adoption.get("owner_policy_status",{})
    adopted=adoption.get("adopted_as_portfolioai_historical_authority") is True
    source_results=[]; class_results=[]; counts=Counter()
    for m in can["members"]:
        hid=m["historical_identity_id"]; decision=m["decision_at"]
        selected,cands,errs=select_annual_source(c,byid.get(hid,[]),decision)
        acct_=accounting(selected)
        if selected:
            src=selected["src"]; selected_meta={
              "r2_key":src["r2_key"],"sha256":src["sha256"],"disseminated_at":src.get("time"),"identity_mode":src.get("mode"),
              "period":selected["base"],"eligible_annual_candidate_count":len(cands)
            }
        else: selected_meta=None
        source_results.append({
          "historical_identity_id":hid,"historical_isin":m["historical_isin"],"decision_at":decision,
          "canary_stratum":m["canary_stratum"],"all_source_rows_for_identity":len(byid.get(hid,[])),
          "eligible_audited_consolidated_annual_contexts":len(cands),"selected_source":selected_meta,
          "source_parse_blockers":errs,"accounting":acct_
        })
        cr=classify(acct_,basic,pathfn,crosswalk,adopted,policies)
        class_results.append({
          "historical_identity_id":hid,"historical_isin":m["historical_isin"],"decision_at":decision,"canary_stratum":m["canary_stratum"],
          "accounting_state":acct_.get("state"),**cr,
          "authoritative_policy_adopted":bool(cr["authoritative_classification"])
        })
        counts["SEMANTIC_CANARY_PAIRS"]+=1
        counts["ELIGIBLE_AUDITED_CONSOLIDATED_ANNUAL"]+=bool(selected)
        counts["ACCOUNTING_RECONCILED"]+=acct_.get("reconciled") is True and not acct_.get("blockers")
        counts["COMPARABLE_SEGMENT_REVENUE"]+=any(not s.get("blockers") and s.get("dominance_ratio") is not None for s in acct_.get("segments",[]))
        counts["DOMINANT_BUSINESS_CANDIDATE"]+=acct_.get("state")=="DOMINANT_BUSINESS_CANDIDATE"
        counts["CANDIDATE_COMPLETE_CLASSIFICATION"]+=cr["candidate_classification"] is not None
        counts["AUTHORITATIVE_COMPLETE_CLASSIFICATION"]+=cr["authoritative_classification"] is not None
        counts["ROUTE_INPUT_READY_CANDIDATE"]+=cr["route_input"] is not None
        if m["canary_stratum"].startswith("UNRESOLVED_EVIDENCE") and cr["authoritative_classification"] is not None:
            counts["NEGATIVE_CONTROL_PROMOTED"]+=1
    source_results.sort(key=lambda x:(x["canary_stratum"],x["historical_identity_id"],x["decision_at"]))
    class_results.sort(key=lambda x:(x["canary_stratum"],x["historical_identity_id"],x["decision_at"]))
    source_core={
      "version":VERSION,"contract_version":contract["contract_version"],"contract_git_blob_sha":EXPECTED_CONTRACT_BLOB,
      "canary_fingerprint":can["membership_fingerprint_sha256"],"source_manifest_sha256":SOURCE_MANIFEST_SHA,
      "counts":dict(counts),"results":source_results
    }
    sfp=stable(source_core)
    SOURCE_OUT.write_text(json.dumps({**source_core,"deterministic_fingerprint_sha256":sfp,"repeat_fingerprint_sha256":stable(json.loads(json.dumps(source_core,sort_keys=True,default=str)))},indent=2,sort_keys=True)+"\n")
    class_core={
      "version":"P8_SEGMENT_REVENUE_CANARY_CLASSIFICATION_V1","contract_version":contract["contract_version"],
      "policy_status":{"taxonomy_adopted":adopted,"owner_policy_status":policies},
      "counts":dict(counts),"results":class_results,
      "router_authority":{"path":"src/features/research/researchProfileRouting.ts","version":"RESEARCH_PROFILE_ROUTING_V2"},
      "metric_registry":{"path":"docs/p7-ic/PortfolioAI_P7_IC1_METHODOLOGY_R7_REGISTRY_V1.json"}
    }
    cfp=stable(class_core)
    CLASS_OUT.write_text(json.dumps({**class_core,"pre_router_fingerprint_sha256":cfp},indent=2,sort_keys=True)+"\n")
    print(json.dumps({"counts":dict(counts),"source_fingerprint":sfp,"classification_pre_router_fingerprint":cfp},indent=2,sort_keys=True))

if __name__=="__main__": main()
