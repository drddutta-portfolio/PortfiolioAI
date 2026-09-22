import { describe, expect, it } from "vitest"
import {
  mapPharmaDimensionReadiness,
  mapPharmaOverallReadiness,
  PHARMA_READINESS_MAPPING_CONTRACT,
} from "./pharmaReadinessMappingContract"

describe("PHARMA readiness mapping contract", () => {
  it("preserves the canonical 60% dimension and 70% overall gates", () => {
    expect(PHARMA_READINESS_MAPPING_CONTRACT.dimensionMinimumScoreReadyCoverage).toBe(0.6)
    expect(PHARMA_READINESS_MAPPING_CONTRACT.overallMinimumScoreReadyCoverage).toBe(0.7)
    expect(PHARMA_READINESS_MAPPING_CONTRACT.requiresEveryWeightedDimensionReady).toBe(true)
    expect(PHARMA_READINESS_MAPPING_CONTRACT.state).toBe("OWNER_APPROVED_NOT_ACTIVE")
    expect(PHARMA_READINESS_MAPPING_CONTRACT.methodologyApproved).toBe(true)
    expect(PHARMA_READINESS_MAPPING_CONTRACT.scoreExecutionEnabled).toBe(false)
  })

  it("maps a non-applicable dimension to NOT_APPLICABLE and removes it from the denominator", () => {
    const result = mapPharmaDimensionReadiness({
      applicable: false,
      profileResolved: true,
      scoreReadyCoverage: null,
      mandatoryBlockingConditionsSatisfied: false,
      reviewBlocked: false,
      overlayReadiness: "NONE",
    })
    expect(result.visibleState).toBe("NOT_APPLICABLE")
    expect(result.denominatorEligible).toBe(false)
    expect(result.scoreReady).toBe(false)
  })

  it("fails a weighted dimension closed below 60% coverage", () => {
    const result = mapPharmaDimensionReadiness({
      applicable: true,
      profileResolved: true,
      scoreReadyCoverage: 0.59,
      mandatoryBlockingConditionsSatisfied: true,
      reviewBlocked: false,
      overlayReadiness: "NONE",
    })
    expect(result.visibleState).toBe("INSUFFICIENT_EVIDENCE")
    expect(result.scoreReady).toBe(false)
  })

  it("keeps a material overlay with incomplete evidence PARTIAL rather than neutral", () => {
    const result = mapPharmaDimensionReadiness({
      applicable: true,
      profileResolved: true,
      scoreReadyCoverage: 0.9,
      mandatoryBlockingConditionsSatisfied: true,
      reviewBlocked: false,
      overlayReadiness: "PARTIAL",
    })
    expect(result.visibleState).toBe("PARTIAL")
    expect(result.scoreReady).toBe(false)
    expect(result.reasonCodes).toContain("MATERIAL_OVERLAY_EVIDENCE_INCOMPLETE")
  })

  it("excludes Emerging Watch from readiness effect", () => {
    const result = mapPharmaDimensionReadiness({
      applicable: true,
      profileResolved: true,
      scoreReadyCoverage: 0.8,
      mandatoryBlockingConditionsSatisfied: true,
      reviewBlocked: false,
      overlayReadiness: "EMERGING_WATCH",
    })
    expect(result.visibleState).toBe("READY")
    expect(result.scoreReady).toBe(true)
    expect(result.reasonCodes).toContain("DIMENSION_READY_EMERGING_WATCH_EXCLUDED")
  })

  it("maps unresolved profile state to PROFILE_PENDING", () => {
    const result = mapPharmaDimensionReadiness({
      applicable: true,
      profileResolved: false,
      scoreReadyCoverage: 1,
      mandatoryBlockingConditionsSatisfied: true,
      reviewBlocked: false,
      overlayReadiness: "NONE",
    })
    expect(result.visibleState).toBe("PROFILE_PENDING")
  })

  it("blocks overall preview when any weighted dimension is not ready even above 70% coverage", () => {
    const result = mapPharmaOverallReadiness({
      profileResolved: true,
      commonCoreState: "READY",
      primaryState: "READY",
      weightedDimensionStates: ["READY", "READY", "PARTIAL"],
      overallScoreReadyCoverage: 0.9,
      governanceBlocked: false,
    })
    expect(result.visibleState).toBe("PARTIAL")
    expect(result.previewEligible).toBe(false)
  })

  it("requires common core, Primary, every weighted dimension and 70% overall coverage", () => {
    const result = mapPharmaOverallReadiness({
      profileResolved: true,
      commonCoreState: "READY",
      primaryState: "READY",
      weightedDimensionStates: ["READY", "READY", "READY"],
      overallScoreReadyCoverage: 0.7,
      governanceBlocked: false,
    })
    expect(result.visibleState).toBe("READY")
    expect(result.previewEligible).toBe(true)
    expect(result.scoreExecutionEnabled).toBe(false)
  })

  it("fails the whole company closed when Primary is insufficient", () => {
    const result = mapPharmaOverallReadiness({
      profileResolved: true,
      commonCoreState: "READY",
      primaryState: "INSUFFICIENT_EVIDENCE",
      weightedDimensionStates: ["READY", "READY", "READY"],
      overallScoreReadyCoverage: 0.95,
      governanceBlocked: false,
    })
    expect(result.visibleState).toBe("INSUFFICIENT_EVIDENCE")
    expect(result.previewEligible).toBe(false)
  })

  it("propagates a governance/review blocker without defining G4 mechanics", () => {
    const result = mapPharmaOverallReadiness({
      profileResolved: true,
      commonCoreState: "READY",
      primaryState: "READY",
      weightedDimensionStates: ["READY", "READY", "READY"],
      overallScoreReadyCoverage: 1,
      governanceBlocked: true,
    })
    expect(result.visibleState).toBe("BLOCKED_REVIEW")
    expect(result.previewEligible).toBe(false)
  })
})
