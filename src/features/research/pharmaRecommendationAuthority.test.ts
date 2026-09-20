import { describe, expect, it } from "vitest"
import { TORNTPHARM_GATE_H3_READ_ONLY_RESULT } from "./torntpharmGateH3ReadOnlyScore"
import type {
  PharmaSubprofileAssignment,
  PharmaSubprofileResolution,
} from "./pharmaSubprofileAssignment"
import {
  buildGateHClosedScoreAuthority,
  buildPharmaRecommendationInput,
  buildPharmaScoreNotComputableAuthority,
  PHARMA_GATE_I1_POLICY_IDENTITY,
  PHARMA_GATE_I1_RECOMMENDATION_AUTHORITY_VERSION,
} from "./pharmaRecommendationAuthority"

function assignment(
  securityId: string,
  primary: PharmaSubprofileAssignment["primarySubprofileCode"],
): PharmaSubprofileAssignment {
  return {
    securityId,
    profileCode: "PHARMA_V1",
    primarySubprofileCode: primary,
    assignmentVersion: 1,
    assignmentState: "REVIEWED",
    effectiveFrom: "2026-03-31",
    effectiveTo: null,
    sourceReference: "CANONICAL_ASSIGNMENT_TEST",
    reasonCode: "REVIEWED_TEST_ASSIGNMENT",
    confidence: "HIGH",
    reviewedBy: "owner",
    reviewedAt: "2026-09-20T00:00:00Z",
    secondaryExposures: [],
  }
}

function resolved(
  securityId: string,
  primary: PharmaSubprofileAssignment["primarySubprofileCode"],
): PharmaSubprofileResolution {
  return {
    status: "RESOLVED",
    profileCode: "PHARMA_V1",
    assignment: assignment(securityId, primary),
    blocksReadiness: false,
  }
}

