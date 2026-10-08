import Decimal from "decimal.js"
import { useState } from "react"
import { Link } from "react-router-dom"
import { P7CanonicalIntelligencePanel } from "../components/P7CanonicalIntelligencePanel"
import { isMarketDataEnabled, refreshPortfolioMarketData } from "../data/marketDataRepository"
import { displayError } from "../lib/displayError"
import { enrichmentAllocation } from "../features/enrichment/allocation"
import { usePortfolioEnrichment } from "../features/enrichment/usePortfolioEnrichment"
import { financialClass, financialTone, formatMoney, formatPercent } from "../features/portfolio/format"
import type { PortfolioPosition, PortfolioRole, PortfolioViewModel } from "../features/portfolio/types"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import "./DashboardDesign.css"

interface AllocationRow { readonly label: string; readonly value: string; readonly percentage: string }
interface SumResult { readonly value: string | null; readonly coverage: number }
type SignedTone = "positive" | "negative" | "neutral"

const ROLE_SCOPE_ORDER: readonly PortfolioRole[] = ["CORE", "SATELLITE", "THEMATIC", "ETF", "OTHER", "UNCLASSIFIED"]
const DONUT_COLORS = ["#2d6a4f", "#74a57f", "#b7d39b", "#557c93", "#c8a96b", "#8a7b9d", "#9aa6a0"] as const

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

function sumPositionField(positions: readonly PortfolioPosition[], field: "currentValue" | "investedAmount" | "unrealisedPnl" | "realisedPnl"): SumResult {
  let total = new Decimal(0)
  let coverage = 0
  positions.forEach((position) => {
    const value = position[field]
    if (value === null) return
    total = total.plus(value)
    coverage += 1
  })
  return { value: coverage ? total.toFixed() : null, coverage }
}

function scopedUnrealisedReturn(positions: readonly PortfolioPosition[]) {
  let pnl = new Decimal(0)
  let cost = new Decimal(0)
  let coverage = 0
  positions.forEach((position) => {
    if (position.unrealisedPnl === null || position.investedAmount === null) return
    pnl = pnl.plus(position.unrealisedPnl)
    cost = cost.plus(position.investedAmount)
    coverage += 1
  })
  return { value: coverage && !cost.isZero() ? pnl.div(cost).times(100).toFixed() : null, coverage }
}

function positionsForScope(positions: readonly PortfolioPosition[], scopeKey: string) {
  if (scopeKey === "ALL") return positions
  if (scopeKey.startsWith("ROLE:")) {
    const role = scopeKey.slice(5) as PortfolioRole
    return positions.filter((position) => position.role === role)
  }
  if (scopeKey.startsWith("THEME:")) {
    const themeId = scopeKey.slice(6)
    return positions.filter((position) => position.themes.some((theme) => theme.id === themeId))
  }
  return positions
}

function scopeLabel(scopeKey: string, portfolio: PortfolioViewModel) {
  if (scopeKey === "ALL") return portfolio.portfolio.name
  if (scopeKey.startsWith("ROLE:")) {
    const role = scopeKey.slice(5)
    return role === "UNCLASSIFIED" ? "Unclassified holdings" : `${title(role)} holdings`
  }
  if (scopeKey.startsWith("THEME:")) {
    const themeId = scopeKey.slice(6)
    return portfolio.themes.find((theme) => theme.id === themeId)?.name ?? "Theme"
  }
  return portfolio.portfolio.name
}

function portfolioWeight(position: PortfolioPosition) {
  return position.portfolioWeightPercent === null ? null : new Decimal(position.portfolioWeightPercent)
}

function positionScopeWeight(position: PortfolioPosition, scopedValue: string | null) {
  if (position.currentValue === null || scopedValue === null) return null
  const denominator = new Decimal(scopedValue)
  if (denominator.isZero()) return null
  return new Decimal(position.currentValue).div(denominator).times(100)
}

function signedTone(value: string | null): SignedTone {
  const tone = financialTone(value)
  if (tone === "gain") return "positive"
  if (tone === "loss") return "negative"
  return "neutral"
}

