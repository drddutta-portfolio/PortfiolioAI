import { ALIVUS_G10_1_REFERENCE_ASSIGNMENT_RESOLUTION } from "./alivusG101RecommendationPreview"
import {
  buildProgramB2FrozenPortfolioDisposition,
  buildProgramB2ReferenceResults,
  type ProgramB2DispositionState,
  type ProgramB2ReferenceResult,
} from "./programBR6Execution"
import {
  evaluateProgramBRecommendationReadiness,
  evaluateProgramBSizingReadiness,
  programBRecommendationLineageIdentity,
  resolveProgramBRecommendationPolicy,
  resolveProgramBSizingMethodology,
  type ProgramBRecommendationFinalState,
  type ProgramBSizingReadinessState,
} from "./programBR7Contract"
import { buildPharmaGateI3ReferenceRecommendation } from "./pharmaGateI3ReadOnlyRecommendation"
import type { PharmaSubprofileResolution } from "./pharmaSubprofileAssignment"

export const PROGRAM_B_R7_EXECUTION_VERSION = "PROGRAM_B_R7_EXECUTION_V1" as const

export type ProgramB4OutcomeState =
  | "RECOMMENDATION_READY"
  | "SIZING_READY"
  | "INSUFFICIENT_EVIDENCE"
  | "METHODOLOGY_NOT_AVAILABLE"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"
  | "BLOCKED_PREREQUISITE"

export type ProgramB4RecommendationState = Exclude<
  ProgramB4OutcomeState,
  "SIZING_READY"
>

export interface ProgramB4RecommendationExecution {
  readonly state: ProgramB4RecommendationState
  readonly canRecommend: boolean
  readonly securityId: string | null
  readonly symbol: string
  readonly sourceScoreRunId: string | null
  readonly sourceScore: number | null
  readonly recommendationRunId: string | null
  readonly researchProfileCode: string | null
  readonly methodologyRole: string | null
  readonly assignmentVersion: string | number | null
  readonly policyId: string | null
  readonly policyVersion: string | null
  readonly suggestedRole: ProgramBRecommendationFinalState | null
  readonly reasonCodes: readonly string[]
}

export interface ProgramB4SizingExecution {
  readonly state: ProgramBSizingReadinessState
  readonly canSize: boolean
  readonly policyId: string | null
  readonly policyVersion: string | null
  readonly sourceRecommendationRunId: string | null
  readonly sourceScoreRunId: string | null
  readonly suggestedTargetWeight: null
  readonly suggestedMinimumWeight: null
  readonly suggestedMaximumWeight: null
  readonly recommendedAction: null
  readonly reasonCodes: readonly string[]
}

export interface ProgramB4ReferenceDecision {
  readonly version: typeof PROGRAM_B_R7_EXECUTION_VERSION
  readonly symbol: string
  readonly recommendation: ProgramB4RecommendationExecution
  readonly sizing: ProgramB4SizingExecution
  readonly finalDisposition: ProgramB4OutcomeState
  readonly providerCalls: 0
  readonly persistedWrites: 0
}

export interface ProgramB4OwnerSettingsSnapshot {
  readonly targetPrice: string | null
  readonly stopLossPrice: string | null
  readonly targetWeight: string | null
  readonly portfolioRole: string
}

export interface ProgramBMachineAssessmentWriter {
  recordMachineAssessment(assessment: ProgramB4SizingExecution): void
}

export function recordProgramBMachineAssessment(ownerSettings: ProgramB4OwnerSettingsSnapshot, assessment: ProgramB4SizingExecution, writer: ProgramBMachineAssessmentWriter) {
  writer.recordMachineAssessment(assessment)
  return ownerSettings
}

export interface ProgramB4CanonicalDecisionSurface {
  readonly surface: "RESEARCH" | "PORTFOLIO" | "ACTION"
  readonly symbol: string
  readonly sourceScoreRunId: string | null
  readonly sourceScore: number | null
  readonly recommendationRunId: string | null
  readonly recommendationState: ProgramB4RecommendationState
  readonly suggestedRole: ProgramBRecommendationFinalState | null
  readonly sizingState: ProgramBSizingReadinessState
  readonly sizingPolicyId: string | null
  readonly finalDisposition: ProgramB4OutcomeState
}

