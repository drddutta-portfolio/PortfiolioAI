import { K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION } from "../research/k5CurrentPortfolioRoutingSnapshot"
import { buildProgramCR8FrozenPortfolioDisposition } from "./r8FrozenPortfolioDisposition"
import { buildProgramCR9FrozenPortfolioDisposition } from "./r9FrozenPortfolioDisposition"
import type { ProgramCR10AttentionState } from "./r10ActionCenterContract"

export const PROGRAM_C_R10_FROZEN_PORTFOLIO_DISPOSITION_VERSION =
  "PROGRAM_C_R10_FROZEN_PORTFOLIO_DISPOSITION_V1" as const

export interface ProgramCR10FrozenPortfolioDispositionRow {
  readonly symbol: string
  readonly state: ProgramCR10AttentionState
  readonly sourceR8Disposition: string
  readonly sourceR9Transition: string
  readonly integratedAttentionId: null
  readonly reasonCodes: readonly string[]
}

export interface ProgramCR10FrozenPortfolioDisposition {
  readonly version: typeof PROGRAM_C_R10_FROZEN_PORTFOLIO_DISPOSITION_VERSION
  readonly sourceSnapshotVersion: typeof K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION
  readonly totalHoldings: number
  readonly rows: readonly ProgramCR10FrozenPortfolioDispositionRow[]
  readonly dispositionComplete: true
  readonly directionalAddReviewCount: 0
  readonly directionalTrimReviewCount: 0
  readonly providerCalls: 0
  readonly persistedWrites: 0
}

export function buildProgramCR10FrozenPortfolioDisposition(): ProgramCR10FrozenPortfolioDisposition {
  const r8 = buildProgramCR8FrozenPortfolioDisposition()
  const r9 = buildProgramCR9FrozenPortfolioDisposition()
  const r9BySymbol = new Map(r9.rows.map((row) => [row.symbol, row]))

  if (r8.totalHoldings !== r9.totalHoldings) {
    throw new Error("Program C R10 frozen universe requires matching R8/R9 holding counts.")
  }

  const rows = r8.rows.map((r8Row): ProgramCR10FrozenPortfolioDispositionRow => {
    const r9Row = r9BySymbol.get(r8Row.symbol)
    if (!r9Row) {
      throw new Error(`Program C R10 frozen universe missing R9 disposition for ${r8Row.symbol}.`)
    }

    if (r8Row.overallDisposition === "NOT_APPLICABLE") {
      return {
        symbol: r8Row.symbol,
        state: "NOT_APPLICABLE",
        sourceR8Disposition: r8Row.overallDisposition,
        sourceR9Transition: r9Row.transitionState,
        integratedAttentionId: null,
        reasonCodes: ["R8_NOT_APPLICABLE"],
      }
    }

    return {
      symbol: r8Row.symbol,
      state: "BLOCKED_PREREQUISITE",
      sourceR8Disposition: r8Row.overallDisposition,
      sourceR9Transition: r9Row.transitionState,
      integratedAttentionId: null,
      reasonCodes: [
        "R10_FROZEN_SECURITY_ID_NOT_MATERIALIZED",
        "R10_R9_NO_COMPARABLE_BASELINE",
        "R10_EXPLICIT_BLOCKED_DISPOSITION_NO_FABRICATED_ACTION",
      ],
    }
  })

  return {
    version: PROGRAM_C_R10_FROZEN_PORTFOLIO_DISPOSITION_VERSION,
    sourceSnapshotVersion: r8.sourceSnapshotVersion,
    totalHoldings: rows.length,
    rows,
    dispositionComplete: true,
    directionalAddReviewCount: 0,
    directionalTrimReviewCount: 0,
    providerCalls: 0,
    persistedWrites: 0,
  }
}
