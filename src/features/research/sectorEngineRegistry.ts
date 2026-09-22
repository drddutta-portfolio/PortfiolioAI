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
  {
    engineCode: "INDUSTRIALS_CAPITAL_GOODS",
    displayName: "Industrials / Capital Goods",
    lifecycle: "IMPLEMENTED",
    methodologyAuthority: "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
    profileCodes: ["PROJECT_EPC", "CAPITAL_EQUIPMENT_ELECTRICAL", "DEFENCE_AEROSPACE"],
    allowedDimensions: COMMON_DIMENSIONS,
    notApplicableDimensions: [],
    benchmarkAuthority: "INDUSTRIALS_SUBPROFILE_AUTHORITY",
    valuationAuthority: "INDUSTRIALS_SUBPROFILE_AUTHORITY",
    recommendationAuthority: "INDUSTRIALS_READ_ONLY_RECOMMENDATION_PENDING_THRESHOLDS",
    subprofileSupport: "SUPPORTED",
    profileAuthorities: {
      PROJECT_EPC: {
        methodologyAuthority: "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_CAPITAL_GOODS",
        valuationAuthority: "PROJECT_EPC_VALUATION_V1",
        recommendationAuthority: "PROJECT_EPC_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
      CAPITAL_EQUIPMENT_ELECTRICAL: {
        methodologyAuthority: "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_CAPITAL_GOODS_WITH_INDIA_MANUFACTURING_CONTEXT",
        valuationAuthority: "CAPITAL_EQUIPMENT_VALUATION_V1",
        recommendationAuthority: "CAPITAL_EQUIPMENT_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
      DEFENCE_AEROSPACE: {
        methodologyAuthority: "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_INDIA_DEFENCE_WITH_CAPITAL_GOODS_CONTEXT",
        valuationAuthority: "DEFENCE_AEROSPACE_VALUATION_V1",
        recommendationAuthority: "DEFENCE_AEROSPACE_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
    },
    fallbackPolicy: "NONE_FAIL_CLOSED",
    referenceValidationSymbols: ["LT", "CGPOWER", "BEL", "ASTRAMICRO"],
    runtimeSymbolSpecific: false,
  },
  {
    engineCode: "AUTO_COMPONENTS",
    displayName: "Automobile / Auto Components",
    lifecycle: "IMPLEMENTED",
    methodologyAuthority: "AUTO_COMPONENTS_K4B_SCORING_V1",
    profileCodes: ["AUTO_OEM", "AUTO_COMPONENTS"],
    allowedDimensions: COMMON_DIMENSIONS,
    notApplicableDimensions: [],
    benchmarkAuthority: "AUTO_SUBPROFILE_AUTHORITY",
    valuationAuthority: "AUTO_SUBPROFILE_AUTHORITY",
    recommendationAuthority: "AUTO_READ_ONLY_RECOMMENDATION_PENDING_THRESHOLDS",
    subprofileSupport: "SUPPORTED",
    profileAuthorities: {
      AUTO_OEM: {
        methodologyAuthority: "AUTO_COMPONENTS_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_AUTO",
        valuationAuthority: "AUTO_OEM_VALUATION_V1",
        recommendationAuthority: "AUTO_OEM_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
      AUTO_COMPONENTS: {
        methodologyAuthority: "AUTO_COMPONENTS_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_AUTO_WITH_EV_NEW_AGE_CONTEXT",
        valuationAuthority: "AUTO_COMPONENTS_VALUATION_V1",
        recommendationAuthority: "AUTO_COMPONENTS_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
    },
    fallbackPolicy: "NONE_FAIL_CLOSED",
    referenceValidationSymbols: ["M&M", "TVSMOTOR", "MOTHERSON", "SONACOMS"],
    runtimeSymbolSpecific: false,
  },
  {
    engineCode: "CHEMICALS_V1",
    displayName: "Chemicals",
    lifecycle: "IMPLEMENTED",
    methodologyAuthority: "CHEMICALS_V1_K4B_SCORING_V1",
    profileCodes: ["SPECIALTY_CHEMICALS", "AGRO_FERTILISER", "COMMODITY_PROCESS_CHEMICALS"],
    allowedDimensions: COMMON_DIMENSIONS,
    notApplicableDimensions: [],
    benchmarkAuthority: "CHEMICALS_SUBPROFILE_AUTHORITY",
    valuationAuthority: "CHEMICALS_SUBPROFILE_AUTHORITY",
    recommendationAuthority: "CHEMICALS_READ_ONLY_RECOMMENDATION_PENDING_THRESHOLDS",
    subprofileSupport: "SUPPORTED",
    profileAuthorities: {
      SPECIALTY_CHEMICALS: {
        methodologyAuthority: "CHEMICALS_V1_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_CHEMICALS",
        valuationAuthority: "SPECIALTY_CHEMICALS_VALUATION_V1",
        recommendationAuthority: "SPECIALTY_CHEMICALS_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
      AGRO_FERTILISER: {
        methodologyAuthority: "CHEMICALS_V1_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_CHEMICALS",
        valuationAuthority: "AGRO_FERTILISER_VALUATION_V1",
        recommendationAuthority: "AGRO_FERTILISER_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
      COMMODITY_PROCESS_CHEMICALS: {
        methodologyAuthority: "CHEMICALS_V1_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_CHEMICALS",
        valuationAuthority: "COMMODITY_PROCESS_CHEMICALS_VALUATION_V1",
        recommendationAuthority: "COMMODITY_PROCESS_CHEMICALS_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
    },
    fallbackPolicy: "NONE_FAIL_CLOSED",
    referenceValidationSymbols: ["PIIND", "SRF", "VINATIORGA", "DEEPAKFERT"],
    runtimeSymbolSpecific: false,
  },
  {
    engineCode: "HEALTHCARE_SERVICES_V1",
    displayName: "Healthcare Services / Hospitals",
    lifecycle: "IMPLEMENTED",
    methodologyAuthority: "HEALTHCARE_SERVICES_V1_K4B_SCORING_V1",
    profileCodes: ["HOSPITAL"],
    allowedDimensions: COMMON_DIMENSIONS,
    notApplicableDimensions: [],
    benchmarkAuthority: "NIFTY_HOSPITALS_PRIMARY__NIFTY_HEALTHCARE_CONTEXT",
    valuationAuthority: "HOSPITAL_OPERATORS_VALUATION_V1",
    recommendationAuthority: "HEALTHCARE_SERVICES_READ_ONLY_RECOMMENDATION_PENDING_THRESHOLDS",
    subprofileSupport: "NOT_REQUIRED",
    profileAuthorities: {
      HOSPITAL: {
        methodologyAuthority: "HEALTHCARE_SERVICES_V1_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_HOSPITALS_PRIMARY__NIFTY_HEALTHCARE_CONTEXT",
        valuationAuthority: "HOSPITAL_OPERATORS_VALUATION_V1",
        recommendationAuthority: "HOSPITAL_OPERATORS_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
    },
    fallbackPolicy: "NONE_FAIL_CLOSED",
    referenceValidationSymbols: ["MAXHEALTH", "NH", "MEDANTA", "YATHARTH"],
    runtimeSymbolSpecific: false,
  },
  {
    engineCode: "FIN_SERVICES_NON_LENDER",
    displayName: "Financial Services / Non-Lender",
    lifecycle: "IMPLEMENTED",
    methodologyAuthority: "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
    profileCodes: ["CAPITAL_MARKETS_AMC", "INSURANCE", "FINTECH_PLATFORM"],
    allowedDimensions: COMMON_DIMENSIONS,
    notApplicableDimensions: [],
    benchmarkAuthority: "NON_LENDER_FINANCIAL_SUBPROFILE_AUTHORITY",
    valuationAuthority: "NON_LENDER_FINANCIAL_SUBPROFILE_AUTHORITY",
    recommendationAuthority: "FIN_SERVICES_NON_LENDER_READ_ONLY_RECOMMENDATION_PENDING_THRESHOLDS",
    subprofileSupport: "SUPPORTED",
    profileAuthorities: {
      CAPITAL_MARKETS_AMC: {
        methodologyAuthority: "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_FINANCIAL_SERVICES_EX_BANK__NIFTY_CAPITAL_MARKETS",
        valuationAuthority: "CAPITAL_MARKETS_AMC_VALUATION_V1",
        recommendationAuthority: "CAPITAL_MARKETS_AMC_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
      INSURANCE: {
        methodologyAuthority: "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_FINANCIAL_SERVICES_EX_BANK__NIFTY_INSURANCE",
        valuationAuthority: "INSURANCE_VALUATION_V1",
        recommendationAuthority: "INSURANCE_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
      FINTECH_PLATFORM: {
        methodologyAuthority: "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_FINANCIAL_SERVICES_EX_BANK__SIZE_MATCHED_DIGITAL_FINANCIAL_CONTEXT",
        valuationAuthority: "FINTECH_PLATFORM_VALUATION_V1",
        recommendationAuthority: "FINTECH_PLATFORM_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
    },
    fallbackPolicy: "NONE_FAIL_CLOSED",
    referenceValidationSymbols: ["NAM-INDIA", "HDFCAMC", "ANGELONE", "CAMS", "STARHEALTH", "PAYTM", "POLICYBZR"],
    runtimeSymbolSpecific: false,
  },
  {
    engineCode: "METALS_COMMODITIES",
    displayName: "Metals / Commodities",
    lifecycle: "IMPLEMENTED",
    methodologyAuthority: "METALS_COMMODITIES_K4B_SCORING_V1",
    profileCodes: ["STEEL_FERROUS", "NON_FERROUS_DIVERSIFIED_METALS"],
    allowedDimensions: COMMON_DIMENSIONS,
    notApplicableDimensions: [],
    benchmarkAuthority: "NIFTY_METAL",
    valuationAuthority: "METALS_SUBPROFILE_THROUGH_CYCLE_AUTHORITY",
    recommendationAuthority: "METALS_READ_ONLY_RECOMMENDATION_PENDING_THRESHOLDS",
    subprofileSupport: "SUPPORTED",
    profileAuthorities: {
      STEEL_FERROUS: {
        methodologyAuthority: "METALS_COMMODITIES_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_METAL",
        valuationAuthority: "STEEL_FERROUS_THROUGH_CYCLE_VALUATION_V1",
        recommendationAuthority: "STEEL_FERROUS_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
      NON_FERROUS_DIVERSIFIED_METALS: {
        methodologyAuthority: "METALS_COMMODITIES_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_METAL",
        valuationAuthority: "NON_FERROUS_THROUGH_CYCLE_VALUATION_V1",
        recommendationAuthority: "NON_FERROUS_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
    },
    fallbackPolicy: "NONE_FAIL_CLOSED",
    referenceValidationSymbols: ["JINDALSTEL", "HINDALCO", "HINDZINC"],
    runtimeSymbolSpecific: false,
  },
  {
    engineCode: "CONSUMER_FMCG",
    displayName: "Consumer / FMCG",
    lifecycle: "IMPLEMENTED",
    methodologyAuthority: "CONSUMER_FMCG_K4B_SCORING_V1",
    profileCodes: ["BRANDED_CONSUMER_FMCG"],
    allowedDimensions: COMMON_DIMENSIONS,
    notApplicableDimensions: [],
    benchmarkAuthority: "NIFTY_FMCG",
    valuationAuthority: "BRANDED_CONSUMER_FMCG_VALUATION_V1",
    recommendationAuthority: "CONSUMER_FMCG_READ_ONLY_RECOMMENDATION_PENDING_THRESHOLDS",
    subprofileSupport: "NOT_REQUIRED",
    profileAuthorities: {
      BRANDED_CONSUMER_FMCG: {
        methodologyAuthority: "CONSUMER_FMCG_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_FMCG",
        valuationAuthority: "BRANDED_CONSUMER_FMCG_VALUATION_V1",
        recommendationAuthority: "BRANDED_CONSUMER_FMCG_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
    },
    fallbackPolicy: "NONE_FAIL_CLOSED",
    referenceValidationSymbols: ["HINDUNILVR", "VBL", "LTFOODS", "RADICO"],
    runtimeSymbolSpecific: false,
  },
  {
    engineCode: "OIL_GAS_V1",
    displayName: "Oil / Gas",
    lifecycle: "IMPLEMENTED",
    methodologyAuthority: "OIL_GAS_V1_K4B_SCORING_V1",
    profileCodes: ["UPSTREAM_E_AND_P", "MIDSTREAM_CITY_GAS", "INTEGRATED_REFINING_PETCHEM"],
    allowedDimensions: COMMON_DIMENSIONS,
    notApplicableDimensions: [],
    benchmarkAuthority: "NIFTY_OIL_GAS",
    valuationAuthority: "OIL_GAS_SUBPROFILE_AUTHORITY",
    recommendationAuthority: "OIL_GAS_READ_ONLY_RECOMMENDATION_PENDING_THRESHOLDS",
    subprofileSupport: "SUPPORTED",
    profileAuthorities: {
      UPSTREAM_E_AND_P: {
        methodologyAuthority: "OIL_GAS_V1_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_OIL_GAS",
        valuationAuthority: "UPSTREAM_E_AND_P_VALUATION_V1",
        recommendationAuthority: "UPSTREAM_E_AND_P_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
      MIDSTREAM_CITY_GAS: {
        methodologyAuthority: "OIL_GAS_V1_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_OIL_GAS",
        valuationAuthority: "MIDSTREAM_CITY_GAS_VALUATION_V1",
        recommendationAuthority: "MIDSTREAM_CITY_GAS_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
      INTEGRATED_REFINING_PETCHEM: {
        methodologyAuthority: "OIL_GAS_V1_K4B_SCORING_V1",
        benchmarkAuthority: "NIFTY_OIL_GAS",
        valuationAuthority: "INTEGRATED_REFINING_PETCHEM_VALUATION_V1",
        recommendationAuthority: "INTEGRATED_REFINING_PETCHEM_RECOMMENDATION_PENDING",
        state: "SUPPORTED",
      },
    },
    fallbackPolicy: "NONE_FAIL_CLOSED",
    referenceValidationSymbols: ["ONGC", "GAIL", "MGL", "IGL", "RELIANCE"],
    runtimeSymbolSpecific: false,
  },
  ...[
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
