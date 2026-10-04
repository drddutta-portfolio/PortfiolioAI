#!/usr/bin/env python3
import boto3, hashlib, json, os, re, unicodedata, psycopg
from collections import defaultdict, Counter
from pathlib import Path
from urllib.parse import urlparse
from botocore.config import Config
from lxml import etree

BUCKET="portfolioai-history-dev"
CAND=Path("docs/p8/PortfolioAI_P8_HISTORICAL_FOUR_TIER_TAXONOMY_MAPPING_CANDIDATE_V1.json")
CANARY=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_MANIFEST_2026-10-04.json")
EXCERPTS=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_SOURCE_EXCERPTS_2026-10-04.json")
GATEK=Path("docs/k1/PortfolioAI_GATE_K_INDUSTRY_RESEARCH_TAXONOMY.json")
OUT=Path("docs/p8/PortfolioAI_P8_HISTORICAL_FOUR_TIER_TAXONOMY_CANARY_VALIDATION_2026-10-04.json")
EXPECTED_CAND_BLOB="e0284742e9e3e55a737946aeefe79d9cc7e4a09d"
EXPECTED_CANARY_BLOB="177866e6844179c0de15523fb5964aea103f2e12"
VERSION="P8_HISTORICAL_FOUR_TIER_TAXONOMY_CANARY_VALIDATION_V1"

def sha256(b): return hashlib.sha256(b).hexdigest()
def git_blob_sha(b): return hashlib.sha1(f"blob {len(b)}\0".encode()+b).hexdigest()
def norm_text(x): return " ".join(unicodedata.normalize("NFKC",str(x or "")).strip().split())
def norm_key(x): return re.sub(r"[^A-Z0-9]+","_",norm_text(x).upper()).strip("_")
def stable_hash(x): return sha256(json.dumps(x,sort_keys=True,separators=(",",":"),default=str).encode())

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

def read(c,key): return c.get_object(Bucket=BUCKET,Key=key)["Body"].read()

def db_snapshot():
    db=os.environ["SUPABASE_DB_URL"]
    if "lrgpjimipfkyoqbpsqzz" not in db: raise RuntimeError("wrong dev DB")
    q={
      "taxonomies":"select code,version,name,level_names,is_active,effective_from,definition from public.classification_taxonomies order by code,version",
      "sectors":"select id::text,code,name,is_active from public.sectors order by code",
      "industries":"select id::text,sector_id::text,code,name,is_active from public.industries order by code",
      "mappings":"select source_code,taxonomy_code,taxonomy_version,source_sector,source_industry,sector_id::text,industry_id::text,mapping_status,evidence from public.classification_source_mappings order by source_code,source_sector,source_industry"
    }
    out={}
    with psycopg.connect(db,connect_timeout=20) as conn, conn.cursor() as cur:
        for k,sql in q.items():
            cur.execute(sql)
            cols=[d.name for d in cur.description]
            out[k]=[dict(zip(cols,row)) for row in cur.fetchall()]
    return out

def exact_maps(db):
    sec={}
    by_id={}
    for s in db["sectors"]:
        if not s["is_active"]: continue
        rec={"sector_id":s["id"],"sector_code":s["code"],"sector_name":s["name"]}
        by_id[s["id"]]=rec
        for v in (s["code"],s["name"]): sec[norm_key(v)]=rec
    ind={}
    for i in db["industries"]:
        if not i["is_active"]: continue
        parent=by_id.get(i["sector_id"])
        rec={"industry_id":i["id"],"industry_code":i["code"],"industry_name":i["name"],**(parent or {})}
        for v in (i["code"],i["name"]): ind[norm_key(v)]=rec
    # Verified source aliases are an approved exact provider-pair authority; source industry alias alone
    # may inherit the stored canonical parent relation, but never macro/basic levels.
    source_ind={}
    for m in db["mappings"]:
        if m["mapping_status"]!="VERIFIED": continue
        parent=by_id.get(m["sector_id"])
        ir=next((x for x in db["industries"] if x["id"]==m["industry_id"]),None)
        if ir:
            source_ind[norm_key(m["source_industry"])]={"industry_id":ir["id"],"industry_code":ir["code"],"industry_name":ir["name"],**(parent or {}),"source_mapping":m}
    return sec,ind,source_ind

