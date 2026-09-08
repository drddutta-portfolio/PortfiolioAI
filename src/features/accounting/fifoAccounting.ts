import Decimal from "decimal.js"
import type { LedgerTransaction } from "../portfolio/types"

export type AccountingBasis = "FIFO" | "AVERAGE_COST" | "UNRESOLVED"
export type AccountingQuality = "FIFO_COMPLETE" | "AVERAGE_COST_INCOMPLETE_CHRONOLOGY" | "GROSS_ONLY_CHARGES_INCOMPLETE" | "NEEDS_REVIEW" | "UNRESOLVED_LEDGER"

export interface LotMatch { readonly buyTransactionId: string; readonly sellTransactionId: string; readonly quantity: string; readonly costBasis: string; readonly proceeds: string; readonly realisedPnl: string }
export interface OpenLot { readonly transactionId: string; readonly acquiredOn: string; readonly remainingQuantity: string; readonly remainingCostBasis: string }
export interface AccountingResult {
  readonly basis: AccountingBasis
  readonly quality: AccountingQuality
  readonly chargesComplete: boolean
  readonly reason: string | null
  readonly remainingQuantity: string
  readonly remainingCostBasis: string | null
  readonly averageRemainingCost: string | null
  readonly historicalAverageAcquisitionCost: string | null
  readonly totalQuantityAcquired: string
  readonly realisedCostBasis: string | null
  readonly realisedProceeds: string | null
  readonly realisedPnl: string | null
  readonly totalQuantitySold: string
  readonly openLots: readonly OpenLot[]
  readonly matches: readonly LotMatch[]
}

interface MutableLot { transactionId: string; acquiredOn: string; remainingQuantity: Decimal; unitCost: Decimal }
const ZERO = new Decimal(0)

function value(input: string, label: string) {
  try { const result = new Decimal(input); if (!result.isFinite()) throw new Error(); return result }
  catch { throw new Error(`${label} is invalid.`) }
}
function text(input: Decimal) { return input.toFixed() }
function chronologyKey(transaction: LedgerTransaction) { return `${transaction.transactionDate ?? ""}|${transaction.executedAt ?? ""}` }
function chronologyIsProvable(transactions: readonly LedgerTransaction[]) {
  if (transactions.some((transaction) => transaction.transactionDate === null)) return false
  const keys = new Set<string>(); const byDate = new Map<string, LedgerTransaction[]>()
  for (const transaction of transactions) {
    const date = transaction.transactionDate as string
    byDate.set(date, [...(byDate.get(date) ?? []), transaction])
    const key = chronologyKey(transaction); if (keys.has(key)) return false; keys.add(key)
  }
  return ![...byDate.values()].some((sameDate) => sameDate.length > 1 && sameDate.some((transaction) => transaction.executedAt === null))
}
function unresolved(reason: string, remainingQuantity = ZERO, totalQuantitySold = ZERO): AccountingResult {
  return { basis: "UNRESOLVED", quality: "UNRESOLVED_LEDGER", chargesComplete: false, reason,
    remainingQuantity: text(remainingQuantity), remainingCostBasis: null, averageRemainingCost: null, historicalAverageAcquisitionCost: null, totalQuantityAcquired: "0",
    realisedCostBasis: null, realisedProceeds: null, realisedPnl: null, totalQuantitySold: text(totalQuantitySold), openLots: [], matches: [] }
}
function chargesAreComplete(transactions: readonly LedgerTransaction[]) {
  return transactions.every((transaction) => transaction.charges !== null && transaction.taxes !== null)
}
function quality(basis: Exclude<AccountingBasis, "UNRESOLVED">, chargesComplete: boolean): AccountingQuality {
  if (!chargesComplete) return "GROSS_ONLY_CHARGES_INCOMPLETE"
  return basis === "FIFO" ? "FIFO_COMPLETE" : "AVERAGE_COST_INCOMPLETE_CHRONOLOGY"
}
function reason(basis: Exclude<AccountingBasis, "UNRESOLVED">, chargesComplete: boolean) {
  const basisReason = basis === "AVERAGE_COST" ? "Chronology is incomplete, so FIFO is unavailable; deterministic weighted-average cost is calculated without assuming transaction order." : null
  const chargeReason = chargesComplete ? null : "One or more charge/tax values are unavailable, so gross price-based cost and P/L exclude all charges and taxes."
  return [basisReason, chargeReason].filter(Boolean).join(" ") || null
}

