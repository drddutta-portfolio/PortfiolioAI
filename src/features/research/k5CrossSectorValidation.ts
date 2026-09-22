import { routeResearchProfileV1, type ResearchProfileCode } from "./researchProfileRouting"
import {
  SECTOR_ENGINE_REGISTRY,
  type SectorEngineRegistryEntry,
} from "./sectorEngineRegistry"

export const K5_VALIDATION_VERSION = "GATE_K5_CROSS_SECTOR_VALIDATION_V1" as const

export type K5PortfolioMethodState =
  | "SUPPORTED_ENGINE"
  | "METHODOLOGY_NOT_AVAILABLE"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"

export interface K5EngineAuthority {
  readonly engineCode: string
  readonly profileCode: string
  readonly methodologyAuthority: string
  readonly benchmarkAuthority: string
  readonly valuationAuthority: string
  readonly recommendationAuthority: string
}

export interface K5PortfolioRoutingResult {
  readonly state: K5PortfolioMethodState
  readonly engineCode: string | null
  readonly profileCode: ResearchProfileCode | null
  readonly reasonCode: string
}

function profileState(entry: SectorEngineRegistryEntry, profileCode: string) {
  const explicit = entry.profileAuthorities?.[profileCode]
  if (explicit) return explicit.state
  return entry.profileCodes.includes(profileCode) ? "SUPPORTED" : null
}

export function k5SupportedProfileAuthorities(): readonly K5EngineAuthority[] {
  return SECTOR_ENGINE_REGISTRY.flatMap((entry) =>
    entry.profileCodes.flatMap((profileCode) => {
      if (profileState(entry, profileCode) !== "SUPPORTED") return []
      const authority = entry.profileAuthorities?.[profileCode]
      return [{
        engineCode: entry.engineCode,
        profileCode,
        methodologyAuthority: authority?.methodologyAuthority ?? entry.methodologyAuthority,
        benchmarkAuthority: authority?.benchmarkAuthority ?? entry.benchmarkAuthority,
        valuationAuthority: authority?.valuationAuthority ?? entry.valuationAuthority,
        recommendationAuthority: authority?.recommendationAuthority ?? entry.recommendationAuthority,
      }]
    }),
  )
}

export function k5AuthorityForEngineProfile(
  engineCode: string,
  profileCode: string,
): K5EngineAuthority | null {
  const owner = SECTOR_ENGINE_REGISTRY.find((entry) => entry.engineCode === engineCode)
  if (!owner || !owner.profileCodes.includes(profileCode)) return null
  if (profileState(owner, profileCode) !== "SUPPORTED") return null
  const authority = owner.profileAuthorities?.[profileCode]
  return {
    engineCode: owner.engineCode,
    profileCode,
    methodologyAuthority: authority?.methodologyAuthority ?? owner.methodologyAuthority,
    benchmarkAuthority: authority?.benchmarkAuthority ?? owner.benchmarkAuthority,
    valuationAuthority: authority?.valuationAuthority ?? owner.valuationAuthority,
    recommendationAuthority: authority?.recommendationAuthority ?? owner.recommendationAuthority,
  }
}

export function k5PairwiseEngineIsolationMatrix() {
  return SECTOR_ENGINE_REGISTRY.flatMap((source) =>
    SECTOR_ENGINE_REGISTRY
      .filter((target) => target.engineCode !== source.engineCode)
      .map((target) => ({
        sourceEngineCode: source.engineCode,
        targetEngineCode: target.engineCode,
        foreignProfilesResolvableBySource: target.profileCodes.filter(
          (profileCode) => k5AuthorityForEngineProfile(source.engineCode, profileCode) !== null,
        ),
        sourceFallbackPolicy: source.fallbackPolicy,
      })),
  )
}

