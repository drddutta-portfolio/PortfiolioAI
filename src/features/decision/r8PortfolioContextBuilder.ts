import Decimal from "decimal.js"
import {
  PROGRAM_C_R8_PORTFOLIO_CONTEXT_CONTRACT_VERSION,
  PROGRAM_C_VALIDATION_UNIVERSE_VERSION,
  programCR8PortfolioContextSnapshotId,
  type ProgramCR8ExposureContext,
  type ProgramCR8HoldingContext,
  type ProgramCR8OwnerContext,
  type ProgramCR8PortfolioContextSnapshot,
} from "./r8PortfolioContext"
import { programCR8SemanticFingerprint } from "./r8Determinism"

export interface ProgramCR8PortfolioContextHoldingInput {
  readonly securityId: string
  readonly symbol: string
  readonly assetClass: string
  readonly quantity: string
  readonly averageCost: string | null
  readonly currentPrice: string | null
  readonly currentValue: string | null
  readonly currentWeight: string | null
  readonly sector: string | null
  readonly industry: string | null
  readonly basicIndustry: string | null
  readonly classificationVersion: string
  readonly themes: readonly string[]
  readonly ownerContext: ProgramCR8OwnerContext
}

export interface ProgramCR8PortfolioContextBuildInput {
  readonly portfolioId: string
  readonly holdings: readonly ProgramCR8PortfolioContextHoldingInput[]
  readonly classificationSnapshotVersion: string
  readonly marketDataAsOf: string | null
  readonly r6ScoreRunIds: readonly string[]
  readonly r7RecommendationRunIds: readonly string[]
  readonly snapshotAsOf: string
}

function cleanRequired(value: string, field: string) {
  const clean = value.trim()
  if (!clean) throw new Error(`Program C R8 portfolio context requires ${field}.`)
  return clean
}

function exactOrNull(value: string | null, field: string) {
  if (value === null) return null
  try {
    return new Decimal(value).toString()
  } catch {
    throw new Error(`Program C R8 portfolio context received invalid exact decimal for ${field}.`)
  }
}

function sortedUnique(values: readonly string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort()
}

function exposureRows(holdings: readonly ProgramCR8HoldingContext[]): readonly ProgramCR8ExposureContext[] {
  const totals = new Map<string, { source: ProgramCR8ExposureContext["source"]; code: string; value: Decimal }>()
  const add = (source: ProgramCR8ExposureContext["source"], code: string | null, weight: string | null) => {
    if (!code?.trim() || weight === null) return
    let parsed: Decimal
    try {
      parsed = new Decimal(weight)
    } catch {
      return
    }
    const key = `${source}::${code.trim()}`
    const current = totals.get(key)
    totals.set(key, {
      source,
      code: code.trim(),
      value: (current?.value ?? new Decimal(0)).plus(parsed),
    })
  }

  for (const holding of holdings) {
    add("SECTOR", holding.sector, holding.currentWeight)
    add("INDUSTRY", holding.industry, holding.currentWeight)
    for (const theme of holding.themes) add("THEME", theme, holding.currentWeight)
  }

  return [...totals.values()]
    .map((row) => ({
      source: row.source,
      code: row.code,
      weight: row.value.toString(),
    }))
    .sort((left, right) => (
      left.source.localeCompare(right.source)
      || left.code.localeCompare(right.code)
    ))
}

export function buildProgramCR8PortfolioContext(
  input: ProgramCR8PortfolioContextBuildInput,
): ProgramCR8PortfolioContextSnapshot {
  const portfolioId = cleanRequired(input.portfolioId, "portfolioId")
  const classificationSnapshotVersion = cleanRequired(
    input.classificationSnapshotVersion,
    "classificationSnapshotVersion",
  )
  const snapshotAsOf = cleanRequired(input.snapshotAsOf, "snapshotAsOf")

  const holdings: readonly ProgramCR8HoldingContext[] = [...input.holdings]
    .map((holding) => ({
      securityId: cleanRequired(holding.securityId, "holding.securityId"),
      symbol: cleanRequired(holding.symbol, "holding.symbol"),
      assetClass: cleanRequired(holding.assetClass, "holding.assetClass"),
      quantity: exactOrNull(holding.quantity, "holding.quantity") ?? "0",
      averageCost: exactOrNull(holding.averageCost, "holding.averageCost"),
      currentPrice: exactOrNull(holding.currentPrice, "holding.currentPrice"),
      currentValue: exactOrNull(holding.currentValue, "holding.currentValue"),
      currentWeight: exactOrNull(holding.currentWeight, "holding.currentWeight"),
      sector: holding.sector?.trim() || null,
      industry: holding.industry?.trim() || null,
      basicIndustry: holding.basicIndustry?.trim() || null,
      classificationVersion: cleanRequired(
        holding.classificationVersion,
        "holding.classificationVersion",
      ),
      themes: sortedUnique(holding.themes),
      ownerContext: holding.ownerContext,
    }))
    .sort((left, right) => left.securityId.localeCompare(right.securityId))

  const includedSecurityIds = holdings.map((holding) => holding.securityId)
  if (new Set(includedSecurityIds).size !== includedSecurityIds.length) {
    throw new Error("Program C R8 portfolio context contains duplicate security identities.")
  }

  const ownerContextVersion = programCR8SemanticFingerprint(
    "PROGRAM_C_R8_OWNER_CONTEXT",
    holdings.map((holding) => ({
      securityId: holding.securityId,
      ownerContext: holding.ownerContext,
    })),
  )
  const holdingsFingerprint = programCR8SemanticFingerprint(
    "PROGRAM_C_R8_HOLDINGS",
    holdings,
  )
  const exposures = exposureRows(holdings)
  const r6ScoreRunIds = sortedUnique(input.r6ScoreRunIds)
  const r7RecommendationRunIds = sortedUnique(input.r7RecommendationRunIds)
  const snapshotFingerprint = programCR8SemanticFingerprint(
    "PROGRAM_C_R8_SNAPSHOT",
    {
      portfolioId,
      validationUniverseVersion: PROGRAM_C_VALIDATION_UNIVERSE_VERSION,
      classificationSnapshotVersion,
      ownerContextVersion,
      marketDataAsOf: input.marketDataAsOf,
      holdingsFingerprint,
      exposures,
      r6ScoreRunIds,
      r7RecommendationRunIds,
    },
  )
  const snapshotId = programCR8PortfolioContextSnapshotId({
    portfolioId,
    validationUniverseVersion: PROGRAM_C_VALIDATION_UNIVERSE_VERSION,
    classificationSnapshotVersion,
    ownerContextVersion,
    holdingsFingerprint,
    snapshotFingerprint,
  })

  return {
    version: PROGRAM_C_R8_PORTFOLIO_CONTEXT_CONTRACT_VERSION,
    validationUniverseVersion: PROGRAM_C_VALIDATION_UNIVERSE_VERSION,
    portfolioId,
    includedSecurityIds,
    holdings,
    exposures,
    classificationSnapshotVersion,
    ownerContextVersion,
    marketDataAsOf: input.marketDataAsOf,
    r6ScoreRunIds,
    r7RecommendationRunIds,
    snapshotAsOf,
    holdingsFingerprint,
    snapshotFingerprint,
    snapshotId,
  }
}
