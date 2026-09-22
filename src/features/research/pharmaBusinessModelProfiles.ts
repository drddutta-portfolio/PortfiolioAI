import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"
import type { ResearchMetricContract, ResearchProfileContract } from "./researchProfileContract"

export type PharmaBusinessModelCode =
  | "API_BULK_DRUGS"
  | "DOMESTIC_FORMULATIONS"
  | "GLOBAL_GENERICS_EXPORT"
  | "BIOPHARMA_BIOSIMILARS"
  | "CDMO_CRAMS"

export interface PharmaBusinessModelProfile {
  readonly code: PharmaBusinessModelCode
  readonly displayName: string
  readonly version: string
  readonly description: string
  readonly contract: ResearchProfileContract
}

const COMMON_CORE_CODES = new Set([
  "PHARMA_REVENUE_GROWTH_HISTORY",
  "PHARMA_OPERATING_MARGIN_HISTORY",
  "PHARMA_ROCE_HISTORY",
  "PHARMA_PAT_EPS_HISTORY",
  "PHARMA_CASH_CONVERSION_HISTORY",
  "PHARMA_BALANCE_SHEET_LEVERAGE",
  "PHARMA_OWNERSHIP_GOVERNANCE",
  "PHARMA_VALUATION_CONTEXT",
])

function parentMetric(metricCode: string, requirementLevel?: ResearchMetricContract["requirementLevel"]): ResearchMetricContract {
  const metric = PHARMA_RESEARCH_PROFILE_V1.metrics.find((item) => item.metricCode === metricCode)
  if (!metric) throw new Error(`Missing PHARMA_V1 parent metric: ${metricCode}`)
  return requirementLevel ? { ...metric, requirementLevel } : metric
}

function overlayMetric(
  metricCode: string,
  dimension: ResearchMetricContract["dimension"],
  requirementLevel: ResearchMetricContract["requirementLevel"],
  history: ResearchMetricContract["history"],
  sourceContract: string,
  normalizationMethod: string,
  direction: ResearchMetricContract["direction"] = "CUSTOM",
): ResearchMetricContract {
  return {
    metricCode,
    dimension,
    applicability: "APPLICABLE",
    requirementLevel,
    periodTypes: history.historyUnit === "QUARTER" ? ["QUARTER", "YEAR"] : history.historyUnit === "YEAR" ? ["YEAR"] : [history.historyUnit],
    history,
    direction,
    normalizationMethod,
    calculationOwner: "PORTFOLIOAI",
    sourceContract,
    freshnessPolicy: history.historyUnit === "EVENT" ? "Current material event state must be represented." : "Latest completed reporting period must be current.",
    scoreCurveVersion: null,
    reasonCodeNamespace: metricCode,
    conditionCode: null,
  }
}

const commonCore = () => PHARMA_RESEARCH_PROFILE_V1.metrics.filter((metric) => COMMON_CORE_CODES.has(metric.metricCode))

