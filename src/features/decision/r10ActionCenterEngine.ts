import Decimal from "decimal.js"
import { programCR10IntegratedAttentionId } from "./r10Identity"
import { selectProgramCR10State } from "./r10PrecedenceRegistry"
import {
  PROGRAM_C_R10_CONTRACT_VERSION,
  type ProgramCR10AttentionState,
  type ProgramCR10Conflict,
  type ProgramCR10Input,
  type ProgramCR10IntegratedAttention,
} from "./r10ActionCenterContract"

export const PROGRAM_C_R10_EXECUTION_VERSION =
  "PROGRAM_C_R10_EXECUTION_V1" as const

function exact(value: string | null) {
  if (value === null) return null
  try {
    return new Decimal(value)
  } catch {
    return null
  }
}

function directRole(recommendation: string | null) {
  if (recommendation === "CORE_CANDIDATE") return "CORE"
  if (recommendation === "SATELLITE_CANDIDATE") return "SATELLITE"
  return null
}

function favourableRecommendation(value: string | null) {
  return value === "CORE_CANDIDATE" || value === "SATELLITE_CANDIDATE"
}

function unique(values: readonly string[]) {
  return [...new Set(values)]
}

function hasMeaningfulCode(input: ProgramCR10Input, code: string) {
  return input.r9.meaningfulChanges.some((change) => change.code === code)
}

function currentMeaningfulValue(input: ProgramCR10Input, code: string) {
  return input.r9.meaningfulChanges.find((change) => change.code === code)?.currentValue ?? null
}

function ownerThresholdSignals(input: ProgramCR10Input) {
  const current = exact(input.ownerThresholds.currentPrice)
  const target = exact(input.ownerThresholds.targetPrice)
  const stop = exact(input.ownerThresholds.stopLossPrice)
  return {
    targetReached: Boolean(
      current
      && target
      && input.ownerThresholds.targetPriceAlertEnabled
      && current.gte(target),
    ),
    stopReached: Boolean(
      current
      && stop
      && input.ownerThresholds.stopLossAlertEnabled
      && current.lte(stop),
    ),
  }
}

function conflictRows(input: ProgramCR10Input): readonly ProgramCR10Conflict[] {
  const conflicts: ProgramCR10Conflict[] = []
  const rec = input.r7RecommendationState
  const ownerRole = input.ownerContext.portfolioRole
  const exitState = input.r8.exitIntelligence.state
  const riskState = input.r8.portfolioRisk.state
  const fitState = input.r8.portfolioFit.state

  if (
    favourableRecommendation(rec)
    && ["EXIT_RISK_ELEVATED", "HARD_EXIT_REVIEW"].includes(exitState)
  ) {
    conflicts.push({
      code: "FAVOURABLE_RECOMMENDATION_VS_EXIT_RISK",
      summary: "Favourable recommendation context conflicts with elevated Exit Intelligence.",
      supportingState: rec ?? "RECOMMENDATION_NONE",
      counterState: exitState,
    })
  }

  if (
    favourableRecommendation(rec)
    && ["RISK_ELEVATED", "RISK_CRITICAL_REVIEW"].includes(riskState)
  ) {
    conflicts.push({
      code: "FAVOURABLE_RECOMMENDATION_VS_PORTFOLIO_RISK",
      summary: "Favourable recommendation context conflicts with elevated Portfolio Risk.",
      supportingState: rec ?? "RECOMMENDATION_NONE",
      counterState: riskState,
    })
  }

  const suggestedRole = directRole(rec)
  if (suggestedRole && ownerRole && suggestedRole !== ownerRole) {
    conflicts.push({
      code: "RECOMMENDATION_ROLE_VS_OWNER_ROLE",
      summary: "Deterministic recommendation-role candidate differs from the owner-authored portfolio role.",
      supportingState: rec ?? "RECOMMENDATION_NONE",
      counterState: ownerRole,
    })
  }

  if (favourableRecommendation(rec) && fitState === "CONCENTRATION_REVIEW") {
    conflicts.push({
      code: "FAVOURABLE_RECOMMENDATION_VS_CONCENTRATION",
      summary: "Favourable recommendation context coexists with owner-limit-relative concentration.",
      supportingState: rec ?? "RECOMMENDATION_NONE",
      counterState: fitState,
    })
  }

  if (
    input.r8.overallDisposition === "ASSESSMENT_COMPLETE"
    && hasMeaningfulCode(input, "EVIDENCE_STATE_CHANGED")
    && ["STALE", "MISSING", "CONFLICTING"].includes(
      currentMeaningfulValue(input, "EVIDENCE_STATE_CHANGED") ?? "",
    )
  ) {
    conflicts.push({
      code: "POSITIVE_R8_CONTEXT_VS_EVIDENCE_DETERIORATION",
      summary: "Complete R8 context coexists with a meaningful deterioration in evidence state.",
      supportingState: input.r8.overallDisposition,
      counterState:
        currentMeaningfulValue(input, "EVIDENCE_STATE_CHANGED")
        ?? "EVIDENCE_DETERIORATED",
    })
  }

  return conflicts
}

