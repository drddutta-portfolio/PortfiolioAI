import { describe, expect, it } from "vitest"
import type { PortfolioCoverageRegistryRecord, PortfolioCoverageRegistryResponse } from "../../data/portfolioCoverageRegistryRepository"
import { materializeProgramAA1CacheBaseline, PROGRAM_A_A1_CACHE_SNAPSHOT_VERSION, renderProgramAA1BaselineReport, type ProgramAA1CacheSnapshot } from "./programAA1CacheMaterializer"

function record(overrides: Partial<PortfolioCoverageRegistryRecord> = {}): PortfolioCoverageRegistryRecord {
  return {
    portfolioId: "portfolio-1", securityId: "security-1", symbol: "INFY", assetClass: "EQUITY", currentQuantity: "2",
    classification: { sector: "Information Technology", industry: "IT Services", marketCapCategory: "LARGE_CAP", enrichmentState: "VERIFIED", freshUntil: "2026-12-01" },
    identityCoverage: { state: "FRESH", sourceCode: "TRENDLYNE", freshUntil: "2026-12-01", nextEligibleRefreshAt: null, estimatedProviderCalls: 0 },
    fundamentalsCoverage: { state: "MISSING", sourceCode: "TRENDLYNE_MCP", freshUntil: null, nextEligibleRefreshAt: null, estimatedProviderCalls: 0, observationCount: 0, selectedDecisionCount: 0, hasConflictingEvidence: false, latestDecisionAt: null },
    ownershipCoverage: { state: "STALE", sourceCode: "TRENDLYNE_MCP", freshUntil: "2026-09-01", nextEligibleRefreshAt: null, estimatedProviderCalls: 0 },
    documentsCoverage: { state: "FRESH", sourceCode: "TRENDLYNE_MCP", freshUntil: "2026-12-01", nextEligibleRefreshAt: null, estimatedProviderCalls: 0, documentCount: 1, latestDocumentAt: "2026-09-01" },
    marketHistoryCoverage: { state: "STALE", sourceCode: "ANGEL_ONE", freshUntil: null, nextEligibleRefreshAt: null, estimatedProviderCalls: 0, candleCount: 250, firstCandleAt: "2025-09-01", latestCandleAt: "2026-09-20", latestRetrievedAt: "2026-09-20" },
    scoringProfileAssignment: null, latestScoreRun: null, latestRecommendationRun: null, sizingPersistenceAvailable: false,
    ...overrides,
  }
}

function snapshot(records: readonly PortfolioCoverageRegistryRecord[]): ProgramAA1CacheSnapshot {
  const registry: PortfolioCoverageRegistryResponse = { registryVersion: "PORTFOLIO_COVERAGE_V1", generatedAt: "2026-09-23T00:00:00Z", providerCalls: 0, budgetConsumed: 0, records }
  return {
    version: PROGRAM_A_A1_CACHE_SNAPSHOT_VERSION, asOfDate: "2026-09-23", registry,
    securityEvidence: records.map((row, index) => ({ securityId: row.securityId, canonicalName: `${row.symbol} Limited`, canonicalIsin: `INE0000000${index + 1}`, classificationIdentityState: "READY", marketIdentityState: "VERIFIED", marketMetricCodes: ["PRICE_MOMENTUM_12M"], externalRatings: { count: 0, state: "MISSING", freshUntil: null }, valuation: { count: 1, state: "FRESH", freshUntil: "2026-12-01" } })),
    externalRatingRuleProfiles: ["BANK_NBFC"], benchmarkEvidence: [],
  }
}

describe("Program A A1.2 cache materializer", () => {
  it("materializes real cache states and shares the current overview call estimate", () => {
    const result = materializeProgramAA1CacheBaseline(snapshot([record()]))
    expect(result.holdings[0]).toMatchObject({ portfolioWeightPercent: null, marketIdentityState: "VERIFIED", marketMetricCodes: ["PRICE_MOMENTUM_12M"], requiredLookbackDays: 365, overlapDays: 5 })
    expect(result.baseline.eligibility[0]).toMatchObject({ researchProfileCode: "IT_TECH", methodologyState: "AVAILABLE", scoringExecutionState: "PENDING_ADAPTER" })
    expect(result.baseline.r3Coverage.find((row) => row.domain === "EXTERNAL_RATINGS")?.state).toBe("NOT_APPLICABLE")
    expect(result.baseline.r3Coverage.find((row) => row.domain === "BUSINESS_DURABILITY")).toMatchObject({ state: "MISSING", projectedProviderCalls: 0 })
    expect(result.baseline.projectedProviderCost.trendlyne).toMatchObject({ domainRefreshes: 2, estimatedPhysicalCalls: 1, sharedCallGroups: 1 })
    expect(result.baseline.r5Coverage[0]?.missingWindow?.mode).toBe("INCREMENTAL")
  })

  it("uses active scoring-rule contracts for ratings applicability and preserves fail-closed routing", () => {
    const bank = record({ securityId: "bank", symbol: "HDFCBANK", classification: { sector: "Banking", industry: "Banks", marketCapCategory: "LARGE_CAP", enrichmentState: "VERIFIED", freshUntil: null } })
    const telecom = record({ securityId: "telco", symbol: "TELCO", classification: { sector: "Telecommunication", industry: "Telecom Services", marketCapCategory: null, enrichmentState: "VERIFIED", freshUntil: null } })
    const result = materializeProgramAA1CacheBaseline(snapshot([bank, telecom]))
    expect(result.baseline.r3Coverage.find((row) => row.symbol === "HDFCBANK" && row.domain === "EXTERNAL_RATINGS")?.state).toBe("MISSING")
    expect(result.baseline.eligibility.find((row) => row.symbol === "TELCO")).toMatchObject({ eligibilityState: "METHODOLOGY_NOT_AVAILABLE", scoringExecutionState: "BLOCKED" })
    expect(result.baseline.r3Coverage.some((row) => row.symbol === "TELCO")).toBe(false)
  })

  it("renders deterministic report sections and safety counters", () => {
    const report = renderProgramAA1BaselineReport(materializeProgramAA1CacheBaseline(snapshot([record()])).baseline)
    expect(report).toContain("## SUMMARY\nTotal holdings: 1\nEligible equities: 1")
    expect(report).toContain("## R3")
    expect(report).toContain("## R5")
    expect(report).toContain("## PILOT PROPOSAL")
    expect(report).toContain("providerCalls = 0\nbudgetConsumed = 0\nwrites = 0")
  })

  it("rejects a registry envelope that is not cache-only", () => {
    const input = snapshot([record()])
    expect(() => materializeProgramAA1CacheBaseline({ ...input, registry: { ...input.registry, providerCalls: 1 as 0 } })).toThrow("cache-only")
  })
})
