import { describe, expect, it } from "vitest"
import type { LedgerTransaction } from "../portfolio/types"
import { calculateFifoAccounting } from "./fifoAccounting"

function tx(id: string, type: "BUY" | "SELL", date: string | null, quantity: string, price: string, overrides: Partial<LedgerTransaction> = {}): LedgerTransaction {
  return { id, portfolioId: "p", securityId: "s", sourceRowId: null, brokerAccountId: "a", transactionType: type,
    transactionDate: date, executedAt: null, quantity, unitPrice: price, charges: "0", taxes: "0", dataQualityStatus: date ? "COMPLETE" : "MISSING_DATE",
    accountingStatus: "ACTIVE", sourceType: "MANUAL", sourceProvider: null, grossAmount: null, netAmount: null, notes: null, importBatchId: null, sourceSequence: null, ...overrides }
}

describe("calculateFifoAccounting", () => {
  it("creates one open lot for a single buy", () => {
    expect(calculateFifoAccounting([tx("b", "BUY", "2026-01-01", "10", "12.5")])).toMatchObject({
      quality: "DETERMINISTIC", remainingQuantity: "10", remainingCostBasis: "125", averageRemainingCost: "12.5", realisedPnl: "0",
    })
  })

  it("consumes multiple lots FIFO and preserves the partial lot", () => {
    const result = calculateFifoAccounting([
      tx("b1", "BUY", "2026-01-01", "10", "10"), tx("b2", "BUY", "2026-02-01", "10", "20"),
      tx("s1", "SELL", "2026-03-01", "15", "30"),
    ])
    expect(result).toMatchObject({ remainingQuantity: "5", remainingCostBasis: "100", realisedCostBasis: "200", realisedProceeds: "450", realisedPnl: "250" })
    expect(result.matches.map((match) => match.quantity)).toEqual(["10", "5"])
  })

  it("supports fractional exact decimals and allocated charges", () => {
    const result = calculateFifoAccounting([
      tx("b", "BUY", "2026-01-01", "0.3", "0.2", { charges: "0.03" }),
      tx("s", "SELL", "2026-02-01", "0.1", "0.5", { charges: "0.01" }),
    ])
    expect(result.remainingCostBasis).toBe("0.06")
    expect(result.realisedPnl).toBe("0.01")
  })

  it("does not fabricate chronology for missing dates", () => {
    expect(calculateFifoAccounting([tx("b", "BUY", null, "10", "10"), tx("s", "SELL", "2026-02-01", "1", "12")])).toMatchObject({ quality: "INCOMPLETE_CHRONOLOGY", remainingCostBasis: null })
  })

  it("rejects an oversell and ambiguous equal timestamps", () => {
    expect(calculateFifoAccounting([tx("b", "BUY", "2026-01-01", "1", "10"), tx("s", "SELL", "2026-02-01", "2", "12")]).quality).toBe("NOT_CALCULABLE")
    expect(calculateFifoAccounting([tx("b1", "BUY", "2026-01-01", "1", "10"), tx("b2", "BUY", "2026-01-01", "1", "11"), tx("s2", "SELL", "2026-02-01", "1", "12")]).quality).toBe("INCOMPLETE_CHRONOLOGY")
  })

  it("marks unknown charges partial without hiding gross FIFO results", () => {
    const result = calculateFifoAccounting([tx("b", "BUY", "2026-01-01", "2", "10", { charges: null })])
    expect(result).toMatchObject({ quality: "PARTIAL_ACCOUNTING", remainingCostBasis: "20" })
  })

  it("is repeatable and calculates a complete closure", () => {
    const input = [tx("b", "BUY", "2026-01-01", "2", "10"), tx("s", "SELL", "2026-02-01", "2", "14")]
    expect(calculateFifoAccounting(input)).toEqual(calculateFifoAccounting(input))
    expect(calculateFifoAccounting(input)).toMatchObject({ remainingQuantity: "0", remainingCostBasis: "0", realisedPnl: "8" })
  })
})
