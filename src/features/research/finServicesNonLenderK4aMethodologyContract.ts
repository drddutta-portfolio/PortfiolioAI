export const FIN_SERVICES_NON_LENDER_K4A_CONTRACT_VERSION =
  "FIN_SERVICES_NON_LENDER_K4A_METHODOLOGY_V1" as const

export type FinServicesNonLenderK4aSubprofile =
  | "CAPITAL_MARKETS_AMC"
  | "INSURANCE"
  | "FINTECH_PLATFORM"

export interface FinServicesNonLenderSubprofileContract {
  readonly code: FinServicesNonLenderK4aSubprofile
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

export const FIN_SERVICES_NON_LENDER_K4A_CONTRACT = {
  version: FIN_SERVICES_NON_LENDER_K4A_CONTRACT_VERSION,
  state: "CHECKPOINT_A_OWNER_APPROVED_LOCKED",
  engineCode: "FIN_SERVICES_NON_LENDER",
  runtimeActivationAllowed: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
  sectorOnlyRoutingAllowed: false,
  lenderInheritanceAllowed: false,
  unknownIndustryBehavior: "METHOD_NOT_AVAILABLE",
  historyMinimums: {
    annualFundamentalsYears: 3,
    preferredAnnualFundamentalsYears: 5,
    quarterlyGrowthQuarters: 8,
    operatingMetricQuarters: 8,
    cashConversionYears: 3,
    marketHistoryTradingDays: 252,
  },
  normalizationPrinciples: [
    "NO_BANK_OR_NBFC_LENDING_METRIC_INHERITANCE",
    "AUM_MARKET_CYCLE_OR_PREMIUM_GROWTH_MUST_BE_NORMALIZED_BY_SUBPROFILE",
    "INSURANCE_RESERVING_AND_CLAIMS_EVIDENCE_CANNOT_BE_REPLACED_BY_GENERIC_MARGIN_METRICS",
    "PLATFORM_REVENUE_GROWTH_CANNOT_OVERRIDE_CASH_BURN_OR_UNIT_ECONOMICS",
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
      code: "CAPITAL_MARKETS_AMC",
      industrySelectors: [
        "ASSET_MANAGEMENT_COS",
        "ASSET_MANAGEMENT_COMPANY",
        "BROKING_DISTRIBUTION",
        "STOCK_EXCHANGES_DEPOSITORIES",
        "CAPITAL_MARKETS",
      ],
      referenceSymbols: ["NAM-INDIA", "HDFCAMC", "ANGELONE", "CAMS"],
      benchmarkAuthority: [
        "NIFTY_FINANCIAL_SERVICES_EX_BANK",
        "NIFTY_CAPITAL_MARKETS",
      ],
      valuationMethods: [
        "PE",
        "AUM_YIELD_OR_REVENUE_YIELD_WHEN_RELEVANT",
        "FCF_YIELD",
        "ROE_WITH_CYCLE_CONTEXT",
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
        "AUM_OR_CLIENT_ASSET_GROWTH_WHEN_RELEVANT",
        "REVENUE_AND_EARNINGS_GROWTH_MULTI_PERIOD",
        "OPERATING_MARGIN_HISTORY",
        "ROE_OR_ROIC",
        "CFO_OR_FCF_CONVERSION",
        "MARKET_SHARE_OR_CLIENT_ASSET_DURABILITY",
        "VALUATION_SELF_AND_PEER_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "AUM_OR_CLIENT_ASSET_STICKINESS",
        "DISTRIBUTION_OR_PLATFORM_STRENGTH",
        "MARKET_SHARE",
        "PRODUCT_DIVERSIFICATION",
        "OPERATING_LEVERAGE",
        "REGULATORY_COMPLIANCE",
      ],
      majorRisks: [
        "MARKET_CYCLE",
        "AUM_OR_TRADING_VOLUME_CONTRACTION",
        "FEE_COMPRESSION",
        "REGULATION",
        "CLIENT_ASSET_OPERATIONAL_RISK",
        "TECHNOLOGY_OR_PLATFORM_DISRUPTION",
      ],
    },
    {
      code: "INSURANCE",
      industrySelectors: [
        "LIFE_INSURANCE",
        "GENERAL_INSURANCE",
        "HEALTH_INSURANCE",
        "INSURANCE",
      ],
      referenceSymbols: ["STARHEALTH"],
      benchmarkAuthority: [
        "NIFTY_FINANCIAL_SERVICES_EX_BANK",
        "NIFTY_INSURANCE",
      ],
      valuationMethods: [
        "EMBEDDED_VALUE_WHEN_AVAILABLE",
        "VNB_MULTIPLE_WHEN_AVAILABLE",
        "PE_WITH_INSURANCE_CONTEXT",
        "ROE_WITH_RESERVING_CONTEXT",
      ],
      primaryDimensions: [
        "QUALITY",
        "GROWTH",
        "CAPITAL_EFFICIENCY",
        "BUSINESS_DURABILITY",
        "VALUATION",
        "RISK",
      ],
      contextDimensions: [
        "CASH_FLOW",
        "BALANCE_SHEET_CREDIT",
        "MOMENTUM",
        "OWNERSHIP_GOVERNANCE",
      ],
      mandatoryEvidenceFamilies: [
        "PREMIUM_OR_AUM_GROWTH_MULTI_PERIOD",
        "CLAIMS_OR_LOSS_RATIO_WHEN_APPLICABLE",
        "COMBINED_RATIO_OR_MARGIN_EQUIVALENT_WHEN_APPLICABLE",
        "SOLVENCY_OR_CAPITAL_ADEQUACY",
        "PERSISTENCY_OR_RENEWAL_QUALITY_WHEN_DISCLOSED",
        "RESERVING_OR_UNDERWRITING_QUALITY",
        "VALUATION_INSURANCE_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "DISTRIBUTION_STRENGTH",
        "PERSISTENCY_OR_RENEWAL",
        "UNDERWRITING_DISCIPLINE",
        "PRODUCT_MIX",
        "BRAND_AND_CHANNEL_DIVERSIFICATION",
        "CAPITAL_ADEQUACY",
      ],
      majorRisks: [
        "CLAIMS_INFLATION",
        "RESERVING_ERROR",
        "PRICING_OR_UNDERWRITING",
        "REGULATION",
        "DISTRIBUTION_CONCENTRATION",
        "CAPITAL_ADEQUACY",
      ],
    },
    {
      code: "FINTECH_PLATFORM",
      industrySelectors: [
        "FINTECH",
        "FINTECH_INSURANCE_BROKERAGE_PLATFORM",
        "INTERNET_SOFTWARE_SERVICES",
        "DIGITAL_FINANCIAL_PLATFORM",
      ],
      referenceSymbols: ["PAYTM", "POLICYBZR"],
      benchmarkAuthority: [
        "NIFTY_FINANCIAL_SERVICES_EX_BANK",
        "SIZE_MATCHED_DIGITAL_FINANCIAL_PEER_SET",
      ],
      valuationMethods: [
        "EV_SALES_WHEN_PROFITABILITY_IMMATURE",
        "PE_WHEN_MATURE",
        "FCF_YIELD_WHEN_POSITIVE",
        "GROWTH_ADJUSTED_VALUATION",
      ],
      primaryDimensions: [
        "QUALITY",
        "GROWTH",
        "CASH_FLOW",
        "BUSINESS_DURABILITY",
        "VALUATION",
        "RISK",
      ],
      contextDimensions: [
        "CAPITAL_EFFICIENCY",
        "BALANCE_SHEET_CREDIT",
        "MOMENTUM",
        "OWNERSHIP_GOVERNANCE",
      ],
      mandatoryEvidenceFamilies: [
        "REVENUE_GROWTH_MULTI_PERIOD",
        "CONTRIBUTION_MARGIN_OR_UNIT_ECONOMICS",
        "CFO_FCF_OR_CASH_BURN",
        "NET_CASH_OR_FUNDING_RUNWAY",
        "ACTIVE_USER_OR_TRANSACTION_DURABILITY_WHEN_DISCLOSED",
        "REGULATORY_DEPENDENCY",
        "VALUATION_PLATFORM_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "NETWORK_OR_DISTRIBUTION_SCALE",
        "USER_OR_MERCHANT_RETENTION_WHEN_DISCLOSED",
        "MONETIZATION_DEPTH",
        "PRODUCT_DIVERSIFICATION",
        "REGULATORY_RESILIENCE",
        "PATH_TO_SUSTAINABLE_CASH_GENERATION",
      ],
      majorRisks: [
        "REGULATION",
        "UNIT_ECONOMICS",
        "CASH_BURN",
        "PLATFORM_CONCENTRATION",
        "COMPETITION",
        "TECHNOLOGY_OR_FRAUD_RISK",
      ],
    },
  ] as const satisfies readonly FinServicesNonLenderSubprofileContract[],
} as const

export function resolveFinServicesNonLenderK4aSubprofile(
  industry: string | null,
): FinServicesNonLenderK4aSubprofile | null {
  const key =
    industry?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
  for (const subprofile of FIN_SERVICES_NON_LENDER_K4A_CONTRACT.subprofiles) {
    if (subprofile.industrySelectors.includes(key as never)) return subprofile.code
  }
  return null
}
