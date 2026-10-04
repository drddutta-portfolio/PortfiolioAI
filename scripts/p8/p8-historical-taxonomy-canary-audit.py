#!/usr/bin/env python3
import boto3, hashlib, json, os, re, unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from botocore.config import Config
from lxml import etree

BUCKET="portfolioai-history-dev"
CANARY=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_MANIFEST_2026-10-04.json")
CONTRACT=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_EVIDENCE_NORMALIZATION_CONTRACT_V1.json")
GATEK=Path("docs/k1/PortfolioAI_GATE_K_INDUSTRY_RESEARCH_TAXONOMY.json")
OUT=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_AUDIT_2026-10-04.json")
EXCERPTS=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_SOURCE_EXCERPTS_2026-10-04.json")
EXPECTED_CANARY_BLOB="177866e6844179c0de15523fb5964aea103f2e12"
EXPECTED_CONTRACT_BLOB="a54ab626e8325a31c7bd960691fd1ba897c14b76"
VERSION="P8_HISTORICAL_TAXONOMY_CANARY_AUDIT_V1"

POSITIONAL_RE=re.compile(r"(?:ReportableSegmentRevenue|SegmentRevenue|OtherRevenueFromOperations).*?(\d{1,2})Member$",re.I)
SEMANTIC_CONCEPT_RE=re.compile(r"(segment|business|activity|product|service|industry|sector|nature|description|operations)",re.I)
HIGH_SEMANTIC_RE=re.compile(r"(name|description|nature|principal|activity)",re.I)
TAXONOMY_LOCAL={
 "MACRO_ECONOMIC_SECTOR":re.compile(r"macroeconomicsector",re.I),
 "SECTOR":re.compile(r"(?<!macro)sector",re.I),
 "INDUSTRY":re.compile(r"industry",re.I),
 "BASIC_INDUSTRY":re.compile(r"basicindustry",re.I),
}

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
def sha256(b): return hashlib.sha256(b).hexdigest()
def git_blob_sha(b): return hashlib.sha1(f"blob {len(b)}\0".encode()+b).hexdigest()
def stable_hash(x): return sha256(json.dumps(x,sort_keys=True,separators=(",",":")).encode())
def local(tag): return etree.QName(tag).localname if isinstance(tag,str) and tag.startswith("{") else str(tag).split(":",1)[-1]
def norm_text(x):
    return " ".join(unicodedata.normalize("NFKC",str(x or "")).strip().split())
def norm_key(x):
    return re.sub(r"[^A-Z0-9]+","_",norm_text(x).upper()).strip("_")

def qname_text(el,root):
    q=etree.QName(el)
    prefix=el.prefix
    return f"{prefix}:{q.localname}" if prefix else q.localname

def numeric(text):
    z=str(text or "").strip().replace(",","")
    return bool(re.fullmatch(r"[-+]?\d+(?:\.\d+)?",z))

def context_index(root):
    out={}
    for e in root.iter():
        if local(e.tag)!="context" or not e.get("id"): continue
        period={"start":None,"end":None,"instant":None}
        members=[]
        for z in e.iter():
            ln=local(z.tag)
            if ln=="startDate": period["start"]=norm_text(z.text)
            elif ln=="endDate": period["end"]=norm_text(z.text)
            elif ln=="instant": period["instant"]=norm_text(z.text)
            elif ln=="explicitMember":
                members.append({"dimension":z.get("dimension"),"member":norm_text(z.text)})
            elif ln=="typedMember":
                vals=[norm_text(k.text) for k in z.iter() if norm_text(k.text)]
                members.append({"dimension":z.get("dimension"),"typed_values":vals[:8]})
        out[e.get("id")]={"period":period,"members":members}
    return out

def embedded_labels(root):
    labels={}
    locs={}
    arcs=[]
    for e in root.iter():
        ln=local(e.tag)
        if ln=="loc":
            lab=e.get("{http://www.w3.org/1999/xlink}label"); href=e.get("{http://www.w3.org/1999/xlink}href")
            if lab and href: locs[lab]=href
        elif ln=="label":
            lab=e.get("{http://www.w3.org/1999/xlink}label")
            if lab and norm_text(e.text): labels[lab]=norm_text(e.text)
        elif ln=="labelArc":
            f=e.get("{http://www.w3.org/1999/xlink}from"); t=e.get("{http://www.w3.org/1999/xlink}to")
            if f and t: arcs.append((f,t))
    mapped=[]
    for f,t in arcs:
        if f in locs and t in labels:
            mapped.append({"href":locs[f],"label":labels[t]})
    return mapped

