import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { estimateResearchRefresh, type ResearchRefreshPlan } from "../data/researchCoverageRepository"
import type { PortfolioPosition } from "../features/portfolio/types"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import type { ResearchCoverageRow, ResearchCoverageState } from "../features/research/researchCoverage"
import { useResearchCoverage } from "../features/research/useResearchCoverage"
import { displayError } from "../lib/displayError"

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
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [documentSelection, setDocumentSelection] = useState<ReadonlySet<string>>(new Set())
  const [estimate, setEstimate] = useState<ResearchRefreshPlan | null>(null)
  const [estimateError, setEstimateError] = useState<string | null>(null)
  const [estimating, setEstimating] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)

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

  const selectedRows = useMemo(() => coverage.data.filter((row) => selected.has(row.securityId)), [coverage.data, selected])
  const selectableVisibleRows = rows.filter((row) => row.equityEligible)

  const toggleSelected = (securityId: string) => {
    setEstimate(null); setEstimateError(null); setAcknowledged(false)
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(securityId)) { next.delete(securityId); setDocumentSelection((docs) => { const copy = new Set(docs); copy.delete(securityId); return copy }) }
      else next.add(securityId)
      return next
    })
  }
  const toggleDocuments = (securityId: string) => {
    setEstimate(null); setEstimateError(null); setAcknowledged(false)
    setDocumentSelection((current) => {
      const next = new Set(current)
      if (next.has(securityId)) next.delete(securityId)
      else if (next.size < 3) next.add(securityId)
      return next
    })
  }
  const selectVisible = () => {
    setEstimate(null); setEstimateError(null); setAcknowledged(false)
    setSelected((current) => new Set([...current, ...selectableVisibleRows.map((row) => row.securityId)]))
  }
  const clearSelection = () => { setSelected(new Set()); setDocumentSelection(new Set()); setEstimate(null); setEstimateError(null); setAcknowledged(false) }
  const runEstimate = async () => {
    if (!portfolio || !selected.size) return
    setEstimating(true); setEstimate(null); setEstimateError(null); setAcknowledged(false)
    try { setEstimate(await estimateResearchRefresh(portfolio.portfolio.id, [...selected], [...documentSelection])) }
    catch (reason: unknown) { setEstimateError(displayError(reason)) }
    finally { setEstimating(false) }
  }

  if (portfolioLoading) return <Loading label="Loading portfolio research coverage…" />
  if (portfolioError || !portfolio) return <div className="notice notice-error" role="alert">{portfolioError ?? "Portfolio research coverage could not be loaded."}</div>
  if (coverage.isLoading) return <Loading label="Loading cached research coverage…" />
  if (coverage.error) return <div className="notice notice-error" role="alert"><strong>Cached coverage could not be loaded.</strong><span>{coverage.error}</span></div>

  const counts = COVERAGE_STATES.reduce<Record<string, number>>((result, value) => ({ ...result, [value]: coverage.data.filter((row) => row.overall === value).length }), {})

  return <section className="research-page">
    <div className="portfolio-hero compact-hero"><div><p className="eyebrow">Cache-first research coverage</p><h1>Research Coverage</h1><p>See stored research coverage and explicitly estimate refresh work. Browsing, filtering, selecting holdings and reviewing an estimate do not refresh Trendlyne.</p></div><Link className="button button-secondary" to="/app/settings/data-sources">Data Sources / Refresh</Link></div>

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

    <section className="panel refresh-planning-toolbar" aria-label="Research refresh planning">
      <div><h2>Refresh planning</h2><p>Select eligible equities, then explicitly ask PortfolioAI to estimate stale/missing research work. The estimate itself consumes zero provider calls.</p></div>
      <div className="refresh-planning-actions"><button className="button button-secondary" type="button" onClick={selectVisible} disabled={!selectableVisibleRows.length}>Select visible equities</button><button className="button button-secondary" type="button" onClick={clearSelection} disabled={!selected.size}>Clear</button><button className="button button-primary" type="button" onClick={() => void runEstimate()} disabled={!selected.size || estimating}>{estimating ? "Estimating…" : `Estimate refresh (${selected.size})`}</button></div>
    </section>

    {estimateError ? <div className="notice notice-error" role="alert">{estimateError}</div> : null}
    {estimate ? <RefreshPlanPanel estimate={estimate} selectedRows={selectedRows} documentSelection={documentSelection} acknowledged={acknowledged} onAcknowledge={setAcknowledged} /> : null}

    {rows.length ? <div className="research-table-wrap" tabIndex={0} aria-label="Scrollable portfolio research coverage"><table className="research-table research-coverage-table"><thead><tr><th>Plan</th><th>Security</th><th>Overall</th><th>Identity</th><th>Fundamentals</th><th>Ownership</th><th>Valuation</th><th>Documents</th><th>Issues</th><th>Latest evidence</th></tr></thead><tbody>{rows.map((row) => <CoverageTableRow key={row.securityId} row={row} selected={selected.has(row.securityId)} documentsSelected={documentSelection.has(row.securityId)} documentLimitReached={documentSelection.size >= 3} onToggleSelected={toggleSelected} onToggleDocuments={toggleDocuments} />)}</tbody></table></div> : <section className="panel"><h2>No matching holdings</h2><p>Adjust the coverage filters to broaden the result.</p></section>}
  </section>
}