export function DashboardPage() {
  const { portfolio, error, isLoading, reload } = usePortfolioView()
  const enrichment = usePortfolioEnrichment(portfolio?.openPositions.map((position) => position.securityId) ?? [])
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [scopeKey, setScopeKey] = useState("ALL")

  if (isLoading) return <div className="portfolio-loading"><span className="loader" /><p>Building portfolio view from the ledger…</p></div>
  if (error || !portfolio) return <div className="notice notice-error" role="alert">{error ?? "Portfolio could not be loaded."}</div>

  const scopedPositions = positionsForScope(portfolio.openPositions, scopeKey)
  const selectedScopeLabel = scopeLabel(scopeKey, portfolio)
  const isConsolidated = scopeKey === "ALL"
  const scopedCurrent = sumPositionField(scopedPositions, "currentValue")
  const scopedCost = sumPositionField(scopedPositions, "investedAmount")
  const scopedUnrealised = sumPositionField(scopedPositions, "unrealisedPnl")
  const scopedRealised = sumPositionField(scopedPositions, "realisedPnl")
  const scopedReturn = scopedUnrealisedReturn(scopedPositions)
  const scopedFreshPrices = scopedPositions.filter((position) => position.currentValue !== null && !position.isPriceStale).length
  const scopedStalePrices = scopedPositions.filter((position) => position.currentValue !== null && position.isPriceStale).length
  const scopedMissingDates = scopedPositions.filter((position) => position.hasMissingDates).length
  const scopedMissingBrokers = scopedPositions.filter((position) => position.hasMissingBrokers).length
  const scopedMissingPrices = scopedPositions.filter((position) => position.currentValue === null).length
  const completePrices = scopedCurrent.coverage === scopedPositions.length
  const pricedCoveragePercent = scopedPositions.length ? new Decimal(scopedCurrent.coverage).div(scopedPositions.length).times(100).toDecimalPlaces(0).toFixed() : "0"
  const accountingCoveragePercent = scopedPositions.length ? new Decimal(scopedCost.coverage).div(scopedPositions.length).times(100).toDecimalPlaces(0).toFixed() : "0"

  const stockAllocation = summarizeAllocation(allocationRows(scopedPositions, "symbol"), 10)
  const sectorAllocation = summarizeAllocation(enrichmentAllocation(scopedPositions, enrichment.bySecurityId, "sector"), 10)
  const marketCapAllocation = enrichmentAllocation(scopedPositions, enrichment.bySecurityId, "marketCap")
  const roleAllocation = allocationRows(scopedPositions, "role")
  const assetAllocation = allocationRows(scopedPositions, "assetClass")
  const unpriced = scopedPositions.filter((position) => position.currentValue === null).map((position) => position.symbol)

  const ranked = scopedPositions.filter((position) => position.unrealisedPnlPercent !== null)
    .sort((left, right) => new Decimal(right.unrealisedPnlPercent ?? 0).comparedTo(left.unrealisedPnlPercent ?? 0))
  const winners = ranked.filter((position) => new Decimal(position.unrealisedPnlPercent ?? 0).gte(0)).slice(0, 10)
  const laggards = [...ranked].reverse().filter((position) => new Decimal(position.unrealisedPnlPercent ?? 0).lt(0)).slice(0, 10)
  const leadWinner = winners[0] ?? null
  const leadLaggard = laggards[0] ?? null
  const largestPosition = stockAllocation[0] ?? null

  const sizingEligiblePositions = scopedPositions.filter((position) => position.assetClass !== "ETF")
  const sizedPositions = [...sizingEligiblePositions]
    .filter((position) => position.currentValue !== null)
    .sort((left, right) => new Decimal(right.currentValue ?? 0).comparedTo(left.currentValue ?? 0))
    .slice(0, 10)
  const contributors = [...scopedPositions]
    .filter((position) => position.unrealisedPnl !== null && new Decimal(position.unrealisedPnl).gt(0))
    .sort((left, right) => new Decimal(right.unrealisedPnl ?? 0).comparedTo(left.unrealisedPnl ?? 0))
    .slice(0, 10)
  const detractors = [...scopedPositions]
    .filter((position) => position.unrealisedPnl !== null && new Decimal(position.unrealisedPnl).lt(0))
    .sort((left, right) => new Decimal(left.unrealisedPnl ?? 0).comparedTo(right.unrealisedPnl ?? 0))
    .slice(0, 10)

  const refresh = async () => {
    setRefreshing(true); setRefreshError(null)
    try { await refreshPortfolioMarketData(portfolio.portfolio.id); reload() }
    catch (refreshFailure) { setRefreshError(displayError(refreshFailure)) }
    finally { setRefreshing(false) }
  }

  const kpiCurrentValue = isConsolidated ? portfolio.totals.pricedMarketValue : scopedCurrent.value
  const kpiCostBasis = isConsolidated ? portfolio.totals.investedAmount : scopedCost.value
  const kpiUnrealised = isConsolidated ? (portfolio.totals.unrealisedPnl ?? portfolio.totals.coveredUnrealisedPnl) : scopedUnrealised.value
  const kpiUnrealisedPercent = isConsolidated ? (portfolio.totals.unrealisedPnl === null ? portfolio.totals.coveredUnrealisedPnlPercent : portfolio.totals.unrealisedPnlPercent) : scopedReturn.value
  const kpiRealised = isConsolidated ? portfolio.totals.realisedPnl : scopedRealised.value

  return <section className="portfolio-page dashboard-command-centre">
    <header className="dashboard-command-header">
      <div className="dashboard-scope-copy">
        <p className="eyebrow">PortfolioAI command centre</p>
        <label className="dashboard-scope-selector">
          <span>Portfolio scope</span>
          <select value={scopeKey} onChange={(event) => setScopeKey(event.target.value)} aria-label="Portfolio scope">
            <option value="ALL">{portfolio.portfolio.name}</option>
            <optgroup label="Portfolio roles">
              {ROLE_SCOPE_ORDER.filter((role) => portfolio.openPositions.some((position) => position.role === role)).map((role) => <option key={role} value={`ROLE:${role}`}>{role === "UNCLASSIFIED" ? "Unclassified" : title(role)}</option>)}
            </optgroup>
            {portfolio.themes.some((theme) => theme.isActive) ? <optgroup label="Themes">
              {portfolio.themes.filter((theme) => theme.isActive).map((theme) => <option key={theme.id} value={`THEME:${theme.id}`}>{theme.name}</option>)}
            </optgroup> : null}
          </select>
        </label>
        <p>{isConsolidated ? `Executive view of ${portfolio.totals.securityHistories} active security histories.` : `${scopedPositions.length} current holding${scopedPositions.length === 1 ? "" : "s"} in ${selectedScopeLabel}. All values below are scoped where the underlying evidence supports it.`}</p>
      </div>
      <div className="dashboard-command-actions">
        <span className={`dashboard-coverage-pill ${completePrices ? "is-complete" : "is-partial"}`}><i />{scopedCurrent.coverage}/{scopedPositions.length} priced</span>
        {isMarketDataEnabled() ? <button className="button button-primary button-compact" disabled={refreshing} onClick={() => void refresh()}>{refreshing ? "Refreshing…" : "Refresh prices"}</button> : null}
        <Link className="button button-secondary link-button button-compact" to="/app/holdings">Open holdings</Link>
        <Link className="button button-secondary link-button button-compact" to="/app/intelligence">Open intelligence</Link>
      </div>
    </header>

    {refreshError ? <div className="notice notice-error" role="alert">{refreshError}</div> : null}

    <section id="dashboard-summary" className="dashboard-kpi-strip dashboard-section-anchor" aria-label="Portfolio summary">
      <Kpi icon="₹" label={completePrices ? "Current value" : "Priced value"} value={formatMoney(kpiCurrentValue)} detail={`${scopedCurrent.coverage}/${scopedPositions.length} scoped holdings priced`} />
      <Kpi icon="◫" label="Calculable cost basis" value={formatMoney(kpiCostBasis)} detail={`${isConsolidated ? portfolio.totals.accountingCoverage : scopedCost.coverage}/${scopedPositions.length} scoped holdings covered`} />
      <Kpi icon="↗" label={completePrices ? "Unrealised P&L" : "Covered unrealised P&L"} value={formatMoney(kpiUnrealised)} valueClassName={financialClass(kpiUnrealised)} secondaryValue={formatSignedPercent(kpiUnrealisedPercent)} secondaryClassName={financialClass(kpiUnrealisedPercent)} detail={`${isConsolidated ? portfolio.totals.unrealisedCoverage : scopedUnrealised.coverage}/${scopedPositions.length} scoped holdings included`} tone={signedTone(kpiUnrealised)} />
      <Kpi icon="✓" label={isConsolidated ? "Supported realised P&L" : "Scoped realised P&L"} value={formatMoney(kpiRealised)} valueClassName={financialClass(kpiRealised)} detail={isConsolidated ? `${portfolio.totals.realisedCoverage}/${portfolio.totals.realisedEligibleHistories} disposal histories covered` : `${scopedRealised.coverage}/${scopedPositions.length} current scoped holdings with supported realised P&L`} tone={signedTone(kpiRealised)} />
      <Kpi icon="#" label="Open holdings" value={String(scopedPositions.length)} detail={isConsolidated ? `${portfolio.totals.closedHistories} closed histories retained` : selectedScopeLabel} />
    </section>

    <P7CanonicalIntelligencePanel portfolio={portfolio} compact />

    <div className="dashboard-workspace-grid">
      <main className="dashboard-workspace-main">
        <section id="dashboard-pulse" className="dashboard-focus-panel dashboard-section-anchor">
          <div className="dashboard-section-heading">
            <div><p className="eyebrow">Portfolio pulse</p><h2>What deserves a quick look?</h2><p>Supported return leaders and concentration within {selectedScopeLabel}.</p></div>
            <Link to="/app/holdings">View holdings →</Link>
          </div>
          <div className="dashboard-pulse-grid">
            <PulseCard label="Strongest supported return" position={leadWinner} />
            <PulseCard label="Weakest supported return" position={leadLaggard} />
            <article className="dashboard-pulse-card neutral">
              <span className="dashboard-pulse-icon">◔</span><small>Largest priced position</small>
              <strong>{largestPosition?.label ?? "Unavailable"}</strong>
              <b>{largestPosition ? `${new Decimal(largestPosition.percentage).toDecimalPlaces(2).toFixed(2)}%` : "—"}</b>
              <p>{largestPosition ? `${formatMoney(largestPosition.value)} of selected scope` : "Trusted price coverage is required."}</p>
            </article>
          </div>
          {!completePrices ? <div className="dashboard-inline-warning"><strong>Valuation remains partial.</strong><span>{unpriced.length ? ` Unpriced: ${unpriced.join(", ")}.` : " Some holdings are unpriced."} Scope allocation percentages use only priced positions.</span></div> : null}
        </section>

        {enrichment.error ? <div className="notice notice-warning"><strong>Stored enrichment could not be loaded.</strong> {enrichment.error} Portfolio accounting and price views remain available.</div> : null}

        <section id="dashboard-allocation" className="dashboard-allocation-section dashboard-section-anchor">
          <div className="dashboard-section-heading"><div><p className="eyebrow">Portfolio structure</p><h2>Allocation overview</h2><p>Visual allocation for {selectedScopeLabel}; missing evidence stays explicit.</p></div><Link to="/app/structure">Manage structure →</Link></div>
          <div className="dashboard-chart-grid">
            <DonutAllocationPanel title="Portfolio role" rows={roleAllocation} empty="Trusted prices are required before role allocation can be calculated." partial={!completePrices} />
            <BarAllocationPanel title="Trusted sector" rows={enrichment.state === "LOADING" ? [] : sectorAllocation} empty={enrichment.state === "LOADING" ? "Loading stored enrichment…" : "Trusted sector evidence is required."} partial={!completePrices || enrichment.state !== "AVAILABLE"} status={enrichment.state} />
            <DonutAllocationPanel title="Market-cap category" rows={enrichment.state === "LOADING" ? [] : marketCapAllocation} empty={enrichment.state === "LOADING" ? "Loading stored enrichment…" : "A trusted full-market-cap rank is required."} partial={!completePrices || enrichment.state !== "AVAILABLE"} status={enrichment.state} />
          </div>
          <details className="dashboard-secondary-allocation">
            <summary>More allocation views <span>Asset class and top stock weights</span></summary>
            <div className="dashboard-allocation-grid two-column">
              <AllocationPanel title="By asset class" rows={assetAllocation} empty="Trusted prices are required before asset allocation can be calculated." partial={!completePrices} />
              <AllocationPanel title="By stock" rows={stockAllocation} empty="Trusted prices are required before stock weights can be calculated." partial={!completePrices} />
            </div>
          </details>
        </section>

        <div id="dashboard-weights" className="dashboard-section-anchor"><PositionSizingPanel positions={sizedPositions} scopedValue={scopedCurrent.value} scopeLabel={selectedScopeLabel} /></div>

        <section id="dashboard-position-returns" className="dashboard-performance-section dashboard-section-anchor">
          <div className="dashboard-section-heading"><div><p className="eyebrow">Supported position performance</p><h2>Top 10 and Bottom 10</h2><p>Return percentage remains separate from portfolio P&L contribution.</p></div><span className="coverage-badge">{ranked.length}/{scopedPositions.length} ranked</span></div>
          <div className="dashboard-performance-grid">
            <VerticalPerformanceChart title="Top 10 performers" positions={winners} tone="positive" />
            <VerticalPerformanceChart title="Bottom 10 performers" positions={laggards} tone="negative" />
          </div>
        </section>

        <section id="dashboard-contribution" className="dashboard-contribution-section dashboard-section-anchor">
          <div className="dashboard-section-heading"><div><p className="eyebrow">Portfolio impact</p><h2>P&L contributors and detractors</h2><p>Absolute supported unrealised P&L shows which holdings are moving portfolio value—not merely which stocks have the highest percentage return.</p></div></div>
          <div className="dashboard-contribution-grid">
            <PnlContributionList title="Top contributors" positions={contributors} tone="positive" />
            <PnlContributionList title="Top detractors" positions={detractors} tone="negative" />
          </div>
        </section>

        <div id="dashboard-broker" className="dashboard-section-anchor">{isConsolidated ? <BrokerAnalytics rows={portfolio.brokerAnalytics} /> : <ScopedBrokerExposure positions={scopedPositions} scopeLabel={selectedScopeLabel} />}</div>
      </main>

      <aside className="dashboard-insights-rail">
        <section id="dashboard-insights" className="dashboard-key-insights-panel dashboard-section-anchor">
          <div className="dashboard-section-heading compact"><div><p className="eyebrow">Key insights</p><h2>{selectedScopeLabel}</h2></div></div>
          <div className="dashboard-key-insight-list">
            <InsightRow label="Largest position" value={largestPosition?.label ?? "Unavailable"} detail={largestPosition ? `${new Decimal(largestPosition.percentage).toDecimalPlaces(2).toFixed(2)}% of selected priced scope` : "Awaiting price coverage"} />
            <InsightRow label="Strongest return" value={leadWinner?.symbol ?? "Unavailable"} detail={leadWinner ? formatSignedPercent(leadWinner.unrealisedPnlPercent) : "Awaiting supported accounting"} tone={signedTone(leadWinner?.unrealisedPnlPercent ?? null)} />
            <InsightRow label="Weakest return" value={leadLaggard?.symbol ?? "Unavailable"} detail={leadLaggard ? formatSignedPercent(leadLaggard.unrealisedPnlPercent) : "Awaiting supported accounting"} tone={signedTone(leadLaggard?.unrealisedPnlPercent ?? null)} />
            <InsightRow label="Price coverage" value={`${pricedCoveragePercent}%`} detail={`${scopedCurrent.coverage}/${scopedPositions.length} holdings priced`} />
            <InsightRow label="Sizing targets" value={`${sizingEligiblePositions.filter((position) => position.settings.targetWeight !== null).length}/${sizingEligiblePositions.length}`} detail="Non-ETF holdings with a user target weight" />
          </div>
          <div className="dashboard-quick-links">
            <Link to="/app/research">Research coverage <span>→</span></Link>
            <Link to="/app/structure">Portfolio structure <span>→</span></Link>
            <Link to="/app/transactions">Transactions <span>→</span></Link>
          </div>
        </section>

        <section id="dashboard-data-health" className="dashboard-health-panel dashboard-section-anchor">
          <div className="dashboard-section-heading compact"><div><p className="eyebrow">Data health</p><h2>Coverage & quality</h2></div></div>
          <CoverageMeter label="Price coverage" value={pricedCoveragePercent} detail={`${scopedFreshPrices} fresh · ${scopedStalePrices} stale`} />
          <CoverageMeter label="Accounting coverage" value={accountingCoveragePercent} detail={`${scopedCost.coverage}/${scopedPositions.length} scoped holdings`} />
          <div className="dashboard-quality-list">
            <Quality label="Missing transaction dates" value={scopedMissingDates} />
            <Quality label="Missing broker attribution" value={scopedMissingBrokers} />
            <Quality label="Missing prices" value={scopedMissingPrices} />
            <Quality label="Stale prices" value={scopedStalePrices} />
          </div>
        </section>
      </aside>
    </div>

    <details id="dashboard-integrity" className="dashboard-methodology dashboard-section-anchor">
      <summary>Detailed analytics, calculation integrity & evidence policy</summary>
      <div><p className="eyebrow">Calculation integrity</p><h2>Evidence before estimates</h2><p>Quantities use the effective ACTIVE ledger. FIFO is used where chronology is provable; deterministic weighted-average cost is used where chronology is incomplete. Scope filtering changes presentation only: it never creates another portfolio, duplicates transactions, changes roles or mutates financial evidence.</p></div>
    </details>
  </section>
}