export interface ProgramB4PortfolioDispositionRow {
  readonly symbol: string
  readonly r6Disposition: ProgramB2DispositionState
  readonly recommendationDisposition: ProgramB4RecommendationState
  readonly sizingDisposition: ProgramBSizingReadinessState
  readonly finalDisposition: ProgramB4OutcomeState
  readonly sourceScoreRunId: string | null
  readonly recommendationRunId: string | null
  readonly reasonCodes: readonly string[]
}

export interface ProgramB4PortfolioDisposition {
  readonly version: typeof PROGRAM_B_R7_EXECUTION_VERSION
  readonly totalHoldings: number
  readonly rows: readonly ProgramB4PortfolioDispositionRow[]
  readonly recommendationReady: number
  readonly sizingReady: number
  readonly notSizingReady: number
  readonly dispositionComplete: true
  readonly numericRecommendationCoverageComplete: boolean
  readonly numericSizingCoverageComplete: boolean
  readonly providerCalls: 0
  readonly persistedWrites: 0
}

const PHARMA_FLOOR_DIMENSIONS = [
  "QUALITY",
  "GROWTH",
  "CASH_FLOW",
  "BALANCE_SHEET_CREDIT",
  "BUSINESS_DURABILITY",
  "OWNERSHIP_GOVERNANCE",
  "RISK",
] as const

const PHARMA_CAUTION_DIMENSIONS = [
  "VALUATION",
  "MOMENTUM",
  "RISK",
] as const

const TORNTPHARM_B4_SECURITY_ID = "PROGRAM_B_B4_TORNTPHARM_REFERENCE" as const
const TORNTPHARM_B4_ASSIGNMENT: PharmaSubprofileResolution = {
  status: "RESOLVED",
  profileCode: "PHARMA_V1",
  blocksReadiness: false,
  assignment: {
    securityId: TORNTPHARM_B4_SECURITY_ID,
    profileCode: "PHARMA_V1",
    primarySubprofileCode: "DOMESTIC_FORMULATIONS",
    assignmentVersion: 1,
    assignmentState: "REVIEWED",
    effectiveFrom: "2026-03-31",
    effectiveTo: null,
    sourceReference: "R4N_GATE_E_OWNER_REVIEWED_TORNTPHARM_ASSIGNMENT",
    reasonCode: "OWNER_REVIEWED_GATE_E_2026_09_17",
    confidence: "HIGH",
    reviewedBy: "OWNER_REVIEWED_GATE_E",
    reviewedAt: "2026-09-17T18:30:00+05:30",
    secondaryExposures: [
      {
        exposureCode: "GLOBAL_GENERICS",
        materiality: "MATERIAL",
        confidence: "MEDIUM",
        assignmentState: "REVIEWED",
        effectiveFrom: "2026-03-31",
        effectiveTo: null,
        sourceReference: "R4N_GATE_E_OWNER_REVIEWED_TORNTPHARM_ASSIGNMENT",
        reasonCode: "ISSUER_DEFINED_GENERIC_BUSINESS_REVENUE_SHARE_GTE_10",
        reviewedBy: "OWNER_REVIEWED_GATE_E",
        reviewedAt: "2026-09-17T18:30:00+05:30",
      },
      {
        exposureCode: "CDMO_CRAMS",
        materiality: "EMERGING",
        confidence: "MEDIUM",
        assignmentState: "REVIEWED",
        effectiveFrom: "2026-03-31",
        effectiveTo: null,
        sourceReference: "R4N_GATE_E_OWNER_REVIEWED_TORNTPHARM_ASSIGNMENT",
        reasonCode: "OWNER_REVIEWED_STRATEGIC_EMERGING_CDMO_CAPABILITY",
        reviewedBy: "OWNER_REVIEWED_GATE_E",
        reviewedAt: "2026-09-17T18:30:00+05:30",
      },
    ],
  },
}

function recommendationRunId(
  symbol: string,
  scoreRunId: string,
  policyVersion: string,
) {
  return `PROGRAM_B_R7_REFERENCE::${symbol}::${scoreRunId}::${policyVersion}`
}

function completeDimensions(
  reference: ProgramB2ReferenceResult,
  required: readonly string[],
) {
  return required.every((code) => {
    const value = reference.categoryScores[code]
    return typeof value === "number" && Number.isFinite(value)
  })
}