function CoverageTableRow({ row, selected, documentsSelected, documentLimitReached, onToggleSelected, onToggleDocuments }: { readonly row: ResearchCoverageRow; readonly selected: boolean; readonly documentsSelected: boolean; readonly documentLimitReached: boolean; readonly onToggleSelected: (securityId: string) => void; readonly onToggleDocuments: (securityId: string) => void }) {
  return <tr><td>{row.equityEligible ? <div className="refresh-select-cell"><label><input type="checkbox" checked={selected} onChange={() => onToggleSelected(row.securityId)} aria-label={`Select ${row.symbol} for refresh planning`} /> Select</label>{selected ? <label><input type="checkbox" checked={documentsSelected} disabled={!documentsSelected && documentLimitReached} onChange={() => onToggleDocuments(row.securityId)} aria-label={`Include document discovery for ${row.symbol}`} /> Documents</label> : null}</div> : <small>Not eligible</small>}</td><td><Link to={`/app/research/${row.securityId}`}><strong>{row.symbol}</strong></Link><small>{row.company}</small><small>{row.role === "UNCLASSIFIED" ? "Unclassified" : titleCase(row.role)} · {row.sector ?? "Sector unavailable"}</small></td><td><CoverageBadge value={row.overall} /></td><td><CoverageBadge value={row.providerIdentity} /></td><td><CoverageBadge value={row.fundamentals} /></td><td><CoverageBadge value={row.ownership} /></td><td><CoverageBadge value={row.valuation} /></td><td><CoverageBadge value={row.documents} /></td><td><span>{row.conflictCount} conflict{row.conflictCount === 1 ? "" : "s"}</span><small>{row.reviewRequiredCount} review required</small></td><td>{row.latestEvidenceAt ? dateTime(row.latestEvidenceAt) : "Unavailable"}</td></tr>
}

