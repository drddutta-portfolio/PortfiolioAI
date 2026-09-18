import { describe, expect, it } from "vitest"
import { PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE } from "./pharmaDomesticValuationSelfHistoryCurveProposal"

describe("Domestic Formulations valuation self-history curve proposal", () => {
  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.activationApproved).toBe(false)
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.scoreExecutionEnabled).toBe(false)
  })

  it("is scoped only to Domestic Formulations", () => {
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.supportedPrimarySubprofile).toBe(
      "DOMESTIC_FORMULATIONS",
    )
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.unsupportedPrimarySubprofilesFailClosed).toBe(true)
  })

  it("uses self-history rather than an absolute P/E band", () => {
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.metricCode).toBe(
      "PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT",
    )
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.absolutePeBandUsed).toBe(false)
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.history.preferredSelfHistoryYears).toBe(5)
  })

  it("requires current price and reviewed earnings authority", () => {
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.history.currentAuthoritativeMarketPriceRequired).toBe(true)
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.history.currentReviewedEarningsRequired).toBe(true)
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.history.stalePriceAllowed).toBe(false)
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.history.providerLabelMayOverridePriceAuthority).toBe(false)
  })

  it("defines a monotonic Domestic self-history score curve", () => {
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.bands).toEqual([
      { minimumInclusive: 25, score: 100 },
      { minimumInclusive: 10, maximumExclusive: 25, score: 80 },
      { minimumInclusive: -5, maximumExclusive: 10, score: 60 },
      { minimumInclusive: -20, maximumExclusive: -5, score: 40 },
      { maximumExclusive: -20, score: 20 },
    ])
  })

  it("does not inherit BANK_NBFC dimension weighting or bank valuation logic", () => {
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.bankNbfcDimensionWeightsInherited).toBe(false)
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.bankPbOrRoeLogicInherited).toBe(false)
  })

  it("does not claim the whole Valuation dimension is ready", () => {
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.peerRelativeComponentState).toBe("UNAPPROVED")
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.fcfCorroborationComponentState).toBe("UNAPPROVED")
    expect(PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.wholeValuationDimensionReady).toBe(false)
  })
})
