import { describe, expect, it } from "vitest"
import { calculatePortfolio } from "./calculatePortfolio"
import type { LedgerTransaction, MarketPrice, PortfolioLedgerSnapshot } from "./types"

function transaction(id: string, securityId: string, overrides: Partial<LedgerTransaction> = {}): LedgerTransaction {
  return {
    id,
    portfolioId: "portfolio-1",
    securityId,
    sourceRowId: null,
    brokerAccountId: "account-1",
    transactionType: "BUY",
    transactionDate: "2026-01-01",
    quantity: "1",
    unitPrice: "10.10",
    charges: null,
    taxes: null,
    dataQualityStatus: "COMPLETE",
    sourceSequence: 1,
    ...overrides,
  }
}

function snapshot(transactions: readonly LedgerTransaction[], securityCount: number, prices: readonly MarketPrice[] = []): PortfolioLedgerSnapshot {
  return {
    portfolio: { id: "portfolio-1", name: "Consolidated Portfolio", currency: "INR" },
    transactions,
    securities: Array.from({ length: securityCount }, (_, index) => ({
      id: `security-${index}`,
      symbol: `STOCK${index}`,
      name: `Stock ${index}`,
      sector: null,
      assetClass: "EQUITY",
    })),
    brokerAccounts: [{ id: "account-1", name: "Primary", brokerName: "Broker" }],
    roles: new Map(),
    prices,
  }
}

describe("calculatePortfolio", () => {
  it("preserves the real import's 477-row structure as 248 open and 22 closed histories", () => {
    const rows: LedgerTransaction[] = []
    for (let index = 0; index < 248; index += 1) rows.push(transaction(`open-${index}`, `security-${index}`))
    for (let index = 0; index < 22; index += 1) {
      const securityId = `security-${248 + index}`
      rows.push(transaction(`closed-buy-${index}`, securityId))
      rows.push(transaction(`closed-sell-${index}`, securityId, { transactionType: "SELL", unitPrice: "11.10" }))
    }
    for (let index = 0; index < 185; index += 1) rows.push(transaction(`extra-${index}`, "security-0"))
    expect(rows).toHaveLength(477)
    const result = calculatePortfolio(snapshot(rows, 270))
    expect(result.totals.openHoldings).toBe(248)
    expect(result.totals.closedHistories).toBe(22)
    expect(result.totals.securityHistories).toBe(270)
  })

  it("uses exact decimals for a complete buy-only cost basis", () => {
    const result = calculatePortfolio(snapshot([
      transaction("a", "security-0", { quantity: "0.1", unitPrice: "0.2" }),
      transaction("b", "security-0", { quantity: "0.2", unitPrice: "0.1" }),
    ], 1))
    expect(result.openPositions).toHaveLength(1)
    expect(result.openPositions[0]!.investedAmount).toBe("0.04")
    expect(result.openPositions[0]!.quantity).toBe("0.3")
  })

  it("does not infer cost basis, broker exposure, prices, or realised P&L", () => {
    const result = calculatePortfolio(snapshot([
      transaction("buy", "security-0", { brokerAccountId: null, transactionDate: null }),
      transaction("sell", "security-0", { transactionType: "SELL", quantity: "0.5", unitPrice: "12" }),
    ], 1))
    expect(result.openPositions).toHaveLength(1)
    const position = result.openPositions[0]!
    expect(position.averageCost).toBeNull()
    expect(position.currentValue).toBeNull()
    expect(position.realisedPnl).toBeNull()
    expect(position.brokerExposure).toBeNull()
    expect(position.hasMissingDates).toBe(true)
  })

  it("calculates valuation and weights using exact decimals", () => {
    const prices: MarketPrice[] = [
      { securityId: "security-0", price: "12.30", currency: "INR", priceTimestamp: "2026-09-07T04:00:00.000Z", retrievedAt: "2026-09-07T04:00:05.000Z", provider: "ANGEL_ONE", marketSessionStatus: "OPEN", isStale: false, staleAfterSeconds: 900 },
      { securityId: "security-1", price: "20", currency: "INR", priceTimestamp: "2026-09-07T04:00:00.000Z", retrievedAt: "2026-09-07T04:00:05.000Z", provider: "ANGEL_ONE", marketSessionStatus: "OPEN", isStale: true, staleAfterSeconds: 900 },
    ]
    const result = calculatePortfolio(snapshot([
      transaction("a", "security-0", { quantity: "2", unitPrice: "10.10" }),
      transaction("b", "security-1", { quantity: "1", unitPrice: "15" }),
    ], 2, prices))
    expect(result.totals.currentValue).toBe("44.6")
    expect(result.totals.unrealisedPnl).toBe("9.4")
    expect(result.openPositions[0]!.portfolioWeightPercent).toBe("55.15695067264573991")
    expect(result.totals.freshPriceCoverage).toBe(1)
    expect(result.totals.stalePriceCoverage).toBe(1)
  })

  it("does not present a partial portfolio total or weights as complete", () => {
    const result = calculatePortfolio(snapshot([
      transaction("a", "security-0"),
      transaction("b", "security-1"),
    ], 2, [{ securityId: "security-0", price: "12", currency: "INR", priceTimestamp: "2026-09-07T04:00:00.000Z", retrievedAt: "2026-09-07T04:00:05.000Z", provider: "ANGEL_ONE", marketSessionStatus: "UNKNOWN", isStale: false, staleAfterSeconds: 900 }]))
    expect(result.totals.currentValue).toBeNull()
    expect(result.openPositions.every((position) => position.portfolioWeightPercent === null)).toBe(true)
    expect(result.quality.holdingsWithMissingPrices).toBe(1)
  })

  it("keeps market valuation available when a partial sale makes cost basis unavailable", () => {
    const result = calculatePortfolio(snapshot([
      transaction("buy", "security-0", { quantity: "10", unitPrice: "100" }),
      transaction("sell", "security-0", { transactionType: "SELL", quantity: "4", unitPrice: "125" }),
    ], 1, [{ securityId: "security-0", price: "150", currency: "INR", priceTimestamp: "2026-09-07T04:00:00.000Z", retrievedAt: "2026-09-07T04:00:05.000Z", provider: "ANGEL_ONE", marketSessionStatus: "UNKNOWN", isStale: false, staleAfterSeconds: 900 }]))

    expect(result.openPositions[0]).toMatchObject({
      quantity: "6",
      currentPrice: "150",
      currentValue: "900",
      portfolioWeightPercent: "100",
      averageCost: null,
      investedAmount: null,
      unrealisedPnl: null,
      unrealisedPnlPercent: null,
      hasMissingPrices: false,
    })
    expect(result.totals.currentValue).toBe("900")
    expect(result.totals.investedCoverage).toBe(0)
    expect(result.totals.unrealisedPnl).toBeNull()
  })
})
