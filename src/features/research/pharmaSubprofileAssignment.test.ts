import { describe, expect, it } from "vitest"
import { canTransitionResearchSubprofileAssignmentState, resolvePharmaSubprofileAssignment, type PharmaSubprofileAssignment } from "./pharmaSubprofileAssignment"

function assignment(overrides: Partial<PharmaSubprofileAssignment> = {}): PharmaSubprofileAssignment {
  return {
    securityId: "security-torntpharm",
    profileCode: "PHARMA_V1",
    primarySubprofileCode: "DOMESTIC_FORMULATIONS",
    assignmentVersion: 1,
    assignmentState: "REVIEWED",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    sourceReference: "reviewed-source",
    reasonCode: "REVIEWED_BUSINESS_MODEL",
    confidence: "HIGH",
    reviewedBy: "owner",
    reviewedAt: "2026-09-15T00:00:00Z",
    secondaryExposures: [],
    ...overrides,
  }
}

describe("resolvePharmaSubprofileAssignment", () => {
  it("permits only the approved immutable assignment lifecycle", () => {
    expect(canTransitionResearchSubprofileAssignmentState("PROVISIONAL", "REVIEWED")).toBe(true)
    expect(canTransitionResearchSubprofileAssignmentState("REVIEWED", "DISPUTED")).toBe(true)
    expect(canTransitionResearchSubprofileAssignmentState("DISPUTED", "REVIEWED")).toBe(false)
    expect(canTransitionResearchSubprofileAssignmentState("RETIRED", "PROVISIONAL")).toBe(false)
  })

  it("resolves one active reviewed assignment", () => {
    const result = resolvePharmaSubprofileAssignment([assignment()], "security-torntpharm", "2026-09-15")
    expect(result.status).toBe("RESOLVED")
    if (result.status === "RESOLVED") expect(result.assignment.primarySubprofileCode).toBe("DOMESTIC_FORMULATIONS")
  })

  it("allows parent evidence but blocks readiness for a provisional candidate", () => {
    const result = resolvePharmaSubprofileAssignment([assignment({ assignmentState: "PROVISIONAL", reviewedBy: null, reviewedAt: null })], "security-torntpharm", "2026-09-15")
    expect(result).toEqual({ status: "PARENT_ONLY_BLOCKED", profileCode: "PHARMA_V1", assignment: null, blocksReadiness: true, blocker: "PROVISIONAL_ASSIGNMENT" })
  })

  it("fails closed for missing and conflicting reviewed assignments", () => {
    expect(resolvePharmaSubprofileAssignment([], "security-torntpharm", "2026-09-15").status).toBe("PARENT_ONLY_BLOCKED")
    const conflict = resolvePharmaSubprofileAssignment([assignment(), assignment({ assignmentVersion: 2, primarySubprofileCode: "GLOBAL_GENERICS" })], "security-torntpharm", "2026-09-15")
    expect(conflict.status).toBe("PARENT_ONLY_BLOCKED")
    if (conflict.status === "PARENT_ONLY_BLOCKED") expect(conflict.blocker).toBe("CONFLICTING_REVIEWED_ASSIGNMENTS")
  })

  it("rejects invalid versions, dates and missing reviewed provenance", () => {
    expect(() => resolvePharmaSubprofileAssignment([assignment({ assignmentVersion: 0 })], "security-torntpharm", "2026-09-15")).toThrow("positive integer")
    expect(() => resolvePharmaSubprofileAssignment([assignment({ effectiveTo: "2025-12-31" })], "security-torntpharm", "2026-09-15")).toThrow("effective interval")
    expect(() => resolvePharmaSubprofileAssignment([assignment({ reviewedBy: null })], "security-torntpharm", "2026-09-15")).toThrow("reviewer provenance")
  })
})
