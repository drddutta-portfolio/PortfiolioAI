export const METALS_COMMODITIES_K4A_CONTRACT_VERSION =
  "METALS_COMMODITIES_K4A_METHODOLOGY_V1" as const

export type MetalsCommoditiesK4aSubprofile =
  | "STEEL_FERROUS"
  | "NON_FERROUS_DIVERSIFIED_METALS"

export interface MetalsCommoditiesK4aSubprofileContract {
  readonly code: MetalsCommoditiesK4aSubprofile
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

export const METALS_COMMODITIES_K4A_CONTRACT = {
  version: METALS_COMMODITIES_K4A_CONTRACT_VERSION,
  state: "CHECKPOINT_A_OWNER_APPROVAL_REQUIRED",
  engineCode: "METALS_COMMODITIES",
  runtimeActivationAllowed: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
  sectorOnlyRoutingAllowed: false,
  commodityExposureMetadataRequired: true,
  spotPeSoleAnchorAllowed: false,
  unknownIndustryBehavior: "METHOD_NOT_AVAILABLE",
  historyMinimums: {
    annualFundamentalsYears: 5,
    quarterlyCycleQuarters: 12,
    marginHistoryQuarters: 12,
    cashConversionYears: 5,
    leverageYears: 5,
    marketHistoryTradingDays: 252,
  },
  normalizationPrinciples: [
    "THROUGH_CYCLE_NORMALIZATION_REQUIRED",
    "SPOT_COMMODITY_PRICE_OR_SINGLE_QUARTER_MARGIN_CANNOT_DEFINE_DURABLE_EARNINGS",
    "COST_CURVE_AND_INPUT_INTEGRATION_CONTEXT_REQUIRED",
    "LEVERAGE_MUST_BE_READ_AT_MID_CYCLE_NOT_ONLY_PEAK_EARNINGS",
    "COMMODITY_EXPOSURE_METADATA_REQUIRED",
    "SPOT_PE_MUST_NOT_BE_SOLE_VALUATION_ANCHOR",
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
      code: "STEEL_FERROUS",
      industrySelectors: [
        "IRON_STEEL",
        "STEEL",
        "IRON_STEEL_PRODUCTS",
        "FERROUS_METALS",
      ],
      referenceSymbols: ["JINDALSTEL"],
      benchmarkAuthority: ["NIFTY_METAL"],
      valuationMethods: [
        "EV_EBITDA_NORMALIZED",
        "PB_WITH_CYCLE_CONTEXT",
        "NORMALIZED_FCF_YIELD",
        "ROCE_THROUGH_CYCLE",
      ],
      primaryDimensions: [
        "QUALITY",
        "GROWTH",
        "CAPITAL_EFFICIENCY",
        "CASH_FLOW",
        "BALANCE_SHEET_CREDIT",
        "VALUATION",
        "RISK",
      ],
      contextDimensions: [
        "BUSINESS_DURABILITY",
        "MOMENTUM",
        "OWNERSHIP_GOVERNANCE",
      ],
      mandatoryEvidenceFamilies: [
        "VOLUME_AND_REALIZATION_GROWTH_MULTI_PERIOD",
        "EBITDA_PER_TONNE_OR_MARGIN_EQUIVALENT_WHEN_DISCLOSED",
        "CAPACITY_AND_UTILISATION",
        "RAW_MATERIAL_INTEGRATION_AND_COST_POSITION",
        "ROCE_OR_ROIC_THROUGH_CYCLE",
        "CFO_OR_FCF_CONVERSION_THROUGH_CYCLE",
        "NET_DEBT_AND_INTEREST_COVERAGE",
        "VALUATION_THROUGH_CYCLE",
        "COMMODITY_EXPOSURE_METADATA",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "COST_POSITION",
        "RAW_MATERIAL_INTEGRATION",
        "CAPACITY_SCALE_AND_UTILISATION",
        "PRODUCT_MIX_AND_VALUE_ADDITION",
        "DOMESTIC_EXPORT_DIVERSIFICATION",
        "CAPITAL_ALLOCATION_DISCIPLINE",
      ],
      majorRisks: [
        "STEEL_SPREAD_CYCLE",
        "CHINA_GLOBAL_SUPPLY",
        "COKING_COAL_AND_IRON_ORE_COSTS",
        "LEVERAGE",
        "CAPEX_EXECUTION",
        "ENVIRONMENTAL_AND_CARBON_POLICY",
      ],
    },
    {
      code: "NON_FERROUS_DIVERSIFIED_METALS",
      industrySelectors: [
        "ALUMINIUM",
        "ZINC",
        "COPPER",
        "NON_FERROUS_METALS",
        "DIVERSIFIED_METALS",
        "MINERALS_MINING",
        "MINING",
      ],
      referenceSymbols: ["HINDALCO", "HINDZINC"],
      benchmarkAuthority: ["NIFTY_METAL"],
      valuationMethods: [
        "EV_EBITDA_NORMALIZED",
        "PB_WITH_CYCLE_CONTEXT",
        "NORMALIZED_FCF_YIELD",
        "ROCE_THROUGH_CYCLE",
        "NAV_RESOURCE_CONTEXT_WHEN_RELEVANT",
      ],
      primaryDimensions: [
        "QUALITY",
        "GROWTH",
        "CAPITAL_EFFICIENCY",
        "CASH_FLOW",
        "BALANCE_SHEET_CREDIT",
        "VALUATION",
        "RISK",
      ],
      contextDimensions: [
        "BUSINESS_DURABILITY",
        "MOMENTUM",
        "OWNERSHIP_GOVERNANCE",
      ],
      mandatoryEvidenceFamilies: [
        "PRODUCTION_VOLUME_AND_REALIZATION_MULTI_PERIOD",
        "COST_OF_PRODUCTION_OR_COST_CURVE",
        "CAPACITY_RESERVES_OR_RESOURCE_LIFE_WHEN_DISCLOSED",
        "INTEGRATION_AND_ENERGY_COST_CONTEXT",
        "ROCE_OR_ROIC_THROUGH_CYCLE",
        "CFO_OR_FCF_CONVERSION_THROUGH_CYCLE",
        "NET_DEBT_AND_INTEREST_COVERAGE",
        "VALUATION_THROUGH_CYCLE",
        "COMMODITY_EXPOSURE_METADATA",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "COST_CURVE_POSITION",
        "RESOURCE_OR_RESERVE_QUALITY_WHEN_RELEVANT",
        "INTEGRATION",
        "ENERGY_ACCESS_AND_COST",
        "METAL_MIX_DIVERSIFICATION",
        "CAPITAL_ALLOCATION_DISCIPLINE",
      ],
      majorRisks: [
        "METAL_PRICE_CYCLE",
        "CHINA_GLOBAL_DEMAND",
        "ENERGY_COSTS",
        "ROYALTY_AND_MINING_POLICY",
        "LEVERAGE",
        "ENVIRONMENTAL_AND_CARBON_POLICY",
      ],
    },
  ] as const satisfies readonly MetalsCommoditiesK4aSubprofileContract[],
} as const

export function resolveMetalsCommoditiesK4aSubprofile(
  industry: string | null,
): MetalsCommoditiesK4aSubprofile | null {
  const key =
    industry?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
  for (const subprofile of METALS_COMMODITIES_K4A_CONTRACT.subprofiles) {
    if (subprofile.industrySelectors.includes(key as never)) return subprofile.code
  }
  return null
}
