export const INDUSTRIALS_K4A_CONTRACT_VERSION =
  "INDUSTRIALS_CAPITAL_GOODS_K4A_METHODOLOGY_V1" as const

export type IndustrialsK4aSubprofile =
  | "PROJECT_EPC"
  | "CAPITAL_EQUIPMENT_ELECTRICAL"
  | "DEFENCE_AEROSPACE"

export interface IndustrialsK4aSubprofileContract {
  readonly code: IndustrialsK4aSubprofile
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

export const INDUSTRIALS_K4A_CONTRACT = {
  version: INDUSTRIALS_K4A_CONTRACT_VERSION,
  state: "CHECKPOINT_A_OWNER_APPROVAL_REQUIRED",
  engineCode: "INDUSTRIALS_CAPITAL_GOODS",
  runtimeActivationAllowed: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
  sectorOnlyRoutingAllowed: false,
  unknownIndustryBehavior: "METHOD_NOT_AVAILABLE",
  historyMinimums: {
    annualFundamentalsYears: 3,
    preferredAnnualFundamentalsYears: 5,
    quarterlyGrowthQuarters: 8,
    orderBookPeriods: 4,
    cashConversionYears: 3,
    workingCapitalYears: 3,
    marketHistoryTradingDays: 252,
  },
  normalizationPrinciples: [
    "NO_SINGLE_QUARTER_ORDER_OR_REVENUE_SPIKE_AS_DURABLE_GROWTH",
    "ORDER_BOOK_MUST_BE_NORMALIZED_FOR_EXECUTION_AND_CANCELLATION_RISK",
    "WORKING_CAPITAL_AND_CASH_CONVERSION_ARE_CORE_EVIDENCE",
    "CYCLE_AWARE_ROCE_AND_MARGIN_INTERPRETATION",
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
      code: "PROJECT_EPC",
      industrySelectors: [
        "CIVIL_CONSTRUCTION",
        "CONSTRUCTION_ENGINEERING",
        "EPC",
        "INDUSTRIAL_CONSTRUCTION",
      ],
      referenceSymbols: ["LT"],
      benchmarkAuthority: ["NIFTY_CAPITAL_GOODS"],
      valuationMethods: [
        "EV_EBITDA",
        "PE_WITH_CYCLE_CONTEXT",
        "FCF_YIELD",
        "ROCE_WITH_WORKING_CAPITAL_CONTEXT",
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
      contextDimensions: ["MOMENTUM", "RISK", "OWNERSHIP_GOVERNANCE"],
      mandatoryEvidenceFamilies: [
        "ORDER_BOOK_AND_REVENUE_GROWTH",
        "ORDER_INFLOW_AND_EXECUTION",
        "OPERATING_MARGIN_HISTORY",
        "WORKING_CAPITAL_DAYS",
        "CFO_OR_FCF_CONVERSION",
        "ROCE_OR_ROIC",
        "NET_DEBT_AND_INTEREST_COVERAGE",
        "VALUATION_SELF_AND_PEER_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "ORDER_BOOK_VISIBILITY",
        "ORDER_DIVERSIFICATION",
        "EXECUTION_TRACK_RECORD",
        "CUSTOMER_AND_GOVERNMENT_CONCENTRATION",
        "WORKING_CAPITAL_DISCIPLINE",
        "CAPITAL_ALLOCATION_DISCIPLINE",
      ],
      majorRisks: [
        "ORDER_EXECUTION",
        "RECEIVABLES",
        "WORKING_CAPITAL",
        "INPUT_COSTS",
        "PROJECT_DELAYS",
        "CUSTOMER_OR_GOVERNMENT_CONCENTRATION",
      ],
    },
    {
      code: "CAPITAL_EQUIPMENT_ELECTRICAL",
      industrySelectors: [
        "HEAVY_ELECTRICAL_EQUIPMENT",
        "OTHER_ELECTRICAL_EQUIPMENT_PRODUCTS",
        "INDUSTRIAL_MACHINERY",
        "ELECTRICAL_EQUIPMENT",
        "INDUSTRIAL_PRODUCTS",
      ],
      referenceSymbols: ["CGPOWER"],
      benchmarkAuthority: ["NIFTY_CAPITAL_GOODS", "NIFTY_INDIA_MANUFACTURING_CONTEXT"],
      valuationMethods: ["PE", "EV_EBITDA", "FCF_YIELD", "CYCLE_AWARE_ROCE"],
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
        "REVENUE_AND_ORDER_GROWTH_MULTI_PERIOD",
        "OPERATING_MARGIN_HISTORY",
        "ROCE_OR_ROIC",
        "CFO_OR_FCF_CONVERSION",
        "WORKING_CAPITAL_DAYS",
        "CAPACITY_AND_UTILISATION_WHEN_DISCLOSED",
        "NET_CASH_OR_LEVERAGE",
        "VALUATION_SELF_AND_PEER_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "PRODUCT_AND_TECHNOLOGY_POSITION",
        "ORDER_VISIBILITY",
        "AFTERMARKET_OR_REPLACEMENT_REVENUE_WHEN_RELEVANT",
        "CUSTOMER_DIVERSIFICATION",
        "CAPACITY_DISCIPLINE",
        "SUPPLY_CHAIN_RESILIENCE",
      ],
      majorRisks: [
        "CAPEX_CYCLE",
        "INPUT_COSTS",
        "WORKING_CAPITAL",
        "CUSTOMER_CONCENTRATION",
        "CAPACITY_EXECUTION",
        "TECHNOLOGY_OBSOLESCENCE",
      ],
    },
    {
      code: "DEFENCE_AEROSPACE",
      industrySelectors: [
        "AEROSPACE_DEFENCE",
        "AEROSPACE_AND_DEFENCE",
        "DEFENCE_EQUIPMENT",
        "DEFENCE_ELECTRONICS",
      ],
      referenceSymbols: ["BEL", "ASTRAMICRO"],
      benchmarkAuthority: ["NIFTY_INDIA_DEFENCE", "NIFTY_CAPITAL_GOODS_CONTEXT"],
      valuationMethods: ["PE", "EV_EBITDA", "FCF_YIELD", "ORDER_BOOK_ADJUSTED_GROWTH_CONTEXT"],
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
        "ORDER_BOOK_AND_ORDER_INFLOW",
        "EXECUTION_AND_REVENUE_GROWTH",
        "OPERATING_MARGIN_HISTORY",
        "ROCE_OR_ROIC",
        "CFO_OR_FCF_CONVERSION",
        "CUSTOMER_CONCENTRATION",
        "INDIGENISATION_OR_IP_POSITION_WHEN_DISCLOSED",
        "VALUATION_SELF_AND_PEER_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "ORDER_BOOK_VISIBILITY",
        "PROGRAM_LONGEVITY",
        "INDIGENISATION_AND_IP",
        "CUSTOMER_AND_PLATFORM_DIVERSIFICATION",
        "EXECUTION_TRACK_RECORD",
        "EXPORT_OPTIONALITY_WHEN_EVIDENCED",
      ],
      majorRisks: [
        "GOVERNMENT_CUSTOMER_CONCENTRATION",
        "PROCUREMENT_DELAYS",
        "PROGRAM_EXECUTION",
        "WORKING_CAPITAL",
        "TECHNOLOGY_DEPENDENCE",
        "VALUATION_DURATION",
      ],
    },
  ] as const satisfies readonly IndustrialsK4aSubprofileContract[],
} as const

export function resolveIndustrialsK4aSubprofile(
  industry: string | null,
): IndustrialsK4aSubprofile | null {
  const key =
    industry?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
  for (const subprofile of INDUSTRIALS_K4A_CONTRACT.subprofiles) {
    if (subprofile.industrySelectors.includes(key as never)) return subprofile.code
  }
  return null
}
