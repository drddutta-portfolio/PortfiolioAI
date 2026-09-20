import { describe, expect, it } from "vitest"
import { PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE } from "./pharmaGateGFinal2ClosureCandidate"

describe("consolidated G-FINAL-2 closure candidate", () => {
  it("records implementation completeness without claiming owner freeze", () => {
    expect(PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE.state).toBe(
      "IMPLEMENTATION_COMPLETE_OWNER_FREEZE_PENDING",
    )
    expect(
      PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE
        .gFinal2MethodologyImplementationComplete,
    ).toBe(true)
    expect(
      PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE.gFinal2OwnerFreezeComplete,
    ).toBe(false)
    expect(PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE.gFinal2Complete).toBe(false)
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
