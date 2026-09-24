export const PROGRAM_C_R8_PORTFOLIO_CONTEXT_CONTRACT_VERSION =
  "PROGRAM_C_R8_PORTFOLIO_CONTEXT_V1" as const

export const PROGRAM_C_VALIDATION_UNIVERSE_VERSION =
  "PROGRAM_C_VALIDATION_UNIVERSE_V1" as const

export type ProgramCR8ExactDecimal = string

export interface ProgramCR8OwnerContext {
  readonly portfolioRole: string | null
  readonly targetPrice: ProgramCR8ExactDecimal | null
  readonly stopLossPrice: ProgramCR8ExactDecimal | null
  readonly targetWeight: ProgramCR8ExactDecimal | null
  readonly minimumAllocation: ProgramCR8ExactDecimal | null
  readonly maximumAllocation: ProgramCR8ExactDecimal | null
  readonly investmentHorizon: string | null
  readonly freezeMonitoringPreference: string | null
  readonly ownerContextVersion: string | null
  readonly ownerContextAsOf: string | null
}

export interface ProgramCR8HoldingContext {
  readonly securityId: string
  readonly symbol: string
  readonly assetClass: string
  readonly quantity: ProgramCR8ExactDecimal
  readonly averageCost: ProgramCR8ExactDecimal | null
  readonly currentPrice: ProgramCR8ExactDecimal | null
  readonly currentValue: ProgramCR8ExactDecimal | null
  readonly currentWeight: ProgramCR8ExactDecimal | null
  readonly sector: string | null
  readonly industry: string | null
  readonly basicIndustry: string | null
  readonly classificationVersion: string
  readonly themes: readonly string[]
  readonly ownerContext: ProgramCR8OwnerContext
}

export interface ProgramCR8ExposureContext {
  readonly code: string
  readonly weight: ProgramCR8ExactDecimal
  readonly source: "SECTOR" | "INDUSTRY" | "THEME"
}

export interface ProgramCR8PortfolioContextSnapshot {
  readonly version: typeof PROGRAM_C_R8_PORTFOLIO_CONTEXT_CONTRACT_VERSION
  readonly validationUniverseVersion: typeof PROGRAM_C_VALIDATION_UNIVERSE_VERSION
  readonly portfolioId: string
  readonly includedSecurityIds: readonly string[]
  readonly holdings: readonly ProgramCR8HoldingContext[]
  readonly exposures: readonly ProgramCR8ExposureContext[]
  readonly classificationSnapshotVersion: string
  readonly ownerContextVersion: string | null
  readonly marketDataAsOf: string | null
  readonly r6ScoreRunIds: readonly string[]
  readonly r7RecommendationRunIds: readonly string[]
  readonly snapshotAsOf: string
  readonly holdingsFingerprint: string
  readonly snapshotFingerprint: string
  readonly snapshotId: string
}

export interface ProgramCR8PortfolioContextIdentityInput {
  readonly portfolioId: string
  readonly validationUniverseVersion: string
  readonly classificationSnapshotVersion: string
  readonly ownerContextVersion: string | null
  readonly holdingsFingerprint: string
  readonly snapshotFingerprint: string
}

function requireIdentityPart(value: string, field: string) {
  const clean = value.trim()
  if (!clean) throw new Error(`Program C R8 portfolio context identity requires ${field}.`)
  return clean
}

export function programCR8PortfolioContextSnapshotId(
  input: ProgramCR8PortfolioContextIdentityInput,
) {
  const parts = [
    requireIdentityPart(input.portfolioId, "portfolioId"),
    requireIdentityPart(input.validationUniverseVersion, "validationUniverseVersion"),
    requireIdentityPart(input.classificationSnapshotVersion, "classificationSnapshotVersion"),
    input.ownerContextVersion?.trim() || "OWNER_CONTEXT_VERSION_NONE",
    requireIdentityPart(input.holdingsFingerprint, "holdingsFingerprint"),
    requireIdentityPart(input.snapshotFingerprint, "snapshotFingerprint"),
  ]
  return `PROGRAM_C_R8_CONTEXT::${parts.join("::")}`
}

export const PROGRAM_C_R8_PORTFOLIO_CONTEXT_IDENTITY_REQUIREMENTS = {
  timestampAloneIsSufficient: false,
  holdingsFingerprintRequired: true,
  snapshotFingerprintRequired: true,
  validationUniverseVersionRequired: true,
  classificationVersionRequired: true,
  ownerContextVersionCarriedWhenAvailable: true,
  financialArithmeticRepresentation: "EXACT_DECIMAL_STRING",
} as const
