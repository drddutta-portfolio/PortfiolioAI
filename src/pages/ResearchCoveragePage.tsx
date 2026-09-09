import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { PortfolioPosition } from "../features/portfolio/types"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import type { ResearchCoverageRow, ResearchCoverageState } from "../features/research/researchCoverage"
import { useResearchCoverage } from "../features/research/useResearchCoverage"

const COVERAGE_STATES: readonly ResearchCoverageState[] = ["FRESH", "STALE", "MISSING", "CONFLICTING", "REVIEW_REQUIRED", "NOT_APPLICABLE"]
const EMPTY_POSITIONS: readonly PortfolioPosition[] = []

export function ResearchCoveragePage() {
  const { portfolio, error: portfolioError, isLoading: portfolioLoading } = usePortfolioView()
  const positions = portfolio?.openPositions ?? EMPTY_POSITIONS
  const coverage = useResearchCoverage(positions)
  const [query, setQuery] = useState("")
  const [state, setState] = useState("ALL")
  const [role, setRole] = useState("ALL")
  const [theme, setTheme] = useState("ALL")
  const [sector, setSector] = useState("ALL")
  const [marketCap, setMarketCap] = useState("ALL")
  const [eligibility, setEligibility] = useState("ALL")
  const [identity, setIdentity] = useState("ALL")

  const options = useMemo(() => ({
    roles: unique(coverage.data.map((row) => row.role)),
    themes: unique(coverage.data.flatMap((row) => row.themes)),
    sectors: unique(coverage.data.map((row) => row.sector).filter((value): value is string => Boolean(value))),
    marketCaps: unique(coverage.data.map((row) => row.marketCapCategory).filter((value): value is string => Boolean(value))),
  }), [coverage.data])

  const rows = useMemo(() => coverage.data.filter((row) => {
    const text = `${row.symbol} ${row.company}`.toLocaleUpperCase()
    return text.includes(query.trim().toLocaleUpperCase())
      && (state === "ALL" || row.overall === state)
      && (role === "ALL" || row.role === role)
      && (theme === "ALL" || row.themes.includes(theme))
      && (sector === "ALL" || row.sector === sector)
      && (marketCap === "ALL" || row.marketCapCategory === marketCap)
      && (eligibility === "ALL" || (eligibility === "ELIGIBLE") === row.equityEligible)
      && (identity === "ALL" || row.providerIdentity === identity)
  }), [coverage.data, eligibility, identity, marketCap, query, role, sector, state, theme])

  if (portfolioLoading) return <Loading label="Loading portfolio research coverage…" />
  if (portfolioError || !portfolio) return <div className="notice notice-error" role="alert">{portfolioError ?? "Portfolio research coverage could not be loaded."}</div>
  if (coverage.isLoading) return <Loading label="Loading cached research coverage…" />
  if (coverage.error) return <div className="notice notice-error" role="alert"><strong>Cached coverage could not be loaded.</strong><span>{coverage.error}</span></div>

  const counts = COVERAGE_STATES.reduce<Record<string, number>>((result, value) => ({ ...result, [value]: coverage.data.filter((row) => row.overall === value).length }), {})

  return <section className="research-page">
    <div className="portfolio-hero compact-hero"><div><p className="eyebrow">Stage 7.2D.1 · cache-only coverage</p><h1>Research Coverage</h1><p>See where stored company research is fresh, stale, missing, conflicting, or requires review. Browsing and filtering this page never refreshes a provider.</p></div><Link className="button button-secondary" to="/app/settings/data-sources">Data Sources / Refresh</Link></div>

    <section className="summary-grid" aria-label="Research coverage summary">
      <Summary label="Open holdings" value={coverage.data.length} />
      <Summary label="Fresh" value={counts.FRESH ?? 0} />
      <Summary label="Stale" value={counts.STALE ?? 0} />
      <Summary label="Missing" value={counts.MISSING ?? 0} />
      <Summary label="Conflicting" value={counts.CONFLICTING ?? 0} />
      <Summary label="Review required" value={counts.REVIEW_REQUIRED ?? 0} />
    </section>

    <section className="panel">
      <div className="research-filter-grid">
        <label><span>Find a security</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ticker or company" /></label>
        <Filter label="Overall" value={state} onChange={setState} options={COVERAGE_STATES} />
        <Filter label="Role" value={role} onChange={setRole} options={options.roles} />
        <Filter label="Theme" value={theme} onChange={setTheme} options={options.themes} />
        <Filter label="Sector" value={sector} onChange={setSector} options={options.sectors} />
        <Filter label="Market cap" value={marketCap} onChange={setMarketCap} options={options.marketCaps} />
        <Filter label="Equity eligibility" value={eligibility} onChange={setEligibility} options={["ELIGIBLE", "NOT_ELIGIBLE"]} />
        <Filter label="Provider identity" value={identity} onChange={setIdentity} options={COVERAGE_STATES} />
      </div>
      <p className="assessment-note">{rows.length} of {coverage.data.length} holdings shown. Provider identity and evidence states are derived only from stored records.</p>
    </section>

    {rows.length ? <div className="research-table-wrap" tabIndex={0} aria-label="Scrollable portfolio research coverage"><table className="research-table research-coverage-table"><thead><tr><th>Security</th><th>Overall</th><th>Identity</th><th>Fundamentals</th><th>Ownership</th><th>Valuation</th><th>Documents</th><th>Issues</th><th>Latest evidence</th></tr></thead><tbody>{rows.map((row) => <CoverageTableRow key={row.securityId} row={row} />)}</tbody></table></div> : <section className="panel"><h2>No matching holdings</h2><p>Adjust the coverage filters to broaden the result.</p></section>}
  </section>
}

