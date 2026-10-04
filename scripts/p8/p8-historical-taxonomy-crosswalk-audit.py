#!/usr/bin/env python3
import json, os, hashlib
from pathlib import Path
import psycopg

CAND=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CROSSWALK_CANDIDATE_V1.json")
V3=Path("docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_V3_CANARY_AUDIT_2026-10-04.json")
CAN=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_MANIFEST_2026-10-04.json")
OUT=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CROSSWALK_CANARY_AUDIT_2026-10-04.json")
EXPECTED="fd5a683ab595d98c71254ea8c825d5ae82338afb"
CANFP="b159764fd342aad3901717e04446596e93aa87d9c6726b7b3dd7ef8b55026dce"

def blobsha(b): return hashlib.sha1(f"blob {len(b)}\0".encode()+b).hexdigest()
def stable(x): return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(",",":"),default=str).encode()).hexdigest()
def norm(x): return ''.join(c if c.isalnum() else '_' for c in str(x or '').upper()).strip('_')

def app_taxonomy():
    url=os.environ["SUPABASE_DB_URL"]
    if "lrgpjimipfkyoqbpsqzz" not in url: raise RuntimeError("wrong Development DB")
    rows=[]
    with psycopg.connect(url,connect_timeout=20) as con, con.cursor() as cur:
        cur.execute("""select s.code,s.name,i.code,i.name
                       from public.industries i join public.sectors s on s.id=i.sector_id
                       where s.is_active and i.is_active order by s.code,i.code""")
        for a,b,c,d in cur.fetchall(): rows.append({"sector_code":a,"sector_name":b,"industry_code":c,"industry_name":d})
    return rows

def main():
    cb=CAND.read_bytes()
    if blobsha(cb)!=EXPECTED: raise RuntimeError("crosswalk candidate drift")
    cand=json.loads(cb); v3=json.loads(V3.read_text()); can=json.loads(CAN.read_text())
    if can["membership_fingerprint_sha256"]!=CANFP: raise RuntimeError("canary drift")
    apps=app_taxonomy()
    active={(norm(x["sector_name"]),norm(x["industry_name"])):x for x in apps}
    bydesc={e["source_description"]:e for e in cand["entries"]}
    results=[]; counts={}
    def inc(k): counts[k]=counts.get(k,0)+1
    for r in v3["results"]:
        desc=(r.get("v3_dominant_business") or {}).get("description")
        authoritative_classification=False; conditional_classification=False; crosswalk=None; blockers=[]
        if desc:
            e=bydesc.get(desc)
            if e:
                if desc=="Edible Oil":
                    authoritative_classification=True; inc("AUTHORITATIVE_COMPLETE_CLASSIFICATION")
                    blockers.append("UNSUPPORTED_EXISTING_METHODOLOGY")
                elif e["source_mapping_type"]=="OD2_SYNONYM_CANDIDATE":
                    conditional_classification=True; inc("CONDITIONAL_OD2_COMPLETE_CLASSIFICATION")
                    blockers.append("OD2_REVIEW_REQUIRED")
                    blockers.append("NO_SEMANTICALLY_COMPATIBLE_APPLICATION_CROSSWALK")
                else:
                    blockers.append(e["route_state"])
            else:
                blockers.append("NO_CROSSWALK_ENTRY")
        else:
            blockers.append("NO_DOMINANT_BUSINESS_OR_ACCOUNTING_BLOCKED")
        results.append({
          "historical_identity_id":r["historical_identity_id"],"historical_isin":r["historical_isin"],"decision_at":r["decision_at"],
          "dominant_description":desc,
          "authoritative_complete_classification":authoritative_classification,
          "conditional_od2_classification":conditional_classification,
          "application_crosswalk":crosswalk,
          "authoritative_unique_route":False,
          "conditional_unique_route":False,
          "normalized_input_state":"NOT_EVALUATED_NO_SUPPORTED_ROUTE",
          "blockers":blockers
        })
    counts.setdefault("AUTHORITATIVE_COMPLETE_CLASSIFICATION",0)
    counts.setdefault("CONDITIONAL_OD2_COMPLETE_CLASSIFICATION",0)
    counts["AUTHORITATIVE_UNIQUE_ROUTE"]=0
    counts["CONDITIONAL_UNIQUE_ROUTE"]=0
    counts["COMPLETE_NORMALIZED_INPUT"]=0
    core={"version":"P8_HISTORICAL_TAXONOMY_CROSSWALK_CANARY_AUDIT_V1","candidate_blob":EXPECTED,
      "canary_fingerprint":CANFP,"pair_denominator":32,"active_application_taxonomy":apps,"counts":counts,
      "results":sorted(results,key=lambda x:(x["historical_identity_id"],x["decision_at"]))}
    fp=stable(core)
    OUT.write_text(json.dumps({**core,"fingerprint_sha256":fp,"repeat_fingerprint_sha256":stable(json.loads(json.dumps(core,sort_keys=True)))},indent=2,sort_keys=True)+"\n")
    print(json.dumps({"counts":counts,"active_application_industries":len(apps),"fingerprint":fp},indent=2))
if __name__=="__main__": main()
