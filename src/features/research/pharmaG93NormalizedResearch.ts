import { AUROPHARMA_G8_1_CLASSIFICATION_REVIEW } from "./auropharmaG8ClassificationEvidence"
import { PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT } from "./pharmaAdaptiveClassificationContract"
import { PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT } from "./pharmaGovernanceRegulatoryGateContract"
import { buildPharmaGateGScoringMethodProposal } from "./pharmaGateGScoringMethodProposal"
import { PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT } from "./pharmaG7GovernanceHighRiskConstraint"
import { PHARMA_G7_OVERLAY_NUMERIC_MODIFIER } from "./pharmaG7OverlayNumericModifierProposal"
import { PHARMA_G7_READ_ONLY_SCORING_ADAPTER } from "./pharmaG7ReadOnlyScoringAdapter"
import { PHARMA_OVERLAY_MODIFIER_CONTRACT } from "./pharmaOverlayModifierContract"
import { PHARMA_READINESS_MAPPING_CONTRACT } from "./pharmaReadinessMappingContract"
import { buildPharmaThreeLayerResearchArchitecture } from "./pharmaThreeLayerResearchArchitecture"
import type { PharmaSubprofileAssignment } from "./pharmaSubprofileAssignment"
import { buildPharmaResearchWorkspaceModel } from "./pharmaResearchWorkspaceModel"
import { buildTorntpharmG7ExplainablePreview } from "./pharmaTorntpharmG7ExplainablePreview"
import type { ResearchMetric } from "./types"

export const PHARMA_G9_3_NORMALIZED_RESEARCH_VERSION =
  "PHARMA_V1_G9_3_NORMALIZED_RESEARCH_V1" as const

export type PharmaMethodologyEngagementState =
  | "ENGAGED"
  | "NOT_ENGAGED"
  | "APPLICABLE"
  | "DESIGN_ONLY"
  | "FAIL_CLOSED"

export interface PharmaSharedMethodologyItem {
  readonly code: "GATE_G" | "G1" | "G2" | "G3" | "G4" | "G7_P1" | "G7_P2" | "G7_1"
  readonly title: string
  readonly contractVersion: string
  readonly state: PharmaMethodologyEngagementState
  readonly note: string
}

export interface PharmaG93NormalizedResearchModel {
  readonly version: typeof PHARMA_G9_3_NORMALIZED_RESEARCH_VERSION
  readonly architecture: ReturnType<typeof buildPharmaThreeLayerResearchArchitecture>
  readonly methodology: readonly PharmaSharedMethodologyItem[]
  readonly materialOverlayState: "ENGAGED" | "NOT_ENGAGED"
  readonly scoreExecutionEnabled: false
  readonly recommendationEnabled: false
  readonly positionSizingEnabled: false
}

function unresolvedForSymbol(symbol: string) {
  if (symbol.toLocaleUpperCase() !== "AUROPHARMA") return []
  return AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.unresolvedExposures.map(
    (exposureCode) => ({
      exposureCode,
      reasonCode: "NO_REVENUE_OR_PROFIT_SHARE",
    }),
  )
}

export function buildPharmaG93NormalizedResearchModel(
  symbol: string,
  assignment: PharmaSubprofileAssignment,
  metrics: readonly ResearchMetric[],
  evaluationDate: string,
): PharmaG93NormalizedResearchModel {
  const workspace = buildPharmaResearchWorkspaceModel(
    assignment,
    metrics,
    evaluationDate,
  )
  const architecture = buildPharmaThreeLayerResearchArchitecture(
    assignment,
    metrics,
    evaluationDate,
    unresolvedForSymbol(symbol),
  )
  const gateG = buildPharmaGateGScoringMethodProposal(workspace)
  const materialOverlay = workspace.secondaries.find(
    (item) => item.mode === "EVIDENCE_OVERLAY",
  )
  const materialOverlayState = materialOverlay ? "ENGAGED" : "NOT_ENGAGED"

  const methodology: readonly PharmaSharedMethodologyItem[] = [
    {
      code: "GATE_G",
      title: "Gate G · Shared scoring architecture",
      contractVersion: gateG.proposalVersion,
      state: "DESIGN_ONLY",
      note: `${gateG.dimensionWeights.length} weighted PHARMA_V1 dimensions · ${Math.round(gateG.dimensionMinimumScoreReadyCoverage * 100)}% dimension gate · no score execution.`,
    },
    {
      code: "G1",
      title: "G1 · Adaptive classification",
      contractVersion: PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.version,
      state: "APPLICABLE",
      note: "Primary, Material Overlay and Emerging Watch roles remain evidence-backed, effective-dated and fail-closed.",
    },
    {
      code: "G2",
      title: "G2 · Overlay modifier",
      contractVersion: PHARMA_OVERLAY_MODIFIER_CONTRACT.version,
      state: materialOverlayState,
      note: materialOverlay
        ? `${materialOverlay.displayName} is the reviewed Material Overlay; participation remains within affected dimensions only.`
        : "No reviewed Material Overlay exists in the active company architecture, so the overlay contract is not engaged.",
    },
    {
      code: "G3",
      title: "G3 · Readiness mapping",
      contractVersion: PHARMA_READINESS_MAPPING_CONTRACT.version,
      state: "APPLICABLE",
      note: "Readiness remains company + active assignment + role scoped; Emerging watches stay outside the score/readiness denominator.",
    },
    {
      code: "G4",
      title: "G4 · Governance / regulatory gate",
      contractVersion: PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT.version,
      state: "APPLICABLE",
      note: "Governance and regulatory events remain explicit gating inputs rather than hidden score penalties.",
    },
    {
      code: "G7_P1",
      title: "G7-P1 · Material Overlay numeric modifier",
      contractVersion: PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.version,
      state: materialOverlayState,
      note: materialOverlay
        ? "Material Overlay modifier participation is available subject to evidence/readiness and the validated combined cap."
        : "NOT ENGAGED: no reviewed Material Overlay exists, so no zero/default modifier is emitted.",
    },
    {
      code: "G7_P2",
      title: "G7-P2 · Governance high-risk constraint",
      contractVersion: PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.version,
      state: "FAIL_CLOSED",
      note: "Blocking governance states remain blocking; hidden double-counting stays prohibited.",
    },
    {
      code: "G7_1",
      title: "G7.1 · Read-only scoring adapter",
      contractVersion: PHARMA_G7_READ_ONLY_SCORING_ADAPTER.version,
      state: "APPLICABLE",
      note: "One shared read-only adapter consumes approved numeric dimension results only; no persistence or hidden reweighting.",
    },
  ]

  return {
    version: PHARMA_G9_3_NORMALIZED_RESEARCH_VERSION,
    architecture,
    methodology,
    materialOverlayState,
    scoreExecutionEnabled: false,
    recommendationEnabled: false,
    positionSizingEnabled: false,
  }
}

