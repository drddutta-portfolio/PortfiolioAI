#!/usr/bin/env python3
import boto3, hashlib, json, os, re
from decimal import Decimal, InvalidOperation, getcontext
from pathlib import Path
from urllib.parse import urlparse
from botocore.config import Config
from lxml import etree
import psycopg

getcontext().prec=40
BUCKET="portfolioai-history-dev"
V3=Path("docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_SEMANTICS_CANDIDATE_V3.json")
SOURCE_AUDIT=Path("docs/p8/PortfolioAI_P8_SEGMENT_REVENUE_CANARY_SOURCE_ACCOUNTING_AUDIT_2026-10-04.json")
CANARY=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_MANIFEST_2026-10-04.json")
TAX=Path("docs/p8/PortfolioAI_P8_NSE_FOUR_TIER_TAXONOMY_NOVEMBER_2022.json")
OUT=Path("docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_V3_CANARY_AUDIT_2026-10-04.json")
MISSING=Path("docs/p8/PortfolioAI_P8_XBRL_MISSING_ACCOUNTING_DISCLOSURE_AUDIT_2026-10-04.json")
EXPECTED_V3_BLOB="797b7e91d7770f3377d0061ee338c76e8220391f"
V1_BLOB="45e990981371dba217d12c430f8ce567acbf25fc"
CANARY_FP="b159764fd342aad3901717e04446596e93aa87d9c6726b7b3dd7ef8b55026dce"

def clean(x): return " ".join(str(x or "").strip().split())
def norm(x): return re.sub(r"[^A-Z0-9]+","_",clean(x).upper()).strip("_")
def sha256(b): return hashlib.sha256(b).hexdigest()
def git_blob_sha(b): return hashlib.sha1(f"blob {len(b)}\0".encode()+b).hexdigest()
def stable(x): return sha256(json.dumps(x,sort_keys=True,separators=(",",":"),default=str).encode())
def dec(x):
    try:return Decimal(str(x))
    except (InvalidOperation,TypeError,ValueError): return None
def local(tag):
    try:return etree.QName(tag).localname
    except:return str(tag).split(":",1)[-1]
def scaled(f):
    v=dec(f.get("value"))
    if v is None:return None
    if f.get("scale") not in (None,""):
        try:v*=Decimal(10)**int(f["scale"])
        except:return None
    return v
def halfq(f):
    d=f.get("decimals")
    if d is None or str(d).upper()=="INF":return Decimal(0)
    try:
        q=Decimal(10)**(-int(d))
        if f.get("scale") not in (None,""):q*=Decimal(10)**int(f["scale"])
        return q/2
    except:return Decimal(0)
def acct(raw):
    h=urlparse(raw).hostname if "://" in raw else raw;s=".r2.cloudflarestorage.com"
    return h[:-len(s)] if h.endswith(s) else h
def s3():
    a=acct(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
    return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",
      aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
      region_name="auto",config=Config(retries={"max_attempts":8,"mode":"adaptive"},s3={"addressing_style":"path"}))
def read(c,k):return c.get_object(Bucket=BUCKET,Key=k)["Body"].read()

def parse(raw):
    root=etree.fromstring(raw,etree.XMLParser(resolve_entities=False,huge_tree=True,recover=False));ctx={};fs=[]
    for e in root.iter():
        if local(e.tag)!="context" or not e.get("id"):continue
        p={"start":None,"end":None,"instant":None,"members":[]}
        for z in e.iter():
            ln=local(z.tag)
            if ln=="startDate":p["start"]=clean(z.text)
            elif ln=="endDate":p["end"]=clean(z.text)
            elif ln=="instant":p["instant"]=clean(z.text)
            elif ln=="explicitMember":p["members"].append({"dimension":z.get("dimension"),"member":clean(z.text)})
        ctx[e.get("id")]=p
    for e in root.iter():
        cref=e.get("contextRef")
        if not cref:continue
        txt=clean(e.text)
        if not txt:continue
        fs.append({"local_name":local(e.tag),"qname":f"{e.prefix}:{local(e.tag)}" if e.prefix else local(e.tag),"context_ref":cref,
                   "value":txt,"unit_ref":e.get("unitRef"),"decimals":e.get("decimals"),"scale":e.get("scale"),"context":ctx.get(cref,{})})
    return ctx,fs
