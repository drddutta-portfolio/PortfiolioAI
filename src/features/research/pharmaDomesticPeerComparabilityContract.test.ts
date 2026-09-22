import { describe, expect, it } from "vitest"
import {
  median,
  PHARMA_DOMESTIC_PEER_COMPARABILITY,
} from "./pharmaDomesticPeerComparabilityContract"

describe("Domestic Formulations peer comparability contract", () => {
  it("uses an explicit minimum and preferred peer count", () => {
    expect(PHARMA_DOMESTIC_PEER_COMPARABILITY.minimumEligiblePeerCount).toBe(3)
    expect(PHARMA_DOMESTIC_PEER_COMPARABILITY.preferredEligiblePeerCount).toBe(5)
  })

  it("uses a robust median aggregation without hidden winsorization", () => {
    expect(PHARMA_DOMESTIC_PEER_COMPARABILITY.aggregationStatistic).toBe("MEDIAN")
    expect(PHARMA_DOMESTIC_PEER_COMPARABILITY.outlierTreatment).toBe(
      "NO_WINSORIZATION_V1_MEDIAN_ONLY",
    )
    expect(median([10, 20, 100])).toBe(20)
    expect(median([10, 20, 30, 40])).toBe(25)
    expect(median([])).toBeNull()
  })

  it("requires like-for-like fresh reviewed evidence", () => {
    const evidence = PHARMA_DOMESTIC_PEER_COMPARABILITY.peerEvidence
    expect(evidence.candidateMetrics).toEqual(["PE_TTM", "EV_EBITDA"])
    expect(evidence.sameMetricCodeRequiredWithinAggregation).toBe(true)
    expect(evidence.samePeriodBasisRequired).toBe(true)
    expect(evidence.sameConsolidationScopeRequired).toBe(true)
    expect(evidence.freshEvidenceRequired).toBe(true)
    expect(evidence.selectedOrReviewedEvidenceRequired).toBe(true)
  })

  it("fails closed for distorted denominators and acquisition/one-off comparability", () => {
    const evidence = PHARMA_DOMESTIC_PEER_COMPARABILITY.peerEvidence
    expect(evidence.negativeOrNonMeaningfulDenominatorExcluded).toBe(true)
    expect(evidence.acquisitionOrOneOffDistortionRequiresReview).toBe(true)
  })

  it("keeps full peer component blocked unless both candidate metric families satisfy comparability", () => {
    const readiness = PHARMA_DOMESTIC_PEER_COMPARABILITY.readiness
    expect(readiness.fewerThanMinimumPeers).toBe("INSUFFICIENT_EVIDENCE")
    expect(readiness.oneMetricFamilyMeetingMinimumIsSufficientForPeerComponent).toBe(false)
    expect(readiness.bothMetricFamiliesRequiredForFullPeerComponent).toBe(true)
  })

  it("does not approve numeric premium/discount bands or peer metric weights", () => {
    expect(PHARMA_DOMESTIC_PEER_COMPARABILITY.numericPremiumDiscountBandsApproved).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_COMPARABILITY.metricWeightingApproved).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_COMPARABILITY.peerRelativeScoreReady).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_COMPARABILITY.wholeValuationDimensionReady).toBe(false)
  })
})
