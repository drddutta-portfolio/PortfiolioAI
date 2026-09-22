export const CONSUMER_FMCG_K4A_CONTRACT_VERSION =
  "CONSUMER_FMCG_K4A_METHODOLOGY_V1" as const

export type ConsumerFmcgK4aSubprofile =
  | "BRANDED_CONSUMER_FMCG"

export interface ConsumerFmcgK4aSubprofileContract {
  readonly code: ConsumerFmcgK4aSubprofile
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

export const CONSUMER_FMCG_K4A_CONTRACT = {
  version: CONSUMER_FMCG_K4A_CONTRACT_VERSION,
  state: "CHECKPOINT_A_OWNER_APPROVED_LOCKED",
  engineCode: "CONSUMER_FMCG",
  runtimeActivationAllowed: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
  sectorOnlyRoutingAllowed: false,
  productCategoryMetadataRequired: true,
  alcoholVariantIsSeparateScoreCurve: false,
  unknownIndustryBehavior: "METHOD_NOT_AVAILABLE",
  historyMinimums: {
    annualFundamentalsYears: 3,
    preferredAnnualFundamentalsYears: 5,
    quarterlyGrowthQuarters: 8,
    marginHistoryQuarters: 8,
    cashConversionYears: 3,
    marketHistoryTradingDays: 252,
  },
  normalizationPrinciples: [
    "VOLUME_PRICE_MIX_MUST_BE_SEPARATED_WHEN_DISCLOSED",
    "RAW_MATERIAL_INFLATION_MUST_BE_READ_WITH_GROSS_AND_OPERATING_MARGIN_HISTORY",
    "BRAND_AND_DISTRIBUTION_DURABILITY_MUST_NOT_BE_INFERRED_FROM_ONE_QUARTER_GROWTH",
    "WORKING_CAPITAL_AND_CASH_CONVERSION_ARE_CORE_QUALITY_EVIDENCE",
    "ALCOHOL_EXCISE_AND_REGULATORY_RISK_IS_EXPLICIT_VARIANT_METADATA_NOT_A_SEPARATE_UNIVERSAL_CURVE",
    "PRODUCT_CATEGORY_METADATA_REQUIRED",
    "MISSING_MANDATORY_EVIDENCE_FAILS_CLOSED",
  ],
  recommendationFramework: {
    roleNamesShared: true,
    numericThresholdsUniversal: false,
    thresholdsOwner: "PROFILE_AUTHORITY",
    roleFloorsOwner: "PROFILE_AUTHORITY",
    avoidRuleOwner: "PROFILE_AUTHORITY",
  },
  subprofiles: [
    {
      code: "BRANDED_CONSUMER_FMCG",
      industrySelectors: [
        "PERSONAL_CARE_HOUSEHOLD_PRODUCTS",
        "PERSONAL_PRODUCTS_HOUSEHOLD_CARE",
        "PACKAGED_FOODS",
        "OTHER_FOOD_BEVERAGES",
        "TEA_COFFEE",
        "VEGETABLE_OILS_PRODUCTS",
        "BEVERAGES",
        "FMCG",
        "FAST_MOVING_CONSUMER_GOODS",
        "CONSUMER_STAPLES",
        "ALCOHOLIC_BEVERAGES",
        "DISTILLERIES_BREWERIES",
      ],
      referenceSymbols: ["HINDUNILVR", "VBL", "LTFOODS", "RADICO"],
      benchmarkAuthority: ["NIFTY_FMCG"],
      valuationMethods: [
        "PE_SELF_HISTORY_AND_PEER_RELATIVE",
        "EV_EBITDA",
        "FCF_YIELD",
        "ROCE_AND_CASH_CONVERSION_CONTEXT",
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
        "VOLUME_PRICE_MIX_WHEN_DISCLOSED",
        "GROSS_AND_OPERATING_MARGIN_HISTORY",
        "ROCE_OR_ROIC",
        "CFO_OR_FCF_CONVERSION",
        "WORKING_CAPITAL_DISCIPLINE",
        "BRAND_DISTRIBUTION_AND_CATEGORY_DURABILITY",
        "NET_CASH_OR_LEVERAGE",
        "VALUATION_SELF_AND_PEER_CONTEXT",
        "PRODUCT_CATEGORY_METADATA",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "BRAND_STRENGTH",
        "DISTRIBUTION_REACH",
        "CATEGORY_LEADERSHIP_OR_DEPTH",
        "PREMIUMIZATION_OR_MIX",
        "INNOVATION_AND_PRODUCT_REFRESH",
        "GEOGRAPHIC_AND_CHANNEL_DIVERSIFICATION",
      ],
      majorRisks: [
        "RAW_MATERIAL_INFLATION",
        "DEMAND_SLOWDOWN_OR_DOWNTRADING",
        "COMPETITIVE_INTENSITY",
        "BRAND_OR_CATEGORY_CONCENTRATION",
        "DISTRIBUTION_DISRUPTION",
        "EXCISE_AND_REGULATION_WHEN_ALCOHOL",
      ],
    },
  ] as const satisfies readonly ConsumerFmcgK4aSubprofileContract[],
} as const

export function resolveConsumerFmcgK4aSubprofile(
  industry: string | null,
): ConsumerFmcgK4aSubprofile | null {
  const key =
    industry?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
  for (const subprofile of CONSUMER_FMCG_K4A_CONTRACT.subprofiles) {
    if (subprofile.industrySelectors.includes(key as never)) return subprofile.code
  }
  return null
}
