import { describe, expect, it } from "vitest"
import { PHARMA_VALUATION_CURVE_PROPOSAL } from "./pharmaValuationCurveProposal"

describe("PHARMA Valuation curve proposal", () => {
  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.numericCurveReady).toBe(false)
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.activationApproved).toBe(false)
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.scoreExecutionEnabled).toBe(false)
  })

  it("already aligns with the canonical Valuation dimension", () => {
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.canonicalDimension).toBe("VALUATION")
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.currentParentContractDimension).toBe("VALUATION")
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.dimensionAlignmentState).toBe("ALIGNED")
  })

  it("requires current authoritative price and reviewed earnings/cash inputs", () => {
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.history.currentAuthoritativeMarketPriceRequired).toBe(true)
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.history.currentReviewedEarningsAndCashInputsRequired).toBe(true)
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.history.stalePriceAllowed).toBe(false)
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.history.providerValuationLabelMayOverrideMarketPrice).toBe(false)
  })

  it("uses self-history, peers and cash-flow corroboration without inventing weights", () => {
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.methodologyShape.components).toEqual([
      "SELF_HISTORY_RELATIVE_VALUATION",
      "PEER_RELATIVE_VALUATION",
      "CASH_FLOW_CORROBORATION",
    ])
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.methodologyShape.supportedEvidenceFamilies).toEqual([
      "PE",
      "EV_EBITDA",
      "FCF_YIELD",
    ])
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.methodologyShape.componentWeightsState).toBe("UNAPPROVED")
  })

  it("does not create universal absolute valuation bands", () => {
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.universalAbsoluteMultipleBandsAllowed).toBe(false)
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.peerCohortMustRespectBusinessModel).toBe(true)
    expect(Object.values(PHARMA_VALUATION_CURVE_PROPOSAL.subprofileThresholds).every((value) => value === null)).toBe(true)
  })

  it("keeps bank-style price-to-book outside the Pharma valuation contract", () => {
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.priceToBookIncluded).toBe(false)
  })

  it("requires explicit treatment of distorted denominators and one-off earnings", () => {
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.negativeOrNonMeaningfulDenominatorsRequireExplicitTreatment).toBe(true)
    expect(PHARMA_VALUATION_CURVE_PROPOSAL.acquisitionAndOneOffEarningsNormalizationRequired).toBe(true)
  })
})
