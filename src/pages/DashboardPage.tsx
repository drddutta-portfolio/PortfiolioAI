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
import "./DashboardDesign.css"

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
  const pricedCoveragePercent = portfolio.totals.openHoldings ? new Decimal(portfolio.totals.priceCoverage).div(portfolio.totals.openHoldings).times(100).toDecimalPlaces(0).toFixed() : "0"
  const accountingCoveragePercent = portfolio.totals.openHoldings ? new Decimal(portfolio.totals.accountingCoverage).div(portfolio.totals.openHoldings).times(100).toDecimalPlaces(0).toFixed() : "0"
  const leadWinner = winners[0] ?? null
  const leadLaggard = laggards[0] ?? null
  const largestPosition = stockAllocation[0] ?? null

  const refresh = async () => {
    setRefreshing(true); setRefreshError(null)
    try { await refreshPortfolioMarketData(portfolio.portfolio.id); reload() }
    catch (refreshFailure) { setRefreshError(displayError(refreshFailure)) }
    finally { setRefreshing(false) }
  }

  return <section className="portfolio-page dashboard-command-centre">
    <header className="dashboard-command-header">
      <div>
        <p className="eyebrow">PortfolioAI command centre</p>
        <h1>{portfolio.portfolio.name}</h1>
        <p>Executive view of portfolio value, allocation, supported performance and data quality from {portfolio.totals.securityHistories} active security histories.</p>
      </div>
      <div className="dashboard-command-actions">
        <span className={`dashboard-coverage-pill ${completePrices ? "is-complete" : "is-partial"}`}><i />{portfolio.totals.priceCoverage}/{portfolio.totals.openHoldings} priced</span>
        {isMarketDataEnabled() ? <button className="button button-primary button-compact" disabled={refreshing} onClick={() => void refresh()}>{refreshing ? "Refreshing…" : "Refresh prices"}</button> : null}
        <Link className="button button-secondary link-button button-compact" to="/app/holdings">Open holdings</Link>
      </div>
    </header>

    {refreshError ? <div className="notice notice-error" role="alert">{refreshError}</div> : null}

    <section className="dashboard-kpi-strip" aria-label="Portfolio summary">
      <Kpi icon="₹" label="Current value" value={formatMoney(portfolio.totals.pricedMarketValue)} detail={completePrices ? "Complete priced portfolio value" : `${portfolio.totals.priceCoverage}/${portfolio.totals.openHoldings} holdings priced`} />
      <Kpi icon="◫" label="Calculable cost basis" value={formatMoney(portfolio.totals.investedAmount)} detail={`${portfolio.totals.accountingCoverage}/${portfolio.totals.openHoldings} open holdings covered`} />
      <Kpi icon="↗" label={portfolio.totals.unrealisedPnl === null ? "Covered unrealised P&L" : "Unrealised P&L"} value={formatMoney(portfolio.totals.unrealisedPnl ?? portfolio.totals.coveredUnrealisedPnl)} secondaryValue={formatSignedPercent(portfolio.totals.unrealisedPnl === null ? portfolio.totals.coveredUnrealisedPnlPercent : portfolio.totals.unrealisedPnlPercent)} detail={portfolio.totals.unrealisedPnl === null ? `${portfolio.totals.unrealisedCoverage}/${portfolio.totals.openHoldings} holdings included` : "All open holdings covered"} />
      <Kpi icon="✓" label="Supported realised P&L" value={formatMoney(portfolio.totals.realisedPnl)} detail={`${portfolio.totals.realisedCoverage}/${portfolio.totals.realisedEligibleHistories} disposal histories covered`} />
      <Kpi icon="#" label="Open holdings" value={String(portfolio.totals.openHoldings)} detail={`${portfolio.totals.closedHistories} closed histories retained`} />
    </section>

    <div className="dashboard-primary-grid">
      <section className="dashboard-focus-panel">
        <div className="dashboard-section-heading">
          <div><p className="eyebrow">Portfolio pulse</p><h2>What deserves a quick look?</h2><p>Current supported return leaders and portfolio concentration, using existing deterministic accounting and trusted CMP only.</p></div>
          <Link to="/app/holdings">View all holdings →</Link>
        </div>
        <div className="dashboard-pulse-grid">
          <PulseCard tone="positive" label="Strongest supported return" position={leadWinner} />
          <PulseCard tone="negative" label="Weakest supported return" position={leadLaggard} />
          <article className="dashboard-pulse-card neutral">
            <span className="dashboard-pulse-icon">◔</span><small>Largest priced position</small>
            <strong>{largestPosition?.label ?? "Unavailable"}</strong>
            <b>{largestPosition ? `${new Decimal(largestPosition.percentage).toDecimalPlaces(2).toFixed(2)}%` : "—"}</b>
            <p>{largestPosition ? formatMoney(largestPosition.value) : "Trusted price coverage is required."}</p>
          </article>
        </div>
        {!completePrices ? <div className="dashboard-inline-warning"><strong>Valuation remains partial.</strong><span>{unpriced.length ? ` Unpriced: ${unpriced.join(", ")}.` : " Some holdings are unpriced."} Allocation percentages use the priced subset.</span></div> : null}
      </section>

      <aside className="dashboard-health-panel">
        <div className="dashboard-section-heading compact"><div><p className="eyebrow">Data health</p><h2>Coverage & quality</h2></div></div>
        <CoverageMeter label="Price coverage" value={pricedCoveragePercent} detail={`${portfolio.totals.freshPriceCoverage} fresh · ${portfolio.totals.stalePriceCoverage} stale`} />
        <CoverageMeter label="Accounting coverage" value={accountingCoveragePercent} detail={`${portfolio.totals.fifoAccountingHistories} FIFO · ${portfolio.totals.averageCostAccountingHistories} average`} />
        <div className="dashboard-quality-list">
          <Quality label="Missing transaction dates" value={portfolio.quality.holdingsWithMissingDates} />
          <Quality label="Missing broker attribution" value={portfolio.quality.holdingsWithMissingBrokers} />
          <Quality label="Missing prices" value={portfolio.quality.holdingsWithMissingPrices} />
          <Quality label="Stale prices" value={portfolio.quality.holdingsWithStalePrices} />
        </div>
        <div className="dashboard-quick-links">
          <Link to="/app/research">Research coverage <span>→</span></Link>
          <Link to="/app/structure">Portfolio structure <span>→</span></Link>
          <Link to="/app/transactions">Transactions <span>→</span></Link>
        </div>
      </aside>
    </div>

    {enrichment.error ? <div className="notice notice-warning"><strong>Stored enrichment could not be loaded.</strong> {enrichment.error} Portfolio accounting and price views remain available.</div> : null}

    <section className="dashboard-allocation-section">
      <div className="dashboard-section-heading"><div><p className="eyebrow">Portfolio structure</p><h2>Allocation overview</h2><p>Role, sector and market-cap views from the same portfolio value base, with partial evidence explicitly disclosed.</p></div><Link to="/app/structure">Manage structure →</Link></div>
      <div className="dashboard-allocation-grid">
        <AllocationPanel title="By portfolio role" rows={roleAllocation} empty="Trusted prices are required before role allocation can be calculated." partial={!completePrices} />
        <AllocationPanel title="By trusted sector" rows={enrichment.state === "LOADING" ? [] : sectorAllocation} empty={enrichment.state === "LOADING" ? "Loading stored enrichment…" : "Trusted prices and selected sector evidence are required."} partial={!completePrices || enrichment.state !== "AVAILABLE"} status={enrichment.state} />
        <AllocationPanel title="By market-cap category" rows={enrichment.state === "LOADING" ? [] : marketCapAllocation} empty={enrichment.state === "LOADING" ? "Loading stored enrichment…" : "A trusted full-market-cap rank is required for equity classification."} partial={!completePrices || enrichment.state !== "AVAILABLE"} status={enrichment.state} />
      </div>
      <details className="dashboard-secondary-allocation">
        <summary>More allocation views <span>Asset class and top stock weights</span></summary>
        <div className="dashboard-allocation-grid two-column">
          <AllocationPanel title="By asset class" rows={assetAllocation} empty="Trusted prices are required before asset allocation can be calculated." partial={!completePrices} />
          <AllocationPanel title="By stock" rows={stockAllocation} empty="Trusted prices are required before stock weights can be calculated." partial={!completePrices} />
        </div>
      </details>
    </section>

    <BrokerAnalytics rows={portfolio.brokerAnalytics} />
    <PerformanceRanking winners={winners} laggards={laggards} total={portfolio.openPositions.length} />

    <details className="dashboard-methodology">
      <summary>Calculation integrity & evidence policy</summary>
      <div><p className="eyebrow">Calculation integrity</p><h2>Evidence before estimates</h2><p>Quantities use the effective ACTIVE ledger. FIFO is used where chronology is provable; deterministic weighted-average cost is used where chronology is incomplete. Combined supported totals disclose this mixed basis. Imported snapshots, unknown charges, dates and prices are never invented or promoted into accounting truth.</p></div>
    </details>
  </section>
}