function calculateAverageCost(supported: readonly LedgerTransaction[], buyQuantity: Decimal, soldQuantity: Decimal, chargesComplete: boolean): AccountingResult {
  const buyCost = supported.filter((transaction) => transaction.transactionType === "BUY").reduce((total, transaction) => {
    const quantity = value(transaction.quantity as string, "Buy quantity"); const price = value(transaction.unitPrice as string, "Buy execution price")
    const costs = chargesComplete ? value(transaction.charges as string, "Buy charges").plus(value(transaction.taxes as string, "Buy taxes")) : ZERO
    return total.plus(quantity.times(price)).plus(costs)
  }, ZERO)
  const realisedProceeds = supported.filter((transaction) => transaction.transactionType === "SELL").reduce((total, transaction) => {
    const quantity = value(transaction.quantity as string, "Sell quantity"); const price = value(transaction.unitPrice as string, "Sell execution price")
    const costs = chargesComplete ? value(transaction.charges as string, "Sell charges").plus(value(transaction.taxes as string, "Sell taxes")) : ZERO
    return total.plus(quantity.times(price)).minus(costs)
  }, ZERO)
  const averageCost = buyCost.div(buyQuantity); const realisedCost = soldQuantity.times(averageCost); const remainingQuantity = buyQuantity.minus(soldQuantity); const remainingCost = buyCost.minus(realisedCost)
  return { basis: "AVERAGE_COST", quality: quality("AVERAGE_COST", chargesComplete), chargesComplete, reason: reason("AVERAGE_COST", chargesComplete),
    remainingQuantity: text(remainingQuantity), remainingCostBasis: text(remainingCost), averageRemainingCost: remainingQuantity.gt(0) ? text(averageCost) : null,
    historicalAverageAcquisitionCost: text(averageCost), totalQuantityAcquired: text(buyQuantity),
    realisedCostBasis: text(realisedCost), realisedProceeds: text(realisedProceeds), realisedPnl: text(realisedProceeds.minus(realisedCost)),
    totalQuantitySold: text(soldQuantity), openLots: [], matches: [] }
}