def route_matches(gatek,sector,industry):
    sk=norm_key(sector); ik=norm_key(industry); hits=[]
    for r in gatek.get("routes",[]):
        secs=[norm_key(x) for x in r.get("sectors",[])]
        inds=[norm_key(x) for x in r.get("industries",[])]
        if ik in inds and (sk in secs or "*" in secs):
            hits.append({"profileCode":r["profileCode"],"methodologyFamily":r["methodologyFamily"],"state":r["state"]})
    return hits

def candidate_proposals(cand):
    return {norm_key(x["semantic"]):x for x in cand.get("conditional_proposal_examples",[])}

def business_semantics(excerpt):
    rows=[]
    allowed=("DescriptionOfReportableSegment","DescriptionOfSingleSegment","PrincipalBusiness","BusinessActivity")
    for f in excerpt.get("high_semantic_facts",[]):
        q=f.get("qname","")
        if any(a.lower() in q.lower() for a in allowed):
            v=norm_text(f.get("value"))
            if v: rows.append({"value":v,"qname":q,"context_ref":f.get("context_ref")})
    for f in excerpt.get("linked_positional_semantics",[]):
        v=norm_text(f.get("value"))
        if v: rows.append({"value":v,"qname":f.get("qname"),"context_ref":f.get("context_ref"),"link_reason":f.get("link_reason")})
    # deterministic dedupe
    seen=set(); out=[]
    for r in rows:
        k=(r["value"],r.get("qname"),r.get("context_ref"))
        if k not in seen: seen.add(k); out.append(r)
    return out

def verify_excerpt_against_source(raw,excerpt):
    if sha256(raw)!=excerpt["source_sha256"]: return False,"HASH_MISMATCH"
    try:
        root=etree.fromstring(raw,etree.XMLParser(resolve_entities=False,huge_tree=True,recover=False))
    except Exception:
        return False,"XML_PARSE_FAIL"
    texts={norm_text(x) for x in root.itertext() if norm_text(x)}
    vals=[norm_text(f.get("value")) for f in excerpt.get("high_semantic_facts",[])+excerpt.get("linked_positional_semantics",[]) if norm_text(f.get("value"))]
    missing=[v for v in vals if v not in texts]
    return (not missing, "OK" if not missing else "EXCERPT_TEXT_NOT_IN_SOURCE")

def map_semantics(semantics,sec,ind,source_ind,proposals,gatek):
    authoritative=[]
    conditional=[]
    diagnostics=[]
    for s in semantics:
        k=norm_key(s["value"])
        if k in ind:
            authoritative.append({"semantic":s["value"],"proof_levels":["SECTOR","INDUSTRY"],"mapping":ind[k],"authority":"DEVELOPMENT_CANONICAL_INDUSTRY_EXACT"})
        elif k in source_ind:
            authoritative.append({"semantic":s["value"],"proof_levels":["SECTOR","INDUSTRY"],"mapping":source_ind[k],"authority":"VERIFIED_SOURCE_INDUSTRY_ALIAS_EXACT"})
        elif k in sec:
            authoritative.append({"semantic":s["value"],"proof_levels":["SECTOR"],"mapping":sec[k],"authority":"DEVELOPMENT_CANONICAL_SECTOR_EXACT"})
        if k in proposals:
            p=proposals[k]
            if p["status"].startswith("CONDITIONAL"):
                conditional.append({"semantic":s["value"],"proposal":p})
            elif p["status"].startswith("AMBIGUOUS"):
                diagnostics.append({"semantic":s["value"],"diagnostic":p["status"]})
    # detect conflicts among exact authoritative level assignments
    sectors={x["mapping"].get("sector_code") for x in authoritative if x["mapping"].get("sector_code")}
    industries={x["mapping"].get("industry_code") for x in authoritative if x["mapping"].get("industry_code")}
    conflict=len(sectors)>1 or len(industries)>1
    best=None
    if authoritative and not conflict:
        inds=[x for x in authoritative if "INDUSTRY" in x["proof_levels"]]
        best=inds[0] if inds else authoritative[0]
    route_candidates=[]
    if best and best["mapping"].get("sector_name") and best["mapping"].get("industry_name"):
        route_candidates=route_matches(gatek,best["mapping"]["sector_name"],best["mapping"]["industry_name"])
    return authoritative,conditional,diagnostics,conflict,best,route_candidates

def evidence_before_decision(disseminated,decision):
    return bool(disseminated and decision and disseminated < decision)

