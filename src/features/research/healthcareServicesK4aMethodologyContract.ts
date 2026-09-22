export const HEALTHCARE_SERVICES_K4A_CONTRACT_VERSION =
  "HEALTHCARE_SERVICES_V1_K4A_METHODOLOGY_V1" as const

export type HealthcareServicesK4aSubprofile =
  | "HOSPITAL_OPERATORS"

export interface HealthcareServicesK4aSubprofileContract {
  readonly code: HealthcareServicesK4aSubprofile
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

export const HEALTHCARE_SERVICES_K4A_CONTRACT = {
  version: HEALTHCARE_SERVICES_K4A_CONTRACT_VERSION,
  state: "CHECKPOINT_A_OWNER_APPROVED_LOCKED",
  engineCode: "HEALTHCARE_SERVICES_V1",
  runtimeActivationAllowed: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
  sectorOnlyRoutingAllowed: false,
  unknownIndustryBehavior: "METHOD_NOT_AVAILABLE",
  diagnosticsIncluded: false,
  diagnosticsBehavior: "REVIEW_REQUIRED_SEPARATE_METHODOLOGY",
  historyMinimums: {
    annualFundamentalsYears: 3,
    preferredAnnualFundamentalsYears: 5,
    quarterlyGrowthQuarters: 8,
    operatingMetricQuarters: 8,
    cashConversionYears: 3,
    marketHistoryTradingDays: 252,
  },
  normalizationPrinciples: [
    "NO_SINGLE_QUARTER_OCCUPANCY_OR_ARPOB_SPIKE_AS_DURABLE_GROWTH",
    "BED_ADDITION_MUST_BE_READ_WITH_RAMP_AND_RETURN_ON_CAPITAL",
    "OCCUPANCY_AND_ARPOB_REQUIRE_CAPACITY_AND_CASE_MIX_CONTEXT",
    "CASH_CONVERSION_MUST_RECONCILE_WITH_CAPEX_AND_RECEIVABLES",
    "NON_HOSPITAL_HEALTHCARE_SERVICES_MUST_FAIL_REVIEW",
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
      code: "HOSPITAL_OPERATORS",
      industrySelectors: [
        "HOSPITALS",
        "HOSPITAL",
        "HOSPITAL_HEALTHCARE_SERVICES",
        "HEALTHCARE_FACILITIES",
      ],
      referenceSymbols: ["MAXHEALTH", "NH", "MEDANTA", "YATHARTH"],
      benchmarkAuthority: ["NIFTY_HOSPITALS", "NIFTY_HEALTHCARE_CONTEXT"],
      valuationMethods: [
        "EV_EBITDA",
        "PE",
        "FCF_YIELD",
        "ROCE_WITH_BED_RAMP_CONTEXT",
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
        "REVENUE_AND_EBITDA_GROWTH_MULTI_PERIOD",
        "OPERATING_MARGIN_HISTORY",
        "OCCUPANCY_WHEN_DISCLOSED",
        "ARPOB_OR_EQUIVALENT_WHEN_DISCLOSED",
        "BED_CAPACITY_AND_RAMP",
        "ROCE_OR_ROIC",
        "CFO_OR_FCF_CONVERSION",
        "NET_CASH_OR_LEVERAGE",
        "VALUATION_SELF_AND_PEER_CONTEXT",
        "MARKET_MOMENTUM_AND_DRAWDOWN",
      ],
      durabilityFactors: [
        "OCCUPANCY_DURABILITY",
        "CLINICIAN_RETENTION",
        "CASE_MIX_AND_SPECIALTY_DEPTH",
        "NETWORK_AND_LOCATION_DIVERSIFICATION",
        "PAYER_MIX",
        "BED_RAMP_EXECUTION",
      ],
      majorRisks: [
        "OCCUPANCY_WEAKNESS",
        "CLINICIAN_ATTRITION",
        "PRICING_REGULATION",
        "CAPEX_AND_BED_RAMP",
        "PAYER_MIX",
        "RECEIVABLES",
        "EXECUTION",
      ],
    },
  ] as const satisfies readonly HealthcareServicesK4aSubprofileContract[],
} as const

export function resolveHealthcareServicesK4aSubprofile(
  industry: string | null,
): HealthcareServicesK4aSubprofile | null {
  const key =
    industry?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
  for (const subprofile of HEALTHCARE_SERVICES_K4A_CONTRACT.subprofiles) {
    if (subprofile.industrySelectors.includes(key as never)) return subprofile.code
  }
  return null
}
