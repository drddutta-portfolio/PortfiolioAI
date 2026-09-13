import { useMemo } from "react"
import { Link } from "react-router-dom"
import type { ResearchCoverageRow, ResearchCoverageState } from "../features/research/researchCoverage"
import { useResearchCoverage } from "../features/research/useResearchCoverage"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import "./DashboardResearchIntelligence.css"

const STATES: readonly ResearchCoverageState[] = ["FRESH", "STALE", "MISSING", "CONFLICTING", "REVIEW_REQUIRED", "NOT_APPLICABLE"]
const STATE_PRIORITY: Readonly<Record<ResearchCoverageState, number>> = { CONFLICTING: 6, REVIEW_REQUIRED: 5, MISSING: 4, STALE: 3, FRESH: 1, NOT_APPLICABLE: 0 }
const DOMAINS = [
  ["Provider identity", "providerIdentity"],
  ["Fundamentals", "fundamentals"],
  ["Ownership", "ownership"],
  ["Valuation", "valuation"],
  ["Documents", "documents"],
] as const

type DomainKey = typeof DOMAINS[number][1]

function title(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function stateClass(state: ResearchCoverageState) {
  if (state === "FRESH") return "good"
  if (state === "STALE") return "warning"
  if (state === "CONFLICTING" || state === "REVIEW_REQUIRED") return "critical"
  if (state === "MISSING") return "missing"
  return "neutral"
}

function ageLabel(value: string | null) {
  if (!value) return "No stored evidence"
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return "Evidence date unavailable"
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
  if (days === 0) return "Updated today"
  if (days === 1) return "Updated 1 day ago"
  return `Updated ${days} days ago`
}

function issueSummary(row: ResearchCoverageRow) {
  const issues = DOMAINS.filter(([, key]) => !["FRESH", "NOT_APPLICABLE"].includes(row[key])).map(([label, key]) => `${label}: ${title(row[key])}`)
  return issues.length ? issues.join(" · ") : "All applicable research domains are fresh"
}

export function DashboardResearchIntelligence() {
  const { portfolio, isLoading: portfolioLoading, error: portfolioError } = usePortfolioView()
  const positions = portfolio?.openPositions ?? []
  const coverage = useResearchCoverage(positions)

  const summary = useMemo(() => {
    const rows = coverage.data
    const counts = Object.fromEntries(STATES.map((state) => [state, rows.filter((row) => row.overall === state).length])) as Record<ResearchCoverageState, number>
    const applicable = rows.filter((row) => row.overall !== "NOT_APPLICABLE")
    const freshPercent = applicable.length ? Math.round(((counts.FRESH ?? 0) / applicable.length) * 100) : 0
    const latest = rows.map((row) => row.latestEvidenceAt).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null
    return { counts, applicable: applicable.length, freshPercent, latest }
  }, [coverage.data])

  const attention = useMemo(() => [...coverage.data]
    .filter((row) => !["FRESH", "NOT_APPLICABLE"].includes(row.overall))
    .sort((a, b) => STATE_PRIORITY[b.overall] - STATE_PRIORITY[a.overall] || b.reviewRequiredCount - a.reviewRequiredCount || b.conflictCount - a.conflictCount || a.symbol.localeCompare(b.symbol))
    .slice(0, 12), [coverage.data])

  const domainRows = useMemo(() => DOMAINS.map(([label, key]) => {
    const applicable = coverage.data.filter((row) => row[key] !== "NOT_APPLICABLE")
    const fresh = applicable.filter((row) => row[key] === "FRESH").length
    return { label, key, fresh, applicable: applicable.length, pct: applicable.length ? Math.round((fresh / applicable.length) * 100) : 0 }
  }), [coverage.data])

  if (portfolioLoading || portfolioError || !portfolio) return null

  return <section className="dashboard-research-intelligence" aria-label="Research and intelligence status">
    <div className="dashboard-research-heading">
      <div><p className="eyebrow">Research & intelligence status</p><h2>How well researched is the portfolio?</h2><p>Cache-first view of stored identity, fundamentals, ownership, valuation and document evidence. Browsing this panel never triggers provider refreshes.</p></div>
      <Link to="/app/research">Open research coverage →</Link>
    </div>

    {coverage.isLoading ? <div className="dashboard-research-loading">Loading cached research coverage…</div> : null}
    {coverage.error ? <div className="dashboard-research-error">Research coverage could not be loaded: {coverage.error}</div> : null}

    {!coverage.isLoading && !coverage.error ? <>
      <div className="dashboard-research-summary">
        <article className="research-summary-card hero"><span>Fresh research coverage</span><strong>{summary.freshPercent}%</strong><small>{summary.counts.FRESH ?? 0} of {summary.applicable} applicable holdings fully fresh</small></article>
        <article className="research-summary-card warning"><span>Stale</span><strong>{summary.counts.STALE ?? 0}</strong><small>Holdings with one or more expired evidence domains</small></article>
        <article className="research-summary-card missing"><span>Missing</span><strong>{summary.counts.MISSING ?? 0}</strong><small>Holdings missing required stored research evidence</small></article>
        <article className="research-summary-card critical"><span>Conflicting / review</span><strong>{(summary.counts.CONFLICTING ?? 0) + (summary.counts.REVIEW_REQUIRED ?? 0)}</strong><small>Evidence needing owner attention before reliance</small></article>
        <article className="research-summary-card neutral"><span>Latest evidence</span><strong>{summary.latest ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(summary.latest)) : "—"}</strong><small>{ageLabel(summary.latest)}</small></article>
      </div>

      <div className="dashboard-research-grid">
        <section className="dashboard-domain-coverage">
          <div className="dashboard-research-subheading"><div><span>Domain coverage</span><strong>Freshness by evidence layer</strong></div><Link to="/app/research">Full matrix →</Link></div>
          <div className="dashboard-domain-list">{domainRows.map((row) => <article key={row.key}><div><span>{row.label}</span><strong>{row.pct}%</strong></div><div className="dashboard-domain-track"><i style={{ width: `${row.pct}%` }} /></div><small>{row.fresh}/{row.applicable} applicable holdings fresh</small></article>)}</div>
        </section>

        <section className="dashboard-research-attention">
          <div className="dashboard-research-subheading"><div><span>Research attention queue</span><strong>{attention.length ? `${attention.length} highest-priority holdings` : "No immediate research gaps"}</strong></div><Link to="/app/research">Research →</Link></div>
          {attention.length ? <div className="dashboard-research-attention-list">{attention.map((row) => <article key={row.securityId} className={`state-${stateClass(row.overall)}`}>
            <div><Link to={`/app/research/${row.securityId}`}>{row.symbol}</Link><small>{row.company}</small></div>
            <div><span>{title(row.overall)}</span><p>{issueSummary(row)}</p></div>
            <small>{ageLabel(row.latestEvidenceAt)}</small>
          </article>)}</div> : <div className="dashboard-research-empty"><strong>Research coverage is currently fresh.</strong><span>No applicable holding is stale, missing, conflicting or awaiting review.</span></div>}
        </section>
      </div>
    </> : null}
  </section>
}