export function resolveK5PortfolioMethodState(input: {
  readonly assetClass: string
  readonly sector: string | null
  readonly industry: string | null
}): K5PortfolioRoutingResult {
  const routed = routeResearchProfileV1({
    assetClass: input.assetClass,
    applicationSector: input.sector,
    applicationIndustry: input.industry,
  })

  if (routed.state === "NOT_APPLICABLE") {
    return {
      state: "NOT_APPLICABLE",
      engineCode: null,
      profileCode: null,
      reasonCode: routed.reasonCode,
    }
  }

  if (routed.state === "REVIEW_REQUIRED") {
    return {
      state: "REVIEW_REQUIRED",
      engineCode: null,
      profileCode: routed.profileCode,
      reasonCode: routed.reasonCode,
    }
  }

  if (routed.state === "PROFILE_PENDING" || routed.profileCode === null) {
    return {
      state: routed.basis === "CLASSIFICATION_MISSING"
        ? "REVIEW_REQUIRED"
        : "METHODOLOGY_NOT_AVAILABLE",
      engineCode: null,
      profileCode: routed.profileCode,
      reasonCode: routed.reasonCode,
    }
  }

  const engine = SECTOR_ENGINE_REGISTRY.find((entry) =>
    entry.profileCodes.includes(routed.profileCode as string),
  )

  if (!engine) {
    return {
      state: "METHODOLOGY_NOT_AVAILABLE",
      engineCode: null,
      profileCode: routed.profileCode,
      reasonCode: "ROUTED_PROFILE_HAS_NO_REGISTERED_ENGINE",
    }
  }

  if (profileState(engine, routed.profileCode) !== "SUPPORTED") {
    return {
      state: "METHODOLOGY_NOT_AVAILABLE",
      engineCode: engine.engineCode,
      profileCode: routed.profileCode,
      reasonCode: "REGISTERED_PROFILE_METHODOLOGY_PENDING",
    }
  }

  if (engine.lifecycle === "K4_FROZEN_PENDING") {
    return {
      state: "METHODOLOGY_NOT_AVAILABLE",
      engineCode: engine.engineCode,
      profileCode: routed.profileCode,
      reasonCode: "ENGINE_NOT_IMPLEMENTED",
    }
  }

  return {
    state: "SUPPORTED_ENGINE",
    engineCode: engine.engineCode,
    profileCode: routed.profileCode,
    reasonCode: "SUPPORTED_ENGINE_ROUTED",
  }
}

export const K5_FUTURE_STOCK_ROUTING_FIXTURES = [
  { profileCode: "PHARMA", sector: "Pharma", industry: "Pharmaceuticals", engineCode: "PHARMA_V1" },
  { profileCode: "BANK", sector: "Banking", industry: "Banks", engineCode: "BANK_NBFC" },
  { profileCode: "IT_SERVICES", sector: "Information Technology", industry: "IT Services", engineCode: "IT_TECH" },
  { profileCode: "IT_SOFTWARE_PRODUCTS_PLATFORMS", sector: "Information Technology", industry: "Software Products", engineCode: "IT_TECH" },
  { profileCode: "IT_DIGITAL_INFRA_HARDWARE", sector: "Information Technology", industry: "Digital Infrastructure", engineCode: "IT_TECH" },
  { profileCode: "PROJECT_EPC", sector: "Capital Goods", industry: "Civil Construction", engineCode: "INDUSTRIALS_CAPITAL_GOODS" },
  { profileCode: "CAPITAL_EQUIPMENT_ELECTRICAL", sector: "Capital Goods", industry: "Heavy Electrical Equipment", engineCode: "INDUSTRIALS_CAPITAL_GOODS" },
  { profileCode: "DEFENCE_AEROSPACE", sector: "Capital Goods", industry: "Aerospace & Defence", engineCode: "INDUSTRIALS_CAPITAL_GOODS" },
  { profileCode: "AUTO_OEM", sector: "Automobile & Auto Components", industry: "Cars & Utility Vehicles", engineCode: "AUTO_COMPONENTS" },
  { profileCode: "AUTO_COMPONENTS", sector: "Automobile & Auto Components", industry: "Auto Components", engineCode: "AUTO_COMPONENTS" },
  { profileCode: "SPECIALTY_CHEMICALS", sector: "Chemicals", industry: "Speciality Chemicals", engineCode: "CHEMICALS_V1" },
  { profileCode: "AGRO_FERTILISER", sector: "Chemicals", industry: "Pesticides & Agrochemicals", engineCode: "CHEMICALS_V1" },
  { profileCode: "COMMODITY_PROCESS_CHEMICALS", sector: "Chemicals", industry: "Commodity Chemicals", engineCode: "CHEMICALS_V1" },
  { profileCode: "HOSPITAL", sector: "Healthcare", industry: "Hospitals", engineCode: "HEALTHCARE_SERVICES_V1" },
  { profileCode: "CAPITAL_MARKETS_AMC", sector: "Financial Services", industry: "Asset Management Company", engineCode: "FIN_SERVICES_NON_LENDER" },
  { profileCode: "INSURANCE", sector: "Financial Services", industry: "Health Insurance", engineCode: "FIN_SERVICES_NON_LENDER" },
  { profileCode: "FINTECH_PLATFORM", sector: "Financial Services", industry: "Fintech / Insurance Brokerage & Platform", engineCode: "FIN_SERVICES_NON_LENDER" },
  { profileCode: "STEEL_FERROUS", sector: "Metals & Mining", industry: "Iron & Steel", engineCode: "METALS_COMMODITIES" },
  { profileCode: "NON_FERROUS_DIVERSIFIED_METALS", sector: "Metals & Mining", industry: "Diversified Metals", engineCode: "METALS_COMMODITIES" },
  { profileCode: "BRANDED_CONSUMER_FMCG", sector: "FMCG", industry: "Packaged Foods", engineCode: "CONSUMER_FMCG" },
  { profileCode: "UPSTREAM_E_AND_P", sector: "Oil & Gas", industry: "Oil Exploration & Production", engineCode: "OIL_GAS_V1" },
  { profileCode: "MIDSTREAM_CITY_GAS", sector: "Oil & Gas", industry: "City Gas Distribution", engineCode: "OIL_GAS_V1" },
  { profileCode: "INTEGRATED_REFINING_PETCHEM", sector: "Oil & Gas", industry: "Refineries", engineCode: "OIL_GAS_V1" },
  { profileCode: "REGULATED_NETWORK", sector: "Power", industry: "Power Transmission", engineCode: "POWER_RENEWABLES_V1" },
  { profileCode: "GENERATION_INTEGRATED_UTILITY", sector: "Power", industry: "Hydro Power", engineCode: "POWER_RENEWABLES_V1" },
  { profileCode: "RENEWABLE_IPP", sector: "Power", industry: "Renewable Energy", engineCode: "POWER_RENEWABLES_V1" },
] as const

