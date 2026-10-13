import { useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import "./ResultsPage.css"
import { resultsDemoModel } from "./fixtures"
import type { QuarterlyMetric, QuarterlyResultSummary, ResultSecurity, ResultStrength } from "./types"

type PositionFilter = "ALL" | "CURRENT" | "CLOSED"
type StrengthFilter = ResultStrength | "NEW"

interface TooltipState {
  readonly result: QuarterlyResultSummary
  readonly security: ResultSecurity
  readonly x: number
  readonly y: number
}

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 })

function formatPercent(value: number | null) {
  if (value === null) return "—"
  return `${value > 0 ? "+" : ""}${number.format(value)}%`
}

function formatMetric(metric: QuarterlyMetric) {
  if (metric.value === null) return "—"
  if (metric.unit === "INR_CRORE") return `₹${number.format(metric.value)} Cr`
  if (metric.unit === "INR") return `₹${number.format(metric.value)}`
  return `${number.format(metric.value)}%`
}

function statusLabel(strength: ResultStrength) {
  if (strength === "UNAVAILABLE") return "Not Available"
  return strength[0] + strength.slice(1).toLowerCase()
}

function statusClass(strength: ResultStrength) {
  return `result-${strength.toLowerCase()}`
}

function ResultTooltip({ tooltip }: { readonly tooltip: TooltipState }) {
  const pat = tooltip.result.metrics.find((metric) => metric.id === "pat")
  const eps = tooltip.result.metrics.find((metric) => metric.id === "eps")
  const period = resultsDemoModel.periods.find((item) => item.id === tooltip.result.periodId)
  const left = Math.min(tooltip.x, Math.max(12, window.innerWidth - 286))
  const top = Math.min(tooltip.y, Math.max(12, window.innerHeight - 224))

  return createPortal(
    <div className="results-tooltip" role="tooltip" style={{ left, top }}>
      <strong>{tooltip.security.symbol} — {period?.label}</strong>
      <span className={`results-tooltip-status ${statusClass(tooltip.result.strength)}`}>
        <i aria-hidden="true" /> {statusLabel(tooltip.result.strength)}
      </span>
      <dl>
        <div><dt>{tooltip.result.primaryMetricLabel} YoY</dt><dd>{formatPercent(tooltip.result.primaryMetricYoY)}</dd></div>
        <div><dt>PAT YoY</dt><dd>{formatPercent(pat?.yoyPercent ?? null)}</dd></div>
        <div><dt>EPS</dt><dd>{eps ? formatMetric(eps) : "—"}</dd></div>
      </dl>
      <small>Click for full analysis →</small>
    </div>,
    document.body,
  )
}

