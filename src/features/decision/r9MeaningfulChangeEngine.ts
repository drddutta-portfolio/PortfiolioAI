import { programCR9ChangeEventId } from "./r9EventIdentity"
import {
  PROGRAM_C_R9_CONTRACT_VERSION,
  PROGRAM_C_R9_RULE_REGISTRY_VERSION,
  type ProgramCR9ChangeFact,
  type ProgramCR9ComparisonResult,
  type ProgramCR9MeaningfulChangeEvent,
} from "./r9MeaningfulChangeContract"
import { programCR9Rule } from "./r9MeaningfulChangeRegistry"
import type { ProgramCR9ObservedState } from "./r9ObservedState"

export const PROGRAM_C_R9_EXECUTION_VERSION =
  "PROGRAM_C_R9_EXECUTION_V1" as const

function text(value: string | number | null) {
  return value === null ? null : String(value)
}

function addChange(
  changes: ProgramCR9ChangeFact[],
  code: string,
  previousValue: string | number | null,
  currentValue: string | number | null,
) {
  const before = text(previousValue)
  const after = text(currentValue)
  if (before === after) return
  const rule = programCR9Rule(code)
  changes.push({
    code: rule.code,
    domain: rule.domain,
    materiality: rule.materiality,
    previousValue: before,
    currentValue: after,
    ruleVersion: PROGRAM_C_R9_RULE_REGISTRY_VERSION,
    reasonCode: code,
  })
}

function setValue(values: readonly string[]) {
  return [...values].sort().join("|")
}

function comparable(
  previous: ProgramCR9ObservedState,
  current: ProgramCR9ObservedState,
) {
  return (
    previous.securityId === current.securityId
    && previous.portfolioId === current.portfolioId
    && previous.assetClass === current.assetClass
  )
}

function compareTimestamp(
  previous: ProgramCR9ObservedState,
  current: ProgramCR9ObservedState,
) {
  return Date.parse(current.observedAt) - Date.parse(previous.observedAt)
}

function changesBetween(
  previous: ProgramCR9ObservedState,
  current: ProgramCR9ObservedState,
): readonly ProgramCR9ChangeFact[] {
  const changes: ProgramCR9ChangeFact[] = []

  addChange(changes, "R6_READINESS_CHANGED", previous.states.r6ReadinessState, current.states.r6ReadinessState)
  addChange(changes, "R7_READINESS_CHANGED", previous.states.r7ReadinessState, current.states.r7ReadinessState)
  addChange(changes, "R7_RECOMMENDATION_CHANGED", previous.states.r7RecommendationState, current.states.r7RecommendationState)

  addChange(changes, "METHODOLOGY_ID_CHANGED", previous.lineage.methodologyId, current.lineage.methodologyId)
  addChange(changes, "METHODOLOGY_VERSION_CHANGED", previous.lineage.methodologyVersion, current.lineage.methodologyVersion)
  addChange(changes, "METHODOLOGY_ROLE_CHANGED", previous.lineage.methodologyRole, current.lineage.methodologyRole)
  addChange(changes, "ASSIGNMENT_ID_CHANGED", previous.lineage.assignmentId, current.lineage.assignmentId)
  addChange(changes, "ASSIGNMENT_VERSION_CHANGED", previous.lineage.assignmentVersion, current.lineage.assignmentVersion)
  addChange(changes, "CLASSIFICATION_VERSION_CHANGED", previous.lineage.classificationVersion, current.lineage.classificationVersion)

  addChange(changes, "EVIDENCE_STATE_CHANGED", previous.states.evidenceState, current.states.evidenceState)
  addChange(changes, "VALUATION_STATE_CHANGED", previous.states.valuationState, current.states.valuationState)
  addChange(changes, "MOMENTUM_STATE_CHANGED", previous.states.momentumState, current.states.momentumState)

  addChange(changes, "R8_OVERALL_CHANGED", previous.states.r8OverallDisposition, current.states.r8OverallDisposition)
  addChange(changes, "CORE_HEALTH_CHANGED", previous.states.coreHealth, current.states.coreHealth)
  addChange(changes, "PORTFOLIO_FIT_CHANGED", previous.states.portfolioFit, current.states.portfolioFit)
  addChange(changes, "PORTFOLIO_RISK_CHANGED", previous.states.portfolioRisk, current.states.portfolioRisk)
  addChange(changes, "EXIT_INTELLIGENCE_CHANGED", previous.states.exitIntelligence, current.states.exitIntelligence)
  addChange(changes, "R8_BLOCKER_SET_CHANGED", setValue(previous.states.blockerKeys), setValue(current.states.blockerKeys))
  addChange(changes, "OWNER_CONTEXT_VERSION_CHANGED", previous.ownerContextVersion, current.ownerContextVersion)

  addChange(changes, "R6_SCORE_RUN_CHANGED", previous.lineage.scoreRunId, current.lineage.scoreRunId)
  addChange(changes, "R7_RECOMMENDATION_RUN_CHANGED", previous.lineage.recommendationRunId, current.lineage.recommendationRunId)
  addChange(changes, "R8_DECISION_RUN_CHANGED", previous.lineage.r8DecisionRunId, current.lineage.r8DecisionRunId)
  addChange(changes, "EVIDENCE_SNAPSHOT_CHANGED", previous.lineage.evidenceSnapshotId, current.lineage.evidenceSnapshotId)
  addChange(
    changes,
    "PORTFOLIO_CONTEXT_SNAPSHOT_CHANGED",
    previous.lineage.portfolioContextSnapshotId,
    current.lineage.portfolioContextSnapshotId,
  )
  addChange(
    changes,
    "R6_SCORE_VALUE_CHANGED_WITHOUT_THRESHOLD",
    previous.values.r6OverallScore,
    current.values.r6OverallScore,
  )

  return changes
}

