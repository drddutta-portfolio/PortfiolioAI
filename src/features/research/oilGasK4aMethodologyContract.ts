export const OIL_GAS_K4A_CONTRACT_VERSION =
  "OIL_GAS_V1_K4A_METHODOLOGY_V1" as const

export type OilGasK4aSubprofile =
  | "UPSTREAM_E_AND_P"
  | "MIDSTREAM_CITY_GAS"
  | "INTEGRATED_REFINING_PETCHEM"

export interface OilGasK4aSubprofileContract {
  readonly code: OilGasK4aSubprofile
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

export const OIL_GAS_K4A_CONTRACT = {
  version: OIL_GAS_K4A_CONTRACT_VERSION,
  state: "CHECKPOINT_A_OWNER_APPROVED_LOCKED",
  engineCode: "OIL_GAS_V1",
  runtimeActivationAllowed: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
  sectorOnlyRoutingAllowed: false,
  unknownIndustryBehavior: "METHOD_NOT_AVAILABLE",
  mixedBusinessControlRule: "RELIANCE_IS_CONTROL_NOT_SOLE_ANCHOR",
  historyMinimums: {
    annualFundamentalsYears: 5,
    quarterlyCycleQuarters: 12,
    cashConversionYears: 5,
    reserveOrVolumeHistoryYears: 5,
    marketHistoryTradingDays: 252,
  },
  normalizationPrinciples: [
    "COMMODITY_AND_REFINING_CYCLE_NORMALIZATION_REQUIRED",
    "SPOT_CRUDE_GAS_OR_REFINING_SPREAD_CANNOT_DEFINE_DURABLE_EARNINGS",
    "ADMINISTERED_PRICING_AND_TAX_CONTEXT_REQUIRED_WHERE_MATERIAL",
    "RESERVE_VOLUME_OR_THROUGHPUT_CONTEXT_REQUIRED_BY_SUBPROFILE",
    "ENERGY_TRANSITION_RISK_IS_EXPLICIT",
    "MIXED_BUSINESS_CONTROLS_MUST_NOT_OVERRIDE_PURE_PLAY_ECONOMICS",
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
      code: "UPSTREAM_E_AND_P",
      industrySelectors: [
        "OIL_EXPLORATION_PRODUCTION",
        "OIL_GAS_EXPLORATION",
        "EXPLORATION_PRODUCTION",
        "UPSTREAM_OIL_GAS",
      ],
      referenceSymbols: ["ONGC"],
      benchmarkAuthority: ["NIFTY_OIL_GAS"],
      valuationMethods: [
        "EV_EBITDA_NORMALIZED",
        "PB_WITH_RESOURCE_CONTEXT",
        "FCF_YIELD_NORMALIZED",
        "DIVIDEND_YIELD_CONTEXT",
        "DCF_RESOURCE_VALUE_WHEN_AVAILABLE",
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
        "RESERVE_REPLACEMENT_OR_RESOURCE_LIFE_WHEN_DISCLOSED",
        "LIFTING_COST_OR_UNIT_COST_WHEN_DISCLOSED",
        "ROCE_OR_ROIC_THROUGH_CYCLE",
        "CFO_OR_FCF_CONVERSION_THROUGH_CYCLE",
        "NET_DEBT_AND_INTEREST_COVERAGE",
        "COMMODITY_PRICE_AND_ADMINISTERED_PRICING_CONTEXT",
        "VALUATION_THROUGH_CYCLE",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "RESERVE_OR_RESOURCE_QUALITY",
        "PRODUCTION_VISIBILITY",
        "COST_POSITION",
        "PROJECT_PIPELINE",
        "CAPITAL_ALLOCATION_DISCIPLINE",
        "GEOGRAPHIC_DIVERSIFICATION",
      ],
      majorRisks: [
        "CRUDE_AND_GAS_PRICE_CYCLE",
        "ADMINISTERED_PRICING_OR_TAX",
        "RESERVE_DEPLETION",
        "PROJECT_EXECUTION",
        "FX",
        "ENERGY_TRANSITION",
      ],
    },
    {
      code: "MIDSTREAM_CITY_GAS",
      industrySelectors: [
        "GAS_TRANSMISSION",
        "GAS_DISTRIBUTION",
        "CITY_GAS_DISTRIBUTION",
        "PIPELINES",
        "MIDSTREAM_OIL_GAS",
      ],
      referenceSymbols: ["GAIL", "MGL", "IGL"],
      benchmarkAuthority: ["NIFTY_OIL_GAS"],
      valuationMethods: [
        "EV_EBITDA",
        "PE_WITH_REGULATORY_CONTEXT",
        "FCF_YIELD",
        "DIVIDEND_YIELD",
        "DCF_WHEN_TARIFF_CASH_FLOWS_ARE_STABLE",
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
        "VOLUME_AND_THROUGHPUT_GROWTH_MULTI_PERIOD",
        "MARGIN_OR_SPREAD_HISTORY",
        "ROCE_OR_ROIC",
        "CFO_OR_FCF_CONVERSION",
        "NET_CASH_OR_LEVERAGE",
        "TARIFF_ALLOCATION_OR_REGULATORY_CONTEXT",
        "NETWORK_OR_LICENSE_AREA_DURABILITY",
        "VALUATION_SELF_AND_PEER_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "NETWORK_SCALE",
        "LICENSE_OR_FRANCHISE_STRENGTH",
        "VOLUME_DENSITY",
        "CUSTOMER_MIX",
        "REGULATORY_VISIBILITY",
        "CAPITAL_ALLOCATION_DISCIPLINE",
      ],
      majorRisks: [
        "TARIFF_OR_ALLOCATION_POLICY",
        "GAS_INPUT_COST",
        "VOLUME_GROWTH",
        "REGULATION",
        "CAPEX_EXECUTION",
        "ENERGY_TRANSITION",
      ],
    },
    {
      code: "INTEGRATED_REFINING_PETCHEM",
      industrySelectors: [
        "REFINERIES",
        "REFINING_MARKETING",
        "PETROCHEMICALS",
        "INTEGRATED_OIL_GAS",
        "OIL_MARKETING_COMPANIES",
      ],
      referenceSymbols: ["RELIANCE"],
      benchmarkAuthority: ["NIFTY_OIL_GAS"],
      valuationMethods: [
        "EV_EBITDA_NORMALIZED",
        "SUM_OF_PARTS_WHEN_RELEVANT",
        "FCF_YIELD_NORMALIZED",
        "PB_WITH_CYCLE_CONTEXT",
        "DCF_WHEN_SEGMENT_DISCLOSURE_SUPPORTS",
      ],
      primaryDimensions: [
        "QUALITY",
        "GROWTH",
        "CAPITAL_EFFICIENCY",
        "CASH_FLOW",
        "BALANCE_SHEET_CREDIT",
        "BUSINESS_DURABILITY",
        "VALUATION",
      ],
      contextDimensions: [
        "MOMENTUM",
        "RISK",
        "OWNERSHIP_GOVERNANCE",
      ],
      mandatoryEvidenceFamilies: [
        "THROUGHPUT_AND_SEGMENT_GROWTH_MULTI_PERIOD",
        "GRM_OR_REFINING_MARGIN_CONTEXT_WHEN_DISCLOSED",
        "PETCHEM_MARGIN_OR_PRODUCT_MIX_WHEN_DISCLOSED",
        "ROCE_OR_ROIC_THROUGH_CYCLE",
        "CFO_OR_FCF_CONVERSION_THROUGH_CYCLE",
        "NET_DEBT_AND_INTEREST_COVERAGE",
        "SEGMENT_DIVERSIFICATION_AND_CAPITAL_ALLOCATION",
        "VALUATION_THROUGH_CYCLE_OR_SOTP",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "REFINING_COMPLEXITY_OR_COST_POSITION",
        "SEGMENT_DIVERSIFICATION",
        "PETCHEM_AND_DOWNSTREAM_INTEGRATION",
        "DISTRIBUTION_OR_MARKETING_SCALE",
        "CAPITAL_ALLOCATION_DISCIPLINE",
        "NEW_ENERGY_OPTIONALITY_WHEN_EVIDENCED",
      ],
      majorRisks: [
        "REFINING_MARGIN_CYCLE",
        "CRUDE_DIFFERENTIALS",
        "PETCHEM_CYCLE",
        "FX",
        "POLICY_AND_TAX",
        "ENERGY_TRANSITION",
      ],
    },
  ] as const satisfies readonly OilGasK4aSubprofileContract[],
} as const

export function resolveOilGasK4aSubprofile(
  industry: string | null,
): OilGasK4aSubprofile | null {
  const key =
    industry?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
  for (const subprofile of OIL_GAS_K4A_CONTRACT.subprofiles) {
    if (subprofile.industrySelectors.includes(key as never)) return subprofile.code
  }
  return null
}
