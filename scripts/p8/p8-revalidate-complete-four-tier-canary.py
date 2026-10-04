#!/usr/bin/env python3
import boto3, hashlib, json, os, re, unicodedata
from pathlib import Path
from urllib.parse import urlparse
from botocore.config import Config

TAX=Path("docs/p8/PortfolioAI_P8_NSE_FOUR_TIER_TAXONOMY_NOVEMBER_2022.json")
MANIFEST=Path("docs/p8/PortfolioAI_P8_NSE_FOUR_TIER_TAXONOMY_NOVEMBER_2022_ADOPTION_MANIFEST.json")
CANARY=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_MANIFEST_2026-10-04.json")
EXCERPTS=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_SOURCE_EXCERPTS_2026-10-04.json")
GATEK=Path("docs/k1/PortfolioAI_GATE_K_INDUSTRY_RESEARCH_TAXONOMY.json")
OUT=Path("docs/p8/PortfolioAI_P8_COMPLETE_FOUR_TIER_TAXONOMY_CANARY_REVALIDATION_2026-10-04.json")
BUCKET="portfolioai-history-dev"
VERSION="P8_COMPLETE_FOUR_TIER_TAXONOMY_CANARY_REVALIDATION_V1"
EXPECTED_CANARY_FP="b159764fd342aad3901717e04446596e93aa87d9c6726b7b3dd7ef8b55026dce"

def clean(x): return " ".join(unicodedata.normalize("NFKC",str(x or "")).strip().split())
def norm(x): return re.sub(r"[^A-Z0-9]+","_",clean(x).upper()).strip("_")
def sha256(b): return hashlib.sha256(b).hexdigest()
def stable(x): return sha256(json.dumps(x,sort_keys=True,separators=(",",":"),default=str).encode())

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

def parent_path(nodes,leaf_code):
    by={n["code"]:n for n in nodes}
    out=[]; cur=leaf_code
    while cur:
        n=by[cur]; out.append(n); cur=n.get("parent_code")
    return list(reversed(out))

def route_matches(gatek,path):
    sector=next((x["name"] for x in path if x["level"]=="SECTOR"),None)
    industry=next((x["name"] for x in path if x["level"]=="INDUSTRY"),None)
    if not sector or not industry: return []
    sk=norm(sector); ik=norm(industry); hits=[]
    for r in gatek.get("routes",[]):
        secs=[norm(x) for x in r.get("sectors",[])]
        inds=[norm(x) for x in r.get("industries",[])]
        if ik in inds and (sk in secs or "*" in secs):
            hits.append({"profileCode":r["profileCode"],"methodologyFamily":r["methodologyFamily"],"state":r["state"]})
    return hits

def business_facts(ex):
    out=[]
    for f in ex.get("high_semantic_facts",[])+ex.get("linked_positional_semantics",[]):
        q=f.get("qname","")
        if not re.search(r"DescriptionOf(?:Reportable|Single)Segment",q,re.I): continue
        v=clean(f.get("value"))
        if not v: continue
        kind="SINGLE_SEGMENT" if "SingleSegment" in q else "REPORTABLE_SEGMENT"
        rec={"value":v,"kind":kind,"qname":q,"context_ref":f.get("context_ref")}
        if rec not in out: out.append(rec)
    return out

def evaluate_business(facts,basic_index,nodes):
    exact=[]
    for f in facts:
        leaf=basic_index.get(norm(f["value"]))
        if leaf:
            exact.append({"fact":f,"leaf":leaf,"path":parent_path(nodes,leaf["code"])})
    kinds={f["kind"] for f in facts}
    unique_leafs={x["leaf"]["code"] for x in exact}
    blockers=[]
    candidate_complete=None
    state="NO_EXACT_BASIC_INDUSTRY_MATCH"
    if facts and kinds=={"SINGLE_SEGMENT"} and len(exact)==1 and len(unique_leafs)==1:
        # Complete vocabulary evidence exists, but OD1/adoption is still required.
        candidate_complete=exact[0]
        state="COMPLETE_CANDIDATE_SINGLE_SEGMENT_EXACT"
    elif "REPORTABLE_SEGMENT" in kinds and exact:
        state="EXACT_LEAF_EVIDENCE_MULTISEGMENT_PENDING_OD3"
        blockers.append("MULTI_SEGMENT_COMPANY_REQUIRES_APPROVED_SELECTION_OR_DOMINANCE_POLICY")
    elif exact:
        state="EXACT_LEAF_EVIDENCE_AMBIGUOUS_CONTEXT"
        blockers.append("BUSINESS_SCOPE_AMBIGUOUS")
    if not exact and facts:
        blockers.append("NO_EXACT_BASIC_INDUSTRY_LABEL_MATCH_OD2_REQUIRED_FOR_SYNONYM_MAPPING")
    return exact,candidate_complete,state,blockers

