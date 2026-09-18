import { describe, expect, it } from "vitest"
import { PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL } from "./pharmaOperatingMarginCurveProposal"

describe("PHARMA operating margin curve proposal", () => {
  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.activationApproved).toBe(false)
    expect(PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.scoreExecutionEnabled).toBe(false)
  })

  it("supports only Domestic Formulations in V1 and fails closed otherwise", () => {
    expect(PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.supportedPrimarySubprofile).toBe("DOMESTIC_FORMULATIONS")
    expect(PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.unsupportedPrimarySubprofilesFailClosed).toBe(true)
  })

  it("requires eight matched comparable quarters", () => {
    expect(PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.history.minimumComparableQuarters).toBe(8)
    expect(PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.history.preferredComparableQuarters).toBe(12)
    expect(PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.history.latestPeriodRequired).toBe(true)
    expect(PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.history.matchedRevenueAndOperatingProfitPeriodsRequired).toBe(true)
  })

  it("weights level, stability and trend to 100", () => {
    const { level, stability, trend } = PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.components
    expect(level.weight + stability.weight + trend.weight).toBe(100)
    expect(level.weight).toBe(50)
    expect(stability.weight).toBe(30)
    expect(trend.weight).toBe(20)
  })

  it("rewards lower dispersion in the stability component", () => {
    const { bands } = PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.components.stability
    expect(bands[0]?.maximumExclusive).toBe(2)
    expect(bands[0]?.score).toBe(100)
    expect(bands.at(-1)?.minimumInclusive).toBe(9)
    expect(bands.at(-1)?.score).toBe(20)
  })

  it("treats a materially declining margin trend conservatively", () => {
    const negative = PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.components.trend.bands.find((band) => band.maximumExclusive === -3)
    expect(negative?.score).toBe(20)
  })
})
