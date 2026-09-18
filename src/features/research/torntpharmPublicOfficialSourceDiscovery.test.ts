import { describe, expect, it } from "vitest"
import type { PharmaSubprofileAssignment } from "./pharmaSubprofileAssignment"
import { buildPharmaBusinessModelEvidenceAcquisitionPlan } from "./pharmaBusinessModelEvidenceAcquisitionContract"
import { buildPharmaResearchWorkspaceModel } from "./pharmaResearchWorkspaceModel"
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

describe("TORNTPHARM public official source discovery", () => {
  it("maps all 12 public-official-first requirements without reviewing evidence", () => {
    const workspace = buildPharmaResearchWorkspaceModel(assignment, [], "2026-09-18")
    const acquisition = buildPharmaBusinessModelEvidenceAcquisitionPlan(workspace)
    const discovery = buildTorntpharmPublicOfficialSourceDiscoveryPlan(acquisition)
    expect(discovery.summary).toEqual({
      scopedRequirements: 12,
      mappedRequirements: 12,
      discoveredArtifacts: 8,
      issuerArtifacts: 6,
      regulatorArtifacts: 2,
      sourceHubs: 3,
    })
    expect(discovery.requirements.every((item) => item.discoveryState === "CANDIDATE_SOURCE_FOUND")).toBe(true)
    expect(discovery.requirements.every((item) => item.evidenceState === "NOT_REVIEWED")).toBe(true)
    expect(discovery.sourceFetchAuthorized).toBe(false)
    expect(discovery.ingestionAuthorized).toBe(false)
  })

  it("excludes licensed-gated requirements from the public discovery scope", () => {
    const workspace = buildPharmaResearchWorkspaceModel(assignment, [], "2026-09-18")
    const acquisition = buildPharmaBusinessModelEvidenceAcquisitionPlan(workspace)
    const discovery = buildTorntpharmPublicOfficialSourceDiscoveryPlan(acquisition)
    const codes = new Set(discovery.requirements.map((item) => item.metricCode))
    expect(codes.has("PHARMA_BRAND_THERAPY_LEADERSHIP")).toBe(false)
    expect(codes.has("PHARMA_CHRONIC_ACUTE_MIX")).toBe(false)
  })

  it("preserves both FDA action and closeout artifacts for current-state review", () => {
    const workspace = buildPharmaResearchWorkspaceModel(assignment, [], "2026-09-18")
    const acquisition = buildPharmaBusinessModelEvidenceAcquisitionPlan(workspace)
    const discovery = buildTorntpharmPublicOfficialSourceDiscoveryPlan(acquisition)
    const regulatory = discovery.requirements.find((item) => item.metricCode === "PHARMA_REGULATORY_SITE_STATUS")
    expect(regulatory?.candidateArtifactCodes).toEqual(expect.arrayContaining(["FDA_INDRA_WARNING_2019", "FDA_INDRA_CLOSEOUT_2024"]))
    expect(discovery.artifacts.find((item) => item.code === "FDA_INDRA_WARNING_2019")?.kind).toBe("REGULATORY_ACTION")
    expect(discovery.artifacts.find((item) => item.code === "FDA_INDRA_CLOSEOUT_2024")?.kind).toBe("REGULATORY_CLOSEOUT")
  })
})
