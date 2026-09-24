import type { ProgramCR8PortfolioDecisionAssessment } from "./r8PortfolioDecisionContract"
import { buildProgramCR8ReferenceValidationAssessments } from "./r8ReferenceValidation"
import { compareProgramCR9ObservedStates, deduplicateProgramCR9Events } from "./r9MeaningfulChangeEngine"
import type { ProgramCR9MeaningfulChangeEvent } from "./r9MeaningfulChangeContract"
import { buildProgramCR9ObservedState, type ProgramCR9ObservedStateInput } from "./r9ObservedState"

export const PROGRAM_C_R9_REFERENCE_VALIDATION_VERSION =
  "PROGRAM_C_R9_REFERENCE_VALIDATION_V1" as const

function fixtureAssessment(
  assessment: ProgramCR8PortfolioDecisionAssessment,
  input: {
    readonly decisionRunId: string
    readonly coreHealthState?: ProgramCR8PortfolioDecisionAssessment["coreHealth"]["state"]
    readonly assignmentVersion?: string | number | null
    readonly blockers?: ProgramCR8PortfolioDecisionAssessment["blockers"]
  },
): ProgramCR8PortfolioDecisionAssessment {
  return {
    ...assessment,
    decisionRunId: input.decisionRunId,
    upstreamLineage: {
      ...assessment.upstreamLineage,
      assignmentVersion: input.assignmentVersion ?? assessment.upstreamLineage.assignmentVersion,
    },
    coreHealth: {
      ...assessment.coreHealth,
      state: input.coreHealthState ?? assessment.coreHealth.state,
    },
    blockers: input.blockers ?? assessment.blockers,
  }
}

function observed(
  assessment: ProgramCR8PortfolioDecisionAssessment,
  overrides: Partial<Omit<ProgramCR9ObservedStateInput, "r8Assessment" | "securityId" | "portfolioId">> = {},
) {
  return buildProgramCR9ObservedState({
    securityId: assessment.securityId,
    portfolioId: assessment.portfolioId,
    assetClass: "EQUITY",
    observedAt: "2026-09-25T00:00:00.000Z",
    r6ReadinessState: "READY",
    r7ReadinessState: assessment.upstreamLineage.recommendationRunId ? "READY" : "NOT_MATERIALIZED",
    r7RecommendationState: "CORE_CANDIDATE",
    r6OverallScore: "75.1575",
    evidenceState: "FRESH",
    valuationState: "VALUATION_NEUTRAL",
    momentumState: "MOMENTUM_POSITIVE",
    ownerContextVersion: "C3_REFERENCE_OWNER_CONTEXT_V1",
    classificationVersion: "C3_REFERENCE_CLASSIFICATION_V1",
    ...overrides,
    r8Assessment: assessment,
  })
}

