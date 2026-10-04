#!/usr/bin/env python3
import json, os, re, hashlib
from pathlib import Path
import psycopg

ROOT=Path(".")
REG=ROOT/"docs/p7-ic/PortfolioAI_P7_IC1_METHODOLOGY_R7_REGISTRY_V1.json"
V3=ROOT/"docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_V3_CANARY_AUDIT_2026-10-04.json"
ROUTER=ROOT/"src/features/research/researchProfileRouting.ts"
ENGINES=ROOT/"src/features/research/sectorEngineRegistry.ts"
RESOLUTION=ROOT/"src/features/research/scoringProfileResolution.ts"
OUT=ROOT/"docs/p8/PortfolioAI_P8_APPLICATION_TAXONOMY_METHODOLOGY_COVERAGE_AUDIT_2026-10-04.json"
VERSION="P8_APPLICATION_TAXONOMY_METHODOLOGY_COVERAGE_AUDIT_V1"

def stable(x): return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(",",":"),default=str).encode()).hexdigest()

def norm(x): return re.sub(r"[^A-Z0-9]+","_",str(x or "").upper()).strip("_")

def active_application_taxonomy():
    db=os.environ["SUPABASE_DB_URL"]
    if "lrgpjimipfkyoqbpsqzz" not in db: raise RuntimeError("wrong Development DB")
    rows=[]
    with psycopg.connect(db,connect_timeout=20) as con, con.cursor() as cur:
        cur.execute("""select s.code,s.name,i.code,i.name
                       from public.industries i join public.sectors s on s.id=i.sector_id
                       where s.is_active and i.is_active order by s.code,i.code""")
        for sc,sn,ic,inn in cur.fetchall():
            rows.append({"sector_code":sc,"sector_name":sn,"industry_code":ic,"industry_name":inn})
    return rows

def profile(reg,code):
    return next((p for p in reg.get("profiles",[]) if p.get("profileCode")==code),None)

def required_signals(p):
    out=[]
    for s in (p or {}).get("signalRequirements",[]):
        if s.get("required",True) is False: continue
        out.append({
          "signalCode":s.get("signalCode"),
          "evidenceCodes":s.get("evidenceCodes"),
          "minimumPeriods":s.get("minimumPeriods"),
          "freshnessPolicy":s.get("freshnessPolicy"),
          "normalizationCurve":s.get("normalizationCurve"),
          "sourceAuthority":s.get("sourceAuthority")
        })
    return out

