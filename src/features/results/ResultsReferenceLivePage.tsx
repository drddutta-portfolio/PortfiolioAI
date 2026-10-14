import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { usePortfolioView } from "../portfolio/usePortfolioView"
import { financialClass, formatMoney, formatQuantity } from "../portfolio/format"
import type { PortfolioPosition } from "../portfolio/types"
import { assessQuarterlyPerformance } from "./quarterlyPerformance"
import { loadResultsSourceInventory } from "./resultsSourceRepository"
import { displayQuarterEvidence } from "./quarterlyPresentation"
import { getResultsScanStatus, startResultsScan, stepResultsScan } from "./resultsScanRepository"
import type { ResultsScanStatus } from "./resultsScanRepository"
import type { ResultsSourceObservation } from "./resultsSourceRepository"
import "./ResultsPage.css"
import "./ResultsReference.css"

interface Period { readonly end: string; readonly label: string }
interface Entry { readonly position: PortfolioPosition; readonly kind: "CURRENT" | "CLOSED" }
type PositionFilter = "ALL" | "CURRENT" | "CLOSED"
type StatusFilter = "STRONG" | "MIXED" | "WEAK" | "UNAVAILABLE"
interface Selection { readonly securityId: string; readonly periodEnd: string }
interface Preview { readonly entry: Entry; readonly period: Period; readonly observations: readonly ResultsSourceObservation[]; readonly left: number; readonly top: number }

const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 })
const LABELS: Readonly<Record<string, string>> = {
  OPERATING_REVENUE_QUARTER: "Revenue",
  OPERATING_PROFIT_QUARTER: "Operating Profit",
  ADVANCES_GROWTH_YOY: "Advances Growth",
  DEPOSITS_GROWTH_YOY: "Deposits Growth",
  NET_INTEREST_INCOME_QUARTER: "Net Interest Income",
  NET_PROFIT_QUARTER: "Profit After Tax",
  EPS_DILUTED: "Diluted EPS",
  GROSS_NPA_PERCENT: "Gross NPA",
  NET_NPA_PERCENT: "Net NPA",
}
const isBank = (industry: string | null) => /bank/i.test(industry ?? "")
// Portfolio classification can lag source acquisition: rely on a bank-only
// financial metric for display selection without changing its research scores.
const hasBankMetrics = (rows: readonly ResultsSourceObservation[]) =>
  rows.some((row) => row.code === "NET_INTEREST_INCOME_QUARTER" || row.code === "GROSS_NPA_PERCENT" || row.code === "NET_NPA_PERCENT")

function makePeriods(): Period[] {
  const today = new Date()
  const y = today.getUTCFullYear()
  const m = today.getUTCMonth() + 1
  const lastMonth = Math.floor((m - 1) / 3) * 3
  const finalYear = lastMonth === 0 ? y - 1 : y
  const finalMonth = lastMonth === 0 ? 12 : lastMonth
  const periods: Period[] = []
  for (let year = 2025; year <= finalYear; year++) {
    for (const month of [3, 6, 9, 12]) {
      if (year === finalYear && month > finalMonth) break
      const quarter = month === 3 ? 4 : month === 6 ? 1 : month === 9 ? 2 : 3
      const fy = month === 3 ? year : year + 1
      const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
      periods.push({ end, label: "Q" + quarter + " FY" + String(fy).slice(-2) })
    }
  }
  return periods.reverse()
}

function allForQuarter(rows: readonly ResultsSourceObservation[], securityId: string, end: string) {
  return rows.filter((row) => row.securityId === securityId && row.periodEnd === end)
}
function forQuarter(rows: readonly ResultsSourceObservation[], securityId: string, end: string) {
  return displayQuarterEvidence(allForQuarter(rows, securityId, end))
}
function presentationStatus(status: string, rows: readonly ResultsSourceObservation[]) {
  return rows.some((row) => row.selected) && status === "UNAVAILABLE"
    ? "Source reconciled"
    : statusName(status)
}

function formattedValue(row: ResultsSourceObservation): string {
  const n = Number(row.value)
  const value = Number.isFinite(n) ? number.format(n) : row.value
  if (row.unit.toUpperCase() === "PERCENT") return (n > 0 ? "+" : "") + value + "%"
  if (row.unit.toLowerCase() === "cr" || row.unit === "INR_CRORE") return "₹" + value + " Cr"
  if (row.unit === "INR") return "₹" + value
  if (row.unit === "INR_PER_SHARE") return "₹" + value
  return value + " " + row.unit
}

