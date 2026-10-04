import fs from "node:fs"
import crypto from "node:crypto"
import { routeResearchProfileV1, RESEARCH_PROFILE_ROUTING_VERSION } from "../../src/features/research/researchProfileRouting"
const path="docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CROSSWALK_CANARY_AUDIT_2026-10-04.json"
const reg=JSON.parse(fs.readFileSync("docs/p7-ic/PortfolioAI_P7_IC1_METHODOLOGY_R7_REGISTRY_V1.json","utf8"))
const a=JSON.parse(fs.readFileSync(path,"utf8"))
const theoreticalEdible=routeResearchProfileV1({assetClass:"EQUITY",applicationSector:"FMCG",applicationIndustry:"Vegetable Oils Products"})
const branded=reg.profiles.find((p:any)=>p.profileCode==="BRANDED_CONSUMER_FMCG")
const agri=reg.profiles.find((p:any)=>p.profileCode==="AGRI_PROCESSING")
a.routing_authority_validation={
  router_version:RESEARCH_PROFILE_ROUTING_VERSION,
  theoretical_edible_oil_router_alias:theoreticalEdible,
  theoretical_alias_accepted_as_crosswalk:false,
  rejection_reason:"No active application taxonomy target exists and Edible Oil alone does not prove branded-consumer methodology semantics.",
  branded_consumer_profile_exists:Boolean(branded),
  branded_consumer_required_signals:(branded?.signalRequirements||[]).filter((s:any)=>s.required!==false).map((s:any)=>s.signalCode),
  agri_processing_profile_exists:Boolean(agri),
  agri_processing_exposed_by_router_source:false
}
for(const r of a.results){
  if(r.application_crosswalk){
    const routed=routeResearchProfileV1({assetClass:"EQUITY",applicationSector:r.application_crosswalk.sector_name,applicationIndustry:r.application_crosswalk.industry_name})
    r.router_result=routed
  } else r.router_result=null
}
a.input_completeness={authoritative_routes:0,conditional_routes:0,complete_normalized_input_pairs:0,reason:"No semantically supported application crosswalk reaches the canonical router."}
a.final_fingerprint_sha256=crypto.createHash("sha256").update(JSON.stringify(a)).digest("hex")
fs.writeFileSync(path,JSON.stringify(a,null,2)+"\n")
console.log(JSON.stringify(a.routing_authority_validation,null,2))
