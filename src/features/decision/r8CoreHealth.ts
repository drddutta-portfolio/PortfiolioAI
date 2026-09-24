import {
  PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION,
  type ProgramCR8CoreHealthResult,
} from "./r8CoreHealthContract"
import type {
  ProgramCR8R6Reference,
  ProgramCR8R7Reference,
} from "./r8PortfolioDecisionContract"

export type ProgramCR8CoreHealthSignal =
  | "HEALTHY"
  | "WATCH"
  | "AT_RISK"
  | "DEMOTION_REVIEW"
  | "MISSING"
  | "STALE"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export interface ProgramCR8CoreHealthEvaluationInput {
  readonly ownerRole: string | null
  readonly r6: ProgramCR8R6Reference
  readonly r7: ProgramCR8R7Reference | null
  readonly healthSignal: ProgramCR8CoreHealthSignal
}

function mapUpstreamFailure(input: ProgramCR8CoreHealthEvaluationInput): ProgramCR8CoreHealthResult | null {
  const state = input.r6.readinessState
  if (state === "READY") return null
  if (state === "NOT_APPLICABLE") {
    return {
      version: PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION,
      state: "NOT_APPLICABLE",
      applicable: false,
      ownerRole: input.ownerRole,
      sourceScoreRunId: input.r6.scoreRunId,
      sourceRecommendationRunId: input.r7?.recommendationRunId ?? null,
      blockers: [],
      reasonCodes: ["SOURCE_R6_NOT_APPLICABLE"],
    }
  }
  if (state === "CONFLICTING_EVIDENCE" || state === "REVIEW_REQUIRED") {
    return {
      version: PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION,
      state: "REVIEW_REQUIRED",
      applicable: true,
      ownerRole: input.ownerRole,
      sourceScoreRunId: input.r6.scoreRunId,
      sourceRecommendationRunId: input.r7?.recommendationRunId ?? null,
      blockers: ["SOURCE_R6_REQUIRES_REVIEW"],
      reasonCodes: [`SOURCE_R6_${state}`],
    }
  }
  if (state === "INSUFFICIENT_EVIDENCE" || state === "STALE_REQUIRED_EVIDENCE") {
    return {
      version: PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION,
      state: "INSUFFICIENT_EVIDENCE",
      applicable: true,
      ownerRole: input.ownerRole,
      sourceScoreRunId: input.r6.scoreRunId,
      sourceRecommendationRunId: input.r7?.recommendationRunId ?? null,
      blockers: ["SOURCE_R6_EVIDENCE_INSUFFICIENT"],
      reasonCodes: [`SOURCE_R6_${state}`],
    }
  }
  return {
    version: PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION,
    state: "BLOCKED_PREREQUISITE",
    applicable: true,
    ownerRole: input.ownerRole,
    sourceScoreRunId: input.r6.scoreRunId,
    sourceRecommendationRunId: input.r7?.recommendationRunId ?? null,
    blockers: ["SOURCE_R6_PREREQUISITE_BLOCKED"],
    reasonCodes: [`SOURCE_R6_${state}`],
  }
}

function recommendationRole(input: ProgramCR8R7Reference | null) {
  if (!input?.suggestedRole) return null
  if (input.suggestedRole === "CORE_CANDIDATE") return "CORE"
  if (input.suggestedRole === "SATELLITE_CANDIDATE") return "SATELLITE"
  return null
}

export function evaluateProgramCR8CoreHealth(
  input: ProgramCR8CoreHealthEvaluationInput,
): ProgramCR8CoreHealthResult {
  const ownerRole = input.ownerRole?.trim() || null
  if (!ownerRole) {
    return {
      version: PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION,
      state: "BLOCKED_PREREQUISITE",
      applicable: true,
      ownerRole: null,
      sourceScoreRunId: input.r6.scoreRunId,
      sourceRecommendationRunId: input.r7?.recommendationRunId ?? null,
      blockers: ["OWNER_ROLE_CONTEXT_MISSING"],
      reasonCodes: ["OWNER_ROLE_CONTEXT_MISSING"],
    }
  }
  if (ownerRole !== "CORE") {
    return {
      version: PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION,
      state: "NOT_APPLICABLE",
      applicable: false,
      ownerRole,
      sourceScoreRunId: input.r6.scoreRunId,
      sourceRecommendationRunId: input.r7?.recommendationRunId ?? null,
      blockers: [],
      reasonCodes: ["OWNER_ROLE_NOT_CORE"],
    }
  }

  const upstreamFailure = mapUpstreamFailure({ ...input, ownerRole })
  if (upstreamFailure) return upstreamFailure

  if (!input.r6.scoreRunId?.trim()) {
    return {
      version: PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION,
      state: "BLOCKED_PREREQUISITE",
      applicable: true,
      ownerRole,
      sourceScoreRunId: null,
      sourceRecommendationRunId: input.r7?.recommendationRunId ?? null,
      blockers: ["SOURCE_R6_SCORE_RUN_ID_MISSING"],
      reasonCodes: ["SOURCE_R6_SCORE_RUN_ID_MISSING"],
    }
  }

  const tension = recommendationRole(input.r7)
  const reasonCodes = tension && tension !== ownerRole
    ? ["RECOMMENDATION_OWNER_ROLE_TENSION"]
    : []

  if (input.healthSignal === "MISSING" || input.healthSignal === "STALE") {
    return {
      version: PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION,
      state: "INSUFFICIENT_EVIDENCE",
      applicable: true,
      ownerRole,
      sourceScoreRunId: input.r6.scoreRunId,
      sourceRecommendationRunId: input.r7?.recommendationRunId ?? null,
      blockers: ["CORE_HEALTH_SIGNAL_INSUFFICIENT"],
      reasonCodes: [...reasonCodes, `CORE_HEALTH_SIGNAL_${input.healthSignal}`],
    }
  }
  if (input.healthSignal === "CONFLICTING" || input.healthSignal === "REVIEW_REQUIRED") {
    return {
      version: PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION,
      state: "REVIEW_REQUIRED",
      applicable: true,
      ownerRole,
      sourceScoreRunId: input.r6.scoreRunId,
      sourceRecommendationRunId: input.r7?.recommendationRunId ?? null,
      blockers: ["CORE_HEALTH_SIGNAL_REQUIRES_REVIEW"],
      reasonCodes: [...reasonCodes, `CORE_HEALTH_SIGNAL_${input.healthSignal}`],
    }
  }

  const state = input.healthSignal === "HEALTHY"
    ? "CORE_HEALTHY"
    : input.healthSignal === "WATCH"
      ? "CORE_WATCH"
      : input.healthSignal === "AT_RISK"
        ? "CORE_AT_RISK"
        : "CORE_DEMOTION_REVIEW"

  return {
    version: PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION,
    state,
    applicable: true,
    ownerRole,
    sourceScoreRunId: input.r6.scoreRunId,
    sourceRecommendationRunId: input.r7?.recommendationRunId ?? null,
    blockers: [],
    reasonCodes: [...reasonCodes, `CORE_HEALTH_SIGNAL_${input.healthSignal}`],
  }
}
