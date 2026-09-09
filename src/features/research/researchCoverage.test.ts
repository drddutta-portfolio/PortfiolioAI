import { afterEach, describe, expect, it, vi } from "vitest"
import type { PortfolioPosition } from "../portfolio/types"
import { buildResearchCoverage } from "./researchCoverage"

const position = (overrides: Partial<PortfolioPosition> = {}) => ({
  securityId: "security-1",
  symbol: "TEST",
  company: "Test Limited",
  sector: "Industrials",
  industry: "Engineering",
  assetClass: "EQUITY",
  exchange: "NSE",
  isin: null,
  instrumentType: "EQ",
  series: null,
  role: "CORE",
  settings: {} as PortfolioPosition["settings"],
  themes: [],
  snapshotEvidence: null,
  quantity: "1",
  totalQuantityAcquired: "1",
  transactionCount: 1,
  averageCost: "100",
  investedAmount: "100",
  currentPrice: "110",
  currentValue: "110",
  unrealisedPnl: "10",
  unrealisedPnlPercent: "10",
  portfolioWeightPercent: "1",
  realisedPnl: "0",
  realisedCostBasis: "0",
  realisedProceeds: "0",
  totalQuantitySold: "0",
  accountingBasis: "FIFO",
  accountingQuality: "FIFO_COMPLETE",
  chargesComplete: true,
  accountingReason: null,
  brokerExposure: [],
  hasMissingDates: false,
  hasMissingBrokers: false,
  hasMissingPrices: false,
  priceTimestamp: null,
  priceRetrievedAt: null,
  priceProvider: "ANGEL_ONE",
  priceSessionStatus: "CLOSED",
  isPriceStale: false,
  costBasisReason: null,
  realisedPnlReason: null,
  ...overrides,
} as PortfolioPosition)

const freshUntil = "2026-10-09T00:00:00.000Z"
const retrievedAt = "2026-09-08T00:00:00.000Z"

afterEach(() => vi.useRealTimers())

describe("buildResearchCoverage", () => {
  it("keeps provider adjusted P/B conflicts visible in overall coverage", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-09T12:00:00.000Z"))
    const rows = buildResearchCoverage([position()], [
      { securityId: "security-1", metricCode: "REVENUE_TTM", evidenceStatus: "AVAILABLE", freshUntil, retrievedAt },
      { securityId: "security-1", metricCode: "SHAREHOLDING_PROMOTER_PERCENT", evidenceStatus: "AVAILABLE", freshUntil, retrievedAt },
      { securityId: "security-1", metricCode: "PBV_ADJUSTED_PROVIDER", evidenceStatus: "CONFLICTING", freshUntil, retrievedAt },
    ], [], [{ securityId: "security-1", evidenceStatus: "MATCHED", createdAt: "2026-09-01T00:00:00.000Z" }], [])
    expect(rows[0]?.valuation).toBe("CONFLICTING")
    expect(rows[0]?.overall).toBe("CONFLICTING")
    expect(rows[0]?.conflictCount).toBe(1)
  })

  it("marks a matched provider identity stale after the cohort planner's 180-day window", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-09T12:00:00.000Z"))
    const rows = buildResearchCoverage([position()], [], [], [{ securityId: "security-1", evidenceStatus: "MATCHED", createdAt: "2026-01-01T00:00:00.000Z" }], [])
    expect(rows[0]?.providerIdentity).toBe("STALE")
  })

  it("surfaces review-required research documents", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-09T12:00:00.000Z"))
    const rows = buildResearchCoverage([position()], [], [{ securityId: "security-1", identityStatus: "REVIEW_REQUIRED", createdAt: retrievedAt }], [], [])
    expect(rows[0]?.documents).toBe("REVIEW_REQUIRED")
    expect(rows[0]?.reviewRequiredCount).toBe(1)
  })

  it("does not treat ETFs as missing Trendlyne equity research", () => {
    const rows = buildResearchCoverage([position({ assetClass: "ETF", role: "ETF" })], [], [], [], [])
    expect(rows[0]?.equityEligible).toBe(false)
    expect(rows[0]?.overall).toBe("NOT_APPLICABLE")
    expect(rows[0]?.fundamentals).toBe("NOT_APPLICABLE")
  })
})