function PulseCard({ label, position }: { readonly label: string; readonly position: PortfolioPosition | null }) {
  return <article className={`dashboard-pulse-card ${signedTone(position?.unrealisedPnlPercent ?? null)}`}>
    <span className="dashboard-pulse-icon">{position === null ? "—" : financialTone(position.unrealisedPnlPercent) === "gain" ? "↗" : financialTone(position.unrealisedPnlPercent) === "loss" ? "↘" : "→"}</span><small>{label}</small>
    {position ? <><Link to={`/app/research/${position.securityId}`}>{position.symbol}</Link><b className={financialClass(position.unrealisedPnlPercent)}>{formatSignedPercent(position.unrealisedPnlPercent)}</b><p>{position.company}</p></> : <><strong>Unavailable</strong><b>—</b><p>Supported accounting and a trusted current price are required.</p></>}
  </article>
}

function CoverageMeter({ label, value, detail }: { readonly label: string; readonly value: string; readonly detail: string }) {
  const width = Decimal.min(100, Decimal.max(0, value)).toFixed()
  return <div className="dashboard-coverage-meter"><div><span>{label}</span><strong>{value}%</strong></div><div className="dashboard-meter-track"><i style={{ width: `${width}%` }} /></div><small>{detail}</small></div>
}

function InsightRow({ label, value, detail, tone = "neutral" }: { readonly label: string; readonly value: string; readonly detail: string; readonly tone?: SignedTone }) {
  return <article className={`dashboard-signed-${tone}`}><small>{label}</small><strong>{value}</strong><p>{detail}</p></article>
}

