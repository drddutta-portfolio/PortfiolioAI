import { describe, expect, it } from "vitest"
import type { PortfolioCoverageRegistryRecord } from "../../data/portfolioCoverageRegistryRepository"
import { buildBenchmarkInventory, buildProgramAA1Baseline, PROGRAM_A_A1_SAFETY_BOUNDARY, type CanonicalR3DomainInput, type ProgramAHoldingInput } from "./programAA1EvidenceBaseline"
import { K5_CURRENT_PORTFOLIO_ROUTING_ROWS } from "./k5CurrentPortfolioRoutingSnapshot"

function coverage(overrides: Partial<PortfolioCoverageRegistryRecord> & Pick<PortfolioCoverageRegistryRecord, "securityId" | "symbol">): PortfolioCoverageRegistryRecord {
  return {
    portfolioId: "portfolio-1",
    assetClass: "EQUITY",
    currentQuantity: "1",
    classification: { sector: "Information Technology", industry: "IT Services", marketCapCategory: "LARGE_CAP", enrichmentState: "VERIFIED", freshUntil: "2027-01-01" },
    identityCoverage: { state: "FRESH", sourceCode: "TRENDLYNE", freshUntil: "2027-01-01", nextEligibleRefreshAt: null, estimatedProviderCalls: 0 },
    fundamentalsCoverage: { state: "MISSING", sourceCode: "TRENDLYNE", freshUntil: null, nextEligibleRefreshAt: null, estimatedProviderCalls: 1, observationCount: 0, selectedDecisionCount: 0, hasConflictingEvidence: false, latestDecisionAt: null },
    ownershipCoverage: { state: "MISSING", sourceCode: "TRENDLYNE", freshUntil: null, nextEligibleRefreshAt: null, estimatedProviderCalls: 1 },
    documentsCoverage: { state: "MISSING", sourceCode: "TRENDLYNE", freshUntil: null, nextEligibleRefreshAt: null, estimatedProviderCalls: 1, documentCount: 0, latestDocumentAt: null },
    marketHistoryCoverage: { state: "MISSING", sourceCode: "ANGEL_ONE", freshUntil: null, nextEligibleRefreshAt: null, estimatedProviderCalls: 1, candleCount: 0, firstCandleAt: null, latestCandleAt: null, latestRetrievedAt: null },
    scoringProfileAssignment: null,
    latestScoreRun: null,
    latestRecommendationRun: null,
    sizingPersistenceAvailable: false,
    ...overrides,
  }
}

const missingDomains: readonly CanonicalR3DomainInput[] = [
  { domain: "FUNDAMENTALS", applicable: true, state: "MISSING", freshUntil: null, authoritySource: "fundamental_observations", blockingReason: "MANDATORY_FUNDAMENTALS_MISSING", estimatedRefreshAction: "TRENDLYNE_OVERVIEW", projectedProviderCalls: 1, sharedCallKey: "overview" },
  { domain: "OWNERSHIP", applicable: true, state: "STALE", freshUntil: "2026-09-01", authoritySource: "fundamental_observations", blockingReason: "OWNERSHIP_STALE", estimatedRefreshAction: "TRENDLYNE_OVERVIEW", projectedProviderCalls: 1, sharedCallKey: "overview" },
  { domain: "EXTERNAL_RATINGS", applicable: false, state: "MISSING", freshUntil: null, authoritySource: "external_rating_observations", blockingReason: null, estimatedRefreshAction: null, projectedProviderCalls: 0, sharedCallKey: null },
  { domain: "DOCUMENTS", applicable: true, state: "MISSING", freshUntil: null, authoritySource: "research_documents", blockingReason: "OFFICIAL_DOCUMENT_EVIDENCE_MISSING", estimatedRefreshAction: "TRENDLYNE_DOCUMENT_DISCOVERY", projectedProviderCalls: 1, sharedCallKey: "documents" },
  { domain: "VALUATION", applicable: true, state: "FRESH", freshUntil: "2027-01-01", authoritySource: "fundamental_observations", blockingReason: null, estimatedRefreshAction: null, projectedProviderCalls: 0, sharedCallKey: null },
  { domain: "BUSINESS_DURABILITY", applicable: true, state: "FRESH", freshUntil: "2027-01-01", authoritySource: "research_observations", blockingReason: null, estimatedRefreshAction: null, projectedProviderCalls: 0, sharedCallKey: null, derivableFromStoredEvidence: true },
]

