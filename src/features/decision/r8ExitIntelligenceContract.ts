export const PROGRAM_C_R8_EXIT_INTELLIGENCE_CONTRACT_VERSION =
  "PROGRAM_C_R8_EXIT_INTELLIGENCE_V1" as const

export const PROGRAM_C_R8_EXIT_INTELLIGENCE_STATES = [
  "NO_EXIT_SIGNAL",
  "EXIT_MONITOR",
  "EXIT_REVIEW_REQUIRED",
  "EXIT_RISK_ELEVATED",
  "HARD_EXIT_REVIEW",
  "INSUFFICIENT_EVIDENCE",
  "REVIEW_REQUIRED",
  "BLOCKED_PREREQUISITE",
  "NOT_APPLICABLE",
] as const

export type ProgramCR8ExitIntelligenceState =
  typeof PROGRAM_C_R8_EXIT_INTELLIGENCE_STATES[number]

export interface ProgramCR8ExitIntelligenceResult {
  readonly version: typeof PROGRAM_C_R8_EXIT_INTELLIGENCE_CONTRACT_VERSION
  readonly state: ProgramCR8ExitIntelligenceState
  readonly applicable: boolean
  readonly sourceScoreRunId: string | null
  readonly sourceRecommendationRunId: string | null
  readonly thesisEvidenceIds: readonly string[]
  readonly blockers: readonly string[]
  readonly reasonCodes: readonly string[]
}

export const PROGRAM_C_R8_EXIT_INTELLIGENCE_STATE_SEMANTICS = {
  NO_EXIT_SIGNAL: {
    positiveState: true,
    thesisPermanentLossEvidenceSufficient: true,
  },
  EXIT_MONITOR: {
    positiveState: false,
    thesisPermanentLossEvidenceSufficient: true,
  },
  EXIT_REVIEW_REQUIRED: {
    positiveState: false,
    thesisPermanentLossEvidenceSufficient: true,
  },
  EXIT_RISK_ELEVATED: {
    positiveState: false,
    thesisPermanentLossEvidenceSufficient: true,
  },
  HARD_EXIT_REVIEW: {
    positiveState: false,
    advisoryOnly: true,
    tradeInstruction: false,
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
} as const satisfies Record<ProgramCR8ExitIntelligenceState, Readonly<Record<string, unknown>>>

export const PROGRAM_C_R8_EXIT_INTELLIGENCE_BOUNDARY = {
  hardExitReviewIsAdvisoryOnly: true,
  priceWeaknessAloneCanTriggerExit: false,
  valuationAloneCanTriggerExit: false,
  overweightAloneCanTriggerExit: false,
  ownerStopLossIsContextNotAutomaticTradeAuthority: true,
  tradeInstructionAllowed: false,
  r6RecomputationAllowed: false,
  r7RecomputationAllowed: false,
} as const