def main():
    reg=json.loads(REG.read_text())
    v3=json.loads(V3.read_text())
    router=ROUTER.read_text()
    engines=ENGINES.read_text()
    resolution=RESOLUTION.read_text()
    apps=active_application_taxonomy()

    dominant={r.get("v3_dominant_business",{}).get("description"):r for r in v3["results"] if r.get("v3_dominant_business")}
    edible=dominant["Edible Oil"]
    steel=dominant["Manufacturing- Steel Pipes"]

    profiles={}
    for code in ["AGRI_PROCESSING","BRANDED_CONSUMER_FMCG","STEEL_FERROUS","CAPITAL_EQUIPMENT_ELECTRICAL","INDUSTRIAL_CAPITAL_GOODS"]:
        p=profile(reg,code)
        profiles[code]={
          "registry_present":p is not None,
          "methodologyAuthority":p.get("methodologyAuthority") if p else None,
          "familyCode":p.get("familyCode") if p else None,
          "required_signals":required_signals(p),
          "router_exposed":code in router,
          "sector_engine_registered":code in engines,
        }

    # Scoring adapter maturity is common architecture behavior:
    # non BANK/PHARMA sector engines resolve to PENDING_ADAPTER.
    adapter_pending_marker='SECTOR_SCORING_ADAPTER_PENDING' in resolution

    edible_evidence={
      "dominant_segment":"Edible Oil",
      "dominance_ratio":edible["v3_dominant_business"]["ratio"],
      "other_segments":[x["description"] for x in edible["source_semantics"]["four_revenue"] if x["description"]!="Edible Oil"],
      "historical_business_attributes_proven":[
        "EDIBLE_OIL_SEGMENT",
        "SEGMENT_REVENUE_DOMINANCE",
        "FOOD_AND_FMCG_SECONDARY_SEGMENT",
        "INDUSTRY_ESSENTIALS_SECONDARY_SEGMENT"
      ],
      "not_proven_in_selected_historical_source":[
        "PROCUREMENT_AND_PROCESSING_MOAT",
        "BRAND_CUSTOMER_SUPPLY_CHAIN",
        "BRAND_DISTRIBUTION_CATEGORY_DURABILITY",
        "PRODUCT_CATEGORY_BRAND_POSITIONING",
        "CROP_INPUT_PRICE_FX_CUSTOMER_CONCENTRATION"
      ]
    }

    steel_evidence={
      "dominant_segment":"Manufacturing- Steel Pipes",
      "dominance_ratio":steel["v3_dominant_business"]["ratio"],
      "other_segments":[x["description"] for x in steel["source_semantics"]["four_revenue"] if x["description"]!="Manufacturing- Steel Pipes"],
      "historical_business_attributes_proven":[
        "STEEL_PIPE_MANUFACTURING_SEGMENT",
        "SEGMENT_REVENUE_DOMINANCE",
        "BUILDING_MATERIAL_AND_STEEL_PRODUCTS_TRADING_SECONDARY_SEGMENT"
      ],
      "not_proven_in_selected_historical_source":[
        "UPSTREAM_STEEL_PRODUCTION",
        "RAW_MATERIAL_INTEGRATION",
        "IRON_ORE_OR_COKING_COAL_COST_POSITION",
        "STEEL_SPREAD_CYCLE_EXPOSURE",
        "ELECTRICAL_EQUIPMENT_BUSINESS",
        "ORDER_BOOK_ELECTRICAL_OR_CAPITAL_EQUIPMENT_SEMANTICS"
      ]
    }

    result={
      "version":VERSION,
      "authorities":{
        "v1_blob":"45e990981371dba217d12c430f8ce567acbf25fc",
        "v3_blob":"797b7e91d7770f3377d0061ee338c76e8220391f",
        "crosswalk_blob":"fd5a683ab595d98c71254ea8c825d5ae82338afb",
        "router_version":"RESEARCH_PROFILE_ROUTING_V2"
      },
      "application_taxonomy":{"active_count":len(apps),"rows":apps},
      "profile_inventory":profiles,
      "scoring_runtime":{"non_bank_pharma_sector_adapter_pending":adapter_pending_marker},
      "edible_oil":{
        "authoritative_taxonomy":"IN04 > IN0401 > IN040101 > IN040101001",
        "source_evidence":edible_evidence,
        "AGRI_PROCESSING":{
          "semantic_compatibility":"PLAUSIBLE_BUT_NOT_PROVEN",
          "business_applicability_evidence":"INSUFFICIENT",
          "registry_profile":"PRESENT",
          "router":"NOT_EXPOSED",
          "sector_engine":"NOT_REGISTERED",
          "live_scoring_runtime":"UNIMPLEMENTED_IN_CANONICAL_SECTOR_ENGINE_PATH",
          "missing_dependency":[
            "POINT_IN_TIME_PROCESSING_PROCUREMENT_BUSINESS_APPLICABILITY_EVIDENCE",
            "CANONICAL_SECTOR_ENGINE_IMPLEMENTATION_OR_EQUIVALENT_EXECUTION_AUTHORITY",
            "CANONICAL_ROUTER_INTEGRATION",
            "APPLICATION_TAXONOMY_REPRESENTATION"
          ]
        },
        "BRANDED_CONSUMER_FMCG":{
          "semantic_compatibility":"NOT_PROVEN_FROM_EDIBLE_OIL_CLASSIFICATION",
          "business_applicability_evidence":"INSUFFICIENT_BRAND_DISTRIBUTION_CATEGORY_PROOF",
          "registry_profile":"PRESENT",
          "router":"EXPOSED",
          "sector_engine":"IMPLEMENTED",
          "live_scoring_runtime":"PENDING_ADAPTER",
          "missing_dependency":[
            "POINT_IN_TIME_BRAND_DISTRIBUTION_CATEGORY_APPLICABILITY_EVIDENCE",
            "ACTIVE_APPLICATION_TAXONOMY_TARGET",
            "LIVE_SCORING_ADAPTER_IF_RUNTIME_EXECUTION_REQUIRED"
          ]
        },
        "disposition":"NOT_BLOCKED_ONLY_BY_WIRING"
      },
      "iron_steel_products":{
        "authoritative_taxonomy":"IN07 > IN0702 > IN070205 > IN070205015",
        "source_evidence":steel_evidence,
        "STEEL_FERROUS":{
          "semantic_compatibility":"NOT_PROVEN_FOR_DOWNSTREAM_STEEL_PIPE_MANUFACTURER",
          "business_applicability_evidence":"INSUFFICIENT_COMMODITY_CYCLE_AND_RAW_MATERIAL_INTEGRATION_PROOF",
          "registry_profile":"PRESENT",
          "router":"EXPOSED_FOR_METALS_MINING_CLASSIFICATION",
          "sector_engine":"IMPLEMENTED",
          "live_scoring_runtime":"PENDING_ADAPTER",
          "missing_dependency":[
            "POINT_IN_TIME_STEEL_COMMODITY_PROFILE_APPLICABILITY_EVIDENCE",
            "SEMANTICALLY_VALID_APPLICATION_TAXONOMY_TARGET",
            "LIVE_SCORING_ADAPTER_IF_RUNTIME_EXECUTION_REQUIRED"
          ]
        },
        "CAPITAL_EQUIPMENT_ELECTRICAL":{
          "semantic_compatibility":"REJECTED_ON_CURRENT_EVIDENCE",
          "business_applicability_evidence":"NO_ELECTRICAL_EQUIPMENT_OR_CAPITAL_EQUIPMENT_PRODUCT_PROOF",
          "registry_profile":"PRESENT",
          "router":"EXPOSED",
          "sector_engine":"IMPLEMENTED",
          "live_scoring_runtime":"PENDING_ADAPTER",
          "missing_dependency":["PROFILE_SEMANTICS_NOT_SATISFIED"]
        },
        "disposition":"NOT_BLOCKED_ONLY_BY_WIRING"
      },
      "answers":{
        "either_case_blocked_only_by_missing_wiring":False,
        "either_requires_additional_historical_business_evidence":True,
        "registered_but_unimplemented_profile":"AGRI_PROCESSING",
        "next_owner_change":"AUTHORIZE_BOUNDED_BUSINESS_APPLICABILITY_EVIDENCE_AND_METHODOLOGY_COVERAGE_DECISION; DO_NOT_WIRE_ROUTE_YET"
      },
      "broad_processing":"NOT_AUTHORIZED_NOT_MEASURED"
    }
    fp=stable(result)
    OUT.write_text(json.dumps({**result,"fingerprint_sha256":fp,"repeat_fingerprint_sha256":stable(json.loads(json.dumps(result,sort_keys=True)))},indent=2,sort_keys=True)+"\n")
    print(json.dumps({"fingerprint":fp,"answers":result["answers"],"app_taxonomy_count":len(apps)},indent=2))

if __name__=="__main__": main()