function meaningfulEvent(
  current: ProgramCR9ObservedState,
  previous: ProgramCR9ObservedState,
  rawChanges: readonly ProgramCR9ChangeFact[],
): ProgramCR9MeaningfulChangeEvent {
  const meaningfulChanges = rawChanges.filter(
    (change) => change.materiality === "MEANINGFUL",
  )
  if (!meaningfulChanges.length) {
    throw new Error("Program C R9 event requires at least one meaningful change.")
  }
  const eventId = programCR9ChangeEventId({
    securityId: current.securityId,
    portfolioId: current.portfolioId,
    previousObservedStateId: previous.observedStateId,
    currentObservedStateId: current.observedStateId,
    ruleVersion: PROGRAM_C_R9_RULE_REGISTRY_VERSION,
  })
  return {
    version: PROGRAM_C_R9_CONTRACT_VERSION,
    eventId,
    securityId: current.securityId,
    portfolioId: current.portfolioId,
    previousObservedStateId: previous.observedStateId,
    currentObservedStateId: current.observedStateId,
    ruleVersion: PROGRAM_C_R9_RULE_REGISTRY_VERSION,
    meaningfulChanges,
    rawChanges,
    reasonCodes: [
      "R9_MEANINGFUL_CHANGE",
      ...meaningfulChanges.map((change) => change.reasonCode),
    ],
  }
}

