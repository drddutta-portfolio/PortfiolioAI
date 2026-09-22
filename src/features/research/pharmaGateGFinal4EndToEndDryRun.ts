import {
  calculatePharmaG7ReadOnlyPreview,
  PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION,
  type PharmaG7DimensionAdapterInput,
  type PharmaG7DimensionCode,
} from "./pharmaG7ReadOnlyScoringAdapter"
import {
  PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION,
} from "./pharmaG7OverlayNumericModifierProposal"
import {
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
} from "./pharmaDomesticGateGFinal2NumericMethodology"
import {
  PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_VERSION,
} from "./pharmaDomesticValuationCombinedScoreContract"
import {
  PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL_VERSION,
} from "./pharmaOperatingMarginCurveProposal"
import {
  PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION,
} from "./pharmaSegmentGrowthCurveProposal"
import {
  TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY,
} from "./torntpharmGateGFinal2EvidenceSufficiency"
import {
  TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT,
} from "./torntpharmGateGFinal3RuntimeMapping"

export const PHARMA_GATE_G_FINAL_4_END_TO_END_DRY_RUN_VERSION =
  "PHARMA_GATE_G_FINAL_4_END_TO_END_DRY_RUN_V1" as const

const DIMENSIONS: readonly PharmaG7DimensionCode[] = [
  "QUALITY",
  "GROWTH",
  "CAPITAL_EFFICIENCY",
  "CASH_FLOW",
  "BALANCE_SHEET_CREDIT",
  "BUSINESS_DURABILITY",
  "VALUATION",
  "MOMENTUM",
  "OWNERSHIP_GOVERNANCE",
  "RISK",
]

const SYNTHETIC_PRIMARY_SCORES: Readonly<Record<PharmaG7DimensionCode, number>> = {
  QUALITY: 80,
  GROWTH: 75,
  CAPITAL_EFFICIENCY: 70,
  CASH_FLOW: 65,
  BALANCE_SHEET_CREDIT: 85,
  BUSINESS_DURABILITY: 72,
  VALUATION: 60,
  MOMENTUM: 78,
  OWNERSHIP_GOVERNANCE: 82,
  RISK: 68,
}

const SYNTHETIC_OVERLAY_MODIFIERS: Readonly<
  Partial<Record<PharmaG7DimensionCode, number>>
> = {
  GROWTH: 1,
  BUSINESS_DURABILITY: -0.5,
  RISK: 0.75,
}

function contractVersionForDimension(
  dimensionCode: PharmaG7DimensionCode,
): string {
  if (dimensionCode === "QUALITY") {
    return PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL_VERSION
  }
  if (dimensionCode === "GROWTH") {
    return PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION
  }
  if (dimensionCode === "VALUATION") {
    return PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_VERSION
  }
  return PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION
}

function syntheticInput(
  dimensionCode: PharmaG7DimensionCode,
): PharmaG7DimensionAdapterInput {
  const overlayModifier = SYNTHETIC_OVERLAY_MODIFIERS[dimensionCode]
  const overlayEligible = overlayModifier !== undefined

  return {
    dimensionCode,
    methodologyState: "APPROVED_NUMERIC_CONTRACT",
    readiness: {
      applicable: true,
      profileResolved: true,
      scoreReadyCoverage: 1,
      mandatoryBlockingConditionsSatisfied: true,
      reviewBlocked: false,
      overlayReadiness: overlayEligible ? "READY" : "NONE",
    },
    primaryScore: SYNTHETIC_PRIMARY_SCORES[dimensionCode],
    primaryScoreContractVersion: contractVersionForDimension(dimensionCode),
    overlayParticipation: overlayEligible ? "ELIGIBLE" : "NONE",
    overlayModifierPoints: overlayEligible ? overlayModifier : null,
    overlayModifierContractVersion: overlayEligible
      ? PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION
      : null,
    methodologyLineage: [{
      decisionId: `G_FINAL_4_SYNTHETIC_${dimensionCode}`,
      contractVersion: contractVersionForDimension(dimensionCode),
    }],
  }
}

export const PHARMA_GATE_G_FINAL_4_SYNTHETIC_DRY_RUN =
  calculatePharmaG7ReadOnlyPreview({
    profileResolved: true,
    commonCoreState: "READY",
    primaryState: "READY",
    overallScoreReadyCoverage: 1,
    governanceInput: {
      eventClass: "GOVERNANCE",
      severity: "LOW",
      governanceBlockedReview: false,
      affectedFacilityProductGeographyEstablished: true,
      regulatoryMateriality: "NOT_APPLICABLE",
      remediationState: "NOT_APPLICABLE",
      subsequentOutcomeEstablished: true,
    },
    dimensions: DIMENSIONS.map(syntheticInput),
  })

