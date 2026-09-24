import type { PortfolioPosition, PortfolioViewModel } from "../portfolio/types"
import type { ResearchCoverageRow, ResearchCoverageState } from "../research/researchCoverage"
import type { ProgramCR8RiskSignal } from "./r8PortfolioRisk"
import { buildProgramCR8PortfolioContext } from "./r8PortfolioContextBuilder"
import { programCR8SemanticFingerprint } from "./r8Determinism"
import {
  PROGRAM_C_R8_DECISION_CONTRACT_VERSION,
  type ProgramCR8CanonicalEvidenceReference,
  type ProgramCR8PortfolioDecisionInput,
  type ProgramCR8R6Reference,
} from "./r8PortfolioDecisionContract"
import { evaluateProgramCR8PortfolioDecision } from "./r8PortfolioDecisionEngine"
import { projectProgramCR8Assessment } from "./r8Presentation"
import type { ProgramCR8OwnerContext } from "./r8PortfolioContext"

export const PROGRAM_C_R8_LIVE_ADAPTER_VERSION =
  "PROGRAM_C_R8_LIVE_ADAPTER_V1" as const

function latestIso(values: readonly (string | null)[]) {
  const valid = values
    .filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value as string)))
    .sort((left, right) => right.localeCompare(left))
  return valid[0] ?? null
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

function liveR6Reference(): ProgramCR8R6Reference {
  return {
    readinessState: "BLOCKED_PREREQUISITE",
    scoreRunId: null,
    researchProfileCode: null,
    methodologyId: null,
    methodologyVersion: null,
    methodologyRole: null,
    assignmentId: null,
    assignmentVersion: null,
    classificationVersion: null,
    evidenceSnapshotId: null,
    evidenceAsOfDates: [],
    reasonCodes: ["LIVE_CANONICAL_R6_RUN_NOT_MATERIALIZED"],
  }
}

function evidenceReferences(
  coverage: ResearchCoverageRow | undefined,
): readonly ProgramCR8CanonicalEvidenceReference[] {
  if (!coverage) return []
  const rows = [
    ["PROVIDER_IDENTITY", coverage.providerIdentity],
    ["FUNDAMENTALS", coverage.fundamentals],
    ["OWNERSHIP", coverage.ownership],
    ["VALUATION", coverage.valuation],
    ["DOCUMENTS", coverage.documents],
  ] as const
  return rows.map(([domain, state]) => ({
    domain,
    state,
    evidenceIds: [],
    asOfDates: coverage.latestEvidenceAt ? [coverage.latestEvidenceAt] : [],
    authorityVersion: "RESEARCH_COVERAGE_RUNTIME_V1",
  }))
}

function riskSignal(state: ResearchCoverageState | undefined): ProgramCR8RiskSignal {
  if (!state || state === "MISSING") return "MISSING"
  if (state === "STALE") return "STALE"
  if (state === "CONFLICTING") return "CONFLICTING"
  if (state === "REVIEW_REQUIRED") return "REVIEW_REQUIRED"
  if (state === "NOT_APPLICABLE") return "NOT_APPLICABLE"
  return "MISSING"
}

export interface ProgramCR8LiveAssessmentRow {
  readonly securityId: string
  readonly symbol: string
  readonly company: string
  readonly assessment: ReturnType<typeof evaluateProgramCR8PortfolioDecision>
  readonly presentation: ReturnType<typeof projectProgramCR8Assessment>
}

export interface ProgramCR8LivePortfolioProjection {
  readonly version: typeof PROGRAM_C_R8_LIVE_ADAPTER_VERSION
  readonly portfolioContextSnapshotId: string | null
  readonly rows: readonly ProgramCR8LiveAssessmentRow[]
  readonly reasonCodes: readonly string[]
}

export function buildProgramCR8LivePortfolioProjection(
  portfolio: PortfolioViewModel,
  coverageRows: readonly ResearchCoverageRow[],
): ProgramCR8LivePortfolioProjection {
  const marketDataAsOf = latestIso(
    portfolio.openPositions.map((position) => position.priceRetrievedAt),
  )
  const coverageAsOf = latestIso(coverageRows.map((row) => row.latestEvidenceAt))
  const snapshotAsOf = latestIso([marketDataAsOf, coverageAsOf])

  if (!snapshotAsOf) {
    return {
      version: PROGRAM_C_R8_LIVE_ADAPTER_VERSION,
      portfolioContextSnapshotId: null,
      rows: [],
      reasonCodes: ["LIVE_PORTFOLIO_SNAPSHOT_AS_OF_UNAVAILABLE"],
    }
  }

  const classificationSnapshotVersion = programCR8SemanticFingerprint(
    "PROGRAM_C_R8_LIVE_CLASSIFICATION",
    portfolio.openPositions
      .map((position) => ({
        securityId: position.securityId,
        sector: position.sector,
        industry: position.industry,
      }))
      .sort((left, right) => left.securityId.localeCompare(right.securityId)),
  )

  const context = buildProgramCR8PortfolioContext({
    portfolioId: portfolio.portfolio.id,
    holdings: portfolio.openPositions.map((position) => ({
      securityId: position.securityId,
      symbol: position.symbol,
      assetClass: position.assetClass,
      quantity: position.quantity,
      averageCost: position.averageCost,
      currentPrice: position.currentPrice,
      currentValue: position.currentValue,
      currentWeight: position.portfolioWeightPercent,
      sector: position.sector,
      industry: position.industry,
      basicIndustry: null,
      classificationVersion: classificationSnapshotVersion,
      themes: position.themes.map((theme) => theme.name),
      ownerContext: ownerContext(position),
    })),
    classificationSnapshotVersion,
    marketDataAsOf,
    r6ScoreRunIds: [],
    r7RecommendationRunIds: [],
    snapshotAsOf,
  })

  const coverageById = new Map(coverageRows.map((row) => [row.securityId, row]))
  const asOfDate = snapshotAsOf.slice(0, 10)

  const rows = portfolio.openPositions.map((position): ProgramCR8LiveAssessmentRow => {
    const coverage = coverageById.get(position.securityId)
    const r6 = liveR6Reference()
    const input: ProgramCR8PortfolioDecisionInput = {
      version: PROGRAM_C_R8_DECISION_CONTRACT_VERSION,
      securityId: position.securityId,
      assetClass: position.assetClass,
      asOfDate,
      r6,
      r7: null,
      ownerContext: ownerContext(position),
      portfolioContext: context,
      canonicalEvidence: evidenceReferences(coverage),
    }
    const assessment = evaluateProgramCR8PortfolioDecision(input, {
      coreHealth: "MISSING",
      portfolioRisk: riskSignal(coverage?.overall),
      exitIntelligence: position.assetClass === "EQUITY" ? "MISSING" : "NOT_APPLICABLE",
      riskEvidenceIds: [],
      thesisEvidenceIds: [],
    })
    return {
      securityId: position.securityId,
      symbol: position.symbol,
      company: position.company,
      assessment,
      presentation: projectProgramCR8Assessment(assessment),
    }
  })

  return {
    version: PROGRAM_C_R8_LIVE_ADAPTER_VERSION,
    portfolioContextSnapshotId: context.snapshotId,
    rows,
    reasonCodes: [
      "LIVE_R8_PORTFOLIO_FIT_ENABLED_FROM_OWNER_CONTEXT",
      "LIVE_R8_CORE_RISK_EXIT_FAIL_CLOSED_WITHOUT_CANONICAL_DECISION_EVIDENCE",
      "LIVE_R6_R7_RUN_LINEAGE_NOT_MATERIALIZED_IN_THIS_SURFACE",
    ],
  }
}
