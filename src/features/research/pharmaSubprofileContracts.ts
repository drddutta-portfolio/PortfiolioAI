import { PHARMA_RESEARCH_PROFILE_GATE_G } from "./pharmaResearchProfileGateG"
import type { PharmaSubprofileCode } from "./pharmaSubprofileAssignment"
import type { ResearchMetricContract, ResearchMetricEvidence, ResearchProfileContract } from "./researchProfileContract"

export interface PharmaSubprofileMetricOverride {
  readonly metricCode: string
  readonly reason: string
  readonly changes: Partial<Omit<ResearchMetricContract, "metricCode">>
}
export interface PharmaSubprofileContract {
  readonly subprofileCode: PharmaSubprofileCode
  readonly contractVersion: string
  readonly displayName: string
  readonly additions: readonly ResearchMetricContract[]
  readonly overrides: readonly PharmaSubprofileMetricOverride[]
}

const annual = { minimumObservations: 3, preferredObservations: 5, historyUnit: "YEAR" } as const
const quarterly = { minimumObservations: 4, preferredObservations: 8, historyUnit: "QUARTER" } as const
const event = { minimumObservations: 1, preferredObservations: 1, historyUnit: "EVENT" } as const

function requirement(definition: ResearchMetricContract): ResearchMetricContract {
  return definition
}

