import { describe, expect, it } from "vitest"
import type { PharmaSubprofileAssignment } from "./pharmaSubprofileAssignment"
import { buildPharmaBusinessModelEvidenceAcquisitionPlan } from "./pharmaBusinessModelEvidenceAcquisitionContract"
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

describe("Pharma business-model evidence acquisition contract", () => {
  it("covers every counted Domestic Formulations + Global Generics requirement exactly once", () => {
    const workspace = buildPharmaResearchWorkspaceModel(assignment, [], "2026-09-18")
    const plan = buildPharmaBusinessModelEvidenceAcquisitionPlan(workspace)
    expect(plan.items).toHaveLength(14)
    expect(new Set(plan.items.map((item) => item.metricCode))).toHaveLength(14)
    expect(plan.items.filter((item) => item.scope === "PRIMARY_MODEL")).toHaveLength(8)
    expect(plan.items.filter((item) => item.scope === "MATERIAL_OVERLAY")).toHaveLength(6)
  })

  it("keeps acquisition permissions and evidence obligations explicit", () => {
    const workspace = buildPharmaResearchWorkspaceModel(assignment, [], "2026-09-18")
    const plan = buildPharmaBusinessModelEvidenceAcquisitionPlan(workspace)
    expect(plan.contractVersion).toBe("PHARMA_BUSINESS_MODEL_EVIDENCE_ACQUISITION_V1")
    expect(plan.ingestionAuthorized).toBe(false)
    expect(plan.summary).toEqual({
      total: 14,
      mandatory: 8,
      important: 5,
      supplementary: 1,
      publicOfficialFirst: 12,
      publicOrLicensed: 1,
      licensedRequired: 1,
      derivedFromDisclosedInputs: 3,
    })
    expect(plan.items.find((item) => item.metricCode === "PHARMA_BRAND_THERAPY_LEADERSHIP")?.accessGate).toBe("LICENSED_REQUIRED")
    expect(plan.items.find((item) => item.metricCode === "PHARMA_CHRONIC_ACUTE_MIX")?.accessGate).toBe("PUBLIC_OR_LICENSED")
    expect(plan.items.find((item) => item.metricCode === "PHARMA_FIELD_FORCE_PRODUCTIVITY")?.failClosedRule).toContain("inferred MR headcount")
  })

  it("does not assign a CDMO acquisition contract while the exposure remains emerging-only", () => {
    const workspace = buildPharmaResearchWorkspaceModel(assignment, [], "2026-09-18")
    const plan = buildPharmaBusinessModelEvidenceAcquisitionPlan(workspace)
    expect(plan.items.some((item) => item.metricCode.startsWith("PHARMA_CDMO_"))).toBe(false)
  })
})