export function buildProgramCR9ReferenceValidation() {
  const r8 = buildProgramCR8ReferenceValidationAssessments()
  const tornt = r8.rows.find((row) => row.symbol === "TORNTPHARM")
  const alivus = r8.rows.find((row) => row.symbol === "ALIVUS")
  if (!tornt || !alivus) {
    throw new Error("Program C C3 reference validation requires TORNTPHARM and ALIVUS R8 fixtures.")
  }

  const torntCurrent = observed(tornt.assessment, {
    observedAt: "2026-09-25T00:00:00.000Z",
  })
  const firstObservation = compareProgramCR9ObservedStates(null, torntCurrent)

  const torntReplay = observed(tornt.assessment, {
    observedAt: "2026-09-25T01:00:00.000Z",
  })
  const noChange = compareProgramCR9ObservedStates(torntCurrent, torntReplay)

  const rawScoreChange = observed(tornt.assessment, {
    observedAt: "2026-09-25T02:00:00.000Z",
    r6OverallScore: "75.2575",
  })
  const immaterial = compareProgramCR9ObservedStates(torntReplay, rawScoreChange)

  const watchAssessment = fixtureAssessment(tornt.assessment, {
    decisionRunId: "C3_FIXTURE_R8_TORNTPHARM_PREVIOUS_WATCH",
    coreHealthState: "CORE_WATCH",
  })
  const watchObserved = observed(watchAssessment, {
    observedAt: "2026-09-24T23:00:00.000Z",
  })
  const coreHealthMeaningful = compareProgramCR9ObservedStates(
    watchObserved,
    torntCurrent,
  )

  const freshObserved = observed(tornt.assessment, {
    observedAt: "2026-09-25T03:00:00.000Z",
    evidenceState: "FRESH",
  })
  const staleObserved = observed(tornt.assessment, {
    observedAt: "2026-09-25T04:00:00.000Z",
    evidenceState: "STALE",
  })
  const evidenceMeaningful = compareProgramCR9ObservedStates(
    freshObserved,
    staleObserved,
  )
  const missingObserved = observed(tornt.assessment, {
    observedAt: "2026-09-25T05:00:00.000Z",
    evidenceState: "MISSING",
  })
  const missingEvidenceMeaningful = compareProgramCR9ObservedStates(
    staleObserved,
    missingObserved,
  )
  const conflictingObserved = observed(tornt.assessment, {
    observedAt: "2026-09-25T06:00:00.000Z",
    evidenceState: "CONFLICTING",
  })
  const conflictingEvidenceMeaningful = compareProgramCR9ObservedStates(
    missingObserved,
    conflictingObserved,
  )

  const assignmentPreviousAssessment = fixtureAssessment(tornt.assessment, {
    decisionRunId: "C3_FIXTURE_R8_TORNTPHARM_ASSIGNMENT_PREVIOUS",
    assignmentVersion: 999,
  })
  const assignmentPrevious = observed(assignmentPreviousAssessment, {
    observedAt: "2026-09-24T22:00:00.000Z",
  })
  const assignmentMeaningful = compareProgramCR9ObservedStates(
    assignmentPrevious,
    torntCurrent,
  )

  const blockerPreviousAssessment = fixtureAssessment(tornt.assessment, {
    decisionRunId: "C3_FIXTURE_R8_TORNTPHARM_BLOCKED_PREVIOUS",
    blockers: [{
      domain: "EVIDENCE",
      requiredState: "FRESH",
      observedState: "STALE",
      reasonCode: "MANDATORY_EVIDENCE_STALE",
      sourceIdentity: "C3_FIXTURE_BLOCKER",
    }],
  })
  const blockerPrevious = observed(blockerPreviousAssessment, {
    observedAt: "2026-09-24T21:00:00.000Z",
  })
  const blockerCleared = compareProgramCR9ObservedStates(
    blockerPrevious,
    torntCurrent,
  )
  const blockerCurrent = observed(blockerPreviousAssessment, {
    observedAt: "2026-09-25T01:30:00.000Z",
  })
  const blockerAppeared = compareProgramCR9ObservedStates(
    torntCurrent,
    blockerCurrent,
  )

  const outOfOrder = compareProgramCR9ObservedStates(
    staleObserved,
    freshObserved,
  )

  const alivusObserved = observed(alivus.assessment, {
    observedAt: "2026-09-25T05:00:00.000Z",
    r7RecommendationState: "SATELLITE_CANDIDATE",
  })
  const incomparable = compareProgramCR9ObservedStates(
    torntCurrent,
    alivusObserved,
  )

  const duplicateInput = [
    coreHealthMeaningful.event,
    coreHealthMeaningful.event,
    evidenceMeaningful.event,
  ].filter((event): event is ProgramCR9MeaningfulChangeEvent => event !== null)

  return {
    version: PROGRAM_C_R9_REFERENCE_VALIDATION_VERSION,
    fixtureOnly: true as const,
    firstObservation,
    noChange,
    immaterial,
    coreHealthMeaningful,
    evidenceMeaningful,
    missingEvidenceMeaningful,
    conflictingEvidenceMeaningful,
    assignmentMeaningful,
    blockerCleared,
    blockerAppeared,
    outOfOrder,
    incomparable,
    deduplicatedEvents: deduplicateProgramCR9Events(duplicateInput),
    observations: {
      torntCurrent,
      torntReplay,
      watchObserved,
      freshObserved,
      staleObserved,
      missingObserved,
      conflictingObserved,
      assignmentPrevious,
      blockerPrevious,
      blockerCurrent,
      alivusObserved,
    },
  }
}
