import { describe, expect, it } from "vitest"
import {
  TORNTPHARM_GATE_H2_DOMESTIC_GROWTH_READ_ONLY_RESULT,
  TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK,
  TORNTPHARM_GATE_H2_OPERATING_MARGIN_PERCENT_SERIES,
  TORNTPHARM_GATE_H2_OPERATING_MARGIN_RAW_SERIES,
  TORNTPHARM_GATE_H2_OPERATING_MARGIN_STATISTICS,
  TORNTPHARM_GATE_H2_QUALITY_READ_ONLY_RESULT,
} from "./torntpharmGateH2OfficialEvidencePack"

describe("TORNTPHARM H2 official evidence pack", () => {
  it("locks the four-quarter comparable Domestic growth series", () => {
    expect(TORNTPHARM_GATE_H2_DOMESTIC_GROWTH_READ_ONLY_RESULT).toEqual({
      proposalVersion: "PHARMA_SEGMENT_GROWTH_CURVE_V1_OWNER_APPROVED",
      state: "DETERMINISTIC_OWNER_APPROVED_RESULT",
      levelScore: 70,
      consistencyScore: 100,
      trendScore: 75,
      combinedScore: 78.25,
      methodologyApproved: true,
      activationApproved: false,
      scoreExecutionEnabled: false,
    })
    expect(TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK.domesticGrowth.score).toBe(
      78.25,
    )
  })

  it("locks eight semantically reviewed operating-margin quarters and Type-7 statistics", () => {
    expect(TORNTPHARM_GATE_H2_OPERATING_MARGIN_RAW_SERIES).toHaveLength(8)
    expect(TORNTPHARM_GATE_H2_OPERATING_MARGIN_PERCENT_SERIES).toHaveLength(8)
    expect(
      TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK.qualityOperatingMargin
        .minimumComparableQuartersPresent,
    ).toBe(true)
    expect(
      TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK.qualityOperatingMargin
        .derivedStatisticLockPending,
    ).toBe(false)
    expect(TORNTPHARM_GATE_H2_OPERATING_MARGIN_STATISTICS.percentileConvention)
      .toBe("LINEAR_INTERPOLATION_TYPE_7")
    expect(
      TORNTPHARM_GATE_H2_OPERATING_MARGIN_STATISTICS
        .medianLatest8OperatingMarginPercent,
    ).toBeCloseTo(32.64442710817307, 12)
    expect(
      TORNTPHARM_GATE_H2_OPERATING_MARGIN_STATISTICS
        .interquartileRangeLatest8PercentagePoints,
    ).toBeCloseTo(0.30431458013040924, 12)
    expect(
      TORNTPHARM_GATE_H2_OPERATING_MARGIN_STATISTICS
        .medianLatest4MinusPrior4PercentagePoints,
    ).toBeCloseTo(0.34859494903484745, 12)
  })

  it("produces the deterministic read-only Quality candidate", () => {
    expect(TORNTPHARM_GATE_H2_QUALITY_READ_ONLY_RESULT).toEqual({
      proposalVersion: "PHARMA_OPERATING_MARGIN_CURVE_V1_OWNER_APPROVED",
      state: "DETERMINISTIC_OWNER_APPROVED_RESULT",
      levelScore: 100,
      stabilityScore: 100,
      trendScore: 60,
      combinedScore: 92,
      methodologyApproved: true,
      activationApproved: false,
      scoreExecutionEnabled: false,
    })
    expect(
      TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK.qualityOperatingMargin.score,
    ).toBe(92)
  })

  it("keeps evidence review read-only", () => {
    expect(TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK.scoreExecutionEnabled).toBe(false)
    expect(TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK.persistedScoreRunEnabled).toBe(false)
  })
})