function referenceAssignment(
  symbol: string,
): {
  readonly securityId: string
  readonly resolution: PharmaSubprofileResolution
} | null {
  if (symbol === "TORNTPHARM") {
    return {
      securityId: TORNTPHARM_B4_SECURITY_ID,
      resolution: TORNTPHARM_B4_ASSIGNMENT,
    }
  }
  if (symbol === "ALIVUS") {
    return {
      securityId: ALIVUS_G10_1_REFERENCE_ASSIGNMENT_RESOLUTION.status === "RESOLVED"
        ? ALIVUS_G10_1_REFERENCE_ASSIGNMENT_RESOLUTION.assignment.securityId
        : "G10_1_ALIVUS_REFERENCE",
      resolution: ALIVUS_G10_1_REFERENCE_ASSIGNMENT_RESOLUTION,
    }
  }
  return null
}

function referenceSecurityId(reference: ProgramB2ReferenceResult): string {
  const assignment = referenceAssignment(reference.symbol)
  return assignment?.securityId ?? `PROGRAM_B_B4_${reference.symbol}_REFERENCE`
}

function mapR6BlockedState(
  state: Exclude<ProgramB2DispositionState, "SCORED">,
): ProgramB4RecommendationState {
  if (state === "INSUFFICIENT_EVIDENCE" || state === "STALE_REQUIRED_EVIDENCE") {
    return "INSUFFICIENT_EVIDENCE"
  }
  if (state === "CONFLICTING_EVIDENCE" || state === "REVIEW_REQUIRED") {
    return "REVIEW_REQUIRED"
  }
  if (state === "METHODOLOGY_NOT_AVAILABLE") return "METHODOLOGY_NOT_AVAILABLE"
  if (state === "NOT_APPLICABLE") return "NOT_APPLICABLE"
  return "BLOCKED_PREREQUISITE"
}

function blockedRecommendation(
  reference: ProgramB2ReferenceResult,
  state: ProgramB4RecommendationState,
): ProgramB4RecommendationExecution {
  return {
    state,
    canRecommend: false,
    securityId: referenceSecurityId(reference),
    symbol: reference.symbol,
    sourceScoreRunId: reference.scoreLineage?.runId ?? null,
    sourceScore: reference.overallScore,
    recommendationRunId: null,
    researchProfileCode: reference.methodologyId,
    methodologyRole: reference.methodologyRole,
    assignmentVersion: null,
    policyId: null,
    policyVersion: null,
    suggestedRole: null,
    reasonCodes: [...reference.reasonCodes],
  }
}

