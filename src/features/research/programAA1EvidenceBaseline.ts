import type { PortfolioCoverageRegistryRecord } from "../../data/portfolioCoverageRegistryRepository"
import { resolveScoringProfile } from "./scoringProfileResolution"
import { routeResearchProfileV1 } from "./researchProfileRouting"
import type { ScoringExecutionState, ScoringMethodologyState } from "./scoringTypes"
import { SECTOR_ENGINE_REGISTRY } from "./sectorEngineRegistry"
import { planIncrementalHistoryWindow, type IncrementalHistoryWindowPlan } from "./programAMarketHistoryPlanner"

export const PROGRAM_A_A1_BASELINE_VERSION = "PROGRAM_A_A1_EVIDENCE_BASELINE_V1" as const

export type ProgramAEligibilityState = "ELIGIBLE" | "NOT_APPLICABLE" | "METHODOLOGY_NOT_AVAILABLE" | "REVIEW_REQUIRED"
export type ProgramACoverageState = "FRESH" | "STALE" | "MISSING" | "CONFLICTING" | "REVIEW_REQUIRED" | "NOT_APPLICABLE" | "READY_TO_DERIVE"
export type R3Domain = "FUNDAMENTALS" | "OWNERSHIP" | "EXTERNAL_RATINGS" | "DOCUMENTS" | "VALUATION" | "BUSINESS_DURABILITY" | "OTHER_MANDATORY_PROFILE_EVIDENCE"
export type MarketMetricCode = "PRICE_MOMENTUM_6M" | "PRICE_MOMENTUM_12M" | "MAX_DRAWDOWN_1Y" | "VOLATILITY_1Y" | "RELATIVE_STRENGTH_12M" | "BENCHMARK_RELATIVE_VOLATILITY_1Y"

export interface CanonicalR3DomainInput {
  readonly domain: R3Domain
  readonly applicable: boolean
  readonly state: Exclude<ProgramACoverageState, "NOT_APPLICABLE" | "READY_TO_DERIVE">
  readonly freshUntil: string | null
  readonly authoritySource: string
  readonly blockingReason: string | null
  readonly estimatedRefreshAction: string | null
  readonly projectedProviderCalls: number
  /** One provider response may satisfy several independently validated domains. */
  readonly sharedCallKey: string | null
  readonly derivableFromStoredEvidence?: boolean
}

export interface ProgramAHoldingInput {
  readonly coverage: PortfolioCoverageRegistryRecord
  readonly portfolioWeightPercent: string | null
  readonly r3Domains: readonly CanonicalR3DomainInput[]
  readonly marketIdentityState: "VERIFIED" | "MISSING" | "CONFLICTING" | "REVIEW_REQUIRED"
  readonly marketMetricCodes: readonly MarketMetricCode[]
  readonly requiredLookbackDays: number
  readonly overlapDays: number
}

export interface ProgramAEligibilityRecord {
  readonly securityId: string
  readonly symbol: string
  readonly assetClass: string
  readonly canonicalSector: string | null
  readonly canonicalIndustry: string | null
  readonly researchProfileCode: string | null
  readonly researchSubprofileCode: string | null
  readonly methodologyState: ScoringMethodologyState
  readonly scoringExecutionState: ScoringExecutionState
  readonly eligibilityState: ProgramAEligibilityState
  readonly r3Applicable: boolean
  readonly r5Applicable: boolean
  readonly reasonCode: string
  readonly portfolioWeightPercent: string | null
}

export interface R3CoverageRow {
  readonly securityId: string
  readonly symbol: string
  readonly profileCode: string
  readonly domain: R3Domain
  readonly state: ProgramACoverageState
  readonly freshUntil: string | null
  readonly authoritySource: string
  readonly blockingReason: string | null
  readonly estimatedRefreshAction: string | null
  readonly projectedProviderCalls: number
  readonly sharedCallKey: string | null
}

