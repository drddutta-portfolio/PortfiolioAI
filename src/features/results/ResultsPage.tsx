import { useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import "./ResultsPage.css"
import { resultsDemoModel } from "./fixtures"
import type { QuarterlyResultSummary, ResultSecurity, ResultStrength } from "./types"
import { ResultsAnalysisDetail } from "./ResultsAnalysisDetail"

type PositionFilter = "ALL" | "CURRENT" | "CLOSED"
type StrengthFilter = ResultStrength | "NEW"

interface TooltipState {
  readonly result: QuarterlyResultSummary
  readonly security: ResultSecurity
  readonly x: number
  readonly y: number
}

const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 })

function formatPercent(value: number | null) {
  if (value === null) return "—"
  return `${value > 0 ? "+" : ""}${number.format(value)}%`
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
        <div><dt>EPS</dt><dd>{eps?.value === null || !eps ? "—" : `₹${number.format(eps.value)}`}</dd></div>
      </dl>
      <small>Click for full analysis →</small>
    </div>,
    document.body,
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
        <div className="results-demo-banner" role="status"><strong>R2 DEMO DATA</strong><span>Illustrative fixtures only. No company result on this page is live or persisted.</span></div>
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
          <ResultsAnalysisDetail security={selectedSecurity} result={selectedResult} periods={resultsDemoModel.periods} />
        </div> : null}

        <footer className="results-footnote">ⓘ This R2 page uses isolated demonstration fixtures. Live portfolio accounting, quarterly financial evidence, source links and daily collection are wired only in later authorized Results stages.</footer>
      </section>
      {tooltip ? <ResultTooltip tooltip={tooltip} /> : null}
    </section>
  )
}
