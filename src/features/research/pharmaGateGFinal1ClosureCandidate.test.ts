import { describe, expect, it } from "vitest"
import { PHARMA_GATE_G_FINAL_1_CLOSURE_CANDIDATE } from "./pharmaGateGFinal1ClosureCandidate"

describe("Gate G FINAL-1 closure candidate", () => {
  it("packages the mature Domestic contracts without activating scoring", () => {
    const candidate = PHARMA_GATE_G_FINAL_1_CLOSURE_CANDIDATE

    expect(candidate.state).toBe("OWNER_APPROVED_COMPLETE")
    expect(candidate.targetSecurity).toBe("TORNTPHARM")
    expect(candidate.profileCode).toBe("PHARMA_V1")
    expect(candidate.primarySubprofile).toBe("DOMESTIC_FORMULATIONS")

    expect(candidate.contracts.quality.deterministicEvaluatorAvailable).toBe(true)
    expect(candidate.contracts.growth.deterministicEvaluatorAvailable).toBe(true)
    expect(candidate.contracts.valuation.deterministicEvaluatorAvailable).toBe(true)

    expect(candidate.gateHEligible).toBe(false)
    expect(candidate.scoreExecutionEnabled).toBe(false)
    expect(candidate.persistedScoreRunEnabled).toBe(false)
    expect(candidate.recommendationEnabled).toBe(false)
    expect(candidate.positionSizingEnabled).toBe(false)
  })

  it("records owner approval while keeping Gate H blocked by later Gate G checkpoints", () => {
    expect(PHARMA_GATE_G_FINAL_1_CLOSURE_CANDIDATE.ownerApprovalRequiredFor).toEqual([])
    expect(PHARMA_GATE_G_FINAL_1_CLOSURE_CANDIDATE.gFinal1Complete).toBe(true)
    expect(PHARMA_GATE_G_FINAL_1_CLOSURE_CANDIDATE.remainingGateHBlockers).toEqual([
      "G_FINAL_2_MISSING_NUMERIC_DIMENSIONS",
      "G_FINAL_3_MATERIAL_OVERLAY_TREATMENT",
      "G_FINAL_4_GOVERNANCE_RUNTIME_INPUT",
      "G_FINAL_5_FULL_SCORE_DRY_RUN",
    ])
    expect(PHARMA_GATE_G_FINAL_1_CLOSURE_CANDIDATE.contracts.valuation.ownerApprovalRequired).toBe(false)
  })

  it("preserves the locked readiness and governance boundaries", () => {
    const { readiness, governanceHighRisk } =
      PHARMA_GATE_G_FINAL_1_CLOSURE_CANDIDATE.contracts

    expect(readiness.dimensionMinimumScoreReadyCoverage).toBe(0.6)
    expect(readiness.overallMinimumScoreReadyCoverage).toBe(0.7)
    expect(readiness.requiresEveryWeightedDimensionReady).toBe(true)

    expect(governanceHighRisk.highRiskBehavior).toBe("INTERPRETATION_ONLY")
    expect(governanceHighRisk.criticalBlocksOverallPreview).toBe(true)
    expect(governanceHighRisk.hiddenDoubleCountingAllowed).toBe(false)
  })
})