export interface BenchmarkRuntimeEvidence {
  readonly benchmarkCode: string
  readonly identityState: "VERIFIED" | "MISSING" | "CONFLICTING" | "REVIEW_REQUIRED"
  readonly earliestStoredCandle: string | null
  readonly latestStoredCandle: string | null
}

export interface BenchmarkInventoryRow {
  readonly engineCode: string
  readonly profileCode: string
  readonly methodologyState: "SUPPORTED" | "PENDING_METHODOLOGY"
  readonly benchmarkAuthority: string
  readonly benchmarkCode: string | null
  readonly benchmarkType: "SECTOR_INDEX" | "COMPOSITE_CONTEXT" | "PENDING"
  readonly implementationSupport: boolean
  readonly identitySupport: boolean
  readonly historySupport: boolean
  readonly missingPrerequisite: string | null
  readonly dependencyMode: "BLOCKING_DERIVED_METRIC" | "CONTEXT_ONLY"
}

export interface R5HistoryCoverageRow {
  readonly securityId: string
  readonly symbol: string
  readonly profileCode: string
  readonly identityState: ProgramACoverageState
  readonly earliestStoredCandle: string | null
  readonly latestStoredCandle: string | null
  readonly availableHistoryDays: number | null
  readonly lookbackSatisfied: boolean
  readonly missingWindow: IncrementalHistoryWindowPlan | null
  readonly derivedMetrics: Readonly<Record<MarketMetricCode, ProgramACoverageState>>
  readonly benchmarkAuthority: string | null
  readonly benchmarkCode: string | null
  readonly benchmarkReadiness: ProgramACoverageState
  readonly blockingReason: string | null
}

export interface ProgramAProviderCostProjection {
  readonly providerCalls: 0
  readonly budgetConsumed: 0
  readonly trendlyne: {
    readonly holdingsNeedingRefresh: number
    readonly domainRefreshes: number
    readonly estimatedPhysicalCalls: number
    readonly sharedCallGroups: number
  }
  readonly angelOne: {
    readonly holdingsNeedingHistory: number
    readonly fullBackfills: number
    readonly incrementalRefreshes: number
    readonly estimatedSecurityRequests: number
    readonly estimatedBenchmarkRequests: number
  }
}

export interface ProgramAPilotProposal {
  readonly r3: readonly { readonly symbol: string; readonly criterion: "HIGH_WEIGHT_SUPPORTED" | "NON_PHARMA_K4" | "BLOCKED_OR_REVIEW" | "STALE_OR_MISSING_EVIDENCE" }[]
  readonly r5: readonly { readonly symbol: string; readonly criterion: "PARTIAL_HISTORY" | "LARGER_BACKFILL" | "BENCHMARK_DEPENDENT" | "BLOCKED_IDENTITY_OR_BENCHMARK" }[]
}

export interface ProgramAA1Baseline {
  readonly version: typeof PROGRAM_A_A1_BASELINE_VERSION
  readonly asOfDate: string
  readonly eligibility: readonly ProgramAEligibilityRecord[]
  readonly r3Coverage: readonly R3CoverageRow[]
  readonly r5Coverage: readonly R5HistoryCoverageRow[]
  readonly benchmarkInventory: readonly BenchmarkInventoryRow[]
  readonly projectedProviderCost: ProgramAProviderCostProjection
  readonly pilotProposal: ProgramAPilotProposal
  readonly providerCalls: 0
  readonly budgetConsumed: 0
}

const IMPLEMENTED_BENCHMARK_ADAPTERS: Readonly<Record<string, string>> = {
  PHARMA_V1: "NIFTY_PHARMA",
  NIFTY_BANK: "NIFTY_BANK",
}

const MARKET_METRICS: readonly MarketMetricCode[] = [
  "PRICE_MOMENTUM_6M", "PRICE_MOMENTUM_12M", "MAX_DRAWDOWN_1Y", "VOLATILITY_1Y", "RELATIVE_STRENGTH_12M", "BENCHMARK_RELATIVE_VOLATILITY_1Y",
]
const REQUIRED_R3_DOMAINS: readonly R3Domain[] = ["FUNDAMENTALS", "OWNERSHIP", "EXTERNAL_RATINGS", "DOCUMENTS", "VALUATION", "BUSINESS_DURABILITY"]

