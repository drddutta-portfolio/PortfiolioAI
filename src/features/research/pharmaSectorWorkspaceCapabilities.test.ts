import { describe, expect, it } from "vitest"
import { buildPharmaSectorWorkspaceCapabilities } from "./pharmaSectorWorkspaceCapabilities"
import type { PharmaSubprofileAssignment } from "./pharmaSubprofileAssignment"

function torntpharmAssignment(): PharmaSubprofileAssignment {
  return {
    securityId: "TORNTPHARM_SECURITY",
    profileCode: "PHARMA_V1",
    primarySubprofileCode: "DOMESTIC_FORMULATIONS",
    assignmentVersion: 4,
    assignmentState: "REVIEWED",
    effectiveFrom: "2026-03-31",
    effectiveTo: null,
    sourceReference: "TORNTPHARM_REVIEWED_ASSIGNMENT",
    reasonCode: "TORNTPHARM_REVIEWED_BUSINESS_MODEL",
    confidence: "HIGH",
    reviewedBy: "owner",
    reviewedAt: "2026-09-18T00:00:00Z",
    secondaryExposures: [
      {
        exposureCode: "GLOBAL_GENERICS",
        materiality: "MATERIAL",
        confidence: "HIGH",
        assignmentState: "REVIEWED",
        effectiveFrom: "2026-03-31",
        effectiveTo: null,
        sourceReference: "TORNTPHARM_REVIEWED_ASSIGNMENT",
        reasonCode: "GLOBAL_GENERICS_MATERIAL",
        reviewedBy: "owner",
        reviewedAt: "2026-09-18T00:00:00Z",
      },
      {
        exposureCode: "CDMO_CRAMS",
        materiality: "EMERGING",
        confidence: "MEDIUM",
        assignmentState: "REVIEWED",
        effectiveFrom: "2026-03-31",
        effectiveTo: null,
        sourceReference: "TORNTPHARM_REVIEWED_ASSIGNMENT",
        reasonCode: "CDMO_EMERGING",
        reviewedBy: "owner",
        reviewedAt: "2026-09-18T00:00:00Z",
      },
    ],
  }
}

describe("PHARMA_V1 reusable sector workspace capabilities", () => {
  it("resolves TORNTPHARM through the reusable G8/G9 capability model without changing roles", () => {
    const capabilities = buildPharmaSectorWorkspaceCapabilities(
      torntpharmAssignment(),
      [],
      "2026-09-20",
    )

    expect(capabilities.profileCode).toBe("PHARMA_V1")
    expect(capabilities.classificationLock.primary.code).toBe("DOMESTIC_FORMULATIONS")
    expect(capabilities.classificationLock.materialOverlays.map((item) => item.code)).toEqual([
      "GLOBAL_GENERICS",
    ])
    expect(capabilities.classificationLock.emergingWatches.map((item) => item.code)).toEqual([
      "CDMO_CRAMS",
    ])
    expect(capabilities.classificationLock.unresolvedExposures).toEqual([])

    expect(capabilities.architecture.primary.subprofileCode).toBe("DOMESTIC_FORMULATIONS")
    expect(capabilities.architecture.secondaryExposures.find(
      (item) => item.exposureCode === "GLOBAL_GENERICS",
    )?.mode).toBe("EVIDENCE_OVERLAY")
    expect(capabilities.architecture.secondaryExposures.find(
      (item) => item.exposureCode === "CDMO_CRAMS",
    )?.mode).toBe("EMERGING_WATCH")

    expect(capabilities.portability.passCount).toBe(12)
    expect(capabilities.portability.totalCount).toBe(12)
    expect(capabilities.portability.rawEvidenceScope).toBe("SECURITY_COMPANY")
    expect(capabilities.portability.interpretationScope).toBe("COMPANY_ACTIVE_ASSIGNMENT_ROLE")

    expect(capabilities.activation.parentProfile).toBe("READY")
    expect(capabilities.activation.primaryAuthority).toBe("READY_PRIMARY")
    expect(capabilities.activation.materialOverlayAuthority).toBe("READY_MATERIAL")
    expect(capabilities.activation.emergingAuthority).toBe("READY_EMERGING")
    expect(capabilities.activation.unresolvedAuthority).toBe("NOT_ENGAGED")
    expect(capabilities.activation.numericScoring).toBe("BLOCKED_METHODOLOGY")
    expect(capabilities.activation.recommendation).toBe("BLOCKED_UPSTREAM_SCORING")
    expect(capabilities.activation.positionSizing).toBe("BLOCKED_UPSTREAM_RECOMMENDATION")

    expect(capabilities.activation.scoreExecutionEnabled).toBe(false)
    expect(capabilities.activation.recommendationPersistenceEnabled).toBe(false)
    expect(capabilities.activation.positionSizingPersistenceEnabled).toBe(false)

    expect(capabilities.canonicalAssignment.resolverState).toBe("RESOLVED")
    expect(capabilities.canonicalAssignment.assignmentVersion).toBe(4)
    expect(capabilities.canonicalAssignment.effectiveFrom).toBe("2026-03-31")
  })

  it("keeps unresolved exposure authority explicit rather than promoting it", () => {
    const capabilities = buildPharmaSectorWorkspaceCapabilities(
      torntpharmAssignment(),
      [],
      "2026-09-20",
      [{ exposureCode: "BIOPHARMA_BIOSIMILARS", reasonCode: "NO_COMPARABLE_ECONOMIC_SHARE" }],
    )

    expect(capabilities.classificationLock.unresolvedExposures).toEqual([
      {
        code: "BIOPHARMA_BIOSIMILARS",
        displayName: "Biopharma / Biosimilars",
        reasonCode: "NO_COMPARABLE_ECONOMIC_SHARE",
        state: "REVIEW_REQUIRED",
      },
    ])
    expect(capabilities.activation.unresolvedAuthority).toBe("REVIEW_REQUIRED")
  })

  it("rejects non-reviewed or inactive assignments", () => {
    const assignment = {
      ...torntpharmAssignment(),
      assignmentState: "PROVISIONAL" as const,
    }

    expect(() => buildPharmaSectorWorkspaceCapabilities(
      assignment,
      [],
      "2026-09-20",
    )).toThrow("active reviewed assignment")
  })
})
