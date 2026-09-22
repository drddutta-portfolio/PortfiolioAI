export const AUTO_COMPONENTS_K4A_CONTRACT_VERSION =
  "AUTO_COMPONENTS_K4A_METHODOLOGY_V1" as const

export type AutoK4aSubprofile =
  | "AUTO_OEM"
  | "AUTO_COMPONENTS"

export interface AutoK4aSubprofileContract {
  readonly code: AutoK4aSubprofile
  readonly industrySelectors: readonly string[]
  readonly referenceSymbols: readonly string[]
  readonly benchmarkAuthority: readonly string[]
  readonly valuationMethods: readonly string[]
  readonly primaryDimensions: readonly string[]
  readonly contextDimensions: readonly string[]
  readonly mandatoryEvidenceFamilies: readonly string[]
  readonly durabilityFactors: readonly string[]
  readonly majorRisks: readonly string[]
}

export const AUTO_COMPONENTS_K4A_CONTRACT = {
  version: AUTO_COMPONENTS_K4A_CONTRACT_VERSION,
  state: "CHECKPOINT_A_OWNER_APPROVED_LOCKED",
  engineCode: "AUTO_COMPONENTS",
  runtimeActivationAllowed: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
  sectorOnlyRoutingAllowed: false,
  unknownIndustryBehavior: "METHOD_NOT_AVAILABLE",
  evTransitionTreatment: "EXPOSURE_AND_RISK_METADATA_NOT_SEPARATE_SCORE",
  historyMinimums: {
    annualFundamentalsYears: 3,
    preferredAnnualFundamentalsYears: 5,
    quarterlyGrowthQuarters: 8,
    marginHistoryQuarters: 8,
    cashConversionYears: 3,
    marketHistoryTradingDays: 252,
  },
  normalizationPrinciples: [
    "CYCLE_NORMALIZED_GROWTH_AND_MARGIN_INTERPRETATION",
    "NO_SINGLE_QUARTER_VOLUME_OR_MARGIN_SPIKE_AS_DURABLE_GROWTH",
    "FCF_AND_ROCE_MUST_BE_READ_WITH_CAPEX_CYCLE",
    "EV_TRANSITION_IS_RISK_EXPOSURE_NOT_AUTOMATIC_SCORE_BONUS",
    "NO_CROSS_SUBPROFILE_PEER_PERCENTILES",
    "MISSING_MANDATORY_EVIDENCE_FAILS_CLOSED",
  ],
  recommendationFramework: {
    roleNamesShared: true,
    numericThresholdsUniversal: false,
    thresholdsOwner: "SUBPROFILE_AUTHORITY",
    roleFloorsOwner: "SUBPROFILE_AUTHORITY",
    avoidRuleOwner: "SUBPROFILE_AUTHORITY",
  },
  subprofiles: [
    {
      code: "AUTO_OEM",
      industrySelectors: [
        "CARS_UTILITY_VEHICLES",
        "2_3_WHEELERS",
        "COMMERCIAL_VEHICLES",
        "TRACTORS_FARM_EQUIPMENT",
      ],
      referenceSymbols: ["M&M", "TVSMOTOR"],
      benchmarkAuthority: ["NIFTY_AUTO"],
      valuationMethods: [
        "PE_WITH_CYCLE_CONTEXT",
        "EV_EBITDA",
        "FCF_YIELD",
        "ROCE_WITH_CAPEX_CONTEXT",
      ],
      primaryDimensions: [
        "QUALITY",
        "GROWTH",
        "CAPITAL_EFFICIENCY",
        "CASH_FLOW",
        "BUSINESS_DURABILITY",
        "VALUATION",
      ],
      contextDimensions: [
        "BALANCE_SHEET_CREDIT",
        "MOMENTUM",
        "RISK",
        "OWNERSHIP_GOVERNANCE",
      ],
      mandatoryEvidenceFamilies: [
        "VOLUME_AND_REVENUE_GROWTH_MULTI_PERIOD",
        "OPERATING_MARGIN_HISTORY",
        "ROCE_OR_ROIC",
        "CFO_OR_FCF_CONVERSION",
        "CAPEX_INTENSITY",
        "NET_CASH_OR_LEVERAGE",
        "VALUATION_SELF_AND_PEER_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "BRAND_AND_DISTRIBUTION",
        "PRODUCT_PORTFOLIO_DIVERSIFICATION",
        "PLATFORM_AND_MODEL_CYCLE_STRENGTH",
        "EXPORT_OR_GEOGRAPHIC_DIVERSIFICATION",
        "EV_TRANSITION_READINESS",
        "CAPITAL_ALLOCATION_DISCIPLINE",
      ],
      majorRisks: [
        "DEMAND_CYCLE",
        "EV_TRANSITION",
        "REGULATION_AND_EMISSIONS",
        "COMMODITY_INPUTS",
        "CAPEX_EXECUTION",
        "MODEL_OR_PLATFORM_CONCENTRATION",
      ],
    },
    {
      code: "AUTO_COMPONENTS",
      industrySelectors: [
        "AUTO_PARTS_EQUIPMENT",
        "AUTO_COMPONENTS",
        "TYRES_RUBBER_PRODUCTS",
      ],
      referenceSymbols: ["MOTHERSON", "SONACOMS"],
      benchmarkAuthority: ["NIFTY_AUTO", "EV_NEW_AGE_AUTOMOTIVE_CONTEXT"],
      valuationMethods: [
        "PE",
        "EV_EBITDA",
        "FCF_YIELD",
        "ROCE_WITH_CYCLE_CONTEXT",
      ],
      primaryDimensions: [
        "QUALITY",
        "GROWTH",
        "CAPITAL_EFFICIENCY",
        "CASH_FLOW",
        "BUSINESS_DURABILITY",
        "VALUATION",
      ],
      contextDimensions: [
        "BALANCE_SHEET_CREDIT",
        "MOMENTUM",
        "RISK",
        "OWNERSHIP_GOVERNANCE",
      ],
      mandatoryEvidenceFamilies: [
        "REVENUE_GROWTH_MULTI_PERIOD",
        "OPERATING_MARGIN_HISTORY",
        "ROCE_OR_ROIC",
        "CFO_OR_FCF_CONVERSION",
        "CUSTOMER_CONCENTRATION",
        "NET_CASH_OR_LEVERAGE",
        "VALUATION_SELF_AND_PEER_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "CUSTOMER_DIVERSIFICATION",
        "CONTENT_PER_VEHICLE_OR_PRODUCT_DEPTH",
        "TECHNOLOGY_AND_EV_EXPOSURE",
        "PLATFORM_DIVERSIFICATION",
        "GLOBAL_FOOTPRINT",
        "AFTERMARKET_OR_REPLACEMENT_REVENUE_WHEN_RELEVANT",
      ],
      majorRisks: [
        "CUSTOMER_CONCENTRATION",
        "OEM_PRODUCTION_CYCLE",
        "EV_TRANSITION",
        "COMMODITY_INPUTS",
        "GLOBAL_SUPPLY_CHAIN",
        "CAPEX_AND_ACQUISITION_EXECUTION",
      ],
    },
  ] as const satisfies readonly AutoK4aSubprofileContract[],
} as const

export function resolveAutoK4aSubprofile(
  industry: string | null,
): AutoK4aSubprofile | null {
  const key =
    industry?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
  for (const subprofile of AUTO_COMPONENTS_K4A_CONTRACT.subprofiles) {
    if (subprofile.industrySelectors.includes(key as never)) return subprofile.code
  }
  return null
}
