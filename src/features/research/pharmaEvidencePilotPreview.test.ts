import { describe, expect, it } from "vitest"
import type { PharmaSubprofileAssignment } from "./pharmaSubprofileAssignment"
import { buildTorntpharmEvidencePilotPreview } from "./pharmaEvidencePilotPreview"
import { buildPharmaResearchWorkspaceModel } from "./pharmaResearchWorkspaceModel"

const assignment: PharmaSubprofileAssignment = {
  securityId: "local-security",
  profileCode: "PHARMA_V1",
  primarySubprofileCode: "DOMESTIC_FORMULATIONS",
  assignmentVersion: 1,
  assignmentState: "REVIEWED",
  effectiveFrom: "2026-03-31",
  effectiveTo: null,
  sourceReference: "reviewed",
  reasonCode: "OWNER_REVIEWED_GATE_E",
  confidence: "HIGH",
  reviewedBy: "reviewer",
  reviewedAt: "2026-09-17T13:05:43Z",
  secondaryExposures: [
    { exposureCode: "GLOBAL_GENERICS", materiality: "MATERIAL", confidence: "MEDIUM", assignmentState: "REVIEWED", effectiveFrom: "2026-03-31", effectiveTo: null, sourceReference: "generics", reasonCode: "MATERIAL", reviewedBy: "reviewer", reviewedAt: "2026-09-17T13:05:43Z" },
    { exposureCode: "CDMO_CRAMS", materiality: "EMERGING", confidence: "MEDIUM", assignmentState: "REVIEWED", effectiveFrom: "2026-03-31", effectiveTo: null, sourceReference: "cdmo", reasonCode: "EMERGING", reviewedBy: "reviewer", reviewedAt: "2026-09-17T13:05:43Z" },
  ],
}

describe("buildTorntpharmEvidencePilotPreview", () => {
  it("validates the 42-row pilot without pretending canonical-history rows satisfy subprofile evidence", () => {
    const workspace = buildPharmaResearchWorkspaceModel(assignment, [], "2026-09-18")
    const preview = buildTorntpharmEvidencePilotPreview("a4000000-0000-0000-0000-000000000002", workspace)
    expect(preview.candidateCount).toBe(42)
    expect(preview.acceptedCount).toBe(42)
    expect(preview.quarantinedCount).toBe(0)
    expect(preview.directOfficialCount).toBe(33)
    expect(preview.derivedCount).toBe(9)
    expect(preview.countedRequirementTotal).toBe(14)
    expect(preview.countedRequirementReady).toBe(0)
    expect(preview.scopes.map((scope) => [scope.label, scope.total])).toEqual([["Primary model", 8], ["Global Generics", 6]])
  })
})
