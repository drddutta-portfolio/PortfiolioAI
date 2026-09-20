import { describe, expect, it } from "vitest"
import {
  TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_COMPONENTS,
  TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_READ_ONLY_RESULT,
  TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW,
  TORNTPHARM_GATE_H2_OWNERSHIP_HISTORY,
} from "./torntpharmGateH2OwnershipGovernanceReview"

describe("TORNTPHARM H2 Ownership / Governance review candidate", () => {
  it("locks at least four comparable official shareholding observations", () => {
    expect(TORNTPHARM_GATE_H2_OWNERSHIP_HISTORY).toHaveLength(4)
    expect(
      TORNTPHARM_GATE_H2_OWNERSHIP_HISTORY.map(
        (row) => row.promoterHoldingPercent,
      ),
    ).toEqual([68.31, 68.31, 68.31, 68.31])
    expect(
      TORNTPHARM_GATE_H2_OWNERSHIP_HISTORY.map(
        (row) => row.promoterPledgedOrEncumberedPercent,
      ),
    ).toEqual([0, 0, 0, 0])
    expect(
      TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW
        .minimumComparableQuartersPresent,
    ).toBe(true)
    expect(
      TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW
        .latestCompletedQuarterPresent,
    ).toBe(true)
  })

  it("uses the approved rubric without mechanical promoter or pledge scoring", () => {
    const states = Object.fromEntries(
      TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_COMPONENTS.map((row) => [
        row.component,
        [row.reviewedState, row.normalizedScore],
      ]),
    )
    expect(states).toEqual({
      OWNERSHIP_STABILITY: ["STRONG", 75],
      PLEDGE_CONTROL_RISK: ["STRONG", 75],
      NON_G4_GOVERNANCE_CONTEXT: ["NEUTRAL", 50],
    })
  })

  it("produces the fixed-weight read-only Ownership / Governance candidate", () => {
    expect(TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_READ_ONLY_RESULT).toEqual({
      combinedScore: 70,
    })
    expect(TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW.combinedScore).toBe(70)
  })

  it("preserves G4 anti-double-counting and all persistence boundaries", () => {
    expect(
      TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW
        .g4ConsumedEventsPenalizedAgain,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW.scoreExecutionEnabled,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW.persistedScoreRunEnabled,
    ).toBe(false)
  })
})
