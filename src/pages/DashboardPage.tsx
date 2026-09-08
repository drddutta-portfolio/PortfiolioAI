import Decimal from "decimal.js"
import { useState } from "react"
import { Link } from "react-router-dom"
import { isMarketDataEnabled, refreshPortfolioMarketData } from "../data/marketDataRepository"
import { displayError } from "../lib/displayError"
import { enrichmentAllocation } from "../features/enrichment/allocation"
import { usePortfolioEnrichment } from "../features/enrichment/usePortfolioEnrichment"
import { formatMoney, formatPercent } from "../features/portfolio/format"
import type { PortfolioPosition, PortfolioViewModel } from "../features/portfolio/types"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"

function allocationRows(positions: readonly PortfolioPosition[], key: "symbol" | "sector" | "role" | "assetClass") {
  const valued = positions.filter((position) => position.currentValue !== null)
  const total = valued.reduce((sum, position) => sum.plus(position.currentValue ?? "0"), new Decimal(0))
  if (total.isZero()) return []
  const groups = new Map<string, Decimal>()
  valued.forEach((position) => {
    const label = key === "sector" ? position.sector ?? "Sector unavailable" : key === "role" ? (position.role === "UNCLASSIFIED" ? "Unclassified" : position.role) : key === "assetClass" ? position.assetClass : position.symbol
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
  const enrichment = usePortfolioEnrichment(portfolio?.openPositions.map((position) => position.securityId) ?? [])
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  if (isLoading) return <div className="portfolio-loading"><span className="loader" /><p>Building portfolio view from the ledger…</p></div>
  if (error || !portfolio) return <div className="notice notice-error" role="alert">{error ?? "Portfolio could not be loaded."}</div>
  const stockAllocation = summarizeAllocation(allocationRows(portfolio.openPositions, "symbol"), 10)
  const sectorAllocation = summarizeAllocation(enrichmentAllocation(portfolio.openPositions, enrichment.bySecurityId, "sector"), 10)
  const marketCapAllocation = enrichmentAllocation(portfolio.openPositions, enrichment.bySecurityId, "marketCap")
  const roleAllocation = allocationRows(portfolio.openPositions, "role")
  const assetAllocation = allocationRows(portfolio.openPositions, "assetClass")
  const unpriced = portfolio.openPositions.filter((position) => position.currentValue === null).map((position) => position.symbol)
  const completePrices = portfolio.totals.priceCoverage === portfolio.totals.openHoldings
  const ranked = portfolio.openPositions.filter((position) => position.unrealisedPnlPercent !== null)
    .sort((left, right) => new Decimal(right.unrealisedPnlPercent ?? 0).comparedTo(left.unrealisedPnlPercent ?? 0))
  const winners = ranked.filter((position) => new Decimal(position.unrealisedPnlPercent ?? 0).gte(0)).slice(0, 30)
  const laggards = [...ranked].reverse().filter((position) => new Decimal(position.unrealisedPnlPercent ?? 0).lt(0)).slice(0, 30)
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
      <Kpi label="Calculable Cost Basis" value={formatMoney(portfolio.totals.investedAmount)} detail={`${portfolio.totals.accountingCoverage} of ${portfolio.totals.openHoldings} open holdings covered · all histories: ${portfolio.totals.fifoAccountingHistories} FIFO, ${portfolio.totals.averageCostAccountingHistories} average cost, ${portfolio.totals.unresolvedAccountingHistories} unresolved`} />
      <Kpi label={completePrices ? "Total Current Market Value" : "Priced Market Value (partial)"} value={formatMoney(portfolio.totals.pricedMarketValue)} detail={`${portfolio.totals.priceCoverage} of ${portfolio.totals.openHoldings} priced · ${portfolio.totals.freshPriceCoverage} fresh · ${portfolio.totals.stalePriceCoverage} stale${unpriced.length ? ` · Unpriced: ${unpriced.join(", ")}` : ""}`} />
      <Kpi label={portfolio.totals.unrealisedPnl === null ? "Covered Unrealised P&L (partial)" : "Unrealised P&L"} value={formatMoney(portfolio.totals.unrealisedPnl ?? portfolio.totals.coveredUnrealisedPnl)} secondaryValue={formatSignedPercent(portfolio.totals.unrealisedPnl === null ? portfolio.totals.coveredUnrealisedPnlPercent : portfolio.totals.unrealisedPnlPercent)} detail={portfolio.totals.unrealisedPnl === null ? `${portfolio.totals.unrealisedCoverage} of ${portfolio.totals.openHoldings} holdings included; this is not complete portfolio P&L` : "All open holdings covered"} />
      <Kpi label="Supported realised P&L (covered)" value={formatMoney(portfolio.totals.realisedPnl)} detail={`${portfolio.totals.realisedCoverage} of ${portfolio.totals.realisedEligibleHistories} disposal histories covered; basis and unknown-charge quality are disclosed`} />
    </div>
    <section className="quality-strip" aria-label="Portfolio data quality"><Quality label="Missing transaction dates" value={portfolio.quality.holdingsWithMissingDates} /><Quality label="Missing broker attribution" value={portfolio.quality.holdingsWithMissingBrokers} /><Quality label="Missing prices" value={portfolio.quality.holdingsWithMissingPrices} /><Quality label="Stale prices" value={portfolio.quality.holdingsWithStalePrices} /></section>
    {!completePrices ? <div className="notice notice-warning"><strong>Portfolio valuation is incomplete.</strong> Allocation percentages below use only the {portfolio.totals.priceCoverage} priced holdings and must not be read as complete portfolio weights.</div> : null}
    {enrichment.error ? <div className="notice notice-warning"><strong>Stored enrichment could not be loaded.</strong> {enrichment.error} Portfolio accounting and price views remain available.</div> : null}
    <div className="dashboard-grid"><AllocationPanel title="Allocation by portfolio role" rows={roleAllocation} empty="Trusted prices are required before role allocation can be calculated." partial={!completePrices} /><AllocationPanel title="Allocation by asset class" rows={assetAllocation} empty="Trusted prices are required before asset allocation can be calculated." partial={!completePrices} /><AllocationPanel title="Allocation by stock" rows={stockAllocation} empty="Trusted prices are required before stock weights can be calculated." partial={!completePrices} /><AllocationPanel title="Trusted sector allocation" rows={enrichment.state === "LOADING" ? [] : sectorAllocation} empty={enrichment.state === "LOADING" ? "Loading stored enrichment…" : "Trusted prices and selected sector evidence are required."} partial={!completePrices || enrichment.state !== "AVAILABLE"} status={enrichment.state} /><AllocationPanel title="Market-cap category allocation" rows={enrichment.state === "LOADING" ? [] : marketCapAllocation} empty={enrichment.state === "LOADING" ? "Loading stored enrichment…" : "A trusted full-market-cap rank is required for equity classification."} partial={!completePrices || enrichment.state !== "AVAILABLE"} status={enrichment.state} /></div>
    <BrokerAnalytics rows={portfolio.brokerAnalytics} />
    <PerformanceRanking winners={winners} laggards={laggards} total={portfolio.openPositions.length} />
    <section className="panel methodology-panel"><div><p className="eyebrow">Calculation integrity</p><h2>Evidence before estimates</h2></div><p>Quantities use the effective ACTIVE ledger. FIFO is used where chronology is provable; deterministic weighted-average cost is used where chronology is incomplete. Combined supported totals disclose this mixed basis. Imported snapshots, unknown charges, dates and prices are never invented or promoted into accounting truth.</p></section>
  </section>
}

function BrokerAnalytics({ rows }: { readonly rows: PortfolioViewModel["brokerAnalytics"] }) {
  const max = Decimal.max(1, ...rows.map((row) => new Decimal(row.currentValue ?? 0)))
  return <section className="panel analytics-panel"><div className="panel-heading"><div><p className="eyebrow">Deterministic account evidence</p><h2>Broker performance and exposure</h2><p>Each broker/demat account is calculated independently. Missing attribution remains in Unknown / Unattributed; unsupported histories are excluded, not reassigned.</p></div></div>
    <div className="broker-chart" aria-label="Broker current-value comparison">{rows.map((row) => <div key={row.broker}><span>{row.broker}</span><div><i style={{ width: `${new Decimal(row.currentValue ?? 0).div(max).times(100).toFixed()}%` }} /></div><strong>{formatMoney(row.currentValue)}</strong></div>)}</div>
    <div className="table-scroll"><table className="analytics-table"><thead><tr><th>Broker / account</th><th>Supported cost</th><th>Current value</th><th>Unrealised</th><th>Realised</th><th>Total supported P&amp;L</th><th>Return</th><th>Coverage</th></tr></thead><tbody>{rows.map((row) => <tr key={row.broker}><td>{row.broker}</td><td>{formatMoney(row.investedAmount)}</td><td>{formatMoney(row.currentValue)}</td><td>{formatMoney(row.unrealisedPnl)}</td><td>{formatMoney(row.realisedPnl)}</td><td>{formatMoney(row.supportedPnl)}</td><td>{formatPercent(row.returnPercent)}</td><td>{row.coveredHistories}/{row.totalHistories} · {row.fifoHistories} FIFO · {row.averageCostHistories} average · {row.unresolvedHistories} unresolved</td></tr>)}</tbody></table></div>
  </section>
}

function PerformanceRanking({ winners, laggards, total }: { readonly winners: readonly PortfolioPosition[]; readonly laggards: readonly PortfolioPosition[]; readonly total: number }) {
  const visible = [...winners, ...laggards]
  const max = Decimal.max(1, ...visible.map((position) => new Decimal(position.unrealisedPnlPercent ?? 0).abs()))
  return <section className="panel analytics-panel"><div className="panel-heading"><div><p className="eyebrow">Supported deterministic accounting</p><h2>Best 30 / Worst 30 unrealised return</h2><p>{visible.length} ranked of {total} open holdings using each history's disclosed FIFO or average-cost basis. Imported snapshot returns are not mixed into this chart.</p></div><span className="coverage-badge">{rankedCoverage(winners, laggards)} covered</span></div>
    {visible.length ? <div className="performance-chart">{winners.map((position) => <PerformanceBar key={`win-${position.securityId}`} position={position} max={max} kind="winner" />)}{laggards.map((position) => <PerformanceBar key={`loss-${position.securityId}`} position={position} max={max} kind="laggard" />)}</div> : <div className="data-empty"><strong>Not yet available</strong><p>Supported FIFO or average-cost accounting and a trusted current price are required.</p></div>}
  </section>
}
function rankedCoverage(winners: readonly PortfolioPosition[], laggards: readonly PortfolioPosition[]) { return winners.length + laggards.length }
function PerformanceBar({ position, max, kind }: { readonly position: PortfolioPosition; readonly max: Decimal; readonly kind: "winner" | "laggard" }) {
  const value = new Decimal(position.unrealisedPnlPercent ?? 0)
  return <div className={`performance-bar ${kind}`} title={`${position.symbol}: ${formatPercent(value.toFixed())}`}><span>{formatPercent(value.toFixed())}</span><i style={{ height: `${Decimal.max(3, value.abs().div(max).times(100)).toFixed()}%` }} /><strong>{position.symbol}</strong></div>
}

function Kpi({ label, value, secondaryValue, detail }: { readonly label: string; readonly value: string; readonly secondaryValue?: string; readonly detail: string }) {
  return <article className="kpi-card"><span>{label}</span><strong>{value}</strong>{secondaryValue ? <b className="kpi-secondary-value">{secondaryValue}</b> : null}<small>{detail}</small></article>
}
function formatSignedPercent(value: string | null) {
  if (value === null) return "Unavailable"
  const decimal = new Decimal(value)
  return `${decimal.gt(0) ? "+" : ""}${formatPercent(value)}`
}
function Quality({ label, value }: { readonly label: string; readonly value: number }) {
  return <div><span className={value ? "quality-dot quality-warn" : "quality-dot"} /><strong>{value}</strong><span>{label}</span></div>
}
function AllocationPanel({ title, rows, empty, partial, status }: { readonly title: string; readonly rows: readonly AllocationRow[]; readonly empty: string; readonly partial: boolean; readonly status?: string }) {
  return <section className="panel allocation-panel"><div className="panel-heading"><div><h2>{title}</h2><p>Based on {partial ? "the priced subset or partial evidence" : "complete priced market value"}; unavailable evidence remains visible in the denominator.</p></div>{status ? <span className="coverage-badge">{status.replace("_", " ")}</span> : partial ? <span className="coverage-badge">Partial coverage</span> : null}</div>{rows.length ? <div className="allocation-list">{rows.map((row) => <div key={row.label}><div><strong>{row.label}</strong><span>{new Decimal(row.percentage).toDecimalPlaces(2).toFixed(2)}% · {formatMoney(row.value)}</span></div><div className="allocation-track"><span style={{ width: `${Decimal.min(100, Decimal.max(0, row.percentage)).toFixed()}%` }} /></div></div>)}</div> : <div className="data-empty"><strong>Not yet available</strong><p>{empty}</p><span>Trusted stored evidence required</span></div>}</section>
}
