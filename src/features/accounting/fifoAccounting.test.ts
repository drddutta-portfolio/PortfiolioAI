import { describe, expect, it } from "vitest"
import type { LedgerTransaction } from "../portfolio/types"
import { calculateAccounting } from "./fifoAccounting"

function tx(id: string, type: "BUY" | "SELL", date: string | null, quantity: string, price: string, overrides: Partial<LedgerTransaction> = {}): LedgerTransaction {
  return { id, portfolioId: "p", securityId: "s", sourceRowId: null, brokerAccountId: "a", transactionType: type,
    transactionDate: date, executedAt: null, quantity, unitPrice: price, charges: "0", taxes: "0", dataQualityStatus: date ? "COMPLETE" : "MISSING_DATE",
    accountingStatus: "ACTIVE", sourceType: "MANUAL", sourceProvider: null, grossAmount: null, netAmount: null, notes: null, importBatchId: null, sourceSequence: null, ...overrides }
}

describe("calculateAccounting", () => {
  it("A: calculates a single buy", () => {
    expect(calculateAccounting([tx("b", "BUY", "2026-01-01", "10", "12.5")])).toMatchObject({
      basis: "FIFO", quality: "FIFO_COMPLETE", remainingQuantity: "10", remainingCostBasis: "125", averageRemainingCost: "12.5", realisedPnl: "0",
    })
  })

  it("B/C: consumes multiple lots FIFO for a partial sale", () => {
    const result = calculateAccounting([tx("b1", "BUY", "2026-01-01", "10", "10"), tx("b2", "BUY", "2026-02-01", "10", "20"), tx("s1", "SELL", "2026-03-01", "15", "30")])
    expect(result).toMatchObject({ basis: "FIFO", remainingQuantity: "5", remainingCostBasis: "100", realisedCostBasis: "200", realisedProceeds: "450", realisedPnl: "250" })
    expect(result.matches.map((match) => match.quantity)).toEqual(["10", "5"])
  })

  it("D/Q: calculates a fully sold closed history", () => {
    expect(calculateAccounting([tx("b", "BUY", "2026-01-01", "2", "10"), tx("s", "SELL", "2026-02-01", "2", "14")])).toMatchObject({ remainingQuantity: "0", remainingCostBasis: "0", averageRemainingCost: null, historicalAverageAcquisitionCost: "10", totalQuantityAcquired: "2", realisedPnl: "8" })
  })

  it("keeps historical average cost for an average-cost closed history", () => {
    expect(calculateAccounting([tx("b", "BUY", null, "12", "236"), tx("s", "SELL", "2026-02-01", "12", "200")])).toMatchObject({ basis: "AVERAGE_COST", remainingQuantity: "0", remainingCostBasis: "0", historicalAverageAcquisitionCost: "236", totalQuantityAcquired: "12", realisedCostBasis: "2832", realisedProceeds: "2400", realisedPnl: "-432" })
  })

  it("E: calculates buy, partial sell, then buy again with FIFO", () => {
    expect(calculateAccounting([tx("b1", "BUY", "2026-01-01", "10", "10"), tx("s1", "SELL", "2026-02-01", "4", "15"), tx("b2", "BUY", "2026-03-01", "4", "20")])).toMatchObject({ remainingQuantity: "10", remainingCostBasis: "140", realisedCostBasis: "40", realisedPnl: "20" })
  })

  it("starts a reopened FIFO position from new open lots while retaining prior realised history", () => {
    const result = calculateAccounting([tx("old-buy", "BUY", "2025-01-01", "5", "100"), tx("old-sell", "SELL", "2025-02-01", "5", "120"), tx("new-buy", "BUY", "2026-01-01", "3", "200")])
    expect(result).toMatchObject({ basis: "FIFO", remainingQuantity: "3", remainingCostBasis: "600", averageRemainingCost: "200", realisedCostBasis: "500", realisedProceeds: "600", realisedPnl: "100" })
    expect(result.openLots).toEqual([expect.objectContaining({ transactionId: "new-buy", remainingQuantity: "3", remainingCostBasis: "600" })])
  })

  it("F/G: handles multiple interleaved partial sells", () => {
    expect(calculateAccounting([tx("b1", "BUY", "2026-01-01", "10", "10"), tx("s1", "SELL", "2026-02-01", "3", "15"), tx("b2", "BUY", "2026-03-01", "5", "20"), tx("s2", "SELL", "2026-04-01", "6", "25")])).toMatchObject({ remainingQuantity: "6", remainingCostBasis: "110", realisedCostBasis: "90", realisedProceeds: "195", realisedPnl: "105" })
  })

  it("H: uses order-independent average cost for an imported missing-date history", () => {
    const result = calculateAccounting([tx("b1", "BUY", null, "20", "300", { sourceType: "PORTFOLIO_HISTORICAL_XLSX" }), tx("b2", "BUY", "2025-01-01", "20", "349.42", { sourceType: "PORTFOLIO_HISTORICAL_XLSX" }), tx("s", "SELL", "2025-02-01", "5", "409.51", { sourceType: "PORTFOLIO_HISTORICAL_XLSX" })])
    expect(result).toMatchObject({ basis: "AVERAGE_COST", quality: "AVERAGE_COST_INCOMPLETE_CHRONOLOGY", remainingQuantity: "35", averageRemainingCost: "324.71", remainingCostBasis: "11364.85", realisedCostBasis: "1623.55", realisedProceeds: "2047.55", realisedPnl: "424" })
    expect(result.openLots).toEqual([])
    expect(result.matches).toEqual([])
  })

  it("reconciles CPPLUS and ETERNAL independently from imported snapshot formulas", () => {
    const cpplus = calculateAccounting([tx("cp-b1", "BUY", null, "2", "3419"), tx("cp-b2", "BUY", "2025-08-23", "5", "1371"), tx("cp-s1", "SELL", "2026-02-06", "5", "1475"), tx("cp-b3", "BUY", "2026-02-06", "7", "1487"), tx("cp-s2", "SELL", "2026-02-16", "7", "1675")])
    expect(cpplus).toMatchObject({ basis: "AVERAGE_COST", remainingQuantity: "2", averageRemainingCost: "1721.5714285714285714", remainingCostBasis: "3443.142857142857143", realisedProceeds: "19100", realisedCostBasis: "20658.857142857142857", realisedPnl: "-1558.857142857142857" })
    const eternal = calculateAccounting([tx("et-b1", "BUY", null, "20", "299"), tx("et-b2", "BUY", null, "4", "289"), tx("et-b3", "BUY", "2025-08-28", "15", "281"), tx("et-s", "SELL", "2026-02-24", "15", "258")])
    expect(eternal).toMatchObject({ basis: "AVERAGE_COST", remainingQuantity: "24", averageRemainingCost: "291.05128205128205128", remainingCostBasis: "6985.2307692307692308", realisedProceeds: "3870", realisedCostBasis: "4365.7692307692307692", realisedPnl: "-495.7692307692307692" })
  })

  it("I: keeps fully dated manual history on FIFO", () => {
    expect(calculateAccounting([tx("b", "BUY", "2026-01-01", "3", "10"), tx("s", "SELL", "2026-02-01", "1", "12")]).basis).toBe("FIFO")
  })

  it("J: switches to average cost when a date is corrected to null and back to FIFO when restored", () => {
    const buy = tx("b", "BUY", "2026-01-01", "3", "10"); const sell = tx("s", "SELL", "2026-02-01", "1", "12")
    expect(calculateAccounting([buy, sell]).basis).toBe("FIFO")
    expect(calculateAccounting([buy, { ...sell, transactionDate: null }]).basis).toBe("AVERAGE_COST")
    expect(calculateAccounting([buy, sell]).basis).toBe("FIFO")
  })

  it("K: excludes a superseded original and uses its active correction", () => {
    const original = tx("old", "BUY", "2026-01-01", "10", "10", { accountingStatus: "SUPERSEDED" })
    expect(calculateAccounting([original, tx("new", "BUY", "2026-01-01", "10", "11")])).toMatchObject({ remainingCostBasis: "110", remainingQuantity: "10" })
  })

  it("L/M: excludes a voided row and includes it after restore", () => {
    const buy = tx("b", "BUY", "2026-01-01", "10", "10"); const sale = tx("s", "SELL", "2026-02-01", "2", "15")
    expect(calculateAccounting([buy, { ...sale, accountingStatus: "REVERSED" }])).toMatchObject({ remainingQuantity: "10", realisedPnl: "0" })
    expect(calculateAccounting([buy, sale])).toMatchObject({ remainingQuantity: "8", realisedPnl: "10" })
  })

  it("N: exposes gross results and missing-charge quality without mixing partial charges", () => {
    const result = calculateAccounting([tx("b", "BUY", null, "2", "10", { charges: "2" }), tx("s", "SELL", "2026-02-01", "1", "15", { charges: null })])
    expect(result).toMatchObject({ basis: "AVERAGE_COST", quality: "GROSS_ONLY_CHARGES_INCOMPLETE", chargesComplete: false, remainingCostBasis: "10", realisedPnl: "5" })
  })

  it("P: rejects aggregate and chronological oversells", () => {
    expect(calculateAccounting([tx("b", "BUY", null, "1", "10"), tx("s", "SELL", null, "2", "12")]).basis).toBe("UNRESOLVED")
    expect(calculateAccounting([tx("s", "SELL", "2026-01-01", "1", "12"), tx("b", "BUY", "2026-02-01", "1", "10")]).basis).toBe("UNRESOLVED")
  })

  it("uses average cost for ambiguous equal timestamps without assuming row order", () => {
    const rows = [tx("b1", "BUY", "2026-01-01", "1", "10"), tx("b2", "BUY", "2026-01-01", "1", "20"), tx("s", "SELL", "2026-02-01", "1", "30")]
    expect(calculateAccounting(rows)).toMatchObject({ basis: "AVERAGE_COST", averageRemainingCost: "15", remainingCostBasis: "15", realisedPnl: "15" })
    expect(calculateAccounting([...rows].reverse())).toEqual(calculateAccounting(rows))
  })

  it("preserves exact fractional decimal calculation", () => {
    expect(calculateAccounting([tx("b", "BUY", "2026-01-01", "0.3", "0.2", { charges: "0.03" }), tx("s", "SELL", "2026-02-01", "0.1", "0.5", { charges: "0.01" })])).toMatchObject({ remainingCostBasis: "0.06", realisedPnl: "0.01" })
  })

  it("returns unresolved instead of throwing or fabricating for missing essential evidence", () => {
    expect(calculateAccounting([tx("b", "BUY", null, "1", "10", { unitPrice: null })])).toMatchObject({ basis: "UNRESOLVED", remainingCostBasis: null })
  })
})