describe("Gate I1 Pharma recommendation authority", () => {
  it("locks a PHARMA_V1-native policy identity and forbids silent legacy PHARMA_HEALTHCARE use", () => {
    expect(PHARMA_GATE_I1_POLICY_IDENTITY.researchAuthority).toEqual({
      parentProfileCode: "PHARMA",
      parentProfileVersion: "PHARMA_V1",
    })
    expect(PHARMA_GATE_I1_POLICY_IDENTITY.recommendationPolicyCode).toBe(
      "PHARMA_V1",
    )
    expect(PHARMA_GATE_I1_POLICY_IDENTITY.recommendationPolicyStorageState).toBe(
      "NOT_MATERIALIZED",
    )
    expect(PHARMA_GATE_I1_POLICY_IDENTITY.legacyScoringProfileCode).toBe(
      "PHARMA_HEALTHCARE",
    )
    expect(PHARMA_GATE_I1_POLICY_IDENTITY.legacyPolicyUsage).toBe(
      "FORBIDDEN_FOR_GATE_I",
    )
  })

  it("composes canonical assignment authority with the closed Gate H score without recalculating it", () => {
    const securityId = "security-torntpharm"
    const scoreAuthority = buildGateHClosedScoreAuthority(
      securityId,
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT,
    )
    const result = buildPharmaRecommendationInput({
      securityId,
      assignmentResolution: resolved(
        securityId,
        "DOMESTIC_FORMULATIONS",
      ),
      scoreAuthority,
    })

    expect(result.contractVersion).toBe(
      PHARMA_GATE_I1_RECOMMENDATION_AUTHORITY_VERSION,
    )
    expect(result.state).toBe("READY_FOR_POLICY")
    if (result.state !== "READY_FOR_POLICY") return
    expect(result.scoreAuthority.overallScore).toBe(75.1575)
    expect(result.scoreAuthority.dimensions).toHaveLength(10)
    expect(result.scoreAuthority.scoreReadyCoverage).toBe(1)
    expect(result.assignmentAuthority.primarySubprofile).toBe(
      "DOMESTIC_FORMULATIONS",
    )
    expect(result.recommendationEligibility).toBe("ELIGIBLE_FOR_POLICY")
    expect(result.readOnly).toBe(true)
    expect(result.nonPersisting).toBe(true)
  })

  it("enforces closed-score safety invariants at runtime instead of relying on literal inference", () => {
    expect(() => buildGateHClosedScoreAuthority(
      "security-torntpharm",
      {
        ...TORNTPHARM_GATE_H3_READ_ONLY_RESULT,
        emergingWatch: {
          ...TORNTPHARM_GATE_H3_READ_ONLY_RESULT.emergingWatch,
          numericParticipation: true,
        },
      },
    )).toThrow("Emerging Watch numeric participation")

    expect(() => buildGateHClosedScoreAuthority(
      "security-torntpharm",
      {
        ...TORNTPHARM_GATE_H3_READ_ONLY_RESULT,
        globalGenericsOverlay: {
          ...TORNTPHARM_GATE_H3_READ_ONLY_RESULT.globalGenericsOverlay,
          numericModifierApplied: true,
        },
      },
    )).toThrow("material overlay numeric modifier")
  })

  it("keeps score-not-computable structurally distinct from assignment failure", () => {
    const securityId = "security-auropharma"
    const scoreAuthority = buildPharmaScoreNotComputableAuthority({
      securityId,
      securitySymbol: "AUROPHARMA",
      primarySubprofile: "GLOBAL_GENERICS",
      reasonCode: "GLOBAL_GENERICS_PRIMARY_METHODOLOGY_INCOMPLETE",
      sourceContractVersions: [
        "AUROPHARMA_G8_2_SAME_ENGINE_READ_ONLY_PREVIEW_V1",
        "AUROPHARMA_G9_1_ACTIVATION_READINESS_AUTHORITY_V1",
      ],
    })
    const result = buildPharmaRecommendationInput({
      securityId,
      assignmentResolution: resolved(securityId, "GLOBAL_GENERICS"),
      scoreAuthority,
    })

    expect(result.state).toBe("SCORE_NOT_COMPUTABLE")
    if (result.state !== "SCORE_NOT_COMPUTABLE") return
    expect(result.scoreAuthority.overallScore).toBeNull()
    expect(result.scoreAuthority.dimensions).toEqual([])
    expect(result.scoreAuthority.reasonCode).toBe(
      "GLOBAL_GENERICS_PRIMARY_METHODOLOGY_INCOMPLETE",
    )
    expect(result.recommendationEligibility).toBe("FAIL_CLOSED")
  })

  it("preserves the canonical assignment blocker separately from score state", () => {
    const securityId = "security-auropharma"
    const scoreAuthority = buildPharmaScoreNotComputableAuthority({
      securityId,
      securitySymbol: "AUROPHARMA",
      primarySubprofile: "GLOBAL_GENERICS",
      reasonCode: "GLOBAL_GENERICS_PRIMARY_METHODOLOGY_INCOMPLETE",
      sourceContractVersions: [],
    })
    const result = buildPharmaRecommendationInput({
      securityId,
      assignmentResolution: {
        status: "PARENT_ONLY_BLOCKED",
        profileCode: "PHARMA_V1",
        assignment: null,
        blocksReadiness: true,
        blocker: "NO_ACTIVE_REVIEWED_ASSIGNMENT",
      },
      scoreAuthority,
    })

    expect(result.state).toBe("ASSIGNMENT_BLOCKED")
    if (result.state !== "ASSIGNMENT_BLOCKED") return
    expect(result.assignmentAuthority.reasonCode).toBe(
      "NO_ACTIVE_REVIEWED_ASSIGNMENT",
    )
    expect(result.scoreAuthority.state).toBe("SCORE_NOT_COMPUTABLE")
  })

  it("rejects cross-company and Primary-subprofile authority mismatches", () => {
    const scoreAuthority = buildGateHClosedScoreAuthority(
      "security-torntpharm",
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT,
    )
    expect(() => buildPharmaRecommendationInput({
      securityId: "security-other",
      assignmentResolution: resolved(
        "security-other",
        "DOMESTIC_FORMULATIONS",
      ),
      scoreAuthority,
    })).toThrow("securityId mismatch")

    expect(() => buildPharmaRecommendationInput({
      securityId: "security-torntpharm",
      assignmentResolution: resolved(
        "security-torntpharm",
        "GLOBAL_GENERICS",
      ),
      scoreAuthority,
    })).toThrow("Primary subprofile mismatch")
  })
})