const profiles: readonly PharmaBusinessModelProfile[] = [
  {
    code: "API_BULK_DRUGS",
    displayName: "API / Bulk Drug Manufacturers",
    version: "PHARMA_API_BULK_DRUGS_V1",
    description: "API and bulk-drug manufacturers where synthesis capability, input economics, capacity utilization and customer concentration materially shape returns.",
    contract: {
      profileCode: "PHARMA_API_BULK_DRUGS",
      profileVersion: "PHARMA_API_BULK_DRUGS_V1",
      displayName: "Pharma · API / Bulk Drugs",
      metrics: [
        ...commonCore(),
        parentMetric("PHARMA_EXPORT_US_REVENUE_GROWTH", "IMPORTANT"),
        parentMetric("PHARMA_REGULATORY_SITE_STATUS", "IMPORTANT"),
        parentMetric("PHARMA_RND_INTENSITY", "IMPORTANT"),
        overlayMetric("PHARMA_API_RAW_MATERIAL_SENSITIVITY", "RISK", "MANDATORY", { minimumObservations: 4, preferredObservations: 8, historyUnit: "QUARTER" }, "Reviewed raw-material/input-cost and gross-margin evidence; no single commodity-price proxy may substitute for issuer economics.", "input_cost_and_margin_sensitivity"),
        overlayMetric("PHARMA_API_CAPACITY_UTILIZATION", "BUSINESS_DURABILITY", "IMPORTANT", { minimumObservations: 3, preferredObservations: 5, historyUnit: "YEAR" }, "Reviewed installed-capacity, production/utilization or equivalent capacity evidence where disclosed.", "capacity_utilization_and_expansion_context", "HIGHER_BETTER"),
        overlayMetric("PHARMA_API_CUSTOMER_CONCENTRATION", "RISK", "MANDATORY", { minimumObservations: 1, preferredObservations: 3, historyUnit: "YEAR" }, "Reviewed top-customer or customer-concentration evidence; undisclosed concentration remains insufficient evidence, not zero risk.", "customer_concentration_state", "LOWER_BETTER"),
        overlayMetric("PHARMA_API_BACKWARD_INTEGRATION", "BUSINESS_DURABILITY", "IMPORTANT", { minimumObservations: 1, preferredObservations: 3, historyUnit: "YEAR" }, "Issuer/reviewed evidence for key starting-material/intermediate integration and supply-chain resilience.", "backward_integration_resilience"),
      ],
    },
  },
  {
    code: "DOMESTIC_FORMULATIONS",
    displayName: "Domestic Formulations / Branded Generics",
    version: "PHARMA_DOMESTIC_FORMULATIONS_V1",
    description: "India-led branded-formulations companies where therapy mix, chronic franchise, brand strength and domestic execution are primary business-quality drivers.",
    contract: {
      profileCode: "PHARMA_DOMESTIC_FORMULATIONS",
      profileVersion: "PHARMA_DOMESTIC_FORMULATIONS_V1",
      displayName: "Pharma · Domestic Formulations",
      metrics: [
        ...commonCore(),
        parentMetric("PHARMA_DOMESTIC_REVENUE_GROWTH", "MANDATORY"),
        parentMetric("PHARMA_RND_INTENSITY", "IMPORTANT"),
        parentMetric("PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE", "IMPORTANT"),
        parentMetric("PHARMA_EXPORT_US_REVENUE_GROWTH", "SUPPLEMENTARY"),
        parentMetric("PHARMA_REGULATORY_SITE_STATUS", "SUPPLEMENTARY"),
        overlayMetric("PHARMA_DOMESTIC_THERAPY_MIX", "BUSINESS_DURABILITY", "MANDATORY", { minimumObservations: 1, preferredObservations: 4, historyUnit: "QUARTER" }, "Reviewed therapy-wise revenue/prescription mix where disclosed, including concentration in chronic/acute therapeutic areas.", "therapy_mix_and_concentration"),
        overlayMetric("PHARMA_DOMESTIC_CHRONIC_ACUTE_MIX", "BUSINESS_DURABILITY", "IMPORTANT", { minimumObservations: 4, preferredObservations: 8, historyUnit: "QUARTER" }, "Reviewed chronic-versus-acute mix or closest issuer-reported equivalent.", "chronic_acute_mix_trend"),
        overlayMetric("PHARMA_DOMESTIC_BRAND_FRANCHISE", "BUSINESS_DURABILITY", "IMPORTANT", { minimumObservations: 1, preferredObservations: 3, historyUnit: "YEAR" }, "Issuer/reviewed evidence for material brands, market positions and concentration; qualitative claims require cited evidence.", "brand_franchise_strength"),
      ],
    },
  },
  {
    code: "GLOBAL_GENERICS_EXPORT",
    displayName: "Global Generics / Export-Oriented",
    version: "PHARMA_GLOBAL_GENERICS_EXPORT_V1",
    description: "Regulated-market generics exporters where US/EU growth, price erosion, product pipeline and manufacturing-site compliance dominate risk/reward.",
    contract: {
      profileCode: "PHARMA_GLOBAL_GENERICS_EXPORT",
      profileVersion: "PHARMA_GLOBAL_GENERICS_EXPORT_V1",
      displayName: "Pharma · Global Generics / Export",
      metrics: [
        ...commonCore(),
        parentMetric("PHARMA_EXPORT_US_REVENUE_GROWTH", "MANDATORY"),
        parentMetric("PHARMA_REGULATORY_SITE_STATUS", "MANDATORY"),
        parentMetric("PHARMA_RND_INTENSITY", "IMPORTANT"),
        parentMetric("PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE", "MANDATORY"),
        parentMetric("PHARMA_DOMESTIC_REVENUE_GROWTH", "SUPPLEMENTARY"),
        overlayMetric("PHARMA_GLOBAL_PRICE_EROSION", "RISK", "MANDATORY", { minimumObservations: 4, preferredObservations: 8, historyUnit: "QUARTER" }, "Reviewed issuer/industry evidence for regulated-market price erosion or equivalent realization pressure.", "regulated_market_price_erosion", "LOWER_BETTER"),
        overlayMetric("PHARMA_GLOBAL_FILING_APPROVAL_PIPELINE", "BUSINESS_DURABILITY", "MANDATORY", { minimumObservations: 1, preferredObservations: 4, historyUnit: "EVENT" }, "Official/issuer evidence for material filings, approvals and launches such as ANDA or equivalent regulated-market milestones.", "filing_approval_launch_pipeline"),
        overlayMetric("PHARMA_GLOBAL_GEOGRAPHY_CONCENTRATION", "RISK", "IMPORTANT", { minimumObservations: 1, preferredObservations: 3, historyUnit: "YEAR" }, "Reviewed geography/market revenue mix, with concentration treated separately from growth.", "geography_concentration", "LOWER_BETTER"),
      ],
    },
  },
  {
    code: "BIOPHARMA_BIOSIMILARS",
    displayName: "Biopharmaceuticals & Biosimilars",
    version: "PHARMA_BIOPHARMA_BIOSIMILARS_V1",
    description: "Biologics and biosimilars businesses where clinical/regulatory milestones, R&D productivity, molecule concentration and specialized manufacturing execution are central.",
    contract: {
      profileCode: "PHARMA_BIOPHARMA_BIOSIMILARS",
      profileVersion: "PHARMA_BIOPHARMA_BIOSIMILARS_V1",
      displayName: "Pharma · Biopharma / Biosimilars",
      metrics: [
        ...commonCore(),
        parentMetric("PHARMA_RND_INTENSITY", "MANDATORY"),
        parentMetric("PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE", "MANDATORY"),
        parentMetric("PHARMA_REGULATORY_SITE_STATUS", "MANDATORY"),
        parentMetric("PHARMA_EXPORT_US_REVENUE_GROWTH", "IMPORTANT"),
        overlayMetric("PHARMA_BIO_CLINICAL_REGULATORY_MILESTONES", "BUSINESS_DURABILITY", "MANDATORY", { minimumObservations: 1, preferredObservations: 4, historyUnit: "EVENT" }, "Official/issuer evidence for material clinical, filing, approval, interchangeability or comparable biosimilar milestones.", "clinical_and_regulatory_milestone_state"),
        overlayMetric("PHARMA_BIO_MOLECULE_CONCENTRATION", "RISK", "MANDATORY", { minimumObservations: 1, preferredObservations: 3, historyUnit: "YEAR" }, "Reviewed molecule/product revenue concentration and dependence on major biologic franchises.", "molecule_concentration", "LOWER_BETTER"),
        overlayMetric("PHARMA_BIO_MANUFACTURING_SCALE", "BUSINESS_DURABILITY", "IMPORTANT", { minimumObservations: 1, preferredObservations: 3, historyUnit: "YEAR" }, "Reviewed biologics manufacturing capacity, utilization and scale-up evidence where material.", "biologics_manufacturing_scale"),
      ],
    },
  },
  {
    code: "CDMO_CRAMS",
    displayName: "CDMO / CRAMS",
    version: "PHARMA_CDMO_CRAMS_V1",
    description: "Contract research/development/manufacturing businesses where customer concentration, project pipeline, utilization, capacity additions and client retention drive quality.",
    contract: {
      profileCode: "PHARMA_CDMO_CRAMS",
      profileVersion: "PHARMA_CDMO_CRAMS_V1",
      displayName: "Pharma · CDMO / CRAMS",
      metrics: [
        ...commonCore(),
        parentMetric("PHARMA_RND_INTENSITY", "SUPPLEMENTARY"),
        parentMetric("PHARMA_REGULATORY_SITE_STATUS", "IMPORTANT"),
        overlayMetric("PHARMA_CDMO_CUSTOMER_CONCENTRATION", "RISK", "MANDATORY", { minimumObservations: 1, preferredObservations: 3, historyUnit: "YEAR" }, "Reviewed top-customer concentration and material-client dependence evidence.", "customer_concentration_state", "LOWER_BETTER"),
        overlayMetric("PHARMA_CDMO_ORDER_VISIBILITY", "GROWTH", "MANDATORY", { minimumObservations: 1, preferredObservations: 4, historyUnit: "QUARTER" }, "Issuer/reviewed evidence for order visibility, contracted programs or equivalent forward demand indicators without fabricating an order book where none is disclosed.", "order_visibility_and_program_pipeline"),
        overlayMetric("PHARMA_CDMO_CAPACITY_UTILIZATION", "BUSINESS_DURABILITY", "MANDATORY", { minimumObservations: 3, preferredObservations: 5, historyUnit: "YEAR" }, "Reviewed capacity, utilization and commissioned-expansion evidence for material facilities.", "capacity_utilization_and_expansion_context", "HIGHER_BETTER"),
        overlayMetric("PHARMA_CDMO_CLIENT_RETENTION", "BUSINESS_DURABILITY", "IMPORTANT", { minimumObservations: 1, preferredObservations: 3, historyUnit: "YEAR" }, "Reviewed repeat-client, program progression or retention evidence where disclosed.", "client_retention_and_program_progression", "HIGHER_BETTER"),
        overlayMetric("PHARMA_CDMO_CAPEX_ROCE", "QUALITY", "IMPORTANT", { minimumObservations: 3, preferredObservations: 5, historyUnit: "YEAR" }, "Matched capex and ROCE/asset-productivity evidence around material capacity additions.", "capex_return_efficiency", "HIGHER_BETTER"),
      ],
    },
  },
] as const

export const PHARMA_BUSINESS_MODEL_PROFILES = profiles

export function pharmaBusinessModelProfile(code: PharmaBusinessModelCode): PharmaBusinessModelProfile {
  const profile = profiles.find((item) => item.code === code)
  if (!profile) throw new Error(`Unknown Pharma business model: ${code}`)
  return profile
}

export function pharmaCommonCoreMetricCodes() {
  return [...COMMON_CORE_CODES]
}
