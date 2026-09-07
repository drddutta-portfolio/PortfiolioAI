import Decimal from "decimal.js"
import type {
  BrokerAccountReference,
  LedgerTransaction,
  PortfolioLedgerSnapshot,
  PortfolioPosition,
  PortfolioRole,
  PortfolioViewModel,
} from "./types"

const ZERO = new Decimal(0)
const POSITIVE_TYPES = new Set(["BUY", "OPENING_POSITION", "TRANSFER_IN", "BONUS"])
const NEGATIVE_TYPES = new Set(["SELL", "TRANSFER_OUT"])

function decimal(value: string | null, label: string) {
  if (value === null) return null
  try {
    return new Decimal(value)
  } catch {
    throw new Error(`Invalid exact decimal for ${label}.`)
  }
}

function signedQuantity(transaction: LedgerTransaction) {
  const quantity = decimal(transaction.quantity, "transaction quantity")
  if (!quantity) return null
  if (POSITIVE_TYPES.has(transaction.transactionType)) return quantity
  if (NEGATIVE_TYPES.has(transaction.transactionType)) return quantity.negated()
  return null
}

function sum(values: readonly Decimal[]) {
  return values.reduce((total, value) => total.plus(value), ZERO)
}

function text(value: Decimal) {
  return value.toFixed()
}

function roleFor(value: PortfolioRole | undefined): PortfolioRole {
  return value ?? "UNCLASSIFIED"
}

function brokerExposure(
  transactions: readonly LedgerTransaction[],
  accounts: ReadonlyMap<string, BrokerAccountReference>,
) {
  if (transactions.some((transaction) => transaction.brokerAccountId === null)) return null
  const totals = new Map<string, Decimal>()
  for (const transaction of transactions) {
    const quantity = signedQuantity(transaction)
    if (!quantity || !transaction.brokerAccountId) return null
    const account = accounts.get(transaction.brokerAccountId)
    if (!account) return null
    const label = account.name.localeCompare(account.brokerName, undefined, { sensitivity: "accent" }) === 0
      ? account.brokerName
      : `${account.brokerName} · ${account.name}`
    totals.set(label, (totals.get(label) ?? ZERO).plus(quantity))
  }
  return [...totals.entries()]
    .filter(([, quantity]) => !quantity.isZero())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([broker, quantity]) => ({ broker, quantity: text(quantity) }))
}

function buildPosition(
  security: PortfolioLedgerSnapshot["securities"][number],
  transactions: readonly LedgerTransaction[],
  snapshot: PortfolioLedgerSnapshot,
): PortfolioPosition {
  const quantities = transactions.map(signedQuantity)
  const quantityComplete = quantities.every((quantity) => quantity !== null)
  const currentQuantity = quantityComplete
    ? sum(quantities.filter((quantity): quantity is Decimal => quantity !== null))
    : ZERO
  const buyOnly = transactions.every((transaction) => transaction.transactionType === "BUY")
  const pricedBuyOnly = buyOnly && transactions.every((transaction) =>
    transaction.quantity !== null && transaction.unitPrice !== null)
  const invested = pricedBuyOnly
    ? sum(transactions.map((transaction) =>
      new Decimal(transaction.quantity ?? "0").times(transaction.unitPrice ?? "0")))
    : null
  const averageCost = invested && currentQuantity.gt(0)
    ? invested.div(currentQuantity)
    : null

  const price = snapshot.prices.find((candidate) => candidate.securityId === security.id)
  const currentPrice = price ? new Decimal(price.price) : null
  const currentValue = currentPrice && quantityComplete ? currentPrice.times(currentQuantity) : null
  const unrealisedPnl = currentValue && invested ? currentValue.minus(invested) : null
  const unrealisedPnlPercent = unrealisedPnl && invested?.gt(0)
    ? unrealisedPnl.div(invested).times(100)
    : null

  const fullyClosedBuySell = currentQuantity.isZero()
    && transactions.every((transaction) => transaction.transactionType === "BUY" || transaction.transactionType === "SELL")
    && transactions.every((transaction) =>
      transaction.quantity !== null
      && transaction.unitPrice !== null
      && transaction.charges !== null
      && transaction.taxes !== null)
  const realisedPnl = fullyClosedBuySell
    ? sum(transactions.map((transaction) => {
      const gross = new Decimal(transaction.quantity ?? "0").times(transaction.unitPrice ?? "0")
      const costs = new Decimal(transaction.charges ?? "0").plus(transaction.taxes ?? "0")
      return transaction.transactionType === "SELL" ? gross.minus(costs) : gross.plus(costs).negated()
    }))
    : null

  const accounts = new Map(snapshot.brokerAccounts.map((account) => [account.id, account]))
  return {
    securityId: security.id,
    symbol: security.symbol,
    company: security.name,
    sector: security.sector,
    role: roleFor(snapshot.roles.get(security.id)),
    quantity: text(currentQuantity),
    transactionCount: transactions.length,
    averageCost: averageCost ? text(averageCost) : null,
    investedAmount: invested ? text(invested) : null,
    currentPrice: currentPrice ? text(currentPrice) : null,
    currentValue: currentValue ? text(currentValue) : null,
    unrealisedPnl: unrealisedPnl ? text(unrealisedPnl) : null,
    unrealisedPnlPercent: unrealisedPnlPercent ? text(unrealisedPnlPercent) : null,
    portfolioWeightPercent: null,
    realisedPnl: realisedPnl ? text(realisedPnl) : null,
    brokerExposure: brokerExposure(transactions, accounts),
    hasMissingDates: transactions.some((transaction) => transaction.transactionDate === null),
    hasMissingBrokers: transactions.some((transaction) => transaction.brokerAccountId === null),
    hasMissingPrices: !price,
    priceTimestamp: price?.priceTimestamp ?? null,
    priceRetrievedAt: price?.retrievedAt ?? null,
    priceProvider: price?.provider ?? null,
    priceSessionStatus: price?.marketSessionStatus ?? null,
    isPriceStale: price?.isStale ?? false,
    costBasisReason: averageCost ? null : buyOnly
      ? "One or more purchase prices are unavailable."
      : "Sell or non-purchase history requires an approved lot-accounting method.",
    realisedPnlReason: realisedPnl ? null : currentQuantity.isZero()
      ? "Charges, taxes, prices, or supported BUY/SELL evidence are incomplete."
      : "Position remains open; realised lot accounting is not inferred.",
  }
}

