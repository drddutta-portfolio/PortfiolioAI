import { evaluateProgramCR8CoreHealth, type ProgramCR8CoreHealthSignal } from "./r8CoreHealth"
import { evaluateProgramCR8ExitIntelligence, type ProgramCR8ExitSignal } from "./r8ExitIntelligence"
import { evaluateProgramCR8PortfolioFit } from "./r8PortfolioFit"
import { evaluateProgramCR8PortfolioRisk, type ProgramCR8RiskSignal } from "./r8PortfolioRisk"
import {
  PROGRAM_C_R8_DECISION_CONTRACT_VERSION,
  programCR8DecisionRunIdentity,
  type ProgramCR8Blocker,
  type ProgramCR8OverallDisposition,
  type ProgramCR8PortfolioDecisionAssessment,
  type ProgramCR8PortfolioDecisionInput,
  type ProgramCR8ReasonCode,
} from "./r8PortfolioDecisionContract"

export const PROGRAM_C_R8_EXECUTION_VERSION =
  "PROGRAM_C_R8_EXECUTION_V1" as const

export interface ProgramCR8EvaluationSignals {
  readonly coreHealth: ProgramCR8CoreHealthSignal
  readonly portfolioRisk: ProgramCR8RiskSignal
  readonly exitIntelligence: ProgramCR8ExitSignal
  readonly riskEvidenceIds: readonly string[]
  readonly thesisEvidenceIds: readonly string[]
  readonly priceWeaknessObserved?: boolean
  readonly valuationConcernObserved?: boolean
}

function isSubstantive(state: string) {
  return ![
    "INSUFFICIENT_EVIDENCE",
    "REVIEW_REQUIRED",
    "BLOCKED_PREREQUISITE",
    "NOT_APPLICABLE",
  ].includes(state)
}

function deriveOverallDisposition(
  states: readonly string[],
  lineageConflict: boolean,
): ProgramCR8OverallDisposition {
  if (lineageConflict || states.includes("REVIEW_REQUIRED")) return "REVIEW_REQUIRED"
  if (states.every((state) => state === "NOT_APPLICABLE")) return "NOT_APPLICABLE"

  const substantiveCount = states.filter(isSubstantive).length
  const hasBlocked = states.includes("BLOCKED_PREREQUISITE")
  const hasInsufficient = states.includes("INSUFFICIENT_EVIDENCE")

  if (substantiveCount > 0 && (hasBlocked || hasInsufficient)) {
    return "ASSESSMENT_PARTIAL"
  }
  if (substantiveCount > 0) return "ASSESSMENT_COMPLETE"
  if (hasBlocked) return "BLOCKED_PREREQUISITE"
  if (hasInsufficient) return "INSUFFICIENT_EVIDENCE"
  return "ASSESSMENT_PARTIAL"
}

function blockerForState(
  domain: ProgramCR8Blocker["domain"],
  state: string,
  sourceIdentity: string | null,
): ProgramCR8Blocker | null {
  if (state === "BLOCKED_PREREQUISITE") {
    const reasonCode: ProgramCR8ReasonCode =
      domain === "CORE_HEALTH"
        ? "UPSTREAM_R6_LINEAGE_MISSING"
        : domain === "EXIT_INTELLIGENCE"
          ? "THESIS_EVIDENCE_INSUFFICIENT"
          : "PORTFOLIO_CONTEXT_MISSING"
    return {
      domain,
      requiredState: "READY_PREREQUISITES",
      observedState: state,
      reasonCode,
      sourceIdentity,
    }
  }
  if (state === "INSUFFICIENT_EVIDENCE") {
    const reasonCode: ProgramCR8ReasonCode =
      domain === "PORTFOLIO_RISK"
        ? "RISK_EVIDENCE_INSUFFICIENT"
        : domain === "EXIT_INTELLIGENCE"
          ? "THESIS_EVIDENCE_INSUFFICIENT"
          : "MANDATORY_EVIDENCE_MISSING"
    return {
      domain,
      requiredState: "SUFFICIENT_CANONICAL_EVIDENCE",
      observedState: state,
      reasonCode,
      sourceIdentity,
    }
  }
  if (state === "REVIEW_REQUIRED") {
    return {
      domain,
      requiredState: "CONSISTENT_CANONICAL_INPUTS",
      observedState: state,
      reasonCode: "MANDATORY_EVIDENCE_CONFLICTING",
      sourceIdentity,
    }
  }
  return null
}