function DonutAllocationPanel({ title: panelTitle, rows, empty, partial, status }: { readonly title: string; readonly rows: readonly AllocationRow[]; readonly empty: string; readonly partial: boolean; readonly status?: string }) {
  let cumulative = new Decimal(0)
  const segments = rows.slice(0, 7).map((row, index) => {
    const start = cumulative
    cumulative = cumulative.plus(row.percentage)
    return `${DONUT_COLORS[index % DONUT_COLORS.length]} ${start.toDecimalPlaces(2).toFixed(2)}% ${cumulative.toDecimalPlaces(2).toFixed(2)}%`
  })
  const background = rows.length ? `conic-gradient(${segments.join(",")})` : "#edf2ef"
  return <section className="dashboard-chart-card">
    <div className="dashboard-chart-card-heading"><div><h3>{panelTitle}</h3><p>{partial ? "Partial / priced evidence" : "Complete priced value"}</p></div>{status ? <span className="coverage-badge">{status.replace("_", " ")}</span> : null}</div>
    {rows.length ? <div className="dashboard-donut-layout"><div className="dashboard-donut" style={{ background }}><div><strong>100%</strong><span>priced scope</span></div></div><div className="dashboard-chart-legend">{rows.slice(0, 7).map((row, index) => <div key={row.label}><i style={{ background: DONUT_COLORS[index % DONUT_COLORS.length] }} /><span>{row.label}</span><strong>{new Decimal(row.percentage).toDecimalPlaces(1).toFixed(1)}%</strong></div>)}</div></div> : <EmptyData text={empty} />}
  </section>
}