const DOMESTIC_FORMULATIONS = {
  subprofileCode: "DOMESTIC_FORMULATIONS",
  contractVersion: "DOMESTIC_FORMULATIONS_V1",
  displayName: "Domestic Formulations",
  overrides: [{
    metricCode: "PHARMA_DOMESTIC_REVENUE_GROWTH",
    reason: "Domestic formulations revenue is a primary business-model input.",
    changes: { applicability: "APPLICABLE", requirementLevel: "MANDATORY", history: annual, conditionCode: null },
  }],
  additions: [
    requirement({ metricCode: "PHARMA_FIELD_FORCE_PRODUCTIVITY", dimension: "BUSINESS_DURABILITY", applicability: "APPLICABLE", requirementLevel: "MANDATORY", periodTypes: ["YEAR"], history: annual, direction: "CUSTOM", normalizationMethod: "disclosed_domestic_revenue_per_disclosed_mr", calculationOwner: "PORTFOLIOAI", sourceContract: "Issuer-disclosed MR headcount and compatible domestic revenue; employee totals and inferred headcount are prohibited.", freshnessPolicy: "Current annual disclosure with three comparable periods.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_DOMESTIC_FIELD_FORCE", conditionCode: null }),
    requirement({ metricCode: "PHARMA_BRAND_THERAPY_LEADERSHIP", dimension: "BUSINESS_DURABILITY", applicability: "APPLICABLE", requirementLevel: "MANDATORY", periodTypes: ["YEAR", "EVENT"], history: annual, direction: "CUSTOM", normalizationMethod: "reviewed_therapy_share_rank_and_franchise_evidence", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer evidence plus an approved licensed market source for material therapy/brand leadership.", freshnessPolicy: "Current annual or material-event review covering material therapies.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_DOMESTIC_LEADERSHIP", conditionCode: null }),
    requirement({ metricCode: "PHARMA_DOMESTIC_EXPOSURE_MATERIALITY_REVIEW", dimension: "RISK", applicability: "APPLICABLE", requirementLevel: "MANDATORY", periodTypes: ["POINT_IN_TIME", "EVENT"], history: event, direction: "INFORMATIONAL", normalizationMethod: "reviewed_export_and_regulatory_materiality_state", calculationOwner: "OFFICIAL_EVIDENCE", sourceContract: "Reviewed issuer segment/site and regulator evidence with an explicit ACTIVE or INACTIVE decision.", freshnessPolicy: "Annual review and every material exposure/site event.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_DOMESTIC_MATERIALITY", conditionCode: null }),
    requirement({ metricCode: "PHARMA_NEW_LAUNCH_CONTRIBUTION", dimension: "GROWTH", applicability: "APPLICABLE", requirementLevel: "IMPORTANT", periodTypes: ["YEAR"], history: annual, direction: "CUSTOM", normalizationMethod: "disclosed_launch_revenue_contribution", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer filing/presentation disclosure; qualitative claims do not become numeric percentages.", freshnessPolicy: "Latest completed annual period when disclosed.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_DOMESTIC_LAUNCH", conditionCode: null }),
    requirement({ metricCode: "PHARMA_CHRONIC_ACUTE_MIX", dimension: "BUSINESS_DURABILITY", applicability: "APPLICABLE", requirementLevel: "IMPORTANT", periodTypes: ["YEAR"], history: annual, direction: "INFORMATIONAL", normalizationMethod: "reviewed_therapy_mix_history", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer disclosure or approved licensed source; missing mix remains unavailable.", freshnessPolicy: "Latest annual disclosure when available.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_DOMESTIC_MIX", conditionCode: null }),
    requirement({ metricCode: "PHARMA_DOMESTIC_PIPELINE_EVIDENCE", dimension: "BUSINESS_DURABILITY", applicability: "APPLICABLE", requirementLevel: "IMPORTANT", periodTypes: ["EVENT", "YEAR"], history: { ...event, preferredObservations: 3 }, direction: "INFORMATIONAL", normalizationMethod: "reviewed_domestic_launch_pipeline_events", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer filings, presentations and earnings-call evidence for material domestic launches and outcomes.", freshnessPolicy: "Current pipeline plus material events in the last three years.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_DOMESTIC_PIPELINE", conditionCode: null }),
    requirement({ metricCode: "PHARMA_INLICENSING_MA_EXECUTION", dimension: "GOVERNANCE", applicability: "APPLICABLE", requirementLevel: "SUPPLEMENTARY", periodTypes: ["EVENT"], history: { ...event, preferredObservations: 4 }, direction: "INFORMATIONAL", normalizationMethod: "reviewed_transaction_and_inlicensing_outcomes", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer filings and transaction evidence.", freshnessPolicy: "Current material transactions and retained history.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_DOMESTIC_CORPORATE_ACTION", conditionCode: null }),
  ],
} as const satisfies PharmaSubprofileContract

const API_BULK_DRUGS = {
  subprofileCode: "API_BULK_DRUGS", contractVersion: "API_BULK_DRUGS_V1", displayName: "API / Bulk Drugs",
  overrides: [
    { metricCode: "PHARMA_REGULATORY_SITE_STATUS", reason: "Manufacturing-site compliance is intrinsic to the operating model.", changes: { applicability: "APPLICABLE", conditionCode: null } },
    { metricCode: "PHARMA_VALUATION_CONTEXT", reason: "Cycle-aware valuation evidence is required without introducing a score curve.", changes: { normalizationMethod: "cycle_aware_pe_ev_ebitda_and_fcf_context" } },
  ],
  additions: [
    requirement({ metricCode: "PHARMA_API_CUSTOMER_CONCENTRATION", dimension: "RISK", applicability: "APPLICABLE", requirementLevel: "MANDATORY", periodTypes: ["YEAR"], history: annual, direction: "LOWER_BETTER", normalizationMethod: "disclosed_top_customer_revenue_concentration", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer-disclosed customer concentration; undisclosed values remain unavailable.", freshnessPolicy: "Latest annual disclosure and three-period history.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_API_CUSTOMER", conditionCode: null }),
    requirement({ metricCode: "PHARMA_API_CAPACITY_UTILIZATION", dimension: "BUSINESS_DURABILITY", applicability: "APPLICABLE", requirementLevel: "MANDATORY", periodTypes: ["YEAR", "QUARTER"], history: quarterly, direction: "RANGE", normalizationMethod: "facility_or_product_line_capacity_utilization", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer-disclosed facility/product-line capacity and utilization using compatible definitions.", freshnessPolicy: "Latest result cycle when disclosed.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_API_CAPACITY", conditionCode: null }),
    requirement({ metricCode: "PHARMA_API_MOLECULE_CONCENTRATION", dimension: "RISK", applicability: "APPLICABLE", requirementLevel: "IMPORTANT", periodTypes: ["YEAR"], history: annual, direction: "LOWER_BETTER", normalizationMethod: "reviewed_molecule_revenue_concentration", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer-disclosed molecule/product concentration.", freshnessPolicy: "Latest annual disclosure.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_API_MOLECULE", conditionCode: null }),
    requirement({ metricCode: "PHARMA_API_INPUT_FX_PASS_THROUGH", dimension: "RISK", applicability: "APPLICABLE", requirementLevel: "IMPORTANT", periodTypes: ["YEAR", "QUARTER"], history: quarterly, direction: "CUSTOM", normalizationMethod: "reviewed_raw_material_fx_and_pass_through_context", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer evidence separating input-cost, currency and contractual pass-through effects.", freshnessPolicy: "Latest result cycle and material contract changes.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_API_INPUT_FX", conditionCode: null }),
    requirement({ metricCode: "PHARMA_API_EXPORT_GEOGRAPHY", dimension: "GROWTH", applicability: "APPLICABLE", requirementLevel: "IMPORTANT", periodTypes: ["YEAR"], history: annual, direction: "INFORMATIONAL", normalizationMethod: "reviewed_export_geography_mix", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer geographic revenue disclosure.", freshnessPolicy: "Latest annual disclosure.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_API_GEOGRAPHY", conditionCode: null }),
  ],
} as const satisfies PharmaSubprofileContract

const GLOBAL_GENERICS = {
  subprofileCode: "GLOBAL_GENERICS", contractVersion: "GLOBAL_GENERICS_V1", displayName: "Global Generics",
  overrides: [
    { metricCode: "PHARMA_REGULATORY_SITE_STATUS", reason: "Regulated-market site status is mandatory for this model.", changes: { applicability: "APPLICABLE", conditionCode: null } },
    { metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH", reason: "Export/US revenue is a primary operating-model input.", changes: { applicability: "APPLICABLE", requirementLevel: "MANDATORY", conditionCode: null } },
    { metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE", reason: "Approval pipeline is a mandatory durability input.", changes: { requirementLevel: "MANDATORY" } },
  ],
  additions: [
    requirement({ metricCode: "PHARMA_US_GENERIC_PRICE_EROSION", dimension: "GROWTH", applicability: "APPLICABLE", requirementLevel: "MANDATORY", periodTypes: ["QUARTER", "YEAR"], history: quarterly, direction: "LOWER_BETTER", normalizationMethod: "disclosed_asp_or_price_erosion_trend", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Disclosed price/ASP evidence; no residual derivation from revenue and volume without an approved method.", freshnessPolicy: "Latest result cycle with compatible history.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_GENERICS_PRICING", conditionCode: null }),
    requirement({ metricCode: "PHARMA_GENERICS_VOLUME_MIX", dimension: "GROWTH", applicability: "APPLICABLE", requirementLevel: "IMPORTANT", periodTypes: ["QUARTER", "YEAR"], history: quarterly, direction: "CUSTOM", normalizationMethod: "reviewed_volume_and_product_mix_effects", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer-disclosed volume and mix evidence, kept separate from price effects.", freshnessPolicy: "Latest result cycle when disclosed.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_GENERICS_VOLUME_MIX", conditionCode: null }),
    requirement({ metricCode: "PHARMA_COMPLEX_SPECIALTY_GENERICS_MIX", dimension: "BUSINESS_DURABILITY", applicability: "APPLICABLE", requirementLevel: "IMPORTANT", periodTypes: ["YEAR", "EVENT"], history: annual, direction: "INFORMATIONAL", normalizationMethod: "reviewed_complex_specialty_mix_and_launches", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer product-mix and material launch evidence.", freshnessPolicy: "Latest annual disclosure plus material launches.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_GENERICS_COMPLEX", conditionCode: null }),
  ],
} as const satisfies PharmaSubprofileContract

const BIOPHARMA_BIOSIMILARS = {
  subprofileCode: "BIOPHARMA_BIOSIMILARS", contractVersion: "BIOPHARMA_BIOSIMILARS_V1", displayName: "Biopharma / Biosimilars",
  overrides: [
    { metricCode: "PHARMA_RND_INTENSITY", reason: "R&D and productivity are mandatory for biosimilar economics.", changes: { requirementLevel: "MANDATORY" } },
    { metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE", reason: "Pipeline must be modeled by molecule, geography and stage.", changes: { requirementLevel: "MANDATORY", normalizationMethod: "molecule_geography_stage_event_contract", sourceContract: "Official/issuer evidence by molecule, geography and approval/commercialization stage." } },
  ],
  additions: [
    requirement({ metricCode: "PHARMA_BIOSIMILAR_PATENT_LITIGATION_TIMELINE", dimension: "RISK", applicability: "APPLICABLE", requirementLevel: "MANDATORY", periodTypes: ["EVENT"], history: { ...event, preferredObservations: 4 }, direction: "CUSTOM", normalizationMethod: "dated_patent_exclusivity_and_litigation_events", calculationOwner: "OFFICIAL_EVIDENCE", sourceContract: "Official court/regulator and issuer evidence with dated molecule/geography linkage.", freshnessPolicy: "Current unresolved matters and every material event.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_BIOSIMILAR_IP", conditionCode: null }),
    requirement({ metricCode: "PHARMA_BIOSIMILAR_PARTNER_ECONOMICS", dimension: "BUSINESS_DURABILITY", applicability: "APPLICABLE", requirementLevel: "IMPORTANT", periodTypes: ["EVENT", "YEAR"], history: annual, direction: "CUSTOM", normalizationMethod: "reviewed_upfront_milestone_royalty_and_responsibility_terms", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer agreements/disclosures separating upfront, milestone, royalty/revenue share and commercialization responsibilities.", freshnessPolicy: "Current material partnerships and latest annual economics.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_BIOSIMILAR_PARTNER", conditionCode: null }),
    requirement({ metricCode: "PHARMA_BIOLOGICS_MANUFACTURING_CAPACITY", dimension: "BUSINESS_DURABILITY", applicability: "APPLICABLE", requirementLevel: "IMPORTANT", periodTypes: ["YEAR", "EVENT"], history: annual, direction: "RANGE", normalizationMethod: "reviewed_biologics_capacity_utilization_and_qualification", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer capacity, utilization and facility-qualification evidence.", freshnessPolicy: "Latest annual disclosure and material qualification event.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_BIOLOGICS_CAPACITY", conditionCode: null }),
  ],
} as const satisfies PharmaSubprofileContract

const CDMO_CRAMS = {
  subprofileCode: "CDMO_CRAMS", contractVersion: "CDMO_CRAMS_V1", displayName: "CDMO / CRAMS",
  overrides: [{ metricCode: "PHARMA_REGULATORY_SITE_STATUS", reason: "Site compliance is mandatory for outsourced development/manufacturing continuity.", changes: { applicability: "APPLICABLE", conditionCode: null } }],
  additions: [
    requirement({ metricCode: "PHARMA_CDMO_REVENUE_VISIBILITY", dimension: "BUSINESS_DURABILITY", applicability: "APPLICABLE", requirementLevel: "MANDATORY", periodTypes: ["YEAR", "QUARTER", "EVENT"], history: quarterly, direction: "CUSTOM", normalizationMethod: "approved_backlog_committed_capacity_or_contract_coverage", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Approved disclosed equivalent: signed backlog, committed capacity, long-term contract coverage or management-disclosed revenue visibility.", freshnessPolicy: "Latest result cycle and material contract events.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_CDMO_VISIBILITY", conditionCode: null }),
    requirement({ metricCode: "PHARMA_CDMO_CLIENT_CONCENTRATION", dimension: "RISK", applicability: "APPLICABLE", requirementLevel: "MANDATORY", periodTypes: ["YEAR"], history: annual, direction: "LOWER_BETTER", normalizationMethod: "disclosed_top_client_revenue_concentration", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer-disclosed client concentration; missing disclosure remains unavailable.", freshnessPolicy: "Latest annual disclosure and three-period history.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_CDMO_CLIENT", conditionCode: null }),
    requirement({ metricCode: "PHARMA_CDMO_CAPACITY_UTILIZATION", dimension: "BUSINESS_DURABILITY", applicability: "APPLICABLE", requirementLevel: "MANDATORY", periodTypes: ["YEAR", "QUARTER"], history: quarterly, direction: "RANGE", normalizationMethod: "facility_service_line_capacity_utilization", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer-disclosed facility/service-line capacity and utilization with compatible definitions.", freshnessPolicy: "Latest result cycle when disclosed.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_CDMO_CAPACITY", conditionCode: null }),
    requirement({ metricCode: "PHARMA_CDMO_SERVICE_PROJECT_MIX", dimension: "GROWTH", applicability: "APPLICABLE", requirementLevel: "IMPORTANT", periodTypes: ["YEAR", "QUARTER"], history: quarterly, direction: "CUSTOM", normalizationMethod: "commercial_development_and_service_mix", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer evidence separating commercial, development and service-line contributions.", freshnessPolicy: "Latest result cycle when disclosed.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_CDMO_MIX", conditionCode: null }),
    requirement({ metricCode: "PHARMA_CDMO_CAPEX_RAMP_EXECUTION", dimension: "BUSINESS_DURABILITY", applicability: "APPLICABLE", requirementLevel: "IMPORTANT", periodTypes: ["YEAR", "QUARTER", "EVENT"], history: quarterly, direction: "CUSTOM", normalizationMethod: "reviewed_capex_commissioning_and_revenue_ramp", calculationOwner: "CANONICAL_PROVIDER_EVIDENCE", sourceContract: "Issuer capex, commissioning, qualification and revenue-ramp evidence.", freshnessPolicy: "Latest result cycle and material commissioning events.", scoreCurveVersion: null, reasonCodeNamespace: "PHARMA_CDMO_EXECUTION", conditionCode: null }),
  ],
} as const satisfies PharmaSubprofileContract

export const PHARMA_SUBPROFILE_CONTRACTS = {
  API_BULK_DRUGS,
  DOMESTIC_FORMULATIONS,
  GLOBAL_GENERICS,
  BIOPHARMA_BIOSIMILARS,
  CDMO_CRAMS,
} as const satisfies Readonly<Record<PharmaSubprofileCode, PharmaSubprofileContract>>

export function composePharmaSubprofileContract(subprofileCode: PharmaSubprofileCode): ResearchProfileContract {
  const subprofile = PHARMA_SUBPROFILE_CONTRACTS[subprofileCode]
  const metrics = new Map<string, ResearchMetricContract>(PHARMA_RESEARCH_PROFILE_GATE_G.metrics.map((metric) => [metric.metricCode, metric]))
  for (const override of subprofile.overrides) {
    const parent = metrics.get(override.metricCode)
    if (!parent) throw new Error(`Unknown PHARMA_V1 override metric: ${override.metricCode}`)
    metrics.set(override.metricCode, { ...parent, ...override.changes, metricCode: parent.metricCode })
  }
  for (const addition of subprofile.additions) {
    if (metrics.has(addition.metricCode)) throw new Error(`Duplicate effective Pharma metric: ${addition.metricCode}`)
    metrics.set(addition.metricCode, addition)
  }
  const effective = [...metrics.values()]
  if (effective.some((metric) => metric.scoreCurveVersion !== null)) throw new Error("Pharma scoring remains unapproved")
  return {
    profileCode: "PHARMA",
    profileVersion: `${PHARMA_RESEARCH_PROFILE_GATE_G.profileVersion}+${subprofile.contractVersion}`,
    displayName: `Pharmaceuticals · ${subprofile.displayName}`,
    metrics: effective,
  }
}

export interface EffectivePharmaReadinessSummary {
  readonly mandatory: { readonly ready: number; readonly total: number; readonly ratio: number | null }
  readonly important: { readonly ready: number; readonly total: number; readonly ratio: number | null }
  readonly supplementary: { readonly ready: number; readonly total: number; readonly ratio: number | null }
  readonly reviewBlocked: readonly string[]
}

export function summarizeEffectivePharmaReadiness(contract: ResearchProfileContract, evidenceItems: readonly ResearchMetricEvidence[], activeConditions: readonly string[] = []): EffectivePharmaReadinessSummary {
  const conditions = new Set(activeConditions)
  const evidence = new Map(evidenceItems.map((item) => [item.metricCode, item]))
  const active = contract.metrics.filter((metric) => metric.applicability === "APPLICABLE" || (metric.applicability === "CONDITIONAL" && metric.conditionCode !== null && conditions.has(metric.conditionCode)))
  const reviewBlocked = active.filter((metric) => {
    const state = evidence.get(metric.metricCode)?.state
    return state === "CONFLICTING" || state === "REVIEW_REQUIRED"
  }).map((metric) => metric.metricCode)
  const summary = (level: ResearchMetricContract["requirementLevel"]) => {
    const requirements = active.filter((metric) => metric.requirementLevel === level)
    const ready = requirements.filter((metric) => {
      const item = evidence.get(metric.metricCode)
      return item?.state === "FRESH" && item.observationCount >= metric.history.minimumObservations
    }).length
    return { ready, total: requirements.length, ratio: requirements.length ? ready / requirements.length : null }
  }
  return { mandatory: summary("MANDATORY"), important: summary("IMPORTANT"), supplementary: summary("SUPPLEMENTARY"), reviewBlocked }
}
