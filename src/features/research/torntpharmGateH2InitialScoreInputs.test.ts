import { describe, expect, it } from "vitest"
import {
  TORNTPHARM_GATE_H2_BALANCE_SHEET_READ_ONLY_RESULT,
  TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS,
} from "./torntpharmGateH2InitialScoreInputs"

describe("TORNTPHARM H2 initial score inputs", () => {
  it("produces the deterministic Balance Sheet / Credit read-only candidate", () => {
    expect(TORNTPHARM_GATE_H2_BALANCE_SHEET_READ_ONLY_RESULT).toEqual({
      leverageScore: 80,
      interestCoverageScore: 70,
      trendResilienceScore: 20,
      combinedScore: 65,
    })
    expect(
      TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS.balanceSheetCredit.score,
    ).toBe(65)
  })

  it("keeps Capital Efficiency blocked until the IQR convention is explicitly locked", () => {
    expect(
      TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS.capitalEfficiency.state,
    ).toBe("BLOCKED_IQR_CONVENTION_DECISION")
    expect(
      TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS.capitalEfficiency.score,
    ).toBeNull()
  })

  it("keeps all score execution and persistence off", () => {
    expect(TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS.scoreExecutionEnabled).toBe(false)
    expect(TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS.persistedScoreRunEnabled).toBe(false)
  })
})