function BarAllocationPanel({ title: panelTitle, rows, empty, partial, status }: { readonly title: string; readonly rows: readonly AllocationRow[]; readonly empty: string; readonly partial: boolean; readonly status?: string }) {
  return <section className="dashboard-chart-card">
    <div className="dashboard-chart-card-heading"><div><h3>{panelTitle}</h3><p>{partial ? "Partial / priced evidence" : "Complete priced value"}</p></div>{status ? <span className="coverage-badge">{status.replace("_", " ")}</span> : null}</div>
    {rows.length ? <div className="dashboard-horizontal-bars">{rows.slice(0, 10).map((row) => <div key={row.label}><div><span>{row.label}</span><strong>{new Decimal(row.percentage).toDecimalPlaces(1).toFixed(1)}%</strong></div><div><i style={{ width: `${Decimal.min(100, Decimal.max(0, row.percentage)).toFixed()}%` }} /></div></div>)}</div> : <EmptyData text={empty} />}
  </section>
}

function PositionSizingPanel({ positions, scopedValue, scopeLabel: selectedScopeLabel }: { readonly positions: readonly PortfolioPosition[]; readonly scopedValue: string | null; readonly scopeLabel: string }) {
  return <section className="dashboard-sizing-section">
    <div className="dashboard-section-heading"><div><p className="eyebrow">Owner-configured weights</p><h2>Largest stock positions & weight limits</h2><p>Equity stock positions only—ETFs are intentionally excluded. Current portfolio weight is compared only with your saved target/minimum/maximum settings; this is not an engine sizing recommendation.</p></div><Link to="/app/structure">Edit weight settings →</Link></div>
    {positions.length ? <div className="dashboard-sizing-list">{positions.map((position) => <SizingRow key={position.securityId} position={position} scopedValue={scopedValue} />)}</div> : <EmptyData text={`No non-ETF priced holdings are available in ${selectedScopeLabel}. ETFs are intentionally excluded from position sizing.`} />}
  </section>
}

