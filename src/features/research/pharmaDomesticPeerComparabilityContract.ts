export const PHARMA_DOMESTIC_PEER_COMPARABILITY_VERSION =
  "PHARMA_DOMESTIC_PEER_COMPARABILITY_V1_PROPOSAL" as const

export interface PharmaDomesticPeerComparabilityContract {
  readonly contractVersion: typeof PHARMA_DOMESTIC_PEER_COMPARABILITY_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly canonicalDimension: "VALUATION"
  readonly component: "PEER_RELATIVE_VALUATION"
  readonly minimumEligiblePeerCount: 3
  readonly preferredEligiblePeerCount: 5
  readonly aggregationStatistic: "MEDIAN"
  readonly outlierTreatment: "NO_WINSORIZATION_V1_MEDIAN_ONLY"
  readonly peerEvidence: {
    readonly candidateMetrics: readonly ["PE_TTM", "EV_EBITDA"]
    readonly sameMetricCodeRequiredWithinAggregation: true
    readonly samePeriodBasisRequired: true
    readonly sameConsolidationScopeRequired: true
    readonly freshEvidenceRequired: true
    readonly selectedOrReviewedEvidenceRequired: true
    readonly negativeOrNonMeaningfulDenominatorExcluded: true
    readonly acquisitionOrOneOffDistortionRequiresReview: true
  }
  readonly readiness: {
    readonly fewerThanMinimumPeers: "INSUFFICIENT_EVIDENCE"
    readonly oneMetricFamilyMeetingMinimumIsSufficientForPeerComponent: false
    readonly bothMetricFamiliesRequiredForFullPeerComponent: true
  }
  readonly numericPremiumDiscountBandsApproved: false
  readonly metricWeightingApproved: false
  readonly peerRelativeScoreReady: false
  readonly wholeValuationDimensionReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_DOMESTIC_PEER_COMPARABILITY: PharmaDomesticPeerComparabilityContract = {
  contractVersion: PHARMA_DOMESTIC_PEER_COMPARABILITY_VERSION,
  state: "PROPOSAL_ONLY",
  supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS",
  canonicalDimension: "VALUATION",
  component: "PEER_RELATIVE_VALUATION",
  minimumEligiblePeerCount: 3,
  preferredEligiblePeerCount: 5,
  aggregationStatistic: "MEDIAN",
  outlierTreatment: "NO_WINSORIZATION_V1_MEDIAN_ONLY",
  peerEvidence: {
    candidateMetrics: ["PE_TTM", "EV_EBITDA"],
    sameMetricCodeRequiredWithinAggregation: true,
    samePeriodBasisRequired: true,
    sameConsolidationScopeRequired: true,
    freshEvidenceRequired: true,
    selectedOrReviewedEvidenceRequired: true,
    negativeOrNonMeaningfulDenominatorExcluded: true,
    acquisitionOrOneOffDistortionRequiresReview: true,
  },
  readiness: {
    fewerThanMinimumPeers: "INSUFFICIENT_EVIDENCE",
    oneMetricFamilyMeetingMinimumIsSufficientForPeerComponent: false,
    bothMetricFamiliesRequiredForFullPeerComponent: true,
  },
  numericPremiumDiscountBandsApproved: false,
  metricWeightingApproved: false,
  peerRelativeScoreReady: false,
  wholeValuationDimensionReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}

export function median(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (!finite.length) return null
  const middle = Math.floor(finite.length / 2)
  return finite.length % 2 === 1
    ? finite[middle]
    : (finite[middle - 1] + finite[middle]) / 2
}
