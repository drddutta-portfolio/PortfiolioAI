import Decimal from "decimal.js"
import { useState } from "react"
import { Link } from "react-router-dom"
import { isMarketDataEnabled, refreshPortfolioMarketData } from "../data/marketDataRepository"
import { displayError } from "../lib/displayError"
import { formatMoney, formatPercent } from "../features/portfolio/format"
import type { PortfolioPosition } from "../features/portfolio/types"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"

function allocationRows(positions: readonly PortfolioPosition[], key: "symbol" | "sector") {
  const valued = positions.filter((position) => position.currentValue !== null)
  if (valued.length !== positions.length) return []
  if (key === "sector" && valued.some((position) => position.sector === null)) return []
  const total = valued.reduce((sum, position) => sum.plus(position.currentValue ?? "0"), new Decimal(0))
  if (total.isZero()) return []
  const groups = new Map<string, Decimal>()
  valued.forEach((position) => {
    const label = key === "sector" ? position.sector ?? "Unclassified" : position.symbol
    groups.set(label, (groups.get(label) ?? new Decimal(0)).plus(position.currentValue ?? "0"))
  })
  return [...groups.entries()].map(([label, value]) => ({
    label, value: value.toFixed(), percentage: value.div(total).times(100).toFixed(),
  })).sort((left, right) => new Decimal(right.percentage).comparedTo(left.percentage))
}

function summarizeAllocation(rows: readonly AllocationRow[], visibleCount: number) {
  if (rows.length <= visibleCount) return rows
  const leading = rows.slice(0, visibleCount)
  const remaining = rows.slice(visibleCount)
  const value = remaining.reduce((total, row) => total.plus(row.value), new Decimal(0))
  const percentage = remaining.reduce((total, row) => total.plus(row.percentage), new Decimal(0))
  return [...leading, { label: `Remaining ${remaining.length}`, value: value.toFixed(), percentage: percentage.toFixed() }]
}

interface AllocationRow { readonly label: string; readonly value: string; readonly percentage: string }

export function DashboardPage() {
  const { portfolio, error, isLoading, reload } = usePortfolioView()
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  if (isLoading) return <div className="portfolio-loading"><span className="loader" /><p>Building portfolio view from the ledger…</p></div>
  if (error || !portfolio) return <div className="notice notice-error" role="alert">{error ?? "Portfolio could not be loaded."}</div>
  const stockAllocation = summarizeAllocation(allocationRows(portfolio.openPositions, "symbol"), 10)
  const sectorAllocation = summarizeAllocation(allocationRows(portfolio.openPositions, "sector"), 10)
  const refresh = async () => {
    setRefreshing(true); setRefreshError(null)
    try { await refreshPortfolioMarketData(portfolio.portfolio.id); reload() }
    catch (refreshFailure) { setRefreshError(displayError(refreshFailure)) }
    finally { setRefreshing(false) }
  }
  return <section className="portfolio-page">
    <div className="portfolio-hero"><div><p className="eyebrow">Portfolio overview</p><h1>{portfolio.portfolio.name}</h1><p>Current position structure derived from {portfolio.totals.securityHistories} ACTIVE security histories.</p></div><div className="hero-actions">{isMarketDataEnabled() ? <button className="button button-primary button-compact" disabled={refreshing} onClick={() => void refresh()}>{refreshing ? "Refreshing…" : "Refresh prices"}</button> : null}<Link className="button button-secondary link-button" to="/app/holdings">Explore holdings</Link></div></div>
    {refreshError ? <div className="notice notice-error" role="alert">{refreshError}</div> : null}
    <div className="kpi-grid">
      <Kpi label="Open holdings" value={String(portfolio.totals.openHoldings)} detail={`${portfolio.totals.closedHistories} closed histories retained`} />
      <Kpi label="Calculable Cost Basis" value={formatMoney(portfolio.totals.investedAmount)} detail={`${portfolio.totals.investedCoverage} of ${portfolio.totals.openHoldings} holdings calculable`} />
      <Kpi label="Total Current Market Value" value={formatMoney(portfolio.totals.currentValue)} detail={`${portfolio.totals.priceCoverage} of ${portfolio.totals.openHoldings} priced · ${portfolio.totals.freshPriceCoverage} fresh · ${portfolio.totals.stalePriceCoverage} stale`} />
      <Kpi label="Unrealised P&L" value={formatMoney(portfolio.totals.unrealisedPnl)} detail={portfolio.totals.unrealisedPnl === null ? `Unavailable until cost basis covers all ${portfolio.totals.openHoldings} holdings (${portfolio.totals.investedCoverage} calculable)` : formatPercent(portfolio.totals.unrealisedPnlPercent)} />
      <Kpi label="Realised P&L" value={formatMoney(portfolio.totals.realisedPnl)} detail={`${portfolio.totals.realisedCoverage} of ${portfolio.totals.closedHistories} histories calculable`} />
    </div>
    <section className="quality-strip" aria-label="Portfolio data quality"><Quality label="Missing transaction dates" value={portfolio.quality.holdingsWithMissingDates} /><Quality label="Missing broker attribution" value={portfolio.quality.holdingsWithMissingBrokers} /><Quality label="Missing prices" value={portfolio.quality.holdingsWithMissingPrices} /><Quality label="Stale prices" value={portfolio.quality.holdingsWithStalePrices} /></section>
    <div className="dashboard-grid"><AllocationPanel title="Allocation by stock" rows={stockAllocation} empty="Live prices are required before stock weights can be calculated." /><AllocationPanel title="Allocation by sector" rows={sectorAllocation} empty="Trusted sector classifications are not yet available for every holding." /></div>
    <section className="panel methodology-panel"><div><p className="eyebrow">Calculation integrity</p><h2>Evidence before estimates</h2></div><p>Quantities use ACTIVE ledger transactions. Cost is shown only for complete buy-only histories. No FIFO, missing prices, dates, brokers, charges, or taxes are inferred.</p></section>
  </section>
}

function Kpi({ label, value, detail }: { readonly label: string; readonly value: string; readonly detail: string }) {
  return <article className="kpi-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}
function Quality({ label, value }: { readonly label: string; readonly value: number }) {
  return <div><span className={value ? "quality-dot quality-warn" : "quality-dot"} /><strong>{value}</strong><span>{label}</span></div>
}
function AllocationPanel({ title, rows, empty }: { readonly title: string; readonly rows: readonly AllocationRow[]; readonly empty: string }) {
  return <section className="panel allocation-panel"><div className="panel-heading"><div><h2>{title}</h2><p>Based on priced market value; top positions are grouped for readability.</p></div></div>{rows.length ? <div className="allocation-list">{rows.map((row) => <div key={row.label}><div><strong>{row.label}</strong><span>{new Decimal(row.percentage).toDecimalPlaces(2).toFixed(2)}% · {formatMoney(row.value)}</span></div><div className="allocation-track"><span style={{ width: `${Decimal.min(100, Decimal.max(0, row.percentage)).toFixed()}%` }} /></div></div>)}</div> : <div className="data-empty"><strong>Not yet available</strong><p>{empty}</p><span>Stage 4 price provider ready</span></div>}</section>
}
