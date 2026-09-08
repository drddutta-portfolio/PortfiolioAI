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
    executedAt: null,
    quantity: "1",
    unitPrice: "10.10",
    charges: "0",
    taxes: "0",
    dataQualityStatus: "COMPLETE",
    accountingStatus: "ACTIVE",
    sourceType: "MANUAL",
    sourceProvider: null,
    grossAmount: null,
    netAmount: null,
    notes: null,
    importBatchId: null,
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
      industry: null,
      assetClass: "EQUITY",
      exchange: "NSE",
      isin: null,
      instrumentType: "STOCK",
      series: "EQ",
    })),
    brokerAccounts: [{ id: "account-1", name: "Primary", brokerName: "Broker" }],
    roles: new Map(),
    settings: new Map(),
    themes: [],
    themeIdsBySecurity: new Map(),
    snapshotEvidence: new Map(),
    prices,
  }
}

describe("calculatePortfolio", () => {
  it("preserves the current production structure as 249 open and 22 closed histories", () => {
    const rows: LedgerTransaction[] = []
    for (let index = 0; index < 249; index += 1) rows.push(transaction(`open-${index}`, `security-${index}`))
    for (let index = 0; index < 22; index += 1) {
      const securityId = `security-${249 + index}`
      rows.push(transaction(`closed-buy-${index}`, securityId))
      rows.push(transaction(`closed-sell-${index}`, securityId, { transactionType: "SELL", unitPrice: "11.10" }))
    }
    for (let index = 0; index < 185; index += 1) rows.push(transaction(`extra-${index}`, "security-0"))
    expect(rows).toHaveLength(478)
    const result = calculatePortfolio(snapshot(rows, 271))
    expect(result.totals.openHoldings).toBe(249)
    expect(result.totals.closedHistories).toBe(22)
    expect(result.totals.securityHistories).toBe(271)
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

  it("calculates average cost from ledger evidence without inferring broker or prices", () => {
    const result = calculatePortfolio(snapshot([
      transaction("buy", "security-0", { brokerAccountId: null, transactionDate: null }),
      transaction("sell", "security-0", { transactionType: "SELL", quantity: "0.5", unitPrice: "12" }),
    ], 1))
    expect(result.openPositions).toHaveLength(1)
    const position = result.openPositions[0]!
    expect(position.accountingBasis).toBe("AVERAGE_COST")
    expect(position.averageCost).toBe("10.1")
    expect(position.currentValue).toBeNull()
    expect(position.realisedPnl).toBe("0.95")
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

  it("presents a priced subtotal and subset weights without claiming a complete total", () => {
    const result = calculatePortfolio(snapshot([
      transaction("a", "security-0"),
      transaction("b", "security-1"),
    ], 2, [{ securityId: "security-0", price: "12", currency: "INR", priceTimestamp: "2026-09-07T04:00:00.000Z", retrievedAt: "2026-09-07T04:00:05.000Z", provider: "ANGEL_ONE", marketSessionStatus: "UNKNOWN", isStale: false, staleAfterSeconds: 900 }]))
    expect(result.totals.currentValue).toBeNull()
    expect(result.totals.pricedMarketValue).toBe("12")
    expect(result.totals.coveredUnrealisedPnl).toBe("1.9")
    expect(result.totals.unrealisedCoverage).toBe(1)
    expect(result.openPositions[0]!.portfolioWeightPercent).toBe("100")
    expect(result.openPositions[1]!.portfolioWeightPercent).toBeNull()
    expect(result.quality.holdingsWithMissingPrices).toBe(1)
  })

  it("uses average cost for a missing-date partial sale and keeps live P/L available", () => {
    const result = calculatePortfolio(snapshot([
      transaction("buy", "security-0", { quantity: "10", unitPrice: "100" }),
      transaction("sell", "security-0", { transactionType: "SELL", quantity: "4", unitPrice: "125" }),
    ], 1, [{ securityId: "security-0", price: "150", currency: "INR", priceTimestamp: "2026-09-07T04:00:00.000Z", retrievedAt: "2026-09-07T04:00:05.000Z", provider: "ANGEL_ONE", marketSessionStatus: "UNKNOWN", isStale: false, staleAfterSeconds: 900 }]))

    expect(result.openPositions[0]).toMatchObject({
      quantity: "6",
      currentPrice: "150",
      currentValue: "900",
      portfolioWeightPercent: "100",
      accountingBasis: "AVERAGE_COST",
      averageCost: "100",
      investedAmount: "600",
      unrealisedPnl: "300",
      unrealisedPnlPercent: "50",
      hasMissingPrices: false,
    })
    expect(result.totals.currentValue).toBe("900")
    expect(result.totals.investedCoverage).toBe(1)
    expect(result.totals.unrealisedPnl).toBe("300")
  })

  it("preserves historical average acquisition cost and explicit zero quantity for a closed position", () => {
    const result = calculatePortfolio(snapshot([
      transaction("buy", "security-0", { transactionDate: null, quantity: "12", unitPrice: "236" }),
      transaction("sell", "security-0", { transactionType: "SELL", quantity: "12", unitPrice: "200" }),
    ], 1))
    expect(result.closedPositions[0]).toMatchObject({ quantity: "0", totalQuantityAcquired: "12", totalQuantitySold: "12", averageCost: "236", investedAmount: "0", realisedCostBasis: "2832", realisedProceeds: "2400", realisedPnl: "-432", accountingBasis: "AVERAGE_COST" })
  })

  it("keeps explicit OTHER, unclassified, ETF role, and ETF asset class distinct", () => {
    const input = snapshot([transaction("a", "security-0"), transaction("b", "security-1")], 2)
    const result = calculatePortfolio({ ...input,
      securities: [{ ...input.securities[0]!, assetClass: "ETF", instrumentType: "ETF" }, input.securities[1]!],
      roles: new Map([["security-0", "OTHER"]]),
      settings: new Map([["security-0", { id: "setting-1", portfolioRole: "OTHER", targetWeight: null, minimumWeight: null, maximumWeight: null, priority: null, isWatchlisted: false, isFrozen: false, investmentHorizon: null, notes: null }]]),
    })
    expect(result.openPositions[0]).toMatchObject({ assetClass: "ETF", role: "OTHER" })
    expect(result.openPositions[1]).toMatchObject({ assetClass: "EQUITY", role: "UNCLASSIFIED" })
  })

  it("builds deterministic broker analytics and keeps missing attribution separate", () => {
    const input=snapshot([
      transaction("known","security-0",{quantity:"2",unitPrice:"10"}),
      transaction("unknown","security-1",{brokerAccountId:null,quantity:"3",unitPrice:"5"}),
    ],2,[
      { securityId:"security-0",price:"12",currency:"INR",priceTimestamp:null,retrievedAt:"2026-09-08T00:00:00Z",provider:"ANGEL_ONE",marketSessionStatus:"UNKNOWN",isStale:false,staleAfterSeconds:900 },
      { securityId:"security-1",price:"6",currency:"INR",priceTimestamp:null,retrievedAt:"2026-09-08T00:00:00Z",provider:"ANGEL_ONE",marketSessionStatus:"UNKNOWN",isStale:false,staleAfterSeconds:900 },
    ])
    const result=calculatePortfolio(input)
    expect(result.brokerAnalytics).toEqual([
      expect.objectContaining({broker:"Broker · Primary",investedAmount:"20",currentValue:"24",unrealisedPnl:"4",coveredHistories:1,totalHistories:1}),
      expect.objectContaining({broker:"Unknown / Unattributed",investedAmount:"15",currentValue:"18",unrealisedPnl:"3",coveredHistories:1,totalHistories:1}),
    ])
  })
})
