import type { PortfolioCoverageRegistryResponse, PortfolioCoverageSourceState } from "../../data/portfolioCoverageRegistryRepository"
import { resolveScoringProfile } from "./scoringProfileResolution"
import {
  buildProgramAA1Baseline,
  type BenchmarkRuntimeEvidence,
  type CanonicalR3DomainInput,
  type MarketMetricCode,
  type ProgramAA1Baseline,
  type ProgramACoverageState,
  type ProgramAHoldingInput,
} from "./programAA1EvidenceBaseline"

export const PROGRAM_A_A1_CACHE_SNAPSHOT_VERSION = "PROGRAM_A_A1_CACHE_SNAPSHOT_V1" as const

export interface ProgramACacheSecurityEvidence {
  readonly securityId: string
  readonly canonicalIsin: string | null
  readonly classificationIdentityState: "READY" | "MISSING"
  readonly marketIdentityState: "VERIFIED" | "MISSING" | "CONFLICTING" | "REVIEW_REQUIRED"
  readonly marketMetricCodes: readonly MarketMetricCode[]
  readonly externalRatings: {
    readonly count: number
    readonly state: "FRESH" | "STALE" | "MISSING" | "CONFLICTING" | "REVIEW_REQUIRED"
    readonly freshUntil: string | null
  }
  readonly valuation: {
    readonly count: number
    readonly state: "FRESH" | "STALE" | "MISSING" | "CONFLICTING" | "REVIEW_REQUIRED"
    readonly freshUntil: string | null
  }
}

export interface ProgramAA1CacheSnapshot {
  readonly version: typeof PROGRAM_A_A1_CACHE_SNAPSHOT_VERSION
  readonly asOfDate: string
  readonly registry: PortfolioCoverageRegistryResponse
  readonly securityEvidence: readonly ProgramACacheSecurityEvidence[]
  readonly externalRatingRuleProfiles: readonly string[]
  readonly benchmarkEvidence: readonly BenchmarkRuntimeEvidence[]
}

export interface ProgramAA1MaterializedResult {
  readonly holdings: readonly ProgramAHoldingInput[]
  readonly classificationIdentities: readonly {
    readonly securityId: string
    readonly canonicalIsin: string | null
    readonly state: "READY" | "MISSING"
  }[]
  readonly benchmarkEvidence: readonly BenchmarkRuntimeEvidence[]
  readonly baseline: ProgramAA1Baseline
}

function coverageState(source: PortfolioCoverageSourceState): Exclude<ProgramACoverageState, "NOT_APPLICABLE" | "READY_TO_DERIVE"> {
  return ["FRESH", "STALE", "MISSING", "CONFLICTING", "REVIEW_REQUIRED"].includes(source.state)
    ? source.state as Exclude<ProgramACoverageState, "NOT_APPLICABLE" | "READY_TO_DERIVE">
    : "REVIEW_REQUIRED"
}

function refreshDomain(
  domain: CanonicalR3DomainInput["domain"],
  source: PortfolioCoverageSourceState,
  authoritySource: string,
  action: string,
  sharedCallKey: string,
): CanonicalR3DomainInput {
  const state = coverageState(source)
  const needsRefresh = state === "MISSING" || state === "STALE"
  return {
    domain,
    applicable: true,
    state,
    freshUntil: source.freshUntil,
    authoritySource,
    blockingReason: state === "FRESH" ? null : `${domain}_${state}`,
    estimatedRefreshAction: needsRefresh ? action : null,
    projectedProviderCalls: needsRefresh ? 1 : 0,
    sharedCallKey: needsRefresh ? sharedCallKey : null,
  }
}