function primaryObservation(rows: readonly ResultsSourceObservation[], bank: boolean) {
  const codes = bank
    ? ["NET_INTEREST_INCOME_QUARTER", "NET_PROFIT_QUARTER", "ADVANCES_GROWTH_YOY", "DEPOSITS_GROWTH_YOY"]
    : ["OPERATING_REVENUE_QUARTER", "NET_PROFIT_QUARTER", "OPERATING_PROFIT_QUARTER"]
  for (const code of codes) {
    const found = rows.find((row) => row.code === code && row.selected)
      ?? rows.find((row) => row.code === code)
    if (found) return found
  }
  return rows[0] ?? null
}

function resultStatus(rows: readonly ResultsSourceObservation[], industry: string | null) {
  const outcome = assessQuarterlyPerformance(rows, industry).status
  if (outcome === "IMPROVING") return "STRONG"
  if (outcome === "DETERIORATING") return "WEAK"
  if (outcome === "MIXED") return "MIXED"
  return "UNAVAILABLE"
}

function statusName(status: string) {
  if (status === "STRONG") return "Strong"
  if (status === "WEAK") return "Weak"
  if (status === "MIXED") return "Mixed"
  return "Insufficient data"
}

function StatusDot({ status, pending = false }: { readonly status: string; readonly pending?: boolean }) {
  return <i className={"ref-status-dot " + (pending ? "review" : status.toLowerCase())} aria-hidden="true" />
}

function PreviewCard({ preview }: { readonly preview: Preview }) {
  const { entry, period, observations } = preview
  const grade = resultStatus(observations, entry.position.industry)
  const displayed = primaryObservation(observations, isBank(entry.position.industry) || hasBankMetrics(observations))
  return createPortal(
    <div className="ref-preview" role="tooltip" style={{ left: preview.left, top: preview.top }}>
      <strong>{entry.position.symbol} — {period.label}</strong>
      <div className="ref-preview-state"><StatusDot status={grade} pending={observations.length > 0 && !observations.some((r) => r.selected)}/>{observations.length ? observations.some((row) => row.selected) ? presentationStatus(grade, observations) : "Review pending" : "Not available"}</div>
      {displayed ? <dl>
        <div><dt>{LABELS[displayed.code] ?? displayed.code}</dt><dd>{formattedValue(displayed)}</dd></div>
        {observations.filter((row) => row.id !== displayed.id).slice(0, 2).map((row) =>
          <div key={row.id}><dt>{LABELS[row.code] ?? row.code}</dt><dd>{formattedValue(row)}</dd></div>)}
      </dl> : <p>No stored quarter-specific result is connected.</p>}
      <small>{observations.some((row) => !row.selected) ? "Unselected evidence remains under review." : "Source figures reconciled for current display. Publication timing and performance grading are separate."}</small>
    </div>,
    document.body,
  )
}

function PortfolioCard({ entry, currency }: { readonly entry: Entry; readonly currency: string }) {
  const p = entry.position
  const pnl = entry.kind === "CURRENT" ? p.unrealisedPnl : p.realisedPnl
  const rows: readonly [string, string, string?][] = [
    ["Shares", formatQuantity(p.quantity)],
    ["Avg. Cost", p.averageCost === null ? "—" : formatMoney(p.averageCost, currency)],
    ["Current Price", p.currentPrice === null ? "—" : formatMoney(p.currentPrice, currency)],
    ["Current Value", p.currentValue === null ? "—" : formatMoney(p.currentValue, currency)],
    ["P&L", pnl === null ? "—" : formatMoney(pnl, currency), financialClass(pnl)],
  ]
  return <section className="results-card ref-position">
    <div className="results-card-heading"><h3>Portfolio Position</h3><span className="position-state">{entry.kind === "CURRENT" ? "Open Position" : "Fully Closed"}</span></div>
    <dl>{rows.map(([label, value, tone]) =>
      <div key={label}><dt>{label}</dt><dd className={tone ?? ""}>{value}</dd></div>)}</dl>
  </section>
}

