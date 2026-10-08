import fs from "node:fs"
import crypto from "node:crypto"
import { routeResearchProfileV1, RESEARCH_PROFILE_ROUTING_VERSION } from "../../src/features/research/researchProfileRouting"

type RegistrySignal = {
  readonly signalCode: string
  readonly required?: boolean
  readonly evidenceCodes?: readonly string[]
  readonly minimumPeriods?: number
  readonly freshnessPolicy?: string
}
type RegistryProfile = { readonly profileCode: string; readonly signalRequirements?: readonly RegistrySignal[] }
type Registry = { readonly profiles: readonly RegistryProfile[] }
type Crosswalk = { readonly sector_name: string; readonly industry_name: string }
type AuditRow = {
  readonly application_crosswalk?: Crosswalk | null
  router_result?: ReturnType<typeof routeResearchProfileV1> | null
}
type Audit = {
  readonly results: AuditRow[]
  routing_authority_validation?: Record<string, unknown>
  input_completeness?: Record<string, unknown>
  final_fingerprint_sha256?: string
}

const path="docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CROSSWALK_CANARY_AUDIT_2026-10-04.json"
const reg=JSON.parse(fs.readFileSync("docs/p7-ic/PortfolioAI_P7_IC1_METHODOLOGY_R7_REGISTRY_V1.json","utf8")) as Registry
const a=JSON.parse(fs.readFileSync(path,"utf8")) as Audit
const theoreticalEdible=routeResearchProfileV1({assetClass:"EQUITY",applicationSector:"FMCG",applicationIndustry:"Vegetable Oils Products"})
const branded=reg.profiles.find((profile)=>profile.profileCode==="BRANDED_CONSUMER_FMCG")
const agri=reg.profiles.find((profile)=>profile.profileCode==="AGRI_PROCESSING")
a.routing_authority_validation={
  router_version:RESEARCH_PROFILE_ROUTING_VERSION,
  theoretical_edible_oil_router_alias:theoreticalEdible,
  theoretical_alias_accepted_as_crosswalk:false,
  rejection_reason:"No active application taxonomy target exists and Edible Oil alone does not prove branded-consumer methodology semantics.",
  branded_consumer_profile_exists:Boolean(branded),
  branded_consumer_required_signals:(branded?.signalRequirements??[]).filter((signal)=>signal.required!==false).map((signal)=>signal.signalCode),
  agri_processing_profile_exists:Boolean(agri),
  agri_processing_exposed_by_router_source:false
}
for(const row of a.results){
  if(row.application_crosswalk){
    row.router_result=routeResearchProfileV1({assetClass:"EQUITY",applicationSector:row.application_crosswalk.sector_name,applicationIndustry:row.application_crosswalk.industry_name})
  } else row.router_result=null
}
a.input_completeness={authoritative_routes:0,conditional_routes:0,complete_normalized_input_pairs:0,reason:"No semantically supported application crosswalk reaches the canonical router."}
a.final_fingerprint_sha256=crypto.createHash("sha256").update(JSON.stringify(a)).digest("hex")
fs.writeFileSync(path,JSON.stringify(a,null,2)+"\n")
console.log(JSON.stringify(a.routing_authority_validation,null,2))
