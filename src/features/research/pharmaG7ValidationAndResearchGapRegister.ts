import {
  PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY,
  PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION,
} from "./pharmaG6SubprofileCurveApplicability"
import {
  PHARMA_G7_READ_ONLY_SCORING_ADAPTER,
  PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION,
} from "./pharmaG7ReadOnlyScoringAdapter"
import {
  PHARMA_G7_OVERLAY_NUMERIC_MODIFIER,
  PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION,
} from "./pharmaG7OverlayNumericModifierProposal"
import {
  PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT,
  PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_VERSION,
} from "./pharmaG7GovernanceHighRiskConstraint"
import {
  TORNTPHARM_G7_EXPLAINABLE_PREVIEW_VERSION,
} from "./pharmaTorntpharmG7ExplainablePreview"

export const PHARMA_G7_RESEARCH_GAP_REGISTER_VERSION =
  "PHARMA_V1_G7_RESEARCH_GAP_REGISTER_V1_PROPOSAL" as const

export type PharmaG7GapCategory =
  | "METHODOLOGY"
  | "CALIBRATION"
  | "EVIDENCE_RUNTIME_MAPPING"
  | "CONTROLLED_EXPANSION"

export type PharmaG7FutureStage =
  | "G8"
  | "CONTROLLED_EXPANSION"
  | "LATER_METHODOLOGY"

export interface PharmaG7ResearchGap {
  readonly gapId: string
  readonly category: PharmaG7GapCategory
  readonly subprofile: string
  readonly dimension: string
  readonly researchGap: string
  readonly methodologyState: string
  readonly evidenceState: string
  readonly blocksTorntpharmOverallPreview: boolean
  readonly blocksOverlayModifier: boolean
  readonly blocksSubprofileAsPrimary: boolean
  readonly futureStage: PharmaG7FutureStage
  readonly requiredEvidenceOrDecision: string
  readonly decisionLineage: readonly string[]
  readonly revisitTrigger: string
}

