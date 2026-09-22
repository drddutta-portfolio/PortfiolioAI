import { describe, expect, it } from "vitest"
import { buildAuropharmaG91AssignmentCandidate } from "./auropharmaG91ActivationReadiness"
import {
  buildPharmaGateI3ReferenceRecommendation,
  PHARMA_GATE_I3_READ_ONLY_RECOMMENDATION_VERSION,
} from "./pharmaGateI3ReadOnlyRecommendation"
import type {
  PharmaSubprofileAssignment,
  PharmaSubprofileResolution,
} from "./pharmaSubprofileAssignment"

function reviewedExposure(
  exposureCode: "GLOBAL_GENERICS" | "CDMO_CRAMS",
  materiality: "MATERIAL" | "EMERGING",
) {
  return {
    exposureCode,
    materiality,
    confidence: "HIGH" as const,
    assignmentState: "REVIEWED" as const,
    effectiveFrom: "2026-03-31",
    effectiveTo: null,
    sourceReference: `GATE_I3_TEST_${exposureCode}`,
    reasonCode: "GATE_I3_TEST_CONTEXT",
    reviewedBy: "GATE_I3_TEST",
    reviewedAt: "2026-09-21T00:00:00Z",
  }
}

function resolved(assignment: PharmaSubprofileAssignment): PharmaSubprofileResolution {
  return {
    status: "RESOLVED",
    profileCode: "PHARMA_V1",
    assignment,
    blocksReadiness: false,
  }
}

function torntpharmResolution(securityId: string): PharmaSubprofileResolution {
  return resolved({
    securityId,
    profileCode: "PHARMA_V1",
    primarySubprofileCode: "DOMESTIC_FORMULATIONS",
    assignmentVersion: 1,
    assignmentState: "REVIEWED",
    effectiveFrom: "2026-03-31",
    effectiveTo: null,
    sourceReference: "GATE_I3_TEST_TORNTPHARM_ASSIGNMENT",
    reasonCode: "GATE_I3_TEST_REVIEWED_ASSIGNMENT",
    confidence: "HIGH",
    reviewedBy: "GATE_I3_TEST",
    reviewedAt: "2026-09-21T00:00:00Z",
    secondaryExposures: [
      reviewedExposure("GLOBAL_GENERICS", "MATERIAL"),
      reviewedExposure("CDMO_CRAMS", "EMERGING"),
    ],
  })
}

