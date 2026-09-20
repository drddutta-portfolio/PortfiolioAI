import { describe, expect, it } from "vitest"
import {
  TORNTPHARM_GATE_H2_DOMESTIC_GROWTH_READ_ONLY_RESULT,
  TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK,
  TORNTPHARM_GATE_H2_OPERATING_MARGIN_RAW_SERIES,
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

  it("assembles eight semantically reviewed operating-margin raw quarters", () => {
    expect(TORNTPHARM_GATE_H2_OPERATING_MARGIN_RAW_SERIES).toHaveLength(8)
    expect(
      TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK.qualityOperatingMargin
        .minimumComparableQuartersPresent,
    ).toBe(true)
    expect(
      TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK.qualityOperatingMargin
        .derivedStatisticLockPending,
    ).toBe(true)
    expect(
      TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK.qualityOperatingMargin.score,
    ).toBeNull()
  })

  it("keeps evidence review read-only", () => {
    expect(TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK.scoreExecutionEnabled).toBe(false)
    expect(TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK.persistedScoreRunEnabled).toBe(false)
  })
})
