import { describe, expect, it } from "vitest"
import { evaluatePharmaSegmentGrowthCurveProposal, PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL } from "./pharmaSegmentGrowthCurveProposal"

describe("PHARMA segment-growth curve proposal", () => {
  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.activationApproved).toBe(false)
    expect(PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.scoreExecutionEnabled).toBe(false)
  })

  it("requires comparable history rather than a single quarter", () => {
    expect(PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.history.minimumComparableQuarters).toBe(4)
    expect(PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.history.preferredComparableQuarters).toBe(8)
    expect(PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.history.latestPeriodRequired).toBe(true)
    expect(PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.history.rejectedOrScopeIncompatibleClaimsExcluded).toBe(true)
  })

  it("weights level, consistency and trend to exactly 100", () => {
    const { level, consistency, trend } = PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.components
    expect(level.weight + consistency.weight + trend.weight).toBe(100)
    expect(level.weight).toBe(60)
    expect(consistency.weight).toBe(25)
    expect(trend.weight).toBe(15)
  })

  it("uses the same curve family for domestic and export/US segment growth", () => {
    expect(PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.appliesTo).toEqual([
      "PHARMA_DOMESTIC_REVENUE_GROWTH",
      "PHARMA_EXPORT_US_REVENUE_GROWTH",
    ])
  })

  it("does not reward negative median growth", () => {
    const negativeBand = PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.components.level.bands.find((band) => band.maximumExclusive === 0)
    expect(negativeBand?.score).toBe(20)
  })

  it("treats four positive quarters as fully consistent", () => {
    expect(PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.components.consistency.scores["4"]).toBe(100)
    expect(PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.components.consistency.scores["0"]).toBe(0)
  })
  it("evaluates the frozen proposal bands deterministically without activating scoring", () => {
    expect(evaluatePharmaSegmentGrowthCurveProposal({
      medianLatest4ComparableQuartersPercent: 12,
      positiveQuartersOutOfLatest4: 3,
      latestMinusMedianPrior3PercentagePoints: 2,
    })).toEqual({
      proposalVersion: "PHARMA_SEGMENT_GROWTH_CURVE_V1_PROPOSAL",
      state: "DETERMINISTIC_PROPOSAL_RESULT",
      levelScore: 70,
      consistencyScore: 75,
      trendScore: 75,
      combinedScore: 72,
      activationApproved: false,
      scoreExecutionEnabled: false,
    })
  })

  it("keeps non-finite derived statistics fail-closed", () => {
    expect(() => evaluatePharmaSegmentGrowthCurveProposal({
      medianLatest4ComparableQuartersPercent: Number.NaN,
      positiveQuartersOutOfLatest4: 3,
      latestMinusMedianPrior3PercentagePoints: 2,
    })).toThrow("must be finite")
  })

})
