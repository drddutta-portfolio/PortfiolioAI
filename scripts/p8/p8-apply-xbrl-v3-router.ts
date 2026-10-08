import fs from "node:fs"
import crypto from "node:crypto"
import { routeResearchProfileV1, RESEARCH_PROFILE_ROUTING_VERSION } from "../../src/features/research/researchProfileRouting"

type RegistrySignal = { readonly required?: boolean; readonly signalCode: string; readonly [key: string]: unknown }
type RegistryProfile = { readonly profileCode: string; readonly signalRequirements?: readonly RegistrySignal[] }
type Registry = { readonly profiles: readonly RegistryProfile[] }
type RouteInput = Parameters<typeof routeResearchProfileV1>[0]
type AuditRow = {
  readonly route_input?: RouteInput | null
  router_result?: ReturnType<typeof routeResearchProfileV1> | null
  required_signals?: readonly RegistrySignal[]
  metric_requirement_state?: string
}
type Audit = {
  readonly results: AuditRow[]
  route_summary?: Record<string, unknown>
  input_summary?: Record<string, unknown>
  final_fingerprint_sha256?: string
}

const path="docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_V3_CANARY_AUDIT_2026-10-04.json"
const registry=JSON.parse(fs.readFileSync("docs/p7-ic/PortfolioAI_P7_IC1_METHODOLOGY_R7_REGISTRY_V1.json","utf8")) as Registry
const audit=JSON.parse(fs.readFileSync(path,"utf8")) as Audit
let candidateRoutes=0
const authoritativeRoutes=0
let requirementsSelected=0
const completeInputs=0
for(const row of audit.results){
  row.router_result=null
  row.required_signals=[]
  row.metric_requirement_state="NOT_EVALUATED_NO_ROUTE"
  if(!row.route_input) continue
  const route=routeResearchProfileV1(row.route_input)
  row.router_result=route
  if(route.version!==RESEARCH_PROFILE_ROUTING_VERSION) throw new Error("router version drift")
  if(route.state==="ROUTED"&&route.profileCode){
    candidateRoutes++
    const profile=registry.profiles.find((candidate)=>candidate.profileCode===route.profileCode)
    if(profile){
      row.required_signals=(profile.signalRequirements??[]).filter((signal)=>signal.required!==false)
      requirementsSelected++
      row.metric_requirement_state="CONDITIONAL_ROUTE_REQUIREMENTS_SELECTED_INPUT_COMPLETENESS_UNPROVEN"
    }
  }
}
audit.route_summary={router_version:RESEARCH_PROFILE_ROUTING_VERSION,conditional_candidate_routes:candidateRoutes,authoritative_routes:authoritativeRoutes}
audit.input_summary={conditional_routes_with_requirements_selected:requirementsSelected,authoritative_complete_normalized_inputs:completeInputs,
 reason:"V3 is not owner-approved; no conditional result is replay-ready. Raw XBRL is not promoted to canonical normalized route inputs."}
audit.final_fingerprint_sha256=crypto.createHash("sha256").update(JSON.stringify(audit)).digest("hex")
fs.writeFileSync(path,JSON.stringify(audit,null,2)+"\n")
console.log(JSON.stringify({candidateRoutes,authoritativeRoutes,requirementsSelected,completeInputs,fingerprint:audit.final_fingerprint_sha256},null,2))
