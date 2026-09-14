import { describe, expect, it } from "vitest"
import {
  buildPortfolioCoverageRecordV1,
  PORTFOLIO_COVERAGE_REGISTRY_VERSION,
  type PortfolioCoverageInput,
  type SourceCoverageInput,
} from "./portfolioCoverageRegistry"

function source(state: SourceCoverageInput["state"] = "FRESH", estimatedProviderCalls = 0): SourceCoverageInput {
  return {
    state,
    sourceCode: "TRENDLYNE_MCP",
    freshUntil: state === "FRESH" ? "2026-09-20T00:00:00Z" : null,
    nextEligibleRefreshAt: null,
    estimatedProviderCalls,
  }
}

function baseInput(overrides: Partial<PortfolioCoverageInput> = {}): PortfolioCoverageInput {
  const input: PortfolioCoverageInput = {
    portfolioId: "portfolio-1",
    securityId: "security-1",
    symbol: "HDFCBANK",
    assetClass: "EQUITY",
    canonicalSector: "Financial Services",
    canonicalIndustry: "Private Sector Bank",
    identityState: "FRESH",
    classificationState: "FRESH",
    researchProfileCode: "BANK",
    researchProfileVersion: "BANK_V1",
    researchProfileReadiness: "READY",
    fundamentals: source("FRESH"),
    ownership: source("FRESH"),
    documents: source("FRESH"),
    marketHistory: { ...source("FRESH"), sourceCode: "ANGEL_ONE" },
    scoreRunId: "score-1",
    scoreReadyCoverage: "0.88",
    scoringState: "READY",
    recommendationRunId: "recommendation-1",
    recommendationState: "READY",
    sizingPersistenceAvailable: false,
  }

  return {
    ...input,
    ...overrides,
    fundamentals: overrides.fundamentals ?? input.fundamentals,
    ownership: overrides.ownership ?? input.ownership,
    documents: overrides.documents ?? input.documents,
    marketHistory: overrides.marketHistory ?? input.marketHistory,
  }
}

describe("buildPortfolioCoverageRecordV1", () => {
  it("shows the HDFCBANK reference path as research/scoring/recommendation ready and sizing ready to derive", () => {
    const result = buildPortfolioCoverageRecordV1(baseInput())

    expect(result.registryVersion).toBe(PORTFOLIO_COVERAGE_REGISTRY_VERSION)
    expect(result.domains.RESEARCH_PROFILE.state).toBe("FRESH")
    expect(result.domains.SCORING.state).toBe("FRESH")
    expect(result.domains.RECOMMENDATION.state).toBe("FRESH")
    expect(result.domains.POSITION_SIZING.state).toBe("READY_TO_DERIVE")
    expect(result.domains.POSITION_SIZING.blockers).toEqual(["SIZING_PERSISTENCE_NOT_AVAILABLE"])
    expect(result.firstBlockingDomain).toBe("CORE_HEALTH")
  })

  it("blocks a real equity when its research profile has not been approved", () => {
    const result = buildPortfolioCoverageRecordV1(baseInput({
      symbol: "INFY",
      securityId: "security-infy",
      canonicalSector: "Information Technology",
      canonicalIndustry: "IT Services",
      researchProfileCode: "IT_SERVICES",
      researchProfileVersion: "IT_SERVICES_V1",
      researchProfileReadiness: "PROFILE_PENDING",
      scoreRunId: null,
      scoringState: "MISSING",
      recommendationRunId: null,
      recommendationState: "MISSING",
    }))

    expect(result.domains.RESEARCH_PROFILE.state).toBe("BLOCKED_PREREQUISITE")
    expect(result.domains.RESEARCH_PROFILE.blockers).toContain("RESEARCH_PROFILE_NOT_READY")
    expect(result.domains.SCORING.state).toBe("BLOCKED_PREREQUISITE")
    expect(result.domains.RECOMMENDATION.state).toBe("BLOCKED_PREREQUISITE")
    expect(result.domains.POSITION_SIZING.state).toBe("BLOCKED_PREREQUISITE")
    expect(result.firstBlockingDomain).toBe("RESEARCH_PROFILE")
  })

  it("identifies stale and missing research domains and sums projected provider-call cost without making calls", () => {
    const result = buildPortfolioCoverageRecordV1(baseInput({
      fundamentals: source("STALE", 1),
      ownership: source("MISSING", 1),
      documents: source("MISSING", 2),
      scoreRunId: null,
      scoringState: "MISSING",
      recommendationRunId: null,
      recommendationState: "MISSING",
    }))

    expect(result.domains.FUNDAMENTALS.state).toBe("STALE")
    expect(result.domains.FUNDAMENTALS.blockers).toEqual(["FUNDAMENTALS_STALE"])
    expect(result.domains.OWNERSHIP.blockers).toEqual(["OWNERSHIP_MISSING"])
    expect(result.domains.DOCUMENTS.blockers).toEqual(["DOCUMENTS_MISSING"])
    expect(result.totalEstimatedProviderCalls).toBe(4)
    expect(result.domains.SCORING.state).toBe("BLOCKED_PREREQUISITE")
  })

  it("makes an unresolved identity the earliest blocker instead of guessing through it", () => {
    const result = buildPortfolioCoverageRecordV1(baseInput({
      identityState: "REVIEW_REQUIRED",
      researchProfileCode: null,
      researchProfileVersion: null,
      researchProfileReadiness: "PROFILE_PENDING",
    }))

    expect(result.domains.IDENTITY.state).toBe("REVIEW_REQUIRED")
    expect(result.domains.IDENTITY.blockers).toEqual(["IDENTITY_REVIEW_REQUIRED"])
    expect(result.domains.RESEARCH_PROFILE.state).toBe("BLOCKED_PREREQUISITE")
    expect(result.firstBlockingDomain).toBe("IDENTITY")
  })

  it("marks ETF research/scoring/recommendation/sizing paths not applicable", () => {
    const result = buildPortfolioCoverageRecordV1(baseInput({
      symbol: "ETF1",
      securityId: "security-etf",
      assetClass: "ETF",
      canonicalSector: null,
      canonicalIndustry: null,
      classificationState: "MISSING",
      researchProfileCode: null,
      researchProfileVersion: null,
      researchProfileReadiness: "NOT_APPLICABLE",
      scoreRunId: null,
      scoringState: "MISSING",
      recommendationRunId: null,
      recommendationState: "MISSING",
    }))

    expect(result.domains.RESEARCH_PROFILE.state).toBe("NOT_APPLICABLE")
    expect(result.domains.FUNDAMENTALS.state).toBe("NOT_APPLICABLE")
    expect(result.domains.SCORING.state).toBe("NOT_APPLICABLE")
    expect(result.domains.RECOMMENDATION.state).toBe("NOT_APPLICABLE")
    expect(result.domains.POSITION_SIZING.state).toBe("NOT_APPLICABLE")
  })

  it("marks scoring ready to derive when research prerequisites are ready but no score run exists", () => {
    const result = buildPortfolioCoverageRecordV1(baseInput({
      scoreRunId: null,
      scoringState: "MISSING",
      recommendationRunId: null,
      recommendationState: "MISSING",
    }))

    expect(result.domains.SCORING.state).toBe("READY_TO_DERIVE")
    expect(result.domains.SCORING.blockers).toEqual(["SCORING_MISSING"])
    expect(result.domains.RECOMMENDATION.state).toBe("BLOCKED_PREREQUISITE")
    expect(result.domains.POSITION_SIZING.state).toBe("BLOCKED_PREREQUISITE")
  })
})
