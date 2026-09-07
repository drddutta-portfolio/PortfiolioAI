import Decimal from "decimal.js"
import type { LedgerTransaction } from "../portfolio/types"

export type AccountingQuality = "DETERMINISTIC" | "PARTIAL_ACCOUNTING" | "INCOMPLETE_CHRONOLOGY" | "NOT_CALCULABLE"

export interface LotMatch {
  readonly buyTransactionId: string
  readonly sellTransactionId: string
  readonly quantity: string
  readonly costBasis: string
  readonly proceeds: string
  readonly realisedPnl: string
}

export interface OpenLot {
  readonly transactionId: string
  readonly acquiredOn: string
  readonly remainingQuantity: string
  readonly remainingCostBasis: string
}

export interface FifoAccountingResult {
  readonly quality: AccountingQuality
  readonly reason: string | null
  readonly remainingQuantity: string
  readonly remainingCostBasis: string | null
  readonly averageRemainingCost: string | null
  readonly realisedCostBasis: string | null
  readonly realisedProceeds: string | null
  readonly realisedPnl: string | null
  readonly totalQuantitySold: string
  readonly openLots: readonly OpenLot[]
  readonly matches: readonly LotMatch[]
}

interface MutableLot {
  transactionId: string
  acquiredOn: string
  remainingQuantity: Decimal
  unitCost: Decimal
}

const ZERO = new Decimal(0)

function value(input: string | null, label: string) {
  if (input === null) throw new Error(`${label} is unavailable.`)
  try { return new Decimal(input) } catch { throw new Error(`${label} is invalid.`) }
}

function text(input: Decimal) { return input.toFixed() }

function chronologyKey(transaction: LedgerTransaction) {
  return `${transaction.transactionDate ?? ""}|${transaction.executedAt ?? ""}`
}

/**
 * Gross FIFO accounting. Charges and taxes are included only when both are stored.
 * When either is unknown the gross result remains useful but is explicitly PARTIAL.
 */