function PulseCard({ tone, label, position }: { readonly tone: "positive" | "negative"; readonly label: string; readonly position: PortfolioPosition | null }) {
  return <article className={`dashboard-pulse-card ${tone}`}>
    <span className="dashboard-pulse-icon">{tone === "positive" ? "↗" : "↘"}</span><small>{label}</small>
    {position ? <><Link to={`/app/research/${position.securityId}`}>{position.symbol}</Link><b>{formatSignedPercent(position.unrealisedPnlPercent)}</b><p>{position.company}</p></> : <><strong>Unavailable</strong><b>—</b><p>Supported accounting and a trusted current price are required.</p></>}
  </article>
}

function CoverageMeter({ label, value, detail }: { readonly label: string; readonly value: string; readonly detail: string }) {
  const width = Decimal.min(100, Decimal.max(0, value)).toFixed()
  return <div className="dashboard-coverage-meter"><div><span>{label}</span><strong>{value}%</strong></div><div className="dashboard-meter-track"><i style={{ width: `${width}%` }} /></div><small>{detail}</small></div>
}

function BrokerAnalytics({ rows }: { readonly rows: PortfolioViewModel["brokerAnalytics"] }) {
  const max = Decimal.max(1, ...rows.map((row) => new Decimal(row.currentValue ?? 0)))
  return <section className="panel analytics-panel dashboard-analytics-panel"><div className="panel-heading"><div><p className="eyebrow">Broker / demat exposure</p><h2>Account performance and exposure</h2><p>Each broker/demat account is calculated independently. Missing attribution remains in Unknown / Unattributed; unsupported histories are excluded, not reassigned.</p></div></div>
    <div className="broker-chart" aria-label="Broker current-value comparison">{rows.map((row) => <div key={row.broker}><span>{row.broker}</span><div><i style={{ width: `${new Decimal(row.currentValue ?? 0).div(max).times(100).toFixed()}%` }} /></div><strong>{formatMoney(row.currentValue)}</strong></div>)}</div>
    <div className="table-scroll"><table className="analytics-table"><thead><tr><th>Broker / account</th><th>Supported cost</th><th>Current value</th><th>Unrealised</th><th>Realised</th><th>Total supported P&amp;L</th><th>Return</th><th>Coverage</th></tr></thead><tbody>{rows.map((row) => <tr key={row.broker}><td>{row.broker}</td><td>{formatMoney(row.investedAmount)}</td><td>{formatMoney(row.currentValue)}</td><td>{formatMoney(row.unrealisedPnl)}</td><td>{formatMoney(row.realisedPnl)}</td><td>{formatMoney(row.supportedPnl)}</td><td>{formatPercent(row.returnPercent)}</td><td>{row.coveredHistories}/{row.totalHistories} · {row.fifoHistories} FIFO · {row.averageCostHistories} average · {row.unresolvedHistories} unresolved</td></tr>)}</tbody></table></div>
  </section>
}

