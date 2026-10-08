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
type RouteInput = { readonly applicationSector: string; readonly applicationIndustry: string }
type AuditRow = {
  readonly route_input?: RouteInput | null
  readonly authoritative_classification?: boolean
  router_result?: ReturnType<typeof routeResearchProfileV1> | null
  metric_requirement_state?: string
  required_signals?: readonly {
    readonly signalCode: string
    readonly evidenceCodes: readonly string[] | null
    readonly minimumPeriods: number | null
    readonly freshnessPolicy: string | null
  }[]
}
type Audit = {
  readonly results: AuditRow[]
  readonly counts: Record<string, number>
  router_execution?: Record<string, unknown>
  metric_input_completeness?: Record<string, unknown>
  final_fingerprint_sha256?: string
}

const path="docs/p8/PortfolioAI_P8_SEGMENT_REVENUE_CANARY_CLASSIFICATION_AUDIT_2026-10-04.json"
const registry=JSON.parse(fs.readFileSync("docs/p7-ic/PortfolioAI_P7_IC1_METHODOLOGY_R7_REGISTRY_V1.json","utf8")) as Registry
const audit=JSON.parse(fs.readFileSync(path,"utf8")) as Audit
const pharmaSmoke=routeResearchProfileV1({assetClass:"EQUITY",applicationSector:"Pharma",applicationIndustry:"Pharmaceuticals"})
if (pharmaSmoke.state!=="ROUTED" || pharmaSmoke.profileCode!=="PHARMA") throw new Error("canonical PHARMA router smoke failed")
const unsupportedSmoke=routeResearchProfileV1({assetClass:"EQUITY",applicationSector:"Healthcare",applicationIndustry:"Unknown Industry"})
if (unsupportedSmoke.state==="ROUTED") throw new Error("unsupported industry unexpectedly routed")
let candidateRoutes=0
let authoritativeRoutes=0
let candidateRequirementsSelected=0
const completeInputs=0
for (const row of audit.results) {
  row.router_result=null
  row.metric_requirement_state="NOT_EVALUATED_NO_ROUTE"
  row.required_signals=[]
  if (!row.route_input) continue
  const input={assetClass:"EQUITY",applicationSector:row.route_input.applicationSector,applicationIndustry:row.route_input.applicationIndustry}
  const routed=routeResearchProfileV1(input)
  row.router_result=routed
  if (routed.version!==RESEARCH_PROFILE_ROUTING_VERSION) throw new Error("router version mismatch")
  if (routed.state==="ROUTED" && routed.profileCode) {
    candidateRoutes++
    if (row.authoritative_classification) authoritativeRoutes++
    const profile=registry.profiles.find((candidate)=>candidate.profileCode===routed.profileCode)
    if (profile) {
      row.required_signals=(profile.signalRequirements??[]).filter((signal)=>signal.required!==false).map((signal)=>({
        signalCode:signal.signalCode,
        evidenceCodes:signal.evidenceCodes??null,
        minimumPeriods:signal.minimumPeriods??null,
        freshnessPolicy:signal.freshnessPolicy??null
      }))
      candidateRequirementsSelected++
      row.metric_requirement_state="CANONICAL_REQUIREMENTS_SELECTED_HISTORICAL_NORMALIZED_INPUTS_UNPROVEN"
    } else {
      row.metric_requirement_state="ROUTED_PROFILE_NOT_FOUND_IN_REGISTRY"
    }
  } else {
    row.metric_requirement_state="ROUTE_NOT_SUPPORTED"
  }
}
audit.router_execution={version:RESEARCH_PROFILE_ROUTING_VERSION,candidate_routes:candidateRoutes,authoritative_routes:authoritativeRoutes}
audit.metric_input_completeness={
  candidate_routes_with_requirements_selected:candidateRequirementsSelected,
  complete_normalized_input_pairs:completeInputs,
  reason:"No authoritative route exists while OD1-OD3 remain unapproved. For candidate routes, canonical requirements are selected but existing raw historical XBRL is not promoted to normalized route input completeness without an explicit canonical normalization mapping."
}
audit.counts.CANDIDATE_UNIQUE_ROUTE=candidateRoutes
audit.counts.AUTHORITATIVE_UNIQUE_ROUTE=authoritativeRoutes
audit.counts.COMPLETE_NORMALIZED_INPUT=completeInputs
audit.final_fingerprint_sha256=crypto.createHash("sha256").update(JSON.stringify(audit)).digest("hex")
fs.writeFileSync(path,JSON.stringify(audit,null,2)+"\n")
console.log(JSON.stringify({candidateRoutes,authoritativeRoutes,candidateRequirementsSelected,completeInputs,fingerprint:audit.final_fingerprint_sha256},null,2))
