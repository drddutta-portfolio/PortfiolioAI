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

type AttentionTier = "REVIEW_REQUIRED" | "CONFLICTING" | "MISSING" | "STALE"
const ATTENTION_PRIORITY: Readonly<Record<AttentionTier, number>> = { REVIEW_REQUIRED: 7, CONFLICTING: 6, MISSING: 4, STALE: 3 }

function title(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function stateClass(state: ResearchCoverageState | AttentionTier) {
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

function attentionTier(row: ResearchCoverageRow): AttentionTier | null {
  const states = DOMAINS.map(([, key]) => row[key])
  if (states.includes("REVIEW_REQUIRED")) return "REVIEW_REQUIRED"
  if (states.includes("CONFLICTING")) return "CONFLICTING"
  if (states.includes("MISSING")) return "MISSING"
  if (states.includes("STALE")) return "STALE"
  return null
}

export function DashboardResearchIntelligence() {
  const { portfolio, isLoading: portfolioLoading, error: portfolioError } = usePortfolioView()
  const positions = portfolio?.openPositions ?? []
  const coverage = useResearchCoverage(positions)

  const summary = useMemo(() => {
    const rows = coverage.data
    const counts = Object.fromEntries(STATES.map((state) => [state, rows.filter((row) => row.overall === state).length])) as Record<ResearchCoverageState, number>
    const applicable = rows.filter((row) => row.overall !== "NOT_APPLICABLE")
    const latest = rows.map((row) => row.latestEvidenceAt).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null

    let freshDomainSlots = 0
    let applicableDomainSlots = 0
    rows.forEach((row) => {
      DOMAINS.forEach(([, key]) => {
        if (row[key] === "NOT_APPLICABLE") return
        applicableDomainSlots += 1
        if (row[key] === "FRESH") freshDomainSlots += 1
      })
    })
    const freshEvidencePercent = applicableDomainSlots ? Math.round((freshDomainSlots / applicableDomainSlots) * 100) : 0
    const fullyFresh = counts.FRESH ?? 0
    const hardIssues = (counts.CONFLICTING ?? 0) + (counts.REVIEW_REQUIRED ?? 0)
    return { counts, applicable: applicable.length, latest, freshDomainSlots, applicableDomainSlots, freshEvidencePercent, fullyFresh, hardIssues }
  }, [coverage.data])

  const attention = useMemo(() => [...coverage.data]
    .map((row) => ({ row, tier: attentionTier(row) }))
    .filter((item): item is { row: ResearchCoverageRow; tier: AttentionTier } => item.tier !== null)
    .sort((a, b) => ATTENTION_PRIORITY[b.tier] - ATTENTION_PRIORITY[a.tier]
      || STATE_PRIORITY[b.row.overall] - STATE_PRIORITY[a.row.overall]
      || b.row.reviewRequiredCount - a.row.reviewRequiredCount
      || b.row.conflictCount - a.row.conflictCount
      || a.row.symbol.localeCompare(b.row.symbol))
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
        <article className="research-summary-card hero"><span>Fresh evidence coverage</span><strong>{summary.freshEvidencePercent}%</strong><small>{summary.freshDomainSlots} of {summary.applicableDomainSlots} applicable evidence slots fresh</small></article>
        <article className="research-summary-card neutral"><span>Fully fresh holdings</span><strong>{summary.fullyFresh}</strong><small>{summary.fullyFresh} of {summary.applicable} holdings fresh across every applicable domain</small></article>
        <article className="research-summary-card missing"><span>Missing</span><strong>{summary.counts.MISSING ?? 0}</strong><small>Holdings missing one or more required evidence domains</small></article>
        <article className="research-summary-card critical"><span>Conflicting / review</span><strong>{summary.hardIssues}</strong><small>Holdings with evidence requiring owner attention before reliance</small></article>
        <article className="research-summary-card neutral"><span>Latest evidence</span><strong>{summary.latest ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(summary.latest)) : "—"}</strong><small>{ageLabel(summary.latest)}</small></article>
      </div>

      <div className="dashboard-research-grid">
        <section className="dashboard-domain-coverage">
          <div className="dashboard-research-subheading"><div><span>Domain coverage</span><strong>Freshness by evidence layer</strong></div><Link to="/app/research">Full matrix →</Link></div>
          <div className="dashboard-domain-list">{domainRows.map((row) => <article key={row.key}><div><span>{row.label}</span><strong>{row.pct}%</strong></div><div className="dashboard-domain-track"><i style={{ width: `${row.pct}%` }} /></div><small>{row.fresh}/{row.applicable} applicable holdings fresh</small></article>)}</div>
        </section>

        <section className="dashboard-research-attention">
          <div className="dashboard-research-subheading"><div><span>Research attention queue</span><strong>{attention.length ? `${attention.length} highest-priority holdings` : "No immediate research gaps"}</strong></div><Link to="/app/research">Research →</Link></div>
          {attention.length ? <div className="dashboard-research-attention-list">{attention.map(({ row, tier }) => <article key={row.securityId} className={`state-${stateClass(tier)}`}>
            <div><Link to={`/app/research/${row.securityId}`}>{row.symbol}</Link><small>{row.company}</small></div>
            <div><span>{title(tier)}</span><p>{issueSummary(row)}</p></div>
            <small>{ageLabel(row.latestEvidenceAt)}</small>
          </article>)}</div> : <div className="dashboard-research-empty"><strong>Research coverage is currently fresh.</strong><span>No applicable holding is stale, missing, conflicting or awaiting review.</span></div>}
        </section>
      </div>
    </> : null}
  </section>
}