export function calculatePortfolio(snapshot: PortfolioLedgerSnapshot): PortfolioViewModel {
  const transactionsBySecurity = new Map<string, LedgerTransaction[]>()
  snapshot.transactions.forEach((transaction) => {
    const current = transactionsBySecurity.get(transaction.securityId) ?? []
    current.push(transaction)
    transactionsBySecurity.set(transaction.securityId, current)
  })
  const securities = new Map(snapshot.securities.map((security) => [security.id, security]))
  const positions = [...transactionsBySecurity.entries()].map(([securityId, transactions]) => {
    const security = securities.get(securityId)
    if (!security) throw new Error(`Missing security reference for ${securityId}.`)
    return buildPosition(security, transactions, snapshot)
  }).sort((left, right) => left.symbol.localeCompare(right.symbol))

  const rawOpenPositions = positions.filter((position) => !new Decimal(position.quantity).isZero())
  const closedPositions = positions.filter((position) => new Decimal(position.quantity).isZero())
  const investedPositions = rawOpenPositions.filter((position) => position.investedAmount !== null)
  const valuedPositions = rawOpenPositions.filter((position) => position.currentValue !== null)
  const realisedPositions = closedPositions.filter((position) => position.realisedPnl !== null)
  const invested = investedPositions.length
    ? sum(investedPositions.map((position) => new Decimal(position.investedAmount ?? "0")))
    : null
  const currentValue = valuedPositions.length === rawOpenPositions.length && valuedPositions.length
    ? sum(valuedPositions.map((position) => new Decimal(position.currentValue ?? "0")))
    : null
  const unrealised = currentValue && investedPositions.length === rawOpenPositions.length && invested
    ? currentValue.minus(invested)
    : null
  const realised = realisedPositions.length
    ? sum(realisedPositions.map((position) => new Decimal(position.realisedPnl ?? "0")))
    : null

  const openPositions = rawOpenPositions.map((position) => ({
    ...position,
    portfolioWeightPercent: position.currentValue && currentValue?.gt(0)
      ? text(new Decimal(position.currentValue).div(currentValue).times(100))
      : null,
  }))
  return {
    portfolio: snapshot.portfolio,
    openPositions,
    closedPositions,
    totals: {
      openHoldings: openPositions.length,
      closedHistories: closedPositions.length,
      securityHistories: positions.length,
      investedAmount: invested ? text(invested) : null,
      investedCoverage: investedPositions.length,
      currentValue: currentValue ? text(currentValue) : null,
      priceCoverage: valuedPositions.length,
      unrealisedPnl: unrealised ? text(unrealised) : null,
      unrealisedPnlPercent: unrealised && invested?.gt(0) ? text(unrealised.div(invested).times(100)) : null,
      realisedPnl: realised ? text(realised) : null,
      realisedCoverage: realisedPositions.length,
      freshPriceCoverage: openPositions.filter((position) => position.currentPrice !== null && !position.isPriceStale).length,
      stalePriceCoverage: openPositions.filter((position) => position.currentPrice !== null && position.isPriceStale).length,
    },
    quality: {
      holdingsWithMissingDates: openPositions.filter((position) => position.hasMissingDates).length,
      holdingsWithMissingBrokers: openPositions.filter((position) => position.hasMissingBrokers).length,
      holdingsWithMissingPrices: openPositions.filter((position) => position.hasMissingPrices).length,
      holdingsWithStalePrices: openPositions.filter((position) => position.isPriceStale).length,
    },
  }
}
