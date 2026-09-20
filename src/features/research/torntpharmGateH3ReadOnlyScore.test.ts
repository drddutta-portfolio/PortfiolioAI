import { describe, expect, it } from "vitest"
import { PHARMA_V1_DIMENSION_WEIGHTS } from "./pharmaGateGScoringMethodProposal"
import { pharmaSectorWorkspaceCompanyContext } from "./pharmaSectorWorkspaceCompanyContext"
import {
  calculateTorntpharmGateH3ReadOnlyScore,
  TORNTPHARM_GATE_H3_GLOBAL_GENERICS_OVERLAY_DIMENSIONS,
  TORNTPHARM_GATE_H3_LOCKED_DIMENSION_SCORES,
  TORNTPHARM_GATE_H3_READ_ONLY_RESULT,
  TORNTPHARM_GATE_H3_SCORE_INPUT_PACKAGE,
} from "./torntpharmGateH3ReadOnlyScore"

describe("Gate H H3 TORNTPHARM deterministic read-only score", () => {
  it("uses the exact fixed PHARMA_V1 weights with no denominator renormalization", () => {
    expect(PHARMA_V1_DIMENSION_WEIGHTS).toEqual([
      { dimensionCode: "QUALITY", weight: 13 },
      { dimensionCode: "GROWTH", weight: 15 },
      { dimensionCode: "CAPITAL_EFFICIENCY", weight: 10 },
      { dimensionCode: "CASH_FLOW", weight: 10 },
      { dimensionCode: "BALANCE_SHEET_CREDIT", weight: 10 },
      { dimensionCode: "BUSINESS_DURABILITY", weight: 10 },
      { dimensionCode: "VALUATION", weight: 12 },
      { dimensionCode: "MOMENTUM", weight: 8 },
      { dimensionCode: "OWNERSHIP_GOVERNANCE", weight: 6 },
      { dimensionCode: "RISK", weight: 6 },
    ])
    expect(
      PHARMA_V1_DIMENSION_WEIGHTS.reduce(
        (sum, dimension) => sum + dimension.weight,
        0,
      ),
    ).toBe(100)
  })

  it("consumes exactly the ten H2-locked dimension scores", () => {
    expect(TORNTPHARM_GATE_H3_LOCKED_DIMENSION_SCORES).toEqual({
      QUALITY: 92,
      GROWTH: 78.25,
      CAPITAL_EFFICIENCY: 79,
      CASH_FLOW: 93.6,
      BALANCE_SHEET_CREDIT: 65,
      BUSINESS_DURABILITY: 75,
      VALUATION: 30,
      MOMENTUM: 95,
      OWNERSHIP_GOVERNANCE: 70,
      RISK: 80,
    })
    expect(TORNTPHARM_GATE_H3_SCORE_INPUT_PACKAGE.dimensions).toHaveLength(10)
    expect(
      TORNTPHARM_GATE_H3_SCORE_INPUT_PACKAGE.dimensions.every(
        (dimension) => dimension.readinessCoverage === 1,
      ),
    ).toBe(true)
  })

  it("calculates the first deterministic fixed-weight overall score and exact contributions", () => {
    const result = TORNTPHARM_GATE_H3_READ_ONLY_RESULT
    expect(result.state).toBe("READY_READ_ONLY_PREVIEW")
    expect(result.overallScore).toBe(75.1575)
    expect(
      Object.fromEntries(
        result.dimensions.map((dimension) => [
          dimension.dimensionCode,
          dimension.weightedContribution,
        ]),
      ),
    ).toEqual({
      QUALITY: 11.96,
      GROWTH: 11.7375,
      CAPITAL_EFFICIENCY: 7.9,
      CASH_FLOW: 9.36,
      BALANCE_SHEET_CREDIT: 6.5,
      BUSINESS_DURABILITY: 7.5,
      VALUATION: 3.6,
      MOMENTUM: 7.6,
      OWNERSHIP_GOVERNANCE: 4.2,
      RISK: 4.8,
    })
  })

  it("fails closed when even one weighted dimension is absent instead of reweighting the other nine", () => {
    const result = calculateTorntpharmGateH3ReadOnlyScore({
      ...TORNTPHARM_GATE_H3_SCORE_INPUT_PACKAGE,
      dimensions:
        TORNTPHARM_GATE_H3_SCORE_INPUT_PACKAGE.dimensions.slice(0, 9),
    })
    expect(result.state).toBe("FAIL_CLOSED")
    expect(result.overallScore).toBeNull()
    expect(result.reasonCodes).toContain("WEIGHTED_DIMENSION_SET_INCOMPLETE")
  })

  it("preserves Global Generics as material business context but excludes a numeric modifier below the approved 15% threshold", () => {
    expect(TORNTPHARM_GATE_H3_GLOBAL_GENERICS_OVERLAY_DIMENSIONS).toEqual([
      "BUSINESS_DURABILITY",
      "GROWTH",
      "RISK",
    ])
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.globalGenericsOverlay
        .economicMaterialityPercent,
    ).toBe(12.05)
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.globalGenericsOverlay
        .minimumNumericMaterialityPercent,
    ).toBe(15)
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.globalGenericsOverlay
        .numericModifierApplied,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.globalGenericsOverlay
        .secondIndependentStockScore,
    ).toBeNull()

    for (const code of TORNTPHARM_GATE_H3_GLOBAL_GENERICS_OVERLAY_DIMENSIONS) {
      const dimension =
        TORNTPHARM_GATE_H3_READ_ONLY_RESULT.dimensions.find(
          (row) => row.dimensionCode === code,
        )
      expect(dimension?.overlayTreatment).toBe("BELOW_SCORING_MATERIALITY")
      expect(dimension?.overlayModifierPoints).toBeNull()
      expect(dimension?.finalScore).toBe(dimension?.primaryScore)
    }
  })

  it("uses resolved CLEAR governance behavior without a second numeric penalty or score cap", () => {
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.governance.constraintState,
    ).toBe("CLEAR")
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.governance.blocksOverallPreview,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.governance.numericPenalty,
    ).toBeNull()
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.governance.overallScoreCap,
    ).toBeNull()
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.governance.historicalEventRetained,
    ).toBe(true)
  })

  it("keeps CDMO / CRAMS Emerging Watch out of numeric scoring", () => {
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.emergingWatch.numericParticipation,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.emergingWatch.independentScore,
    ).toBeNull()
  })

  it("contains no BANK_NBFC or NIFTY Bank leakage and keeps NIFTY Pharma as the benchmark", () => {
    const serialized = JSON.stringify(TORNTPHARM_GATE_H3_READ_ONLY_RESULT)
    expect(serialized).not.toContain("BANK_NBFC")
    expect(serialized).not.toContain("NIFTY_BANK")
    expect(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.benchmarkCode).toBe(
      "NIFTY_PHARMA",
    )
  })

  it("is exposed through the shared company-context registry only for TORNTPHARM", () => {
    expect(
      pharmaSectorWorkspaceCompanyContext("TORNTPHARM").readOnlyCompanyScore
        ?.overallScore,
    ).toBe(75.1575)
    expect(
      pharmaSectorWorkspaceCompanyContext("AUROPHARMA").readOnlyCompanyScore,
    ).toBeNull()
    expect(
      pharmaSectorWorkspaceCompanyContext("UNKNOWN").readOnlyCompanyScore,
    ).toBeNull()
  })

  it("is read-only, non-persisting, non-recommending and non-sizing", () => {
    expect(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.readOnly).toBe(true)
    expect(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.nonPersisting).toBe(true)
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.scoreExecutionEnabled,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.persistedScoreRunEnabled,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.recommendationEnabled,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.positionSizingEnabled,
    ).toBe(false)
  })

  it("is deterministic across repeated calculations from the same locked input package", () => {
    const first = calculateTorntpharmGateH3ReadOnlyScore()
    const second = calculateTorntpharmGateH3ReadOnlyScore()
    expect(second).toEqual(first)
  })
})