function SizingRow({ position, scopedValue }: { readonly position: PortfolioPosition; readonly scopedValue: string | null }) {
  const current = portfolioWeight(position)
  const scopeWeight = positionScopeWeight(position, scopedValue)
  const target = position.settings.targetWeight === null ? null : new Decimal(position.settings.targetWeight)
  const minimum = position.settings.minimumWeight === null ? null : new Decimal(position.settings.minimumWeight)
  const maximum = position.settings.maximumWeight === null ? null : new Decimal(position.settings.maximumWeight)
  const scaleCandidate = Decimal.max(current ?? 0, target ?? 0, maximum ?? 0, 5)
  const scale = Decimal.min(100, scaleCandidate.times(1.2))
  const currentLeft = current === null ? null : Decimal.min(100, current.div(scale).times(100)).toFixed()
  const targetLeft = target === null ? null : Decimal.min(100, target.div(scale).times(100)).toFixed()
  const minLeft = minimum === null ? null : Decimal.min(100, minimum.div(scale).times(100)).toFixed()
  const maxLeft = maximum === null ? null : Decimal.min(100, maximum.div(scale).times(100)).toFixed()
  let status = "No owner range"
  if (current !== null && minimum !== null && current.lt(minimum)) status = "Below minimum"
  else if (current !== null && maximum !== null && current.gt(maximum)) status = "Above maximum"
  else if (current !== null && (minimum !== null || maximum !== null)) status = "Within configured range"
  else if (target !== null) status = "Target configured"
  return <article className="dashboard-sizing-row">
    <div className="dashboard-sizing-identity"><Link to={`/app/research/${position.securityId}`}>{position.symbol}</Link><span>{position.company}</span></div>
    <div className="dashboard-sizing-track-wrap">
      <div className="dashboard-sizing-scale"><span>0%</span><span>{scale.toDecimalPlaces(1).toFixed(1)}%</span></div>
      <div className="dashboard-sizing-track">
        {minLeft !== null && maxLeft !== null ? <span className="dashboard-sizing-range" style={{ left: `${minLeft}%`, width: `${Decimal.max(0, new Decimal(maxLeft).minus(minLeft)).toFixed()}%` }} /> : null}
        {targetLeft !== null ? <i className="dashboard-target-marker" style={{ left: `${targetLeft}%` }} title={`Target ${target?.toFixed()}%`} /> : null}
        {currentLeft !== null ? <i className="dashboard-current-marker" style={{ left: `${currentLeft}%` }} title={`Current ${current?.toFixed()}%`} /> : null}
      </div>
    </div>
    <div className="dashboard-sizing-metrics"><span><b>Portfolio</b>{current === null ? "Unavailable" : `${current.toDecimalPlaces(2).toFixed(2)}%`}</span><span><b>Scope share</b>{scopeWeight === null ? "Unavailable" : `${scopeWeight.toDecimalPlaces(2).toFixed(2)}%`}</span><span><b>Target</b>{target === null ? "Not set" : `${target.toFixed()}%`}</span><span><b>Min–max</b>{minimum === null && maximum === null ? "Not set" : `${minimum?.toFixed() ?? "—"}–${maximum?.toFixed() ?? "—"}%`}</span></div>
    <div className="dashboard-sizing-status"><strong>{status}</strong><span>{formatMoney(position.currentValue)}</span></div>
  </article>
}

