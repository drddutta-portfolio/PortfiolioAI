import { describe, expect, it } from "vitest"
import type { PharmaSubprofileAssignment } from "./pharmaSubprofileAssignment"
import { buildPharmaResearchWorkspaceModel } from "./pharmaResearchWorkspaceModel"
import type { ResearchMetric } from "./types"

const assignment: PharmaSubprofileAssignment = {
  securityId: "torntpharm",
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
    {
      exposureCode: "GLOBAL_GENERICS",
      materiality: "MATERIAL",
      confidence: "MEDIUM",
      assignmentState: "REVIEWED",
      effectiveFrom: "2026-03-31",
      effectiveTo: null,
      sourceReference: "generics",
      reasonCode: "MATERIAL",
      reviewedBy: "reviewer",
      reviewedAt: "2026-09-17T13:05:43Z",
    },
    {
      exposureCode: "CDMO_CRAMS",
      materiality: "EMERGING",
      confidence: "MEDIUM",
      assignmentState: "REVIEWED",
      effectiveFrom: "2026-03-31",
      effectiveTo: null,
      sourceReference: "cdmo",
      reasonCode: "EMERGING",
      reviewedBy: "reviewer",
      reviewedAt: "2026-09-17T13:05:43Z",
    },
  ],
}

function metric(code: string, status: ResearchMetric["status"]): ResearchMetric {
  return {
    id: code,
    code,
    label: code,
    value: "1",
    numericValue: "1",
    provider: "TEST",
    sourceField: null,
    periodStart: null,
    periodEnd: "2026-03-31",
    periodType: "YEAR",
    scope: null,
    unit: null,
    currency: null,
    retrievedAt: "2026-09-17T00:00:00Z",
    freshUntil: "2027-09-17T00:00:00Z",
    status,
    selected: true,
  }
}

describe("buildPharmaResearchWorkspaceModel", () => {
  it("keeps the reviewed primary model separate from material and emerging secondary overlays", () => {
    const model = buildPharmaResearchWorkspaceModel(assignment, [
      metric("PHARMA_FIELD_FORCE_PRODUCTIVITY", "VERIFIED"),
      metric("PHARMA_EXPORT_US_REVENUE_GROWTH", "VERIFIED"),
    ], "2026-09-17")

    expect(model.primary.displayName).toBe("Domestic Formulations")
    expect(model.primary.requirements.some((item) => item.metricCode === "PHARMA_FIELD_FORCE_PRODUCTIVITY" && item.status === "VERIFIED")).toBe(true)
    expect(model.primary.requirements.some((item) => item.status === "UNAVAILABLE")).toBe(true)
    expect(model.scoringState).toBe("UNAPPROVED")

    const generics = model.secondaries.find((item) => item.exposureCode === "GLOBAL_GENERICS")
    const cdmo = model.secondaries.find((item) => item.exposureCode === "CDMO_CRAMS")
    expect(generics?.mode).toBe("EVIDENCE_OVERLAY")
    expect(generics?.requirements.length).toBeGreaterThan(0)
    expect(cdmo?.mode).toBe("EMERGING_WATCH")
    expect(cdmo?.requirements).toHaveLength(0)
  })

  it("does not turn missing business-model evidence into a zero-like status", () => {
    const model = buildPharmaResearchWorkspaceModel(assignment, [], "2026-09-17")
    expect(model.primary.verified).toBe(0)
    expect(model.primary.unavailable).toBe(model.primary.requirements.length)
    expect(model.primary.requirements.every((item) => item.status === "UNAVAILABLE")).toBe(true)
  })
})