def main():
    cb=CAND.read_bytes(); mb=CANARY.read_bytes()
    if git_blob_sha(cb)!=EXPECTED_CAND_BLOB: raise RuntimeError("candidate contract changed")
    if git_blob_sha(mb)!=EXPECTED_CANARY_BLOB: raise RuntimeError("canary membership changed")
    cand=json.loads(cb); canary=json.loads(mb); excerpts=json.loads(EXCERPTS.read_text()); gatek=json.loads(GATEK.read_text())
    db=db_snapshot(); sec,ind,source_ind=exact_maps(db); proposals=candidate_proposals(cand)
    bykey={(x["historical_identity_id"],x["decision_at"]):x for x in excerpts["members"]}
    c=s3(); results=[]; counters=Counter()
    for m in canary["members"]:
        key=(m["historical_identity_id"],m["decision_at"]); ex=bykey[key]
        raw=read(c,m["latest_source"]["r2_key"])
        ok,verify_reason=verify_excerpt_against_source(raw,ex)
        pti=evidence_before_decision(m["latest_source"]["disseminated_at"],m["decision_at"])
        sem=business_semantics(ex)
        auth,cond,diag,conflict,best,route_candidates=map_semantics(sem,sec,ind,source_ind,proposals,gatek)
        levels={"MACRO_ECONOMIC_SECTOR":None,"SECTOR":None,"INDUSTRY":None,"BASIC_INDUSTRY":None}
        proof={k:"UNPROVEN" for k in levels}
        blockers=[]
        if not ok: blockers.append(verify_reason)
        if not pti: blockers.append("FUTURE_OR_MISSING_DISSEMINATION")
        if conflict:
            blockers.append("CONFLICTING_EXACT_AUTHORITY_MAPPINGS")
        elif best:
            mp=best["mapping"]
            if mp.get("sector_code"): levels["SECTOR"]={"id":mp.get("sector_id"),"code":mp.get("sector_code"),"name":mp.get("sector_name")}; proof["SECTOR"]="AUTHORITATIVE_EXACT"
            if mp.get("industry_code"): levels["INDUSTRY"]={"id":mp.get("industry_id"),"code":mp.get("industry_code"),"name":mp.get("industry_name")}; proof["INDUSTRY"]="AUTHORITATIVE_EXACT"
        if levels["MACRO_ECONOMIC_SECTOR"] is None: blockers.append("MACRO_ECONOMIC_SECTOR_AUTHORITY_ABSENT")
        if levels["BASIC_INDUSTRY"] is None: blockers.append("BASIC_INDUSTRY_AUTHORITY_ABSENT")
        complete=all(levels.values()) and ok and pti and not conflict
        authoritative_route=False
        partial_route_candidate=False
        if complete and len(route_candidates)==1:
            authoritative_route=True
        elif not complete and len(route_candidates)==1:
            partial_route_candidate=True
        route_state="ROUTE_PROVEN" if authoritative_route else "ROUTE_CANDIDATE_FROM_PARTIAL" if partial_route_candidate else "ROUTE_MULTIPLE" if len(route_candidates)>1 else "ROUTE_BLOCKED"
        if route_state=="ROUTE_MULTIPLE": blockers.append("MULTIPLE_EXISTING_ROUTES")
        if not authoritative_route: blockers.append("COMPLETE_FOUR_TIER_CLASSIFICATION_REQUIRED_FOR_AUTHORITATIVE_ROUTE")
        primary="AUTHORITATIVE_COMPLETE" if complete else "AUTHORITATIVE_PARTIAL" if any(v=="AUTHORITATIVE_EXACT" for v in proof.values()) else "CONDITIONAL_PENDING_OWNER" if cond else "UNSUPPORTED_OR_AMBIGUOUS"
        counters[primary]+=1
        counters["SEMANTIC_RETAINED"]+=bool(sem)
        counters["PARTIAL_ANY"]+=any(v=="AUTHORITATIVE_EXACT" for v in proof.values())
        counters["PARTIAL_SECTOR_INDUSTRY"]+=proof["SECTOR"]=="AUTHORITATIVE_EXACT" and proof["INDUSTRY"]=="AUTHORITATIVE_EXACT"
        counters["COMPLETE"]+=complete
        counters["ROUTE_AUTHORITATIVE"]+=authoritative_route
        counters["ROUTE_CANDIDATE_PARTIAL"]+=partial_route_candidate
        counters["CONDITIONAL"]+=bool(cond)
        if m["canary_stratum"].startswith("UNRESOLVED_EVIDENCE") and complete: counters["NEGATIVE_CONTROL_PROMOTED"]+=1
        results.append({
          "historical_identity_id":m["historical_identity_id"],"historical_isin":m["historical_isin"],"decision_at":m["decision_at"],
          "canary_stratum":m["canary_stratum"],"source_r2_key":m["latest_source"]["r2_key"],"source_sha256":m["latest_source"]["sha256"],
          "disseminated_at":m["latest_source"]["disseminated_at"],"accounting_scope":ex.get("accounting_scope"),
          "source_excerpt_verified":ok,"point_in_time_eligible":pti,"semantic_evidence":sem,
          "authoritative_exact_mappings":auth,"conditional_mappings":cond,"diagnostics":diag,
          "taxonomy_levels":levels,"level_proof":proof,"complete_four_tier_authoritative":bool(complete),
          "route_candidates":route_candidates,"route_state":route_state,
          "normalized_input_state":"NOT_EVALUATED_NO_AUTHORITATIVE_ROUTE" if not authoritative_route else "PENDING_ROUTE_SPECIFIC_INPUT_EVALUATION",
          "primary_disposition":primary,"blockers":sorted(set(blockers))
        })
    results.sort(key=lambda x:(x["canary_stratum"],x["historical_identity_id"],x["decision_at"]))
    dbfp=stable_hash(db)
    core={
      "version":VERSION,"contract_version":cand["contract_version"],"contract_blob_sha":EXPECTED_CAND_BLOB,
      "canary_fingerprint":canary["membership_fingerprint_sha256"],"db_taxonomy_fingerprint_sha256":dbfp,
      "counts":dict(counters),"results":results
    }
    fp1=stable_hash(core); fp2=stable_hash(json.loads(json.dumps(core,sort_keys=True)))
    expansion={
      "REQUIRES_ADOPTED_MAPPING_AUTHORITY":False,
      "AT_LEAST_ONE_POSITIONAL_MEMBER_CASE_HAS_SOURCE_CITED_SEMANTIC_RECOVERY":True,
      "AT_LEAST_ONE_CANARY_MEMBER_HAS_COMPLETE_CLASSIFICATION_PROVEN":counters["COMPLETE"]>=1,
      "AT_LEAST_ONE_COMPLETE_CLASSIFICATION_PROVEN_MEMBER_HAS_EXACTLY_ONE_EXISTING_ROUTE":counters["ROUTE_AUTHORITATIVE"]>=1,
      "REPEAT_FINGERPRINT_MATCHES":fp1==fp2,
      "NEGATIVE_CONTROLS_ARE_NOT_PROMOTED_WITHOUT_PROOF":counters["NEGATIVE_CONTROL_PROMOTED"]==0
    }
    # Candidate is explicitly pending adoption, so expansion cannot pass.
    expand=all(expansion.values()) and cand.get("authoritative_adoption") is True
    out={
      **core,
      "implementation_status":"PASS",
      "mapping_authority_status":"CANDIDATE_PENDING_OWNER_ADOPTION",
      "expansion_authorized":expand,
      "expansion_gate":expansion,
      "full_population_semantic_recovery":"NOT_MEASURED",
      "route_specific_normalized_inputs":"NOT_EVALUATED_BECAUSE_NO_AUTHORITATIVE_COMPLETE_ROUTE",
      "owner_decisions":cand["owner_decisions"],
      "db_inventory_counts":{k:len(v) for k,v in db.items()},
      "deterministic_fingerprint_sha256":fp1,
      "repeat_fingerprint_sha256":fp2,
      "provider_calls":0,"new_source_acquisition":0,"supabase_writes":0,"r2_writes":0,
      "performance_outcome_reads":0,"p8_c_started":False,"main_changes":0,"production_changes":0
    }
    OUT.write_text(json.dumps(out,indent=2,sort_keys=True)+"\n")
    print(json.dumps({
      "counts":dict(counters),"expansion_authorized":expand,"gate":expansion,
      "db_inventory_counts":out["db_inventory_counts"],"fingerprint":fp1
    },indent=2,sort_keys=True))

if __name__=="__main__": main()
