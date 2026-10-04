import fs from "node:fs"
import crypto from "node:crypto"
import { routeResearchProfileV1, RESEARCH_PROFILE_ROUTING_VERSION } from "../../src/features/research/researchProfileRouting"
const path="docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_V3_CANARY_AUDIT_2026-10-04.json"
const registry=JSON.parse(fs.readFileSync("docs/p7-ic/PortfolioAI_P7_IC1_METHODOLOGY_R7_REGISTRY_V1.json","utf8"))
const a=JSON.parse(fs.readFileSync(path,"utf8"))
let candidateRoutes=0, authoritativeRoutes=0, requirementsSelected=0, completeInputs=0
for(const r of a.results){
  r.router_result=null;r.required_signals=[];r.metric_requirement_state="NOT_EVALUATED_NO_ROUTE"
  if(!r.route_input) continue
  const route=routeResearchProfileV1(r.route_input);r.router_result=route
  if(route.version!==RESEARCH_PROFILE_ROUTING_VERSION) throw new Error("router version drift")
  if(route.state==="ROUTED"&&route.profileCode){
    candidateRoutes++
    const p=(registry.profiles||[]).find((x:any)=>x.profileCode===route.profileCode)
    if(p){r.required_signals=(p.signalRequirements||[]).filter((s:any)=>s.required!==false);requirementsSelected++;r.metric_requirement_state="CONDITIONAL_ROUTE_REQUIREMENTS_SELECTED_INPUT_COMPLETENESS_UNPROVEN"}
  }
}
a.route_summary={router_version:RESEARCH_PROFILE_ROUTING_VERSION,conditional_candidate_routes:candidateRoutes,authoritative_routes:authoritativeRoutes}
a.input_summary={conditional_routes_with_requirements_selected:requirementsSelected,authoritative_complete_normalized_inputs:completeInputs,
 reason:"V3 is not owner-approved; no conditional result is replay-ready. Raw XBRL is not promoted to canonical normalized route inputs."}
a.final_fingerprint_sha256=crypto.createHash("sha256").update(JSON.stringify(a)).digest("hex")
fs.writeFileSync(path,JSON.stringify(a,null,2)+"\n")
console.log(JSON.stringify({candidateRoutes,authoritativeRoutes,requirementsSelected,completeInputs,fingerprint:a.final_fingerprint_sha256},null,2))
