import { describe, expect, it } from "vitest"
import type { PharmaSubprofileAssignment } from "./pharmaSubprofileAssignment"
import { buildPharmaBusinessModelEvidenceAcquisitionPlan } from "./pharmaBusinessModelEvidenceAcquisitionContract"
import { buildPharmaResearchWorkspaceModel } from "./pharmaResearchWorkspaceModel"
import { buildTorntpharmArtifactContentReviewPlan } from "./torntpharmArtifactContentReviewPlan"
import { buildTorntpharmPublicOfficialSourceDiscoveryPlan } from "./torntpharmPublicOfficialSourceDiscovery"

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

function plan() {
  const workspace = buildPharmaResearchWorkspaceModel(assignment, [], "2026-09-18")
  const acquisition = buildPharmaBusinessModelEvidenceAcquisitionPlan(workspace)
  const discovery = buildTorntpharmPublicOfficialSourceDiscoveryPlan(acquisition)
  return buildTorntpharmArtifactContentReviewPlan(acquisition, discovery)
}

describe("TORNTPHARM artifact content review planning", () => {
  it("enumerates exact documents while keeping evidence fully unreviewed", () => {
    const result = plan()
    expect(result.summary).toEqual({
      exactArtifactsPlanned: 12,
      annualReports: 4,
      quarterlyReleases: 5,
      regulatorDocuments: 2,
      exchangeFilings: 1,
      requirementsPlanned: 12,
      minimumPlanningCovered: 12,
      preferredPlanningCovered: 5,
      evidenceReviewed: 0,
    })
    expect(result.artifacts.every((item) => item.reviewState === "NOT_REVIEWED")).toBe(true)
    expect(result.requirements.every((item) => item.evidenceState === "NOT_REVIEWED")).toBe(true)
  })

  it("keeps candidate planning coverage separate from reviewed-evidence gaps", () => {
    const result = plan()
    const exportGrowth = result.requirements.find((item) => item.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH")
    expect(exportGrowth?.planningCoverageCount).toBe(5)
    expect(exportGrowth?.minimumPlanningGap).toBe(0)
    expect(exportGrowth?.preferredPlanningGap).toBe(3)
    expect(exportGrowth?.reviewedObservationCount).toBe(0)
    expect(exportGrowth?.minimumReviewedEvidenceGap).toBe(4)
  })

  it("preserves conservative relevance for disclosure-sensitive metrics", () => {
    const result = plan()
    const price = result.requirements.find((item) => item.metricCode === "PHARMA_US_GENERIC_PRICE_EROSION")
    const fieldForce = result.requirements.find((item) => item.metricCode === "PHARMA_FIELD_FORCE_PRODUCTIVITY")
    expect(price?.likelyArtifactCount).toBe(0)
    expect(price?.possibleArtifactCount).toBe(5)
    expect(fieldForce?.possibleArtifactCount).toBeGreaterThan(0)
  })

  it("does not authorize content fetch, evidence review, or ingestion", () => {
    const result = plan()
    expect(result.contentFetchAuthorized).toBe(false)
    expect(result.evidenceReviewAuthorized).toBe(false)
    expect(result.ingestionAuthorized).toBe(false)
  })
})
