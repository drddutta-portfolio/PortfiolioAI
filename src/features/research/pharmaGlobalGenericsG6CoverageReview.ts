export const PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW_VERSION =
  "PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW_V1_PROPOSAL" as const

export type PharmaGlobalGenericsG6CoverageOutcome =
  | "VALIDATED_NOT_ACTIVE"
  | "VALIDATED_FAIL_CLOSED"

export interface PharmaGlobalGenericsG6CoverageFamily {
  readonly family:
    | "SEGMENT_GROWTH"
    | "OPERATING_MARGIN"
    | "ROCE_CAPITAL_EFFICIENCY"
    | "CASH_CONVERSION"
    | "BALANCE_SHEET_LEVERAGE"
    | "VALUATION"
    | "OWNERSHIP_GOVERNANCE"
    | "REGULATORY_MARKET_RISK"
    | "MOMENTUM"
    | "US_GENERIC_PRICE_EROSION"
  readonly outcome: PharmaGlobalGenericsG6CoverageOutcome
  readonly numericCurveReady: boolean
  readonly note: string
}

export const PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW = {
  contractVersion: PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW_VERSION,
  state: "PROPOSAL_ONLY",
  supportedPrimarySubprofile: "GLOBAL_GENERICS",
  canonicalFamilyCount: 10,
  families: [
    {
      family: "SEGMENT_GROWTH",
      outcome: "VALIDATED_NOT_ACTIVE",
      numericCurveReady: true,
      note: "Validated Segment Growth proposal applies to Export / US Revenue Growth; activation remains disabled.",
    },
    {
      family: "OPERATING_MARGIN",
      outcome: "VALIDATED_FAIL_CLOSED",
      numericCurveReady: false,
      note: "Parent methodology shape validated; Global Generics calibration evidence is insufficient and Domestic calibration is prohibited.",
    },
    {
      family: "ROCE_CAPITAL_EFFICIENCY",
      outcome: "VALIDATED_FAIL_CLOSED",
      numericCurveReady: false,
      note: "Methodology boundary validated; calibration deferred and parent QUALITY to CAPITAL_EFFICIENCY reconciliation remains required.",
    },
    {
      family: "CASH_CONVERSION",
      outcome: "VALIDATED_FAIL_CLOSED",
      numericCurveReady: false,
      note: "Methodology boundary validated; calibration deferred and parent EARNINGS_CASH_QUALITY to CASH_FLOW reconciliation remains required.",
    },
    {
      family: "BALANCE_SHEET_LEVERAGE",
      outcome: "VALIDATED_FAIL_CLOSED",
      numericCurveReady: false,
      note: "Methodology boundary validated; calibration deferred and parent FINANCIAL_STRENGTH to BALANCE_SHEET_CREDIT reconciliation remains required.",
    },
    {
      family: "VALUATION",
      outcome: "VALIDATED_FAIL_CLOSED",
      numericCurveReady: false,
      note: "Parent methodology is aligned; Global-specific calibration is deferred and Domestic valuation choices do not transfer.",
    },
    {
      family: "OWNERSHIP_GOVERNANCE",
      outcome: "VALIDATED_FAIL_CLOSED",
      numericCurveReady: false,
      note: "Calibration deferred; parent GOVERNANCE to OWNERSHIP_GOVERNANCE reconciliation remains required and G4 anti-double-counting stays locked.",
    },
    {
      family: "REGULATORY_MARKET_RISK",
      outcome: "VALIDATED_FAIL_CLOSED",
      numericCurveReady: false,
      note: "G6.24-G6.29 validate evidence treatment while drawdown/volatility normalization and whole Risk scoring remain deferred.",
    },
    {
      family: "MOMENTUM",
      outcome: "VALIDATED_FAIL_CLOSED",
      numericCurveReady: false,
      note: "Evidence identity validated; dedicated Pharma parent Momentum contract, benchmark, bands and aggregation remain unestablished.",
    },
    {
      family: "US_GENERIC_PRICE_EROSION",
      outcome: "VALIDATED_NOT_ACTIVE",
      numericCurveReady: true,
      note: "Global Generics-specific price-erosion curve is validated and not active.",
    },
  ] as const satisfies readonly PharmaGlobalGenericsG6CoverageFamily[],
  explicitOutcomeCount: 10,
  allCanonicalFamiliesHaveExplicitOutcome: true,
  registryRepresentationCurrent: false,
  staleRegistryFamilies: [
    "ROCE_CAPITAL_EFFICIENCY",
    "CASH_CONVERSION",
    "BALANCE_SHEET_LEVERAGE",
    "VALUATION",
    "OWNERSHIP_GOVERNANCE",
    "REGULATORY_MARKET_RISK",
    "MOMENTUM",
  ] as const,
  registryReconciliationRequiredBeforeG7: true,
  g6MethodologyCoverageComplete: true,
  g7ReadOnlyAdapterEligible: false,
  scoreExecutionEnabled: false,
  activationApproved: false,
} as const

export function globalGenericsG6CoverageSummary() {
  return {
    canonicalFamilyCount: PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.canonicalFamilyCount,
    explicitOutcomeCount: PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.explicitOutcomeCount,
    staleRegistryFamilyCount: PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.staleRegistryFamilies.length,
    g6MethodologyCoverageComplete:
      PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.g6MethodologyCoverageComplete,
    g7ReadOnlyAdapterEligible:
      PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.g7ReadOnlyAdapterEligible,
  }
}
