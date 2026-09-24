import { programCR8SemanticFingerprint } from "./r8Determinism"
import type { ProgramCR8PortfolioDecisionAssessment } from "./r8PortfolioDecisionContract"

export const PROGRAM_C_R9_OBSERVED_STATE_VERSION =
  "PROGRAM_C_R9_OBSERVED_STATE_V1" as const

export type ProgramCR9EvidenceState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"
  | "UNKNOWN"

export interface ProgramCR9ObservedStateInput {
  readonly securityId: string
  readonly portfolioId: string
  readonly assetClass: string
  readonly observedAt: string
  readonly r6ReadinessState: string | null
  readonly r7ReadinessState: string | null
  readonly r7RecommendationState: string | null
  readonly r6OverallScore: string | null
  readonly evidenceState: ProgramCR9EvidenceState
  readonly valuationState: string | null
  readonly momentumState: string | null
  readonly ownerContextVersion: string | null
  readonly classificationVersion: string | null
  readonly r8Assessment: ProgramCR8PortfolioDecisionAssessment
}

export interface ProgramCR9ObservedState {
  readonly version: typeof PROGRAM_C_R9_OBSERVED_STATE_VERSION
  readonly observedStateId: string
  readonly securityId: string
  readonly portfolioId: string
  readonly assetClass: string
  readonly observedAt: string
  readonly lineage: {
    readonly classificationVersion: string | null
    readonly researchProfileCode: string | null
    readonly methodologyId: string | null
    readonly methodologyVersion: string | null
    readonly methodologyRole: string | null
    readonly assignmentId: string | null
    readonly assignmentVersion: string | number | null
    readonly evidenceSnapshotId: string | null
    readonly scoreRunId: string | null
    readonly recommendationRunId: string | null
    readonly portfolioContextSnapshotId: string
    readonly r8DecisionRunId: string
  }
  readonly states: {
    readonly r6ReadinessState: string | null
    readonly r7ReadinessState: string | null
    readonly r7RecommendationState: string | null
    readonly evidenceState: ProgramCR9EvidenceState
    readonly valuationState: string | null
    readonly momentumState: string | null
    readonly r8OverallDisposition: string
    readonly coreHealth: string
    readonly portfolioFit: string
    readonly portfolioRisk: string
    readonly exitIntelligence: string
    readonly blockerKeys: readonly string[]
  }
  readonly values: {
    readonly r6OverallScore: string | null
  }
  readonly ownerContextVersion: string | null
}

function required(value: string, field: string) {
  const clean = value.trim()
  if (!clean) throw new Error(`Program C R9 observed state requires ${field}.`)
  return clean
}

function validObservedAt(value: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) {
    throw new Error("Program C R9 observed state requires a valid observedAt timestamp.")
  }
  return value
}

function blockerKey(blocker: ProgramCR8PortfolioDecisionAssessment["blockers"][number]) {
  return [
    blocker.domain,
    blocker.requiredState,
    blocker.observedState,
    blocker.reasonCode,
    blocker.sourceIdentity ?? "SOURCE_NONE",
  ].join("::")
}

export function buildProgramCR9ObservedState(
  input: ProgramCR9ObservedStateInput,
): ProgramCR9ObservedState {
  const securityId = required(input.securityId, "securityId")
  const portfolioId = required(input.portfolioId, "portfolioId")
  const assetClass = required(input.assetClass, "assetClass")
  const observedAt = validObservedAt(input.observedAt)
  const assessment = input.r8Assessment

  if (assessment.securityId !== securityId || assessment.portfolioId !== portfolioId) {
    throw new Error("Program C R9 observed state R8 identity mismatch.")
  }

  const blockerKeys = assessment.blockers.map(blockerKey).sort()
  const semantic = {
    securityId,
    portfolioId,
    assetClass,
    classificationVersion: input.classificationVersion,
    researchProfileCode: assessment.upstreamLineage.researchProfileCode,
    methodologyId: assessment.upstreamLineage.methodologyId,
    methodologyVersion: assessment.upstreamLineage.methodologyVersion,
    methodologyRole: assessment.upstreamLineage.methodologyRole,
    assignmentId: assessment.upstreamLineage.assignmentId,
    assignmentVersion: assessment.upstreamLineage.assignmentVersion,
    evidenceSnapshotId: assessment.upstreamLineage.evidenceSnapshotId,
    scoreRunId: assessment.upstreamLineage.scoreRunId,
    recommendationRunId: assessment.upstreamLineage.recommendationRunId,
    portfolioContextSnapshotId: assessment.portfolioContextSnapshotId,
    r8DecisionRunId: assessment.decisionRunId,
    r6ReadinessState: input.r6ReadinessState,
    r7ReadinessState: input.r7ReadinessState,
    r7RecommendationState: input.r7RecommendationState,
    r6OverallScore: input.r6OverallScore,
    evidenceState: input.evidenceState,
    valuationState: input.valuationState,
    momentumState: input.momentumState,
    r8OverallDisposition: assessment.overallDisposition,
    coreHealth: assessment.coreHealth.state,
    portfolioFit: assessment.portfolioFit.state,
    portfolioRisk: assessment.portfolioRisk.state,
    exitIntelligence: assessment.exitIntelligence.state,
    blockerKeys,
    ownerContextVersion: input.ownerContextVersion,
  }
  const observedStateId = programCR8SemanticFingerprint(
    "PROGRAM_C_R9_OBSERVED_STATE",
    semantic,
  )

  return {
    version: PROGRAM_C_R9_OBSERVED_STATE_VERSION,
    observedStateId,
    securityId,
    portfolioId,
    assetClass,
    observedAt,
    lineage: {
      classificationVersion: input.classificationVersion,
      researchProfileCode: assessment.upstreamLineage.researchProfileCode,
      methodologyId: assessment.upstreamLineage.methodologyId,
      methodologyVersion: assessment.upstreamLineage.methodologyVersion,
      methodologyRole: assessment.upstreamLineage.methodologyRole,
      assignmentId: assessment.upstreamLineage.assignmentId,
      assignmentVersion: assessment.upstreamLineage.assignmentVersion,
      evidenceSnapshotId: assessment.upstreamLineage.evidenceSnapshotId,
      scoreRunId: assessment.upstreamLineage.scoreRunId,
      recommendationRunId: assessment.upstreamLineage.recommendationRunId,
      portfolioContextSnapshotId: assessment.portfolioContextSnapshotId,
      r8DecisionRunId: assessment.decisionRunId,
    },
    states: {
      r6ReadinessState: input.r6ReadinessState,
      r7ReadinessState: input.r7ReadinessState,
      r7RecommendationState: input.r7RecommendationState,
      evidenceState: input.evidenceState,
      valuationState: input.valuationState,
      momentumState: input.momentumState,
      r8OverallDisposition: assessment.overallDisposition,
      coreHealth: assessment.coreHealth.state,
      portfolioFit: assessment.portfolioFit.state,
      portfolioRisk: assessment.portfolioRisk.state,
      exitIntelligence: assessment.exitIntelligence.state,
      blockerKeys,
    },
    values: {
      r6OverallScore: input.r6OverallScore,
    },
    ownerContextVersion: input.ownerContextVersion,
  }
}