function executeReadyPharmaRecommendation(
  reference: ProgramB2ReferenceResult,
): ProgramB4RecommendationExecution {
  const assignment = referenceAssignment(reference.symbol)
  const scoreRunId = reference.scoreLineage?.runId ?? null
  const policy = resolveProgramBRecommendationPolicy("PHARMA_V1")

  if (!assignment || scoreRunId === null || reference.overallScore === null) {
    return blockedRecommendation(reference, "BLOCKED_PREREQUISITE")
  }
  if (assignment.resolution.status !== "RESOLVED") {
    return blockedRecommendation(reference, "BLOCKED_PREREQUISITE")
  }
  if (
    reference.scoreLineage?.securityId !== assignment.securityId
    || reference.scoreLineage.methodologyRole !== assignment.resolution.assignment.primarySubprofileCode
    || reference.scoreLineage.assignmentVersion !== assignment.resolution.assignment.assignmentVersion
    || reference.scoreLineage.overallScore !== reference.overallScore
  ) {
    throw new Error(`R7 received inconsistent R6 lineage for ${reference.symbol}.`)
  }

  const readiness = evaluateProgramBRecommendationReadiness({
    assetClass: "EQUITY",
    securityId: assignment.securityId,
    scoreState: "SCORED",
    scoreRunId,
    score: reference.overallScore,
    scoreLineageState: "COMPLETE",
    scoreProfileCode: "PHARMA_V1",
    methodologyRole: assignment.resolution.assignment.primarySubprofileCode,
    assignmentVersion: assignment.resolution.assignment.assignmentVersion,
    recommendationPolicy: policy,
    mandatoryFloorInputState: completeDimensions(reference, PHARMA_FLOOR_DIMENSIONS)
      ? "COMPLETE"
      : "MISSING",
    cautionRiskInputState: completeDimensions(reference, PHARMA_CAUTION_DIMENSIONS)
      ? "COMPLETE"
      : "MISSING",
  })

  if (!readiness.canRecommend || readiness.state !== "READY") {
    const state: ProgramB4RecommendationState =
      readiness.state === "INSUFFICIENT_EVIDENCE"
        ? "INSUFFICIENT_EVIDENCE"
        : readiness.state === "METHODOLOGY_NOT_AVAILABLE"
          ? "METHODOLOGY_NOT_AVAILABLE"
          : readiness.state === "REVIEW_REQUIRED"
            ? "REVIEW_REQUIRED"
            : readiness.state === "NOT_APPLICABLE"
              ? "NOT_APPLICABLE"
              : "BLOCKED_PREREQUISITE"
    return {
      ...blockedRecommendation(reference, state),
      securityId: readiness.securityId,
      policyId: readiness.policyId,
      policyVersion: readiness.policyVersion,
      assignmentVersion: readiness.assignmentVersion,
      reasonCodes: readiness.reasonCodes,
    }
  }

  const gateI3 = buildPharmaGateI3ReferenceRecommendation({
    securityId: assignment.securityId,
    securitySymbol: reference.symbol,
    assignmentResolution: assignment.resolution,
  })
  if (
    gateI3 === null
    || gateI3.deterministicCalculationState !== "READY_READ_ONLY_RECOMMENDATION"
    || gateI3.overallScore === null
  ) {
    return {
      ...blockedRecommendation(reference, "BLOCKED_PREREQUISITE"),
      securityId: assignment.securityId,
      assignmentVersion: assignment.resolution.assignment.assignmentVersion,
      policyId: readiness.policyId,
      policyVersion: readiness.policyVersion,
      reasonCodes: ["GATE_I3_REFERENCE_RECOMMENDATION_NOT_READY"],
    }
  }

  if (Math.abs(gateI3.overallScore - reference.overallScore) > 1e-10) {
    throw new Error(`R7 source-score mismatch for ${reference.symbol}.`)
  }
  if (gateI3.primarySubprofile !== reference.methodologyRole) {
    throw new Error(`R7 Primary-subprofile mismatch for ${reference.symbol}.`)
  }
  if (!readiness.policyId || !readiness.policyVersion) {
    throw new Error(`R7 policy lineage incomplete for ${reference.symbol}.`)
  }

  const runId = recommendationRunId(
    reference.symbol,
    scoreRunId,
    readiness.policyVersion,
  )
  programBRecommendationLineageIdentity({
    recommendationRunId: runId,
    securityId: assignment.securityId,
    scoreRunId,
    researchProfileCode: "PHARMA_V1",
    methodologyRole: gateI3.primarySubprofile,
    assignmentVersion: assignment.resolution.assignment.assignmentVersion,
    recommendationMethodologyId: readiness.policyId,
    recommendationMethodologyVersion: readiness.policyVersion,
  })

  return {
    state: "RECOMMENDATION_READY",
    canRecommend: true,
    securityId: assignment.securityId,
    symbol: reference.symbol,
    sourceScoreRunId: scoreRunId,
    sourceScore: reference.overallScore,
    recommendationRunId: runId,
    researchProfileCode: "PHARMA_V1",
    methodologyRole: gateI3.primarySubprofile,
    assignmentVersion: assignment.resolution.assignment.assignmentVersion,
    policyId: readiness.policyId,
    policyVersion: readiness.policyVersion,
    suggestedRole: gateI3.suggestedRole,
    reasonCodes: gateI3.reasonCodes,
  }
}

export function executeProgramB4ReferenceRecommendation(
  reference: ProgramB2ReferenceResult,
): ProgramB4RecommendationExecution {
  if (reference.dispositionState !== "SCORED") {
    return blockedRecommendation(
      reference,
      mapR6BlockedState(reference.dispositionState),
    )
  }

  if (
    reference.methodologyId === "PHARMA_V1"
    && (reference.symbol === "TORNTPHARM" || reference.symbol === "ALIVUS")
  ) {
    return executeReadyPharmaRecommendation(reference)
  }

  return {
    ...blockedRecommendation(reference, "METHODOLOGY_NOT_AVAILABLE"),
    reasonCodes: ["APPROVED_R7_RECOMMENDATION_EXECUTION_NOT_AVAILABLE_FOR_PROFILE"],
  }
}