describe("Gate I3 PHARMA_V1 first read-only recommendation", () => {
  it("produces the deterministic TORNTPHARM Satellite candidate from the locked Gate H result", () => {
    const result = buildPharmaGateI3ReferenceRecommendation({
      securityId: "torn-security",
      securitySymbol: "TORNTPHARM",
      assignmentResolution: torntpharmResolution("torn-security"),
    })

    expect(result).not.toBeNull()
    expect(result?.version).toBe(PHARMA_GATE_I3_READ_ONLY_RECOMMENDATION_VERSION)
    expect(result?.policyVersion).toBe(
      "PHARMA_V1_RECOMMENDATION_POLICY_V1_OWNER_APPROVED",
    )
    expect(result?.deterministicCalculationState).toBe(
      "READY_READ_ONLY_RECOMMENDATION",
    )
    expect(result?.suggestedRole).toBe("SATELLITE_CANDIDATE")
    expect(result?.overallScore).toBe(75.1575)
    expect(result?.evaluatedRoleThreshold).toBe("SATELLITE_CANDIDATE")
    expect(result?.dimensions).toEqual([
      { dimensionCode: "QUALITY", score: 92 },
      { dimensionCode: "GROWTH", score: 78.25 },
      { dimensionCode: "CAPITAL_EFFICIENCY", score: 79 },
      { dimensionCode: "CASH_FLOW", score: 93.6 },
      { dimensionCode: "BALANCE_SHEET_CREDIT", score: 65 },
      { dimensionCode: "BUSINESS_DURABILITY", score: 75 },
      { dimensionCode: "VALUATION", score: 30 },
      { dimensionCode: "MOMENTUM", score: 95 },
      { dimensionCode: "OWNERSHIP_GOVERNANCE", score: 70 },
      { dimensionCode: "RISK", score: 80 },
    ])
    expect(result?.floorEvaluations).toHaveLength(7)
    expect(result?.floorEvaluations.every((item) => item.state === "PASS")).toBe(true)
    expect(result?.cautions).toEqual(["VALUATION_BELOW_NEUTRAL_ANCHOR"])
    expect(result?.context).toEqual([
      "MATERIAL_OVERLAY_CONTEXT_ONLY",
      "EMERGING_WATCH_CONTEXT_ONLY",
    ])
    expect(result?.governanceState).toBe("CLEAR")
    expect(result?.overlayTreatment).toEqual({
      materialOverlayCode: "GLOBAL_GENERICS",
      materialOverlayTreatment: "CONTEXT_ONLY",
      emergingWatchCode: "CDMO_CRAMS",
      emergingWatchTreatment: "CONTEXT_ONLY_NUMERICALLY_EXCLUDED",
      numericModifierApplied: false,
      secondIndependentRecommendation: false,
    })
  })

  it("fails AUROPHARMA closed to Insufficient without exposing partial dimensions", () => {
    const assignment = buildAuropharmaG91AssignmentCandidate("auro-security")
    const result = buildPharmaGateI3ReferenceRecommendation({
      securityId: "auro-security",
      securitySymbol: "AUROPHARMA",
      assignmentResolution: resolved(assignment),
    })

    expect(result).not.toBeNull()
    expect(result?.deterministicCalculationState).toBe(
      "FAIL_CLOSED_INSUFFICIENT",
    )
    expect(result?.sourceAuthorityState).toBe("SCORE_NOT_COMPUTABLE")
    expect(result?.suggestedRole).toBe("INSUFFICIENT")
    expect(result?.overallScore).toBeNull()
    expect(result?.dimensions).toEqual([])
    expect(result?.evaluatedRoleThreshold).toBe("NOT_EVALUATED")
    expect(result?.reasonCodes).toContain(
      "AUTHORITATIVE_SCORE_NOT_COMPUTABLE",
    )
    expect(result?.reasonCodes).toContain(
      "GLOBAL_GENERICS_PRIMARY_METHODOLOGY_INCOMPLETE",
    )
    expect(result?.overlayTreatment.materialOverlayCode).toBeNull()
    expect(result?.overlayTreatment.emergingWatchCode).toBe("API_BULK_DRUGS")
  })

  it("is deterministic for the same locked authority and policy", () => {
    const input = {
      securityId: "torn-security",
      securitySymbol: "TORNTPHARM",
      assignmentResolution: torntpharmResolution("torn-security"),
    } as const
    expect(buildPharmaGateI3ReferenceRecommendation(input)).toEqual(
      buildPharmaGateI3ReferenceRecommendation(input),
    )
  })

  it("keeps every downstream mutation and action capability disabled", () => {
    const result = buildPharmaGateI3ReferenceRecommendation({
      securityId: "torn-security",
      securitySymbol: "TORNTPHARM",
      assignmentResolution: torntpharmResolution("torn-security"),
    })

    expect(result).toMatchObject({
      readOnly: true,
      nonPersisting: true,
      recommendationPersistenceEnabled: false,
      scorePersistenceEnabled: false,
      weightGuidanceEnabled: false,
      actionBiasEnabled: false,
      positionSizingEnabled: false,
      aiInterpretationEnabled: false,
    })
    const serialized = JSON.stringify(result)
    expect(serialized).not.toContain("BANK_NBFC")
    expect(serialized).not.toContain("HDFCBANK")
    expect(serialized).not.toContain("NIFTY_BANK")
  })

  it("does not emit an I3 reference recommendation for other Pharma companies yet", () => {
    expect(buildPharmaGateI3ReferenceRecommendation({
      securityId: "other-security",
      securitySymbol: "OTHERPHARMA",
      assignmentResolution: torntpharmResolution("other-security"),
    })).toBeNull()
  })
})