function holding(record: PortfolioCoverageRegistryRecord, overrides: Partial<ProgramAHoldingInput> = {}): ProgramAHoldingInput {
  return {
    coverage: record,
    portfolioWeightPercent: "2.5",
    r3Domains: missingDomains,
    marketIdentityState: "VERIFIED",
    marketMetricCodes: [],
    requiredLookbackDays: 365,
    overlapDays: 5,
    ...overrides,
  }
}

describe("Program A A1 portfolio baseline", () => {
  it("assigns an explicit A1 eligibility state to every frozen current-portfolio routing row", () => {
    const result = buildProgramAA1Baseline({
      asOfDate: "2026-09-23",
      benchmarkEvidence: [],
      holdings: K5_CURRENT_PORTFOLIO_ROUTING_ROWS.map((row) => holding(coverage({
        securityId: row.symbol,
        symbol: row.symbol,
        assetClass: row.assetClass,
        classification: { sector: row.sector, industry: row.industry, marketCapCategory: null, enrichmentState: row.sector ? "VERIFIED" : "MISSING", freshUntil: null },
      }))),
    })
    expect(result.eligibility).toHaveLength(K5_CURRENT_PORTFOLIO_ROUTING_ROWS.length)
    expect(result.eligibility.every((row) => ["ELIGIBLE", "NOT_APPLICABLE", "METHODOLOGY_NOT_AVAILABLE", "REVIEW_REQUIRED"].includes(row.eligibilityState))).toBe(true)
  })

  it("preserves post-PKR methodology and scoring-execution states", () => {
    const rows = buildProgramAA1Baseline({
      asOfDate: "2026-09-23",
      benchmarkEvidence: [],
      holdings: [
        holding(coverage({ securityId: "it", symbol: "INFY" })),
        holding(coverage({ securityId: "reviewed-it", symbol: "PERSISTENT", scoringProfileAssignment: { profileCode: "IT_TECH", assignmentStatus: "REVIEWED", assignmentBasis: null, assignedAt: null, reviewedAt: null } })),
        holding(coverage({ securityId: "auto", symbol: "MOTHERSON", classification: { sector: "Automobile and Auto Components", industry: "Auto Components", marketCapCategory: "LARGE_CAP", enrichmentState: "VERIFIED", freshUntil: null } })),
        holding(coverage({ securityId: "bank", symbol: "HDFCBANK", classification: { sector: "Banking", industry: "Banks", marketCapCategory: "LARGE_CAP", enrichmentState: "VERIFIED", freshUntil: null } })),
        holding(coverage({ securityId: "nbfc", symbol: "NBFC", classification: { sector: "Financial Services", industry: "NBFC", marketCapCategory: null, enrichmentState: "VERIFIED", freshUntil: null } })),
        holding(coverage({ securityId: "telecom", symbol: "TELCO", classification: { sector: "Telecommunication", industry: "Telecom Services", marketCapCategory: null, enrichmentState: "VERIFIED", freshUntil: null } })),
        holding(coverage({ securityId: "missing", symbol: "UNKNOWN", classification: { sector: null, industry: null, marketCapCategory: null, enrichmentState: "MISSING", freshUntil: null } })),
        holding(coverage({ securityId: "etf", symbol: "NIFTYBEES", assetClass: "ETF" })),
      ],
    }).eligibility

    expect(rows.find((row) => row.symbol === "INFY")).toMatchObject({ eligibilityState: "ELIGIBLE", methodologyState: "AVAILABLE", scoringExecutionState: "PENDING_ADAPTER", researchProfileCode: "IT_TECH" })
    expect(rows.find((row) => row.symbol === "PERSISTENT")).toMatchObject({ eligibilityState: "ELIGIBLE", scoringExecutionState: "PENDING_ADAPTER", researchProfileCode: "IT_TECH" })
    expect(rows.find((row) => row.symbol === "MOTHERSON")).toMatchObject({ eligibilityState: "ELIGIBLE", scoringExecutionState: "PENDING_ADAPTER", researchProfileCode: "AUTO_COMPONENTS" })
    expect(rows.find((row) => row.symbol === "HDFCBANK")).toMatchObject({ eligibilityState: "ELIGIBLE", scoringExecutionState: "AVAILABLE", researchProfileCode: "BANK_NBFC" })
    expect(rows.find((row) => row.symbol === "NBFC")).toMatchObject({ eligibilityState: "METHODOLOGY_NOT_AVAILABLE", scoringExecutionState: "BLOCKED" })
    expect(rows.find((row) => row.symbol === "TELCO")).toMatchObject({ eligibilityState: "METHODOLOGY_NOT_AVAILABLE", scoringExecutionState: "BLOCKED" })
    expect(rows.find((row) => row.symbol === "UNKNOWN")).toMatchObject({ eligibilityState: "REVIEW_REQUIRED", scoringExecutionState: "BLOCKED" })
    expect(rows.find((row) => row.symbol === "NIFTYBEES")).toMatchObject({ eligibilityState: "NOT_APPLICABLE", r3Applicable: false, r5Applicable: false })
  })

  it("builds deterministic R3/R5 matrices, shared-call estimates, and bounded data-derived pilots", () => {
    const partial = coverage({ securityId: "it", symbol: "INFY", marketHistoryCoverage: { state: "STALE", sourceCode: "ANGEL_ONE", freshUntil: null, nextEligibleRefreshAt: null, estimatedProviderCalls: 1, candleCount: 250, firstCandleAt: "2025-09-01", latestCandleAt: "2026-09-18", latestRetrievedAt: "2026-09-18" } })
    const full = coverage({ securityId: "auto", symbol: "MOTHERSON", classification: { sector: "Automobile and Auto Components", industry: "Auto Components", marketCapCategory: "LARGE_CAP", enrichmentState: "VERIFIED", freshUntil: null } })
    const blocked = coverage({ securityId: "blocked", symbol: "TELCO", classification: { sector: "Telecommunication", industry: "Telecom Services", marketCapCategory: null, enrichmentState: "VERIFIED", freshUntil: null } })
    const result = buildProgramAA1Baseline({
      asOfDate: "2026-09-23",
      benchmarkEvidence: [],
      holdings: [holding(partial, { portfolioWeightPercent: "8" }), holding(full), holding(blocked)],
    })

    expect(result.r3Coverage.find((row) => row.symbol === "INFY" && row.domain === "EXTERNAL_RATINGS")?.state).toBe("NOT_APPLICABLE")
    expect(result.r3Coverage.find((row) => row.symbol === "INFY" && row.domain === "BUSINESS_DURABILITY")?.state).toBe("READY_TO_DERIVE")
    expect(result.r5Coverage.find((row) => row.symbol === "INFY")?.missingWindow?.mode).toBe("INCREMENTAL")
    expect(result.r5Coverage.find((row) => row.symbol === "MOTHERSON")?.missingWindow?.mode).toBe("FULL_BACKFILL")
    expect(result.projectedProviderCost.trendlyne).toMatchObject({ holdingsNeedingRefresh: 2, domainRefreshes: 6, estimatedPhysicalCalls: 4, sharedCallGroups: 4 })
    expect(result.projectedProviderCost.angelOne).toMatchObject({ holdingsNeedingHistory: 2, fullBackfills: 1, incrementalRefreshes: 1, estimatedSecurityRequests: 2 })
    expect(result.providerCalls).toBe(0)
    expect(result.budgetConsumed).toBe(0)
    expect(result.pilotProposal.r3.map((row) => row.symbol)).toContain("TELCO")
    expect(result.pilotProposal.r5.map((row) => row.symbol)).toEqual(expect.arrayContaining(["INFY", "MOTHERSON"]))
  })

  it("never authorizes provider or persistence actions", () => {
    expect(Object.values(PROGRAM_A_A1_SAFETY_BOUNDARY).every((value) => value === false)).toBe(true)
  })
})

