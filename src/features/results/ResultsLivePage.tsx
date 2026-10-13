import { useEffect, useMemo, useState } from "react"
import { usePortfolioView } from "../portfolio/usePortfolioView"
import { formatMoney, formatQuantity } from "../portfolio/format"
import type { PortfolioPosition } from "../portfolio/types"
import { loadResultsSourceInventory } from "./resultsSourceRepository"
import type { ResultsSourceObservation } from "./resultsSourceRepository"
import "./ResultsPage.css"

interface Period { readonly end: string; readonly label: string }
type Filter = "ALL" | "CURRENT" | "CLOSED"
interface Entry { readonly position: PortfolioPosition; readonly kind: "CURRENT" | "CLOSED" }

function periodsThroughLastCompletedQuarter(): Period[] {
  const today = new Date()
  const year = today.getUTCFullYear()
  const month = today.getUTCMonth() + 1
  const last = Math.floor((month - 1) / 3) * 3
  const lastYear = last === 0 ? year - 1 : year
  const lastMonth = last === 0 ? 12 : last
  const periods: Period[] = []
  for (let yr = 2025; yr <= lastYear; yr++) {
    for (const m of [3, 6, 9, 12]) {
      if (yr === 2025 && m < 3) continue
      if (yr === lastYear && m > lastMonth) continue
      const end = new Date(Date.UTC(yr, m, 0)).toISOString().slice(0, 10)
      const fy = m === 3 ? yr : yr + 1
      const quarter = m === 3 ? 4 : m / 3
      periods.push({ end, label: `Q${quarter} FY${String(fy).slice(-2)}` })
    }
  }
  return periods.reverse()
}

const LABELS: Readonly<Record<string, string>> = {
  OPERATING_REVENUE_QUARTER: "Operating revenue",
  OPERATING_PROFIT_QUARTER: "Operating profit",
  ADVANCES_GROWTH_YOY: "Advances growth YoY",
  DEPOSITS_GROWTH_YOY: "Deposits growth YoY",
}
const isBank = (position: PortfolioPosition) => /bank/i.test(position.industry ?? "")
function evidenceForPeriod(rows: readonly ResultsSourceObservation[], securityId: string, end: string) {
  return rows.filter((row) => row.securityId === securityId && row.periodEnd === end)
}