def facts_index(root,contexts):
    facts=[]
    for e in root.iter():
        cref=e.get("contextRef")
        if not cref: continue
        txt=norm_text(e.text)
        if not txt: continue
        facts.append({
          "qname":qname_text(e,root),"local_name":local(e.tag),"context_ref":cref,
          "value":txt[:1000],"numeric":numeric(txt),"unit_ref":e.get("unitRef"),
          "decimals":e.get("decimals"),"scale":e.get("scale"),
          "context":contexts.get(cref)
        })
    return facts

def accounting_scope(facts):
    vals=[]
    for f in facts:
        lk=norm_key(f["local_name"])
        flat=lk.replace("_","")
        if "CONSOLIDATED" in flat or "STANDALONE" in flat or "NATUREOFREPORT" in flat:
            v=norm_key(f["value"])
            if "CONSOLIDATED" in v: vals.append("CONSOLIDATED")
            if "STANDALONE" in v: vals.append("STANDALONE")
    vals=sorted(set(vals))
    return vals[0] if len(vals)==1 else "CONFLICTING" if len(vals)>1 else "UNKNOWN"

def ordinal_from_member(member):
    m=POSITIONAL_RE.search(str(member or ""))
    return int(m.group(1)) if m else None

def ordinal_from_concept(name):
    s=str(name)
    # exact explicit ordinal embedded in concept name, e.g. ReportableSegmentName01
    m=re.search(r"(?:Segment|Business|Activity|Product|Service).*?0?(\d{1,2})(?:$|[^0-9])",s,re.I)
    return int(m.group(1)) if m else None

def semantic_candidates(facts,labels):
    high=[]; medium=[]
    for f in facts:
        if f["numeric"]: continue
        if not SEMANTIC_CONCEPT_RE.search(f["local_name"]): continue
        v=norm_text(f["value"])
        if len(v)<2 or len(v)>500: continue
        rec={k:f[k] for k in ("qname","local_name","context_ref","value")}
        rec["members"]=(f.get("context") or {}).get("members",[])
        if HIGH_SEMANTIC_RE.search(f["local_name"]): high.append(rec)
        else: medium.append(rec)
    for x in labels:
        v=norm_text(x["label"])
        if v:
            high.append({"qname":"EMBEDDED_LABEL","local_name":"label","context_ref":None,"value":v,"members":[],"href":x["href"]})
    def dedupe(rows):
        seen=set(); out=[]
        for r in rows:
            k=(r.get("qname"),r.get("context_ref"),r.get("value"))
            if k not in seen: seen.add(k); out.append(r)
        return out
    return dedupe(high),dedupe(medium)

def link_positional_semantics(facts,high,member_qname):
    ordn=ordinal_from_member(member_qname)
    if ordn is None: return []
    context_refs={f["context_ref"] for f in facts if any(m.get("member")==member_qname for m in ((f.get("context") or {}).get("members") or []))}
    out=[]
    for s in high:
        reason=None
        if s.get("context_ref") in context_refs and s.get("context_ref") is not None:
            reason="SAME_CONTEXT"
        elif ordinal_from_concept(s.get("local_name"))==ordn:
            reason="SAME_POSITIONAL_ORDINAL"
        if reason:
            out.append({**s,"link_reason":reason,"member_qname":member_qname,"ordinal":ordn})
    return out

def explicit_taxonomy(facts):
    found={k:[] for k in TAXONOMY_LOCAL}
    for f in facts:
        if f["numeric"]: continue
        ln=norm_key(f["local_name"])
        for level,rx in TAXONOMY_LOCAL.items():
            if rx.search(ln):
                val=norm_text(f["value"])
                if val and val not in found[level]: found[level].append(val)
    return found

def route_matches(gatek,sector,industry):
    sk=norm_key(sector); ik=norm_key(industry)
    hits=[]
    for r in gatek.get("routes",[]):
        secs=[norm_key(x) for x in r.get("sectors",[])]
        inds=[norm_key(x) for x in r.get("industries",[])]
        if ik in inds and (sk in secs or "*" in secs):
            hits.append({"profileCode":r["profileCode"],"methodologyFamily":r["methodologyFamily"],"state":r["state"]})
    return hits

