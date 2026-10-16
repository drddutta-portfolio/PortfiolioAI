import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { usePortfolioView } from "../portfolio/usePortfolioView"
import { financialClass, formatMoney, formatQuantity } from "../portfolio/format"
import type { PortfolioPosition } from "../portfolio/types"
import { buildIndustryR5Calibrations, gradeQuarterR5 } from "./quarterlyR5Classification"
import type { R5IndustryCalibrations } from "./quarterlyR5Classification"
import { compareQuarterMetric, compareQuarterMetrics, explainQuarterlyComparisons } from "./quarterlyR5"
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
interface Preview { readonly entry: Entry; readonly period: Period; readonly observations: readonly ResultsSourceObservation[]; readonly history: readonly ResultsSourceObservation[]; readonly left: number; readonly top: number }

const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 })
const LABELS: Readonly<Record<string, string>> = {
  OPERATING_REVENUE_QUARTER: "Revenue",
  NET_PREMIUM_EARNED_QUARTER: "Net Premium Earned",
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

// R5 approved four-quarter window. Never auto-advance to unqualified new quarter.
// Completed calendar quarters, newest first, beginning March 2025.
 // Do not wait for four-stock coverage before displaying a newly reported quarter.
function makePeriods(): Period[] {
  const now = new Date()
  const qStartMonth = Math.floor(now.getUTCMonth() / 3) * 3
  const previousEnd = new Date(Date.UTC(now.getUTCFullYear(), qStartMonth, 0))
  const periods: Period[] = []
  for (let end = previousEnd; end >= new Date(Date.UTC(2025, 2, 31)); end = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 2, 0))) {
    const month = end.getUTCMonth() + 1
    const quarter = month === 3 ? 4 : month === 6 ? 1 : month === 9 ? 2 : 3
    const fiscalYear = month === 3 ? end.getUTCFullYear() : end.getUTCFullYear() + 1
    periods.push({ end: end.toISOString().slice(0, 10), label: `Q${quarter} FY${String(fiscalYear).slice(-2)}` })
  }
  return periods
}
const R5_REQUIRED_QUARTERS = new Set(["2025-09-30", "2025-12-31", "2026-03-31", "2026-06-30"])

function allForQuarter(rows: readonly ResultsSourceObservation[], securityId: string, end: string) {
  return rows.filter((row) => row.securityId === securityId && row.periodEnd === end)
}
function forQuarter(rows: readonly ResultsSourceObservation[], securityId: string, end: string) {
  return displayQuarterEvidence(allForQuarter(rows, securityId, end))
}
/** A quarter is R5-complete only with one selected original issuer filing
 * containing the three mandatory bank/nonbank core metrics. */
function hasFourQualifiedQuarters(rows: readonly ResultsSourceObservation[], entry: Entry): boolean {
  const own = rows.filter(r => r.securityId === entry.position.securityId && r.selected &&
    r.source === "COMPANY_EXCHANGE_FILING")
  const bank = isBank(entry.position.industry) || hasBankMetrics(own)
  const insurer = entry.position.symbol === "STARHEALTH"
  const core = [insurer ? "NET_PREMIUM_EARNED_QUARTER" : bank ? "NET_INTEREST_INCOME_QUARTER" : "OPERATING_REVENUE_QUARTER",
    "NET_PROFIT_QUARTER", "EPS_DILUTED"]
  return makePeriods().filter(period => R5_REQUIRED_QUARTERS.has(period.end)).length === 4 &&
    makePeriods().filter(period => R5_REQUIRED_QUARTERS.has(period.end)).every(period => {
    const quarter = own.filter(r => r.periodEnd === period.end && core.includes(r.code))
    if (quarter.length !== 3 || new Set(quarter.map(r => r.code)).size !== 3) return false
    if (quarter.some(r => !r.sourceRecordId || !r.scope ||
      r.currency !== "INR" || (r.code === "EPS_DILUTED" ?
        r.unit !== "INR_PER_SHARE" : r.unit !== "INR_CRORE"))) return false
    return new Set(quarter.map(r => r.sourceRecordId)).size === 1 &&
      new Set(quarter.map(r => r.scope)).size === 1
  })
}