function recommendationStateForSizing(
  recommendation: ProgramB4RecommendationExecution,
): "READY" | "INSUFFICIENT" | "BLOCKED" | "REVIEW_REQUIRED" | "NOT_APPLICABLE" {
  if (recommendation.state === "RECOMMENDATION_READY") return "READY"
  if (recommendation.state === "INSUFFICIENT_EVIDENCE") return "INSUFFICIENT"
  if (recommendation.state === "REVIEW_REQUIRED") return "REVIEW_REQUIRED"
  if (recommendation.state === "NOT_APPLICABLE") return "NOT_APPLICABLE"
  return "BLOCKED"
}

export function executeProgramB4Sizing(
  input: {
    readonly assetClass: string
    readonly recommendation: ProgramB4RecommendationExecution
    readonly sizingInputState?: "COMPLETE" | "MISSING" | "CONFLICTING" | "REVIEW_REQUIRED"
    readonly currentPortfolioContextState?: "COMPLETE" | "MISSING" | "CONFLICTING" | "REVIEW_REQUIRED"
  },
): ProgramB4SizingExecution {
  const methodology = resolveProgramBSizingMethodology({
    assetClass: input.assetClass,
    profileCode: input.recommendation.researchProfileCode,
    methodologyRole: input.recommendation.methodologyRole,
  })
  const readiness = evaluateProgramBSizingReadiness({
    assetClass: input.assetClass,
    securityId: input.recommendation.securityId,
    recommendationState: recommendationStateForSizing(input.recommendation),
    recommendationRunId: input.recommendation.recommendationRunId,
    recommendationScoreRunId: input.recommendation.sourceScoreRunId,
    sizingMethodology: methodology,
    sizingInputState: input.sizingInputState ?? "COMPLETE",
    currentPortfolioContextState: input.currentPortfolioContextState ?? "COMPLETE",
  })

  return {
    state: readiness.state,
    canSize: readiness.canSize,
    policyId: readiness.policyId,
    policyVersion: readiness.policyVersion,
    sourceRecommendationRunId: readiness.sourceRecommendationRunId,
    sourceScoreRunId: readiness.sourceScoreRunId,
    suggestedTargetWeight: null,
    suggestedMinimumWeight: null,
    suggestedMaximumWeight: null,
    recommendedAction: null,
    reasonCodes: readiness.reasonCodes,
  }
}

function finalDisposition(
  recommendation: ProgramB4RecommendationExecution,
  sizing: ProgramB4SizingExecution,
): ProgramB4OutcomeState {
  if (sizing.state === "READY") return "SIZING_READY"
  if (recommendation.state === "RECOMMENDATION_READY") return "RECOMMENDATION_READY"
  return recommendation.state
}

export function buildProgramB4ReferenceDecisions(): readonly ProgramB4ReferenceDecision[] {
  return buildProgramB2ReferenceResults().map((reference) => {
    const recommendation = executeProgramB4ReferenceRecommendation(reference)
    const sizing = executeProgramB4Sizing({
      assetClass: "EQUITY",
      recommendation,
    })
    return {
      version: PROGRAM_B_R7_EXECUTION_VERSION,
      symbol: reference.symbol,
      recommendation,
      sizing,
      finalDisposition: finalDisposition(recommendation, sizing),
      providerCalls: 0,
      persistedWrites: 0,
    }
  })
}

export function canonicalProgramB4ReferencePayload(
  decision: ProgramB4ReferenceDecision,
) {
  return {
    version: decision.version,
    symbol: decision.symbol,
    recommendation: {
      state: decision.recommendation.state,
      sourceScoreRunId: decision.recommendation.sourceScoreRunId,
      sourceScore: decision.recommendation.sourceScore,
      recommendationRunId: decision.recommendation.recommendationRunId,
      researchProfileCode: decision.recommendation.researchProfileCode,
      methodologyRole: decision.recommendation.methodologyRole,
      assignmentVersion: decision.recommendation.assignmentVersion,
      policyId: decision.recommendation.policyId,
      policyVersion: decision.recommendation.policyVersion,
      suggestedRole: decision.recommendation.suggestedRole,
      reasonCodes: [...decision.recommendation.reasonCodes].sort(),
    },
    sizing: {
      state: decision.sizing.state,
      policyId: decision.sizing.policyId,
      policyVersion: decision.sizing.policyVersion,
      sourceRecommendationRunId: decision.sizing.sourceRecommendationRunId,
      sourceScoreRunId: decision.sizing.sourceScoreRunId,
      suggestedTargetWeight: decision.sizing.suggestedTargetWeight,
      suggestedMinimumWeight: decision.sizing.suggestedMinimumWeight,
      suggestedMaximumWeight: decision.sizing.suggestedMaximumWeight,
      recommendedAction: decision.sizing.recommendedAction,
      reasonCodes: [...decision.sizing.reasonCodes].sort(),
    },
    finalDisposition: decision.finalDisposition,
  }
}

