import { describe, expect, it } from "vitest"
import { PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE } from "./pharmaGateGFinal2ClosureCandidate"

describe("consolidated G-FINAL-2 closure", () => {
  it("records owner-approved G-FINAL-2 completion while Gate H remains blocked", () => {
    expect(PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE.state).toBe(
      "OWNER_APPROVED_COMPLETE",
    )
    expect(
      PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE
        .gFinal2MethodologyImplementationComplete,
    ).toBe(true)
    expect(
      PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE.gFinal2OwnerFreezeComplete,
    ).toBe(true)
    expect(PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE.gFinal2Complete).toBe(true)
    expect(PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE.remainingGateGBlockers).toEqual([
      "G_FINAL_3_CROSS_CUTTING_CONTROLS",
      "G_FINAL_4_END_TO_END_READ_ONLY_DRY_RUN",
    ])
  })

  it("has deterministic evaluators for all seven remaining dimensions", () => {
    expect(
      PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE.numericMethodology
        .deterministicEvaluatorsImplemented,
    ).toEqual([
      "CAPITAL_EFFICIENCY",
      "CASH_FLOW",
      "BALANCE_SHEET_CREDIT",
      "BUSINESS_DURABILITY",
      "MOMENTUM",
      "OWNERSHIP_GOVERNANCE",
      "RISK",
    ])
  })

  it("keeps evidence blockers explicit and every downstream action off", () => {
    expect(
      PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE
        .remainingEvidenceBlockersForTorntpharm.length,
    ).toBeGreaterThan(0)
    expect(PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE.gateHEligible).toBe(false)
    expect(
      PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE.scoreExecutionEnabled,
    ).toBe(false)
    expect(
      PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE.persistedScoreRunEnabled,
    ).toBe(false)
    expect(
      PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE.recommendationEnabled,
    ).toBe(false)
    expect(
      PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE.positionSizingEnabled,
    ).toBe(false)
  })
})
