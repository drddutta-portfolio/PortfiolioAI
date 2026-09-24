import { buildProgramCR8C2Validation } from "./r8C2Validation"
import { PROGRAM_C_R9_AUTHORITY } from "./r9AuthorityRegistry"
import { programCR8CanonicalJson } from "./r8Determinism"
import { buildProgramCR9FrozenPortfolioDisposition } from "./r9FrozenPortfolioDisposition"
import {
  PROGRAM_C_R9_C3_SAFETY_BOUNDARY,
} from "./r9MeaningfulChangeEngine"
import {
  PROGRAM_C_R9_IDEMPOTENCY_BOUNDARY,
  PROGRAM_C_R9_PROHIBITED_CAPABILITIES,
} from "./r9MeaningfulChangeContract"
import { PROGRAM_C_R9_NUMERIC_THRESHOLD_AUTHORITY } from "./r9MeaningfulChangeRegistry"
import { buildProgramCR9ReferenceValidation } from "./r9ReferenceValidation"

export const PROGRAM_C_R9_C3_VALIDATION_VERSION =
  "PROGRAM_C_R9_C3_VALIDATION_V1" as const

export function buildProgramCR9C3Validation() {
  const first = buildProgramCR9ReferenceValidation()
  const second = buildProgramCR9ReferenceValidation()
  const frozen = buildProgramCR9FrozenPortfolioDisposition()
  const r8 = buildProgramCR8C2Validation()

  const replayPass = programCR8CanonicalJson(first) === programCR8CanonicalJson(second)
  const baselinePass = (
    first.firstObservation.baselineState === "BASELINE_ESTABLISHED"
    && first.firstObservation.transitionState === "FIRST_OBSERVATION"
    && first.firstObservation.event === null
    && first.noChange.transitionState === "NO_CHANGE"
  )
  const immaterialPass = (
    first.immaterial.transitionState === "RAW_IMMATERIAL_CHANGE"
    && first.immaterial.meaningfulChanges.length === 0
    && first.immaterial.event === null
  )
  const meaningfulPass = [
    first.coreHealthMeaningful,
    first.evidenceMeaningful,
    first.assignmentMeaningful,
    first.blockerCleared,
  ].every((result) => (
    result.transitionState === "MEANINGFUL_CHANGE"
    && result.event !== null
    && result.meaningfulChanges.length > 0
  ))
  const comparisonSafetyPass = (
    first.outOfOrder.transitionState === "OUT_OF_ORDER"
    && first.incomparable.transitionState === "INCOMPARABLE"
  )
  const deduplicationPass = first.deduplicatedEvents.length === 2
  const portfolioDispositionPass = (
    frozen.totalHoldings === 238
    && frozen.rows.length === 238
    && frozen.dispositionComplete
    && frozen.rows.every((row) => (
      row.transitionState === "FIRST_OBSERVATION"
      && row.baselineState === "NO_COMPARABLE_BASELINE"
      && row.changeEventId === null
    ))
  )
  const authorityPass = (
    PROGRAM_C_R9_AUTHORITY.executionAuthority === "C3_OWNER_AUTHORIZED_READ_ONLY"
    && PROGRAM_C_R9_AUTHORITY.materialityAuthority === "VERSIONED_DETERMINISTIC_RULES_ONLY"
    && PROGRAM_C_R9_AUTHORITY.numericThresholdAuthority === "NONE"
    && PROGRAM_C_R9_AUTHORITY.aiDecisionAuthority === "NONE"
    && PROGRAM_C_R9_AUTHORITY.providerAuthority === "NONE"
    && PROGRAM_C_R9_AUTHORITY.persistenceAuthority === "NONE"
    && PROGRAM_C_R9_AUTHORITY.durableNotificationStateAuthority === "NONE"
    && PROGRAM_C_R9_AUTHORITY.ownerMutationAuthority === "NONE"
    && PROGRAM_C_R9_AUTHORITY.sizingAuthority === "NONE"
    && PROGRAM_C_R9_AUTHORITY.schedulerAuthority === "NONE"
    && PROGRAM_C_R9_AUTHORITY.tradingAuthority === "NONE"
  )
  const safetyPass = (
    PROGRAM_C_R9_C3_SAFETY_BOUNDARY.readOnlyExecution
    && PROGRAM_C_R9_C3_SAFETY_BOUNDARY.deterministicMateriality
    && !PROGRAM_C_R9_C3_SAFETY_BOUNDARY.aiMateriality
    && !PROGRAM_C_R9_C3_SAFETY_BOUNDARY.numericThresholdCreation
    && !PROGRAM_C_R9_C3_SAFETY_BOUNDARY.numericSizingAuthority
    && PROGRAM_C_R9_C3_SAFETY_BOUNDARY.providerCalls === 0
    && PROGRAM_C_R9_C3_SAFETY_BOUNDARY.openAiDecisionCalls === 0
    && !PROGRAM_C_R9_C3_SAFETY_BOUNDARY.persistence
    && !PROGRAM_C_R9_C3_SAFETY_BOUNDARY.ownerSettingsMutation
    && !PROGRAM_C_R9_C3_SAFETY_BOUNDARY.trading
    && !PROGRAM_C_R9_PROHIBITED_CAPABILITIES.persistence
    && !PROGRAM_C_R9_IDEMPOTENCY_BOUNDARY.durableAcknowledgement
    && !PROGRAM_C_R9_IDEMPOTENCY_BOUNDARY.durableSnooze
    && PROGRAM_C_R9_NUMERIC_THRESHOLD_AUTHORITY.scoreDeltaThreshold === null
    && PROGRAM_C_R9_NUMERIC_THRESHOLD_AUTHORITY.concentrationDeltaThreshold === null
  )

  const overallPass = (
    replayPass
    && baselinePass
    && immaterialPass
    && meaningfulPass
    && comparisonSafetyPass
    && deduplicationPass
    && portfolioDispositionPass
    && authorityPass
    && safetyPass
    && r8.overallPass
  )

  return {
    version: PROGRAM_C_R9_C3_VALIDATION_VERSION,
    deterministicReplayPass: replayPass,
    baselineSemanticsPass: baselinePass,
    rawImmaterialDistinctionPass: immaterialPass,
    meaningfulCategoricalTransitionsPass: meaningfulPass,
    incomparableAndOutOfOrderPass: comparisonSafetyPass,
    semanticDuplicateSuppressionPass: deduplicationPass,
    frozenPortfolioDispositionPass: portfolioDispositionPass,
    frozenHoldingCount: frozen.totalHoldings,
    frozenMeaningfulEventCount: frozen.meaningfulEventCount,
    r8RegressionPass: r8.overallPass,
    authorityRegistryPass: authorityPass,
    safetyPass,
    providerCalls: 0 as const,
    persistedWrites: 0 as const,
    overallPass,
  }
}
