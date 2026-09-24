import { K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION } from "../research/k5CurrentPortfolioRoutingSnapshot"
import { buildProgramCR8FrozenPortfolioDisposition } from "./r8FrozenPortfolioDisposition"
import {
  PROGRAM_C_R9_CONTRACT_VERSION,
  type ProgramCR9BaselineState,
  type ProgramCR9TransitionState,
} from "./r9MeaningfulChangeContract"

export const PROGRAM_C_R9_FROZEN_PORTFOLIO_DISPOSITION_VERSION =
  "PROGRAM_C_R9_FROZEN_PORTFOLIO_DISPOSITION_V1" as const

export interface ProgramCR9FrozenPortfolioDispositionRow {
  readonly symbol: string
  readonly securityId: null
  readonly baselineState: ProgramCR9BaselineState
  readonly transitionState: ProgramCR9TransitionState
  readonly previousObservedStateId: null
  readonly currentObservedStateId: null
  readonly changeEventId: null
  readonly sourceR8Disposition: string
  readonly reasonCodes: readonly string[]
}

export interface ProgramCR9FrozenPortfolioDisposition {
  readonly version: typeof PROGRAM_C_R9_FROZEN_PORTFOLIO_DISPOSITION_VERSION
  readonly contractVersion: typeof PROGRAM_C_R9_CONTRACT_VERSION
  readonly sourceSnapshotVersion: typeof K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION
  readonly totalHoldings: number
  readonly rows: readonly ProgramCR9FrozenPortfolioDispositionRow[]
  readonly dispositionComplete: true
  readonly meaningfulEventCount: 0
  readonly providerCalls: 0
  readonly persistedWrites: 0
}

export function buildProgramCR9FrozenPortfolioDisposition(): ProgramCR9FrozenPortfolioDisposition {
  const r8 = buildProgramCR8FrozenPortfolioDisposition()

  const rows = r8.rows.map((row): ProgramCR9FrozenPortfolioDispositionRow => ({
    symbol: row.symbol,
    securityId: null,
    baselineState: "NO_COMPARABLE_BASELINE",
    transitionState: "FIRST_OBSERVATION",
    previousObservedStateId: null,
    currentObservedStateId: null,
    changeEventId: null,
    sourceR8Disposition: row.overallDisposition,
    reasonCodes: [
      "R9_FIRST_OBSERVATION",
      "R9_FIRST_OBSERVATION_NOT_NO_CHANGE",
      "FROZEN_K5_SECURITY_ID_NOT_MATERIALIZED",
      "R9_EVENT_NOT_CREATED_WITHOUT_COMPARABLE_BASELINE",
    ],
  }))

  return {
    version: PROGRAM_C_R9_FROZEN_PORTFOLIO_DISPOSITION_VERSION,
    contractVersion: PROGRAM_C_R9_CONTRACT_VERSION,
    sourceSnapshotVersion: r8.sourceSnapshotVersion,
    totalHoldings: rows.length,
    rows,
    dispositionComplete: true,
    meaningfulEventCount: 0,
    providerCalls: 0,
    persistedWrites: 0,
  }
}