describe("Program A A1 benchmark inventory", () => {
  it("reports existing BANK and Pharma support without fabricating K4 mappings", () => {
    const inventory = buildBenchmarkInventory([
      { benchmarkCode: "NIFTY_BANK", identityState: "VERIFIED", earliestStoredCandle: "2025-01-01", latestStoredCandle: "2026-09-23" },
      { benchmarkCode: "NIFTY_PHARMA", identityState: "VERIFIED", earliestStoredCandle: null, latestStoredCandle: null },
    ])
    expect(inventory.find((row) => row.profileCode === "BANK")).toMatchObject({ benchmarkAuthority: "NIFTY_BANK", benchmarkCode: "NIFTY_BANK", identitySupport: true, historySupport: true })
    expect(inventory.find((row) => row.profileCode === "PHARMA")).toMatchObject({ benchmarkCode: "NIFTY_PHARMA", identitySupport: true, historySupport: false, missingPrerequisite: "BENCHMARK_HISTORY_MISSING" })
    expect(inventory.find((row) => row.profileCode === "IT_SERVICES")).toMatchObject({ benchmarkAuthority: "NIFTY_IT", benchmarkCode: null, implementationSupport: false, missingPrerequisite: "BENCHMARK_ADAPTER_NOT_IMPLEMENTED" })
    expect(inventory.find((row) => row.profileCode === "NBFC_LENDING")).toMatchObject({ methodologyState: "PENDING_METHODOLOGY", missingPrerequisite: "PROFILE_METHODOLOGY_PENDING" })
  })
})