def rows(fs,name,cref=None):return [f for f in fs if f["local_name"]==name and (cref is None or f["context_ref"]==cref)]
def one(fs,name,cref):
    a=rows(fs,name,cref);return a[0] if len(a)==1 else None
def period_facts(fs,cref):
    s=one(fs,"DateOfStartOfReportingPeriod",cref);e=one(fs,"DateOfEndOfReportingPeriod",cref)
    return {"start":clean(s["value"]) if s else None,"end":clean(e["value"]) if e else None}
def days(p):
    from datetime import date
    try:return (date.fromisoformat(p["end"])-date.fromisoformat(p["start"])).days+1
    except:return None
def group(fs,prefix,measure):
    fam="Revenue" if measure=="SegmentRevenue" else "Results"
    rx=re.compile(rf"^{prefix}ReportableSegment{fam}(\d+)D$",re.I);out=[]
    for f in fs:
        if f["local_name"]!=measure:continue
        m=rx.match(f["context_ref"])
        if not m:continue
        d=one(fs,"DescriptionOfReportableSegment",f["context_ref"])
        if not d:continue
        out.append({"ordinal":int(m.group(1)),"description":clean(d["value"]),"context_ref":f["context_ref"],"value":str(scaled(f)),
                    "unit_ref":f.get("unit_ref"),"decimals":f.get("decimals"),"scale":f.get("scale"),"literal_context":f.get("context"),"_f":f})
    out.sort(key=lambda x:x["ordinal"]);return out
def sumg(g):
    vals=[scaled(x["_f"]) for x in g]
    return sum(vals,Decimal(0)) if g and all(v is not None for v in vals) else None
def reconcile(g,total):
    sv=sumg(g);tv=scaled(total) if total else None
    if sv is None or tv is None:return {"ok":False,"residual":None,"tolerance":None}
    tol=sum((halfq(x["_f"]) for x in g),Decimal(0))+halfq(total);res=sv-tv
    return {"ok":abs(res)<=tol,"residual":str(res),"tolerance":str(tol)}
def exact_annual_facts(fs,annual):
    out=[]
    for f in rows(fs,"SegmentRevenue"):
        c=f.get("context") or {}
        if not c.get("members"):continue
        if c.get("start")==annual.get("start") and c.get("end")==annual.get("end"):
            d=one(fs,"DescriptionOfReportableSegment",f["context_ref"])
            if d:out.append({"context_ref":f["context_ref"],"description":clean(d["value"]),"value":str(scaled(f))})
    return out

def app_crosswalk():
    url=os.environ["SUPABASE_DB_URL"]
    if "lrgpjimipfkyoqbpsqzz" not in url:raise RuntimeError("wrong DB")
    out={}
    with psycopg.connect(url,connect_timeout=20) as con,con.cursor() as cur:
        cur.execute("""select s.name,i.name,i.code from public.industries i join public.sectors s on s.id=i.sector_id where s.is_active and i.is_active""")
        for sector,industry,icode in cur.fetchall():
            for k in (industry,icode):out[norm(k)]={"applicationSector":sector,"applicationIndustry":industry}
    return out

def tax_index(tax):
    by={n["code"]:n for n in tax["nodes"]};basic={norm(n["name"]):n for n in tax["nodes"] if n["level"]=="BASIC_INDUSTRY"}
    def path(code):
        a=[];c=code
        while c:
            n=by[c];a.append(n);c=n.get("parent_code")
        return list(reversed(a))
    return basic,path