/** Selects one deterministic basis per effective security ledger. Imported snapshot values never participate. */
export function calculateAccounting(transactions: readonly LedgerTransaction[]): AccountingResult {
  const active = transactions.filter((transaction) => transaction.accountingStatus === "ACTIVE")
  if (active.some((transaction) => transaction.transactionType !== "BUY" && transaction.transactionType !== "SELL")) return unresolved("The effective history contains a transaction type whose accounting semantics are not supported.")
  if (active.some((transaction) => transaction.quantity === null || transaction.unitPrice === null)) return unresolved("Quantity or execution-price evidence is unavailable.")
  let buyQuantity = ZERO; let soldQuantity = ZERO
  try {
    for (const transaction of active) {
      const quantity = value(transaction.quantity as string, "Transaction quantity"); const price = value(transaction.unitPrice as string, "Execution price")
      if (quantity.lte(0) || price.lt(0)) return unresolved("Transaction quantities must be positive and prices cannot be negative.")
      if (transaction.transactionType === "BUY") buyQuantity = buyQuantity.plus(quantity); else soldQuantity = soldQuantity.plus(quantity)
    }
  } catch (error) { return unresolved(error instanceof Error ? error.message : "Transaction numeric evidence is invalid.") }
  const remainingQuantity = buyQuantity.minus(soldQuantity)
  if (buyQuantity.isZero() && soldQuantity.gt(0)) return unresolved("The ledger contains disposals without acquisition quantity.", remainingQuantity, soldQuantity)
  if (soldQuantity.gt(buyQuantity)) return unresolved("Disposals exceed total acquisition quantity.", remainingQuantity, soldQuantity)
  if (active.length === 0) return unresolved("No effective BUY or SELL ledger rows are available.")
  const chargesComplete = chargesAreComplete(active)
  if (!chronologyIsProvable(active)) return calculateAverageCost(active, buyQuantity, soldQuantity, chargesComplete)

  const ordered = [...active].sort((left, right) => chronologyKey(left).localeCompare(chronologyKey(right)))
  const lots: MutableLot[] = []; const matches: LotMatch[] = []; let realisedCost = ZERO; let realisedProceeds = ZERO; let totalAcquisitionCost = ZERO
  for (const transaction of ordered) {
    const transactionQuantity = value(transaction.quantity as string, "Transaction quantity"); const unitPrice = value(transaction.unitPrice as string, "Execution price")
    const costs = chargesComplete ? value(transaction.charges as string, "Charges").plus(value(transaction.taxes as string, "Taxes")) : ZERO
    if (transaction.transactionType === "BUY") {
      const acquisitionCost = transactionQuantity.times(unitPrice).plus(costs)
      totalAcquisitionCost = totalAcquisitionCost.plus(acquisitionCost)
      lots.push({ transactionId: transaction.id, acquiredOn: transaction.transactionDate as string, remainingQuantity: transactionQuantity, unitCost: acquisitionCost.div(transactionQuantity) }); continue
    }
    let remaining = transactionQuantity; const netUnitProceeds = unitPrice.minus(costs.div(transactionQuantity))
    for (const lot of lots) {
      if (remaining.isZero()) break; if (lot.remainingQuantity.isZero()) continue
      const matched = Decimal.min(remaining, lot.remainingQuantity); const cost = matched.times(lot.unitCost); const proceeds = matched.times(netUnitProceeds)
      matches.push({ buyTransactionId: lot.transactionId, sellTransactionId: transaction.id, quantity: text(matched), costBasis: text(cost), proceeds: text(proceeds), realisedPnl: text(proceeds.minus(cost)) })
      lot.remainingQuantity = lot.remainingQuantity.minus(matched); remaining = remaining.minus(matched); realisedCost = realisedCost.plus(cost); realisedProceeds = realisedProceeds.plus(proceeds)
    }
    if (remaining.gt(0)) return unresolved("A disposal exceeds the acquisition quantity available at that chronological point.", remainingQuantity, soldQuantity)
  }
  const openLots = lots.filter((lot) => lot.remainingQuantity.gt(0)).map((lot) => ({ transactionId: lot.transactionId, acquiredOn: lot.acquiredOn, remainingQuantity: text(lot.remainingQuantity), remainingCostBasis: text(lot.remainingQuantity.times(lot.unitCost)) }))
  const remainingCost = openLots.reduce((total, lot) => total.plus(lot.remainingCostBasis), ZERO)
  return { basis: "FIFO", quality: quality("FIFO", chargesComplete), chargesComplete, reason: reason("FIFO", chargesComplete), remainingQuantity: text(remainingQuantity),
    remainingCostBasis: text(remainingCost), averageRemainingCost: remainingQuantity.gt(0) ? text(remainingCost.div(remainingQuantity)) : null,
    historicalAverageAcquisitionCost: buyQuantity.gt(0) ? text(totalAcquisitionCost.div(buyQuantity)) : null, totalQuantityAcquired: text(buyQuantity),
    realisedCostBasis: text(realisedCost), realisedProceeds: text(realisedProceeds), realisedPnl: text(realisedProceeds.minus(realisedCost)),
    totalQuantitySold: text(soldQuantity), openLots, matches }
}

/** @deprecated Use calculateAccounting; retained for compatibility with prior callers. */
export const calculateFifoAccounting = calculateAccounting
