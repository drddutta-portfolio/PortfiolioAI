import { buildProgramB2FrozenPortfolioDisposition } from "../research/programBR6Execution"
import { buildProgramB4FrozenPortfolioDisposition } from "../research/programBR7Execution"
import {
  K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION,
} from "../research/k5CurrentPortfolioRoutingSnapshot"
import type { ProgramCR8CoreHealthState } from "./r8CoreHealthContract"
import type { ProgramCR8ExitIntelligenceState } from "./r8ExitIntelligenceContract"
import type { ProgramCR8OverallDisposition } from "./r8PortfolioDecisionContract"
import type { ProgramCR8PortfolioFitState } from "./r8PortfolioFitContract"
import type { ProgramCR8PortfolioRiskState } from "./r8PortfolioRiskContract"

export const PROGRAM_C_R8_FROZEN_PORTFOLIO_DISPOSITION_VERSION =
  "PROGRAM_C_R8_FROZEN_PORTFOLIO_DISPOSITION_V1" as const

export interface ProgramCR8FrozenPortfolioDispositionRow {
  readonly symbol: string
  readonly r6Disposition: string
  readonly r7Disposition: string
  readonly sourceScoreRunId: string | null
  readonly recommendationRunId: string | null
  readonly coreHealth: ProgramCR8CoreHealthState
  readonly portfolioFit: ProgramCR8PortfolioFitState
  readonly portfolioRisk: ProgramCR8PortfolioRiskState
  readonly exitIntelligence: ProgramCR8ExitIntelligenceState
  readonly overallDisposition: ProgramCR8OverallDisposition
  readonly reasonCodes: readonly string[]
}

export interface ProgramCR8FrozenPortfolioDisposition {
  readonly version: typeof PROGRAM_C_R8_FROZEN_PORTFOLIO_DISPOSITION_VERSION
  readonly sourceSnapshotVersion: typeof K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION
  readonly totalHoldings: number
  readonly rows: readonly ProgramCR8FrozenPortfolioDispositionRow[]
  readonly dispositionComplete: true
  readonly numericActionCoverageComplete: false
  readonly providerCalls: 0
  readonly persistedWrites: 0
}

export function buildProgramCR8FrozenPortfolioDisposition(): ProgramCR8FrozenPortfolioDisposition {
  const r6 = buildProgramB2FrozenPortfolioDisposition()
  const r7 = buildProgramB4FrozenPortfolioDisposition()
  const r7BySymbol = new Map(r7.rows.map((row) => [row.symbol, row]))

  if (r6.totalHoldings !== r7.totalHoldings) {
    throw new Error("Program C R8 frozen universe requires matching R6/R7 holding counts.")
  }

  const rows = r6.rows.map((row): ProgramCR8FrozenPortfolioDispositionRow => {
    const recommendation = r7BySymbol.get(row.symbol)
    if (!recommendation) {
      throw new Error(`Program C R8 frozen universe missing R7 disposition for ${row.symbol}.`)
    }

    if (row.dispositionState === "NOT_APPLICABLE") {
      return {
        symbol: row.symbol,
        r6Disposition: row.dispositionState,
        r7Disposition: recommendation.recommendationDisposition,
        sourceScoreRunId: recommendation.sourceScoreRunId,
        recommendationRunId: recommendation.recommendationRunId,
        coreHealth: "NOT_APPLICABLE",
        portfolioFit: "NOT_APPLICABLE",
        portfolioRisk: "NOT_APPLICABLE",
        exitIntelligence: "NOT_APPLICABLE",
        overallDisposition: "NOT_APPLICABLE",
        reasonCodes: ["ASSET_NOT_APPLICABLE"],
      }
    }

    return {
      symbol: row.symbol,
      r6Disposition: row.dispositionState,
      r7Disposition: recommendation.recommendationDisposition,
      sourceScoreRunId: recommendation.sourceScoreRunId,
      recommendationRunId: recommendation.recommendationRunId,
      coreHealth: "BLOCKED_PREREQUISITE",
      portfolioFit: "BLOCKED_PREREQUISITE",
      portfolioRisk: "BLOCKED_PREREQUISITE",
      exitIntelligence: "INSUFFICIENT_EVIDENCE",
      overallDisposition: "BLOCKED_PREREQUISITE",
      reasonCodes: [
        "FROZEN_K5_OWNER_CONTEXT_NOT_MATERIALIZED",
        "FROZEN_K5_CURRENT_WEIGHT_NOT_MATERIALIZED",
        "FROZEN_K5_CANONICAL_RISK_EVIDENCE_NOT_MATERIALIZED",
        "FROZEN_K5_THESIS_EVIDENCE_NOT_MATERIALIZED",
      ],
    }
  })

  return {
    version: PROGRAM_C_R8_FROZEN_PORTFOLIO_DISPOSITION_VERSION,
    sourceSnapshotVersion: K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION,
    totalHoldings: rows.length,
    rows,
    dispositionComplete: true,
    numericActionCoverageComplete: false,
    providerCalls: 0,
    persistedWrites: 0,
  }
}