def analyze_source(raw):
    ctx,fs=parse(raw);onep=period_facts(fs,"OneD");fourp=period_facts(fs,"FourD")
    reporting=[clean(f["value"]) for f in rows(fs,"ReportingQuarter")]
    oneR,fourR=group(fs,"One","SegmentRevenue"),group(fs,"Four","SegmentRevenue")
    oneP,fourP=group(fs,"One","SegmentProfitLossBeforeTaxAndFinanceCosts"),group(fs,"Four","SegmentProfitLossBeforeTaxAndFinanceCosts")
    r1,r4=reconcile(oneR,one(fs,"SegmentRevenue","OneD")),reconcile(fourR,one(fs,"SegmentRevenue","FourD"))
    p1,p4=reconcile(oneP,one(fs,"SegmentProfitLossBeforeTaxAndFinanceCosts","OneD")),reconcile(fourP,one(fs,"SegmentProfitLossBeforeTaxAndFinanceCosts","FourD"))
    same=bool(oneR and fourR and [(x["ordinal"],norm(x["description"])) for x in oneR]==[(x["ordinal"],norm(x["description"])) for x in fourR])
    bridge=any(norm(x)=="YEARLY" for x in reporting) and days(onep) and 80<=days(onep)<=100 and days(fourp) and 330<=days(fourp)<=380 and onep["end"]==fourp["end"] and same and r1["ok"] and r4["ok"] and bool(oneP and fourP and p1["ok"] and p4["ok"])
    annual=exact_annual_facts(fs,fourp)
    related=[{"qname":f["qname"],"context_ref":f["context_ref"],"value":f["value"],"context":f.get("context"),"unit_ref":f.get("unit_ref")}
             for f in fs if re.search(r"inter.*segment|segment.*inter|eliminat|total.*segment",f["local_name"],re.I)]
    external=[{"qname":f["qname"],"context_ref":f["context_ref"],"value":f["value"],"context":f.get("context"),"unit_ref":f.get("unit_ref")}
              for f in fs if re.search(r"external.*revenue|revenue.*external",f["local_name"],re.I)]
    def strip(g):return [{k:v for k,v in x.items() if k!="_f"} for x in g]
    return {"one_explicit_period":onep,"four_explicit_period":fourp,"one_literal_context":ctx.get("OneD"),"four_literal_context":ctx.get("FourD"),
            "reporting_quarter_values":reporting,"one_revenue":strip(oneR),"four_revenue":strip(fourR),"revenue_one_recon":r1,"revenue_four_recon":r4,
            "profit_one_recon":p1,"profit_four_recon":p4,"matching_segment_identities":same,"v3_bridge_pass":bridge,
            "literal_annual_segment_facts":annual,"related_intersegment_elimination_facts":related,"segment_external_revenue_facts":external}

