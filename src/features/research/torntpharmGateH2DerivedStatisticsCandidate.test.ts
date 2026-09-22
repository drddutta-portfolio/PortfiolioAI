import { describe, expect, it } from "vitest"
import { TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE } from "./torntpharmGateH2DerivedStatisticsCandidate"

describe("TORNTPHARM H2 derived-statistics candidate", () => {
  it("derives ROCE level, Type-7 IQR and trend deterministically", () => {
    const row = TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE.capitalEfficiency
    expect(row.rawRocePercent).toEqual([28, 31, 26])
    expect(row.medianRocePercent).toBe(28)
    expect(row.latestMinusPriorMedianPercentagePoints).toBe(-3.5)
    expect(row.interquartileRangeLatestHistoryPercentagePoints).toBe(2.5)
    expect(row.iqrState).toBe("TYPE_7_LINEAR_INTERPOLATION_OWNER_APPROVED")
    expect(row.scoreReady).toBe(true)
  })

  it("derives all Balance Sheet statistics deterministically from locked history", () => {
    const row = TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE.balanceSheetCredit
    expect(row.rawNetDebtEbitda).toEqual([0.9, 0.6, 2.3])
    expect(row.rawInterestCoverage).toEqual([8.4, 12.43, 9.26])
    expect(row.medianNetDebtEbitda).toBe(0.9)
    expect(row.medianInterestCoverage).toBe(9.26)
    expect(row.latestMinusPriorMedianNetDebtEbitda).toBeCloseTo(1.55, 12)
    expect(row.scoreReadyForApprovedEvaluator).toBe(true)
  })

  it("derives Quality level, Type-7 IQR and trend from the locked eight-quarter history", () => {
    const row =
      TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE.qualityOperatingMargin
    expect(row.rawOperatingMarginPercent).toHaveLength(8)
    expect(row.percentileConvention).toBe("LINEAR_INTERPOLATION_TYPE_7")
    expect(row.medianLatest8OperatingMarginPercent).toBeCloseTo(
      32.64442710817307,
      12,
    )
    expect(row.interquartileRangeLatest8PercentagePoints).toBeCloseTo(
      0.30431458013040924,
      12,
    )
    expect(row.medianLatest4MinusPrior4PercentagePoints).toBeCloseTo(
      0.34859494903484745,
      12,
    )
    expect(row.scoreReadyForApprovedEvaluator).toBe(true)
  })

  it("keeps derivation read-only and non-persisting", () => {
    expect(TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE.scoreExecutionEnabled).toBe(false)
    expect(TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE.persistedScoreRunEnabled).toBe(false)
  })
})