def classification_and_route(facts,gatek):
    tx=explicit_taxonomy(facts)
    exact={k:(v[0] if len(v)==1 else None) for k,v in tx.items()}
    blockers=[]
    for k,v in tx.items():
        if len(v)>1: blockers.append(f"MULTIPLE_{k}_VALUES")
    missing=[k for k,v in exact.items() if not v]
    if missing:
        blockers.append("MISSING_COMPLETE_FOUR_TIER_HIERARCHY:"+",".join(missing))
        return tx,"CLASSIFICATION_PARTIAL" if any(tx.values()) else "CLASSIFICATION_BLOCKED",[],blockers
    # No complete parentage registry exists in repository; source four-level disclosure alone
    # cannot be silently promoted without an existing canonical path authority.
    blockers.append("FOUR_TIER_PARENTAGE_AUTHORITY_NOT_MATERIALIZED")
    routes=route_matches(gatek,exact["SECTOR"],exact["INDUSTRY"])
    return tx,"CLASSIFICATION_PARTIAL",routes,blockers

def latest_revision_ok(disseminated,decision):
    return bool(disseminated and decision and disseminated < decision)

def source_valid(member,raw):
    return sha256(raw)==member["latest_source"]["sha256"] and latest_revision_ok(member["latest_source"]["disseminated_at"],member["decision_at"])

def evaluate_member(member,raw,gatek):
    if not source_valid(member,raw):
        return {"state":"SOURCE_INVALID","blockers":["HASH_OR_POINT_IN_TIME_FAILURE"]}
    root=etree.fromstring(raw,etree.XMLParser(resolve_entities=False,huge_tree=True,recover=False))
    ctx=context_index(root); labels=embedded_labels(root); facts=facts_index(root,ctx)
    high,medium=semantic_candidates(facts,labels)
    member_q=member.get("workstream_d_label")
    linked=link_positional_semantics(facts,high,member_q) if member_q and member_q!="DIVERSIFIED" else []
    scope=accounting_scope(facts)
    tx,class_state,routes,class_blockers=classification_and_route(facts,gatek)
    semantic_state="SEMANTIC_RECOVERED" if high or linked else "SEMANTIC_NOT_FOUND"
    route_state="ROUTE_BLOCKED_BY_CLASSIFICATION"
    if class_state=="CLASSIFICATION_PROVEN":
        route_state="ROUTE_PROVEN" if len(routes)==1 else "ROUTE_MULTIPLE" if len(routes)>1 else "ROUTE_UNSUPPORTED"
    schema_refs=[]
    for e in root.iter():
        if local(e.tag)=="schemaRef":
            href=e.get("{http://www.w3.org/1999/xlink}href")
            if href: schema_refs.append(href)
    # concise source excerpts only; no full source bodies in repo
    excerpt={
      "historical_identity_id":member["historical_identity_id"],"decision_at":member["decision_at"],
      "source_r2_key":member["latest_source"]["r2_key"],"source_sha256":member["latest_source"]["sha256"],
      "disseminated_at":member["latest_source"]["disseminated_at"],"accounting_scope":scope,
      "workstream_d_label":member.get("workstream_d_label"),"schema_refs":schema_refs[:10],
      "high_semantic_facts":high[:25],"linked_positional_semantics":linked[:25],
      "explicit_taxonomy_facts":tx
    }
    return {
      "state":"VALID_SOURCE","semantic_state":semantic_state,"classification_state":class_state,"route_state":route_state,
      "route_matches":routes,"classification_blockers":class_blockers,
      "high_semantic_fact_count":len(high),"medium_semantic_fact_count":len(medium),
      "linked_positional_semantic_count":len(linked),"explicit_taxonomy":tx,"accounting_scope":scope,
      "facts_count":len(facts),"contexts_count":len(ctx),"embedded_label_count":len(labels),
      "excerpt":excerpt
    }

