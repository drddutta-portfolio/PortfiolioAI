import type { PharmaResearchWorkspaceModel } from "./pharmaResearchWorkspaceModel"

export const PHARMA_GATE_G_SCORING_METHOD_PROPOSAL_VERSION =
  "PHARMA_V1_GATE_G_SCORING_METHOD_PROPOSAL_V1" as const

export interface PharmaGateGDimensionWeight {
  readonly dimensionCode: string
  readonly weight: number
}

export interface PharmaGateGScoringRole {
  readonly code: string
  readonly displayName: string
  readonly role: "PRIMARY_SCORE_DRIVER" | "MATERIAL_EVIDENCE_OVERLAY" | "EMERGING_WATCH_EXCLUDED"
  readonly denominatorEffect: "INCLUDED" | "WITHIN_DIMENSION_ONLY" | "EXCLUDED"
  readonly note: string
}

export interface PharmaGateGScoringMethodProposal {
  readonly proposalVersion: typeof PHARMA_GATE_G_SCORING_METHOD_PROPOSAL_VERSION
  readonly profileCode: "PHARMA_V1"
  readonly state: "DESIGN_ONLY"
  readonly dimensionWeights: readonly PharmaGateGDimensionWeight[]
  readonly dimensionMinimumScoreReadyCoverage: 0.6
  readonly overallMinimumScoreReadyCoverage: 0.7
  readonly requiresEveryWeightedDimensionReady: true
  readonly primary: PharmaGateGScoringRole
  readonly overlays: readonly PharmaGateGScoringRole[]
  readonly curveApprovalState: "PENDING_APPROVAL"
  readonly scoreExecutionEnabled: false
  readonly recommendationEnabled: false
  readonly positionSizingEnabled: false
}

const PHARMA_V1_DIMENSION_WEIGHTS: readonly PharmaGateGDimensionWeight[] = [
  { dimensionCode: "QUALITY", weight: 13 },
  { dimensionCode: "GROWTH", weight: 15 },
  { dimensionCode: "CAPITAL_EFFICIENCY", weight: 10 },
  { dimensionCode: "CASH_FLOW", weight: 10 },
  { dimensionCode: "BALANCE_SHEET_CREDIT", weight: 10 },
  { dimensionCode: "BUSINESS_DURABILITY", weight: 10 },
  { dimensionCode: "VALUATION", weight: 12 },
  { dimensionCode: "MOMENTUM", weight: 8 },
  { dimensionCode: "OWNERSHIP_GOVERNANCE", weight: 6 },
  { dimensionCode: "RISK", weight: 6 },
]

export function buildPharmaGateGScoringMethodProposal(
  workspace: PharmaResearchWorkspaceModel,
): PharmaGateGScoringMethodProposal {
  const overlays = workspace.secondaries.flatMap((exposure): PharmaGateGScoringRole[] => {
    if (exposure.mode === "EVIDENCE_OVERLAY") {
      return [{
        code: exposure.exposureCode,
        displayName: exposure.displayName,
        role: "MATERIAL_EVIDENCE_OVERLAY",
        denominatorEffect: "WITHIN_DIMENSION_ONLY",
        note: "Material exposure may alter the approved evidence mix inside affected dimensions, but it does not create or blend a second stock score.",
      }]
    }
    if (exposure.mode === "EMERGING_WATCH") {
      return [{
        code: exposure.exposureCode,
        displayName: exposure.displayName,
        role: "EMERGING_WATCH_EXCLUDED",
        denominatorEffect: "EXCLUDED",
        note: "Emerging exposure remains visible for research but is excluded from score readiness and score denominator until an explicit emerging-specific scoring contract is versioned.",
      }]
    }
    return []
  })

  return {
    proposalVersion: PHARMA_GATE_G_SCORING_METHOD_PROPOSAL_VERSION,
    profileCode: "PHARMA_V1",
    state: "DESIGN_ONLY",
    dimensionWeights: PHARMA_V1_DIMENSION_WEIGHTS,
    dimensionMinimumScoreReadyCoverage: 0.6,
    overallMinimumScoreReadyCoverage: 0.7,
    requiresEveryWeightedDimensionReady: true,
    primary: {
      code: workspace.primary.subprofileCode,
      displayName: workspace.primary.displayName,
      role: "PRIMARY_SCORE_DRIVER",
      denominatorEffect: "INCLUDED",
      note: "The reviewed primary subprofile defines the core business-model scoring requirements inside the shared PHARMA_V1 dimensions.",
    },
    overlays,
    curveApprovalState: "PENDING_APPROVAL",
    scoreExecutionEnabled: false,
    recommendationEnabled: false,
    positionSizingEnabled: false,
  }
}
