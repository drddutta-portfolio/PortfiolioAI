#!/usr/bin/env python3
import boto3, hashlib, json, os, re
from decimal import Decimal, InvalidOperation, getcontext
from pathlib import Path
from urllib.parse import urlparse
from botocore.config import Config
from lxml import etree

getcontext().prec=40
BUCKET="portfolioai-history-dev"
SOURCE_AUDIT=Path("docs/p8/PortfolioAI_P8_SEGMENT_REVENUE_CANARY_SOURCE_ACCOUNTING_AUDIT_2026-10-04.json")
CLASS_AUDIT=Path("docs/p8/PortfolioAI_P8_SEGMENT_REVENUE_CANARY_CLASSIFICATION_AUDIT_2026-10-04.json")
CANARY=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_MANIFEST_2026-10-04.json")
CAND=Path("docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_SEMANTICS_CANDIDATE_V2.json")
TAX=Path("docs/p8/PortfolioAI_P8_NSE_FOUR_TIER_TAXONOMY_NOVEMBER_2022.json")
OUT_MATRIX=Path("docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_SOURCE_SEMANTICS_MATRIX_2026-10-04.json")
OUT_RERUN=Path("docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_FROZEN_CANARY_RERUN_2026-10-04.json")
EXPECTED_V1_BLOB="45e990981371dba217d12c430f8ce567acbf25fc"
EXPECTED_V2_BLOB="6a2c5d7780ac3966cd4e06b8b8ac46b5b3f6a627"
EXPECTED_CANARY_FP="b159764fd342aad3901717e04446596e93aa87d9c6726b7b3dd7ef8b55026dce"

def clean(x): return " ".join(str(x or "").strip().split())
def norm(x): return re.sub(r"[^A-Z0-9]+","_",clean(x).upper()).strip("_")
def sha256(b): return hashlib.sha256(b).hexdigest()
def git_blob_sha(b): return hashlib.sha1(f"blob {len(b)}\0".encode()+b).hexdigest()
def stable(x): return sha256(json.dumps(x,sort_keys=True,separators=(",",":"),default=str).encode())
def local(tag):
    try: return etree.QName(tag).localname
    except: return str(tag).split(":",1)[-1]
def dec(x):
    try: return Decimal(str(x).strip())
    except (InvalidOperation,TypeError,ValueError): return None
def scaled(f):
    v=dec(f.get("value"))
    if v is None: return None
    if f.get("scale") not in (None,""):
        try: v*=Decimal(10)**int(f["scale"])
        except: return None
    return v
def halfq(f):
    d=f.get("decimals")
    if d is None or str(d).upper()=="INF": return Decimal(0)
    try:
        q=Decimal(10)**(-int(d))
        if f.get("scale") not in (None,""): q*=Decimal(10)**int(f["scale"])
        return q/2
    except: return Decimal(0)

def acct(raw):
    h=urlparse(raw).hostname if "://" in raw else raw
    suffix=".r2.cloudflarestorage.com"
    return h[:-len(suffix)] if h.endswith(suffix) else h
def s3():
    a=acct(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
    return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",
      aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
      aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
      region_name="auto",config=Config(retries={"max_attempts":8,"mode":"adaptive"},s3={"addressing_style":"path"}))
def read(c,key): return c.get_object(Bucket=BUCKET,Key=key)["Body"].read()

def parse(raw):
    root=etree.fromstring(raw,etree.XMLParser(resolve_entities=False,huge_tree=True,recover=False))
    ctx={}
    for e in root.iter():
        if local(e.tag)!="context" or not e.get("id"): continue
        p={"start":None,"end":None,"instant":None,"members":[]}
        for z in e.iter():
            ln=local(z.tag)
            if ln=="startDate": p["start"]=clean(z.text)
            elif ln=="endDate": p["end"]=clean(z.text)
            elif ln=="instant": p["instant"]=clean(z.text)
            elif ln=="explicitMember": p["members"].append({"dimension":z.get("dimension"),"member":clean(z.text)})
        ctx[e.get("id")]=p
    fs=[]
    for e in root.iter():
        cref=e.get("contextRef")
        if not cref: continue
        txt=clean(e.text)
        if not txt: continue
        fs.append({"local_name":local(e.tag),"qname":(f"{e.prefix}:{local(e.tag)}" if e.prefix else local(e.tag)),
                   "context_ref":cref,"value":txt,"unit_ref":e.get("unitRef"),"decimals":e.get("decimals"),
                   "scale":e.get("scale"),"context":ctx.get(cref,{})})
    schemas=[]
    for e in root.iter():
        if local(e.tag)=="schemaRef":
            href=e.get("{http://www.w3.org/1999/xlink}href")
            if href: schemas.append(href)
    return root,ctx,fs,schemas

