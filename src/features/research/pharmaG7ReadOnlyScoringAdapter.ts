import {
  PHARMA_GATE_G_SCORING_METHOD_PROPOSAL_VERSION,
  PHARMA_V1_DIMENSION_WEIGHTS,
} from "./pharmaGateGScoringMethodProposal"
import {
  mapPharmaDimensionReadiness,
  mapPharmaOverallReadiness,
  PHARMA_READINESS_MAPPING_CONTRACT_VERSION,
  type PharmaDimensionReadinessInput,
  type PharmaVisibleReadinessState,
} from "./pharmaReadinessMappingContract"
import type { PharmaG6CurveState } from "./pharmaG6SubprofileCurveApplicability"
import {
  applyPharmaG7OverlayModifierToDimension,
  PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION,
} from "./pharmaG7OverlayNumericModifierProposal"
import {
  PHARMA_OVERLAY_MODIFIER_CONTRACT_VERSION,
} from "./pharmaOverlayModifierContract"
import {
  evaluatePharmaG7GovernanceConstraint,
  PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_VERSION,
} from "./pharmaG7GovernanceHighRiskConstraint"
import type { PharmaGovernanceRegulatoryGateInput } from "./pharmaGovernanceRegulatoryGateContract"

export const PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION =
  "PHARMA_V1_G7_READ_ONLY_SCORING_ADAPTER_V1_PROPOSAL" as const

export const PHARMA_G7_READ_ONLY_SCORING_ADAPTER = {
  version: PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION,
  state: "PROPOSAL_ONLY",
  readOnly: true,
  nonPersisting: true,
  missingMethodologyMayBecomeZero: false,
  missingEvidenceMayBecomeNeutral: false,
  hiddenReweightingAllowed: false,
  requiresApprovedDimensionScoreContract: true,
  requiresAllWeightedDimensionsForOverallPreview: true,
  overlayContractVersion: PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION,
  governanceContractVersion: PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_VERSION,
  readinessContractVersion: PHARMA_READINESS_MAPPING_CONTRACT_VERSION,
  scoringMethodVersion: PHARMA_GATE_G_SCORING_METHOD_PROPOSAL_VERSION,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
  recommendationEnabled: false,
  positionSizingEnabled: false,
} as const

export type PharmaG7DimensionCode =
  | "QUALITY"
  | "GROWTH"
  | "CAPITAL_EFFICIENCY"
  | "CASH_FLOW"
  | "BALANCE_SHEET_CREDIT"
  | "BUSINESS_DURABILITY"
  | "VALUATION"
  | "MOMENTUM"
  | "OWNERSHIP_GOVERNANCE"
  | "RISK"

export type PharmaG7MethodologyState =
  | PharmaG6CurveState
  | "APPROVED_NUMERIC_CONTRACT"
  | "NO_APPROVED_DIMENSION_AGGREGATION"

export type PharmaG7OverlayParticipation =
  | "NONE"
  | "ELIGIBLE"
  | "BELOW_SCORING_MATERIALITY"
  | "EMERGING_WATCH_EXCLUDED"

export interface PharmaG7MethodologyLineageEntry {
  readonly decisionId: string
  readonly contractVersion: string
}

export interface PharmaG7DimensionAdapterInput {
  readonly dimensionCode: PharmaG7DimensionCode
  readonly methodologyState: PharmaG7MethodologyState
  readonly readiness: PharmaDimensionReadinessInput
  readonly primaryScore: number | null
  readonly primaryScoreContractVersion: string | null
  readonly overlayParticipation: PharmaG7OverlayParticipation
  readonly overlayModifierPoints: number | null
  readonly overlayModifierContractVersion: string | null
  readonly methodologyLineage: readonly PharmaG7MethodologyLineageEntry[]
}

export type PharmaG7DimensionCalculationState =
  | "CALCULATED"
  | "UNAVAILABLE_METHODOLOGY"
  | "INSUFFICIENT_EVIDENCE"
  | "PARTIAL"
  | "BLOCKED_REVIEW"
  | "PROFILE_PENDING"
  | "NOT_APPLICABLE"
  | "EXCLUDED_EMERGING_WATCH"