function VerticalPerformanceChart({ title: chartTitle, positions, tone }: { readonly title: string; readonly positions: readonly PortfolioPosition[]; readonly tone: "positive" | "negative" }) {
  const max = positions.length ? Decimal.max(1, ...positions.map((position) => new Decimal(position.unrealisedPnlPercent ?? 0).abs())) : new Decimal(1)
  return <section className={`dashboard-vertical-chart ${tone}`}><h3>{chartTitle}</h3>{positions.length ? <div className="dashboard-column-chart">{positions.map((position) => {
    const value = new Decimal(position.unrealisedPnlPercent ?? 0)
    const height = Decimal.max(4, value.abs().div(max).times(100)).toFixed()
    return <Link key={position.securityId} to={`/app/research/${position.securityId}`} title={`${position.symbol}: ${formatSignedPercent(position.unrealisedPnlPercent)}`}><span className={financialClass(position.unrealisedPnlPercent)}>{formatSignedPercent(position.unrealisedPnlPercent)}</span><i style={{ height: `${height}%` }} /><strong>{position.symbol}</strong></Link>
  })}</div> : <EmptyData text="No supported positions in this direction." />}</section>
}

function PnlContributionList({ title: listTitle, positions, tone }: { readonly title: string; readonly positions: readonly PortfolioPosition[]; readonly tone: "positive" | "negative" }) {
  const max = positions.length ? Decimal.max(1, ...positions.map((position) => new Decimal(position.unrealisedPnl ?? 0).abs())) : new Decimal(1)
  return <section className={`dashboard-contribution-card ${tone}`}><h3>{listTitle}</h3>{positions.length ? <div>{positions.map((position) => {
    const amount = new Decimal(position.unrealisedPnl ?? 0)
    const width = Decimal.max(3, amount.abs().div(max).times(100)).toFixed()
    return <article key={position.securityId}><div><Link to={`/app/research/${position.securityId}`}>{position.symbol}</Link><span className={financialClass(position.unrealisedPnl)}>{formatMoney(position.unrealisedPnl)}</span></div><div className="dashboard-contribution-track"><i style={{ width: `${width}%` }} /></div><small>{position.portfolioWeightPercent === null ? "Portfolio weight unavailable" : `${new Decimal(position.portfolioWeightPercent).toDecimalPlaces(2).toFixed(2)}% portfolio weight`}</small></article>
  })}</div> : <EmptyData text="No supported positions in this direction." />}</section>
}

function ScopedBrokerExposure({ positions, scopeLabel: selectedScopeLabel }: { readonly positions: readonly PortfolioPosition[]; readonly scopeLabel: string }) {
  const rows = new Map<string, Decimal>()
  positions.forEach((position) => {
    if (position.currentPrice === null || position.brokerExposure === null) return
    position.brokerExposure.forEach((broker) => rows.set(broker.broker, (rows.get(broker.broker) ?? new Decimal(0)).plus(new Decimal(broker.quantity).times(position.currentPrice ?? "0"))))
  })
  const data = [...rows.entries()].map(([broker, value]) => ({ broker, value })).sort((left, right) => right.value.comparedTo(left.value))
  const max = data.length ? Decimal.max(1, ...data.map((row) => row.value)) : new Decimal(1)
  return <section className="panel dashboard-analytics-panel"><div className="panel-heading"><div><p className="eyebrow">Broker / demat exposure</p><h2>Scoped market-value exposure</h2><p>{selectedScopeLabel} uses transaction-derived broker quantities multiplied by the same trusted current price. Detailed broker cost/P&L remains consolidated because per-account scoped cost accounting is not represented in the Dashboard view model.</p></div></div>{data.length ? <div className="broker-chart">{data.map((row) => <div key={row.broker}><span>{row.broker}</span><div><i style={{ width: `${row.value.div(max).times(100).toFixed()}%` }} /></div><strong>{formatMoney(row.value.toFixed())}</strong></div>)}</div> : <EmptyData text="Broker exposure is unavailable for this scope." />}</section>
}

