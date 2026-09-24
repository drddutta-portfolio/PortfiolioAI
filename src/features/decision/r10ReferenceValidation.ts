import type { ProgramCR8PortfolioDecisionAssessment } from "./r8PortfolioDecisionContract"
import { buildProgramCR8ReferenceValidationAssessments } from "./r8ReferenceValidation"
import {
  compareProgramCR9ObservedStates,
} from "./r9MeaningfulChangeEngine"
import { buildProgramCR9ObservedState } from "./r9ObservedState"
import { buildProgramCR9ReferenceValidation } from "./r9ReferenceValidation"
import { evaluateProgramCR10Attention } from "./r10ActionCenterEngine"
import type {
  ProgramCR10Input,
  ProgramCR10OwnerThresholdContext,
} from "./r10ActionCenterContract"

export const PROGRAM_C_R10_REFERENCE_VALIDATION_VERSION =
  "PROGRAM_C_R10_REFERENCE_VALIDATION_V1" as const

function noThresholds(): ProgramCR10OwnerThresholdContext {
  return {
    currentPrice: "800",
    targetPrice: null,
    stopLossPrice: null,
    targetPriceAlertEnabled: true,
    stopLossAlertEnabled: true,
  }
}

function mutatedAssessment(
  assessment: ProgramCR8PortfolioDecisionAssessment,
  input: {
    readonly decisionRunId: string
    readonly overallDisposition?: ProgramCR8PortfolioDecisionAssessment["overallDisposition"]
    readonly coreHealth?: ProgramCR8PortfolioDecisionAssessment["coreHealth"]["state"]
    readonly portfolioFit?: ProgramCR8PortfolioDecisionAssessment["portfolioFit"]["state"]
    readonly portfolioRisk?: ProgramCR8PortfolioDecisionAssessment["portfolioRisk"]["state"]
    readonly exitIntelligence?: ProgramCR8PortfolioDecisionAssessment["exitIntelligence"]["state"]
  },
): ProgramCR8PortfolioDecisionAssessment {
  return {
    ...assessment,
    decisionRunId: input.decisionRunId,
    overallDisposition: input.overallDisposition ?? assessment.overallDisposition,
    coreHealth: {
      ...assessment.coreHealth,
      state: input.coreHealth ?? assessment.coreHealth.state,
    },
    portfolioFit: {
      ...assessment.portfolioFit,
      state: input.portfolioFit ?? assessment.portfolioFit.state,
    },
    portfolioRisk: {
      ...assessment.portfolioRisk,
      state: input.portfolioRisk ?? assessment.portfolioRisk.state,
    },
    exitIntelligence: {
      ...assessment.exitIntelligence,
      state: input.exitIntelligence ?? assessment.exitIntelligence.state,
    },
  }
}

function baselineFor(
  assessment: ProgramCR8PortfolioDecisionAssessment,
  observedAt: string,
  r7RecommendationState: string | null,
  evidenceState: "FRESH" | "STALE" | "MISSING" | "CONFLICTING" = "FRESH",
) {
  const observed = buildProgramCR9ObservedState({
    securityId: assessment.securityId,
    portfolioId: assessment.portfolioId,
    assetClass: "EQUITY",
    observedAt,
    r6ReadinessState: assessment.upstreamLineage.scoreRunId ? "READY" : "BLOCKED_PREREQUISITE",
    r7ReadinessState: assessment.upstreamLineage.recommendationRunId ? "READY" : "NOT_MATERIALIZED",
    r7RecommendationState,
    r6OverallScore: null,
    evidenceState,
    valuationState: null,
    momentumState: null,
    ownerContextVersion: "C4_REFERENCE_OWNER_CONTEXT_V1",
    classificationVersion: "C4_REFERENCE_CLASSIFICATION_V1",
    r8Assessment: assessment,
  })
  return {
    observed,
    comparison: compareProgramCR9ObservedStates(null, observed),
  }
}