export const K5_RECOMMENDATION_PORTABILITY_STUDY = {
  universalSemanticsPortable: [
    "ROLE_NAMES",
    "FAIL_CLOSED_MISSING_MANDATORY_INPUTS",
    "FAILED_ROLE_FLOOR_CONTINUES_DOWN_LADDER",
    "NO_SCORE_RECONSTRUCTION",
    "ZERO_RECOMMENDATION_WRITES",
    "MISSING_VS_NA_SEMANTICS",
  ] as const,
  numericThresholdPortability: "NOT_ESTABLISHED" as const,
  falsificationTests: [
    "MATERIALLY_DIFFERENT_SCORE_DISTRIBUTIONS_BY_SECTOR",
    "NA_DIMENSIONS_INVALIDATE_SHARED_FLOOR",
    "SAME_NUMERIC_FLOOR_YIELDS_ECONOMICALLY_INCONSISTENT_OUTCOMES",
    "SECTOR_SPECIFIC_RISKS_REQUIRE_DIFFERENT_BLOCKERS",
    "VALUATION_SCORE_DISTRIBUTIONS_DIFFER_BY_BUSINESS_MODEL",
  ] as const,
  decision: "DO_NOT_INTRODUCE_UNIVERSAL_NUMERIC_THRESHOLDS" as const,
  sectorSpecificRecommendationAuthorityRequired: true,
  ownerApprovalRequiredForNumericPolicy: true,
} as const

export const K5_UNIVERSAL_RESEARCH_SHELL = [
  "Overview",
  "Financials",
  "Quality & Growth",
  "Ownership",
  "Valuation",
  "Documents",
  "Evidence",
  "Readiness",
  "Recommendation",
  "Research Health",
] as const

export const K5_SAFETY_BOUNDARY = {
  providerCalls: 0,
  productionMutation: false,
  productionMigration: false,
  scorePersistence: false,
  recommendationPersistence: false,
  positionSizing: false,
  schedulerMutation: false,
  deployment: false,
  prMerge: false,
  automaticTrading: false,
} as const