function numberOrZero(value: string | null) {
  const parsed = value === null ? 0 : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function dayDepth(first: string | null, latest: string | null) {
  if (!first || !latest) return null
  const depth = Math.floor((Date.parse(latest) - Date.parse(first)) / 86_400_000)
  return Number.isFinite(depth) && depth >= 0 ? depth : null
}

function benchmarkType(authority: string): BenchmarkInventoryRow["benchmarkType"] {
  if (authority.includes("PENDING")) return "PENDING"
  return authority.includes("__") || authority.includes("WITH_") || authority.includes("CONTEXT") ? "COMPOSITE_CONTEXT" : "SECTOR_INDEX"
}

function benchmarkCode(authority: string) {
  return IMPLEMENTED_BENCHMARK_ADAPTERS[authority] ?? null
}

export function buildBenchmarkInventory(evidence: readonly BenchmarkRuntimeEvidence[]): readonly BenchmarkInventoryRow[] {
  const evidenceByCode = new Map(evidence.map((item) => [item.benchmarkCode, item]))
  return SECTOR_ENGINE_REGISTRY.flatMap((engine) => engine.profileCodes.map((profileCode) => {
    const profileAuthority = engine.profileAuthorities?.[profileCode]
    const authority = profileAuthority?.benchmarkAuthority ?? engine.benchmarkAuthority
    const methodologyState = profileAuthority?.state ?? "SUPPORTED"
    const code = benchmarkCode(authority)
    const runtime = code ? evidenceByCode.get(code) : undefined
    const implementationSupport = code !== null
    const identitySupport = runtime?.identityState === "VERIFIED"
    const historySupport = identitySupport && Boolean(runtime?.earliestStoredCandle && runtime.latestStoredCandle)
    const pending = methodologyState === "PENDING_METHODOLOGY"
    const missingPrerequisite = pending
      ? "PROFILE_METHODOLOGY_PENDING"
      : !implementationSupport
        ? "BENCHMARK_ADAPTER_NOT_IMPLEMENTED"
        : !identitySupport
          ? "BENCHMARK_IDENTITY_NOT_VERIFIED"
          : !historySupport
            ? "BENCHMARK_HISTORY_MISSING"
            : null
    return {
      engineCode: engine.engineCode,
      profileCode,
      methodologyState,
      benchmarkAuthority: authority,
      benchmarkCode: code,
      benchmarkType: benchmarkType(authority),
      implementationSupport,
      identitySupport,
      historySupport,
      missingPrerequisite,
      // Registry authorities can contain both a primary benchmark and optional
      // context. Until that authority is decomposed by an approved adapter, the
      // aggregate dependency must fail closed as blocking rather than guessing
      // that the whole benchmark contract is context-only.
      dependencyMode: "BLOCKING_DERIVED_METRIC",
    }
  }))
}

function buildEligibility(input: ProgramAHoldingInput): ProgramAEligibilityRecord {
  const { coverage } = input
  if (coverage.assetClass.toUpperCase() !== "EQUITY") {
    return {
      securityId: coverage.securityId, symbol: coverage.symbol, assetClass: coverage.assetClass,
      canonicalSector: coverage.classification.sector, canonicalIndustry: coverage.classification.industry,
      researchProfileCode: null, researchSubprofileCode: null, methodologyState: "METHODOLOGY_NOT_AVAILABLE",
      scoringExecutionState: "BLOCKED", eligibilityState: "NOT_APPLICABLE", r3Applicable: false, r5Applicable: false,
      reasonCode: "ASSET_CLASS_NOT_EQUITY", portfolioWeightPercent: input.portfolioWeightPercent,
    }
  }
  const routing = routeResearchProfileV1({
    assetClass: coverage.assetClass,
    applicationSector: coverage.classification.sector,
    applicationIndustry: coverage.classification.industry,
  })
  const resolved = resolveScoringProfile(coverage.classification.sector, coverage.classification.industry, coverage.scoringProfileAssignment?.profileCode ?? null)
  const eligibilityState: ProgramAEligibilityState = resolved.methodologyState === "REVIEW_REQUIRED"
    ? "REVIEW_REQUIRED"
    : resolved.methodologyState === "METHODOLOGY_NOT_AVAILABLE"
      ? "METHODOLOGY_NOT_AVAILABLE"
      : "ELIGIBLE"
  return {
    securityId: coverage.securityId, symbol: coverage.symbol, assetClass: coverage.assetClass,
    canonicalSector: coverage.classification.sector, canonicalIndustry: coverage.classification.industry,
    researchProfileCode: resolved.profileCode, researchSubprofileCode: routing.state === "ROUTED" ? routing.profileCode : null,
    methodologyState: resolved.methodologyState, scoringExecutionState: resolved.scoringExecutionState,
    eligibilityState, r3Applicable: eligibilityState === "ELIGIBLE", r5Applicable: eligibilityState === "ELIGIBLE",
    reasonCode: resolved.reasonCode, portfolioWeightPercent: input.portfolioWeightPercent,
  }
}

function buildR3Rows(input: ProgramAHoldingInput, eligibility: ProgramAEligibilityRecord): readonly R3CoverageRow[] {
  if (!eligibility.r3Applicable || !eligibility.researchProfileCode) return []
  const providedDomains = new Set(input.r3Domains.map((domain) => domain.domain))
  const missingDomains = REQUIRED_R3_DOMAINS.filter((domain) => !providedDomains.has(domain))
  if (missingDomains.length) throw new Error(`R3 domain coverage is incomplete for ${input.coverage.symbol}: ${missingDomains.join(", ")}`)
  if (providedDomains.size !== input.r3Domains.length) throw new Error(`R3 domain coverage contains duplicate domains for ${input.coverage.symbol}.`)
  return input.r3Domains.map((domain) => ({
    securityId: input.coverage.securityId,
    symbol: input.coverage.symbol,
    profileCode: eligibility.researchProfileCode!,
    domain: domain.domain,
    state: !domain.applicable ? "NOT_APPLICABLE" : domain.derivableFromStoredEvidence ? "READY_TO_DERIVE" : domain.state,
    freshUntil: domain.freshUntil,
    authoritySource: domain.authoritySource,
    blockingReason: !domain.applicable ? null : domain.blockingReason,
    estimatedRefreshAction: !domain.applicable || domain.derivableFromStoredEvidence ? null : domain.estimatedRefreshAction,
    projectedProviderCalls: !domain.applicable || domain.derivableFromStoredEvidence ? 0 : domain.projectedProviderCalls,
    sharedCallKey: domain.sharedCallKey ? `${input.coverage.securityId}:${domain.sharedCallKey}` : null,
  }))
}

function buildR5Row(input: ProgramAHoldingInput, eligibility: ProgramAEligibilityRecord, benchmarkInventory: readonly BenchmarkInventoryRow[], asOfDate: string): R5HistoryCoverageRow | null {
  if (!eligibility.r5Applicable || !eligibility.researchProfileCode) return null
  const { marketHistoryCoverage } = input.coverage
  const identityReady = input.marketIdentityState === "VERIFIED"
  const window = identityReady ? planIncrementalHistoryWindow({
    requiredLookbackDays: input.requiredLookbackDays,
    asOfDate,
    earliestStoredCandle: marketHistoryCoverage.firstCandleAt,
    latestStoredCandle: marketHistoryCoverage.latestCandleAt,
    overlapDays: input.overlapDays,
  }) : null
  const benchmark = benchmarkInventory.find((item) => item.engineCode === eligibility.researchProfileCode)
    ?? benchmarkInventory.find((item) => item.profileCode === eligibility.researchProfileCode)
    ?? null
  const available = new Set(input.marketMetricCodes)
  const derivedMetrics = Object.fromEntries(MARKET_METRICS.map((metric) => {
    const benchmarkMetric = metric === "RELATIVE_STRENGTH_12M" || metric === "BENCHMARK_RELATIVE_VOLATILITY_1Y"
    const state: ProgramACoverageState = available.has(metric)
      ? "FRESH"
      : benchmarkMetric && benchmark && !benchmark.historySupport
        ? "MISSING"
        : window?.lookbackSatisfied
          ? "READY_TO_DERIVE"
          : "MISSING"
    return [metric, state]
  })) as unknown as Readonly<Record<MarketMetricCode, ProgramACoverageState>>
  return {
    securityId: input.coverage.securityId,
    symbol: input.coverage.symbol,
    profileCode: eligibility.researchProfileCode,
    identityState: identityReady ? "FRESH" : input.marketIdentityState === "MISSING" ? "MISSING" : input.marketIdentityState,
    earliestStoredCandle: marketHistoryCoverage.firstCandleAt,
    latestStoredCandle: marketHistoryCoverage.latestCandleAt,
    availableHistoryDays: dayDepth(marketHistoryCoverage.firstCandleAt, marketHistoryCoverage.latestCandleAt),
    lookbackSatisfied: window?.lookbackSatisfied ?? false,
    missingWindow: window,
    derivedMetrics,
    benchmarkAuthority: benchmark?.benchmarkAuthority ?? null,
    benchmarkCode: benchmark?.benchmarkCode ?? null,
    benchmarkReadiness: !benchmark ? "NOT_APPLICABLE" : benchmark.historySupport ? "FRESH" : benchmark.methodologyState === "PENDING_METHODOLOGY" ? "NOT_APPLICABLE" : "MISSING",
    blockingReason: !identityReady ? `ANGEL_ONE_IDENTITY_${input.marketIdentityState}` : benchmark?.missingPrerequisite ?? (window?.reasonCode === "HISTORY_CURRENT" ? null : window?.reasonCode ?? null),
  }
}

function projectProviderCost(r3: readonly R3CoverageRow[], r5: readonly R5HistoryCoverageRow[]): ProgramAProviderCostProjection {
  const refreshRows = r3.filter((row) => ["STALE", "MISSING"].includes(row.state) && row.projectedProviderCalls > 0)
  const sharedKeys = new Set(refreshRows.flatMap((row) => row.sharedCallKey ? [row.sharedCallKey] : []))
  const unsharedCalls = refreshRows.filter((row) => row.sharedCallKey === null).reduce((sum, row) => sum + row.projectedProviderCalls, 0)
  const history = r5.filter((row) => (row.missingWindow?.estimatedProviderCalls ?? 0) > 0)
  const benchmarkRequests = new Set(r5.filter((row) => row.benchmarkCode && row.benchmarkReadiness === "MISSING").map((row) => row.benchmarkCode!))
  return {
    providerCalls: 0,
    budgetConsumed: 0,
    trendlyne: {
      holdingsNeedingRefresh: new Set(refreshRows.map((row) => row.securityId)).size,
      domainRefreshes: refreshRows.length,
      estimatedPhysicalCalls: sharedKeys.size + unsharedCalls,
      sharedCallGroups: sharedKeys.size,
    },
    angelOne: {
      holdingsNeedingHistory: history.length,
      fullBackfills: history.filter((row) => row.missingWindow?.mode === "FULL_BACKFILL").length,
      incrementalRefreshes: history.filter((row) => row.missingWindow?.mode === "INCREMENTAL").length,
      estimatedSecurityRequests: history.reduce((sum, row) => sum + (row.missingWindow?.estimatedProviderCalls ?? 0), 0),
      estimatedBenchmarkRequests: benchmarkRequests.size,
    },
  }
}

function proposePilots(eligibility: readonly ProgramAEligibilityRecord[], r3: readonly R3CoverageRow[], r5: readonly R5HistoryCoverageRow[]): ProgramAPilotProposal {
  const ranked = [...eligibility].sort((a, b) => numberOrZero(b.portfolioWeightPercent) - numberOrZero(a.portfolioWeightPercent) || a.symbol.localeCompare(b.symbol))
  const highWeight = ranked.find((row) => row.eligibilityState === "ELIGIBLE")
  const nonPharmaCandidates = ranked.filter((row) => row.eligibilityState === "ELIGIBLE" && row.scoringExecutionState === "PENDING_ADAPTER" && row.researchProfileCode !== "PHARMA_V1")
  const nonPharmaK4 = nonPharmaCandidates.find((row) => row.symbol !== highWeight?.symbol) ?? nonPharmaCandidates[0]
  const blocked = ranked.find((row) => row.eligibilityState === "REVIEW_REQUIRED" || row.eligibilityState === "METHODOLOGY_NOT_AVAILABLE")
  const staleMissing = ranked.find((row) => r3.some((domain) => domain.securityId === row.securityId && (domain.state === "STALE" || domain.state === "MISSING")))
  const partial = r5.find((row) => row.missingWindow?.mode === "INCREMENTAL")
  const backfill = r5.find((row) => row.missingWindow?.mode === "FULL_BACKFILL")
  const benchmark = r5.find((row) => row.benchmarkAuthority && row.benchmarkReadiness !== "NOT_APPLICABLE")
  const marketBlocked = r5.find((row) => row.identityState !== "FRESH" || row.benchmarkReadiness === "MISSING")
  return {
    r3: [
      ...(highWeight ? [{ symbol: highWeight.symbol, criterion: "HIGH_WEIGHT_SUPPORTED" as const }] : []),
      ...(nonPharmaK4 ? [{ symbol: nonPharmaK4.symbol, criterion: "NON_PHARMA_K4" as const }] : []),
      ...(blocked ? [{ symbol: blocked.symbol, criterion: "BLOCKED_OR_REVIEW" as const }] : []),
      ...(staleMissing ? [{ symbol: staleMissing.symbol, criterion: "STALE_OR_MISSING_EVIDENCE" as const }] : []),
    ],
    r5: [
      ...(partial ? [{ symbol: partial.symbol, criterion: "PARTIAL_HISTORY" as const }] : []),
      ...(backfill ? [{ symbol: backfill.symbol, criterion: "LARGER_BACKFILL" as const }] : []),
      ...(benchmark ? [{ symbol: benchmark.symbol, criterion: "BENCHMARK_DEPENDENT" as const }] : []),
      ...(marketBlocked ? [{ symbol: marketBlocked.symbol, criterion: "BLOCKED_IDENTITY_OR_BENCHMARK" as const }] : []),
    ],
  }
}

export function buildProgramAA1Baseline(input: {
  readonly asOfDate: string
  readonly holdings: readonly ProgramAHoldingInput[]
  readonly benchmarkEvidence: readonly BenchmarkRuntimeEvidence[]
}): ProgramAA1Baseline {
  const benchmarkInventory = buildBenchmarkInventory(input.benchmarkEvidence)
  const eligibility = input.holdings.map(buildEligibility)
  const r3Coverage = input.holdings.flatMap((holding, index) => buildR3Rows(holding, eligibility[index]!))
  const r5Coverage = input.holdings.flatMap((holding, index) => {
    const row = buildR5Row(holding, eligibility[index]!, benchmarkInventory, input.asOfDate)
    return row ? [row] : []
  })
  return {
    version: PROGRAM_A_A1_BASELINE_VERSION,
    asOfDate: input.asOfDate,
    eligibility,
    r3Coverage,
    r5Coverage,
    benchmarkInventory,
    projectedProviderCost: projectProviderCost(r3Coverage, r5Coverage),
    pilotProposal: proposePilots(eligibility, r3Coverage, r5Coverage),
    providerCalls: 0,
    budgetConsumed: 0,
  }
}

export const PROGRAM_A_A1_SAFETY_BOUNDARY = {
  providerExecution: false,
  providerBudgetReservation: false,
  providerUsageRecording: false,
  productionMutation: false,
  scorePersistence: false,
  recommendationPersistence: false,
  sizingPersistence: false,
  schedulerActivation: false,
  aiActivation: false,
} as const
