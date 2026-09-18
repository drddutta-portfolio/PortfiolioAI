import { describe, expect, it } from "vitest"
import { PHARMA_DOMESTIC_FCF_YIELD_CURVE } from "./pharmaDomesticFcfYieldCurveProposal"

describe("Domestic Formulations FCF-yield curve proposal", () => {
  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.activationApproved).toBe(false)
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.scoreExecutionEnabled).toBe(false)
  })

  it("is scoped only to Domestic Formulations Valuation cash-flow corroboration", () => {
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.supportedPrimarySubprofile).toBe("DOMESTIC_FORMULATIONS")
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.canonicalDimension).toBe("VALUATION")
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.component).toBe("CASH_FLOW_CORROBORATION")
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.metricCode).toBe("FCF_YIELD_PERCENT")
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.unsupportedPrimarySubprofilesFailClosed).toBe(true)
  })

  it("defines a monotonic five-band FCF-yield corroboration curve", () => {
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.bands.map(({ minimumInclusive, maximumExclusive, score }) => ({
      minimumInclusive,
      maximumExclusive,
      score,
    }))).toEqual([
      { minimumInclusive: 5, maximumExclusive: undefined, score: 100 },
      { minimumInclusive: 3, maximumExclusive: 5, score: 80 },
      { minimumInclusive: 1.5, maximumExclusive: 3, score: 60 },
      { minimumInclusive: 0, maximumExclusive: 1.5, score: 40 },
      { minimumInclusive: undefined, maximumExclusive: 0, score: 20 },
    ])
  })

  it("preserves negative FCF as adverse rather than neutral", () => {
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.negativeFcfScore).toBe(20)
  })

  it("records the implied FCF-multiple interpretation of the level bands", () => {
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.impliedFcfMultipleContext).toEqual({
      fivePercentYieldApproxMultiple: 20,
      threePercentYieldApproxMultiple: 33.3,
      onePointFivePercentYieldApproxMultiple: 66.7,
    })
  })

  it("does not turn the corroboration subcurve into a standalone valuation verdict", () => {
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.standaloneValuationVerdictAllowed).toBe(false)
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.absolutePeBandsUsed).toBe(false)
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.peerRelativeComponentState).toBe("UNAPPROVED")
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.componentWeightState).toBe("UNAPPROVED")
    expect(PHARMA_DOMESTIC_FCF_YIELD_CURVE.wholeValuationDimensionReady).toBe(false)
  })
})
