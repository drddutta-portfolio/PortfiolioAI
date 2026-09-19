export const PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE_VERSION =
  "PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE_V1_PROPOSAL" as const

export interface PharmaGlobalGenericsOperatingMarginMethodGateContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "QUALITY"
  readonly metricCode: "PHARMA_OPERATING_MARGIN_HISTORY"
  readonly history: {
    readonly minimumComparableQuarters: 8
    readonly preferredComparableQuarters: 12
    readonly latestPeriodRequired: true
    readonly matchedRevenueAndOperatingProfitPeriodsRequired: true
  }
  readonly reusableMethodologyShape: {
    readonly levelComponentRequired: true
    readonly stabilityComponentRequired: true
    readonly trendComponentRequired: true
    readonly levelStatisticCandidate: "MEDIAN_LATEST_8_OPERATING_MARGIN_PERCENT"
    readonly stabilityStatisticCandidate: "INTERQUARTILE_RANGE_LATEST_8_PERCENTAGE_POINTS"
    readonly trendStatisticCandidate: "MEDIAN_LATEST_4_MINUS_MEDIAN_PRIOR_4_PERCENTAGE_POINTS"
  }
  readonly globalGenericsSpecificDecisions: {
    readonly componentWeightsApproved: false
    readonly levelBandsApproved: false
    readonly stabilityBandsApproved: false
    readonly trendBandsApproved: false
    readonly finalAggregationApproved: false
    readonly domesticWeightsInherited: false
    readonly domesticBandsInherited: false
  }
  readonly missingEvidenceMayBecomeNeutral: false
  readonly numericOperatingMarginCurveReady: false
  readonly ownerApprovalRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE:
  PharmaGlobalGenericsOperatingMarginMethodGateContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "QUALITY",
    metricCode: "PHARMA_OPERATING_MARGIN_HISTORY",
    history: {
      minimumComparableQuarters: 8,
      preferredComparableQuarters: 12,
      latestPeriodRequired: true,
      matchedRevenueAndOperatingProfitPeriodsRequired: true,
    },
    reusableMethodologyShape: {
      levelComponentRequired: true,
      stabilityComponentRequired: true,
      trendComponentRequired: true,
      levelStatisticCandidate: "MEDIAN_LATEST_8_OPERATING_MARGIN_PERCENT",
      stabilityStatisticCandidate: "INTERQUARTILE_RANGE_LATEST_8_PERCENTAGE_POINTS",
      trendStatisticCandidate: "MEDIAN_LATEST_4_MINUS_MEDIAN_PRIOR_4_PERCENTAGE_POINTS",
    },
    globalGenericsSpecificDecisions: {
      componentWeightsApproved: false,
      levelBandsApproved: false,
      stabilityBandsApproved: false,
      trendBandsApproved: false,
      finalAggregationApproved: false,
      domesticWeightsInherited: false,
      domesticBandsInherited: false,
    },
    missingEvidenceMayBecomeNeutral: false,
    numericOperatingMarginCurveReady: false,
    ownerApprovalRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export type PharmaGlobalGenericsOperatingMarginEvidenceState =
  | "READY_FOR_METHOD_SELECTION"
  | "INSUFFICIENT_EVIDENCE"
  | "REVIEW_REQUIRED"

export interface PharmaGlobalGenericsOperatingMarginEvidenceInput {
  readonly comparableQuarterCount: number
  readonly latestPeriodPresent: boolean
  readonly matchedRevenueAndOperatingProfitPeriods: boolean
}

export function assessGlobalGenericsOperatingMarginEvidence(
  input: PharmaGlobalGenericsOperatingMarginEvidenceInput,
): PharmaGlobalGenericsOperatingMarginEvidenceState {
  if (!Number.isInteger(input.comparableQuarterCount) || input.comparableQuarterCount < 0) {
    return "REVIEW_REQUIRED"
  }

  if (
    input.comparableQuarterCount < 8
    || !input.latestPeriodPresent
    || !input.matchedRevenueAndOperatingProfitPeriods
  ) {
    return "INSUFFICIENT_EVIDENCE"
  }

  return "READY_FOR_METHOD_SELECTION"
}
