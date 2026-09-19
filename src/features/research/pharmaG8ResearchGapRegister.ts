import { AUROPHARMA_G8_2_SAME_ENGINE_PREVIEW_VERSION } from "./auropharmaG8SameEnginePreview"
import { PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION } from "./pharmaG6SubprofileCurveApplicability"
import { PHARMA_G7_RESEARCH_GAP_REGISTER } from "./pharmaG7ValidationAndResearchGapRegister"

export const PHARMA_G8_RESEARCH_GAP_REGISTER_VERSION =
  "PHARMA_V1_G8_RESEARCH_GAP_REGISTER_V1" as const

export type PharmaG8GapRole = "COMMON_CORE" | "PRIMARY" | "MATERIAL_OVERLAY" | "EMERGING_WATCH"
export type PharmaG8GapFutureStage = "CONTROLLED_EXPANSION" | "LATER_METHODOLOGY" | "EVIDENCE_ACQUISITION"

export interface PharmaG8ResearchGap {
  readonly gapId: string
  readonly affectedSubprofile: string
  readonly role: PharmaG8GapRole
  readonly dimension: string
  readonly methodologyState: string
  readonly evidenceState: string
  readonly blocksAuropharmaOverallPreview: boolean
  readonly blocksOverlayParticipation: boolean
  readonly futureStage: PharmaG8GapFutureStage
  readonly requiredEvidenceOrDecision: string
  readonly lineage: readonly string[]
  readonly revisitTrigger: string
}

