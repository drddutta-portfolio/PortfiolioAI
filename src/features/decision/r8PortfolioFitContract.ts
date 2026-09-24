export const PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION =
  "PROGRAM_C_R8_PORTFOLIO_FIT_V1" as const

export const PROGRAM_C_R8_PORTFOLIO_FIT_STATES = [
  "FIT_SUPPORTED",
  "FIT_NEUTRAL",
  "FIT_TENSION",
  "CONCENTRATION_REVIEW",
  "ROLE_COMPATIBILITY_REVIEW",
  "INSUFFICIENT_EVIDENCE",
  "REVIEW_REQUIRED",
  "BLOCKED_PREREQUISITE",
  "NOT_APPLICABLE",
] as const

export type ProgramCR8PortfolioFitState =
  typeof PROGRAM_C_R8_PORTFOLIO_FIT_STATES[number]

export interface ProgramCR8PortfolioFitResult {
  readonly version: typeof PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION
  readonly state: ProgramCR8PortfolioFitState
  readonly applicable: boolean
  readonly sourcePortfolioContextSnapshotId: string | null
  readonly ownerRole: string | null
  readonly currentWeight: string | null
  readonly blockers: readonly string[]
  readonly reasonCodes: readonly string[]
}

export const PROGRAM_C_R8_PORTFOLIO_FIT_STATE_SEMANTICS = {
  FIT_SUPPORTED: {
    positiveState: true,
    requiresCompleteCorePortfolioContext: true,
  },
  FIT_NEUTRAL: {
    positiveState: true,
    requiresCompleteCorePortfolioContext: true,
  },
  FIT_TENSION: {
    positiveState: false,
    requiresCompleteCorePortfolioContext: true,
  },
  CONCENTRATION_REVIEW: {
    positiveState: false,
    requiresOwnerOrApprovedConcentrationAuthority: true,
  },
  ROLE_COMPATIBILITY_REVIEW: {
    positiveState: false,
    requiresOwnerRoleContext: true,
  },
  INSUFFICIENT_EVIDENCE: {
    positiveState: false,
  },
  REVIEW_REQUIRED: {
    positiveState: false,
  },
  BLOCKED_PREREQUISITE: {
    positiveState: false,
  },
  NOT_APPLICABLE: {
    positiveState: false,
  },
} as const satisfies Record<ProgramCR8PortfolioFitState, Readonly<Record<string, unknown>>>

export const PROGRAM_C_R8_PORTFOLIO_FIT_BOUNDARY = {
  currentWeightObservationAllowed: true,
  ownerConfiguredLimitComparisonAllowed: true,
  inventedTargetWeightAllowed: false,
  inventedMinMaxAllocationAllowed: false,
  inventedCorrelationAllowed: false,
  inventedDiversificationThresholdAllowed: false,
  universalSectorSizingRuleAllowed: false,
  nearestProfileSizingFallbackAllowed: false,
  ownerRoleMutationAllowed: false,
} as const
