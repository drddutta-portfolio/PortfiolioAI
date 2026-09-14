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
  it("maps source sector but keeps proposed IT research profile pending", () => {
    const record = projectPortfolioCoverageV1(base())
    expect(record.canonicalSectorCode).toBe("INFORMATION_TECHNOLOGY")
    expect(record.researchProfileCode).toBe("IT_SERVICES_TECH")
    expect(record.researchProfileReadiness).toBe("PROFILE_PENDING")
    expect(record.domains.RESEARCH_PROFILE.state).toBe("BLOCKED_PREREQUISITE")
  })

  it("allows an explicitly ready reviewed research profile to progress to scoring derivation", () => {
    const record = projectPortfolioCoverageV1(base({
      symbol: "HDFCBANK",
      sourceSector: "Banking",
      sourceIndustry: "Private Sector Bank",
      researchProfileCode: "BANK",
      researchProfileVersion: "BANK_V1",
      researchProfileReadiness: "READY",
    }))
    expect(record.canonicalSectorCode).toBe("BANKING_FINANCIAL_SERVICES")
    expect(record.domains.RESEARCH_PROFILE.state).toBe("FRESH")
    expect(record.domains.SCORING.state).toBe("READY_TO_DERIVE")
  })

  it("does not guess an ambiguous source-sector label", () => {
    const record = projectPortfolioCoverageV1(base({ sourceSector: "Services", sourceIndustry: null }))
    expect(record.canonicalSectorCode).toBeNull()
    expect(record.domains.CLASSIFICATION.state).toBe("REVIEW_REQUIRED")
  })

  it("keeps non-equity holdings out of the equity research chain", () => {
    const record = projectPortfolioCoverageV1(base({ assetClass: "ETF", sourceSector: null, sourceIndustry: null }))
    expect(record.domains.RESEARCH_PROFILE.state).toBe("NOT_APPLICABLE")
    expect(record.domains.SCORING.state).toBe("NOT_APPLICABLE")
    expect(record.domains.POSITION_SIZING.state).toBe("NOT_APPLICABLE")
  })
})

describe("summarizePortfolioCoverageV1", () => {
  it("aggregates portfolio counts, sectors and blockers deterministically", () => {
    const records = [
      projectPortfolioCoverageV1(base({ securityId: "a", symbol: "INFY" })),
      projectPortfolioCoverageV1(base({ securityId: "b", symbol: "HDFCBANK", sourceSector: "Banking", sourceIndustry: "Private Sector Bank", researchProfileCode: "BANK", researchProfileVersion: "BANK_V1", researchProfileReadiness: "READY" })),
      projectPortfolioCoverageV1(base({ securityId: "c", symbol: "ETF", assetClass: "ETF", sourceSector: null, sourceIndustry: null })),
    ]
    const summary = summarizePortfolioCoverageV1(records)
    expect(summary.holdings).toBe(3)
    expect(summary.equities).toBe(2)
    expect(summary.nonEquities).toBe(1)
    expect(summary.byCanonicalSector.INFORMATION_TECHNOLOGY).toBe(1)
    expect(summary.byCanonicalSector.BANKING_FINANCIAL_SERVICES).toBe(1)
    expect(summary.byCanonicalSector.UNMAPPED).toBe(1)
  })
})