function BrokerAnalytics({ rows }: { readonly rows: PortfolioViewModel["brokerAnalytics"] }) {
  const max = Decimal.max(1, ...rows.map((row) => new Decimal(row.currentValue ?? 0)))
  return <section className="panel analytics-panel dashboard-analytics-panel"><div className="panel-heading"><div><p className="eyebrow">Broker / demat exposure</p><h2>Account performance and exposure</h2><p>Each broker/demat account is calculated independently. Missing attribution remains in Unknown / Unattributed; unsupported histories are excluded, not reassigned.</p></div></div>
    <div className="broker-chart" aria-label="Broker current-value comparison">{rows.map((row) => <div key={row.broker}><span>{row.broker}</span><div><i style={{ width: `${new Decimal(row.currentValue ?? 0).div(max).times(100).toFixed()}%` }} /></div><strong>{formatMoney(row.currentValue)}</strong></div>)}</div>
    <details className="dashboard-broker-details"><summary>Detailed broker accounting</summary><div className="table-scroll"><table className="analytics-table"><thead><tr><th>Broker / account</th><th>Supported cost</th><th>Current value</th><th>Unrealised</th><th>Realised</th><th>Total supported P&amp;L</th><th>Return</th><th>Coverage</th></tr></thead><tbody>{rows.map((row) => <tr key={row.broker}><td>{row.broker}</td><td>{formatMoney(row.investedAmount)}</td><td>{formatMoney(row.currentValue)}</td><td className={financialClass(row.unrealisedPnl)}>{formatMoney(row.unrealisedPnl)}</td><td className={financialClass(row.realisedPnl)}>{formatMoney(row.realisedPnl)}</td><td className={financialClass(row.supportedPnl)}>{formatMoney(row.supportedPnl)}</td><td className={financialClass(row.returnPercent)}>{formatPercent(row.returnPercent)}</td><td>{row.coveredHistories}/{row.totalHistories} · {row.fifoHistories} FIFO · {row.averageCostHistories} average · {row.unresolvedHistories} unresolved</td></tr>)}</tbody></table></div></details>
  </section>
}

function EmptyData({ text }: { readonly text: string }) {
  return <div className="data-empty"><strong>Not yet available</strong><p>{text}</p></div>
}

function Kpi({ icon, label, value, valueClassName, secondaryValue, secondaryClassName, detail, tone = "neutral" }: { readonly icon: string; readonly label: string; readonly value: string; readonly valueClassName?: string; readonly secondaryValue?: string; readonly secondaryClassName?: string; readonly detail: string; readonly tone?: SignedTone }) {
  return <article className={`dashboard-kpi-card dashboard-signed-${tone}`}><span className="dashboard-kpi-icon" aria-hidden="true">{icon}</span><div><span>{label}</span><strong className={valueClassName}>{value}</strong>{secondaryValue ? <b className={`kpi-secondary-value ${secondaryClassName ?? ""}`}>{secondaryValue}</b> : null}<small>{detail}</small></div></article>
}

function formatSignedPercent(value: string | null) {
  if (value === null) return "Unavailable"
  const decimal = new Decimal(value)
  return `${decimal.gt(0) ? "+" : ""}${formatPercent(value)}`
}

function Quality({ label, value }: { readonly label: string; readonly value: number }) {
  return <div><span className={value ? "quality-dot quality-warn" : "quality-dot"} /><strong>{value}</strong><span>{label}</span></div>
}

function AllocationPanel({ title: panelTitle, rows, empty, partial, status }: { readonly title: string; readonly rows: readonly AllocationRow[]; readonly empty: string; readonly partial: boolean; readonly status?: string }) {
  return <section className="panel allocation-panel dashboard-allocation-card"><div className="panel-heading"><div><h2>{panelTitle}</h2><p>{partial ? "Priced subset / partial evidence" : "Complete priced market value"}</p></div>{status ? <span className="coverage-badge">{status.replace("_", " ")}</span> : partial ? <span className="coverage-badge">Partial</span> : null}</div>{rows.length ? <div className="allocation-list">{rows.map((row) => <div key={row.label}><div><strong>{row.label}</strong><span>{new Decimal(row.percentage).toDecimalPlaces(2).toFixed(2)}% · {formatMoney(row.value)}</span></div><div className="allocation-track"><span style={{ width: `${Decimal.min(100, Decimal.max(0, row.percentage)).toFixed()}%` }} /></div></div>)}</div> : <EmptyData text={empty} />}</section>
}

function title(value: string) {
  return value.replaceAll("_", " ").toLocaleLowerCase().replace(/(^|\s)\S/gu, (match) => match.toLocaleUpperCase())
}