function deriveSignals(input: ProgramCR10Input, conflicts: readonly ProgramCR10Conflict[]) {
  const states: ProgramCR10AttentionState[] = []
  const reasons: string[] = []
  const supportingStates: string[] = []
  const counterSignals: string[] = []

  const add = (state: ProgramCR10AttentionState, reason: string) => {
    states.push(state)
    reasons.push(reason)
    supportingStates.push(state)
  }

  if (
    input.r8.overallDisposition === "NOT_APPLICABLE"
    || (
      input.r8.coreHealth.state === "NOT_APPLICABLE"
      && input.r8.portfolioFit.state === "NOT_APPLICABLE"
      && input.r8.portfolioRisk.state === "NOT_APPLICABLE"
      && input.r8.exitIntelligence.state === "NOT_APPLICABLE"
    )
  ) {
    add("NOT_APPLICABLE", "R8_NOT_APPLICABLE")
    return { states, reasons, supportingStates, counterSignals }
  }

  const exitState = input.r8.exitIntelligence.state
  if (exitState === "HARD_EXIT_REVIEW" || exitState === "EXIT_RISK_ELEVATED") {
    add("EXIT_REVIEW", `R8_${exitState}`)
  }

  if (
    input.r8.overallDisposition === "REVIEW_REQUIRED"
    || input.r9.transitionState === "INCOMPARABLE"
    || input.r9.transitionState === "OUT_OF_ORDER"
    || conflicts.length > 0
  ) {
    add("REVIEW_REQUIRED", conflicts.length ? "R10_AUTHORITATIVE_SIGNAL_CONFLICT" : "UPSTREAM_REVIEW_REQUIRED")
  }

  if (
    input.r8.overallDisposition === "BLOCKED_PREREQUISITE"
    || input.r8.coreHealth.state === "BLOCKED_PREREQUISITE"
    || input.r8.portfolioFit.state === "BLOCKED_PREREQUISITE"
    || input.r8.portfolioRisk.state === "BLOCKED_PREREQUISITE"
    || input.r8.exitIntelligence.state === "BLOCKED_PREREQUISITE"
  ) {
    add("BLOCKED_PREREQUISITE", "R8_BLOCKED_PREREQUISITE")
  }

  if (hasMeaningfulCode(input, "EVIDENCE_STATE_CHANGED")) {
    const evidence = currentMeaningfulValue(input, "EVIDENCE_STATE_CHANGED")
    if (["STALE", "MISSING", "CONFLICTING", "REVIEW_REQUIRED"].includes(evidence ?? "")) {
      add("EVIDENCE_REVIEW", `R9_EVIDENCE_STATE_${evidence}`)
    }
  }

  if (
    input.r8.overallDisposition === "INSUFFICIENT_EVIDENCE"
    || input.r8.coreHealth.state === "INSUFFICIENT_EVIDENCE"
    || input.r8.portfolioFit.state === "INSUFFICIENT_EVIDENCE"
    || input.r8.portfolioRisk.state === "INSUFFICIENT_EVIDENCE"
    || input.r8.exitIntelligence.state === "INSUFFICIENT_EVIDENCE"
  ) {
    add("INSUFFICIENT_EVIDENCE", "R8_INSUFFICIENT_EVIDENCE")
  }

  const riskState = input.r8.portfolioRisk.state
  if (riskState === "RISK_ELEVATED" || riskState === "RISK_CRITICAL_REVIEW") {
    add("RISK_REVIEW", `R8_${riskState}`)
  }

  if (
    hasMeaningfulCode(input, "R7_RECOMMENDATION_CHANGED")
    || hasMeaningfulCode(input, "R7_READINESS_CHANGED")
  ) {
    add("RECOMMENDATION_CHANGE_REVIEW", "R9_RECOMMENDATION_CHANGE")
  }

  const fitState = input.r8.portfolioFit.state
  if (fitState === "CONCENTRATION_REVIEW") {
    add("CONCENTRATION_REVIEW", "R8_CONCENTRATION_REVIEW")
  } else if (fitState === "ROLE_COMPATIBILITY_REVIEW") {
    add("ROLE_REVIEW", "R8_ROLE_COMPATIBILITY_REVIEW")
  } else if (fitState === "FIT_TENSION") {
    add("PORTFOLIO_FIT_REVIEW", "R8_PORTFOLIO_FIT_TENSION")
  }

  const coreState = input.r8.coreHealth.state
  if (coreState === "CORE_AT_RISK" || coreState === "CORE_DEMOTION_REVIEW") {
    add("THESIS_WEAKENING", `R8_${coreState}`)
  } else if (coreState === "CORE_WATCH") {
    add("MONITOR", "R8_CORE_WATCH")
  }

  if (input.r8.exitIntelligence.state === "EXIT_MONITOR") {
    add("MONITOR", "R8_EXIT_MONITOR")
  }
  if (input.r8.portfolioRisk.state === "RISK_MONITOR") {
    add("MONITOR", "R8_RISK_MONITOR")
  }

  if (hasMeaningfulCode(input, "CORE_HEALTH_CHANGED")) {
    const current = currentMeaningfulValue(input, "CORE_HEALTH_CHANGED")
    if (current === "CORE_HEALTHY") {
      add("THESIS_STRENGTHENING", "R9_CORE_HEALTH_STRENGTHENED")
    } else if (
      ["CORE_WATCH", "CORE_AT_RISK", "CORE_DEMOTION_REVIEW"].includes(current ?? "")
    ) {
      add("THESIS_WEAKENING", "R9_CORE_HEALTH_WEAKENED")
    }
  }

  const thresholds = ownerThresholdSignals(input)
  if (thresholds.stopReached) {
    add("REVIEW_REQUIRED", "OWNER_STOP_LOSS_THRESHOLD_REACHED")
  }
  if (thresholds.targetReached) {
    add("REVIEW_REQUIRED", "OWNER_TARGET_PRICE_THRESHOLD_REACHED")
  }

  if (input.r9.transitionState === "FIRST_OBSERVATION") {
    add("MONITOR", "R9_BASELINE_ESTABLISHED_FIRST_OBSERVATION")
  } else if (input.r9.transitionState === "RAW_IMMATERIAL_CHANGE") {
    add("MONITOR", "R9_RAW_IMMATERIAL_CHANGE")
  }

  for (const conflict of conflicts) {
    counterSignals.push(conflict.counterState)
    supportingStates.push(conflict.supportingState)
  }

  if (!states.length) {
    add("NO_ACTION_REQUIRED", "NO_CANONICAL_REVIEW_TRIGGER")
  }

  return {
    states: unique(states),
    reasons: unique(reasons),
    supportingStates: unique(supportingStates),
    counterSignals: unique(counterSignals),
  }
}

