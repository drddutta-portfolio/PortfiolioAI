export const IT_TECH_K4A_CONTRACT_VERSION = "IT_TECH_K4A_METHODOLOGY_V1" as const

export type ItTechSubprofile =
  | "IT_SERVICES"
  | "SOFTWARE_PRODUCTS_PLATFORMS"
  | "DIGITAL_INFRA_HARDWARE"

export interface ItTechSubprofileContract {
  readonly code: ItTechSubprofile
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

export const IT_TECH_K4A_CONTRACT = {
  version: IT_TECH_K4A_CONTRACT_VERSION,
  state: "CHECKPOINT_A_OWNER_APPROVED_LOCKED",
  engineCode: "IT_TECH",
  runtimeActivationAllowed: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
  sectorOnlyRoutingAllowed: false,
  unknownIndustryBehavior: "METHOD_NOT_AVAILABLE",
  benchmarkPrimary: "NIFTY_IT",
  benchmarkContext: "NIFTY_MIDSMALL_IT_TELECOM_WHEN_SIZE_RELEVANT",
  commonDimensions: [
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
  ],
  historyMinimums: {
    annualFundamentalsYears: 3,
    preferredAnnualFundamentalsYears: 5,
    quarterlyGrowthQuarters: 8,
    preferredQuarterlyGrowthQuarters: 12,
    marginHistoryQuarters: 8,
    cashConversionYears: 3,
    marketHistoryTradingDays: 252,
  },
  normalizationPrinciples: [
    "SELF_HISTORY_PLUS_PEER_RELATIVE_WHERE_ECONOMICALLY_VALID",
    "ABSOLUTE_FLOORS_ONLY_FOR_ACCOUNTING_QUALITY_OR_BALANCE_SHEET_SAFETY",
    "NO_SINGLE_QUARTER_GROWTH_AS_DURABLE_GROWTH",
    "MISSING_MANDATORY_EVIDENCE_FAILS_CLOSED",
    "NO_CROSS_SUBPROFILE_PEER_PERCENTILES",
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
      code: "IT_SERVICES",
      industrySelectors: [
        "COMPUTERS_SOFTWARE_CONSULTING",
        "IT_SERVICES",
        "IT_SERVICES_CONSULTING",
        "SOFTWARE_SERVICES",
      ],
      referenceSymbols: ["INFY", "PERSISTENT", "HCLTECH"],
      benchmarkAuthority: ["NIFTY_IT"],
      valuationMethods: ["PE_SELF_HISTORY", "PE_PEER_RELATIVE", "FCF_YIELD", "EV_EBITDA_CONTEXT"],
      primaryDimensions: ["QUALITY", "GROWTH", "CASH_FLOW", "BUSINESS_DURABILITY", "VALUATION"],
      contextDimensions: ["CAPITAL_EFFICIENCY", "BALANCE_SHEET_CREDIT", "MOMENTUM", "RISK", "OWNERSHIP_GOVERNANCE"],
      mandatoryEvidenceFamilies: [
        "REVENUE_GROWTH_MULTI_PERIOD",
        "OPERATING_MARGIN_HISTORY",
        "FCF_CONVERSION",
        "ROCE_OR_ROIC",
        "NET_CASH_OR_LEVERAGE",
        "VALUATION_SELF_HISTORY",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "CLIENT_CONCENTRATION",
        "LARGE_DEAL_OR_ORDER_VISIBILITY",
        "RECURRING_REVENUE_OR_LONG_DURATION_RELATIONSHIPS",
        "MARGIN_AND_UTILISATION_DURABILITY",
        "TALENT_ATTRITION_AND_COST_DISCIPLINE",
        "GEOGRAPHIC_AND_VERTICAL_DIVERSIFICATION",
      ],
      majorRisks: [
        "DISCRETIONARY_TECH_SPEND",
        "CLIENT_CONCENTRATION",
        "FX",
        "MARGIN_UTILISATION",
        "TALENT",
        "AI_AUTOMATION_DISRUPTION",
      ],
    },
    {
      code: "SOFTWARE_PRODUCTS_PLATFORMS",
      industrySelectors: [
        "IT_SOFTWARE_PRODUCTS",
        "SOFTWARE_PRODUCTS",
        "INTERNET_SOFTWARE_SERVICES",
      ],
      referenceSymbols: [],
      benchmarkAuthority: ["NIFTY_IT", "SIZE_MATCHED_TECH_PEER_SET"],
      valuationMethods: ["EV_SALES_WHEN_PROFITABILITY_IMMATURE", "PE_WHEN_MATURE", "FCF_YIELD_WHEN_POSITIVE", "GROWTH_ADJUSTED_VALUATION"],
      primaryDimensions: ["QUALITY", "GROWTH", "CASH_FLOW", "BUSINESS_DURABILITY", "VALUATION"],
      contextDimensions: ["CAPITAL_EFFICIENCY", "BALANCE_SHEET_CREDIT", "MOMENTUM", "RISK", "OWNERSHIP_GOVERNANCE"],
      mandatoryEvidenceFamilies: [
        "REVENUE_GROWTH_MULTI_PERIOD",
        "RECURRING_OR_SUBSCRIPTION_REVENUE_WHEN_DISCLOSED",
        "OPERATING_MARGIN_OR_PATH_TO_PROFITABILITY",
        "FCF_OR_CASH_BURN",
        "NET_CASH_OR_LEVERAGE",
        "VALUATION_SUBPROFILE_COMPARABLE",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "RECURRING_REVENUE",
        "CUSTOMER_RETENTION_OR_STICKINESS_WHEN_DISCLOSED",
        "PRODUCT_CONCENTRATION",
        "PLATFORM_NETWORK_EFFECT_OR_SWITCHING_COST",
        "R_AND_D_REINVESTMENT",
        "SCALABILITY_OF_MARGIN",
      ],
      majorRisks: [
        "PRODUCT_OBSOLESCENCE",
        "PLATFORM_COMPETITION",
        "CUSTOMER_CONCENTRATION",
        "HIGH_VALUATION_DURATION",
        "CASH_BURN",
        "AI_OR_TECHNOLOGY_DISRUPTION",
      ],
    },
    {
      code: "DIGITAL_INFRA_HARDWARE",
      industrySelectors: [
        "COMPUTERS_HARDWARE_EQUIPMENTS",
        "COMPUTER_HARDWARE",
        "DATA_CENTRE_INFRASTRUCTURE",
        "DIGITAL_INFRASTRUCTURE",
      ],
      referenceSymbols: ["NETWEB"],
      benchmarkAuthority: ["NIFTY_IT", "NIFTY_MIDSMALL_IT_TELECOM_WHEN_SIZE_RELEVANT"],
      valuationMethods: ["PE", "EV_EBITDA", "FCF_YIELD", "ROCE_WITH_CYCLE_CONTEXT"],
      primaryDimensions: ["QUALITY", "GROWTH", "CAPITAL_EFFICIENCY", "CASH_FLOW", "BALANCE_SHEET_CREDIT", "VALUATION"],
      contextDimensions: ["BUSINESS_DURABILITY", "MOMENTUM", "RISK", "OWNERSHIP_GOVERNANCE"],
      mandatoryEvidenceFamilies: [
        "REVENUE_AND_ORDER_GROWTH_MULTI_PERIOD",
        "OPERATING_MARGIN_HISTORY",
        "ROCE_OR_ROIC",
        "WORKING_CAPITAL_AND_CASH_CONVERSION",
        "LEVERAGE",
        "VALUATION_SELF_AND_PEER_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "ORDER_OR_DEMAND_VISIBILITY",
        "CUSTOMER_CONCENTRATION",
        "SUPPLY_CHAIN_RESILIENCE",
        "DOMESTIC_VALUE_ADDITION_OR_IP",
        "CAPACITY_UTILISATION",
        "TECHNOLOGY_REFRESH_CAPABILITY",
      ],
      majorRisks: [
        "SUPPLY_CHAIN",
        "COMPONENT_COSTS",
        "WORKING_CAPITAL",
        "CUSTOMER_CONCENTRATION",
        "CAPEX_EXECUTION",
        "TECHNOLOGY_OBSOLESCENCE",
      ],
    },
  ] as const satisfies readonly ItTechSubprofileContract[],
} as const

export function resolveItTechK4aSubprofile(industry: string | null): ItTechSubprofile | null {
  const key = industry?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
  for (const subprofile of IT_TECH_K4A_CONTRACT.subprofiles) {
    if (subprofile.industrySelectors.includes(key as never)) return subprofile.code
  }
  return null
}