export interface PharmaG7DimensionAdapterResult {
  readonly dimensionCode: PharmaG7DimensionCode
  readonly calculationState: PharmaG7DimensionCalculationState
  readonly readinessState: PharmaVisibleReadinessState
  readonly primaryScore: number | null
  readonly overlayModifierPoints: number | null
  readonly finalScore: number | null
  readonly reasonCodes: readonly string[]
  readonly methodologyLineage: readonly PharmaG7MethodologyLineageEntry[]
}

export interface PharmaG7ReadOnlyAdapterInput {
  readonly profileResolved: boolean
  readonly commonCoreState: PharmaVisibleReadinessState
  readonly primaryState: PharmaVisibleReadinessState
  readonly overallScoreReadyCoverage: number | null
  readonly governanceInput: PharmaGovernanceRegulatoryGateInput
  readonly dimensions: readonly PharmaG7DimensionAdapterInput[]
}

export interface PharmaG7ReadOnlyAdapterResult {
  readonly contractVersion: typeof PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly overallPreviewState:
    | "READY"
    | "NOT_CURRENTLY_COMPUTABLE"
    | "BLOCKED_REVIEW"
    | "PROFILE_PENDING"
  readonly overallScore: number | null
  readonly dimensions: readonly PharmaG7DimensionAdapterResult[]
  readonly reasonCodes: readonly string[]
  readonly methodologyLineage: readonly PharmaG7MethodologyLineageEntry[]
  readonly scoreExecutionEnabled: false
  readonly persistedScoreRunEnabled: false
  readonly recommendationEnabled: false
  readonly positionSizingEnabled: false
}

const CALCULABLE_METHODOLOGY_STATES = new Set<PharmaG7MethodologyState>([
  "VALIDATED_NOT_ACTIVE",
  "APPROVED_NUMERIC_CONTRACT",
])

const DIMENSION_CODES = PHARMA_V1_DIMENSION_WEIGHTS.map(
  (item) => item.dimensionCode as PharmaG7DimensionCode,
)