function ChartCard({ entry, periods, observations, selectedPeriodEnd }: {
  readonly entry: Entry
  readonly periods: readonly Period[]
  readonly observations: readonly ResultsSourceObservation[]
  readonly selectedPeriodEnd: string
}) {
  const index = periods.findIndex((p) => p.end === selectedPeriodEnd)
  const recent = (index < 0 ? periods.slice(0, 6) : periods.slice(index, index + 6)).slice().reverse()
  const bank = isBank(entry.position.industry) || hasBankMetrics(
    observations.filter((row) => row.securityId === entry.position.securityId),
  )
  const hasNii = bank && observations.some((row) => row.securityId === entry.position.securityId && row.code === "NET_INTEREST_INCOME_QUARTER")
  const code = bank ? (hasNii ? "NET_INTEREST_INCOME_QUARTER" : "ADVANCES_GROWTH_YOY") : "OPERATING_REVENUE_QUARTER"
  const label = bank ? (hasNii ? "Net Interest Income" : "Advances Growth YoY") : "Revenue"
  const series = recent.map((period) => {
    const rows = forQuarter(observations, entry.position.securityId, period.end).filter((r) => r.code === code)
    return rows.find((row) => row.selected) ?? rows[0] ?? null
  })
  const max = Math.max(1, ...series.map((row) => row ? Math.abs(Number(row.value)) : 0))
  const hasNegative = series.some((row) => row !== null && Number(row.value) < 0)
  return <section className="results-card ref-chart">
    <div className="results-card-heading"><h3>{label} — Last {recent.length} Quarters</h3></div>
    <p className="ref-chart-unit">{bank && !hasNii ? "Reported percentage growth" : "₹ crore (where reported)"} <span>{series.some((r) => r && !r.selected) ? "· Review pending" : ""}</span></p>
    <div className={"ref-bars" + (hasNegative ? " signed" : "")} role="img" aria-label={label + " by quarter, unavailable dates left blank"}>
      {series.map((row, index) => <div className="ref-bar-item" key={recent[index]?.end ?? index}>
        <strong>{row ? formattedValue(row) : "—"}</strong>
        <div className="ref-bar-track"><span className="ref-bar-zero"/>
          {row ? <i className={(row.selected ? "selected" : "pending") + (Number(row.value) < 0 ? " negative" : "")}
            style={{ height: Math.max(5, Math.abs(Number(row.value)) / max * (hasNegative ? 45 : 92)) + "%" }} /> : null}
        </div>
        <small>{recent[index]?.label ?? "—"}</small>
      </div>)}
    </div>
    {series.every((row) => row === null) ? <p className="ref-chart-empty">Quarterly history not yet connected</p> : null}
  </section>
}

function MetricsCard({ period, rows }: { readonly period: Period; readonly rows: readonly ResultsSourceObservation[] }) {
  return <section className="results-card ref-metrics">
    <div className="results-card-heading"><h3>Key Metrics ({period.label})</h3></div>
    <div className="metrics-table-wrap">
      <table className="metrics-table">
        <thead><tr><th>Metric</th><th>Reported</th><th>QoQ</th><th>YoY</th></tr></thead>
        <tbody>{rows.length ? rows.map((r) => <tr key={r.id}>
          <th>{LABELS[r.code] ?? r.code}<small>{r.selected ? (r.publishedAt ? "Source reconciled" : "Source reconciled · publication unverified") : "Review pending"}</small></th>
          <td>{formattedValue(r)}</td><td>—</td><td>—</td>
        </tr>) : <tr><td colSpan={4} className="ref-no-data">No quarter-specific metrics in the connected database.</td></tr>}</tbody>
      </table>
    </div>
    <p className="ref-card-note">Comparisons appear only when comparable periods have been verified.</p>
  </section>
}