export function ResultsLivePage() {
  const { portfolio, isLoading: portfolioLoading, error: portfolioError } = usePortfolioView()
  const [observations, setObservations] = useState<readonly ResultsSourceObservation[]>([])
  const [loadingEvidence, setLoadingEvidence] = useState(true)
  const [evidenceError, setEvidenceError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("ALL")
  const [industry, setIndustry] = useState("ALL")
  const [selected, setSelected] = useState<{ id: string; end: string } | null>(null)
  const periods = useMemo(() => periodsThroughLastCompletedQuarter(), [])

  const positions = useMemo((): Entry[] => {
    if (!portfolio) return []
    const combined = [...portfolio.openPositions.map((position) => ({ position, kind: "CURRENT" as const })),
      ...portfolio.closedPositions.map((position) => ({ position, kind: "CLOSED" as const }))]
    const byId = new Map<string, Entry>()
    for (const entry of combined) {
      if (entry.position.assetClass !== "EQUITY") continue
      if (!byId.has(entry.position.securityId) || entry.kind === "CURRENT") byId.set(entry.position.securityId, entry)
    }
    return [...byId.values()].sort((a, b) => a.position.symbol.localeCompare(b.position.symbol))
  }, [portfolio])

  useEffect(() => {
    if (!portfolio) return
    let active = true
    const ids = positions.map(({ position }) => position.securityId)
    void loadResultsSourceInventory(ids).then((rows) => {
      if (active) { setObservations(rows); setEvidenceError(null) }
    }).catch((error: unknown) => {
      if (active) setEvidenceError(error instanceof Error ? error.message : "Financial evidence could not be loaded")
    }).finally(() => { if (active) setLoadingEvidence(false) })
    return () => { active = false }
  }, [portfolio, positions])

  const industries = useMemo(() => [...new Set(positions.map(({ position }) => position.industry ?? "Unclassified"))].sort(), [positions])
  const filtered = useMemo(() => positions.filter(({ position, kind }) =>
    (filter === "ALL" || filter === kind)
    && (industry === "ALL" || (position.industry ?? "Unclassified") === industry)
    && (!query.trim() || `${position.symbol} ${position.company}`.toLowerCase().includes(query.trim().toLowerCase()))
  ), [positions, filter, industry, query])
  const chosen = selected ? filtered.find(({ position }) => position.securityId === selected.id) ?? null : null
  const chosenSources = selected ? evidenceForPeriod(observations, selected.id, selected.end) : []
  const selectedSources = chosenSources.filter((source) => source.selected)
  const unselectedCount = chosenSources.length - selectedSources.length
  const selectedPeriod = periods.find((period) => period.end === selected?.end)
  const selectedRevenue = chosen && selectedPeriod
    ? selectedSources.find((source) => source.code === (isBank(chosen.position) ? "ADVANCES_GROWTH_YOY" : "OPERATING_REVENUE_QUARTER"))
    : null

  if (portfolioLoading) return <section className="results-page"><p role="status">Loading transaction-derived portfolio…</p></section>
  if (portfolioError || !portfolio) return <section className="results-page"><div role="alert" className="notice notice-error">Portfolio could not be loaded: {portfolioError ?? "Unknown error"}</div></section>

  return <section className="results-page" aria-labelledby="results-live-title">
    <header className="results-page-header">
      <div><h1 id="results-live-title">Results</h1><p>Quarterly observations · transaction-derived current and closed equities</p></div>
      <div className="results-collection-status">
        <div><span>Financial scan</span><strong>Not configured</strong><small>R6</small></div>
        <div><span>Evidence</span><strong>{loadingEvidence ? "Loading" : evidenceError ? "Unavailable" : "Read-only"}</strong><small>R3</small></div>
        <div><span>Universe</span><strong>{positions.length} equities</strong><small>Current + exited</small></div>
        <button type="button" disabled>Run Scan Now</button>
      </div>
    </header>
    <div className="results-tabs"><button type="button" className="active">Quarterly Results</button><button type="button" disabled>Annual Results · Later</button></div>
    <section className="results-workspace">
      <div className="results-demo-banner" role="status"><strong>LIVE PORTFOLIO · EVIDENCE-GATED</strong><span>Only independently selected quarter observations can display numeric results. Missing or pending evidence is not estimated.</span></div>
      <div className="results-filter-bar">
        <label className="results-search"><span className="sr-only">Search stocks</span><input placeholder="Search stocks…" value={query} onChange={(e) => setQuery(e.target.value)}/></label>
        {(["ALL", "CURRENT", "CLOSED"] as const).map((f) => <button key={f} type="button" className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>{f === "ALL" ? "All Stocks" : f === "CURRENT" ? "Current Holdings" : "Closed Positions"}</button>)}
        <label className="industry-filter"><span className="sr-only">Industry</span><select value={industry} onChange={(e) => setIndustry(e.target.value)}><option value="ALL">All Industries</option>{industries.map((item) => <option key={item}>{item}</option>)}</select></label>
        <button type="button" className="clear-filter" onClick={() => { setQuery(""); setFilter("ALL"); setIndustry("ALL") }}>Clear Filters</button>
      </div>
      {evidenceError ? <div role="alert" className="notice notice-error">Financial evidence unavailable: {evidenceError}. Portfolio membership is still shown; no financial values have been inferred.</div> : null}
      <p className="r2-scroll-hint">Newer quarters appear on the left. Scroll horizontally for older quarters. Select a stock-quarter for qualified evidence and portfolio position.</p>
      <div className="results-matrix-shell" tabIndex={0} aria-label="Quarterly results, newest quarter first">
        <table className="results-matrix">
          <thead><tr><th className="stock-column">{filtered.length} equities</th>{periods.map((period) => <th key={period.end}>{period.label}</th>)}</tr></thead>
          <tbody>{filtered.map(({ position, kind }) => <tr key={position.securityId}>
            <th className="stock-column" scope="row">{position.symbol}<small>{position.industry ?? "Unclassified"} · {kind === "CURRENT" ? "Current" : "Closed"}</small></th>
            {periods.map((period) => {
              const candidate = evidenceForPeriod(observations, position.securityId, period.end)
              const selectedEvidence = candidate.find((row) => row.selected)
              const pending = candidate.some((row) => !row.selected)
              const isSelected = selected?.id === position.securityId && selected.end === period.end
              return <td key={period.end}>
                <button type="button" className={`result-pill ${isSelected ? "selected" : ""} ${selectedEvidence ? "result-mixed" : "result-unavailable"}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelected({ id: position.securityId, end: period.end })}>
                  {loadingEvidence ? "Loading…" : selectedEvidence ? "Source selected" : pending ? "Review required" : "No result"}
                </button>
              </td>
            })}
          </tr>)}</tbody>
        </table>
      </div>
      {filtered.length === 0 ? <div className="results-empty">No matching equity positions.</div> : null}
      {chosen && selectedPeriod ? <div className="selected-analysis">
        <div className="selected-analysis-heading"><div><h2>{chosen.position.symbol} — {selectedPeriod.label}</h2><span className="demo-chip">Evidence status explicit</span></div>
          <div className="analysis-actions"><button onClick={() => setSelected(null)} type="button">Collapse</button></div></div>
        <div className="analysis-grid">
          <section className="results-card position-card"><h3>Canonical portfolio position</h3><dl>
            <div><dt>Position</dt><dd>{chosen.kind === "CURRENT" ? "Open" : "Fully closed"}</dd></div>
            <div><dt>Quantity</dt><dd>{formatQuantity(chosen.position.quantity)}</dd></div>
            <div><dt>Average cost</dt><dd>{chosen.position.averageCost === null ? "—" : formatMoney(chosen.position.averageCost, portfolio.portfolio.currency)}</dd></div>
            <div><dt>Current value</dt><dd>{chosen.position.currentValue === null ? "—" : formatMoney(chosen.position.currentValue, portfolio.portfolio.currency)}</dd></div>
            <div><dt>Unrealised P&L</dt><dd>{chosen.position.unrealisedPnl === null ? "—" : formatMoney(chosen.position.unrealisedPnl, portfolio.portfolio.currency)}</dd></div>
            <div><dt>Realised P&L</dt><dd>{chosen.position.realisedPnl === null ? "—" : formatMoney(chosen.position.realisedPnl, portfolio.portfolio.currency)}</dd></div>
          </dl></section>
          <section className="results-card metrics-card"><h3>Qualified quarterly metrics</h3>
            {selectedSources.length === 0 ? <p>No selected quarterly financial observation is available for this company and quarter.</p> :
              <table className="metrics-table"><thead><tr><th>Metric</th><th>Reported</th></tr></thead><tbody>
                {selectedSources.map((row) => <tr key={row.id}><th>{LABELS[row.code] ?? row.code}</th><td>{row.value} {row.unit}</td></tr>)}
              </tbody></table>}
            {selectedRevenue ? <p className="r2-help">Primary observation: {LABELS[selectedRevenue.code]}</p> : null}
            {unselectedCount > 0 ? <p className="r2-help">{unselectedCount} source observation(s) awaiting selection — not displayed as qualified figures.</p> : null}
          </section>
          <section className="results-card r2-evidence-card"><h3>Source & quality</h3><dl>
            <div><dt>Reporting period end</dt><dd>{selectedPeriod.end}</dd></div>
            <div><dt>Qualified observations</dt><dd>{selectedSources.length}</dd></div>
            <div><dt>Selection pending</dt><dd>{unselectedCount}</dd></div>
            <div><dt>Basis</dt><dd>{selectedSources[0]?.scope ?? "Not verified"}</dd></div>
            <div><dt>Original publication</dt><dd>{selectedSources[0]?.publishedAt ?? "Unknown"}</dd></div>
            <div><dt>Source</dt><dd>{selectedSources[0]?.source ?? "Not qualified"}</dd></div>
          </dl></section>
          <section className="results-card insight-card"><h3>Research interpretation</h3>
            <p>Not assessed. Results visibility does not imply V1-4 research READY status or an investment recommendation.</p>
          </section>
        </div>
      </div> : null}
      <footer className="results-footnote">Source: canonical transaction-derived Portfolio view and selected Supabase fundamental observations. R2 demonstration calculations and Strong/Mixed/Weak thresholds are not used. Large historical objects remain external; R3 performs no Cloudflare R2 writes.</footer>
    </section>
  </section>
}
