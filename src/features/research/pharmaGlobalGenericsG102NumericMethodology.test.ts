import { describe, expect, it } from "vitest"
import {
  evaluatePeerRelativeLevelStabilityTrend,
  median,
  PHARMA_GLOBAL_GENERICS_G10_2_NUMERIC_METHODOLOGY,
  scoreReviewedComponentMedian,
  scoreReviewedPeerPercentile,
} from "./pharmaGlobalGenericsG102NumericMethodology"

describe("G10.2 owner-approved Global Generics numeric methodology", () => {
  it("locks the approved safety and isolation policy", () => {
    expect(PHARMA_GLOBAL_GENERICS_G10_2_NUMERIC_METHODOLOGY).toEqual(expect.objectContaining({
      state: "OWNER_APPROVED_NOT_ACTIVE",
      supportedPrimarySubprofile: "GLOBAL_GENERICS",
      normalizationPolicy: "REVIEWED_REFERENCE_RELATIVE_MEDIAN_V1",
      minimumPeerCount: 3,
      domesticBandsInherited: false,
      apiBandsInherited: false,
      bankNbfcBandsInherited: false,
      emergingApiNumericParticipation: false,
      unresolvedBiosimilarsNumericParticipation: false,
      methodologyApproved: true,
      scoreExecutionEnabled: false,
    }))
  })

  it("uses deterministic peer percentiles and median aggregation", () => {
    expect(scoreReviewedPeerPercentile({
      value: 20,
      peerValues: [10, 15, 25],
      direction: "HIGHER_BETTER",
    })).toBe(75)
    expect(scoreReviewedPeerPercentile({
      value: 5,
      peerValues: [3, 6, 8],
      direction: "LOWER_BETTER",
    })).toBe(75)
    expect(median([25, 75, 50])).toBe(50)
    expect(scoreReviewedComponentMedian([75, 25, 50])).toBe(50)
  })

  it("fails closed without the minimum reviewed peer cohort", () => {
    expect(() => scoreReviewedPeerPercentile({
      value: 20,
      peerValues: [10, 15],
      direction: "HIGHER_BETTER",
    })).toThrow(/at least three reviewed same-primary peers/)
  })

  it("evaluates level, stability and trend without hidden weights", () => {
    expect(evaluatePeerRelativeLevelStabilityTrend({
      level: 20,
      levelPeers: [10, 15, 25],
      stability: 2,
      stabilityPeers: [1, 3, 4],
      trend: 4,
      trendPeers: [1, 2, 5],
    })).toEqual({
      levelScore: 75,
      stabilityScore: 75,
      trendScore: 75,
      score: 75,
    })
  })
})