function PerformanceRanking({ winners, laggards, total }: { readonly winners: readonly PortfolioPosition[]; readonly laggards: readonly PortfolioPosition[]; readonly total: number }) {
  const visible = [...winners, ...laggards]
  const max = Decimal.max(1, ...visible.map((position) => new Decimal(position.unrealisedPnlPercent ?? 0).abs()))
  return <section className="panel analytics-panel dashboard-analytics-panel"><div className="panel-heading"><div><p className="eyebrow">Supported position performance</p><h2>Best 30 / Worst 30 unrealised return</h2><p>{visible.length} ranked of {total} open holdings using each history&apos;s disclosed FIFO or average-cost basis. Imported snapshot returns are not mixed into this chart.</p></div><span className="coverage-badge">{rankedCoverage(winners, laggards)} covered</span></div>
    {visible.length ? <div className="performance-chart">{winners.map((position) => <PerformanceBar key={`win-${position.securityId}`} position={position} max={max} kind="winner" />)}{laggards.map((position) => <PerformanceBar key={`loss-${position.securityId}`} position={position} max={max} kind="laggard" />)}</div> : <div className="data-empty"><strong>Not yet available</strong><p>Supported FIFO or average-cost accounting and a trusted current price are required.</p></div>}
  </section>
}
function rankedCoverage(winners: readonly PortfolioPosition[], laggards: readonly PortfolioPosition[]) { return winners.length + laggards.length }
function PerformanceBar({ position, max, kind }: { readonly position: PortfolioPosition; readonly max: Decimal; readonly kind: "winner" | "laggard" }) {
  const value = new Decimal(position.unrealisedPnlPercent ?? 0)
  return <div className={`performance-bar ${kind}`} title={`${position.symbol}: ${formatPercent(value.toFixed())}`}><span>{formatPercent(value.toFixed())}</span><i style={{ height: `${Decimal.max(3, value.abs().div(max).times(100)).toFixed()}%` }} /><strong>{position.symbol}</strong></div>
}

