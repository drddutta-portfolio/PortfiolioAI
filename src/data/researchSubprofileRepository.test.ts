import { describe, expect, it } from "vitest"
import { mapResearchSubprofileRows } from "./researchSubprofileRepository"
import { resolvePharmaSubprofileAssignment } from "../features/research/pharmaSubprofileAssignment"

describe("researchSubprofileRepository mapping", () => {
  it("maps a reviewed primary assignment and reviewed secondary exposures without inferring classification", () => {
    const assignments = mapResearchSubprofileRows([
      {
        id: "assignment-1",
        security_id: "security-1",
        parent_profile_code: "PHARMA",
        parent_profile_version: "PHARMA_V1",
        subprofile_code: "DOMESTIC_FORMULATIONS",
        subprofile_version: "DOMESTIC_FORMULATIONS_V1",
        assignment_status: "REVIEWED",
        confidence_state: "HIGH",
        assignment_basis: "OWNER_REVIEWED_GATE_E_2026_09_17",
        source_reference: "issuer evidence",
        effective_from: "2026-03-31T00:00:00+00:00",
        effective_to: null,
        reviewed_by: "reviewer-1",
        reviewed_at: "2026-09-17T13:00:00+00:00",
        created_at: "2026-09-17T13:00:00+00:00",
      },
    ], [
      {
        assignment_id: "assignment-1",
        parent_profile_code: "PHARMA",
        parent_profile_version: "PHARMA_V1",
        subprofile_code: "GLOBAL_GENERICS",
        subprofile_version: "GLOBAL_GENERICS_V1",
        materiality_state: "MATERIAL",
        evidence_basis: "issuer-defined generic business",
        source_reference: "issuer evidence",
        assignment_status: "REVIEWED",
        confidence_state: "MEDIUM",
        effective_from: "2026-03-31T00:00:00+00:00",
        effective_to: null,
        reason_code: "ISSUER_DEFINED_GENERIC_BUSINESS_REVENUE_SHARE_GTE_10",
        reviewed_by: "reviewer-1",
        reviewed_at: "2026-09-17T13:00:00+00:00",
      },
      {
        assignment_id: "assignment-1",
        parent_profile_code: "PHARMA",
        parent_profile_version: "PHARMA_V1",
        subprofile_code: "CDMO_CRAMS",
        subprofile_version: "CDMO_CRAMS_V1",
        materiality_state: "EMERGING",
        evidence_basis: "reviewed qualitative override",
        source_reference: "issuer evidence",
        assignment_status: "REVIEWED",
        confidence_state: "MEDIUM",
        effective_from: "2026-03-31T00:00:00+00:00",
        effective_to: null,
        reason_code: "OWNER_REVIEWED_STRATEGIC_EMERGING_CDMO_CAPABILITY",
        reviewed_by: "reviewer-1",
        reviewed_at: "2026-09-17T13:00:00+00:00",
      },
    ])

    const resolution = resolvePharmaSubprofileAssignment(assignments, "security-1", "2026-09-17")
    expect(resolution.status).toBe("RESOLVED")
    if (resolution.status !== "RESOLVED") throw new Error("Expected reviewed assignment to resolve")
    expect(resolution.assignment.primarySubprofileCode).toBe("DOMESTIC_FORMULATIONS")
    expect(resolution.assignment.confidence).toBe("HIGH")
    expect(resolution.assignment.assignmentVersion).toBe(1)
    expect(resolution.assignment.secondaryExposures).toEqual(expect.arrayContaining([
      expect.objectContaining({ exposureCode: "GLOBAL_GENERICS", materiality: "MATERIAL", confidence: "MEDIUM", assignmentState: "REVIEWED" }),
      expect.objectContaining({ exposureCode: "CDMO_CRAMS", materiality: "EMERGING", confidence: "MEDIUM", assignmentState: "REVIEWED" }),
    ]))
  })

  it("does not resolve when no persisted assignment rows exist", () => {
    const resolution = resolvePharmaSubprofileAssignment(mapResearchSubprofileRows([], []), "security-1", "2026-09-17")
    expect(resolution).toMatchObject({ status: "PARENT_ONLY_BLOCKED", blocker: "MISSING_ASSIGNMENT" })
  })
})