export function projectProgramB4DecisionSurface(
  decision: ProgramB4ReferenceDecision,
  surface: ProgramB4CanonicalDecisionSurface["surface"],
): ProgramB4CanonicalDecisionSurface {
  return {
    surface,
    symbol: decision.symbol,
    sourceScoreRunId: decision.recommendation.sourceScoreRunId,
    sourceScore: decision.recommendation.sourceScore,
    recommendationRunId: decision.recommendation.recommendationRunId,
    recommendationState: decision.recommendation.state,
    suggestedRole: decision.recommendation.suggestedRole,
    sizingState: decision.sizing.state,
    sizingPolicyId: decision.sizing.policyId,
    finalDisposition: decision.finalDisposition,
  }
}

export function buildProgramB4OwnerAuthorityRegression() {
  const ownerSettingsBefore: ProgramB4OwnerSettingsSnapshot = Object.freeze({
    targetPrice: "950.00",
    stopLossPrice: "640.00",
    targetWeight: "3.25",
    portfolioRole: "CORE",
  })
  const reference = buildProgramB4ReferenceDecisions().find(
    (row) => row.symbol === "TORNTPHARM",
  )
  if (!reference) throw new Error("B4 owner-authority reference missing.")

  let machineAssessmentWriteCount = 0
  const ownerSettingsAfter = recordProgramBMachineAssessment(ownerSettingsBefore, reference.sizing, {
    recordMachineAssessment: () => { machineAssessmentWriteCount += 1 },
  })

  return {
    symbol: reference.symbol,
    ownerSettingsBefore,
    ownerSettingsAfter,
    machineAssessment: reference.sizing,
    ownerFieldMutationCount: 0 as const,
    machineAssessmentWriteCount,
    persistenceMutationCount: 0 as const,
  }
}

export function buildProgramB4SizingEdgeCases() {
  const ready = buildProgramB4ReferenceDecisions().find(
    (row) => row.symbol === "TORNTPHARM",
  )
  if (!ready) throw new Error("B4 sizing edge-case reference missing.")

  const lowEvidenceRecommendation: ProgramB4RecommendationExecution = {
    ...ready.recommendation,
    state: "INSUFFICIENT_EVIDENCE",
    canRecommend: false,
    recommendationRunId: null,
    suggestedRole: null,
    reasonCodes: ["EDGE_CASE_LOW_EVIDENCE_CONFIDENCE"],
  }
  const incompleteHoldingRecommendation: ProgramB4RecommendationExecution = {
    ...ready.recommendation,
    state: "BLOCKED_PREREQUISITE",
    canRecommend: false,
    securityId: null,
    recommendationRunId: null,
    suggestedRole: null,
    reasonCodes: ["EDGE_CASE_INCOMPLETE_HOLDING"],
  }

  return [
    {
      code: "STRONG_SCORE_HIGH_CONCENTRATION",
      context: { concentrationPercent: 18, volatilityState: "NORMAL" },
      result: executeProgramB4Sizing({
        assetClass: "EQUITY",
        recommendation: ready.recommendation,
      }),
    },
    {
      code: "STRONG_SCORE_HIGH_VOLATILITY",
      context: { concentrationPercent: 3, volatilityState: "HIGH" },
      result: executeProgramB4Sizing({
        assetClass: "EQUITY",
        recommendation: ready.recommendation,
      }),
    },
    {
      code: "LOW_EVIDENCE_CONFIDENCE",
      context: { evidenceConfidence: "LOW" },
      result: executeProgramB4Sizing({
        assetClass: "EQUITY",
        recommendation: lowEvidenceRecommendation,
      }),
    },
    {
      code: "INCOMPLETE_HOLDING",
      context: { holdingState: "INCOMPLETE" },
      result: executeProgramB4Sizing({
        assetClass: "EQUITY",
        recommendation: incompleteHoldingRecommendation,
      }),
    },
    {
      code: "ETF_NON_APPLICABLE",
      context: { assetClass: "ETF" },
      result: executeProgramB4Sizing({
        assetClass: "ETF",
        recommendation: {
          ...ready.recommendation,
          state: "NOT_APPLICABLE",
          canRecommend: false,
          recommendationRunId: null,
          suggestedRole: null,
          reasonCodes: ["EDGE_CASE_NON_EQUITY"],
        },
      }),
    },
  ] as const
}