def facts(fs,name,cref=None):
    return [f for f in fs if f["local_name"]==name and (cref is None or f["context_ref"]==cref)]
def one(fs,name,cref):
    a=facts(fs,name,cref); return a[0] if len(a)==1 else None

def tol(rows): return sum((halfq(f) for f in rows if f),Decimal(0))
def recon(sumv,totalf,rows):
    tv=scaled(totalf) if totalf else None
    if sumv is None or tv is None: return {"ok":False,"residual":None,"tolerance":None}
    t=tol(rows+[totalf]); r=sumv-tv
    return {"ok":abs(r)<=t,"residual":str(r),"tolerance":str(t)}

def group_segment(fs,prefix,family="Revenue"):
    rx=re.compile(rf"^{prefix}ReportableSegment{family}(\d+)D$",re.I)
    out=[]
    for f in fs:
        if f["local_name"]!="SegmentRevenue" and family=="Revenue": continue
        if family!="Revenue" and f["local_name"]!="SegmentProfitLossBeforeTaxAndFinanceCosts": continue
        m=rx.match(f["context_ref"])
        if not m: continue
        desc=one(fs,"DescriptionOfReportableSegment",f["context_ref"])
        if not desc: continue
        out.append({"ordinal":int(m.group(1)),"context_ref":f["context_ref"],"description":clean(desc["value"]),
                    "value":str(scaled(f)) if scaled(f) is not None else None,"unit_ref":f.get("unit_ref"),
                    "decimals":f.get("decimals"),"scale":f.get("scale"),"context":f.get("context"),"_fact":f})
    out.sort(key=lambda x:x["ordinal"]); return out

def summarize_case(raw,annual_base):
    root,ctx,fs,schemas=parse(raw)
    oneD=ctx.get("OneD",{}); fourD=ctx.get("FourD",{})
    reporting=[clean(f["value"]) for f in facts(fs,"ReportingQuarter")]
    one_rev=group_segment(fs,"One","Revenue"); four_rev=group_segment(fs,"Four","Revenue")
    one_profit=group_segment(fs,"One","Results"); four_profit=group_segment(fs,"Four","Results")
    one_total=one(fs,"SegmentRevenue","OneD"); four_total=one(fs,"SegmentRevenue","FourD")
    one_profit_total=one(fs,"SegmentProfitLossBeforeTaxAndFinanceCosts","OneD")
    four_profit_total=one(fs,"SegmentProfitLossBeforeTaxAndFinanceCosts","FourD")
    def sumgroup(g):
        vs=[scaled(x["_fact"]) for x in g]
        return sum(vs,Decimal(0)) if g and all(v is not None for v in vs) else None
    rev1=recon(sumgroup(one_rev),one_total,[x["_fact"] for x in one_rev])
    rev4=recon(sumgroup(four_rev),four_total,[x["_fact"] for x in four_rev])
    pr1=recon(sumgroup(one_profit),one_profit_total,[x["_fact"] for x in one_profit])
    pr4=recon(sumgroup(four_profit),four_profit_total,[x["_fact"] for x in four_profit])
    matching=bool(one_rev and four_rev and [(x["ordinal"],norm(x["description"])) for x in one_rev]==[(x["ordinal"],norm(x["description"])) for x in four_rev])
    annual_literal=[]
    for f in facts(fs,"SegmentRevenue"):
        cp=f.get("context") or {}
        if not cp.get("members"): continue
        if cp.get("start")==annual_base.get("start") and cp.get("end")==annual_base.get("end"):
            desc=one(fs,"DescriptionOfReportableSegment",f["context_ref"])
            if desc: annual_literal.append({"context_ref":f["context_ref"],"description":clean(desc["value"]),"value":str(scaled(f)),"context":cp})
    related_missing=[]
    for f in fs:
        if re.search(r"inter.*segment|eliminat",f["local_name"],re.I):
            related_missing.append({"qname":f["qname"],"context_ref":f["context_ref"],"value":f["value"],"context":f.get("context"),"unit_ref":f.get("unit_ref")})
    bridge=(
      any(norm(v)=="YEARLY" for v in reporting)
      and oneD.get("start") and oneD.get("end") and fourD.get("start") and fourD.get("end")
      and oneD.get("end")==fourD.get("end") and oneD.get("start")!=fourD.get("start")
      and matching and rev1["ok"] and rev4["ok"]
      and ((one_profit and four_profit and pr1["ok"] and pr4["ok"]) or (not one_profit and not four_profit))
    )
    if annual_literal:
        category="V1_EXTRACTION_FIX_EXISTING_ANNUAL_FACT"
    elif bridge:
        category="V2_CONDITIONAL_SOURCE_TAGGING_DEFECT_PROVEN_BY_TABLE_COLUMN_BRIDGE"
    elif four_rev:
        category="INSUFFICIENT_PERIOD_EVIDENCE"
    else:
        category="NO_SEGMENT_FACT_GROUP"
    def strip(g):
        return [{k:v for k,v in x.items() if k!="_fact"} for x in g]
    return {
      "schema_refs":schemas,"reporting_quarter_values":reporting,"oneD":oneD,"fourD":fourD,
      "one_revenue_group":strip(one_rev),"four_revenue_group":strip(four_rev),
      "one_revenue_reconciliation":rev1,"four_revenue_reconciliation":rev4,
      "one_profit_reconciliation":pr1,"four_profit_reconciliation":pr4,
      "matching_one_four_segment_identities":matching,
      "literal_annual_segment_facts":annual_literal,
      "related_intersegment_elimination_facts":related_missing,
      "bridge_conditions_pass":bridge,"defect_category":category
    }

