import { describe, expect, it } from "vitest"
import { PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT } from "./pharmaDomesticPeerValuationContract"

describe("Domestic Formulations peer-relative valuation contract", () => {
  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT.activationApproved).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT.scoreExecutionEnabled).toBe(false)
  })

  it("requires reviewed same-Primary business-model peers", () => {
    const cohort = PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT.cohort
    expect(cohort.reviewedPrimarySubprofileMatchRequired).toBe(true)
    expect(cohort.samePrimarySubprofileRequired).toBe(true)
    expect(cohort.sectorOrIndustryMatchAloneSufficient).toBe(false)
    expect(cohort.materialOverlayMatchAloneSufficient).toBe(false)
    expect(cohort.emergingWatchEligibleAsPeerBasis).toBe(false)
  })

  it("requires effective-dated active canonical assignments instead of provider peer labels", () => {
    const cohort = PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT.cohort
    expect(cohort.effectiveDatedAssignmentRequired).toBe(true)
    expect(cohort.activeSecurityRequired).toBe(true)
    expect(cohort.providerPeerLabelMayDefineCohort).toBe(false)
  })

  it("requires like-for-like valuation evidence", () => {
    const comparability = PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT.comparability
    expect(comparability.sameMetricSemanticsRequired).toBe(true)
    expect(comparability.samePeriodBasisRequired).toBe(true)
    expect(comparability.currentAuthoritativeMarketPriceRequired).toBe(true)
    expect(comparability.staleValuationEvidenceAllowed).toBe(false)
    expect(comparability.negativeOrNonMeaningfulDenominatorsRequireExclusionOrExplicitTreatment).toBe(true)
    expect(comparability.acquisitionAndOneOffNormalizationRequired).toBe(true)
  })

  it("does not invent peer count, aggregation, bands or component weights", () => {
    const methodology = PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT.methodology
    expect(methodology.candidateEvidenceFamilies).toEqual(["PE_TTM", "EV_EBITDA"])
    expect(methodology.approvedPeerMetricSetState).toBe("UNAPPROVED")
    expect(methodology.minimumPeerCountState).toBe("UNAPPROVED")
    expect(methodology.aggregationStatisticState).toBe("UNAPPROVED")
    expect(methodology.relativeBandsState).toBe("UNAPPROVED")
    expect(methodology.componentWeightState).toBe("UNAPPROVED")
  })

  it("keeps the peer curve and whole Valuation dimension fail-closed", () => {
    expect(PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT.cohortBuilderImplemented).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT.numericPeerCurveReady).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT.wholeValuationDimensionReady).toBe(false)
  })
})