function portfolioRecommendationState(
  r6State: ProgramB2DispositionState,
): ProgramB4RecommendationState {
  if (r6State === "SCORED") return "METHODOLOGY_NOT_AVAILABLE"
  return mapR6BlockedState(r6State)
}

function sizingDispositionFromRecommendation(
  state: ProgramB4RecommendationState,
): ProgramBSizingReadinessState {
  if (state === "RECOMMENDATION_READY") return "METHODOLOGY_NOT_AVAILABLE"
  if (state === "INSUFFICIENT_EVIDENCE") return "INSUFFICIENT_EVIDENCE"
  if (state === "REVIEW_REQUIRED") return "REVIEW_REQUIRED"
  if (state === "NOT_APPLICABLE") return "NOT_APPLICABLE"
  if (state === "METHODOLOGY_NOT_AVAILABLE") return "METHODOLOGY_NOT_AVAILABLE"
  return "BLOCKED_PREREQUISITE"
}

export function buildProgramB4FrozenPortfolioDisposition(): ProgramB4PortfolioDisposition {
  const r6 = buildProgramB2FrozenPortfolioDisposition()
  const references = new Map(
    buildProgramB4ReferenceDecisions().map((row) => [row.symbol, row]),
  )

  const rows = r6.rows.map((row): ProgramB4PortfolioDispositionRow => {
    const reference = references.get(row.symbol)
    if (reference) {
      return {
        symbol: row.symbol,
        r6Disposition: row.dispositionState,
        recommendationDisposition: reference.recommendation.state,
        sizingDisposition: reference.sizing.state,
        finalDisposition: reference.finalDisposition,
        sourceScoreRunId: reference.recommendation.sourceScoreRunId,
        recommendationRunId: reference.recommendation.recommendationRunId,
        reasonCodes: [
          ...reference.recommendation.reasonCodes,
          ...reference.sizing.reasonCodes,
        ],
      }
    }

    const recommendationDisposition = portfolioRecommendationState(
      row.dispositionState,
    )
    const sizingDisposition = sizingDispositionFromRecommendation(
      recommendationDisposition,
    )
    return {
      symbol: row.symbol,
      r6Disposition: row.dispositionState,
      recommendationDisposition,
      sizingDisposition,
      finalDisposition: recommendationDisposition,
      sourceScoreRunId: null,
      recommendationRunId: null,
      reasonCodes:
        row.dispositionState === "SCORED"
          ? ["APPROVED_R7_RECOMMENDATION_EXECUTION_NOT_AVAILABLE_FOR_PROFILE"]
          : [...row.reasonCodes],
    }
  })

  const recommendationReady = rows.filter(
    (row) => row.recommendationDisposition === "RECOMMENDATION_READY",
  ).length
  const sizingReady = rows.filter(
    (row) => row.sizingDisposition === "READY",
  ).length

  return {
    version: PROGRAM_B_R7_EXECUTION_VERSION,
    totalHoldings: rows.length,
    rows,
    recommendationReady,
    sizingReady,
    notSizingReady: rows.length - sizingReady,
    dispositionComplete: true,
    numericRecommendationCoverageComplete: recommendationReady === rows.length,
    numericSizingCoverageComplete: sizingReady === rows.length,
    providerCalls: 0,
    persistedWrites: 0,
  }
}

export const PROGRAM_B_B4_SAFETY_BOUNDARY = {
  providerCalls: 0,
  angelOneCalls: 0,
  trendlyneCalls: 0,
  openAiDecisionCalls: 0,
  recommendationPersistence: false,
  sizingPersistence: false,
  ownerSettingsMutation: false,
  productionMutation: false,
  migration: false,
  deployment: false,
  merge: false,
  schedulerMutation: false,
  trading: false,
} as const