function inputFor(
  assessment: ProgramCR8PortfolioDecisionAssessment,
  r9: ReturnType<typeof compareProgramCR9ObservedStates>,
  r9DecisionRunId: string | null,
  ownerContext: ProgramCR10Input["ownerContext"],
  r7RecommendationState: string | null,
  classificationVersion: string | null,
  thresholds: ProgramCR10OwnerThresholdContext = noThresholds(),
): ProgramCR10Input {
  return {
    securityId: assessment.securityId,
    portfolioId: assessment.portfolioId,
    symbol: "TORNTPHARM",
    company: "Torrent Pharmaceuticals",
    asOf: "2026-09-25T12:00:00.000Z",
    classificationVersion,
    r9CurrentR8DecisionRunId: r9DecisionRunId,
    r7RecommendationState,
    r8: assessment,
    r9,
    ownerContext,
    ownerThresholds: thresholds,
  }
}

export function buildProgramCR10ReferenceValidation() {
  const r8 = buildProgramCR8ReferenceValidationAssessments()
  const r9 = buildProgramCR9ReferenceValidation()
  const tornt = r8.rows.find((row) => row.symbol === "TORNTPHARM")
  if (!tornt) {
    throw new Error("Program C C4 reference validation requires TORNTPHARM R8 fixture.")
  }
  const ownerContext = r8.context.holdings.find(
    (holding) => holding.securityId === tornt.assessment.securityId,
  )?.ownerContext
  if (!ownerContext) {
    throw new Error("Program C C4 reference validation requires TORNTPHARM owner context.")
  }

  const noAction = evaluateProgramCR10Attention(inputFor(
    tornt.assessment,
    r9.noChange,
    r9.observations.torntReplay.lineage.r8DecisionRunId,
    ownerContext,
    "CORE_CANDIDATE",
    r9.observations.torntReplay.lineage.classificationVersion,
  ))

  const firstObservation = evaluateProgramCR10Attention(inputFor(
    tornt.assessment,
    r9.firstObservation,
    r9.observations.torntCurrent.lineage.r8DecisionRunId,
    ownerContext,
    "CORE_CANDIDATE",
    r9.observations.torntCurrent.lineage.classificationVersion,
  ))

  const exitAssessment = mutatedAssessment(tornt.assessment, {
    decisionRunId: "C4_FIXTURE_R8_EXIT_REVIEW",
    exitIntelligence: "HARD_EXIT_REVIEW",
  })
  const exitBaseline = baselineFor(
    exitAssessment,
    "2026-09-25T07:00:00.000Z",
    "CORE_CANDIDATE",
  )
  const exitConflict = evaluateProgramCR10Attention(inputFor(
    exitAssessment,
    exitBaseline.comparison,
    exitBaseline.observed.lineage.r8DecisionRunId,
    ownerContext,
    "CORE_CANDIDATE",
    exitBaseline.observed.lineage.classificationVersion,
  ))

  const concentrationAssessment = mutatedAssessment(tornt.assessment, {
    decisionRunId: "C4_FIXTURE_R8_CONCENTRATION",
    portfolioFit: "CONCENTRATION_REVIEW",
  })
  const concentrationBaseline = baselineFor(
    concentrationAssessment,
    "2026-09-25T08:00:00.000Z",
    null,
  )
  const concentration = evaluateProgramCR10Attention(inputFor(
    concentrationAssessment,
    concentrationBaseline.comparison,
    concentrationBaseline.observed.lineage.r8DecisionRunId,
    ownerContext,
    null,
    concentrationBaseline.observed.lineage.classificationVersion,
  ))

  const roleAssessment = mutatedAssessment(tornt.assessment, {
    decisionRunId: "C4_FIXTURE_R8_ROLE_REVIEW",
    portfolioFit: "ROLE_COMPATIBILITY_REVIEW",
  })
  const roleBaseline = baselineFor(
    roleAssessment,
    "2026-09-25T09:00:00.000Z",
    null,
  )
  const roleReview = evaluateProgramCR10Attention(inputFor(
    roleAssessment,
    roleBaseline.comparison,
    roleBaseline.observed.lineage.r8DecisionRunId,
    ownerContext,
    null,
    roleBaseline.observed.lineage.classificationVersion,
  ))

  const blockedAssessment = mutatedAssessment(tornt.assessment, {
    decisionRunId: "C4_FIXTURE_R8_BLOCKED",
    overallDisposition: "BLOCKED_PREREQUISITE",
    coreHealth: "BLOCKED_PREREQUISITE",
  })
  const blockedBaseline = baselineFor(
    blockedAssessment,
    "2026-09-25T10:00:00.000Z",
    null,
  )
  const blocked = evaluateProgramCR10Attention(inputFor(
    blockedAssessment,
    blockedBaseline.comparison,
    blockedBaseline.observed.lineage.r8DecisionRunId,
    ownerContext,
    null,
    blockedBaseline.observed.lineage.classificationVersion,
  ))

  const partialAssessment = mutatedAssessment(tornt.assessment, {
    decisionRunId: "C4_FIXTURE_R8_PARTIAL_EVIDENCE",
    overallDisposition: "ASSESSMENT_PARTIAL",
    portfolioRisk: "INSUFFICIENT_EVIDENCE",
  })
  const partialFresh = buildProgramCR9ObservedState({
    securityId: partialAssessment.securityId,
    portfolioId: partialAssessment.portfolioId,
    assetClass: "EQUITY",
    observedAt: "2026-09-25T10:30:00.000Z",
    r6ReadinessState: "READY",
    r7ReadinessState: "READY",
    r7RecommendationState: null,
    r6OverallScore: null,
    evidenceState: "FRESH",
    valuationState: null,
    momentumState: null,
    ownerContextVersion: "C4_REFERENCE_OWNER_CONTEXT_V1",
    classificationVersion: "C4_REFERENCE_CLASSIFICATION_V1",
    r8Assessment: partialAssessment,
  })
  const partialStale = buildProgramCR9ObservedState({
    securityId: partialAssessment.securityId,
    portfolioId: partialAssessment.portfolioId,
    assetClass: "EQUITY",
    observedAt: "2026-09-25T11:00:00.000Z",
    r6ReadinessState: "READY",
    r7ReadinessState: "READY",
    r7RecommendationState: null,
    r6OverallScore: null,
    evidenceState: "STALE",
    valuationState: null,
    momentumState: null,
    ownerContextVersion: "C4_REFERENCE_OWNER_CONTEXT_V1",
    classificationVersion: "C4_REFERENCE_CLASSIFICATION_V1",
    r8Assessment: partialAssessment,
  })
  const evidenceComparison = compareProgramCR9ObservedStates(
    partialFresh,
    partialStale,
  )
  const evidenceReview = evaluateProgramCR10Attention(inputFor(
    partialAssessment,
    evidenceComparison,
    partialStale.lineage.r8DecisionRunId,
    ownerContext,
    null,
    partialStale.lineage.classificationVersion,
  ))

  const stopThreshold = evaluateProgramCR10Attention(inputFor(
    tornt.assessment,
    r9.noChange,
    r9.observations.torntReplay.lineage.r8DecisionRunId,
    ownerContext,
    "CORE_CANDIDATE",
    r9.observations.torntReplay.lineage.classificationVersion,
    {
      currentPrice: "600",
      targetPrice: null,
      stopLossPrice: "650",
      targetPriceAlertEnabled: true,
      stopLossAlertEnabled: true,
    },
  ))

  return {
    version: PROGRAM_C_R10_REFERENCE_VALIDATION_VERSION,
    fixtureOnly: true as const,
    noAction,
    firstObservation,
    exitConflict,
    concentration,
    roleReview,
    blocked,
    evidenceReview,
    stopThreshold,
  }
}