function InsightCard({ entry, rows }: { readonly entry: Entry; readonly rows: readonly ResultsSourceObservation[] }) {
  const outcome = assessQuarterlyPerformance(rows, entry.position.industry)
  const selectedCount = rows.filter((r) => r.selected).length
  let summary = "Quarterly operating data is not yet sufficient for a reliable performance assessment."
  if (selectedCount > 0 && outcome.status !== "INSUFFICIENT_DATA") {
    summary = outcome.status === "IMPROVING" ? "Selected banking activity indicators are improving."
      : outcome.status === "DETERIORATING" ? "Selected banking activity indicators are declining."
      : "Selected banking activity indicators are mixed."
  } else if (selectedCount > 0) {
    summary = selectedCount + " source-reconciled metric" + (selectedCount === 1 ? "" : "s") + " available. Comparative performance assessment is not yet qualified."
  } else if (rows.length > 0) {
    summary = rows.length + " stored quarterly observation" + (rows.length === 1 ? "" : "s") + " available. Verification is pending."
  }
  return <section className="results-card ref-insight">
    <div className="results-card-heading"><h3><span className="ref-sparkle" aria-hidden="true">✦</span> AI Insight</h3><span className="ref-insight-tag">Evidence-based</span></div>
    <div className="ref-insight-summary"><strong>{summary}</strong><span>{outcome.status === "INSUFFICIENT_DATA" ? "Thesis impact: Not assessed" : "Quarterly operating signal only"}</span></div>
    <ul>
      {rows.length > 0 ? rows.slice(0, 3).map((r) =>
        <li key={r.id}>{LABELS[r.code] ?? r.code}: {formattedValue(r)} {r.selected ? "(selected)" : "(review pending)"}</li>)
        : <li>Check again when a quarter-specific financial report is available.</li>}
      <li>No investment recommendation or V1-4 score is inferred.</li>
    </ul>
  </section>
}

function EvidenceDetails({ rows, period }: { readonly rows: readonly ResultsSourceObservation[]; readonly period: Period }) {
  return <details className="ref-evidence">
    <summary>Source &amp; verification details <span>· {rows.filter((r) => !r.selected).length} review pending</span></summary>
    <div className="ref-evidence-body">
      <p>Reporting period end: {period.end}. Source reconciliation uses retained, checksum-checked evidence; a missing publication timestamp remains unverified and does not establish point-in-time availability. Alternative accounting bases are preserved below.</p>
      {rows.length ? rows.map((r) => <p key={r.id}>
        <strong>{LABELS[r.code] ?? r.code}:</strong> {formattedValue(r)} · {r.selected ? "Selected" : "Review pending"}
        {" · "}Source: {r.source} · Scope: {r.scope ?? "Unknown"} · Published: {r.publishedAt ?? "Unknown"} · Retrieved: {r.retrievedAt}
      </p>) : <p>No directly matched financial observation was found.</p>}
    </div>
  </details>
}