const torntpharmGaps: readonly PharmaG7ResearchGap[] = [
  {
    gapId: "G7-GAP-TORN-GOVERNANCE-RUNTIME",
    category: "EVIDENCE_RUNTIME_MAPPING",
    subprofile: "DOMESTIC_FORMULATIONS",
    dimension: "OWNERSHIP_GOVERNANCE/RISK",
    researchGap: "Canonical runtime G4 governance/regulatory input is not fully resolved for TORNTPHARM.",
    methodologyState: "RUNTIME_INPUT_UNRESOLVED",
    evidenceState: "Reviewed site-specific regulatory-event evidence exists, but complete severity/materiality/remediation runtime mapping is absent.",
    blocksTorntpharmOverallPreview: true,
    blocksOverlayModifier: false,
    blocksSubprofileAsPrimary: false,
    futureStage: "G8",
    requiredEvidenceOrDecision: "Versioned mapping from reviewed governance/regulatory evidence to the complete G4 runtime input.",
    decisionLineage: ["G4", "G7-P2", TORNTPHARM_G7_EXPLAINABLE_PREVIEW_VERSION],
    revisitTrigger: "Canonical G4 runtime input becomes available from reviewed evidence.",
  },
  {
    gapId: "G7-GAP-DOMESTIC-BUSINESS-DURABILITY",
    category: "METHODOLOGY",
    subprofile: "DOMESTIC_FORMULATIONS",
    dimension: "BUSINESS_DURABILITY",
    researchGap: "No approved numeric Business Durability dimension aggregation exists.",
    methodologyState: "NO_APPROVED_DIMENSION_AGGREGATION",
    evidenceState: "Research requirements exist, but no approved whole-dimension numeric aggregation contract is available.",
    blocksTorntpharmOverallPreview: true,
    blocksOverlayModifier: true,
    blocksSubprofileAsPrimary: true,
    futureStage: "G8",
    requiredEvidenceOrDecision: "Approve a versioned Business Durability dimension aggregation before emitting a numeric score.",
    decisionLineage: ["G7.1", "G7.2"],
    revisitTrigger: "A defensible dimension aggregation is proposed and validated against a reference company.",
  },
  {
    gapId: "G7-GAP-DOMESTIC-ROCE",
    category: "CALIBRATION",
    subprofile: "DOMESTIC_FORMULATIONS",
    dimension: "CAPITAL_EFFICIENCY",
    researchGap: "Domestic Formulations ROCE/Capital Efficiency thresholds remain unapproved.",
    methodologyState: "SUBPROFILE_THRESHOLDS_REQUIRED",
    evidenceState: "Common framework exists; Primary-specific numeric thresholds do not.",
    blocksTorntpharmOverallPreview: true,
    blocksOverlayModifier: false,
    blocksSubprofileAsPrimary: true,
    futureStage: "G8",
    requiredEvidenceOrDecision: "Domestic-specific ROCE calibration and versioned numeric thresholds.",
    decisionLineage: ["G5.1", PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "Representative Domestic Formulations calibration evidence is sufficient.",
  },
  {
    gapId: "G7-GAP-DOMESTIC-CASH-CONVERSION",
    category: "CALIBRATION",
    subprofile: "DOMESTIC_FORMULATIONS",
    dimension: "CASH_FLOW",
    researchGap: "Domestic Formulations Cash Conversion thresholds remain unapproved.",
    methodologyState: "SUBPROFILE_THRESHOLDS_REQUIRED",
    evidenceState: "Common framework exists; Primary-specific numeric thresholds do not.",
    blocksTorntpharmOverallPreview: true,
    blocksOverlayModifier: false,
    blocksSubprofileAsPrimary: true,
    futureStage: "G8",
    requiredEvidenceOrDecision: "Domestic-specific Cash Conversion calibration and versioned numeric thresholds.",
    decisionLineage: ["G5.2", PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "Representative Domestic Formulations cash-conversion history is sufficient.",
  },
  {
    gapId: "G7-GAP-DOMESTIC-BALANCE-SHEET",
    category: "CALIBRATION",
    subprofile: "DOMESTIC_FORMULATIONS",
    dimension: "BALANCE_SHEET_CREDIT",
    researchGap: "Domestic Formulations Balance Sheet / Leverage thresholds remain unapproved.",
    methodologyState: "SUBPROFILE_THRESHOLDS_REQUIRED",
    evidenceState: "Common framework exists; Primary-specific numeric thresholds do not.",
    blocksTorntpharmOverallPreview: true,
    blocksOverlayModifier: false,
    blocksSubprofileAsPrimary: true,
    futureStage: "G8",
    requiredEvidenceOrDecision: "Domestic-specific leverage/credit calibration and versioned thresholds.",
    decisionLineage: ["G5.3", PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "Representative Domestic balance-sheet calibration evidence is sufficient.",
  },
  {
    gapId: "G7-GAP-DOMESTIC-OWNERSHIP-GOVERNANCE",
    category: "CALIBRATION",
    subprofile: "DOMESTIC_FORMULATIONS",
    dimension: "OWNERSHIP_GOVERNANCE",
    researchGap: "Domestic Formulations Ownership/Governance numeric thresholds remain unapproved.",
    methodologyState: "SUBPROFILE_THRESHOLDS_REQUIRED",
    evidenceState: "Framework and anti-double-counting rules exist; mechanical scoring thresholds do not.",
    blocksTorntpharmOverallPreview: true,
    blocksOverlayModifier: false,
    blocksSubprofileAsPrimary: true,
    futureStage: "G8",
    requiredEvidenceOrDecision: "Versioned numeric Ownership/Governance calibration that preserves G4 anti-double-counting.",
    decisionLineage: ["G4", "G5.5", PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "Governance calibration can be separated from gate behavior without duplicate penalties.",
  },
  {
    gapId: "G7-GAP-PHARMA-RISK-BANDS",
    category: "CALIBRATION",
    subprofile: "PHARMA_V1",
    dimension: "RISK",
    researchGap: "Pharma regulatory/market-risk bands remain unapproved.",
    methodologyState: "SUBPROFILE_THRESHOLDS_REQUIRED",
    evidenceState: "Risk evidence lanes exist; Pharma market-risk numeric normalization remains incomplete.",
    blocksTorntpharmOverallPreview: true,
    blocksOverlayModifier: true,
    blocksSubprofileAsPrimary: true,
    futureStage: "G8",
    requiredEvidenceOrDecision: "Approve Pharma-specific risk normalization/bands without importing BANK_NBFC rules.",
    decisionLineage: ["G4", "G5.6", PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "Sufficient Pharma-specific drawdown/volatility/regulatory calibration exists.",
  },
  {
    gapId: "G7-GAP-PHARMA-MOMENTUM",
    category: "METHODOLOGY",
    subprofile: "PHARMA_V1",
    dimension: "MOMENTUM",
    researchGap: "Dedicated Pharma Momentum benchmark, bands, weights and aggregation remain unapproved.",
    methodologyState: "SUBPROFILE_THRESHOLDS_REQUIRED",
    evidenceState: "Price-history metric identities exist; approved Pharma benchmark and scoring contract do not.",
    blocksTorntpharmOverallPreview: true,
    blocksOverlayModifier: false,
    blocksSubprofileAsPrimary: true,
    futureStage: "G8",
    requiredEvidenceOrDecision: "Approve Pharma benchmark, numeric bands, component weights and aggregation.",
    decisionLineage: ["G5.7", PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
    revisitTrigger: "A Pharma benchmark and calibration set are explicitly approved.",
  },
]

const controlledExpansionSubprofiles = [
  "API_BULK_DRUGS",
  "CDMO_CRAMS",
  "BIOPHARMA_BIOSIMILARS",
] as const

const controlledExpansionGaps: readonly PharmaG7ResearchGap[] =
  controlledExpansionSubprofiles.flatMap((subprofile) => {
    const contract = PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY[subprofile]
    const unresolved = contract.entries.filter(
      (entry) =>
        entry.state === "SUBPROFILE_THRESHOLDS_REQUIRED"
        || entry.state === "UNSUPPORTED_FAIL_CLOSED",
    )

    return unresolved.map((entry): PharmaG7ResearchGap => ({
      gapId: `G7-GAP-${subprofile}-${entry.family}`,
      category: "CONTROLLED_EXPANSION",
      subprofile,
      dimension: entry.family,
      researchGap: entry.note,
      methodologyState: entry.state,
      evidenceState: entry.curveVersion === null ? "No approved numeric curve version." : "Curve version exists.",
      blocksTorntpharmOverallPreview: false,
      blocksOverlayModifier: false,
      blocksSubprofileAsPrimary: true,
      futureStage: "CONTROLLED_EXPANSION",
      requiredEvidenceOrDecision: "Complete this subprofile's own reference-company methodology; no Domestic/Global threshold transfer.",
      decisionLineage: [PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION],
      revisitTrigger: `${subprofile} is selected as a reviewed Primary reference company.`,
    }))
  })

export const PHARMA_G7_RESEARCH_GAP_REGISTER = {
  version: PHARMA_G7_RESEARCH_GAP_REGISTER_VERSION,
  state: "PROPOSAL_ONLY",
  torntpharmGaps,
  controlledExpansionGaps,
  allGaps: [...torntpharmGaps, ...controlledExpansionGaps],
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
} as const

export const PHARMA_G7_VALIDATION_INVARIANTS = {
  version: "PHARMA_V1_G7_VALIDATION_INVARIANTS_V1_PROPOSAL",
  readOnlyAdapterVersion: PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION,
  overlayContractVersion: PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION,
  governanceContractVersion: PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_VERSION,
  hiddenReweightingAllowed: PHARMA_G7_READ_ONLY_SCORING_ADAPTER.hiddenReweightingAllowed,
  overlayIndependentCapStackingAllowed:
    PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.independentOverlayCapStackingAllowed,
  governanceHiddenDoubleCountingAllowed:
    PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.hiddenDoubleCountingAllowed,
  bankNbfcFallbackAllowed: false,
  domesticThresholdTransferAllowed: false,
  emergingWatchMayEnterOverlayEvidencePool: false,
  emergingWatchMayEnterScore: false,
  secondOverlayStockScoreAllowed: false,
  scorePersistenceAllowed: false,
} as const