export function calculateFifoAccounting(transactions: readonly LedgerTransaction[]): FifoAccountingResult {
  const active = transactions.filter((transaction) => transaction.accountingStatus === "ACTIVE")
  const supported = active.filter((transaction) => transaction.transactionType === "BUY" || transaction.transactionType === "SELL")
  const quantity = supported.reduce((total, transaction) => {
    const magnitude = value(transaction.quantity, "Transaction quantity")
    return transaction.transactionType === "BUY" ? total.plus(magnitude) : total.minus(magnitude)
  }, ZERO)
  const sold = supported.filter((transaction) => transaction.transactionType === "SELL")
    .reduce((total, transaction) => total.plus(value(transaction.quantity, "Sell quantity")), ZERO)

  const unavailable = (quality: AccountingQuality, reason: string): FifoAccountingResult => ({
    quality, reason, remainingQuantity: text(quantity), remainingCostBasis: null,
    averageRemainingCost: null, realisedCostBasis: null, realisedProceeds: null,
    realisedPnl: null, totalQuantitySold: text(sold), openLots: [], matches: [],
  })
  if (active.some((transaction) => transaction.transactionType !== "BUY" && transaction.transactionType !== "SELL")) {
    return unavailable("NOT_CALCULABLE", "The history contains a transaction type whose lot semantics are not yet supported.")
  }
  if (supported.some((transaction) => transaction.quantity === null || transaction.unitPrice === null)) {
    return unavailable("NOT_CALCULABLE", "Quantity or execution-price evidence is unavailable.")
  }
  if (sold.gt(0) && supported.some((transaction) => transaction.transactionDate === null)) {
    return unavailable("INCOMPLETE_CHRONOLOGY", "At least one transaction date is unknown, so FIFO order cannot be proven.")
  }
  if (sold.gt(0)) {
    const keys = new Set<string>()
    const byDate = new Map<string, LedgerTransaction[]>()
    for (const transaction of supported) {
      if (!transaction.transactionDate) continue
      byDate.set(transaction.transactionDate, [...(byDate.get(transaction.transactionDate) ?? []), transaction])
      const key = chronologyKey(transaction)
      if (keys.has(key)) return unavailable("INCOMPLETE_CHRONOLOGY", "Two transactions share the same available timestamp, so their FIFO order cannot be proven.")
      keys.add(key)
    }
    if ([...byDate.values()].some((sameDate) => sameDate.length > 1 && sameDate.some((transaction) => transaction.executedAt === null))) {
      return unavailable("INCOMPLETE_CHRONOLOGY", "Multiple transactions share a date and at least one has no execution time, so their FIFO order cannot be proven.")
    }
  }

  const ordered = [...supported].sort((left, right) => chronologyKey(left).localeCompare(chronologyKey(right)))
  const lots: MutableLot[] = []
  const matches: LotMatch[] = []
  let realisedCost = ZERO
  let realisedProceeds = ZERO
  let chargesComplete = true

  for (const transaction of ordered) {
    const transactionQuantity = value(transaction.quantity, "Transaction quantity")
    const unitPrice = value(transaction.unitPrice, "Execution price")
    const costsKnown = transaction.charges !== null && transaction.taxes !== null
    chargesComplete &&= costsKnown
    const charges = costsKnown ? value(transaction.charges, "Charges").plus(value(transaction.taxes, "Taxes")) : ZERO
    if (transaction.transactionType === "BUY") {
      const unitCost = unitPrice.plus(charges.div(transactionQuantity))
      lots.push({ transactionId: transaction.id, acquiredOn: transaction.transactionDate ?? "Unknown", remainingQuantity: transactionQuantity, unitCost })
      continue
    }
    let remaining = transactionQuantity
    const netUnitProceeds = unitPrice.minus(charges.div(transactionQuantity))
    for (const lot of lots) {
      if (remaining.isZero()) break
      if (lot.remainingQuantity.isZero()) continue
      const matched = Decimal.min(remaining, lot.remainingQuantity)
      const cost = matched.times(lot.unitCost)
      const proceeds = matched.times(netUnitProceeds)
      matches.push({ buyTransactionId: lot.transactionId, sellTransactionId: transaction.id, quantity: text(matched), costBasis: text(cost), proceeds: text(proceeds), realisedPnl: text(proceeds.minus(cost)) })
      lot.remainingQuantity = lot.remainingQuantity.minus(matched)
      remaining = remaining.minus(matched)
      realisedCost = realisedCost.plus(cost)
      realisedProceeds = realisedProceeds.plus(proceeds)
    }
    if (remaining.gt(0)) return unavailable("NOT_CALCULABLE", "A disposal exceeds the acquisition quantity available at that point in time.")
  }
  const openLots = lots.filter((lot) => lot.remainingQuantity.gt(0)).map((lot) => ({
    transactionId: lot.transactionId, acquiredOn: lot.acquiredOn,
    remainingQuantity: text(lot.remainingQuantity), remainingCostBasis: text(lot.remainingQuantity.times(lot.unitCost)),
  }))
  const remainingCost = openLots.reduce((total, lot) => total.plus(lot.remainingCostBasis), ZERO)
  const quality: AccountingQuality = chargesComplete ? "DETERMINISTIC" : "PARTIAL_ACCOUNTING"
  const reason = chargesComplete ? null : "FIFO is deterministic on stored prices; one or more charge/tax values are unavailable, so results exclude those unknown costs."
  return {
    quality, reason, remainingQuantity: text(quantity), remainingCostBasis: text(remainingCost),
    averageRemainingCost: quantity.gt(0) ? text(remainingCost.div(quantity)) : null,
    realisedCostBasis: text(realisedCost), realisedProceeds: text(realisedProceeds),
    realisedPnl: text(realisedProceeds.minus(realisedCost)), totalQuantitySold: text(sold), openLots, matches,
  }
}
