export const PROGRAM_C_R8_PORTFOLIO_RISK_CONTRACT_VERSION =
  "PROGRAM_C_R8_PORTFOLIO_RISK_V1" as const

export const PROGRAM_C_R8_PORTFOLIO_RISK_STATES = [
  "RISK_ACCEPTABLE",
  "RISK_MONITOR",
  "RISK_ELEVATED",
  "RISK_CRITICAL_REVIEW",
  "INSUFFICIENT_EVIDENCE",
  "REVIEW_REQUIRED",
  "BLOCKED_PREREQUISITE",
  "NOT_APPLICABLE",
] as const

export type ProgramCR8PortfolioRiskState =
  typeof PROGRAM_C_R8_PORTFOLIO_RISK_STATES[number]

export interface ProgramCR8PortfolioRiskResult {
  readonly version: typeof PROGRAM_C_R8_PORTFOLIO_RISK_CONTRACT_VERSION
  readonly state: ProgramCR8PortfolioRiskState
  readonly applicable: boolean
  readonly sourcePortfolioContextSnapshotId: string | null
  readonly sourceScoreRunId: string | null
  readonly evidenceIds: readonly string[]
  readonly blockers: readonly string[]
  readonly reasonCodes: readonly string[]
}

export const PROGRAM_C_R8_PORTFOLIO_RISK_STATE_SEMANTICS = {
  RISK_ACCEPTABLE: {
    positiveState: true,
    canonicalRiskEvidenceRequired: true,
  },
  RISK_MONITOR: {
    positiveState: false,
    canonicalRiskEvidenceRequired: true,
  },
  RISK_ELEVATED: {
    positiveState: false,
    canonicalRiskEvidenceRequired: true,
  },
  RISK_CRITICAL_REVIEW: {
    positiveState: false,
    canonicalRiskEvidenceRequired: true,
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
} as const satisfies Record<ProgramCR8PortfolioRiskState, Readonly<Record<string, unknown>>>

export const PROGRAM_C_R8_PORTFOLIO_RISK_BOUNDARY = {
  absenceOfRiskEvidenceCanBeAcceptable: false,
  canonicalStoredVolatilityMayBeUsed: true,
  canonicalStoredDrawdownMayBeUsed: true,
  canonicalLiquidityEvidenceMayBeUsed: true,
  concentrationMayBeUsed: true,
  sectorThemeExposureMayBeUsed: true,
  inventedRiskThresholdsAllowed: false,
  missingEvidenceRenormalizationAllowed: false,
} as const
