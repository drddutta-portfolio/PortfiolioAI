export const POWER_RENEWABLES_K4A_CONTRACT_VERSION =
  "POWER_RENEWABLES_V1_K4A_METHODOLOGY_V1" as const

export type PowerRenewablesK4aSubprofile =
  | "REGULATED_NETWORK"
  | "GENERATION_INTEGRATED_UTILITY"
  | "RENEWABLE_IPP"

export interface PowerRenewablesK4aSubprofileContract {
  readonly code: PowerRenewablesK4aSubprofile
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

export const POWER_RENEWABLES_K4A_CONTRACT = {
  version: POWER_RENEWABLES_K4A_CONTRACT_VERSION,
  state: "CHECKPOINT_A_OWNER_APPROVED_LOCKED",
  engineCode: "POWER_RENEWABLES_V1",
  runtimeActivationAllowed: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
  sectorOnlyRoutingAllowed: false,
  unknownIndustryBehavior: "METHOD_NOT_AVAILABLE",
  historyMinimums: {
    annualFundamentalsYears: 5,
    quarterlyOperatingQuarters: 12,
    cashConversionYears: 5,
    leverageYears: 5,
    marketHistoryTradingDays: 252,
  },
  normalizationPrinciples: [
    "TARIFF_AND_REGULATORY_CONTEXT_REQUIRED_WHERE_MATERIAL",
    "FUEL_RESOURCE_VARIABILITY_MUST_BE_NORMALIZED_FOR_GENERATION",
    "OFFTAKER_DISCOM_AND_PPA_QUALITY_REQUIRED_FOR_CONTRACTED_ASSETS",
    "LEVERAGE_AND_INTEREST_RATE_SENSITIVITY_ARE_CORE_EVIDENCE",
    "CAPACITY_ADDITION_MUST_NOT_OVERRIDE CASH_FLOW_OR_EXECUTION_QUALITY",
    "TRANSMISSION_CONSTRAINT_AND_GRID_EVACUATION_RISK_IS_EXPLICIT",
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
      code: "REGULATED_NETWORK",
      industrySelectors: [
        "POWER_TRANSMISSION",
        "ELECTRICITY_TRANSMISSION",
        "POWER_GRID",
        "TRANSMISSION_DISTRIBUTION",
      ],
      referenceSymbols: ["POWERGRID"],
      benchmarkAuthority: ["NIFTY_POWER", "NIFTY_INFRASTRUCTURE_CONTEXT"],
      valuationMethods: [
        "PB_WITH_REGULATED_ASSET_BASE_CONTEXT",
        "DCF_REGULATED_CASH_FLOWS",
        "DIVIDEND_YIELD",
        "FCF_YIELD_WHERE_MEANINGFUL",
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
        "REGULATED_ASSET_BASE_OR_NETWORK_GROWTH",
        "TARIFF_AND_REGULATORY_RETURN_CONTEXT",
        "ROE_OR_ROIC",
        "CFO_OR_FCF_CONVERSION",
        "NET_DEBT_AND_INTEREST_COVERAGE",
        "CAPEX_AND_COMMISSIONING_EXECUTION",
        "NETWORK_AVAILABILITY_AND_SYSTEM_DURABILITY",
        "VALUATION_REGULATED_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "REGULATED_ASSET_BASE_SCALE",
        "TARIFF_VISIBILITY",
        "NETWORK_AVAILABILITY",
        "EXECUTION_DISCIPLINE",
        "BALANCE_SHEET_ACCESS",
        "SYSTEMIC_GRID_IMPORTANCE",
      ],
      majorRisks: [
        "REGULATORY_RETURN_RESET",
        "CAPEX_EXECUTION",
        "INTEREST_RATES",
        "GRID_CONSTRAINTS",
        "COUNTERPARTY_RECEIVABLES",
        "POLICY_CHANGE",
      ],
    },
    {
      code: "GENERATION_INTEGRATED_UTILITY",
      industrySelectors: [
        "POWER_GENERATION",
        "ELECTRIC_UTILITIES",
        "INTEGRATED_POWER_UTILITIES",
        "HYDRO_POWER",
        "THERMAL_POWER",
      ],
      referenceSymbols: ["TATAPOWER", "NHPC"],
      benchmarkAuthority: ["NIFTY_POWER", "NIFTY_ENERGY_CONTEXT"],
      valuationMethods: [
        "EV_EBITDA_NORMALIZED",
        "DCF_ASSET_CASH_FLOWS",
        "FCF_YIELD_NORMALIZED",
        "PB_WITH_ASSET_AND_REGULATORY_CONTEXT",
        "DIVIDEND_YIELD_CONTEXT",
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
        "CAPACITY_AND_GENERATION_GROWTH_MULTI_PERIOD",
        "PLF_OR_GENERATION_EFFICIENCY_WHEN_RELEVANT",
        "FUEL_OR_RESOURCE_COST_CONTEXT",
        "ROCE_OR_ROIC_THROUGH_CYCLE",
        "CFO_OR_FCF_CONVERSION",
        "NET_DEBT_AND_INTEREST_COVERAGE",
        "PPA_TARIFF_AND_OFFTAKER_CONTEXT",
        "ASSET_MIX_AND_EXECUTION_DURABILITY",
        "VALUATION_ASSET_AND_CASH_FLOW_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "ASSET_MIX_DIVERSIFICATION",
        "PPA_OR_TARIFF_VISIBILITY",
        "RESOURCE_OR_FUEL_ACCESS",
        "OPERATING_AVAILABILITY",
        "CAPITAL_ALLOCATION_DISCIPLINE",
        "TRANSITION_OPTIONALITY_WHEN_EVIDENCED",
      ],
      majorRisks: [
        "FUEL_OR_RESOURCE_VARIABILITY",
        "TARIFF_AND_REGULATION",
        "DISCOM_OR_OFFTAKER_CREDIT",
        "LEVERAGE_AND_INTEREST_RATES",
        "CAPEX_EXECUTION",
        "ENERGY_TRANSITION",
      ],
    },
    {
      code: "RENEWABLE_IPP",
      industrySelectors: [
        "RENEWABLE_POWER",
        "RENEWABLE_ENERGY",
        "SOLAR_POWER",
        "WIND_POWER",
        "INDEPENDENT_POWER_PRODUCER_RENEWABLE",
      ],
      referenceSymbols: ["ACMESOLAR", "KPIGREEN"],
      benchmarkAuthority: ["NIFTY_POWER", "NIFTY_ENERGY_CONTEXT"],
      valuationMethods: [
        "EV_EBITDA",
        "DCF_CONTRACTED_ASSET_CASH_FLOWS",
        "FCF_YIELD_WHEN_STABILIZED",
        "EV_PER_MW_WITH_CASH_FLOW_CONTEXT",
      ],
      primaryDimensions: [
        "QUALITY",
        "GROWTH",
        "CAPITAL_EFFICIENCY",
        "CASH_FLOW",
        "BALANCE_SHEET_CREDIT",
        "BUSINESS_DURABILITY",
        "VALUATION",
        "RISK",
      ],
      contextDimensions: [
        "MOMENTUM",
        "OWNERSHIP_GOVERNANCE",
      ],
      mandatoryEvidenceFamilies: [
        "OPERATING_AND_PIPELINE_CAPACITY_GROWTH",
        "CUF_OR_RESOURCE_YIELD_WHEN_DISCLOSED",
        "PROJECT_IRR_OR_RETURN_ON_CAPITAL_CONTEXT_WHEN_AVAILABLE",
        "CFO_OR_FCF_AND_PROJECT_CASH_FLOW_CONVERSION",
        "NET_DEBT_INTEREST_COVERAGE_AND_REFINANCING",
        "PPA_TARIFF_TENOR_AND_OFFTAKER_QUALITY",
        "PIPELINE_EXECUTION_AND_GRID_EVACUATION",
        "VALUATION_CONTRACTED_CASH_FLOW_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "LONG_TERM_PPA_VISIBILITY",
        "OFFTAKER_QUALITY",
        "RESOURCE_QUALITY",
        "PROJECT_PIPELINE_EXECUTION",
        "LOW_COST_FUNDING_ACCESS",
        "GRID_EVACUATION_ACCESS",
      ],
      majorRisks: [
        "DISCOM_OR_OFFTAKER_CREDIT",
        "CURTAILMENT_AND_GRID_EVACUATION",
        "RESOURCE_VARIABILITY",
        "INTEREST_RATES_AND_REFINANCING",
        "CAPEX_EXECUTION",
        "TARIFF_COMPRESSION_OR_POLICY",
      ],
    },
  ] as const satisfies readonly PowerRenewablesK4aSubprofileContract[],
} as const

export function resolvePowerRenewablesK4aSubprofile(
  industry: string | null,
): PowerRenewablesK4aSubprofile | null {
  const key =
    industry?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
  for (const subprofile of POWER_RENEWABLES_K4A_CONTRACT.subprofiles) {
    if (subprofile.industrySelectors.includes(key as never)) return subprofile.code
  }
  return null
}