export function compareProgramCR9ObservedStates(
  previous: ProgramCR9ObservedState | null,
  current: ProgramCR9ObservedState,
): ProgramCR9ComparisonResult {
  if (previous === null) {
    return {
      version: PROGRAM_C_R9_CONTRACT_VERSION,
      securityId: current.securityId,
      portfolioId: current.portfolioId,
      baselineState: "BASELINE_ESTABLISHED",
      transitionState: "FIRST_OBSERVATION",
      previousObservedStateId: null,
      currentObservedStateId: current.observedStateId,
      rawChanges: [],
      meaningfulChanges: [],
      event: null,
      reasonCodes: [
        "R9_FIRST_OBSERVATION",
        "R9_FIRST_OBSERVATION_NOT_NO_CHANGE",
      ],
    }
  }

  if (!comparable(previous, current)) {
    return {
      version: PROGRAM_C_R9_CONTRACT_VERSION,
      securityId: current.securityId,
      portfolioId: current.portfolioId,
      baselineState: "NO_COMPARABLE_BASELINE",
      transitionState: "INCOMPARABLE",
      previousObservedStateId: previous.observedStateId,
      currentObservedStateId: current.observedStateId,
      rawChanges: [],
      meaningfulChanges: [],
      event: null,
      reasonCodes: ["R9_OBSERVATIONS_INCOMPARABLE"],
    }
  }

  const order = compareTimestamp(previous, current)
  if (order < 0 || (order === 0 && previous.observedStateId !== current.observedStateId)) {
    return {
      version: PROGRAM_C_R9_CONTRACT_VERSION,
      securityId: current.securityId,
      portfolioId: current.portfolioId,
      baselineState: "COMPARABLE_BASELINE",
      transitionState: "OUT_OF_ORDER",
      previousObservedStateId: previous.observedStateId,
      currentObservedStateId: current.observedStateId,
      rawChanges: [],
      meaningfulChanges: [],
      event: null,
      reasonCodes: ["R9_OUT_OF_ORDER_OBSERVATION"],
    }
  }

  const rawChanges = changesBetween(previous, current)
  if (!rawChanges.length) {
    return {
      version: PROGRAM_C_R9_CONTRACT_VERSION,
      securityId: current.securityId,
      portfolioId: current.portfolioId,
      baselineState: "COMPARABLE_BASELINE",
      transitionState: "NO_CHANGE",
      previousObservedStateId: previous.observedStateId,
      currentObservedStateId: current.observedStateId,
      rawChanges: [],
      meaningfulChanges: [],
      event: null,
      reasonCodes: ["R9_NO_SEMANTIC_CHANGE"],
    }
  }

  const meaningfulChanges = rawChanges.filter(
    (change) => change.materiality === "MEANINGFUL",
  )
  if (!meaningfulChanges.length) {
    return {
      version: PROGRAM_C_R9_CONTRACT_VERSION,
      securityId: current.securityId,
      portfolioId: current.portfolioId,
      baselineState: "COMPARABLE_BASELINE",
      transitionState: "RAW_IMMATERIAL_CHANGE",
      previousObservedStateId: previous.observedStateId,
      currentObservedStateId: current.observedStateId,
      rawChanges,
      meaningfulChanges: [],
      event: null,
      reasonCodes: [
        "R9_RAW_CHANGE_NO_APPROVED_MATERIALITY_RULE",
        ...rawChanges.map((change) => change.reasonCode),
      ],
    }
  }

  const event = meaningfulEvent(current, previous, rawChanges)
  return {
    version: PROGRAM_C_R9_CONTRACT_VERSION,
    securityId: current.securityId,
    portfolioId: current.portfolioId,
    baselineState: "COMPARABLE_BASELINE",
    transitionState: "MEANINGFUL_CHANGE",
    previousObservedStateId: previous.observedStateId,
    currentObservedStateId: current.observedStateId,
    rawChanges,
    meaningfulChanges,
    event,
    reasonCodes: event.reasonCodes,
  }
}

export function deduplicateProgramCR9Events(
  events: readonly ProgramCR9MeaningfulChangeEvent[],
): readonly ProgramCR9MeaningfulChangeEvent[] {
  const byId = new Map<string, ProgramCR9MeaningfulChangeEvent>()
  for (const event of events) {
    if (!byId.has(event.eventId)) byId.set(event.eventId, event)
  }
  return [...byId.values()].sort((left, right) => left.eventId.localeCompare(right.eventId))
}

export const PROGRAM_C_R9_C3_SAFETY_BOUNDARY = {
  readOnlyExecution: true,
  deterministicMateriality: true,
  aiMateriality: false,
  numericThresholdCreation: false,
  numericSizingAuthority: false,
  providerCalls: 0,
  angelOneCalls: 0,
  trendlyneCalls: 0,
  openAiDecisionCalls: 0,
  persistence: false,
  durableAcknowledgement: false,
  durableSnooze: false,
  persistentNotificationDeduplication: false,
  crossSessionSeenUnseenState: false,
  ownerSettingsMutation: false,
  schemaMigration: false,
  productionMutation: false,
  deployment: false,
  merge: false,
  schedulerMutation: false,
  trading: false,
} as const
