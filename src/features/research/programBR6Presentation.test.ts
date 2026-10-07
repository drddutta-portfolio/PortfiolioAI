import { describe, expect, it } from "vitest"
import type { PharmaSubprofileCode, PharmaSubprofileResolution } from "./pharmaSubprofileAssignment"
import { buildProgramBR6ScoringPresentation } from "./programBR6Presentation"
import type { SecurityScoringSnapshot } from "./scoringTypes"

function snapshot(overrides: Partial<SecurityScoringSnapshot> = {}): SecurityScoringSnapshot {
  return {
    scoreRunId: "score-run-1",
    profileCode: "PHARMA_V1",
    profileName: "Pharmaceuticals",
    profileSource: "REVIEWED_ASSIGNMENT",
    methodologyState: "AVAILABLE",
    scoringExecutionState: "AVAILABLE",
    modelName: "PortfolioAI",
    modelStatus: "ACTIVE",
    runState: "COMPLETE",
    overallScore: 75,
    evidenceCoverage: 1,
    scoreReadyCoverage: 1,
    evidenceConfidence: 100,
    asOfDate: "2026-09-24",
    dimensions: [],
    ratings: [],
    previewMode: false,
    canonicalEvidenceState: "FRESH",
    ...overrides,
  }
}

function resolved(primary: PharmaSubprofileCode, assignmentVersion = 1): Extract<PharmaSubprofileResolution, { status: "RESOLVED" }> {
  return {
    status: "RESOLVED",
    profileCode: "PHARMA_V1",
    blocksReadiness: false,
    assignment: {
      assignmentId: `assignment-${primary}`,
      securityId: `security-${primary}`,
      profileCode: "PHARMA_V1",
      primarySubprofileCode: primary,
      assignmentVersion,
      assignmentState: "REVIEWED",
      effectiveFrom: "2026-03-31",
      effectiveTo: null,
      sourceReference: "OWNER_APPROVED_GATE_J",
      reasonCode: "OWNER_APPROVED",
      confidence: "HIGH",
      reviewedBy: "owner",
      reviewedAt: "2026-09-24T00:00:00Z",
      secondaryExposures: [],
    },
  }
}

describe("Program B canonical R6 scoring presentation", () => {
  it("keeps evidence snapshot identity and methodology version distinct from the score run", () => {
    const canonicalRoute = { profileCode: "BANK", subprofileCode: null, methodologyAuthority: "bank-authority", methodologyVersion: "bank-v2", assignmentAuthority: "approved-assignment", assignmentVersion: "v1", assignmentId: "a1", snapshotId: "evidence-snapshot-1", asOfDate: "2026-10-08" }
    const result = buildProgramBR6ScoringPresentation({ securityId: "s1", snapshot: snapshot({ profileCode: "BANK_NBFC", canonicalRoute }), pharmaResolution: null })
    expect(result.evidenceSnapshotIdentity).toBe("evidence-snapshot-1")
    expect(result.methodologyVersion).toBe("bank-v2")
    expect(result.scoreRunId).toBe("score-run-1")
    expect(result.asOfDate).toBe("2026-10-08")
    const legacy = buildProgramBR6ScoringPresentation({ securityId: "s1", snapshot: snapshot({ profileCode: "BANK_NBFC" }), pharmaResolution: null })
    expect(legacy.evidenceSnapshotIdentity).toBeNull()
    expect(legacy.methodologyVersion).toBeNull()
  })
  it.each([
    ["TORNTPHARM", "DOMESTIC_FORMULATIONS"],
    ["ALIVUS", "API_BULK_DRUGS"],
    ["AUROPHARMA", "GLOBAL_GENERICS"],
    ["BIOCON", "BIOPHARMA_BIOSIMILARS"],
    ["SYNGENE", "CDMO_CRAMS"],
  ] as const)("presents %s with its canonical Primary %s", (symbol, primary) => {
    const result = buildProgramBR6ScoringPresentation({ securityId: `security-${symbol}`, snapshot: snapshot(), pharmaResolution: resolved(primary) })
    expect(result).toMatchObject({ readinessState: "READY", researchProfileCode: "PHARMA_V1", methodologyRole: primary })
  })

  it("fails closed without a reviewed Primary and never displays generic PHARMA", () => {
    const result = buildProgramBR6ScoringPresentation({ securityId: "security-biocon", snapshot: snapshot(), pharmaResolution: null })
    expect(result.readinessState).toBe("BLOCKED_PREREQUISITE")
    expect(result.methodologyRole).toBeNull()
    expect(result.methodologyRole).not.toBe("PHARMA")
  })

  it.each([
    [{ previewMode: true }, "INSUFFICIENT_EVIDENCE"],
    [{ runState: "PENDING" }, "INSUFFICIENT_EVIDENCE"],
    [{ canonicalEvidenceState: "STALE" as const }, "STALE_REQUIRED_EVIDENCE"],
    [{ canonicalEvidenceState: "CONFLICTING" as const }, "CONFLICTING_EVIDENCE"],
  ])("does not label incomplete or invalid evidence READY", (overrides, expected) => {
    const result = buildProgramBR6ScoringPresentation({ securityId: "security-x", snapshot: snapshot(overrides), pharmaResolution: resolved("DOMESTIC_FORMULATIONS") })
    expect(result.readinessState).toBe(expected)
    expect(result.canScore).toBe(false)
  })

  it("blocks missing assignment identity or version", () => {
    const missingId = resolved("DOMESTIC_FORMULATIONS")
    const { assignmentId: _assignmentId, ...assignmentWithoutId } = missingId.assignment
    void _assignmentId
    const withoutId: PharmaSubprofileResolution = { ...missingId, assignment: assignmentWithoutId }
    expect(buildProgramBR6ScoringPresentation({ securityId: "security-x", snapshot: snapshot(), pharmaResolution: withoutId }).readinessState).toBe("BLOCKED_PREREQUISITE")
    expect(buildProgramBR6ScoringPresentation({ securityId: "security-x", snapshot: snapshot(), pharmaResolution: resolved("DOMESTIC_FORMULATIONS", 0) }).readinessState).toBe("BLOCKED_PREREQUISITE")
  })
})