function QuarterlyMetricChart({ result }: { readonly result: QuarterlyResultSummary }) {
  const security = resultsDemoModel.securities.find((item) => item.id === result.securityId)
  const reversedPeriods = [...resultsDemoModel.periods].reverse()
  const series = reversedPeriods.map((period) => security?.results.find((item) => item.periodId === period.id)?.metrics.find((metric) => metric.id === "pat")?.value ?? null)
  const max = Math.max(...series.map((value) => Math.abs(value ?? 0)), 1)

  return (
    <section className="results-card results-chart-card" aria-label="PAT last six quarters">
      <div className="results-card-heading"><div><h3>PAT — Last 6 Quarters</h3><span>(₹ Crore)</span></div></div>
      <div className="results-bars">
        {series.map((value, index) => {
          const period = reversedPeriods[index]
          if (!period) return null
          const height = value === null ? 8 : Math.max(12, Math.round((Math.abs(value) / max) * 88))
          return (
            <div className="results-bar-item" key={period.id}>
              <strong>{value === null ? "—" : number.format(value)}</strong>
              <div className="results-bar-track"><i style={{ height: `${height}%` }} /></div>
              <span>{period.label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function PositionCard({ security }: { readonly security: ResultSecurity }) {
  const position = security.position
  return (
    <section className="results-card position-card">
      <div className="results-card-heading"><h3>Portfolio Position</h3><span className="position-state">{position.status === "OPEN" ? "Open Position" : "Closed Position"}</span></div>
      <dl>
        <div><dt>Shares</dt><dd>{number.format(position.quantity)}</dd></div>
        <div><dt>Avg. Cost</dt><dd>{position.averageCost === null ? "—" : currency.format(position.averageCost)}</dd></div>
        <div><dt>Current Price</dt><dd>{position.currentPrice === null ? "—" : currency.format(position.currentPrice)}</dd></div>
        <div><dt>Current Value</dt><dd>{position.currentValue === null ? "—" : currency.format(position.currentValue)}</dd></div>
        <div><dt>{position.status === "OPEN" ? "Unrealised P&L" : "Realised P&L"}</dt><dd className={position.pnl !== null && position.pnl >= 0 ? "financial-positive" : "financial-negative"}>{position.pnl === null ? "—" : `${position.pnl > 0 ? "+" : ""}${currency.format(position.pnl)}${position.pnlPercent === null ? "" : ` (${formatPercent(position.pnlPercent)})`}`}</dd></div>
        <div><dt>Allocation</dt><dd>{position.allocationPercent === null ? "—" : `${number.format(position.allocationPercent)}%`}</dd></div>
      </dl>
    </section>
  )
}

function MetricsTable({ result }: { readonly result: QuarterlyResultSummary }) {
  return (
    <section className="results-card metrics-card">
      <div className="results-card-heading"><h3>Key Metrics ({resultsDemoModel.periods.find((item) => item.id === result.periodId)?.label})</h3></div>
      <div className="metrics-table-wrap">
        <table className="metrics-table">
          <thead><tr><th>Metric</th><th>Reported</th><th>QoQ</th><th>YoY</th></tr></thead>
          <tbody>{result.metrics.map((metric) => <tr key={metric.id}><td>{metric.label}</td><td>{formatMetric(metric)}</td><td>{formatPercent(metric.qoqPercent)}</td><td>{formatPercent(metric.yoyPercent)}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  )
}

function InsightCard({ security, result }: { readonly security: ResultSecurity; readonly result: QuarterlyResultSummary }) {
  return (
    <section className="results-card insight-card">
      <div className="results-card-heading"><h3>✦ AI Insight</h3><span className="demo-chip">Demo</span></div>
      <div className="insight-summary">
        <p>{security.symbol} demonstration insight for the selected quarter. No live AI inference is running in R1.</p>
        <strong>Thesis impact: Presentation only</strong>
      </div>
      <ul>
        <li>Main financial observation: {result.primaryMetricLabel} YoY {formatPercent(result.primaryMetricYoY)}.</li>
        <li>Positive developments and concerns will be evidence-grounded in later stages.</li>
        <li>Evidence confidence: demonstration fixture only.</li>
      </ul>
    </section>
  )
}

export function ResultsPage() {
  const [query, setQuery] = useState("")
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("ALL")
  const [industry, setIndustry] = useState("ALL")
  const [strengthFilters, setStrengthFilters] = useState<Set<StrengthFilter>>(new Set())
  const [selected, setSelected] = useState<{ securityId: string; periodId: string } | null>({ securityId: "tcs", periodId: "q2-fy27" })
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const analysisRef = useRef<HTMLDivElement>(null)

  const industries = useMemo(() => [...new Set(resultsDemoModel.securities.map((security) => security.industry))].sort(), [])
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return resultsDemoModel.securities.filter((security) => {
      if (normalized && !`${security.symbol} ${security.name}`.toLowerCase().includes(normalized)) return false
      if (positionFilter !== "ALL" && security.positionKind !== positionFilter) return false
      if (industry !== "ALL" && security.industry !== industry) return false
      if (strengthFilters.size > 0) {
        const hasMatchingResult = security.results.some((result) =>
          strengthFilters.has(result.strength) || (strengthFilters.has("NEW") && result.newlyReported),
        )
        if (!hasMatchingResult) return false
      }
      return true
    })
  }, [industry, positionFilter, query, strengthFilters])

  const selectedSecurity = selected ? resultsDemoModel.securities.find((item) => item.id === selected.securityId) ?? null : null
  const selectedResult = selectedSecurity && selected ? selectedSecurity.results.find((item) => item.periodId === selected.periodId) ?? null : null

  const toggleStrength = (filter: StrengthFilter) => {
    setStrengthFilters((current) => {
      const next = new Set(current)
      if (next.has(filter)) next.delete(filter)
      else next.add(filter)
      return next
    })
  }

  const clearFilters = () => {
    setQuery("")
    setPositionFilter("ALL")
    setIndustry("ALL")
    setStrengthFilters(new Set())
  }

  const selectResult = (security: ResultSecurity, result: QuarterlyResultSummary) => {
    if (!result.available) return
    setSelected({ securityId: security.id, periodId: result.periodId })
    window.requestAnimationFrame(() => analysisRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }))
  }

  const showTooltip = (event: React.SyntheticEvent<HTMLButtonElement>, security: ResultSecurity, result: QuarterlyResultSummary) => {
    if (!result.available) return
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltip({ security, result, x: rect.right + 10, y: rect.top - 12 })
  }

  const rowHeight = 48
  const overscan = 4
  const viewportRows = 10
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const end = Math.min(filtered.length, start + viewportRows + overscan * 2)
  const visible = filtered.slice(start, end)

  return (
    <section className="results-page" aria-labelledby="results-title">
      <header className="results-page-header">
        <div>
          <h1 id="results-title">Results</h1>
          <p>Quarterly and annual company performance for all current and closed portfolio positions.</p>
        </div>
        <section className="results-collection-status" aria-label="Results collection status">
          <div><span>Last scan</span><strong>Not configured</strong><small>Daily scan begins in R6</small></div>
          <div><span>New results</span><strong>—</strong><small>Demo UI only</small></div>
          <div><span>Coverage</span><strong>Current + Closed</strong><small>Production universe in R3</small></div>
          <button type="button" disabled title="Authenticated scan action is not implemented until R6">↻ Run Scan Now</button>
        </section>
      </header>

      <div className="results-tabs" role="tablist" aria-label="Result period views">
        <button className="active" role="tab" aria-selected="true" type="button">Quarterly Results</button>
        <button role="tab" aria-selected="false" type="button" disabled>Annual Results <span>Coming Later</span></button>
      </div>

      <section className="results-workspace">
        <div className="results-demo-banner" role="status"><strong>R1 DEMO DATA</strong><span>Illustrative fixtures only. No company result on this page is live or persisted.</span></div>
        <div className="results-filter-bar">
          <label className="results-search"><span className="sr-only">Search stocks</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stocks…" /></label>
          {(["ALL", "CURRENT", "CLOSED"] as const).map((filter) => <button key={filter} type="button" className={positionFilter === filter ? "active" : ""} onClick={() => setPositionFilter(filter)}>{filter === "ALL" ? "All Stocks" : filter === "CURRENT" ? "Current Holdings" : "Closed Positions"}</button>)}
          <label className="industry-filter"><span className="sr-only">Industry</span><select value={industry} onChange={(event) => setIndustry(event.target.value)}><option value="ALL">All Industries</option>{industries.map((item) => <option key={item}>{item}</option>)}</select></label>
          {(["STRONG", "MIXED", "WEAK", "UNAVAILABLE", "NEW"] as const).map((filter) => <button key={filter} type="button" className={strengthFilters.has(filter) ? "active" : ""} onClick={() => toggleStrength(filter)}><i className={filter === "NEW" ? "filter-dot result-new" : `filter-dot ${statusClass(filter)}`} aria-hidden="true" />{filter === "NEW" ? "Newly Reported" : statusLabel(filter)}</button>)}
          <button type="button" className="clear-filter" onClick={clearFilters}>Clear Filters</button>
        </div>

        <div className="results-matrix-shell" onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)} tabIndex={0} aria-label="Scrollable quarterly results matrix">
          <table className="results-matrix">
            <thead><tr><th className="stock-column"><span>{filtered.length} stocks</span>Stock</th>{resultsDemoModel.periods.map((period) => <th key={period.id}>{period.label}{period.latest ? <small>(Latest) ↓</small> : null}</th>)}</tr></thead>
            <tbody>
              {start > 0 ? <tr className="virtual-spacer"><td colSpan={resultsDemoModel.periods.length + 1} style={{ height: start * rowHeight }} /></tr> : null}
              {visible.map((security) => <tr key={security.id}><th className="stock-column" scope="row">{security.symbol}<small>{security.industry}</small></th>{resultsDemoModel.periods.map((period) => {
                const result = security.results.find((item) => item.periodId === period.id)
                if (!result) return <td key={period.id}><span className="result-pill result-unavailable">—</span></td>
                const isSelected = selected?.securityId === security.id && selected?.periodId === period.id
                return <td key={period.id}><button type="button" className={`result-pill ${statusClass(result.strength)} ${isSelected ? "selected" : ""}`} aria-pressed={isSelected} onMouseEnter={(event) => showTooltip(event, security, result)} onMouseLeave={() => setTooltip(null)} onFocus={(event) => showTooltip(event, security, result)} onBlur={() => setTooltip(null)} onPointerDown={(event) => { if (event.pointerType === "touch") showTooltip(event, security, result) }} onClick={() => selectResult(security, result)} disabled={!result.available}><i aria-hidden="true" />{result.newlyReported ? "New" : result.available ? `${result.primaryMetricLabel} ${formatPercent(result.primaryMetricYoY)}` : "—"}{result.newlyReported ? <b aria-label="Newly reported" /> : null}</button></td>
              })}</tr>)}
              {end < filtered.length ? <tr className="virtual-spacer"><td colSpan={resultsDemoModel.periods.length + 1} style={{ height: (filtered.length - end) * rowHeight }} /></tr> : null}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? <div className="results-empty">No demonstration securities match the current filters.</div> : null}

        {selectedSecurity && selectedResult ? <div ref={analysisRef} className="selected-analysis">
          <div className="selected-analysis-heading">
            <div><h2>{selectedSecurity.symbol} — {resultsDemoModel.periods.find((item) => item.id === selectedResult.periodId)?.label}</h2><span className={`analysis-status ${statusClass(selectedResult.strength)}`}><i aria-hidden="true" />{statusLabel(selectedResult.strength)}</span><span className="demo-chip">Demo fixture</span></div>
            <div className="analysis-actions"><button type="button" disabled>NSE Filing ↗</button><button type="button" disabled>Company IR ↗</button><button type="button" onClick={() => setSelected(null)}>Collapse</button></div>
          </div>
          <div className="analysis-grid"><PositionCard security={selectedSecurity} /><QuarterlyMetricChart result={selectedResult} /><MetricsTable result={selectedResult} /><InsightCard security={selectedSecurity} result={selectedResult} /></div>
        </div> : null}

        <footer className="results-footnote">ⓘ This R1 page uses isolated demonstration fixtures. Live portfolio accounting, quarterly financial evidence, source links and daily collection are wired only in later authorized Results stages.</footer>
      </section>
      {tooltip ? <ResultTooltip tooltip={tooltip} /> : null}
    </section>
  )
}
