import type { P5TerminalDisposition } from "../../data/p5TerminalDispositionRepository"
import type { PortfolioViewModel } from "../portfolio/types"
import type { ResearchCoverageRow } from "../research/researchCoverage"
import { programCR8SemanticFingerprint } from "./r8Determinism"
import { buildProgramCR8LivePortfolioProjection } from "./r8LivePortfolioAdapter"
import { compareProgramCR9ObservedStates } from "./r9MeaningfulChangeEngine"
import {
  buildProgramCR9ObservedState,
  type ProgramCR9EvidenceState,
  type ProgramCR9ObservedState,
} from "./r9ObservedState"
import { projectProgramCR9Comparison } from "./r9Presentation"

export const PROGRAM_C_R9_LIVE_ADAPTER_VERSION =
  "PROGRAM_C_R9_LIVE_ADAPTER_V1" as const

function evidenceState(
  row: ResearchCoverageRow | undefined,
): ProgramCR9EvidenceState {
  if (!row) return "UNKNOWN"
  return row.overall
}

function latestTimestamp(values: readonly (string | null)[]) {
  const parsed = values
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ value, timestamp: Date.parse(value) }))
    .filter((entry) => Number.isFinite(entry.timestamp))
    .sort((left, right) => right.timestamp - left.timestamp)
  return parsed[0]?.value ?? null
}

export interface ProgramCR9LiveObservedRow {
  readonly securityId: string
  readonly symbol: string
  readonly company: string
  readonly observedState: ProgramCR9ObservedState
  readonly baseline: ReturnType<typeof compareProgramCR9ObservedStates>
  readonly presentation: ReturnType<typeof projectProgramCR9Comparison>
}

export interface ProgramCR9LiveObservedProjection {
  readonly version: typeof PROGRAM_C_R9_LIVE_ADAPTER_VERSION
  readonly rows: readonly ProgramCR9LiveObservedRow[]
  readonly omittedSecurityIds: readonly string[]
  readonly reasonCodes: readonly string[]
}

export function buildProgramCR9LiveObservedProjection(
  portfolio: PortfolioViewModel,
  coverageRows: readonly ResearchCoverageRow[],
  p5BySecurityId: ReadonlyMap<string, P5TerminalDisposition> = new Map(),
): ProgramCR9LiveObservedProjection {
  const r8 = buildProgramCR8LivePortfolioProjection(portfolio, coverageRows, p5BySecurityId)
  const r8ById = new Map(r8.rows.map((row) => [row.securityId, row]))
  const coverageById = new Map(coverageRows.map((row) => [row.securityId, row]))
  const omittedSecurityIds: string[] = []
  const rows: ProgramCR9LiveObservedRow[] = []

  for (const position of portfolio.openPositions) {
    const r8Row = r8ById.get(position.securityId)
    if (!r8Row) {
      omittedSecurityIds.push(position.securityId)
      continue
    }
    const coverage = coverageById.get(position.securityId)
    const terminal = p5BySecurityId.get(position.securityId)
    const observedAt = latestTimestamp([
      position.priceRetrievedAt,
      coverage?.latestEvidenceAt ?? null,
    ])
    if (!observedAt) {
      omittedSecurityIds.push(position.securityId)
      continue
    }

    const ownerContextVersion = programCR8SemanticFingerprint(
      "PROGRAM_C_R9_LIVE_OWNER_CONTEXT",
      {
        securityId: position.securityId,
        role: position.role,
        targetWeight: position.settings.targetWeight,
        minimumWeight: position.settings.minimumWeight,
        maximumWeight: position.settings.maximumWeight,
        investmentHorizon: position.settings.investmentHorizon,
        isWatchlisted: position.settings.isWatchlisted,
        isFrozen: position.settings.isFrozen,
      },
    )

    const observedState = buildProgramCR9ObservedState({
      securityId: position.securityId,
      portfolioId: portfolio.portfolio.id,
      assetClass: position.assetClass,
      observedAt,
      r6ReadinessState: terminal?.r6Disposition ?? "P5_TERMINAL_DISPOSITION_UNAVAILABLE",
      r7ReadinessState: terminal?.r7Disposition ?? "P5_TERMINAL_DISPOSITION_UNAVAILABLE",
      r7RecommendationState: null,
      r6OverallScore: null,
      evidenceState: evidenceState(coverage),
      valuationState: null,
      momentumState: null,
      ownerContextVersion,
      classificationVersion: null,
      r8Assessment: r8Row.assessment,
    })
    const baseline = compareProgramCR9ObservedStates(null, observedState)
    rows.push({
      securityId: position.securityId,
      symbol: position.symbol,
      company: position.company,
      observedState,
      baseline,
      presentation: projectProgramCR9Comparison(baseline),
    })
  }

  return {
    version: PROGRAM_C_R9_LIVE_ADAPTER_VERSION,
    rows,
    omittedSecurityIds: omittedSecurityIds.sort(),
    reasonCodes: [
      "R9_LIVE_EVENTS_ARE_IN_MEMORY_ONLY",
      "R9_P5_TERMINAL_AUTHORITY_CONSUMED",
      "R9_FIRST_OBSERVATION_NOT_NO_CHANGE",
      "R9_DURABLE_ACKNOWLEDGEMENT_AND_SNOOZE_NOT_AVAILABLE",
    ],
  }
}
