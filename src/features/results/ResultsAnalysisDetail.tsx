import { useState } from "react"
import { templateForSecurity } from "./industryProfiles"
import type { QuarterlyMetric, QuarterlyResultSummary, ReportingPeriod, ResultSecurity } from "./types"

interface Props {
  readonly security: ResultSecurity
  readonly result: QuarterlyResultSummary
  readonly periods: readonly ReportingPeriod[]
}

const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 })
const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })

function displayNumber(value: number | null, unit: QuarterlyMetric["unit"]): string {
  if (value === null) return "Not available"
  if (unit === "INR_CRORE") return `₹${number.format(value)} Cr`
  if (unit === "INR") return `₹${number.format(value)}`
  return `${number.format(value)}%`
}

function displayPercent(value: number | null): string {
  return value === null ? "—" : `${value > 0 ? "+" : ""}${number.format(value)}%`
}

function signedClass(value: number | null) {
  if (value === null || value === 0) return ""
  return value > 0 ? "financial-positive" : "financial-negative"
}

function PositionCard({ security }: { readonly security: ResultSecurity }) {
  const p = security.position
  const rows: readonly [string, string][] = [
    ["Shares", number.format(p.quantity)],
    ["Average cost", p.averageCost === null ? "—" : rupees.format(p.averageCost)],
    ["Current price", p.currentPrice === null ? "—" : rupees.format(p.currentPrice)],
    ["Current value", p.currentValue === null ? "—" : rupees.format(p.currentValue)],
    [p.status === "OPEN" ? "Unrealised P&L" : "Realised P&L", p.pnl === null ? "—" : `${p.pnl > 0 ? "+" : ""}${rupees.format(p.pnl)} (${displayPercent(p.pnlPercent)})`],
    ["Portfolio weight", p.allocationPercent === null ? "—" : `${number.format(p.allocationPercent)}%`],
  ]
  return <section className="results-card position-card">
    <div className="results-card-heading"><h3>Portfolio Position</h3><span className="position-state">{p.status === "OPEN" ? "Open" : "Fully closed"}</span></div>
    <dl>{rows.map(([label,value]) => <div key={label}><dt>{label}</dt><dd className={label.includes("P&L") ? signedClass(p.pnl) : ""}>{value}</dd></div>)}</dl>
    {p.status === "CLOSED" ? <p className="r2-help">No current exposure. Historical results remain visible in this demo.</p> : null}
  </section>
}