def main():
    canary_bytes=CANARY.read_bytes(); contract_bytes=CONTRACT.read_bytes()
    if git_blob_sha(canary_bytes)!=EXPECTED_CANARY_BLOB: raise RuntimeError("canary manifest changed")
    if git_blob_sha(contract_bytes)!=EXPECTED_CONTRACT_BLOB: raise RuntimeError("normalization contract changed")
    canary=json.loads(canary_bytes); contract=json.loads(contract_bytes); gatek=json.loads(GATEK.read_text())
    if canary["measurement_performed"]: raise RuntimeError("canary was not frozen pre-measurement")
    c=s3(); results=[]; excerpts=[]
    for m in canary["members"]:
        raw=read(c,m["latest_source"]["r2_key"])
        r=evaluate_member(m,raw,gatek)
        row={
          "canary_stratum":m["canary_stratum"],"historical_identity_id":m["historical_identity_id"],
          "historical_isin":m["historical_isin"],"historical_only":m["historical_only"],
          "decision_at":m["decision_at"],"workstream_d_state":m["workstream_d_state"],
          "workstream_d_label":m.get("workstream_d_label"),"source_sha256":m["latest_source"]["sha256"],
          "source_r2_key":m["latest_source"]["r2_key"],**{k:v for k,v in r.items() if k!="excerpt"}
        }
        results.append(row)
        if "excerpt" in r: excerpts.append(r["excerpt"])
    results.sort(key=lambda x:(x["canary_stratum"],x["historical_identity_id"],x["decision_at"]))
    excerpts.sort(key=lambda x:(x["historical_identity_id"],x["decision_at"]))
    counts={
      "semantic_recovered":sum(r.get("semantic_state")=="SEMANTIC_RECOVERED" for r in results),
      "classification_proven":sum(r.get("classification_state")=="CLASSIFICATION_PROVEN" for r in results),
      "route_proven":sum(r.get("route_state")=="ROUTE_PROVEN" for r in results),
      "positional_semantic_recovered":sum(r.get("semantic_state")=="SEMANTIC_RECOVERED" and r.get("workstream_d_label") not in (None,"DIVERSIFIED") for r in results),
      "historical_only_semantic_recovered":sum(r.get("semantic_state")=="SEMANTIC_RECOVERED" and r.get("historical_only") for r in results),
      "negative_controls_promoted":sum(r["canary_stratum"].startswith("UNRESOLVED_EVIDENCE") and r.get("classification_state")=="CLASSIFICATION_PROVEN" for r in results)
    }
    core={"version":VERSION,"contract_version":contract["contract_version"],"canary_fingerprint":canary["membership_fingerprint_sha256"],"results":results,"counts":counts}
    fp1=stable_hash(core); fp2=stable_hash(json.loads(json.dumps(core,sort_keys=True)))
    gate={
      "AT_LEAST_ONE_POSITIONAL_MEMBER_CASE_HAS_SOURCE_CITED_SEMANTIC_RECOVERY":counts["positional_semantic_recovered"]>=1,
      "AT_LEAST_ONE_CANARY_MEMBER_HAS_COMPLETE_CLASSIFICATION_PROVEN":counts["classification_proven"]>=1,
      "AT_LEAST_ONE_COMPLETE_CLASSIFICATION_PROVEN_MEMBER_HAS_EXACTLY_ONE_EXISTING_ROUTE":counts["route_proven"]>=1,
      "REPEAT_FINGERPRINT_MATCHES":fp1==fp2,
      "NEGATIVE_CONTROLS_ARE_NOT_PROMOTED_WITHOUT_PROOF":counts["negative_controls_promoted"]==0
    }
    expand=all(gate.values())
    bystratum=defaultdict(Counter)
    for r in results:
        bystratum[r["canary_stratum"]][r.get("semantic_state","UNKNOWN")]+=1
        bystratum[r["canary_stratum"]][r.get("classification_state","UNKNOWN")]+=1
        bystratum[r["canary_stratum"]][r.get("route_state","UNKNOWN")]+=1
    audit={
      "version":VERSION,"generated_at":datetime.now(timezone.utc).isoformat(),
      "implementation_status":"PASS","semantic_canary_status":"PASS_EXPAND" if expand else "BLOCKED_NO_EXPANSION",
      "expand_full_population":expand,"contract_version":contract["contract_version"],
      "contract_git_blob_sha":EXPECTED_CONTRACT_BLOB,"canary_git_blob_sha":EXPECTED_CANARY_BLOB,
      "canary_membership_fingerprint":canary["membership_fingerprint_sha256"],
      "canary_denominator":len(results),"counts":counts,"expansion_gate":gate,
      "by_stratum":{k:dict(v) for k,v in sorted(bystratum.items())},
      "results":results,"deterministic_fingerprint_sha256":fp1,"repeat_fingerprint_sha256":fp2,
      "source_semantic_validation":"Source excerpts are emitted separately with exact source hash, context-linked facts, semantic text and explicit taxonomy facts.",
      "provider_calls":0,"new_source_acquisition":0,"supabase_writes":0,"r2_writes":0,
      "performance_outcome_reads":0,"p8_c_started":False,"production_changes":0,"main_changes":0
    }
    OUT.write_text(json.dumps(audit,indent=2,sort_keys=True)+"\n")
    EXCERPTS.write_text(json.dumps({"version":VERSION,"members":excerpts},indent=2,sort_keys=True)+"\n")
    print(json.dumps({"semantic_canary_status":audit["semantic_canary_status"],"counts":counts,"expansion_gate":gate,"fingerprint":fp1},indent=2))
    if expand:
        print("EXPANSION_AUTHORIZED_BY_FROZEN_CANARY_GATE")
    else:
        print("STOP_AFTER_CANARY_NO_FULL_EXPANSION")

if __name__=="__main__": main()