export interface TorntpharmSemanticSnapshot {
  readonly primary: string
  readonly secondaries: readonly {
    readonly code: string
    readonly materiality: string
    readonly mode: string
  }[]
  readonly previewState: string
  readonly overallScore: number | null
  readonly rows: readonly {
    readonly dimensionCode: string
    readonly methodologyState: string
    readonly calculationState: string
    readonly primaryEvidenceVerified: number
    readonly primaryEvidenceTotal: number
    readonly overlayState: string
    readonly primaryScore: number | null
    readonly overlayModifierPoints: number | null
    readonly finalScore: number | null
    readonly reasonCodes: readonly string[]
  }[]
  readonly reasonCodes: readonly string[]
}

export function buildTorntpharmLegacySemanticSnapshot(
  assignment: PharmaSubprofileAssignment,
  metrics: readonly ResearchMetric[],
  evaluationDate: string,
): TorntpharmSemanticSnapshot {
  const workspace = buildPharmaResearchWorkspaceModel(
    assignment,
    metrics,
    evaluationDate,
  )
  const preview = buildTorntpharmG7ExplainablePreview(workspace)
  return {
    primary: workspace.primary.subprofileCode,
    secondaries: workspace.secondaries.map((item) => ({
      code: item.exposureCode,
      materiality: item.materiality,
      mode: item.mode,
    })),
    previewState: preview.overallPreviewState,
    overallScore: preview.overallScore,
    rows: preview.rows.map((row) => ({
      dimensionCode: row.dimensionCode,
      methodologyState: row.methodologyState,
      calculationState: row.calculationState,
      primaryEvidenceVerified: row.primaryEvidenceVerified,
      primaryEvidenceTotal: row.primaryEvidenceTotal,
      overlayState: row.overlayState,
      primaryScore: row.primaryScore,
      overlayModifierPoints: row.overlayModifierPoints,
      finalScore: row.finalScore,
      reasonCodes: row.reasonCodes,
    })),
    reasonCodes: preview.reasonCodes,
  }
}

export function buildTorntpharmNormalizedSemanticSnapshot(
  assignment: PharmaSubprofileAssignment,
  metrics: readonly ResearchMetric[],
  evaluationDate: string,
): TorntpharmSemanticSnapshot {
  const normalized = buildPharmaG93NormalizedResearchModel(
    "TORNTPHARM",
    assignment,
    metrics,
    evaluationDate,
  )
  const workspace = buildPharmaResearchWorkspaceModel(
    assignment,
    metrics,
    evaluationDate,
  )
  const preview = buildTorntpharmG7ExplainablePreview(workspace)

  return {
    primary: normalized.architecture.primary.subprofileCode,
    secondaries: normalized.architecture.secondaryExposures.map((item) => ({
      code: item.exposureCode,
      materiality: item.materiality,
      mode: item.mode,
    })),
    previewState: preview.overallPreviewState,
    overallScore: preview.overallScore,
    rows: preview.rows.map((row) => ({
      dimensionCode: row.dimensionCode,
      methodologyState: row.methodologyState,
      calculationState: row.calculationState,
      primaryEvidenceVerified: row.primaryEvidenceVerified,
      primaryEvidenceTotal: row.primaryEvidenceTotal,
      overlayState: row.overlayState,
      primaryScore: row.primaryScore,
      overlayModifierPoints: row.overlayModifierPoints,
      finalScore: row.finalScore,
      reasonCodes: row.reasonCodes,
    })),
    reasonCodes: preview.reasonCodes,
  }
}