function MetricChart({ security, periods, result }: Props) {
  const template = templateForSecurity(security)
  const [selectedMetric, setSelectedMetric] = useState(template.primaryMetricId)
  const available = new Set(result.metrics.map((metric) => metric.id))
  const options = [
    ...(template.kind === "BANK" ? [{ id: "nii", label: "NII" }] : [{ id: "revenue", label: "Revenue" }]),
    { id: "pat", label: "PAT" },
    { id: "eps", label: "EPS" },
  ].filter((item) => available.has(item.id))
  const units = result.metrics.find((metric) => metric.id === selectedMetric)?.unit ?? "INR_CRORE"
  const ascendingPeriods = [...periods].reverse()
  const series = ascendingPeriods.map((period) => {
    const observation = security.results.find((r) => r.periodId === period.id)
    return observation?.metrics.find((m) => m.id === selectedMetric)?.value ?? null
  })
  const largest = Math.max(1, ...series.filter((v): v is number => v !== null).map((v) => Math.abs(v)))
  const hasNegative = series.some((value) => value !== null && value < 0)
  const positiveHeight = hasNegative ? 46 : 88

  return <section className="results-card results-chart-card">
    <div className="results-card-heading r2-card-heading">
      <div><h3>{options.find((o) => o.id === selectedMetric)?.label ?? selectedMetric} — Last 6 Quarters</h3><span>Illustrative results · {units === "INR_CRORE" ? "₹ crore" : units === "INR" ? "₹ per share" : "%"}</span></div>
      <label className="r2-metric-picker">Metric
        <select aria-label="Chart metric" value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
          {options.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
    </div>
    <div className={`results-bars r2-bars ${hasNegative ? "r2-signed-chart" : ""}`} role="img" aria-label={`Demo ${selectedMetric} history: ${ascendingPeriods.map((p,i) => `${p.label} ${series[i] === null ? "unavailable" : series[i]}`).join(", ")}`}>
      {series.map((value, index) => {
        const period = ascendingPeriods[index]
        if (!period) return null
        const extent = value === null ? 0 : Math.max(5, Math.abs(value) / largest * positiveHeight)
        return <div className="results-bar-item" key={period.id}>
          <strong>{value === null ? "N/A" : number.format(value)}</strong>
          <div className="results-bar-track r2-signed-track">
            <div className="r2-axis" aria-hidden="true"/>
            {value === null ? <span className="r2-bar-missing" aria-label="Unavailable">—</span> :
              <i className={value < 0 ? "r2-negative-bar" : ""} style={value < 0 ? { top: "50%", height: `${extent}%` } : { bottom: hasNegative ? "50%" : "0%", height: `${extent}%` }}/>}
          </div>
          <span>{period.label}</span>
        </div>
      })}
    </div>
    <p className="r2-help">Bars reflect only the selected demo metric. Missing quarters remain blank.</p>
  </section>
}

function MetricsCard({ result, period }: { readonly result: QuarterlyResultSummary; readonly period: ReportingPeriod | undefined }) {
  return <section className="results-card metrics-card">
    <div className="results-card-heading"><h3>Key Metrics · {period?.label ?? "Unknown quarter"}</h3><span className="demo-chip">Demo</span></div>
    <div className="metrics-table-wrap">
      <table className="metrics-table">
        <thead><tr><th scope="col">Metric</th><th scope="col">Reported</th><th scope="col">QoQ</th><th scope="col">YoY</th></tr></thead>
        <tbody>{result.metrics.map((m) => <tr key={m.id}>
          <th scope="row">{m.label}</th><td>{displayNumber(m.value,m.unit)}</td><td className={signedClass(m.qoqPercent)}>{displayPercent(m.qoqPercent)}</td><td className={signedClass(m.yoyPercent)}>{displayPercent(m.yoyPercent)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="r2-help">Comparisons are demo placeholders, not independently calculated or verified.</p>
  </section>
}

function IndustryCard({ security, result }: Pick<Props, "security" | "result">) {
  const profile = templateForSecurity(security)
  const known = new Set(result.metrics.map((m) => m.label.toLowerCase()))
  return <section className="results-card r2-industry-card">
    <div className="results-card-heading"><h3>{profile.name} analysis</h3><span className="demo-chip">{profile.kind} template</span></div>
    <p className="r2-guidance">{profile.guidance}</p>
    <div className="r2-industry-metrics">{profile.metricLabels.map((label) => <div key={label}>
      <span>{label}</span><strong>{known.has(label.toLowerCase()) ? "Demo metric" : "Awaiting evidence"}</strong>
    </div>)}</div>
  </section>
}

function EvidenceCard() {
  return <section className="results-card r2-evidence-card">
    <div className="results-card-heading"><h3>Source & quality</h3><span className="demo-chip">Not verified</span></div>
    <dl>
      <div><dt>Reporting basis</dt><dd>Unknown</dd></div>
      <div><dt>Publication time</dt><dd>Not established</dd></div>
      <div><dt>Original filing</dt><dd>Not connected</dd></div>
      <div><dt>Data confidence</dt><dd>Demo only</dd></div>
      <div><dt>Research READY status</dt><dd>Not evaluated here</dd></div>
    </dl>
    <p className="r2-help">Source verification, lineage and publication precision will be connected after R2. No claims of filing or data coverage are made.</p>
  </section>
}

function InsightCard({ security, result }: Pick<Props, "security" | "result">) {
  return <section className="results-card insight-card">
    <div className="results-card-heading"><h3>✦ AI Insight</h3><span className="demo-chip">Preview only</span></div>
    <div className="insight-summary">
      <p>Example narrative layout for {security.symbol}. No AI model was invoked and no financial thesis was assessed.</p>
      <strong>Thesis impact: Not assessed</strong>
    </div>
    <ul>
      <li>Selected sample {result.primaryMetricLabel} YoY: {displayPercent(result.primaryMetricYoY)}.</li>
      <li>Industry commentary requires original filings and qualified observations.</li>
      <li>Scores and investment actions remain outside this demo.</li>
    </ul>
  </section>
}

export function ResultsAnalysisDetail({ security, result, periods }: Props) {
  const period = periods.find((p) => p.id === result.periodId)
  return <div className="r2-analysis-content">
    <div className="analysis-grid">
      <PositionCard security={security}/>
      <MetricChart key={security.id} security={security} result={result} periods={periods}/>
      <MetricsCard result={result} period={period}/>
      <InsightCard security={security} result={result}/>
    </div>
    <div className="r2-secondary-grid">
      <IndustryCard security={security} result={result}/>
      <EvidenceCard/>
    </div>
  </div>
}