function checkedScore(value: number | null, label: string) {
  if (value === null) return
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${label} must be between 0 and 100`)
  }
}

function uniqueLineage(
  entries: readonly PharmaG7MethodologyLineageEntry[],
): readonly PharmaG7MethodologyLineageEntry[] {
  const seen = new Set<string>()
  return entries.filter((entry) => {
    const key = `${entry.decisionId}::${entry.contractVersion}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function baseLineage(): readonly PharmaG7MethodologyLineageEntry[] {
  return [
    {
      decisionId: "G7.1",
      contractVersion: PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION,
    },
    {
      decisionId: "G3",
      contractVersion: PHARMA_READINESS_MAPPING_CONTRACT_VERSION,
    },
    {
      decisionId: "G7-P1",
      contractVersion: PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION,
    },
    {
      decisionId: "G7-P2",
      contractVersion: PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_VERSION,
    },
  ]
}

function nonReadyCalculationState(
  readinessState: PharmaVisibleReadinessState,
): PharmaG7DimensionCalculationState {
  if (readinessState === "BLOCKED_REVIEW") return "BLOCKED_REVIEW"
  if (readinessState === "PROFILE_PENDING") return "PROFILE_PENDING"
  if (readinessState === "NOT_APPLICABLE") return "NOT_APPLICABLE"
  if (readinessState === "PARTIAL") return "PARTIAL"
  return "INSUFFICIENT_EVIDENCE"
}

export function calculatePharmaG7Dimension(
  input: PharmaG7DimensionAdapterInput,
): PharmaG7DimensionAdapterResult {
  checkedScore(input.primaryScore, "primaryScore")

  const readiness = mapPharmaDimensionReadiness(input.readiness)
  const lineage = uniqueLineage([
    ...baseLineage(),
    ...input.methodologyLineage,
    ...(input.primaryScoreContractVersion
      ? [{
          decisionId: "DIMENSION_SCORE_CONTRACT",
          contractVersion: input.primaryScoreContractVersion,
        }]
      : []),
    ...(input.overlayModifierContractVersion
      ? [{
          decisionId: "OVERLAY_MODIFIER_CONTRACT",
          contractVersion: input.overlayModifierContractVersion,
        }]
      : []),
  ])

  if (!readiness.scoreReady) {
    return {
      dimensionCode: input.dimensionCode,
      calculationState: nonReadyCalculationState(readiness.visibleState),
      readinessState: readiness.visibleState,
      primaryScore: null,
      overlayModifierPoints: null,
      finalScore: null,
      reasonCodes: readiness.reasonCodes,
      methodologyLineage: lineage,
    }
  }

  if (!CALCULABLE_METHODOLOGY_STATES.has(input.methodologyState)) {
    return {
      dimensionCode: input.dimensionCode,
      calculationState: "UNAVAILABLE_METHODOLOGY",
      readinessState: "INSUFFICIENT_EVIDENCE",
      primaryScore: null,
      overlayModifierPoints: null,
      finalScore: null,
      reasonCodes: [
        `METHODOLOGY_${input.methodologyState}`,
        "NO_NUMERIC_DIMENSION_RESULT_WITHOUT_APPROVED_METHOD",
      ],
      methodologyLineage: lineage,
    }
  }

  if (input.primaryScore === null || !input.primaryScoreContractVersion) {
    return {
      dimensionCode: input.dimensionCode,
      calculationState: "UNAVAILABLE_METHODOLOGY",
      readinessState: "INSUFFICIENT_EVIDENCE",
      primaryScore: null,
      overlayModifierPoints: null,
      finalScore: null,
      reasonCodes: ["APPROVED_DIMENSION_SCORE_CONTRACT_OR_RESULT_MISSING"],
      methodologyLineage: lineage,
    }
  }

  if (input.overlayParticipation === "ELIGIBLE") {
    if (
      input.overlayModifierPoints === null
      || input.overlayModifierContractVersion !== PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION
    ) {
      return {
        dimensionCode: input.dimensionCode,
        calculationState: "UNAVAILABLE_METHODOLOGY",
        readinessState: "PARTIAL",
        primaryScore: input.primaryScore,
        overlayModifierPoints: null,
        finalScore: null,
        reasonCodes: ["ELIGIBLE_OVERLAY_MODIFIER_NOT_AVAILABLE"],
        methodologyLineage: lineage,
      }
    }

    const finalScore = applyPharmaG7OverlayModifierToDimension(
      input.primaryScore,
      input.overlayModifierPoints,
    )
    return {
      dimensionCode: input.dimensionCode,
      calculationState: "CALCULATED",
      readinessState: "READY",
      primaryScore: input.primaryScore,
      overlayModifierPoints: input.overlayModifierPoints,
      finalScore,
      reasonCodes: ["PRIMARY_SCORE_PLUS_APPROVED_OVERLAY_MODIFIER"],
      methodologyLineage: lineage,
    }
  }

  if (input.overlayParticipation === "BELOW_SCORING_MATERIALITY") {
    if (
      input.overlayModifierContractVersion
      !== PHARMA_OVERLAY_MODIFIER_CONTRACT_VERSION
    ) {
      return {
        dimensionCode: input.dimensionCode,
        calculationState: "UNAVAILABLE_METHODOLOGY",
        readinessState: "PARTIAL",
        primaryScore: input.primaryScore,
        overlayModifierPoints: null,
        finalScore: null,
        reasonCodes: [
          "BELOW_SCORING_MATERIALITY_CLASSIFICATION_CONTRACT_NOT_AVAILABLE",
        ],
        methodologyLineage: lineage,
      }
    }

    return {
      dimensionCode: input.dimensionCode,
      calculationState: "CALCULATED",
      readinessState: "READY",
      primaryScore: input.primaryScore,
      overlayModifierPoints: null,
      finalScore: input.primaryScore,
      reasonCodes: [
        "MATERIAL_OVERLAY_BELOW_SCORING_MATERIALITY_NUMERICALLY_EXCLUDED",
        "NO_NUMERIC_OVERLAY_MODIFIER_APPLIED",
      ],
      methodologyLineage: lineage,
    }
  }

  return {
    dimensionCode: input.dimensionCode,
    calculationState:
      input.overlayParticipation === "EMERGING_WATCH_EXCLUDED"
        ? "EXCLUDED_EMERGING_WATCH"
        : "CALCULATED",
    readinessState: "READY",
    primaryScore: input.primaryScore,
    overlayModifierPoints: 0,
    finalScore: input.primaryScore,
    reasonCodes: [
      input.overlayParticipation === "EMERGING_WATCH_EXCLUDED"
        ? "EMERGING_WATCH_EXCLUDED_FROM_NUMERIC_RESULT"
        : "PRIMARY_DIMENSION_SCORE_NO_OVERLAY",
    ],
    methodologyLineage: lineage,
  }
}

function dimensionSetComplete(
  dimensions: readonly PharmaG7DimensionAdapterResult[],
) {
  if (dimensions.length !== DIMENSION_CODES.length) return false
  const received = new Set(dimensions.map((item) => item.dimensionCode))
  return DIMENSION_CODES.every((code) => received.has(code))
}

function overallStateFromReadiness(
  visibleState: Exclude<PharmaVisibleReadinessState, "NOT_APPLICABLE">,
): PharmaG7ReadOnlyAdapterResult["overallPreviewState"] {
  if (visibleState === "BLOCKED_REVIEW") return "BLOCKED_REVIEW"
  if (visibleState === "PROFILE_PENDING") return "PROFILE_PENDING"
  if (visibleState === "READY") return "READY"
  return "NOT_CURRENTLY_COMPUTABLE"
}

export function calculatePharmaG7ReadOnlyPreview(
  input: PharmaG7ReadOnlyAdapterInput,
): PharmaG7ReadOnlyAdapterResult {
  const governance = evaluatePharmaG7GovernanceConstraint(input.governanceInput)
  const dimensions = input.dimensions.map(calculatePharmaG7Dimension)

  const weightedDimensionStates = dimensions.map((item) => item.readinessState)
  const overallReadiness = mapPharmaOverallReadiness({
    profileResolved: input.profileResolved,
    commonCoreState: input.commonCoreState,
    primaryState: input.primaryState,
    weightedDimensionStates,
    overallScoreReadyCoverage: input.overallScoreReadyCoverage,
    governanceBlocked: governance.blocksOverallPreview,
  })

  const lineage = uniqueLineage([
    ...baseLineage(),
    {
      decisionId: "GATE_G_SCORING_METHOD",
      contractVersion: PHARMA_GATE_G_SCORING_METHOD_PROPOSAL_VERSION,
    },
    ...dimensions.flatMap((item) => item.methodologyLineage),
    {
      decisionId: "G7-P2_RUNTIME",
      contractVersion: governance.contractVersion,
    },
  ])

  const reasons = [
    ...governance.reasonCodes,
    ...overallReadiness.reasonCodes,
  ]

  if (!dimensionSetComplete(dimensions)) {
    return {
      contractVersion: PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION,
      state: "PROPOSAL_ONLY",
      overallPreviewState: "NOT_CURRENTLY_COMPUTABLE",
      overallScore: null,
      dimensions,
      reasonCodes: [...reasons, "WEIGHTED_DIMENSION_SET_INCOMPLETE"],
      methodologyLineage: lineage,
      scoreExecutionEnabled: false,
      persistedScoreRunEnabled: false,
      recommendationEnabled: false,
      positionSizingEnabled: false,
    }
  }

  if (
    !overallReadiness.previewEligible
    || dimensions.some((item) => item.finalScore === null)
  ) {
    return {
      contractVersion: PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION,
      state: "PROPOSAL_ONLY",
      overallPreviewState: overallStateFromReadiness(overallReadiness.visibleState),
      overallScore: null,
      dimensions,
      reasonCodes: dimensions.some((item) => item.finalScore === null)
        ? [...reasons, "ONE_OR_MORE_WEIGHTED_DIMENSIONS_HAVE_NO_NUMERIC_RESULT"]
        : reasons,
      methodologyLineage: lineage,
      scoreExecutionEnabled: false,
      persistedScoreRunEnabled: false,
      recommendationEnabled: false,
      positionSizingEnabled: false,
    }
  }

  const byDimension = new Map(
    dimensions.map((item) => [item.dimensionCode, item.finalScore] as const),
  )

  const overallScore = PHARMA_V1_DIMENSION_WEIGHTS.reduce((sum, item) => {
    const score = byDimension.get(item.dimensionCode as PharmaG7DimensionCode)
    if (score === null || score === undefined) {
      return sum
    }
    return sum + score * (item.weight / 100)
  }, 0)

  return {
    contractVersion: PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION,
    state: "PROPOSAL_ONLY",
    overallPreviewState: "READY",
    overallScore: Math.round((overallScore + Number.EPSILON) * 10_000) / 10_000,
    dimensions,
    reasonCodes: [...reasons, "READ_ONLY_OVERALL_PREVIEW_CALCULATED_WITH_FIXED_WEIGHTS"],
    methodologyLineage: lineage,
    scoreExecutionEnabled: false,
    persistedScoreRunEnabled: false,
    recommendationEnabled: false,
    positionSizingEnabled: false,
  }
}
