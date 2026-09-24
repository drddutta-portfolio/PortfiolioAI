import type { ProgramCR8OwnerContext } from "./r8PortfolioContext"
import type { ProgramCR8PortfolioDecisionAssessment } from "./r8PortfolioDecisionContract"
import type { ProgramCR9ComparisonResult } from "./r9MeaningfulChangeContract"

export const PROGRAM_C_R10_CONTRACT_VERSION =
  "PROGRAM_C_R10_ACTION_CENTER_V1" as const

export const PROGRAM_C_R10_PRECEDENCE_VERSION =
  "PROGRAM_C_R10_PRECEDENCE_V1" as const

export const PROGRAM_C_R10_STATES = [
  "EXIT_REVIEW",
  "REVIEW_REQUIRED",
  "BLOCKED_PREREQUISITE",
  "EVIDENCE_REVIEW",
  "INSUFFICIENT_EVIDENCE",
  "RISK_REVIEW",
  "RECOMMENDATION_CHANGE_REVIEW",
  "CONCENTRATION_REVIEW",
  "ROLE_REVIEW",
  "PORTFOLIO_FIT_REVIEW",
  "THESIS_WEAKENING",
  "MONITOR",
  "THESIS_STRENGTHENING",
  "NO_ACTION_REQUIRED",
  "NOT_APPLICABLE",
] as const

export type ProgramCR10AttentionState =
  typeof PROGRAM_C_R10_STATES[number]

export type ProgramCR10Severity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INFO"
  | "NONE"

export interface ProgramCR10Conflict {
  readonly code: string
  readonly summary: string
  readonly supportingState: string
  readonly counterState: string
}

export interface ProgramCR10OwnerThresholdContext {
  readonly currentPrice: string | null
  readonly targetPrice: string | null
  readonly stopLossPrice: string | null
  readonly targetPriceAlertEnabled: boolean
  readonly stopLossAlertEnabled: boolean
}

export interface ProgramCR10Input {
  readonly securityId: string
  readonly portfolioId: string
  readonly symbol: string
  readonly company: string
  readonly asOf: string
  readonly classificationVersion: string | null
  readonly r9CurrentR8DecisionRunId: string | null
  readonly r9OwnerContextVersion: string | null
  readonly r7RecommendationState: string | null
  readonly r8: ProgramCR8PortfolioDecisionAssessment
  readonly r9: ProgramCR9ComparisonResult
  readonly ownerContext: ProgramCR8OwnerContext
  readonly ownerThresholds: ProgramCR10OwnerThresholdContext
}

export interface ProgramCR10IntegratedAttention {
  readonly version: typeof PROGRAM_C_R10_CONTRACT_VERSION
  readonly integratedAttentionId: string
  readonly securityId: string
  readonly portfolioId: string
  readonly symbol: string
  readonly company: string
  readonly state: ProgramCR10AttentionState
  readonly severity: ProgramCR10Severity
  readonly reasons: readonly string[]
  readonly conflicts: readonly ProgramCR10Conflict[]
  readonly supportingStates: readonly string[]
  readonly counterSignals: readonly string[]
  readonly upstreamLineage: {
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
    readonly r9PreviousObservedStateId: string | null
    readonly r9CurrentObservedStateId: string | null
    readonly r9ChangeEventId: string | null
    readonly r9RuleVersion: string | null
    readonly r9OwnerContextVersion: string | null
    readonly ownerThresholdContextId: string
  }
  readonly ownerContext: ProgramCR8OwnerContext
  readonly asOf: string
}

export const PROGRAM_C_R10_DIRECTIONAL_CANDIDATES = {
  ADD_REVIEW: {
    canonical: false,
    reason: "NO_APPROVED_UPSTREAM_DIRECTIONAL_SIZING_AUTHORITY",
  },
  TRIM_REVIEW: {
    canonical: false,
    reason: "NO_APPROVED_UPSTREAM_DIRECTIONAL_SIZING_AUTHORITY",
  },
} as const

export const PROGRAM_C_R10_PROHIBITED_OUTPUTS = [
  "quantity",
  "orderQuantity",
  "orderInstruction",
  "exactAddPercentage",
  "exactTrimPercentage",
  "machineGeneratedTargetWeight",
  "machineGeneratedMinimumWeight",
  "machineGeneratedMaximumWeight",
  "opaqueMasterScore",
] as const

export const PROGRAM_C_R10_SAFETY_BOUNDARY = {
  reviewOrientedOnly: true,
  addReviewPromoted: false,
  trimReviewPromoted: false,
  numericSizingAuthority: false,
  tradeInstructionAllowed: false,
  ownerSettingsMutation: false,
  aiDecisionAuthority: false,
  providerCalls: 0,
  persistence: false,
  schemaMigration: false,
  productionMutation: false,
  deployment: false,
  merge: false,
  schedulerMutation: false,
  trading: false,
} as const