export function evaluateProgramCR10Attention(
  input: ProgramCR10Input,
): ProgramCR10IntegratedAttention {
  if (input.r8.securityId !== input.securityId || input.r8.portfolioId !== input.portfolioId) {
    throw new Error("Program C R10 requires exact R8 security/portfolio identity.")
  }
  if (input.r9.securityId !== input.securityId || input.r9.portfolioId !== input.portfolioId) {
    throw new Error("Program C R10 requires exact R9 security/portfolio identity.")
  }

  const conflicts = conflictRows(input)
  const signals = deriveSignals(input, conflicts)
  const selected = selectProgramCR10State(signals.states)

  const integratedAttentionId = programCR10IntegratedAttentionId({
    securityId: input.securityId,
    portfolioId: input.portfolioId,
    r8DecisionRunId: input.r8.decisionRunId,
    r9CurrentObservedStateId: input.r9.currentObservedStateId,
    r9ChangeEventId: input.r9.event?.eventId ?? null,
    ownerContextVersion: input.ownerContext.ownerContextVersion,
  })

  return {
    version: PROGRAM_C_R10_CONTRACT_VERSION,
    integratedAttentionId,
    securityId: input.securityId,
    portfolioId: input.portfolioId,
    symbol: input.symbol,
    company: input.company,
    state: selected.state,
    severity: selected.severity,
    reasons: signals.reasons,
    conflicts,
    supportingStates: signals.supportingStates,
    counterSignals: signals.counterSignals,
    upstreamLineage: {
      classificationVersion: input.r8.upstreamLineage.classificationVersion ?? null,
      researchProfileCode: input.r8.upstreamLineage.researchProfileCode,
      methodologyId: input.r8.upstreamLineage.methodologyId,
      methodologyVersion: input.r8.upstreamLineage.methodologyVersion,
      methodologyRole: input.r8.upstreamLineage.methodologyRole,
      assignmentId: input.r8.upstreamLineage.assignmentId,
      assignmentVersion: input.r8.upstreamLineage.assignmentVersion,
      evidenceSnapshotId: input.r8.upstreamLineage.evidenceSnapshotId,
      scoreRunId: input.r8.upstreamLineage.scoreRunId,
      recommendationRunId: input.r8.upstreamLineage.recommendationRunId,
      portfolioContextSnapshotId: input.r8.portfolioContextSnapshotId,
      r8DecisionRunId: input.r8.decisionRunId,
      r9PreviousObservedStateId: input.r9.previousObservedStateId,
      r9CurrentObservedStateId: input.r9.currentObservedStateId,
      r9ChangeEventId: input.r9.event?.eventId ?? null,
      r9RuleVersion: input.r9.event?.ruleVersion ?? null,
    },
    ownerContext: input.ownerContext,
    asOf: input.asOf,
  }
}