function assessmentReasonCodes(
  disposition: ProgramCR8OverallDisposition,
  results: readonly { readonly reasonCodes: readonly string[] }[],
  lineageConflict: boolean,
): readonly ProgramCR8ReasonCode[] {
  const reasonCodes = new Set<ProgramCR8ReasonCode>()
  if (disposition === "ASSESSMENT_COMPLETE") reasonCodes.add("R8_ASSESSMENT_COMPLETE")
  if (disposition === "ASSESSMENT_PARTIAL") reasonCodes.add("R8_ASSESSMENT_PARTIAL")
  if (disposition === "NOT_APPLICABLE") reasonCodes.add("ASSET_NOT_APPLICABLE")
  if (disposition === "BLOCKED_PREREQUISITE") reasonCodes.add("PORTFOLIO_CONTEXT_MISSING")
  if (disposition === "INSUFFICIENT_EVIDENCE") reasonCodes.add("MANDATORY_EVIDENCE_MISSING")
  if (disposition === "REVIEW_REQUIRED") reasonCodes.add("MANDATORY_EVIDENCE_CONFLICTING")
  if (lineageConflict) reasonCodes.add("UPSTREAM_R7_LINEAGE_MISMATCH")

  if (results.some((result) => result.reasonCodes.includes("RECOMMENDATION_OWNER_ROLE_TENSION"))) {
    reasonCodes.add("RECOMMENDATION_OWNER_ROLE_TENSION")
  }
  if (results.some((result) => result.reasonCodes.includes("OWNER_LIMIT_NOT_CONFIGURED_RULE_DISABLED"))) {
    reasonCodes.add("OWNER_LIMIT_NOT_CONFIGURED_RULE_DISABLED")
  }

  return [...reasonCodes]
}

