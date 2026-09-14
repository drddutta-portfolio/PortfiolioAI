import { describe, expect, it } from "vitest"
import { projectPortfolioCoverageV1, summarizePortfolioCoverageV1, type CachedCoverageSecurityInput } from "./portfolioCoverageProjection"

const source = (state: "FRESH" | "STALE" | "MISSING" = "FRESH") => ({
  state,
  sourceCode: "CACHE",
  freshUntil: null,
  nextEligibleRefreshAt: null,
  estimatedProviderCalls: 0,
}) as const

function base(overrides: Partial<CachedCoverageSecurityInput> = {}): CachedCoverageSecurityInput {
  return {
    portfolioId: "portfolio-1",
    securityId: "security-1",
    symbol: "TEST",
    assetClass: "EQUITY",
    sourceSector: "Information Technology",
    sourceIndustry: "IT Services",
    identityState: "FRESH",
    researchProfileCode: null,
    researchProfileVersion: null,
    researchProfileReadiness: "PROFILE_PENDING",
    fundamentals: source(),
    ownership: source(),
    documents: source(),
    marketHistory: source(),
    scoreRunId: null,
    scoreReadyCoverage: null,
    scoringState: "MISSING",
    recommendationRunId: null,
    recommendationState: "MISSING",
    sizingPersistenceAvailable: false,
    ...overrides,
  }
}

describe("projectPortfolioCoverageV1", () => {
  it("uses the dashboard sector unchanged while keeping proposed IT research profile pending", () => {
    const record = projectPortfolioCoverageV1(base())
    expect(record.applicationSector).toBe("Information Technology")
    expect(record.canonicalSector).toBe("Information Technology")
    expect(record.researchProfileCode).toBe("IT_SERVICES_TECH")
    expect(record.researchProfileReadiness).toBe("PROFILE_PENDING")
    expect(record.domains.RESEARCH_PROFILE.state).toBe("BLOCKED_PREREQUISITE")
  })

  it("allows an explicitly ready reviewed research profile to progress without changing the dashboard sector", () => {
    const record = projectPortfolioCoverageV1(base({
      symbol: "HDFCBANK",
      sourceSector: "Banking",
      sourceIndustry: "Private Sector Bank",
      researchProfileCode: "BANK",
      researchProfileVersion: "BANK_V1",
      researchProfileReadiness: "READY",
    }))
    expect(record.applicationSector).toBe("Banking")
    expect(record.domains.RESEARCH_PROFILE.state).toBe("FRESH")
    expect(record.domains.SCORING.state).toBe("READY_TO_DERIVE")
  })

  it("treats an existing dashboard sector label as classified even when research subtype is unresolved", () => {
    const record = projectPortfolioCoverageV1(base({ sourceSector: "Services", sourceIndustry: null }))
    expect(record.applicationSector).toBe("Services")
    expect(record.domains.CLASSIFICATION.state).toBe("FRESH")
    expect(record.researchProfileReadiness).toBe("PROFILE_PENDING")
  })

  it("keeps non-equity holdings out of the equity research chain", () => {
    const record = projectPortfolioCoverageV1(base({ assetClass: "ETF", sourceSector: null, sourceIndustry: null }))
    expect(record.domains.RESEARCH_PROFILE.state).toBe("NOT_APPLICABLE")
    expect(record.domains.SCORING.state).toBe("NOT_APPLICABLE")
    expect(record.domains.POSITION_SIZING.state).toBe("NOT_APPLICABLE")
  })
})

describe("summarizePortfolioCoverageV1", () => {
  it("aggregates sector counts using the exact shared application labels", () => {
    const records = [
      projectPortfolioCoverageV1(base({ securityId: "a", symbol: "INFY" })),
      projectPortfolioCoverageV1(base({ securityId: "b", symbol: "HDFCBANK", sourceSector: "Banking", sourceIndustry: "Private Sector Bank", researchProfileCode: "BANK", researchProfileVersion: "BANK_V1", researchProfileReadiness: "READY" })),
      projectPortfolioCoverageV1(base({ securityId: "c", symbol: "ETF", assetClass: "ETF", sourceSector: null, sourceIndustry: null })),
    ]
    const summary = summarizePortfolioCoverageV1(records)
    expect(summary.holdings).toBe(3)
    expect(summary.equities).toBe(2)
    expect(summary.nonEquities).toBe(1)
    expect(summary.byApplicationSector["Information Technology"]).toBe(1)
    expect(summary.byApplicationSector.Banking).toBe(1)
    expect(summary.byApplicationSector.UNCLASSIFIED).toBe(1)
  })
})
