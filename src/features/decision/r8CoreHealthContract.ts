export const PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION =
  "PROGRAM_C_R8_CORE_HEALTH_V1" as const

export const PROGRAM_C_R8_CORE_HEALTH_STATES = [
  "CORE_HEALTHY",
  "CORE_WATCH",
  "CORE_AT_RISK",
  "CORE_DEMOTION_REVIEW",
  "INSUFFICIENT_EVIDENCE",
  "REVIEW_REQUIRED",
  "BLOCKED_PREREQUISITE",
  "NOT_APPLICABLE",
] as const

export type ProgramCR8CoreHealthState =
  typeof PROGRAM_C_R8_CORE_HEALTH_STATES[number]

export interface ProgramCR8CoreHealthResult {
  readonly version: typeof PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION
  readonly state: ProgramCR8CoreHealthState
  readonly applicable: boolean
  readonly ownerRole: string | null
  readonly sourceScoreRunId: string | null
  readonly sourceRecommendationRunId: string | null
  readonly blockers: readonly string[]
  readonly reasonCodes: readonly string[]
}

export const PROGRAM_C_R8_CORE_HEALTH_STATE_SEMANTICS = {
  CORE_HEALTHY: {
    ownerRoleRequired: "CORE",
    mandatoryEvidenceComplete: true,
    positiveState: true,
  },
  CORE_WATCH: {
    ownerRoleRequired: "CORE",
    mandatoryEvidenceComplete: true,
    positiveState: false,
  },
  CORE_AT_RISK: {
    ownerRoleRequired: "CORE",
    mandatoryEvidenceComplete: true,
    positiveState: false,
  },
  CORE_DEMOTION_REVIEW: {
    ownerRoleRequired: "CORE",
    mandatoryEvidenceComplete: true,
    positiveState: false,
    ownerRoleMutationAllowed: false,
  },
  INSUFFICIENT_EVIDENCE: {
    ownerRoleRequired: "CORE",
    mandatoryEvidenceComplete: false,
    positiveState: false,
  },
  REVIEW_REQUIRED: {
    ownerRoleRequired: "CORE",
    positiveState: false,
  },
  BLOCKED_PREREQUISITE: {
    ownerRoleRequired: "CORE",
    positiveState: false,
  },
  NOT_APPLICABLE: {
    ownerRoleRequired: "NON_CORE_OR_UNSUPPORTED_ASSET",
    positiveState: false,
  },
} as const satisfies Record<ProgramCR8CoreHealthState, Readonly<Record<string, unknown>>>

export const PROGRAM_C_R8_CORE_HEALTH_BOUNDARY = {
  formalOwnerRole: "CORE",
  nonCoreState: "NOT_APPLICABLE",
  recommendationRoleDisagreementIsReviewContextOnly: true,
  ownerRoleMutationAllowed: false,
  r6RecomputationAllowed: false,
  r7RecomputationAllowed: false,
  inventedNumericThresholdsAllowed: false,
} as const