function materializeDomains(
  coverage: ProgramAA1CacheSnapshot["registry"]["records"][number],
  evidence: ProgramACacheSecurityEvidence,
  externalRatingRuleProfiles: ReadonlySet<string>,
): readonly CanonicalR3DomainInput[] {
  const resolved = resolveScoringProfile(
    coverage.classification.sector,
    coverage.classification.industry,
    coverage.scoringProfileAssignment?.profileCode ?? null,
  )
  const ratingApplicable = resolved.ruleProfile !== null && externalRatingRuleProfiles.has(resolved.ruleProfile)
  return [
    refreshDomain("FUNDAMENTALS", coverage.fundamentalsCoverage, "portfolio_coverage_registry/fundamental_observations", "TRENDLYNE_OVERVIEW", "TRENDLYNE_OVERVIEW"),
    refreshDomain("OWNERSHIP", coverage.ownershipCoverage, "portfolio_coverage_registry/security_refresh_states", "TRENDLYNE_OVERVIEW", "TRENDLYNE_OVERVIEW"),
    {
      domain: "EXTERNAL_RATINGS", applicable: ratingApplicable, state: evidence.externalRatings.state,
      freshUntil: evidence.externalRatings.freshUntil, authoritySource: "external_rating_observations",
      blockingReason: ratingApplicable && evidence.externalRatings.state !== "FRESH" ? `EXTERNAL_RATINGS_${evidence.externalRatings.state}` : null,
      // No provider adapter is authorized for this evidence domain in Program A A1.
      estimatedRefreshAction: null, projectedProviderCalls: 0, sharedCallKey: null,
    },
    refreshDomain("DOCUMENTS", coverage.documentsCoverage, "portfolio_coverage_registry/research_documents", "TRENDLYNE_DOCUMENT_DISCOVERY", "TRENDLYNE_DOCUMENT_DISCOVERY"),
    {
      domain: "VALUATION", applicable: true, state: evidence.valuation.state,
      freshUntil: evidence.valuation.freshUntil, authoritySource: "fundamental_observations/approved_valuation_metric_codes",
      blockingReason: evidence.valuation.state === "FRESH" ? null : `VALUATION_${evidence.valuation.state}`,
      estimatedRefreshAction: evidence.valuation.state === "MISSING" || evidence.valuation.state === "STALE" ? "TRENDLYNE_OVERVIEW" : null,
      projectedProviderCalls: evidence.valuation.state === "MISSING" || evidence.valuation.state === "STALE" ? 1 : 0,
      sharedCallKey: evidence.valuation.state === "MISSING" || evidence.valuation.state === "STALE" ? "TRENDLYNE_OVERVIEW" : null,
    },
    {
      domain: "BUSINESS_DURABILITY", applicable: true, state: "MISSING", freshUntil: null,
      authoritySource: "sector_profile_contract/no_canonical_materialization",
      blockingReason: "BUSINESS_DURABILITY_NOT_CANONICALLY_MATERIALIZED",
      estimatedRefreshAction: null, projectedProviderCalls: 0, sharedCallKey: null,
    },
  ]
}

export function materializeProgramAA1CacheBaseline(snapshot: ProgramAA1CacheSnapshot): ProgramAA1MaterializedResult {
  if (snapshot.version !== PROGRAM_A_A1_CACHE_SNAPSHOT_VERSION) throw new Error("Unsupported Program A A1 cache snapshot version.")
  if (snapshot.registry.providerCalls !== 0 || snapshot.registry.budgetConsumed !== 0) throw new Error("Program A A1 accepts cache-only registry evidence.")
  const evidenceBySecurity = new Map(snapshot.securityEvidence.map((row) => [row.securityId, row]))
  const ratingProfiles = new Set(snapshot.externalRatingRuleProfiles)
  const holdings = snapshot.registry.records.map((coverage): ProgramAHoldingInput => {
    const evidence = evidenceBySecurity.get(coverage.securityId)
    if (!evidence) throw new Error(`Cache evidence is missing for ${coverage.symbol}.`)
    return {
      coverage,
      // Portfolio value remains owned by the client canonical portfolio read model.
      // The local database snapshot has no authoritative persisted weight fact.
      portfolioWeightPercent: null,
      r3Domains: materializeDomains(coverage, evidence, ratingProfiles),
      marketIdentityState: evidence.marketIdentityState,
      marketMetricCodes: evidence.marketMetricCodes,
      requiredLookbackDays: 365,
      overlapDays: 5,
    }
  })
  const benchmarkEvidence = [...snapshot.benchmarkEvidence].sort((a, b) => a.benchmarkCode.localeCompare(b.benchmarkCode))
  const classificationIdentities = snapshot.securityEvidence
    .map((evidence) => ({ securityId: evidence.securityId, canonicalIsin: evidence.canonicalIsin, state: evidence.classificationIdentityState }))
    .sort((a, b) => a.securityId.localeCompare(b.securityId))
  const baseline = buildProgramAA1Baseline({ asOfDate: snapshot.asOfDate, holdings, benchmarkEvidence })
  return { holdings, classificationIdentities, benchmarkEvidence, baseline }
}