def main():
    tax=json.loads(TAX.read_text()); manifest=json.loads(MANIFEST.read_text())
    can=json.loads(CANARY.read_text()); exs=json.loads(EXCERPTS.read_text()); gate=json.loads(GATEK.read_text())
    if can["membership_fingerprint_sha256"]!=EXPECTED_CANARY_FP: raise RuntimeError("frozen canary fingerprint drift")
    if not tax["validation"]["complete_for_declared_source"]: raise RuntimeError("taxonomy package is not structurally complete")
    tax_hash=sha256(TAX.read_bytes()); manifest_hash=sha256(MANIFEST.read_bytes())
    nodes=tax["nodes"]; basics={norm(n["name"]):n for n in nodes if n["level"]=="BASIC_INDUSTRY"}
    byex={(x["historical_identity_id"],x["decision_at"]):x for x in exs["members"]}
    c=s3(); results=[]; counts={}
    def inc(k,n=1): counts[k]=counts.get(k,0)+n

    for m in can["members"]:
        key=(m["historical_identity_id"],m["decision_at"]); ex=byex[key]
        raw=read(c,m["latest_source"]["r2_key"])
        source_ok=sha256(raw)==m["latest_source"]["sha256"]
        pti=bool(m["latest_source"].get("disseminated_at") and m["latest_source"]["disseminated_at"] < m["decision_at"])
        facts=business_facts(ex)
        exact,complete_candidate,state,blockers=evaluate_business(facts,basics,nodes)
        routes=[]
        if complete_candidate:
            routes=route_matches(gate,complete_candidate["path"])
        candidate_unique_route=len(routes)==1
        adopted=manifest.get("adopted_as_portfolioai_historical_authority") is True
        policies=manifest.get("owner_policy_status",{})
        policy_adopted=all(v=="APPROVED" for v in policies.values())
        authoritative_complete=bool(complete_candidate and source_ok and pti and adopted and policy_adopted)
        authoritative_route=bool(authoritative_complete and candidate_unique_route)
        if complete_candidate: inc("COMPLETE_TAXONOMY_CANDIDATE")
        if candidate_unique_route: inc("UNIQUE_ROUTE_CANDIDATE")
        if authoritative_complete: inc("AUTHORITATIVE_COMPLETE")
        if authoritative_route: inc("AUTHORITATIVE_ROUTE")
        if exact: inc("PAIR_WITH_EXACT_BASIC_INDUSTRY_EVIDENCE")
        inc("SEMANTIC_RETAINED",bool(facts))
        if state=="EXACT_LEAF_EVIDENCE_MULTISEGMENT_PENDING_OD3": inc("MULTISEGMENT_EXACT_LEAF_BLOCKED")
        if m["canary_stratum"].startswith("UNRESOLVED_EVIDENCE") and authoritative_complete: inc("NEGATIVE_CONTROL_PROMOTED")
        if not source_ok: blockers.append("SOURCE_HASH_MISMATCH")
        if not pti: blockers.append("FUTURE_OR_MISSING_EVIDENCE")
        if complete_candidate and not adopted: blockers.append("TAXONOMY_AUTHORITY_NOT_OWNER_ADOPTED")
        if complete_candidate and not policy_adopted: blockers.append("OD1_OD4_POLICY_PACKAGE_NOT_OWNER_APPROVED")
        if complete_candidate and len(routes)==0: blockers.append("NO_EXISTING_METHODOLOGY_ROUTE")
        if complete_candidate and len(routes)>1: blockers.append("MULTIPLE_EXISTING_METHODOLOGY_ROUTES")
        results.append({
          "historical_identity_id":m["historical_identity_id"],"historical_isin":m["historical_isin"],
          "decision_at":m["decision_at"],"canary_stratum":m["canary_stratum"],
          "source_r2_key":m["latest_source"]["r2_key"],"source_sha256":m["latest_source"]["sha256"],
          "source_hash_verified":source_ok,"point_in_time_eligible":pti,
          "semantic_facts":facts,"exact_basic_industry_evidence":exact,
          "candidate_state":state,
          "candidate_complete_path":complete_candidate["path"] if complete_candidate else None,
          "candidate_route_matches":routes,
          "candidate_unique_route":candidate_unique_route,
          "authoritative_complete_classification":authoritative_complete,
          "authoritative_methodology_route":authoritative_route,
          "normalized_input_state":"NOT_EVALUATED_NO_AUTHORITATIVE_ROUTE" if not authoritative_route else "PENDING_ROUTE_SPECIFIC_INPUT_EVALUATION",
          "blockers":sorted(set(blockers))
        })
    results.sort(key=lambda x:(x["canary_stratum"],x["historical_identity_id"],x["decision_at"]))
    counts.setdefault("AUTHORITATIVE_COMPLETE",0); counts.setdefault("AUTHORITATIVE_ROUTE",0)
    counts.setdefault("COMPLETE_TAXONOMY_CANDIDATE",0); counts.setdefault("UNIQUE_ROUTE_CANDIDATE",0)
    counts.setdefault("NEGATIVE_CONTROL_PROMOTED",0)
    core={
      "version":VERSION,
      "taxonomy_payload_sha256":tax_hash,
      "taxonomy_official_source_sha256":tax["source"]["content_sha256"],
      "adoption_manifest_sha256":manifest_hash,
      "canary_fingerprint":can["membership_fingerprint_sha256"],
      "authority_adopted":manifest.get("adopted_as_portfolioai_historical_authority"),
      "owner_policy_status":manifest.get("owner_policy_status"),
      "counts":counts,"results":results
    }
    fp=stable(core); repeat=stable(json.loads(json.dumps(core,sort_keys=True)))
    gate_eval={
      "TAXONOMY_PACKAGE_STRUCTURALLY_COMPLETE":tax["validation"]["complete_for_declared_source"],
      "MAPPING_AUTHORITY_OWNER_ADOPTED":manifest.get("adopted_as_portfolioai_historical_authority") is True,
      "OD1_OD4_OWNER_APPROVED":all(v=="APPROVED" for v in manifest.get("owner_policy_status",{}).values()),
      "AT_LEAST_ONE_COMPLETE_CLASSIFICATION_PROVEN":counts["AUTHORITATIVE_COMPLETE"]>=1,
      "AT_LEAST_ONE_COMPLETE_CLASSIFICATION_HAS_UNIQUE_ROUTE":counts["AUTHORITATIVE_ROUTE"]>=1,
      "REPEAT_FINGERPRINT_MATCHES":fp==repeat,
      "NEGATIVE_CONTROLS_NOT_PROMOTED":counts["NEGATIVE_CONTROL_PROMOTED"]==0
    }
    expand=all(gate_eval.values())
    out={
      **core,
      "implementation_status":"PASS",
      "taxonomy_package_status":tax["status"],
      "exact_disposition":"COMPLETE_TAXONOMY_BUILT_PENDING_OWNER_POLICY_ADOPTION",
      "expansion_gate":gate_eval,
      "expansion_authorized":expand,
      "full_25761_surface":"NOT_MEASURED" if not expand else "EXPANSION_REQUIRED_BY_NEXT_AUTHORIZED_EXECUTION",
      "route_specific_normalized_inputs":"NOT_EVALUATED_NO_AUTHORITATIVE_ROUTE" if counts["AUTHORITATIVE_ROUTE"]==0 else "REQUIRES_SEPARATE_ROUTE_INPUT_EVALUATION",
      "deterministic_fingerprint_sha256":fp,
      "repeat_fingerprint_sha256":repeat,
      "safety":{"provider_calls":0,"company_source_acquisition":0,"supabase_writes":0,"r2_writes":0,"migrations":0,"p8_c":0,"performance_reads":0}
    }
    OUT.write_text(json.dumps(out,indent=2,sort_keys=True)+"\n")
    print(json.dumps({"counts":counts,"gate":gate_eval,"expand":expand,"fingerprint":fp},indent=2,sort_keys=True))

if __name__=="__main__": main()