function presentationStatus(status: string, rows: readonly ResultsSourceObservation[]) {
  return rows.some((row) => row.selected) && status === "UNAVAILABLE"
    ? "Not Rated · source reconciled"
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
    : ["NET_PREMIUM_EARNED_QUARTER", "OPERATING_REVENUE_QUARTER", "NET_PROFIT_QUARTER", "OPERATING_PROFIT_QUARTER"]
  for (const code of codes) {
    const found = rows.find((row) => row.code === code && row.selected)
      ?? rows.find((row) => row.code === code)
    if (found) return found
  }
  return rows[0] ?? null
}

function resultStatus(allRows: readonly ResultsSourceObservation[], entry: Entry, end: string, calibrations: R5IndustryCalibrations) {
  return gradeQuarterR5(allRows, entry.position.securityId, end, entry.position.sector, entry.position.industry, calibrations).status
}
function quarterCellLabel(allRows: readonly ResultsSourceObservation[], entry: Entry, period: Period, primary: ResultsSourceObservation | null) {
  if (!primary) return "—"
  const bank=isBank(entry.position.industry) || hasBankMetrics(allRows.filter(row => row.securityId === entry.position.securityId && row.periodEnd === period.end))
  const insurer=entry.position.symbol==="STARHEALTH"
  const code=insurer ? "NET_PREMIUM_EARNED_QUARTER" : bank ? "NET_INTEREST_INCOME_QUARTER" : "OPERATING_REVENUE_QUARTER"
  const comp=compareQuarterMetric(allRows, entry.position.securityId, period.end, code)
  if (comp.current && (comp.yoy !== null || comp.qoq !== null)) {
    const pct=comp.yoy ?? comp.qoq!
    return (insurer ? "Net premium " : bank ? "NII " : "Rev ") + (Number(pct)>0?"+":"") + pct+"% "+(comp.yoy!==null?"YoY":"QoQ")
  }
  return (LABELS[primary.code] ?? "Metric") + " " + formattedValue(primary)
}

function statusName(status: string) {
  if (status === "STRONG") return "Strong"
  if (status === "WEAK") return "Weak"
  if (status === "MIXED") return "Mixed"
  return "Not Rated"
}

function StatusDot({ status, pending = false }: { readonly status: string; readonly pending?: boolean }) {
  return <i className={"ref-status-dot " + (pending ? "review" : status.toLowerCase())} aria-hidden="true" />
}