export const AUROPHARMA_G8_RESEARCH_GAPS: readonly PharmaG8ResearchGap[] = [
  {
    gapId: "G8-GAP-AURO-GLOBAL-GROWTH-EVIDENCE",
    affectedSubprofile: "GLOBAL_GENERICS",
    role: "PRIMARY",
    dimension: "GROWTH",
    methodologyState: "VALIDATED_NOT_ACTIVE",
    evidenceState: "Current AUROPHARMA Primary growth evidence does not satisfy the reviewed requirement contract.",
    blocksAuropharmaOverallPreview: true,
    blocksOverlayParticipation: false,
    futureStage: "EVIDENCE_ACQUISITION",
    requiredEvidenceOrDecision: "Acquire reviewed AUROPHARMA Global Generics growth history under the existing metric contract.",
    lineage: [AUROPHARMA_G8_2_SAME_ENGINE_PREVIEW_VERSION, PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "Sufficient reviewed AUROPHARMA Global Generics growth observations become available.",
  },
  {
    gapId: "G8-GAP-AURO-GLOBAL-QUALITY",
    affectedSubprofile: "GLOBAL_GENERICS",
    role: "PRIMARY",
    dimension: "QUALITY",
    methodologyState: "VALIDATED_FAIL_CLOSED",
    evidenceState: "Global Generics operating-margin methodology exists but Global-specific numeric calibration is unavailable.",
    blocksAuropharmaOverallPreview: true,
    blocksOverlayParticipation: false,
    futureStage: "LATER_METHODOLOGY",
    requiredEvidenceOrDecision: "Approve Global Generics operating-margin calibration without importing Domestic bands.",
    lineage: [AUROPHARMA_G8_2_SAME_ENGINE_PREVIEW_VERSION, PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "Representative Global Generics operating-margin calibration evidence is sufficient.",
  },
  {
    gapId: "G8-GAP-AURO-GLOBAL-CAPITAL-EFFICIENCY",
    affectedSubprofile: "GLOBAL_GENERICS",
    role: "PRIMARY",
    dimension: "CAPITAL_EFFICIENCY",
    methodologyState: "VALIDATED_FAIL_CLOSED",
    evidenceState: "Global Generics ROCE calibration remains unavailable.",
    blocksAuropharmaOverallPreview: true,
    blocksOverlayParticipation: false,
    futureStage: "LATER_METHODOLOGY",
    requiredEvidenceOrDecision: "Approve Global Generics ROCE calibration and parent-dimension reconciliation.",
    lineage: [AUROPHARMA_G8_2_SAME_ENGINE_PREVIEW_VERSION, PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "Representative Global Generics ROCE calibration evidence is sufficient.",
  },
  {
    gapId: "G8-GAP-AURO-GLOBAL-CASH-FLOW",
    affectedSubprofile: "GLOBAL_GENERICS",
    role: "PRIMARY",
    dimension: "CASH_FLOW",
    methodologyState: "VALIDATED_FAIL_CLOSED",
    evidenceState: "Global Generics Cash Conversion calibration remains unavailable.",
    blocksAuropharmaOverallPreview: true,
    blocksOverlayParticipation: false,
    futureStage: "LATER_METHODOLOGY",
    requiredEvidenceOrDecision: "Approve Global Generics Cash Conversion calibration.",
    lineage: [AUROPHARMA_G8_2_SAME_ENGINE_PREVIEW_VERSION, PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "Representative Global Generics cash-conversion evidence is sufficient.",
  },
  {
    gapId: "G8-GAP-AURO-GLOBAL-BALANCE-SHEET",
    affectedSubprofile: "GLOBAL_GENERICS",
    role: "PRIMARY",
    dimension: "BALANCE_SHEET_CREDIT",
    methodologyState: "VALIDATED_FAIL_CLOSED",
    evidenceState: "Global Generics leverage/credit calibration remains unavailable.",
    blocksAuropharmaOverallPreview: true,
    blocksOverlayParticipation: false,
    futureStage: "LATER_METHODOLOGY",
    requiredEvidenceOrDecision: "Approve Global Generics balance-sheet/leverage calibration.",
    lineage: [AUROPHARMA_G8_2_SAME_ENGINE_PREVIEW_VERSION, PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "Representative Global Generics leverage calibration evidence is sufficient.",
  },
  {
    gapId: "G8-GAP-AURO-GLOBAL-BUSINESS-DURABILITY",
    affectedSubprofile: "GLOBAL_GENERICS",
    role: "PRIMARY",
    dimension: "BUSINESS_DURABILITY",
    methodologyState: "NO_APPROVED_DIMENSION_AGGREGATION",
    evidenceState: "Research requirements exist but no approved whole-dimension numeric aggregation exists.",
    blocksAuropharmaOverallPreview: true,
    blocksOverlayParticipation: false,
    futureStage: "LATER_METHODOLOGY",
    requiredEvidenceOrDecision: "Approve a versioned Global Generics Business Durability aggregation.",
    lineage: [AUROPHARMA_G8_2_SAME_ENGINE_PREVIEW_VERSION],
    revisitTrigger: "A defensible whole-dimension aggregation is proposed and validated.",
  },
  {
    gapId: "G8-GAP-AURO-GLOBAL-VALUATION",
    affectedSubprofile: "GLOBAL_GENERICS",
    role: "PRIMARY",
    dimension: "VALUATION",
    methodologyState: "VALIDATED_FAIL_CLOSED",
    evidenceState: "Global Generics valuation calibration remains unavailable.",
    blocksAuropharmaOverallPreview: true,
    blocksOverlayParticipation: false,
    futureStage: "LATER_METHODOLOGY",
    requiredEvidenceOrDecision: "Approve Global Generics valuation calibration; Domestic valuation choices must not transfer.",
    lineage: [AUROPHARMA_G8_2_SAME_ENGINE_PREVIEW_VERSION, PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "Global Generics valuation calibration evidence becomes sufficient.",
  },
  {
    gapId: "G8-GAP-AURO-GLOBAL-MOMENTUM",
    affectedSubprofile: "GLOBAL_GENERICS",
    role: "PRIMARY",
    dimension: "MOMENTUM",
    methodologyState: "VALIDATED_FAIL_CLOSED",
    evidenceState: "Pharma/Global Generics momentum benchmark, bands and aggregation remain incomplete.",
    blocksAuropharmaOverallPreview: true,
    blocksOverlayParticipation: false,
    futureStage: "LATER_METHODOLOGY",
    requiredEvidenceOrDecision: "Approve Pharma-compatible momentum benchmark, bands, weights and aggregation.",
    lineage: [AUROPHARMA_G8_2_SAME_ENGINE_PREVIEW_VERSION, PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "A Pharma momentum benchmark and calibration set are explicitly approved.",
  },
  {
    gapId: "G8-GAP-AURO-GLOBAL-OWNERSHIP-GOVERNANCE",
    affectedSubprofile: "GLOBAL_GENERICS",
    role: "PRIMARY",
    dimension: "OWNERSHIP_GOVERNANCE",
    methodologyState: "VALIDATED_FAIL_CLOSED",
    evidenceState: "Global Generics ownership/governance numeric calibration remains unavailable.",
    blocksAuropharmaOverallPreview: true,
    blocksOverlayParticipation: false,
    futureStage: "LATER_METHODOLOGY",
    requiredEvidenceOrDecision: "Approve Global Generics ownership/governance calibration while preserving G4 anti-double-counting.",
    lineage: [AUROPHARMA_G8_2_SAME_ENGINE_PREVIEW_VERSION, PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "Governance calibration can be separated from gate behavior without duplicate penalties.",
  },
  {
    gapId: "G8-GAP-AURO-GLOBAL-RISK",
    affectedSubprofile: "GLOBAL_GENERICS",
    role: "PRIMARY",
    dimension: "RISK",
    methodologyState: "VALIDATED_FAIL_CLOSED",
    evidenceState: "Global Generics regulatory/market-risk normalization remains incomplete.",
    blocksAuropharmaOverallPreview: true,
    blocksOverlayParticipation: false,
    futureStage: "LATER_METHODOLOGY",
    requiredEvidenceOrDecision: "Approve Pharma-specific regulatory/market-risk normalization without BANK_NBFC fallback.",
    lineage: [AUROPHARMA_G8_2_SAME_ENGINE_PREVIEW_VERSION, PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "Sufficient Pharma-specific regulatory/drawdown/volatility calibration exists.",
  },
] as const

export const PHARMA_G8_RESEARCH_GAP_REGISTER = {
  version: PHARMA_G8_RESEARCH_GAP_REGISTER_VERSION,
  extendsVersion: PHARMA_G7_RESEARCH_GAP_REGISTER.version,
  priorGaps: PHARMA_G7_RESEARCH_GAP_REGISTER.allGaps,
  auropharmaGaps: AUROPHARMA_G8_RESEARCH_GAPS,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
} as const
