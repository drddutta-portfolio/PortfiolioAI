import { describe, expect, it } from "vitest"
import {
  evaluateGateGFinal3OverlayCandidate,
  PHARMA_GATE_G_FINAL_3_CROSS_CUTTING_CANDIDATE,
} from "./pharmaGateGFinal3CrossCuttingCandidate"
import {
  TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING,
  TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT,
} from "./torntpharmGateGFinal3RuntimeMapping"

describe("G-FINAL-3 cross-cutting methodology", () => {
  it("records owner-approved cross-cutting methodology without activation", () => {
    const candidate = PHARMA_GATE_G_FINAL_3_CROSS_CUTTING_CANDIDATE
    expect(candidate.state).toBe("OWNER_APPROVED_COMPLETE")
    expect(candidate.overlay.combinedPerDimensionCapPoints).toBe(10)
    expect(candidate.overlay.ownerApprovalRequired).toBe(false)
    expect(candidate.governanceRuntime.highRiskBehavior).toBe("INTERPRETATION_ONLY")
    expect(candidate.governanceRuntime.highRiskNumericCap).toBeNull()
    expect(candidate.governanceRuntime.hiddenDoubleCountingAllowed).toBe(false)
    expect(candidate.gFinal3Complete).toBe(true)
    expect(candidate.remainingGateGBlockers).toEqual(["G_FINAL_4_END_TO_END_READ_ONLY_DRY_RUN"])
    expect(candidate.gateHEligible).toBe(false)
    expect(candidate.scoreExecutionEnabled).toBe(false)
    expect(candidate.persistedScoreRunEnabled).toBe(false)
  })

  it("keeps partial overlay evidence fail-closed", () => {
    const result = evaluateGateGFinal3OverlayCandidate({
      overlayCode: "GLOBAL_GENERICS",
      overlayRole: "MATERIAL_OVERLAY",
      dimensionCode: "GROWTH",
      economicMaterialityPercent: 25,
      evidenceCompleteness: 0.8,
      evidenceConfidence: "HIGH",
      normalizedOverlaySignal: 0.5,
      contradictionState: "NONE",
      overlayReadiness: "PARTIAL",
    })
    expect(result.modifierState).toBe("READINESS_NOT_READY")
    expect(result.proposedNumericModifierPoints).toBeNull()
  })

  it("applies the candidate overlay formula deterministically only when READY", () => {
    const result = evaluateGateGFinal3OverlayCandidate({
      overlayCode: "GLOBAL_GENERICS",
      overlayRole: "MATERIAL_OVERLAY",
      dimensionCode: "GROWTH",
      economicMaterialityPercent: 25,
      evidenceCompleteness: 0.8,
      evidenceConfidence: "HIGH",
      normalizedOverlaySignal: 0.5,
      contradictionState: "NONE",
      overlayReadiness: "READY",
    })
    expect(result.modifierState).toBe("APPROVED_NUMERIC_MODIFIER")
    expect(result.proposedNumericModifierPoints).toBe(1)
  })

  it("keeps TORNTPHARM governance runtime review-required without inferring company-wide clearance", () => {
    expect(TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING.state).toBe("OWNER_APPROVED_FAIL_CLOSED_RUNTIME")
    expect(
      TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING
        .companyWideCurrentRegulatoryScopeEstablished,
    ).toBe(false)
    expect(TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT.gateState).toBe(
      "REVIEW_REQUIRED",
    )
    expect(TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT.blocksPreview).toBe(false)
    expect(TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT.reasonCodes).toContain(
      "REGULATORY_MATERIALITY_UNKNOWN",
    )
  })

  it("retains the historical event and does not enable score execution", () => {
    expect(
      TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING.reviewedChain.eventHistoryRetained,
    ).toBe(true)
    expect(
      TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING.scoreExecutionEnabled,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING.persistedScoreRunEnabled,
    ).toBe(false)
  })
})
