export const PROGRAM_C_R9_CONTRACT_VERSION =
  "PROGRAM_C_R9_MEANINGFUL_CHANGE_V1" as const

export const PROGRAM_C_R9_RULE_REGISTRY_VERSION =
  "PROGRAM_C_R9_MEANINGFUL_CHANGE_RULES_V1" as const

export type ProgramCR9BaselineState =
  | "BASELINE_ESTABLISHED"
  | "COMPARABLE_BASELINE"
  | "NO_COMPARABLE_BASELINE"

export type ProgramCR9TransitionState =
  | "FIRST_OBSERVATION"
  | "NO_CHANGE"
  | "RAW_IMMATERIAL_CHANGE"
  | "MEANINGFUL_CHANGE"
  | "INCOMPARABLE"
  | "OUT_OF_ORDER"
  | "NOT_APPLICABLE"

export type ProgramCR9ChangeDomain =
  | "R6"
  | "R7"
  | "METHODOLOGY"
  | "ASSIGNMENT"
  | "CLASSIFICATION"
  | "EVIDENCE"
  | "VALUATION"
  | "MOMENTUM"
  | "R8"
  | "CORE_HEALTH"
  | "PORTFOLIO_FIT"
  | "PORTFOLIO_RISK"
  | "EXIT_INTELLIGENCE"
  | "BLOCKERS"
  | "OWNER_CONTEXT"
  | "PORTFOLIO_CONTEXT"
  | "OBSERVATION"

export type ProgramCR9MaterialityClass =
  | "MEANINGFUL"
  | "RAW_IMMATERIAL"

export interface ProgramCR9ChangeFact {
  readonly code: string
  readonly domain: ProgramCR9ChangeDomain
  readonly materiality: ProgramCR9MaterialityClass
  readonly previousValue: string | null
  readonly currentValue: string | null
  readonly ruleVersion: typeof PROGRAM_C_R9_RULE_REGISTRY_VERSION
  readonly reasonCode: string
}

export interface ProgramCR9MeaningfulChangeEvent {
  readonly version: typeof PROGRAM_C_R9_CONTRACT_VERSION
  readonly eventId: string
  readonly securityId: string
  readonly portfolioId: string
  readonly previousObservedStateId: string
  readonly currentObservedStateId: string
  readonly ruleVersion: typeof PROGRAM_C_R9_RULE_REGISTRY_VERSION
  readonly meaningfulChanges: readonly ProgramCR9ChangeFact[]
  readonly rawChanges: readonly ProgramCR9ChangeFact[]
  readonly reasonCodes: readonly string[]
}

export interface ProgramCR9ComparisonResult {
  readonly version: typeof PROGRAM_C_R9_CONTRACT_VERSION
  readonly securityId: string
  readonly portfolioId: string
  readonly baselineState: ProgramCR9BaselineState
  readonly transitionState: ProgramCR9TransitionState
  readonly previousObservedStateId: string | null
  readonly currentObservedStateId: string | null
  readonly rawChanges: readonly ProgramCR9ChangeFact[]
  readonly meaningfulChanges: readonly ProgramCR9ChangeFact[]
  readonly event: ProgramCR9MeaningfulChangeEvent | null
  readonly reasonCodes: readonly string[]
}

export const PROGRAM_C_R9_PROHIBITED_CAPABILITIES = {
  aiMateriality: false,
  inventedNumericThresholds: false,
  numericSizingAuthority: false,
  ownerMutation: false,
  providerCalls: 0,
  persistence: false,
  durableAcknowledgement: false,
  durableSnooze: false,
  persistentNotificationDeduplication: false,
  crossSessionSeenUnseenState: false,
  schedulerMutation: false,
  trading: false,
} as const

export const PROGRAM_C_R9_IDEMPOTENCY_BOUNDARY = {
  deterministicEventIdentity: true,
  semanticIdempotency: true,
  sameInputReplayStability: true,
  inMemoryDuplicateSuppression: true,
  durableAcknowledgement: false,
  durableSnooze: false,
  persistentNotificationDeduplication: false,
  crossSessionSeenUnseenState: false,
} as const
