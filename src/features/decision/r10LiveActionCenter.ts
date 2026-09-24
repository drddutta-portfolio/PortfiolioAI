import type { PortfolioPosition, PortfolioViewModel } from "../portfolio/types"
import type { ResearchCoverageRow } from "../research/researchCoverage"
import { programCR8SemanticFingerprint } from "./r8Determinism"
import type { ProgramCR8OwnerContext } from "./r8PortfolioContext"
import { buildProgramCR8LivePortfolioProjection } from "./r8LivePortfolioAdapter"
import { buildProgramCR9LiveObservedProjection } from "./r9LivePortfolioAdapter"
import { evaluateProgramCR10Attention } from "./r10ActionCenterEngine"
import { buildProgramCR10ActionCenterView } from "./r10ActionCenterViewModel"
import type {
  ProgramCR10OwnerThresholdContext,
  ProgramCR10IntegratedAttention,
} from "./r10ActionCenterContract"

export const PROGRAM_C_R10_LIVE_ACTION_CENTER_VERSION =
  "PROGRAM_C_R10_LIVE_ACTION_CENTER_V1" as const

export interface ProgramCR10MonitoringInput {
  readonly targetPrice: string | null
  readonly stopLossPrice: string | null
  readonly targetPriceAlertEnabled: boolean | null
  readonly stopLossAlertEnabled: boolean | null
}

function ownerContext(position: PortfolioPosition): ProgramCR8OwnerContext {
  const portfolioRole = position.role === "UNCLASSIFIED" ? null : position.role
  const ownerContextVersion = programCR8SemanticFingerprint(
    "PROGRAM_C_R8_OWNER_HOLDING",
    {
      securityId: position.securityId,
      portfolioRole,
      settingsId: position.settings.id,
      targetWeight: position.settings.targetWeight,
      minimumWeight: position.settings.minimumWeight,
      maximumWeight: position.settings.maximumWeight,
      investmentHorizon: position.settings.investmentHorizon,
      isWatchlisted: position.settings.isWatchlisted,
      isFrozen: position.settings.isFrozen,
    },
  )
  return {
    portfolioRole,
    targetPrice: null,
    stopLossPrice: null,
    targetWeight: position.settings.targetWeight,
    minimumAllocation: position.settings.minimumWeight,
    maximumAllocation: position.settings.maximumWeight,
    investmentHorizon: position.settings.investmentHorizon,
    freezeMonitoringPreference: position.settings.isFrozen
      ? "FROZEN"
      : position.settings.isWatchlisted
        ? "WATCHLISTED"
        : null,
    ownerContextVersion,
    ownerContextAsOf: null,
  }
}

function thresholds(
  position: PortfolioPosition,
  monitoring: ProgramCR10MonitoringInput | undefined,
): ProgramCR10OwnerThresholdContext {
  return {
    currentPrice: position.currentPrice,
    targetPrice: monitoring?.targetPrice ?? null,
    stopLossPrice: monitoring?.stopLossPrice ?? null,
    targetPriceAlertEnabled: monitoring?.targetPriceAlertEnabled !== false,
    stopLossAlertEnabled: monitoring?.stopLossAlertEnabled !== false,
  }
}

export interface ProgramCR10LiveActionCenter {
  readonly version: typeof PROGRAM_C_R10_LIVE_ACTION_CENTER_VERSION
  readonly attentions: readonly ProgramCR10IntegratedAttention[]
  readonly view: ReturnType<typeof buildProgramCR10ActionCenterView>
  readonly omittedSecurityIds: readonly string[]
  readonly reasonCodes: readonly string[]
}

export function buildProgramCR10LiveActionCenter(
  portfolio: PortfolioViewModel,
  coverageRows: readonly ResearchCoverageRow[],
  monitoringBySecurityId: ReadonlyMap<string, ProgramCR10MonitoringInput>,
): ProgramCR10LiveActionCenter {
  const r8 = buildProgramCR8LivePortfolioProjection(portfolio, coverageRows)
  const r9 = buildProgramCR9LiveObservedProjection(portfolio, coverageRows)
  const r8ById = new Map(r8.rows.map((row) => [row.securityId, row]))
  const r9ById = new Map(r9.rows.map((row) => [row.securityId, row]))
  const positionById = new Map(
    portfolio.openPositions.map((position) => [position.securityId, position]),
  )

  const attentions: ProgramCR10IntegratedAttention[] = []
  const omittedSecurityIds = new Set(r9.omittedSecurityIds)

  for (const position of portfolio.openPositions) {
    const r8Row = r8ById.get(position.securityId)
    const r9Row = r9ById.get(position.securityId)
    if (!r8Row || !r9Row || !positionById.has(position.securityId)) {
      omittedSecurityIds.add(position.securityId)
      continue
    }

    attentions.push(evaluateProgramCR10Attention({
      securityId: position.securityId,
      portfolioId: portfolio.portfolio.id,
      symbol: position.symbol,
      company: position.company,
      asOf: r9Row.observedState.observedAt,
      classificationVersion: r9Row.observedState.lineage.classificationVersion,
      r7RecommendationState: r9Row.observedState.states.r7RecommendationState,
      r8: r8Row.assessment,
      r9: r9Row.baseline,
      ownerContext: ownerContext(position),
      ownerThresholds: thresholds(
        position,
        monitoringBySecurityId.get(position.securityId),
      ),
    }))
  }

  return {
    version: PROGRAM_C_R10_LIVE_ACTION_CENTER_VERSION,
    attentions,
    view: buildProgramCR10ActionCenterView(attentions),
    omittedSecurityIds: [...omittedSecurityIds].sort(),
    reasonCodes: [
      "R10_CANONICAL_ACTION_CENTER_READ_ONLY",
      "R10_LIVE_R9_BASELINE_IS_IN_MEMORY_FIRST_OBSERVATION",
      "R10_ADD_TRIM_REVIEW_NOT_PROMOTED",
      "R10_NO_NUMERIC_SIZING_OR_TRADE_INSTRUCTION",
    ],
  }
}
