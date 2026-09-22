export const SECTOR_ENGINE_CONTRACT_VERSION = "SECTOR_ENGINE_CONTRACT_V1" as const

export type SectorEngineLifecycle =
  | "IMPLEMENTED"
  | "RECONCILIATION_REQUIRED"
  | "K4_FROZEN_PENDING"

export type SectorEngineFallbackPolicy = "NONE_FAIL_CLOSED"

export type UniversalRecommendationState =
  | "CORE_CANDIDATE"
  | "SATELLITE_CANDIDATE"
  | "WATCH"
  | "AVOID"
  | "INSUFFICIENT"

export interface SectorEngineRegistryEntry {
  readonly engineCode: string
  readonly displayName: string
  readonly lifecycle: SectorEngineLifecycle
  readonly methodologyAuthority: string
  readonly profileCodes: readonly string[]
  readonly allowedDimensions: readonly string[]
  readonly notApplicableDimensions: readonly string[]
  readonly benchmarkAuthority: string
  readonly valuationAuthority: string
  readonly recommendationAuthority: string
  readonly subprofileSupport: "SUPPORTED" | "NOT_REQUIRED" | "TO_BE_DETERMINED"
  readonly profileAuthorities?: Readonly<Record<string, {
    readonly methodologyAuthority: string
    readonly benchmarkAuthority: string
    readonly valuationAuthority: string
    readonly recommendationAuthority: string
    readonly state: "SUPPORTED" | "PENDING_METHODOLOGY"
  }>>
  readonly fallbackPolicy: SectorEngineFallbackPolicy
  readonly referenceValidationSymbols: readonly string[]
  readonly runtimeSymbolSpecific: false
}

export const UNIVERSAL_SECTOR_ENGINE_SEMANTICS = {
  recommendationStates: [
    "CORE_CANDIDATE",
    "SATELLITE_CANDIDATE",
    "WATCH",
    "AVOID",
    "INSUFFICIENT",
  ] as const satisfies readonly UniversalRecommendationState[],
  failClosed: true,
  missingMandatoryEvidence: "SCORE_NOT_COMPUTABLE",
  conflictingClassification: "REVIEW_REQUIRED",
  missingRecommendationFloorData: "INSUFFICIENT",
  failedRoleFloor: "ROLE_INELIGIBLE_CONTINUE_DOWN_LADDER",
  explicitNotApplicable: "N_A_NOT_MISSING",
  scoreReconstructionFromIncompleteMandatoryInputs: false,
  recommendationComputationWrites: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
  sectorOnlySpecialisedRoutingAllowed: false,
} as const

const COMMON_DIMENSIONS = [
  "QUALITY",
  "GROWTH",
  "CAPITAL_EFFICIENCY",
  "CASH_FLOW",
  "BALANCE_SHEET_CREDIT",
  "BUSINESS_DURABILITY",
  "VALUATION",
  "MOMENTUM",
  "RISK",
  "OWNERSHIP_GOVERNANCE",
] as const