function RefreshPlanPanel({ estimate, selectedRows, documentSelection, acknowledged, onAcknowledge }: { readonly estimate: ResearchRefreshPlan; readonly selectedRows: readonly ResearchCoverageRow[]; readonly documentSelection: ReadonlySet<string>; readonly acknowledged: boolean; readonly onAcknowledge: (value: boolean) => void }) {
  const requiredDomains = estimate.plan.securities.reduce((count, security) => count + Object.values(security.domains).filter((value) => value === "REQUIRED").length, 0)
  const skippedDomains = estimate.plan.securities.reduce((count, security) => count + Object.values(security.domains).filter((value) => value === "SKIPPED_FRESH").length, 0)
  return <section className="panel refresh-plan-panel" aria-live="polite"><div className="section-heading"><div><p className="eyebrow">Owner review required</p><h2>Conservative refresh estimate</h2><p>This server-side plan used cached evidence and the same physical-call planner as the controlled cohort workflow. The planning request itself made <strong>{estimate.providerCalls} provider calls</strong> and consumed <strong>{estimate.budgetConsumed} budget units</strong>.</p></div><span className={`status ${estimate.fitsDailyBudget ? "status-fresh" : "status-conflicting"}`}>{estimate.fitsDailyBudget ? "Fits internal budget" : "Over internal budget"}</span></div>
    <div className="summary-grid"><Metric label="Selected equities" value={String(estimate.selectedSecurityCount)} /><Metric label="Required domains" value={String(requiredDomains)} /><Metric label="Fresh domains skipped" value={String(skippedDomains)} /><Metric label="Base calls" value={String(estimate.plan.baseCalls)} /><Metric label="Retry reserve" value={String(estimate.plan.retryReserve)} /><Metric label="Worst case" value={String(estimate.plan.worstCaseAttempts)} /></div>
    <div className="coverage-columns"><article><h3>Internal daily safety budget</h3><p>{estimate.dailyObservedUsage} observed → {estimate.projectedDailyUsage} projected of {estimate.dailyInternalAttemptLimit} internal attempts.</p><p className="assessment-note">This is a PortfolioAI safety ceiling, not a Trendlyne contractual quota.</p></article><article><h3>Provider quota status</h3><p><strong>{titleCase(estimate.providerQuotaStatus)}</strong></p><p className="assessment-note">Unknown remains unknown unless independently verified.</p></article></div>
    <div className="refresh-plan-security-list"><h3>Planned holdings</h3>{estimate.plan.securities.map((security) => <div key={security.securityId}><strong>{security.symbol}</strong><span>{Object.entries(security.domains).filter(([, value]) => value === "REQUIRED").map(([domain]) => titleCase(domain)).join(", ") || "All approved domains fresh"}</span><small>{security.baseCalls} base call{security.baseCalls === 1 ? "" : "s"}{documentSelection.has(security.securityId) ? " · documents included" : ""}</small></div>)}</div>
    <p className="assessment-note">Selected: {selectedRows.map((row) => row.symbol).join(", ")}. Batches: {estimate.plan.batches.length || 0}; per-run internal ceiling: {estimate.perRunInternalAttemptLimit}.</p>
    <label className="refresh-acknowledgement"><input type="checkbox" checked={acknowledged} onChange={(event) => onAcknowledge(event.target.checked)} /> I reviewed this estimate and understand that this estimate does not execute a provider refresh.</label>
    <button className="button button-primary" type="button" disabled>{acknowledged ? "Estimate reviewed · execution remains separate" : "Review and acknowledge estimate"}</button>
  </section>
}

function CoverageBadge({ value }: { readonly value: ResearchCoverageState }) { return <span className={`status status-${value.toLocaleLowerCase().replaceAll("_", "-")}`}>{value === "NOT_APPLICABLE" ? "N/A" : titleCase(value)}</span> }
function Filter({ label, value, onChange, options }: { readonly label: string; readonly value: string; readonly onChange: (value: string) => void; readonly options: readonly string[] }) { return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="ALL">All</option>{options.map((option) => <option key={option} value={option}>{titleCase(option)}</option>)}</select></label> }
function Summary({ label, value }: { readonly label: string; readonly value: number }) { return <article className="summary-card"><span>{label}</span><strong>{value}</strong></article> }
function Metric({ label, value }: { readonly label: string; readonly value: string }) { return <article className="summary-card"><span>{label}</span><strong>{value}</strong></article> }
function Loading({ label }: { readonly label: string }) { return <div className="page-loader" role="status">{label}</div> }
function unique(values: readonly string[]) { return [...new Set(values)].sort((left, right) => left.localeCompare(right)) }
function titleCase(value: string) { return value.toLocaleLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toLocaleUpperCase()) }
function dateTime(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "Unavailable" : parsed.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) }