def main():
    cand_bytes=CAND.read_bytes()
    if git_blob_sha(cand_bytes)!=EXPECTED_V2_BLOB: raise RuntimeError("V2 candidate changed")
    can=json.loads(CANARY.read_text())
    if can["membership_fingerprint_sha256"]!=EXPECTED_CANARY_FP: raise RuntimeError("canary drift")
    src=json.loads(SOURCE_AUDIT.read_text()); cls=json.loads(CLASS_AUDIT.read_text()); tax=json.loads(TAX.read_text())
    c=s3(); matrix=[]
    mismatch=[x for x in src["results"] if "REPORTABLE_SEGMENT_FACTS_PRESENT_BUT_PERIOD_CONTEXT_MISMATCH" in x.get("accounting",{}).get("blockers",[])]
    for x in mismatch:
        meta=x["selected_source"]; raw=read(c,meta["r2_key"])
        if sha256(raw)!=meta["sha256"]: raise RuntimeError("source hash mismatch")
        sem=summarize_case(raw,meta["period"])
        matrix.append({
          "historical_identity_id":x["historical_identity_id"],"historical_isin":x["historical_isin"],
          "decision_at":x["decision_at"],"canary_stratum":x["canary_stratum"],
          "filing":{"r2_key":meta["r2_key"],"sha256":meta["sha256"],"disseminated_at":meta["disseminated_at"],
                    "annual_base_period":meta["period"]},
          "source_semantics":sem
        })
    matrix.sort(key=lambda x:(x["historical_identity_id"],x["decision_at"]))
    counts={}
    for x in matrix: counts[x["source_semantics"]["defect_category"]]=counts.get(x["source_semantics"]["defect_category"],0)+1
    matrix_core={"version":"P8_XBRL_SEGMENT_PERIOD_SOURCE_SEMANTICS_MATRIX_V1",
      "v1_contract_blob":EXPECTED_V1_BLOB,"v2_candidate_blob":EXPECTED_V2_BLOB,
      "canary_fingerprint":EXPECTED_CANARY_FP,"mismatch_denominator":len(matrix),"counts":counts,"cases":matrix}
    mfp=stable(matrix_core)
    OUT_MATRIX.write_text(json.dumps({**matrix_core,"fingerprint_sha256":mfp,"repeat_fingerprint_sha256":stable(json.loads(json.dumps(matrix_core,sort_keys=True)))},indent=2,sort_keys=True)+"\n")

    # Rerun: V1 stays exactly as measured. V2 conditional may normalize only bridge-passing Four revenue groups.
    tax_by={norm(n["name"]):n for n in tax["nodes"] if n["level"]=="BASIC_INDUSTRY"}
    bykey={(x["historical_identity_id"],x["decision_at"]):x for x in matrix}
    results=[]; rc={}
    def inc(k): rc[k]=rc.get(k,0)+1
    for x in src["results"]:
        key=(x["historical_identity_id"],x["decision_at"]); mx=bykey.get(key)
        v1_authoritative=False
        conditional=False; comparable=False; dominant=None; exact_leaf=None; blockers=[]
        if mx and mx["source_semantics"]["defect_category"]=="V2_CONDITIONAL_SOURCE_TAGGING_DEFECT_PROVEN_BY_TABLE_COLUMN_BRIDGE":
            conditional=True
            a=x["accounting"]; denom=dec(a.get("company_revenue")); inter=dec(a.get("intersegment_revenue"))
            four=mx["source_semantics"]["four_revenue_group"]
            if denom is not None and denom>0 and inter is not None and inter==0:
                comparable=True
                ds=[]
                for s in four:
                    sv=dec(s["value"]); ratio=(sv/denom if sv is not None and sv>=0 else None)
                    if ratio is not None and ratio>Decimal("0.5"): ds.append({**s,"ratio":str(ratio)})
                if len(ds)==1: dominant=ds[0]
                elif len(ds)>1: blockers.append("MULTIPLE_GT50_SEGMENTS")
            elif inter is not None and inter!=0:
                blockers.append("NONZERO_INTERSEGMENT_REQUIRES_SEGMENT_EXTERNAL_REVENUE")
            else: blockers.append("INVALID_OR_MISSING_DENOMINATOR_OR_INTERSEGMENT")
            if dominant:
                exact_leaf=tax_by.get(norm(dominant["description"]))
                if not exact_leaf: blockers.append("DOMINANT_SEGMENT_EXACT_BASIC_INDUSTRY_MAPPING_MISSING")
        if conditional: inc("V2_CONDITIONAL_PERIOD_NORMALIZED")
        if comparable: inc("V2_CONDITIONAL_COMPARABLE_SEGMENT_REVENUE")
        if dominant: inc("V2_CONDITIONAL_DOMINANT_BUSINESS")
        if exact_leaf: inc("V2_CONDITIONAL_COMPLETE_TAXONOMY_EXACT")
        if v1_authoritative: inc("V1_AUTHORITATIVE_RECOVERED")
        results.append({
          "historical_identity_id":x["historical_identity_id"],"historical_isin":x["historical_isin"],"decision_at":x["decision_at"],
          "v1_state":x["accounting"]["state"],"v1_authoritative_recovery":v1_authoritative,
          "v2_conditional_period_normalization":conditional,"v2_comparable_segment_revenue":comparable,
          "v2_dominant_business":dominant,"v2_exact_basic_industry":exact_leaf,
          "v2_company_classification_state":("CONDITIONAL_COMPLETE_EXACT" if dominant and exact_leaf else "CONDITIONAL_DOMINANT_MAPPING_UNRESOLVED" if dominant else "NO_CONDITIONAL_CLASSIFICATION"),
          "blockers":blockers
        })
    results.sort(key=lambda x:(x["historical_identity_id"],x["decision_at"]))
    rerun_core={"version":"P8_XBRL_SEGMENT_PERIOD_FROZEN_CANARY_RERUN_V1",
      "approved_v1_contract_blob":EXPECTED_V1_BLOB,"conditional_v2_candidate_blob":EXPECTED_V2_BLOB,
      "canary_fingerprint":EXPECTED_CANARY_FP,"pair_denominator":32,
      "v1_authoritative":{"comparable_segment_revenue":0,"complete_company_classification":0,"unique_methodology_route":0,"complete_normalized_input":0},
      "v2_conditional_counts":rc,"results":results,
      "broad_25761_processing":"NOT_AUTHORIZED_NOT_MEASURED"}
    rfp=stable(rerun_core)
    OUT_RERUN.write_text(json.dumps({**rerun_core,"fingerprint_sha256":rfp,"repeat_fingerprint_sha256":stable(json.loads(json.dumps(rerun_core,sort_keys=True)))},indent=2,sort_keys=True)+"\n")
    print(json.dumps({"matrix_counts":counts,"v2_counts":rc,"matrix_fingerprint":mfp,"rerun_fingerprint":rfp},indent=2,sort_keys=True))

if __name__=="__main__": main()