export const SECTOR_ENGINE_REGISTRY: readonly SectorEngineRegistryEntry[] = [
  {
    engineCode: "PHARMA_V1",
    displayName: "Pharmaceuticals",
    lifecycle: "IMPLEMENTED",
    methodologyAuthority: "PHARMA_V1",
    profileCodes: ["PHARMA"],
    allowedDimensions: COMMON_DIMENSIONS,
    notApplicableDimensions: [],
    benchmarkAuthority: "PHARMA_V1",
    valuationAuthority: "PHARMA_V1",
    recommendationAuthority: "PHARMA_V1_GATE_I",
    subprofileSupport: "SUPPORTED",
    fallbackPolicy: "NONE_FAIL_CLOSED",
    referenceValidationSymbols: ["TORNTPHARM", "AUROPHARMA"],
    runtimeSymbolSpecific: false,
  },
  {
    engineCode: "BANK_NBFC",
    displayName: "Banks & NBFCs",
    lifecycle: "RECONCILIATION_REQUIRED",
    methodologyAuthority: "BANK_NBFC",
    profileCodes: ["BANK", "NBFC_LENDING"],
    allowedDimensions: COMMON_DIMENSIONS.filter((dimension) => dimension !== "CASH_FLOW"),
    notApplicableDimensions: ["CASH_FLOW"],
    benchmarkAuthority: "BANK_PROFILE_NIFTY_BANK__NBFC_PROFILE_PENDING",
    valuationAuthority: "BANK_STAGE_8__NBFC_PENDING",
    recommendationAuthority: "BANK_HDFCBANK_PILOT_DRAFT__NBFC_PENDING",
    subprofileSupport: "SUPPORTED",
    profileAuthorities: {
      BANK: {
        methodologyAuthority: "BANK_NBFC_STAGE_8_BANK_V1",
        benchmarkAuthority: "NIFTY_BANK",
        valuationAuthority: "BANK_NBFC_STAGE_8_BANK_VALUATION_V1",
        recommendationAuthority: "BANK_NBFC_HDFCBANK_PILOT_REVIEW_REQUIRED",
        state: "SUPPORTED",
      },
      NBFC_LENDING: {
        methodologyAuthority: "NBFC_LENDING_METHODOLOGY_PENDING",
        benchmarkAuthority: "NBFC_LENDING_BENCHMARK_PENDING",
        valuationAuthority: "NBFC_LENDING_VALUATION_PENDING",
        recommendationAuthority: "NBFC_LENDING_RECOMMENDATION_PENDING",
        state: "PENDING_METHODOLOGY",
      },
    },
    fallbackPolicy: "NONE_FAIL_CLOSED",
    referenceValidationSymbols: ["HDFCBANK"],
    runtimeSymbolSpecific: false,
  },
  {
    engineCode: "IT_TECH",
    displayName: "IT / Technology",
    lifecycle: "IMPLEMENTED",
    methodologyAuthority: "IT_TECH_K4B_SCORING_V1",
    profileCodes: ["IT_SERVICES", "IT_SOFTWARE_PRODUCTS_PLATFORMS", "IT_DIGITAL_INFRA_HARDWARE"],
    allowedDimensions: COMMON_DIMENSIONS,
    notApplicableDimensions: [],
    benchmarkAuthority: "IT_TECH_SUBPROFILE_AUTHORITY",
    valuationAuthority: "IT_TECH_SUBPROFILE_AUTHORITY",
    recommendationAuthority: "IT_TECH_READ_ONLY_RECOMMENDATION_PENDING_THRESHOLDS",
    subprofileSupport: "SUPPORTED",
    profileAuthorities: {
      IT_SERVICES: {
        methodologyAuthority: "IT_TECH_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_IT",
        valuationAuthority: "IT_SERVICES_VALUATION_V1",
        recommendationAuthority: "IT_SERVICES_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
      IT_SOFTWARE_PRODUCTS_PLATFORMS: {
        methodologyAuthority: "IT_TECH_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_IT_WITH_SIZE_MATCHED_TECH_CONTEXT",
        valuationAuthority: "IT_PRODUCTS_PLATFORMS_VALUATION_V1",
        recommendationAuthority: "IT_PRODUCTS_PLATFORMS_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
      IT_DIGITAL_INFRA_HARDWARE: {
        methodologyAuthority: "IT_TECH_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_IT_WITH_MIDSMALL_IT_TELECOM_CONTEXT",
        valuationAuthority: "IT_DIGITAL_INFRA_VALUATION_V1",
        recommendationAuthority: "IT_DIGITAL_INFRA_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
    },
    fallbackPolicy: "NONE_FAIL_CLOSED",
    referenceValidationSymbols: ["INFY", "PERSISTENT", "HCLTECH", "NETWEB"],
    runtimeSymbolSpecific: false,
  },
  ...[
    "INDUSTRIALS_CAPITAL_GOODS",
    "AUTO_COMPONENTS",
    "CHEMICALS_V1",
    "HEALTHCARE_SERVICES_V1",
    "FIN_SERVICES_NON_LENDER",
    "METALS_COMMODITIES",
    "CONSUMER_FMCG",
    "OIL_GAS_V1",
    "POWER_RENEWABLES_V1",
  ].map((engineCode): SectorEngineRegistryEntry => ({
    engineCode,
    displayName: engineCode,
    lifecycle: "K4_FROZEN_PENDING",
    methodologyAuthority: "K4_CHECKPOINT_A_REQUIRED",
    profileCodes: [],
    allowedDimensions: [],
    notApplicableDimensions: [],
    benchmarkAuthority: "K4_CHECKPOINT_A_REQUIRED",
    valuationAuthority: "K4_CHECKPOINT_A_REQUIRED",
    recommendationAuthority: "K4_CHECKPOINT_A_REQUIRED",
    subprofileSupport: "TO_BE_DETERMINED",
    fallbackPolicy: "NONE_FAIL_CLOSED",
    referenceValidationSymbols: [],
    runtimeSymbolSpecific: false,
  })),
] as const

export function sectorEngineForProfileCode(profileCode: string): SectorEngineRegistryEntry | null {
  return SECTOR_ENGINE_REGISTRY.find((entry) => entry.profileCodes.includes(profileCode)) ?? null
}
