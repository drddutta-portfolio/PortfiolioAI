import { describe, expect, it } from "vitest"
import {
  evaluateGateGFinal3OverlayCandidate,
  PHARMA_GATE_G_FINAL_3_CROSS_CUTTING_CANDIDATE,
  PHARMA_GATE_G_FINAL_3_TORNTPHARM_RUNTIME_SNAPSHOT,
} from "./pharmaGateGFinal3CrossCuttingCandidate"

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

  it("keeps the frozen G-FINAL-3 TORNTPHARM runtime review-required without inferring company-wide clearance", () => {
    const snapshot = PHARMA_GATE_G_FINAL_3_TORNTPHARM_RUNTIME_SNAPSHOT
    expect(snapshot.state).toBe("OWNER_APPROVED_FAIL_CLOSED_RUNTIME")
    expect(snapshot.companyWideCurrentRegulatoryScopeEstablished).toBe(false)
    expect(snapshot.gateState).toBe("REVIEW_REQUIRED")
    expect(snapshot.blocksPreview).toBe(false)
    expect(snapshot.reasonCodes).toContain("REGULATORY_MATERIALITY_UNKNOWN")
  })

  it("retains the frozen historical event and does not enable score execution", () => {
    const snapshot = PHARMA_GATE_G_FINAL_3_TORNTPHARM_RUNTIME_SNAPSHOT
    expect(snapshot.reviewedChain.eventHistoryRetained).toBe(true)
    expect(snapshot.scoreExecutionEnabled).toBe(false)
    expect(snapshot.persistedScoreRunEnabled).toBe(false)
  })
})