function CoverageTableRow({ row }: { readonly row: ResearchCoverageRow }) {
  return <tr><td><Link to={`/app/research/${row.securityId}`}><strong>{row.symbol}</strong></Link><small>{row.company}</small><small>{row.role === "UNCLASSIFIED" ? "Unclassified" : titleCase(row.role)} · {row.sector ?? "Sector unavailable"}</small></td><td><CoverageBadge value={row.overall} /></td><td><CoverageBadge value={row.providerIdentity} /></td><td><CoverageBadge value={row.fundamentals} /></td><td><CoverageBadge value={row.ownership} /></td><td><CoverageBadge value={row.valuation} /></td><td><CoverageBadge value={row.documents} /></td><td><span>{row.conflictCount} conflict{row.conflictCount === 1 ? "" : "s"}</span><small>{row.reviewRequiredCount} review required</small></td><td>{row.latestEvidenceAt ? dateTime(row.latestEvidenceAt) : "Unavailable"}</td></tr>
}

function CoverageBadge({ value }: { readonly value: ResearchCoverageState }) {
  return <span className={`status status-${value.toLocaleLowerCase().replaceAll("_", "-")}`}>{value === "NOT_APPLICABLE" ? "N/A" : titleCase(value)}</span>
}

function Filter({ label, value, onChange, options }: { readonly label: string; readonly value: string; readonly onChange: (value: string) => void; readonly options: readonly string[] }) {
  return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="ALL">All</option>{options.map((option) => <option key={option} value={option}>{titleCase(option)}</option>)}</select></label>
}

function Summary({ label, value }: { readonly label: string; readonly value: number }) {
  return <article className="summary-card"><span>{label}</span><strong>{value}</strong></article>
}

function Loading({ label }: { readonly label: string }) { return <div className="page-loader" role="status">{label}</div> }
function unique(values: readonly string[]) { return [...new Set(values)].sort((left, right) => left.localeCompare(right)) }
function titleCase(value: string) { return value.toLocaleLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toLocaleUpperCase()) }
function dateTime(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "Unavailable" : parsed.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) }