export const PHARMA_GATE_G_FINAL_4_HAND_CHECK = {
  dimensionContributions: [
    { dimensionCode: "QUALITY", finalScore: 80, weightPercent: 13, contribution: 10.4 },
    { dimensionCode: "GROWTH", finalScore: 76, weightPercent: 15, contribution: 11.4 },
    { dimensionCode: "CAPITAL_EFFICIENCY", finalScore: 70, weightPercent: 10, contribution: 7 },
    { dimensionCode: "CASH_FLOW", finalScore: 65, weightPercent: 10, contribution: 6.5 },
    { dimensionCode: "BALANCE_SHEET_CREDIT", finalScore: 85, weightPercent: 10, contribution: 8.5 },
    { dimensionCode: "BUSINESS_DURABILITY", finalScore: 71.5, weightPercent: 10, contribution: 7.15 },
    { dimensionCode: "VALUATION", finalScore: 60, weightPercent: 12, contribution: 7.2 },
    { dimensionCode: "MOMENTUM", finalScore: 78, weightPercent: 8, contribution: 6.24 },
    { dimensionCode: "OWNERSHIP_GOVERNANCE", finalScore: 82, weightPercent: 6, contribution: 4.92 },
    { dimensionCode: "RISK", finalScore: 68.75, weightPercent: 6, contribution: 4.125 },
  ] as const,
  expectedOverallScore: 73.435,
  hiddenReweightingUsed: false,
  secondStockScoreCreated: false,
} as const

export const TORNTPHARM_GATE_G_FINAL_4_CURRENT_STATE_DRY_RUN = {
  version: PHARMA_GATE_G_FINAL_4_END_TO_END_DRY_RUN_VERSION,
  securitySymbol: "TORNTPHARM" as const,
  adapterVersion: PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION,
  methodologyState: "ENGINE_CONTRACT_COMPLETE_CANDIDATE" as const,
  evidenceState: {
    gFinal2EvidenceContractVersion:
      TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY.version,
    allSevenGFinal2DimensionsScoreReady:
      TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY
        .allSevenDimensionsScoreReady,
    governanceRuntimeState:
      TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT.gateState,
  },
  overallPreviewState: "NOT_CURRENTLY_COMPUTABLE" as const,
  overallScore: null,
  reasonCodes: [
    "CURRENT_TORNTPHARM_EVIDENCE_NOT_SUFFICIENT_FOR_ALL_TEN_NUMERIC_DIMENSIONS",
    "GOVERNANCE_RUNTIME_REVIEW_REQUIRED",
    "NO_MISSING_DIMENSION_RENORMALIZATION",
    "NO_MISSING_EVIDENCE_NEUTRALIZATION",
    "NO_SCORE_PERSISTENCE",
  ] as const,
  gateGEngineContractReproducible: true,
  firstTorntpharmDeterministicScoreReady: false,
  gateHEntryState: "FAIL_CLOSED_EVIDENCE_COMPLETION_REQUIRED" as const,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
  recommendationEnabled: false,
  positionSizingEnabled: false,
} as const

export const PHARMA_GATE_G_FINAL_4_CLOSURE_CANDIDATE = {
  version: PHARMA_GATE_G_FINAL_4_END_TO_END_DRY_RUN_VERSION,
  state: "READY_FOR_OWNER_VALIDATION" as const,
  syntheticEngineDryRunReady:
    PHARMA_GATE_G_FINAL_4_SYNTHETIC_DRY_RUN.overallPreviewState === "READY",
  syntheticOverallScore:
    PHARMA_GATE_G_FINAL_4_SYNTHETIC_DRY_RUN.overallScore,
  handCheckExpectedOverallScore:
    PHARMA_GATE_G_FINAL_4_HAND_CHECK.expectedOverallScore,
  torntpharmCurrentScoreAvailable: false,
  torntpharmFailClosedState:
    TORNTPHARM_GATE_G_FINAL_4_CURRENT_STATE_DRY_RUN.gateHEntryState,
  gateGClosureEligibleCandidate: true,
  gateHFirstScoreReady: false,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
  recommendationEnabled: false,
  positionSizingEnabled: false,
} as const