export function ResultsLivePage() {
  const { portfolio, isLoading, error } = usePortfolioView()
  const [observations, setObservations] = useState<readonly ResultsSourceObservation[]>([])
  const [loadingEvidence, setLoadingEvidence] = useState(true)
  const [evidenceError, setEvidenceError] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<ResultsScanStatus | null>(null)
  const [scanBusy, setScanBusy] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [evidenceRevision, setEvidenceRevision] = useState(0)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<PositionFilter>("ALL")
  const [industry, setIndustry] = useState("ALL")
  const [statuses, setStatuses] = useState<Set<StatusFilter>>(new Set())
  const [scrollTop, setScrollTop] = useState(0)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const analysisRef = useRef<HTMLDivElement>(null)
  const periods = useMemo(() => makePeriods(), [])

  const entries = useMemo((): Entry[] => {
    if (!portfolio) return []
    const unique = new Map<string, Entry>()
    for (const position of portfolio.closedPositions) {
      if (position.assetClass === "EQUITY") unique.set(position.securityId, { position, kind: "CLOSED" })
    }
    for (const position of portfolio.openPositions) {
      if (position.assetClass === "EQUITY") unique.set(position.securityId, { position, kind: "CURRENT" })
    }
    return [...unique.values()].sort((a, b) => a.position.symbol.localeCompare(b.position.symbol))
  }, [portfolio])

  useEffect(() => {
    if (!portfolio) return
    let active = true
    void loadResultsSourceInventory(entries.map((entry) => entry.position.securityId))
      .then((rows) => { if (active) { setObservations(rows); setEvidenceError(null) } })
      .catch((reason: unknown) => { if (active) { setObservations([]); setEvidenceError(reason instanceof Error ? reason.message : "Evidence cannot be loaded") } })
      .finally(() => { if (active) setLoadingEvidence(false) })
    return () => { active = false }
  }, [portfolio, entries, evidenceRevision])

  useEffect(() => {
    if (!portfolio?.portfolio.id) return
    let active = true
    void getResultsScanStatus(portfolio.portfolio.id)
      .then((value) => { if (active) setScanStatus(value) })
      .catch((reason: unknown) => { if (active) setScanError(reason instanceof Error ? reason.message : "Scan service not available") })
    return () => { active = false }
  }, [portfolio?.portfolio.id])

  const runScan = async () => {
    if (!portfolio || scanBusy) return
    setScanBusy(true)
    setScanError(null)
    try {
      let progress = await startResultsScan(portfolio.portfolio.id)
      setScanStatus(progress)
      let previousProcessed = -1
      for (let attempts = 0; attempts < 45 && progress.run?.status === "RUNNING" && progress.run.pending > 0; attempts++) {
        if (progress.run.processed === previousProcessed) throw new Error("Scan stopped making progress. Try again after checking its status.")
        previousProcessed = progress.run.processed
        progress = await stepResultsScan(portfolio.portfolio.id, progress.run.id)
        setScanStatus(progress)
      }
      if (progress.run?.status === "RUNNING") throw new Error("Scan has not finished. Use Run Scan Now to resume.")
      setEvidenceRevision((value) => value + 1)
    } catch (reason: unknown) {
      setScanError(reason instanceof Error ? reason.message : "The results scan failed")
    } finally {
      setScanBusy(false)
    }
  }

  const sourceCompanyCount = new Set(observations.map((r) => r.securityId)).size
  const sourceQuarterCount = new Set(observations.map((r) => r.securityId + "|" + r.periodEnd)).size
  const industries = useMemo(() => [...new Set(entries.map((e) => e.position.industry ?? "Unclassified"))].sort(), [entries])
  const filtered = useMemo(() => entries.filter((e) => {
    const p = e.position
    if (query.trim() && !(p.symbol + " " + p.company).toLowerCase().includes(query.trim().toLowerCase())) return false
    if (filter !== "ALL" && e.kind !== filter) return false
    if (industry !== "ALL" && (p.industry ?? "Unclassified") !== industry) return false
    if (statuses.size > 0 && !periods.some((period) => {
      const rows = forQuarter(observations, p.securityId, period.end)
      return statuses.has(resultStatus(rows, p.industry))
    })) return false
    return true
  }), [entries, query, filter, industry, statuses, observations, periods])

  const suggestedEntry = entries.find((e) => observations.some((r) => r.securityId === e.position.securityId)) ?? entries[0]
  const newestObservation = suggestedEntry
    ? observations.filter((r) => r.securityId === suggestedEntry.position.securityId)
        .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0]
    : null
  const effectiveSelection = collapsed || loadingEvidence ? null : selection ?? (suggestedEntry && periods[0]
    ? { securityId: suggestedEntry.position.securityId, periodEnd: newestObservation?.periodEnd ?? periods[0].end }
    : null)
  const chosen = effectiveSelection ? filtered.find((e) => e.position.securityId === effectiveSelection.securityId) ?? null : null
  const period = effectiveSelection ? periods.find((p) => p.end === effectiveSelection.periodEnd) ?? null : null
  const detailRows = chosen && period ? forQuarter(observations, chosen.position.securityId, period.end) : []
  const allDetailRows = chosen && period ? allForQuarter(observations, chosen.position.securityId, period.end) : []
  const grade = chosen ? resultStatus(detailRows, chosen.position.industry) : "UNAVAILABLE"
  const activeIndex = period ? periods.findIndex((p) => p.end === period.end) : -1
  const showPreview = (event: React.SyntheticEvent<HTMLButtonElement>, entry: Entry, p: Period, rows: readonly ResultsSourceObservation[]) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const left = Math.min(Math.max(14, rect.left + 10), Math.max(14, window.innerWidth - 298))
    const top = Math.max(14, Math.min(rect.bottom + 8, window.innerHeight - 220))
    setPreview({ entry, period: p, observations: rows, left, top })
  }
  const selectCell = (entry: Entry, p: Period) => {
    setSelection({ securityId: entry.position.securityId, periodEnd: p.end })
    setCollapsed(false)
    setPreview(null)
    window.requestAnimationFrame(() => analysisRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }))
  }
  const setAdjacent = (indexDelta: number) => {
    const next = periods[activeIndex + indexDelta]
    if (effectiveSelection && next) setSelection({ securityId: effectiveSelection.securityId, periodEnd: next.end })
  }
  const toggleStatus = (s: StatusFilter) => {
    setStatuses((current) => { const next = new Set(current); if (next.has(s)) next.delete(s); else next.add(s); return next })
    setScrollTop(0)
  }
  const clearFilters = () => {
    setQuery(""); setFilter("ALL"); setIndustry("ALL"); setStatuses(new Set()); setScrollTop(0)
  }
  const rowHeight = 44
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 4)
  const end = Math.min(filtered.length, start + 18)
  const visible = filtered.slice(start, end)

  if (isLoading) return <section className="results-page ref-results"><p role="status">Loading portfolio holdings…</p></section>
  if (error || !portfolio) return <section className="results-page ref-results"><div role="alert">Portfolio unavailable: {error ?? "Unknown error"}</div></section>

  return <section className="results-page ref-results" aria-labelledby="results-title">
    <header className="results-page-header">
      <div><h1 id="results-title">Results</h1><p>Quarterly and annual company performance for all current and closed portfolio positions.</p></div>
      <section className="results-collection-status" aria-label="Results collection status">
        <div><span>Last scan</span><strong>{scanStatus?.run?.status === "RUNNING" ? "Running…" : scanStatus?.lastScan ? new Date(scanStatus.lastScan).toLocaleString("en-IN", {timeZone:"Asia/Kolkata"}) : "Not run"}</strong><small>{scanStatus?.run ? scanStatus.run.processed + " of " + scanStatus.run.requested_count + " equities checked" : "Manual scan available"}</small></div>
        <div><span>New results</span><strong>{scanStatus?.newResults ?? "—"}</strong><small>New stored metric observations</small></div>
        <div><span>Coverage</span><strong>Open + Closed Positions</strong><small>{loadingEvidence ? "Loading quarterly evidence…" : sourceCompanyCount + " of " + entries.length + " with results · " + sourceQuarterCount + " stock-quarters"}</small></div>
        <button type="button" disabled={scanBusy || entries.length === 0} onClick={() => void runScan()} title={scanBusy ? "Processing quarterly data" : "Check existing and newly linked source data"}>{scanBusy ? "↻ Scanning…" : scanStatus?.run?.status === "RUNNING" ? "↻ Resume Scan" : "↻ Run Scan Now"}</button>
      </section>
    </header>
    <div className="results-tabs" role="tablist" aria-label="Results view">
      <button type="button" role="tab" className="active" aria-selected="true">Quarterly Results</button>
      <button type="button" role="tab" aria-selected="false" disabled>Annual Results <span>(Coming Later)</span></button>
    </div>
    <section className="results-workspace">
      <div className="results-filter-bar">
        <label className="results-search"><span className="sr-only">Search stocks</span><input placeholder="Search stocks…" value={query} onChange={(e) => { setQuery(e.target.value); setScrollTop(0) }} /></label>
        {(["ALL", "CURRENT", "CLOSED"] as const).map((kind) =>
          <button key={kind} type="button" className={filter === kind ? "active" : ""} onClick={() => { setFilter(kind); setScrollTop(0) }}>{kind === "ALL" ? "All Stocks" : kind === "CURRENT" ? "Current Holdings" : "Closed Positions"}</button>)}
        <label className="industry-filter"><span className="sr-only">Industry</span><select value={industry} onChange={(e) => { setIndustry(e.target.value); setScrollTop(0) }}><option value="ALL">All Industries</option>{industries.map((name) => <option key={name}>{name}</option>)}</select></label>
        {(["STRONG", "MIXED", "WEAK", "UNAVAILABLE"] as const).map((s) =>
          <button type="button" key={s} className={statuses.has(s) ? "active" : ""} onClick={() => toggleStatus(s)}><StatusDot status={s}/>{s === "UNAVAILABLE" ? "Not Available" : statusName(s)}</button>)}
        <button type="button" disabled title="Newly reported detection requires an operational R6 scanner"><span className="ref-status-dot new"/>Newly Reported</button>
        <button type="button" className="clear-filter" onClick={clearFilters}>Clear Filters</button>
      </div>
      {scanError ? <p className="ref-evidence-error" role="alert">Results scan: {scanError}</p> : null}
      {evidenceError ? <p className="ref-evidence-error" role="alert">Financial source data could not be loaded: {evidenceError}. Portfolio membership is unaffected.</p> : null}
      <div className="results-matrix-shell" aria-label="Quarterly results matrix" tabIndex={0} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
        <table className="results-matrix">
          <thead><tr><th className="stock-column"><span>{filtered.length} stocks</span>Stock</th>{periods.map((p, i) => <th key={p.end}>{p.label}{i === 0 ? <small>(Latest completed) ↓</small> : null}</th>)}</tr></thead>
          <tbody>
            {start > 0 ? <tr className="virtual-spacer"><td colSpan={periods.length + 1} style={{ height: start * rowHeight }} /></tr> : null}
            {visible.map((entry) => <tr key={entry.position.securityId}><th scope="row" className="stock-column">{entry.position.symbol}<small>{entry.position.industry ?? "Unclassified"} · {entry.kind === "CURRENT" ? "Current" : "Closed"}</small></th>{periods.map((p) => {
              const rows = forQuarter(observations, entry.position.securityId, p.end)
              const primary = primaryObservation(rows, isBank(entry.position.industry) || hasBankMetrics(rows))
              const status = resultStatus(rows, entry.position.industry)
              const pending = rows.length > 0 && !rows.some((r) => r.selected)
              const active = effectiveSelection?.securityId === entry.position.securityId && effectiveSelection.periodEnd === p.end
              return <td key={p.end}><button className={"result-pill ref-cell " + (rows.length ? (pending ? "ref-pending" : "ref-" + status.toLowerCase()) : "ref-empty") + (active ? " selected" : "")}
                type="button" aria-pressed={active} aria-label={entry.position.symbol + " " + p.label + ": " + (primary ? formattedValue(primary) + (pending ? ", review pending" : "") : "not available")}
                onClick={() => selectCell(entry, p)}
                onMouseEnter={(e) => showPreview(e, entry, p, rows)} onFocus={(e) => showPreview(e, entry, p, rows)}
                onMouseLeave={() => setPreview(null)} onBlur={() => setPreview(null)}>
                <StatusDot status={status} pending={pending}/><span>{loadingEvidence ? "Loading" : primary ? (LABELS[primary.code] ?? "Metric") + " " + formattedValue(primary) : "—"}</span>
              </button></td>
            })}</tr>)}
            {end < filtered.length ? <tr className="virtual-spacer"><td colSpan={periods.length + 1} style={{ height: (filtered.length - end) * rowHeight }} /></tr> : null}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 ? <div className="results-empty">No matching securities for the current filters.</div> : null}
      {chosen && period ? <div className="selected-analysis" ref={analysisRef}>
        <div className="selected-analysis-heading">
          <div><h2>{chosen.position.symbol} — {period.label}</h2><span className={"analysis-status " + (grade === "UNAVAILABLE" ? "ref-assessment-pending" : "result-" + grade.toLowerCase())}>
            <StatusDot status={grade} pending={detailRows.length > 0 && !detailRows.some((r) => r.selected)}/>{detailRows.length && !detailRows.some((r) => r.selected) ? "Review pending" : presentationStatus(grade, detailRows)}
          </span></div>
          <div className="analysis-actions">
            <button type="button" disabled title="Verified original filing URL is not yet linked">NSE Filing ↗</button>
            <button type="button" disabled title="Verified company investor relations URL is not yet linked">Company IR ↗</button>
            <button type="button" disabled={activeIndex <= 0} onClick={() => setAdjacent(-1)}>← Previous</button>
            <button type="button" disabled={activeIndex >= periods.length - 1} onClick={() => setAdjacent(1)}>Next →</button>
            <button type="button" onClick={() => { setSelection(null); setCollapsed(true); setPreview(null) }}>Collapse</button>
          </div>
        </div>
        <div className="ref-analysis-grid">
          <PortfolioCard entry={chosen} currency={portfolio.portfolio.currency}/>
          <ChartCard entry={chosen} periods={periods} observations={observations} selectedPeriodEnd={period.end}/>
          <MetricsCard period={period} rows={detailRows}/>
          <InsightCard entry={chosen} rows={detailRows}/>
        </div>
        <EvidenceDetails rows={allDetailRows} period={period}/>
      </div> : null}
      <footer className="results-footnote">ⓘ Portfolio coverage includes current and fully closed equities. Quarter values are shown only where available, with their verification state; manual source scans are available; scheduled daily collection is not yet enabled.</footer>
    </section>
    {preview ? <PreviewCard preview={preview}/> : null}
  </section>
}
