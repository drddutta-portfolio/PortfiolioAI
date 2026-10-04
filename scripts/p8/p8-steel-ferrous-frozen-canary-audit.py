#!/usr/bin/env python3
import json, hashlib
from pathlib import Path

CANARY=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_MANIFEST_2026-10-04.json")
V3=Path("docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_V3_CANARY_AUDIT_2026-10-04.json")
OUT=Path("docs/p8/PortfolioAI_P8_STEEL_FERROUS_FROZEN_CANARY_AUDIT_2026-10-05.json")
EXPECTED_FP="b159764fd342aad3901717e04446596e93aa87d9c6726b7b3dd7ef8b55026dce"
STEEL_ID="19f21fe6-46c9-5f26-9ee5-6207558ba10b"
EDIBLE_ID="b33c4aee-1095-5010-907f-7fbd7b6efb89"

def stable(x):
    return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(",",":"),default=str).encode()).hexdigest()

canary=json.loads(CANARY.read_text())
v3=json.loads(V3.read_text())
assert canary["membership_fingerprint_sha256"]==EXPECTED_FP
assert v3["canary_fingerprint"]==EXPECTED_FP
assert len(v3["results"])==32

results=[]
for r in sorted(v3["results"],key=lambda x:(x["historical_identity_id"],x["decision_at"])):
    hid=r["historical_identity_id"]
    if hid==STEEL_ID:
        disposition="ROUTED_STEEL_FERROUS_INPUTS_INCOMPLETE"
        route={
          "profile":"STEEL_FERROUS",
          "engine":"METALS_COMMODITIES",
          "methodology_version":"METALS_COMMODITIES_K4A_METHODOLOGY_V1",
          "scoring_version":"METALS_COMMODITIES_K4B_SCORING_V1",
          "basic_industry_code":"IN070205015"
        }
    elif hid==EDIBLE_ID:
        disposition="AUTHORITATIVE_CLASSIFICATION_OUTSIDE_THIS_INTEGRATION"
        route=None
    else:
        disposition="NOT_ROUTED_OUTSIDE_EXACT_IN070205015"
        route=None
    results.append({
      "historical_identity_id":hid,
      "historical_isin":r["historical_isin"],
      "decision_at":r["decision_at"],
      "disposition":disposition,
      "route":route,
      "existing_accounting_blockers":r.get("blockers",[]),
    })

counts={
 "pair_denominator":32,
 "authoritative_complete_classifications":2,
 "exact_integrated_steel_ferrous_routes":sum(1 for x in results if x["route"]),
 "authoritative_classification_outside_integration":sum(1 for x in results if x["disposition"]=="AUTHORITATIVE_CLASSIFICATION_OUTSIDE_THIS_INTEGRATION"),
 "not_routed_other_pairs":sum(1 for x in results if x["disposition"]=="NOT_ROUTED_OUTSIDE_EXACT_IN070205015"),
 "accidental_negative_control_routes":0,
 "complete_input_pairs":0,
 "nonzero_intersegment_blocked_pairs":sum(1 for r in v3["results"] if "NONZERO_INTERSEGMENT_WITHOUT_SEGMENT_EXTERNAL_REVENUE" in r.get("blockers",[])),
}

core={
 "version":"P8_STEEL_FERROUS_FROZEN_CANARY_AUDIT_V2",
 "measurement_scope":"Prior identity-assigned route report; not independent canonical-router or input measurement",
 "canary_fingerprint":EXPECTED_FP,
 "integration_contract_blob":"a0d1700cab6f63ddaaf65986cad9cc3fc31f27b8",
 "counts":counts,
 "steel_input_readiness":{
   "historical_identity_id":STEEL_ID,
   "decision_at":"2024-11-29T10:00:00+00:00",
   "state":"INPUTS_INCOMPLETE",
   "normalized_ready_signals":0,
   "required_signal_count":11,
   "market_history":{
     "p8_b3_adjusted_rows_before_decision":None,
     "state":"NOT_MEASURED_R2_CANONICAL_HISTORY",
     "legacy_sql_table_expected_rows":0,
     "note":"Canonical B3 adjusted series are R2-backed; the legacy SQL table must remain empty. Do not infer absent market history from SQL."
   }
 },
 "results":results,
 "boundary":{
   "candidate_25761_surface":"NOT_AUTHORIZED_NOT_MEASURED",
   "historical_r6_r10_replay":False,
   "investment_outputs_generated":False
 }
}
fp=stable(core)
out={**core,"fingerprint_sha256":fp,"repeat_fingerprint_sha256":stable(json.loads(json.dumps(core,sort_keys=True)))}
OUT.write_text(json.dumps(out,indent=2,sort_keys=True)+"\n")
print(json.dumps({"counts":counts,"fingerprint":fp},indent=2))
