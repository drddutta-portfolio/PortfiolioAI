export const CHEMICALS_K4A_CONTRACT_VERSION =
  "CHEMICALS_V1_K4A_METHODOLOGY_V1" as const

export type ChemicalsK4aSubprofile =
  | "SPECIALTY_CHEMICALS"
  | "AGRO_FERTILISER"
  | "COMMODITY_PROCESS_CHEMICALS"

export interface ChemicalsK4aSubprofileContract {
  readonly code: ChemicalsK4aSubprofile
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

export const CHEMICALS_K4A_CONTRACT = {
  version: CHEMICALS_K4A_CONTRACT_VERSION,
  state: "CHECKPOINT_A_OWNER_APPROVAL_REQUIRED",
  engineCode: "CHEMICALS_V1",
  runtimeActivationAllowed: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
  sectorOnlyRoutingAllowed: false,
  unknownIndustryBehavior: "METHOD_NOT_AVAILABLE",
  historyMinimums: {
    annualFundamentalsYears: 3,
    preferredAnnualFundamentalsYears: 5,
    quarterlyGrowthQuarters: 8,
    marginHistoryQuarters: 8,
    cashConversionYears: 3,
    utilisationPeriods: 4,
    marketHistoryTradingDays: 252,
  },
  normalizationPrinciples: [
    "CYCLE_NORMALIZED_MARGIN_AND_GROWTH_INTERPRETATION",
    "NO_SINGLE_QUARTER_PRICE_OR_MARGIN_SPIKE_AS_DURABLE_GROWTH",
    "CAPACITY_AND_UTILISATION_MUST_BE_READ_WITH_RETURN_ON_CAPITAL",
    "FEEDSTOCK_AND_GLOBAL_PRICING_CONTEXT_REQUIRED_WHERE_MATERIAL",
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
      code: "SPECIALTY_CHEMICALS",
      industrySelectors: [
        "SPECIALTY_CHEMICALS",
        "SPECIALITY_CHEMICALS",
        "CHEMICALS_SPECIALTY",
      ],
      referenceSymbols: ["PIIND", "SRF", "VINATIORGA"],
      benchmarkAuthority: ["NIFTY_CHEMICALS"],
      valuationMethods: ["PE", "EV_EBITDA", "FCF_YIELD", "ROCE_WITH_CAPACITY_CONTEXT"],
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
        "CAPACITY_AND_UTILISATION_WHEN_DISCLOSED",
        "CUSTOMER_OR_PRODUCT_CONCENTRATION",
        "NET_CASH_OR_LEVERAGE",
        "VALUATION_SELF_AND_PEER_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "CUSTOMER_STICKINESS_AND_APPROVAL_CYCLES",
        "PRODUCT_MIX_COMPLEXITY",
        "PROCESS_CHEMISTRY_OR_IP_DEPTH",
        "CUSTOMER_DIVERSIFICATION",
        "CAPACITY_DISCIPLINE",
        "EXPORT_OR_GEOGRAPHIC_DIVERSIFICATION",
      ],
      majorRisks: [
        "FEEDSTOCK_COSTS",
        "GLOBAL_PRICING",
        "CUSTOMER_CONCENTRATION",
        "CAPACITY_EXECUTION",
        "ENVIRONMENTAL_REGULATION",
        "FX",
      ],
    },
    {
      code: "AGRO_FERTILISER",
      industrySelectors: [
        "PESTICIDES_AGROCHEMICALS",
        "AGROCHEMICALS",
        "FERTILISERS",
        "FERTILIZERS",
        "FERTILISER_CHEMICALS",
      ],
      referenceSymbols: ["PIIND", "DEEPAKFERT"],
      benchmarkAuthority: ["NIFTY_CHEMICALS"],
      valuationMethods: ["PE_WITH_CYCLE_CONTEXT", "EV_EBITDA", "FCF_YIELD", "NORMALIZED_ROCE"],
      primaryDimensions: [
        "QUALITY",
        "GROWTH",
        "CAPITAL_EFFICIENCY",
        "CASH_FLOW",
        "BALANCE_SHEET_CREDIT",
        "VALUATION",
      ],
      contextDimensions: [
        "BUSINESS_DURABILITY",
        "MOMENTUM",
        "RISK",
        "OWNERSHIP_GOVERNANCE",
      ],
      mandatoryEvidenceFamilies: [
        "REVENUE_AND_VOLUME_GROWTH_MULTI_PERIOD",
        "OPERATING_MARGIN_HISTORY",
        "ROCE_OR_ROIC",
        "CFO_OR_FCF_CONVERSION",
        "WORKING_CAPITAL_AND_INVENTORY",
        "LEVERAGE_AND_INTEREST_COVERAGE",
        "FEEDSTOCK_OR_INPUT_PRICE_CONTEXT",
        "VALUATION_SELF_AND_PEER_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "PRODUCT_PORTFOLIO_AND_REGISTRATIONS",
        "DISTRIBUTION_OR_CHANNEL_STRENGTH",
        "RAW_MATERIAL_ACCESS",
        "CAPACITY_AND_INTEGRATION",
        "CUSTOMER_DIVERSIFICATION",
        "REGULATORY_COMPLIANCE",
      ],
      majorRisks: [
        "MONSOON_AND_CROP_CYCLE",
        "RAW_MATERIAL_PRICING",
        "SUBSIDY_OR_POLICY",
        "INVENTORY_AND_WORKING_CAPITAL",
        "ENVIRONMENTAL_REGULATION",
        "GLOBAL_OVERSUPPLY",
      ],
    },
    {
      code: "COMMODITY_PROCESS_CHEMICALS",
      industrySelectors: [
        "COMMODITY_CHEMICALS",
        "INDUSTRIAL_CHEMICALS",
        "BASIC_CHEMICALS",
        "PROCESS_CHEMICALS",
      ],
      referenceSymbols: ["SRF", "DEEPAKFERT"],
      benchmarkAuthority: ["NIFTY_CHEMICALS"],
      valuationMethods: [
        "EV_EBITDA_NORMALIZED",
        "PB_WITH_CYCLE_CONTEXT",
        "FCF_YIELD_NORMALIZED",
        "ROCE_THROUGH_CYCLE",
      ],
      primaryDimensions: [
        "QUALITY",
        "GROWTH",
        "CAPITAL_EFFICIENCY",
        "CASH_FLOW",
        "BALANCE_SHEET_CREDIT",
        "VALUATION",
      ],
      contextDimensions: [
        "BUSINESS_DURABILITY",
        "MOMENTUM",
        "RISK",
        "OWNERSHIP_GOVERNANCE",
      ],
      mandatoryEvidenceFamilies: [
        "VOLUME_PRICE_MIX_GROWTH_WHEN_DISCLOSED",
        "OPERATING_MARGIN_HISTORY",
        "ROCE_OR_ROIC_THROUGH_CYCLE",
        "CFO_OR_FCF_CONVERSION",
        "CAPACITY_AND_UTILISATION",
        "LEVERAGE_AND_INTEREST_COVERAGE",
        "FEEDSTOCK_AND_GLOBAL_PRICE_CONTEXT",
        "VALUATION_THROUGH_CYCLE",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "COST_POSITION",
        "INTEGRATION_AND_FEEDSTOCK_ACCESS",
        "CAPACITY_SCALE",
        "CUSTOMER_DIVERSIFICATION",
        "EXPORT_COMPETITIVENESS",
        "ENVIRONMENTAL_COMPLIANCE",
      ],
      majorRisks: [
        "GLOBAL_OVERSUPPLY",
        "CHINA_PRICING",
        "FEEDSTOCK_AND_ENERGY_COSTS",
        "UTILISATION",
        "LEVERAGE",
        "ENVIRONMENTAL_POLICY",
      ],
    },
  ] as const satisfies readonly ChemicalsK4aSubprofileContract[],
} as const

export function resolveChemicalsK4aSubprofile(
  industry: string | null,
): ChemicalsK4aSubprofile | null {
  const key =
    industry?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
  for (const subprofile of CHEMICALS_K4A_CONTRACT.subprofiles) {
    if (subprofile.industrySelectors.includes(key as never)) return subprofile.code
  }
  return null
}