export function evaluateProgramCR8PortfolioDecision(
  input: ProgramCR8PortfolioDecisionInput,
  signals: ProgramCR8EvaluationSignals,
): ProgramCR8PortfolioDecisionAssessment {
  const holding = input.portfolioContext.holdings.find(
    (candidate) => candidate.securityId === input.securityId,
  )
  const ownerRole = input.ownerContext.portfolioRole?.trim() || null
  const currentWeight = holding?.currentWeight ?? null

  const r7LineageConflict = Boolean(
    input.r7?.sourceScoreRunId
    && input.r6.scoreRunId
    && input.r7.sourceScoreRunId !== input.r6.scoreRunId,
  )
  const safeR7 = r7LineageConflict ? null : input.r7

  const coreHealth = evaluateProgramCR8CoreHealth({
    ownerRole,
    r6: input.r6,
    r7: safeR7,
    healthSignal: signals.coreHealth,
  })

  const portfolioFit = evaluateProgramCR8PortfolioFit({
    assetClass: input.assetClass,
    portfolioContextSnapshotId: holding ? input.portfolioContext.snapshotId : null,
    ownerRole,
    currentWeight,
    minimumAllocation: input.ownerContext.minimumAllocation,
    maximumAllocation: input.ownerContext.maximumAllocation,
    r7: safeR7,
  })

  const concentrationReasonCodes = [
    ...portfolioFit.reasonCodes.filter((code) => (
      code === "CURRENT_WEIGHT_ABOVE_OWNER_MAXIMUM"
      || code === "CURRENT_WEIGHT_BELOW_OWNER_MINIMUM"
    )),
  ]

  const portfolioRisk = evaluateProgramCR8PortfolioRisk({
    assetClass: input.assetClass,
    portfolioContextSnapshotId: holding ? input.portfolioContext.snapshotId : null,
    sourceScoreRunId: input.r6.scoreRunId,
    riskSignal: signals.portfolioRisk,
    evidenceIds: signals.riskEvidenceIds,
    concentrationReasonCodes,
  })

  const exitIntelligence = evaluateProgramCR8ExitIntelligence({
    assetClass: input.assetClass,
    sourceScoreRunId: input.r6.scoreRunId,
    sourceRecommendationRunId: safeR7?.recommendationRunId ?? null,
    exitSignal: signals.exitIntelligence,
    thesisEvidenceIds: signals.thesisEvidenceIds,
    priceWeaknessObserved: signals.priceWeaknessObserved,
    valuationConcernObserved: signals.valuationConcernObserved,
    overweightObserved: portfolioFit.state === "CONCENTRATION_REVIEW",
  })

  const states = [
    coreHealth.state,
    portfolioFit.state,
    portfolioRisk.state,
    exitIntelligence.state,
  ]
  const overallDisposition = deriveOverallDisposition(states, r7LineageConflict)

  const blockers = [
    blockerForState("CORE_HEALTH", coreHealth.state, input.r6.scoreRunId),
    blockerForState("PORTFOLIO_FIT", portfolioFit.state, input.portfolioContext.snapshotId),
    blockerForState("PORTFOLIO_RISK", portfolioRisk.state, input.portfolioContext.snapshotId),
    blockerForState(
      "EXIT_INTELLIGENCE",
      exitIntelligence.state,
      safeR7?.recommendationRunId ?? input.r6.scoreRunId,
    ),
  ].filter((blocker): blocker is ProgramCR8Blocker => blocker !== null)

  if (r7LineageConflict) {
    blockers.unshift({
      domain: "UPSTREAM_LINEAGE",
      requiredState: "R7_SOURCE_SCORE_RUN_MATCHES_R6_SCORE_RUN",
      observedState: "MISMATCH",
      reasonCode: "UPSTREAM_R7_LINEAGE_MISMATCH",
      sourceIdentity: input.r7?.recommendationRunId ?? null,
    })
  }

  const decisionRunId = programCR8DecisionRunIdentity({
    securityId: input.securityId,
    portfolioId: input.portfolioContext.portfolioId,
    portfolioContextSnapshotId: input.portfolioContext.snapshotId,
    scoreRunId: input.r6.scoreRunId,
    recommendationRunId: input.r7?.recommendationRunId ?? null,
    contractVersion: PROGRAM_C_R8_DECISION_CONTRACT_VERSION,
  })

  return {
    version: PROGRAM_C_R8_DECISION_CONTRACT_VERSION,
    decisionRunId,
    securityId: input.securityId,
    portfolioId: input.portfolioContext.portfolioId,
    asOfDate: input.asOfDate,
    upstreamLineage: {
      scoreRunId: input.r6.scoreRunId,
      recommendationRunId: input.r7?.recommendationRunId ?? null,
      researchProfileCode: input.r6.researchProfileCode,
      methodologyId: input.r6.methodologyId,
      methodologyVersion: input.r6.methodologyVersion,
      methodologyRole: input.r6.methodologyRole,
      assignmentId: input.r6.assignmentId,
      assignmentVersion: input.r6.assignmentVersion,
      evidenceSnapshotId: input.r6.evidenceSnapshotId,
    },
    portfolioContextSnapshotId: input.portfolioContext.snapshotId,
    coreHealth,
    portfolioFit,
    portfolioRisk,
    exitIntelligence,
    overallDisposition,
    blockers,
    reasonCodes: assessmentReasonCodes(
      overallDisposition,
      [coreHealth, portfolioFit, portfolioRisk, exitIntelligence],
      r7LineageConflict,
    ),
  }
}

export const PROGRAM_C_R8_C2_SAFETY_BOUNDARY = {
  readOnlyExecution: true,
  providerCalls: 0,
  angelOneCalls: 0,
  trendlyneCalls: 0,
  openAiDecisionCalls: 0,
  scoreRecomputation: false,
  recommendationRecomputation: false,
  numericSizingAuthority: false,
  ownerSettingsMutation: false,
  persistence: false,
  schemaMigration: false,
  productionMutation: false,
  deployment: false,
  merge: false,
  schedulerMutation: false,
  trading: false,
} as const