function PreviewCard({ preview, calibrations }: { readonly preview: Preview; readonly calibrations: R5IndustryCalibrations }) {
  const { entry, period, observations } = preview
  const grade = resultStatus(preview.history, entry, period.end, calibrations)
  const topCode = entry.position.symbol === "STARHEALTH" ? "NET_PREMIUM_EARNED_QUARTER" :
    (isBank(entry.position.industry) || hasBankMetrics(observations)) ? "NET_INTEREST_INCOME_QUARTER" : "OPERATING_REVENUE_QUARTER"
  const mainComparison = compareQuarterMetric(preview.history, entry.position.securityId, period.end, topCode)
  const patComparison = compareQuarterMetric(preview.history, entry.position.securityId, period.end, "NET_PROFIT_QUARTER")
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
      {mainComparison.qoq !== null && <small>{LABELS[topCode]} QoQ: {mainComparison.qoq}%</small>}
      {mainComparison.yoy !== null && <small>{LABELS[topCode]} YoY: {mainComparison.yoy}%</small>}
      {patComparison.yoy !== null && <small>PAT YoY: {patComparison.yoy}%</small>}
      <small>{observations.some((row) => !row.selected) ? "Unselected evidence remains under review." : observations.some((row) => row.originalShareBasis) ? "Reported pre-split EPS is not adjusted. Do not compare EPS across a share split." : "Source figures reconciled for current display. Publication timing and performance grading are separate."}</small>
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
  const code = bank ? (hasNii ? "NET_INTEREST_INCOME_QUARTER" : "ADVANCES_GROWTH_YOY") : "NET_PROFIT_QUARTER"
  const label = bank ? (hasNii ? "Net Interest Income" : "Advances Growth YoY") : "Profit After Tax"
  const series = recent.map((period) =>
    compareQuarterMetric(observations, entry.position.securityId, period.end, code).current,
  )
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

function MetricsCard({ period, rows, allRows, securityId }: { readonly period: Period; readonly rows: readonly ResultsSourceObservation[]; readonly allRows: readonly ResultsSourceObservation[]; readonly securityId: string }) {
  return <section className="results-card ref-metrics">
    <div className="results-card-heading"><h3>Key Metrics ({period.label})</h3></div>
    <div className="metrics-table-wrap">
      <table className="metrics-table">
        <thead><tr><th>Metric</th><th>Reported</th><th>QoQ</th><th>YoY</th></tr></thead>
        <tbody>{rows.length ? rows.map((r) => <tr key={r.id}>
          <th>{LABELS[r.code] ?? r.code}<small>{r.selected ? (r.publishedAt ? "Source reconciled" : "Source reconciled · publication unverified") : "Review pending"}</small></th>
          <td>{formattedValue(r)}</td><td>{compareQuarterMetric(allRows, securityId, period.end, r.code).qoq === null ? "—" : compareQuarterMetric(allRows, securityId, period.end, r.code).qoq + "%"}</td><td>{compareQuarterMetric(allRows, securityId, period.end, r.code).yoy === null ? "—" : compareQuarterMetric(allRows, securityId, period.end, r.code).yoy + "%"}</td>
        </tr>) : <tr><td colSpan={4} className="ref-no-data">No quarter-specific metrics in the connected database.</td></tr>}</tbody>
      </table>
    </div>
    <p className="ref-card-note">Comparisons appear only when comparable periods have been verified.</p>
  </section>
}

function InsightCard({ entry, rows, allRows, periodEnd, calibrations, expanded, onToggle }: {
  readonly entry: Entry
  readonly rows: readonly ResultsSourceObservation[]
  readonly allRows: readonly ResultsSourceObservation[]
  readonly periodEnd: string
  readonly calibrations: R5IndustryCalibrations
  readonly expanded: boolean
  readonly onToggle: () => void
}) {
  const outcome = gradeQuarterR5(allRows, entry.position.securityId, periodEnd, entry.position.sector, entry.position.industry, calibrations)
  const comparisons = compareQuarterMetrics(allRows, entry.position.securityId, periodEnd)
  const findings = explainQuarterlyComparisons(comparisons, isBank(entry.position.industry) || hasBankMetrics(rows))
    .filter((phrase) => /^(Revenue|Net interest income|Profit after tax)/.test(phrase))
  const selectedCount = rows.filter((row) => row.selected).length
  const summary = findings.length ? findings.slice(0, 2).join(" ")
    : selectedCount ? "Selected quarterly figures are available, but qualified growth comparisons cannot yet be established."
    : rows.length ? "Stored quarterly observations await source verification."
    : "Quarterly data is not yet sufficient for a reliable assessment."
  return <section className="results-card ref-insight" aria-label="AI Insight summary">
    <div className="results-card-heading"><h3><span className="ref-sparkle" aria-hidden="true">✦</span> AI Insight</h3><span className="ref-insight-tag">Evidence-based</span></div>
    <div className="ref-insight-statuses">
      <div><span>Quarterly Results</span><strong className={"ref-insight-grade ref-insight-grade-" + outcome.status.toLowerCase()}>{statusName(outcome.status)}</strong></div>
      <div><span>Investment Action</span><strong className="ref-insight-unassessed">Not assessed</strong></div>
    </div>
    <p className="ref-insight-text">{summary}</p>
    <p className="ref-insight-disclaimer">Investment decision analysis is planned; no ADD, BUY, HOLD, WATCH or EXIT signal has been generated.</p>
    <div className="ref-insight-actions">
      <span>QoQ evidence · {outcome.basis === "INDUSTRY_PEER" ? "Industry calibrated" : outcome.basis === "COMPANY_TREND" ? "Company trend" : "Not rated"}</span>
      <button type="button" aria-controls="ref-full-ai-analysis" aria-expanded={expanded} onClick={onToggle}>
        {expanded ? "Hide Full Analysis" : "View Full Analysis"} <span aria-hidden="true">{expanded ? "↑" : "↗"}</span>
      </button>
    </div>
  </section>
}

function FullAiAnalysis({ entry, period, rows, allRows, calibrations }: {
  readonly entry: Entry
  readonly period: Period
  readonly rows: readonly ResultsSourceObservation[]
  readonly allRows: readonly ResultsSourceObservation[]
  readonly calibrations: R5IndustryCalibrations
}) {
  const outcome = gradeQuarterR5(allRows, entry.position.securityId, period.end, entry.position.sector, entry.position.industry, calibrations)
  const statements = explainQuarterlyComparisons(
    compareQuarterMetrics(allRows, entry.position.securityId, period.end),
    isBank(entry.position.industry) || hasBankMetrics(rows),
  ).filter((phrase) => !phrase.startsWith("Thesis impact:"))
  const qualified = rows.filter((row) => row.selected)
  return <section id="ref-full-ai-analysis" className="ref-full-ai-analysis" aria-label="Full AI Analysis">
    <div className="ref-full-ai-heading">
      <div><h3>Full AI Analysis — {entry.position.symbol} · {period.label}</h3>
        <p>Financial evidence currently available; investment intelligence features will be added in AI-1 through AI-8.</p></div>
      <span className="ref-ai-build-state">UI preview · No investment signal</span>
    </div>
    <div className="ref-full-ai-grid">
      <section><h4>01 · Executive Summary</h4><p>{outcome.explanation}</p></section>
      <section><h4>02 · Financial Performance</h4>
        {statements.length ? <ul>{statements.map((line, index) => <li key={index}>{line}</li>)}</ul> : <p>Qualified quarterly comparisons are not yet available.</p>}</section>
      <section><h4>03 · Historical Comparison</h4><p>Four-quarter trend analysis and historical earnings-quality interpretation are planned for AI-2. The current metrics panel remains the source for verified quarterly values.</p></section>
      <section><h4>04 · Industry Comparison</h4>
        <p>{outcome.basis === "INDUSTRY_PEER" ? "Exact-industry quarterly calibration using " + outcome.sampleSize + " qualified quarter pairs. This is a performance grade, not an investment rating."
          : outcome.basis === "COMPANY_TREND" ? "Company-only directional trend. Exact-industry peer ranking is not available."
          : "A qualified industry or company-trend comparison is not available."}</p></section>
      <section><h4>05 · Valuation Analysis</h4><p>Not assessed. Valuation, prices, share basis and point-in-time financial denominators must be qualified before an investment action can be suggested.</p></section>
      <section><h4>06 · Management Commentary</h4><p>Not connected yet. Original filings, earnings calls and management guidance will be cited with publication dates where available.</p></section>
      <section><h4>07 · Risks &amp; Opportunities</h4><p>Not assessed. The planned engine will explain supported business risks, earnings quality, sector conditions and relevant portfolio exposure.</p></section>
      <section className="ref-ai-investment-section"><h4>08 · Investment Recommendation</h4>
        <strong>Not assessed — insufficient decision evidence</strong>
        <p>Future actions: ADD / BUY / HOLD / WATCH / EXIT, with evidence, confidence and portfolio context. A quarterly grade alone never triggers an action.</p></section>
    </div>
    <details className="ref-ai-methodology">
      <summary>Methodology &amp; evidence</summary>
      <div><p>Quarterly methodology: {outcome.basis === "INDUSTRY_PEER" ? "exact-industry peer comparison" : outcome.basis === "COMPANY_TREND" ? "own-company trend, not peer-ranked" : "not rated"} · {outcome.scope} · {outcome.policyVersion}.</p>
        <p>{qualified.length} selected observations in this quarter; {rows.length - qualified.length} observations pending review. Performance comparisons do not establish point-in-time investment valuation.</p>
        <p>V1-4 readiness and research scores are unchanged. Missing or unpublished evidence is not treated as verified. Full source details remain in Source &amp; verification details below.</p></div>
    </details>
  </section>
}

function EvidenceDetails({ rows, period }: { readonly rows: readonly ResultsSourceObservation[]; readonly period: Period }) {
  return <details className="ref-evidence">
    <summary>Source &amp; verification details <span>· {rows.filter((r) => !r.selected).length} review pending</span></summary>
    <div className="ref-evidence-body">
      <p>Reporting period end: {period.end}. Source reconciliation uses retained, checksum-checked evidence; a missing publication timestamp remains unverified and does not establish point-in-time availability. Alternative accounting bases are preserved below.</p>
      {rows.some((row) => row.originalShareBasis) && <p>Historical ISIN/share split: EPS is originally reported before the split and not adjusted. YoY/QoQ EPS comparisons across the split are prohibited until a separate share-basis contract is proven.</p>}
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
  const [onlyNew, setOnlyNew] = useState(false)
  const [maxHorizontalScroll, setMaxHorizontalScroll] = useState(0)
  const [horizontalOffset, setHorizontalOffset] = useState(0)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [insightExpanded, setInsightExpanded] = useState(false)
  const analysisRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const periods = useMemo(() => makePeriods(), [])

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const measure = () => {
      const max = Math.max(0, grid.scrollWidth - grid.clientWidth)
      setMaxHorizontalScroll(max)
      if (grid.scrollLeft > max) grid.scrollLeft = max
      setHorizontalOffset(grid.scrollLeft)
    }
    measure()
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null
    observer?.observe(grid)
    const table = grid.querySelector("table")
    if (table) observer?.observe(table)
    window.addEventListener("resize", measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [periods.length, evidenceRevision])

  const scrollQuartersTo = (requested: number) => {
    const grid = gridRef.current
    if (!grid) return
    const next = Math.min(maxHorizontalScroll, Math.max(0, requested))
    grid.scrollLeft = next
    setHorizontalOffset(next)
  }

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

  const industryCalibrations = useMemo(() => buildIndustryR5Calibrations(observations, entries.map((e) => ({securityId:e.position.securityId, sector:e.position.sector, industry:e.position.industry}))), [observations, entries])
  const sourceCompanyCount = new Set(observations.map((r) => r.securityId)).size
  const sourceQuarterCount = new Set(observations.map((r) => r.securityId + "|" + r.periodEnd)).size
  const industries = useMemo(() => [...new Set(entries.map((e) => e.position.industry ?? "Unclassified"))].sort(), [entries])
  const r5Coverage = useMemo(() => {
    const eligible = entries.filter(e => hasFourQualifiedQuarters(observations, e))
    const counts = { STRONG: 0, MIXED: 0, WEAK: 0, UNAVAILABLE: 0,
      peer: 0, trajectory: 0 }
    for (const entry of eligible) {
      const grade = gradeQuarterR5(observations, entry.position.securityId, "2026-06-30",
        entry.position.sector, entry.position.industry, industryCalibrations)
      counts[grade.status] += 1
      if (grade.basis === "INDUSTRY_PEER") counts.peer++
      if (grade.basis === "COMPANY_TREND") counts.trajectory++
    }
    return { complete: eligible.length, counts }
  }, [entries, observations, industryCalibrations])
  const filtered = useMemo(() => entries.filter((e) => {
    const p = e.position
    if (query.trim() && !(p.symbol + " " + p.company).toLowerCase().includes(query.trim().toLowerCase())) return false
    if (filter !== "ALL" && e.kind !== filter) return false
    if (industry !== "ALL" && (p.industry ?? "Unclassified") !== industry) return false
    if (onlyNew && !observations.some(row => row.securityId === p.securityId && row.periodEnd === periods[0]?.end)) return false
    if (statuses.size > 0 && !periods.some((period) => statuses.has(resultStatus(observations, e, period.end, industryCalibrations)))) return false
    return true
  }), [entries, query, filter, industry, statuses, observations, periods, industryCalibrations, onlyNew])

  const suggestedEntry = entries.find((e) => observations.some((r) => r.securityId === e.position.securityId && r.selected && periods.some((p) => p.end === r.periodEnd))) ?? entries[0]
  const newestObservation = suggestedEntry
    ? observations.filter((r) => r.securityId === suggestedEntry.position.securityId && r.selected && periods.some((p) => p.end === r.periodEnd))
        .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0]
    : null
  const effectiveSelection = collapsed || loadingEvidence ? null : selection ?? (suggestedEntry && periods[0]
    ? { securityId: suggestedEntry.position.securityId, periodEnd: newestObservation?.periodEnd ?? periods[0].end }
    : null)
  const chosen = effectiveSelection ? filtered.find((e) => e.position.securityId === effectiveSelection.securityId) ?? null : null
  const period = effectiveSelection ? periods.find((p) => p.end === effectiveSelection.periodEnd) ?? null : null
  const detailRows = chosen && period ? forQuarter(observations, chosen.position.securityId, period.end) : []
  const allDetailRows = chosen && period ? allForQuarter(observations, chosen.position.securityId, period.end) : []
  const grade = chosen && period ? resultStatus(observations, chosen, period.end, industryCalibrations) : "UNAVAILABLE"
  const activeIndex = period ? periods.findIndex((p) => p.end === period.end) : -1
  const showPreview = (event: React.SyntheticEvent<HTMLButtonElement>, entry: Entry, p: Period, rows: readonly ResultsSourceObservation[]) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const left = Math.min(Math.max(14, rect.left + 10), Math.max(14, window.innerWidth - 298))
    const top = Math.max(14, Math.min(rect.bottom + 8, window.innerHeight - 220))
    setPreview({ entry, period: p, observations: rows, history: observations, left, top })
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
    setQuery(""); setFilter("ALL"); setIndustry("ALL"); setStatuses(new Set()); setOnlyNew(false); setScrollTop(0)
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
        <div><span>Last scan</span><strong>{scanStatus?.run?.status === "RUNNING" ? scanBusy ? "Scanning…" : "Paused · resume" : scanStatus?.lastScan ? new Date(scanStatus.lastScan).toLocaleString("en-IN", {timeZone:"Asia/Kolkata"}) : "Not run"}</strong><small>{scanStatus?.run ? scanStatus.run.processed + " of " + scanStatus.run.requested_count + " equities checked" : "Manual scan available"}</small></div>
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
        <button type="button" className={onlyNew ? "active" : ""} aria-pressed={onlyNew} onClick={() => { setOnlyNew(v => !v); setScrollTop(0) }} title="Show companies with observations in the latest reported quarter"><span className="ref-status-dot new"/>Newly Reported</button>
        <button type="button" className="clear-filter" onClick={clearFilters}>Clear Filters</button>
      </div>
      <section className="ref-r5-summary" aria-label="R5 quarterly grade coverage">
        <strong>R5 · Jun 2026</strong>
        <span>{loadingEvidence ? "Assessing selected source data…" :
          r5Coverage.complete + " / " + entries.length + " stocks with four qualified quarters · " + (entries.length - r5Coverage.complete) + " R3 pending"}</span>
        <span className="ref-r5-strong">Strong {r5Coverage.counts.STRONG}</span>
        <span className="ref-r5-mixed">Mixed {r5Coverage.counts.MIXED}</span>
        <span className="ref-r5-weak">Weak {r5Coverage.counts.WEAK}</span>
        <span>Not rated {r5Coverage.counts.UNAVAILABLE}</span>
        <small>{r5Coverage.counts.peer} peer-ranked · {r5Coverage.counts.trajectory} own-trend · separate assessment methods</small>
      </section>
      {scanError ? <p className="ref-evidence-error" role="alert">Results scan: {scanError}</p> : null}
      {evidenceError ? <p className="ref-evidence-error" role="alert">Financial source data could not be loaded: {evidenceError}. Portfolio membership is unaffected.</p> : null}
      <div className="results-matrix-shell" ref={gridRef} aria-label="Quarterly results matrix" tabIndex={0} onScroll={(e) => { setScrollTop(e.currentTarget.scrollTop); setHorizontalOffset(e.currentTarget.scrollLeft) }}>
        <table className="results-matrix" style={{ minWidth: `${14.4 + periods.length * 16.5}rem` }}>
          <thead><tr><th className="stock-column"><span>{filtered.length} stocks</span>Stock</th>{periods.map((p, i) => <th key={p.end}>{p.label}{i === 0 ? <small>(Rolling reports) ↓</small> : null}</th>)}</tr></thead>
          <tbody>
            {start > 0 ? <tr className="virtual-spacer"><td colSpan={periods.length + 1} style={{ height: start * rowHeight }} /></tr> : null}
            {visible.map((entry) => <tr key={entry.position.securityId}><th scope="row" className="stock-column">{entry.position.symbol}<small>{entry.position.industry ?? "Unclassified"} · {entry.kind === "CURRENT" ? "Current" : "Closed"}</small></th>{periods.map((p) => {
              const rows = forQuarter(observations, entry.position.securityId, p.end)
              const primary = primaryObservation(rows, isBank(entry.position.industry) || hasBankMetrics(rows))
              const outcome = gradeQuarterR5(observations, entry.position.securityId, p.end,
                entry.position.sector, entry.position.industry, industryCalibrations)
              const status = outcome.status
              const pending = rows.length > 0 && !rows.some((r) => r.selected)
              const active = effectiveSelection?.securityId === entry.position.securityId && effectiveSelection.periodEnd === p.end
              return <td key={p.end}><button className={"result-pill ref-cell " + (rows.length ? (pending ? "ref-pending" : "ref-" + status.toLowerCase()) : "ref-empty") + (active ? " selected" : "")}
                type="button" aria-pressed={active} title={outcome.explanation}
                aria-label={entry.position.symbol + " " + p.label + ": " + (primary ? quarterCellLabel(observations, entry, p, primary) + (pending ? ", review pending" : "") : "not available") + "; grade " + statusName(status) + "; " + outcome.basis}
                onClick={() => selectCell(entry, p)}
                onMouseEnter={(e) => showPreview(e, entry, p, rows)} onFocus={(e) => showPreview(e, entry, p, rows)}
                onMouseLeave={() => setPreview(null)} onBlur={() => setPreview(null)}>
                <StatusDot status={status} pending={pending}/><span>{loadingEvidence ? "Loading" : quarterCellLabel(observations, entry, p, primary)}</span><small className="ref-grade-mark">{statusName(status)}</small>
              </button></td>
            })}</tr>)}
            {end < filtered.length ? <tr className="virtual-spacer"><td colSpan={periods.length + 1} style={{ height: (filtered.length - end) * rowHeight }} /></tr> : null}
          </tbody>
        </table>
      </div>
      <nav className="results-quarter-navigator" aria-label="Quarterly results horizontal navigation">
        <button type="button" aria-label="Scroll towards latest quarters" onClick={() => scrollQuartersTo(horizontalOffset - (gridRef.current?.clientWidth ?? 400) * .7)} disabled={horizontalOffset <= 0}>‹</button>
        <span className="results-quarter-nav-label">Latest</span>
        <input type="range" min={0} max={Math.max(1, maxHorizontalScroll)} step={1} value={Math.min(horizontalOffset, Math.max(1, maxHorizontalScroll))} disabled={maxHorizontalScroll <= 0} aria-label="Scroll quarterly results horizontally" aria-valuetext={maxHorizontalScroll > 0 ? `${Math.round(horizontalOffset / maxHorizontalScroll * 100)}% toward older quarters` : "All quarters visible"} onChange={(e) => scrollQuartersTo(Number(e.currentTarget.value))}/>
        <span className="results-quarter-nav-label">Older</span>
        <button type="button" aria-label="Scroll towards older quarters" onClick={() => scrollQuartersTo(horizontalOffset + (gridRef.current?.clientWidth ?? 400) * .7)} disabled={maxHorizontalScroll <= 0 || horizontalOffset >= maxHorizontalScroll}>›</button>
      </nav>
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
          <MetricsCard period={period} rows={detailRows} allRows={observations} securityId={chosen.position.securityId}/>
          <InsightCard entry={chosen} rows={detailRows} allRows={observations} periodEnd={period.end} calibrations={industryCalibrations} expanded={insightExpanded} onToggle={() => setInsightExpanded((value) => !value)}/>
        </div>
        {insightExpanded ? <FullAiAnalysis entry={chosen} period={period} rows={detailRows} allRows={observations} calibrations={industryCalibrations}/> : null}
        <EvidenceDetails rows={allDetailRows} period={period}/>
      </div> : null}
      <footer className="results-footnote">ⓘ Portfolio coverage includes current and fully closed equities. Quarter values are shown only where available, with their verification state; manual source scans are available; scheduled daily collection is not yet enabled.</footer>
    </section>
    {preview ? <PreviewCard preview={preview} calibrations={industryCalibrations}/> : null}
  </section>
}