def main():
    vb=V3.read_bytes()
    if git_blob_sha(vb)!=EXPECTED_V3_BLOB:raise RuntimeError("V3 changed")
    can=json.loads(CANARY.read_text())
    if can["membership_fingerprint_sha256"]!=CANARY_FP:raise RuntimeError("canary changed")
    src=json.loads(SOURCE_AUDIT.read_text());tax=json.loads(TAX.read_text());c=s3();basic,pathfn=tax_index(tax);cross=app_crosswalk()
    results=[];missing=[];counts={}
    def inc(k,n=1):counts[k]=counts.get(k,0)+n
    for x in src["results"]:
        a=x["accounting"];meta=x.get("selected_source");sem=None;raw=None
        if meta:
            raw=read(c,meta["r2_key"])
            if sha256(raw)!=meta["sha256"]:raise RuntimeError("hash mismatch")
            sem=analyze_source(raw)
        is_mismatch="REPORTABLE_SEGMENT_FACTS_PRESENT_BUT_PERIOD_CONTEXT_MISMATCH" in a.get("blockers",[])
        v1fix=bool(sem and sem["literal_annual_segment_facts"])
        v3=bool(is_mismatch and sem and sem["v3_bridge_pass"] and not v1fix)
        comparable=False;dominant=None;leaf=None;route_input=None;blockers=[]
        if v1fix:inc("V1_EXTRACTION_FIX_EXISTING_ANNUAL_FACT")
        if v3:inc("V3_CONDITIONAL_PERIOD_NORMALIZATION")
        if v3:
            denom=dec(a.get("company_revenue"));inter=dec(a.get("intersegment_revenue"))
            if denom is not None and denom>0 and inter is not None and inter==0:
                comparable=True;inc("V3_CONDITIONAL_COMPARABLE_SEGMENT_REVENUE")
                ds=[]
                for s in sem["four_revenue"]:
                    sv=dec(s["value"]);ratio=(sv/denom if sv is not None and sv>=0 else None)
                    if ratio is not None and ratio>Decimal("0.5"):ds.append({**s,"ratio":str(ratio)})
                if len(ds)==1:
                    dominant=ds[0];inc("V3_CONDITIONAL_DOMINANT_BUSINESS")
                elif len(ds)>1:blockers.append("MULTIPLE_GT50_SEGMENTS")
            elif inter is not None and inter!=0:
                if sem["segment_external_revenue_facts"]:blockers.append("SEGMENT_EXTERNAL_REVENUE_PRESENT_REQUIRES_EXACT_CONTEXT_LINKAGE_REVIEW")
                else:blockers.append("NONZERO_INTERSEGMENT_WITHOUT_SEGMENT_EXTERNAL_REVENUE")
            else:blockers.append("INVALID_OR_MISSING_DENOMINATOR_OR_INTERSEGMENT")
            if dominant:
                leaf=basic.get(norm(dominant["description"]))
                if leaf:
                    inc("V3_CONDITIONAL_EXACT_BASIC_INDUSTRY")
                    p=pathfn(leaf["code"])
                    industry=next((n for n in p if n["level"]=="INDUSTRY"),None)
                    cw=cross.get(norm(leaf["name"])) or (cross.get(norm(industry["name"])) if industry else None)
                    if cw:route_input={"assetClass":"EQUITY",**cw}
                    else:blockers.append("APPLICATION_CLASSIFICATION_CROSSWALK_UNRESOLVED")
                else:blockers.append("DOMINANT_SEGMENT_TAXONOMY_MAPPING_REQUIRES_OD2_CATALOG_OR_IS_AMBIGUOUS")
        if comparable:inc("V3_COMPARABLE")
        if route_input:inc("V3_ROUTE_INPUT_CANDIDATE")
        primary=("V1_EXTRACTION_FIX" if v1fix else "V3_CONDITIONAL_RECOVERABLE_SOURCE_TAGGING_DEFECT" if v3 else
                 "NO_ELIGIBLE_ANNUAL_SOURCE" if meta is None else "ACCOUNTING_INCOMPLETE_OR_OTHER_BLOCKER")
        results.append({"historical_identity_id":x["historical_identity_id"],"historical_isin":x["historical_isin"],"decision_at":x["decision_at"],
          "primary_disposition":primary,"v1_authoritative_period_fix":v1fix,"v3_conditional_period_fix":v3,
          "source_semantics":sem if is_mismatch else None,"v3_comparable_segment_revenue":comparable,"v3_dominant_business":dominant,
          "v3_exact_basic_industry":leaf,"route_input":route_input,"blockers":blockers})
        if a.get("state")=="ACCOUNTING_INCOMPLETE" and sem:
            missing.append({"historical_identity_id":x["historical_identity_id"],"historical_isin":x["historical_isin"],"decision_at":x["decision_at"],
              "existing_blockers":a.get("blockers",[]),"related_intersegment_elimination_facts":sem["related_intersegment_elimination_facts"],
              "literal_annual_segment_facts":sem["literal_annual_segment_facts"],"segment_external_revenue_facts":sem["segment_external_revenue_facts"],
              "finding":("ALTERNATE_RELATED_FACTS_PRESENT_REVIEW_ONLY" if sem["related_intersegment_elimination_facts"] else "NO_ALTERNATE_RELATED_FACTS_FOUND")})
    results.sort(key=lambda x:(x["historical_identity_id"],x["decision_at"]));missing.sort(key=lambda x:(x["historical_identity_id"],x["decision_at"]))
    primary={}
    for x in results:primary[x["primary_disposition"]]=primary.get(x["primary_disposition"],0)+1
    core={"version":"P8_XBRL_SEGMENT_PERIOD_V3_CANARY_AUDIT_V1","v1_contract_blob":V1_BLOB,"v3_candidate_blob":EXPECTED_V3_BLOB,
          "canary_fingerprint":CANARY_FP,"pair_denominator":32,"primary_dispositions":primary,"diagnostic_counts":counts,
          "v1_authoritative_counts":{"comparable_segment_revenue":0,"complete_company_classification":0,"unique_route":0,"complete_normalized_input":0},
          "results":results}
    fp=stable(core);OUT.write_text(json.dumps({**core,"fingerprint_sha256":fp,"repeat_fingerprint_sha256":stable(json.loads(json.dumps(core,sort_keys=True,default=str)))},indent=2,sort_keys=True)+"\n")
    mcore={"version":"P8_XBRL_MISSING_ACCOUNTING_DISCLOSURE_AUDIT_V1","case_denominator":len(missing),"cases":missing}
    MISSING.write_text(json.dumps({**mcore,"fingerprint_sha256":stable(mcore)},indent=2,sort_keys=True)+"\n")
    print(json.dumps({"primary":primary,"diagnostic":counts,"v3_fingerprint":fp,"missing_cases":len(missing)},indent=2,sort_keys=True))
if __name__=="__main__":main()
