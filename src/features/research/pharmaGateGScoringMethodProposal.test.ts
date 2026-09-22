import { describe, expect, it } from "vitest"
import { buildPharmaGateGScoringMethodProposal } from "./pharmaGateGScoringMethodProposal"
import type { PharmaResearchWorkspaceModel } from "./pharmaResearchWorkspaceModel"

const workspace: PharmaResearchWorkspaceModel = {
  primary: {
    subprofileCode: "DOMESTIC_FORMULATIONS",
    displayName: "Domestic Formulations",
    confidence: "HIGH",
    effectiveFrom: "2026-03-31",
    requirements: [],
    verified: 0,
    unavailable: 0,
    reviewAttention: 0,
  },
  secondaries: [
    {
      exposureCode: "GLOBAL_GENERICS",
      displayName: "Global Generics",
      materiality: "MATERIAL",
      confidence: "MEDIUM",
      mode: "EVIDENCE_OVERLAY",
      note: "Material overlay",
      requirements: [],
    },
    {
      exposureCode: "CDMO_CRAMS",
      displayName: "CDMO / CRAMS",
      materiality: "EMERGING",
      confidence: "MEDIUM",
      mode: "EMERGING_WATCH",
      note: "Emerging watch",
      requirements: [],
    },
  ],
  scoringState: "UNAPPROVED",
}

describe("Gate G Pharma scoring methodology proposal", () => {
  it("preserves the current ten-dimension PHARMA_V1 weight contract", () => {
    const proposal = buildPharmaGateGScoringMethodProposal(workspace)
    expect(proposal.dimensionWeights).toHaveLength(10)
    expect(proposal.dimensionWeights.reduce((sum, row) => sum + row.weight, 0)).toBe(100)
    expect(proposal.dimensionWeights).toContainEqual({ dimensionCode: "BUSINESS_DURABILITY", weight: 10 })
  })

  it("preserves existing score-readiness safety gates", () => {
    const proposal = buildPharmaGateGScoringMethodProposal(workspace)
    expect(proposal.dimensionMinimumScoreReadyCoverage).toBe(0.6)
    expect(proposal.overallMinimumScoreReadyCoverage).toBe(0.7)
    expect(proposal.requiresEveryWeightedDimensionReady).toBe(true)
  })

  it("uses the primary subprofile as the scoring driver", () => {
    const proposal = buildPharmaGateGScoringMethodProposal(workspace)
    expect(proposal.primary.code).toBe("DOMESTIC_FORMULATIONS")
    expect(proposal.primary.role).toBe("PRIMARY_SCORE_DRIVER")
    expect(proposal.primary.denominatorEffect).toBe("INCLUDED")
  })

  it("keeps a material overlay inside affected dimensions without blending a second score", () => {
    const proposal = buildPharmaGateGScoringMethodProposal(workspace)
    const overlay = proposal.overlays.find((item) => item.code === "GLOBAL_GENERICS")
    expect(overlay?.role).toBe("MATERIAL_EVIDENCE_OVERLAY")
    expect(overlay?.denominatorEffect).toBe("WITHIN_DIMENSION_ONLY")
  })

  it("excludes emerging watches from score readiness and denominator", () => {
    const proposal = buildPharmaGateGScoringMethodProposal(workspace)
    const emerging = proposal.overlays.find((item) => item.code === "CDMO_CRAMS")
    expect(emerging?.role).toBe("EMERGING_WATCH_EXCLUDED")
    expect(emerging?.denominatorEffect).toBe("EXCLUDED")
  })

  it("cannot execute scores or downstream portfolio decisions", () => {
    const proposal = buildPharmaGateGScoringMethodProposal(workspace)
    expect(proposal.curveApprovalState).toBe("PENDING_APPROVAL")
    expect(proposal.scoreExecutionEnabled).toBe(false)
    expect(proposal.recommendationEnabled).toBe(false)
    expect(proposal.positionSizingEnabled).toBe(false)
  })
})