export function renderProgramAA1BaselineReport(baseline: ProgramAA1Baseline): string {
  const eligibilityCount = (state: ProgramAA1Baseline["eligibility"][number]["eligibilityState"]) => baseline.eligibility.filter((row) => row.eligibilityState === state).length
  const r3States = [...new Set(baseline.r3Coverage.map((row) => row.state))].sort().map((state) => `${state}=${baseline.r3Coverage.filter((row) => row.state === state).length}`).join(", ") || "none"
  const refreshHoldings = new Set(baseline.r3Coverage.filter((row) => row.projectedProviderCalls > 0).map((row) => row.securityId)).size
  const r3Blockers = baseline.r3Coverage.filter((row) => row.state === "CONFLICTING" || row.state === "REVIEW_REQUIRED").length
  const identityReady = baseline.r5Coverage.filter((row) => row.identityState === "FRESH").length
  const full = baseline.r5Coverage.filter((row) => row.missingWindow?.mode === "FULL_BACKFILL").length
  const incremental = baseline.r5Coverage.filter((row) => row.missingWindow?.mode === "INCREMENTAL").length
  const current = baseline.r5Coverage.filter((row) => row.missingWindow?.mode === "NONE").length
  const blockedIdentity = baseline.r5Coverage.filter((row) => row.identityState !== "FRESH").length
  const benchmarkBlockers = baseline.r5Coverage.filter((row) => row.benchmarkReadiness === "MISSING").length
  const pilotLines = (rows: readonly { readonly symbol: string; readonly criterion: string }[]) => rows.length ? rows.map((row) => `${row.symbol} (${row.criterion})`).join(", ") : "none"
  return [
    "# Program A A1 real cache-only baseline", `As of: ${baseline.asOfDate}`, "",
    "## SUMMARY", `Total holdings: ${baseline.eligibility.length}`, `Eligible equities: ${eligibilityCount("ELIGIBLE")}`,
    `Not applicable: ${eligibilityCount("NOT_APPLICABLE")}`, `Methodology unavailable: ${eligibilityCount("METHODOLOGY_NOT_AVAILABLE")}`, `Review required: ${eligibilityCount("REVIEW_REQUIRED")}`, "",
    "## R3", `Domain states: ${r3States}`, `Holdings requiring refresh: ${refreshHoldings}`, `Conflicts/review blockers: ${r3Blockers}`,
    `Projected Trendlyne physical calls: ${baseline.projectedProviderCost.trendlyne.estimatedPhysicalCalls}`, "",
    "## R5", `Identity-ready holdings: ${identityReady}`, `Full backfills: ${full}`, `Incremental refreshes: ${incremental}`, `Already-current history: ${current}`,
    `Blocked identities: ${blockedIdentity}`, `Benchmark blockers: ${benchmarkBlockers}`, `Projected Angel One security requests: ${baseline.projectedProviderCost.angelOne.estimatedSecurityRequests}`,
    `Projected benchmark requests: ${baseline.projectedProviderCost.angelOne.estimatedBenchmarkRequests}`, "",
    "## PILOT PROPOSAL", `R3: ${pilotLines(baseline.pilotProposal.r3)}`, `R5: ${pilotLines(baseline.pilotProposal.r5)}`, "",
    "## SAFETY", `providerCalls = ${baseline.providerCalls}`, `budgetConsumed = ${baseline.budgetConsumed}`, "writes = 0",
  ].join("\n")
}