function Kpi({ icon, label, value, secondaryValue, detail }: { readonly icon: string; readonly label: string; readonly value: string; readonly secondaryValue?: string; readonly detail: string }) {
  return <article className="dashboard-kpi-card"><span className="dashboard-kpi-icon" aria-hidden="true">{icon}</span><div><span>{label}</span><strong>{value}</strong>{secondaryValue ? <b className="kpi-secondary-value">{secondaryValue}</b> : null}<small>{detail}</small></div></article>
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
  return <section className="panel allocation-panel dashboard-allocation-card"><div className="panel-heading"><div><h2>{title}</h2><p>{partial ? "Priced subset / partial evidence" : "Complete priced market value"}</p></div>{status ? <span className="coverage-badge">{status.replace("_", " ")}</span> : partial ? <span className="coverage-badge">Partial</span> : null}</div>{rows.length ? <div className="allocation-list">{rows.map((row) => <div key={row.label}><div><strong>{row.label}</strong><span>{new Decimal(row.percentage).toDecimalPlaces(2).toFixed(2)}% · {formatMoney(row.value)}</span></div><div className="allocation-track"><span style={{ width: `${Decimal.min(100, Decimal.max(0, row.percentage)).toFixed()}%` }} /></div></div>)}</div> : <div className="data-empty"><strong>Not yet available</strong><p>{empty}</p><span>Trusted stored evidence required</span></div>}</section>
}
