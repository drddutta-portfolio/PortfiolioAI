import Decimal from "decimal.js"
import { calculateAccounting } from "../accounting/fifoAccounting"
import type {
  BrokerAccountReference,
  BrokerAnalyticsRow,
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

function brokerLabel(accountId: string | null, accounts: ReadonlyMap<string, BrokerAccountReference>) {
  if (!accountId) return "Unknown / Unattributed"
  const account = accounts.get(accountId)
  if (!account) return "Unknown / Unattributed"
  return account.name.localeCompare(account.brokerName, undefined, { sensitivity: "accent" }) === 0
    ? account.brokerName : `${account.brokerName} · ${account.name}`
}

function calculateBrokerAnalytics(snapshot: PortfolioLedgerSnapshot): readonly BrokerAnalyticsRow[] {
  const accounts = new Map(snapshot.brokerAccounts.map((account) => [account.id, account]))
  const prices = new Map(snapshot.prices.map((price) => [price.securityId, new Decimal(price.price)]))
  const groups = new Map<string, Map<string, LedgerTransaction[]>>()
  for (const transaction of snapshot.transactions) {
    const label = brokerLabel(transaction.brokerAccountId, accounts)
    const bySecurity = groups.get(label) ?? new Map<string, LedgerTransaction[]>()
    const rows = bySecurity.get(transaction.securityId) ?? []
    rows.push(transaction); bySecurity.set(transaction.securityId, rows); groups.set(label, bySecurity)
  }
  return [...groups.entries()].map(([broker, bySecurity]) => {
    const invested: Decimal[] = []; const current: Decimal[] = []; const unrealised: Decimal[] = []; const realised: Decimal[] = []
    let covered = 0
    let fifoHistories = 0; let averageCostHistories = 0; let unresolvedHistories = 0
    for (const [securityId, transactions] of bySecurity) {
      const accounting = calculateAccounting(transactions)
      if (accounting.basis === "FIFO") fifoHistories += 1
      else if (accounting.basis === "AVERAGE_COST") averageCostHistories += 1
      else unresolvedHistories += 1
      const quantity = new Decimal(accounting.remainingQuantity)
      const price = prices.get(securityId)
      const cost = accounting.remainingCostBasis === null ? null : new Decimal(accounting.remainingCostBasis)
      const value = price && quantity.gte(0) ? price.times(quantity) : null
      if (cost !== null) invested.push(cost)
      if (value !== null) current.push(value)
      if (cost !== null && value !== null) unrealised.push(value.minus(cost))
      if (accounting.realisedPnl !== null) realised.push(new Decimal(accounting.realisedPnl))
      if (cost !== null && (quantity.isZero() || value !== null)) covered += 1
    }
    const investedTotal = invested.length ? sum(invested) : null
    const currentTotal = current.length ? sum(current) : null
    const unrealisedTotal = unrealised.length ? sum(unrealised) : null
    const realisedTotal = realised.length ? sum(realised) : null
    const supported = unrealisedTotal || realisedTotal ? (unrealisedTotal ?? ZERO).plus(realisedTotal ?? ZERO) : null
    return { broker, investedAmount: investedTotal ? text(investedTotal) : null, currentValue: currentTotal ? text(currentTotal) : null,
      unrealisedPnl: unrealisedTotal ? text(unrealisedTotal) : null, realisedPnl: realisedTotal ? text(realisedTotal) : null,
      supportedPnl: supported ? text(supported) : null,
      returnPercent: supported && investedTotal?.gt(0) ? text(supported.div(investedTotal).times(100)) : null,
      coveredHistories: covered, totalHistories: bySecurity.size, fifoHistories, averageCostHistories, unresolvedHistories }
  }).sort((left, right) => left.broker.localeCompare(right.broker))
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
  const accounting = calculateAccounting(transactions)
  const invested = accounting.remainingCostBasis === null ? null : new Decimal(accounting.remainingCostBasis)
  const selectedAverageCost = currentQuantity.isZero() ? accounting.historicalAverageAcquisitionCost : accounting.averageRemainingCost
  const averageCost = selectedAverageCost === null ? null : new Decimal(selectedAverageCost)

  const price = snapshot.prices.find((candidate) => candidate.securityId === security.id)
  const currentPrice = price ? new Decimal(price.price) : null
  const currentValue = currentPrice && quantityComplete ? currentPrice.times(currentQuantity) : null
  const unrealisedPnl = currentValue && invested ? currentValue.minus(invested) : null
  const unrealisedPnlPercent = unrealisedPnl && invested?.gt(0)
    ? unrealisedPnl.div(invested).times(100)
    : null

  const realisedPnl = accounting.realisedPnl === null ? null : new Decimal(accounting.realisedPnl)

  const accounts = new Map(snapshot.brokerAccounts.map((account) => [account.id, account]))
  const settings = snapshot.settings.get(security.id) ?? {
    id: null,
    portfolioRole: null,
    targetWeight: null,
    minimumWeight: null,
    maximumWeight: null,
    priority: null,
    isWatchlisted: false,
    isFrozen: false,
    investmentHorizon: null,
    notes: null,
  }
  const themeIds = new Set(snapshot.themeIdsBySecurity.get(security.id) ?? [])
  return {
    securityId: security.id,
    symbol: security.symbol,
    company: security.name,
    sector: security.sector,
    industry: security.industry,
    assetClass: security.assetClass,
    exchange: security.exchange,
    isin: security.isin,
    instrumentType: security.instrumentType,
    series: security.series,
    role: roleFor(snapshot.roles.get(security.id)),
    settings,
    themes: snapshot.themes.filter((theme) => themeIds.has(theme.id)),
    snapshotEvidence: snapshot.snapshotEvidence.get(security.id) ?? null,
    quantity: text(currentQuantity),
    totalQuantityAcquired: accounting.totalQuantityAcquired,
    transactionCount: transactions.length,
    averageCost: averageCost ? text(averageCost) : null,
    investedAmount: invested ? text(invested) : null,
    currentPrice: currentPrice ? text(currentPrice) : null,
    currentValue: currentValue ? text(currentValue) : null,
    unrealisedPnl: unrealisedPnl ? text(unrealisedPnl) : null,
    unrealisedPnlPercent: unrealisedPnlPercent ? text(unrealisedPnlPercent) : null,
    portfolioWeightPercent: null,
    realisedPnl: realisedPnl ? text(realisedPnl) : null,
    realisedCostBasis: accounting.realisedCostBasis,
    realisedProceeds: accounting.realisedProceeds,
    totalQuantitySold: accounting.totalQuantitySold,
    accountingBasis: accounting.basis,
    accountingQuality: accounting.quality,
    chargesComplete: accounting.chargesComplete,
    accountingReason: accounting.reason,
    brokerExposure: brokerExposure(transactions, accounts),
    hasMissingDates: transactions.some((transaction) => transaction.transactionDate === null),
    hasMissingBrokers: transactions.some((transaction) => transaction.brokerAccountId === null),
    hasMissingPrices: !price,
    priceTimestamp: price?.priceTimestamp ?? null,
    priceRetrievedAt: price?.retrievedAt ?? null,
    priceProvider: price?.provider ?? null,
    priceSessionStatus: price?.marketSessionStatus ?? null,
    isPriceStale: price?.isStale ?? false,
    costBasisReason: averageCost ? accounting.reason : accounting.reason,
    realisedPnlReason: realisedPnl ? accounting.reason : accounting.reason ?? "No disposal has been recorded.",
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
  const disposalPositions = positions.filter((position) => new Decimal(position.totalQuantitySold).gt(0))
  const realisedPositions = disposalPositions.filter((position) => position.realisedPnl !== null)
  const invested = investedPositions.length
    ? sum(investedPositions.map((position) => new Decimal(position.investedAmount ?? "0")))
    : null
  const currentValue = valuedPositions.length === rawOpenPositions.length && valuedPositions.length
    ? sum(valuedPositions.map((position) => new Decimal(position.currentValue ?? "0")))
    : null
  const pricedMarketValue = valuedPositions.length
    ? sum(valuedPositions.map((position) => new Decimal(position.currentValue ?? "0")))
    : null
  const unrealisedPositions = rawOpenPositions.filter((position) => position.unrealisedPnl !== null)
  const coveredUnrealisedPnl = unrealisedPositions.length
    ? sum(unrealisedPositions.map((position) => new Decimal(position.unrealisedPnl ?? "0")))
    : null
  const coveredUnrealisedCostBasis = unrealisedPositions.length
    ? sum(unrealisedPositions.map((position) => new Decimal(position.investedAmount ?? "0")))
    : null
  const coveredUnrealisedPnlPercent = coveredUnrealisedPnl && coveredUnrealisedCostBasis?.gt(0)
    ? coveredUnrealisedPnl.div(coveredUnrealisedCostBasis).times(100)
    : null
  const unrealised = currentValue
    && investedPositions.length === rawOpenPositions.length
    && invested
    ? currentValue.minus(invested)
    : null
  const realised = realisedPositions.length
    ? sum(realisedPositions.map((position) => new Decimal(position.realisedPnl ?? "0")))
    : null

  const openPositions = rawOpenPositions.map((position) => ({
    ...position,
    portfolioWeightPercent: position.currentValue && pricedMarketValue?.gt(0)
      ? text(new Decimal(position.currentValue).div(pricedMarketValue).times(100))
      : null,
  }))
  return {
    portfolio: snapshot.portfolio,
    themes: snapshot.themes,
    openPositions,
    closedPositions,
    brokerAnalytics: calculateBrokerAnalytics(snapshot),
    totals: {
      openHoldings: openPositions.length,
      closedHistories: closedPositions.length,
      securityHistories: positions.length,
      investedAmount: invested ? text(invested) : null,
      investedCoverage: investedPositions.length,
      currentValue: currentValue ? text(currentValue) : null,
      pricedMarketValue: pricedMarketValue ? text(pricedMarketValue) : null,
      priceCoverage: valuedPositions.length,
      unrealisedPnl: unrealised ? text(unrealised) : null,
      unrealisedPnlPercent: unrealised && invested?.gt(0) ? text(unrealised.div(invested).times(100)) : null,
      coveredUnrealisedPnl: coveredUnrealisedPnl ? text(coveredUnrealisedPnl) : null,
      coveredUnrealisedCostBasis: coveredUnrealisedCostBasis ? text(coveredUnrealisedCostBasis) : null,
      coveredUnrealisedPnlPercent: coveredUnrealisedPnlPercent ? text(coveredUnrealisedPnlPercent) : null,
      unrealisedCoverage: unrealisedPositions.length,
      realisedPnl: realised ? text(realised) : null,
      realisedCoverage: realisedPositions.length,
      realisedEligibleHistories: disposalPositions.length,
      freshPriceCoverage: openPositions.filter((position) => position.currentPrice !== null && !position.isPriceStale).length,
      stalePriceCoverage: openPositions.filter((position) => position.currentPrice !== null && position.isPriceStale).length,
      accountingCoverage: openPositions.filter((position) => position.investedAmount !== null).length,
      incompleteAccountingPositions: openPositions.filter((position) => position.investedAmount === null).length,
      fifoAccountingHistories: positions.filter((position) => position.accountingBasis === "FIFO").length,
      averageCostAccountingHistories: positions.filter((position) => position.accountingBasis === "AVERAGE_COST").length,
      unresolvedAccountingHistories: positions.filter((position) => position.accountingBasis === "UNRESOLVED").length,
    },
    quality: {
      holdingsWithMissingDates: openPositions.filter((position) => position.hasMissingDates).length,
      holdingsWithMissingBrokers: openPositions.filter((position) => position.hasMissingBrokers).length,
      holdingsWithMissingPrices: openPositions.filter((position) => position.hasMissingPrices).length,
      holdingsWithStalePrices: openPositions.filter((position) => position.isPriceStale).length,
    },
  }
}
