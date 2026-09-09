import Decimal from "decimal.js"
import { useMemo, useState, type KeyboardEvent } from "react"
import { Link, useParams } from "react-router-dom"
import { formatMoney, formatPercent, formatQuantity } from "../features/portfolio/format"
import type { PortfolioPosition } from "../features/portfolio/types"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { GROWTH_CODES, latestByCode, metricLabel, OWNERSHIP_CODES, QUALITY_CODES, VALUATION_CODES, coverageStatus, formatResearchMetric } from "../features/research/researchPolicy"
import type { ResearchEvidenceStatus, ResearchMetric, SecurityResearch } from "../features/research/types"
import { useSecurityResearch } from "../features/research/useSecurityResearch"

const TABS = ["Overview", "Financials", "Quality & Growth", "Ownership", "Valuation", "Documents", "Evidence"] as const
type Tab = typeof TABS[number]

export function ResearchPage() {
  const { security } = useParams()
  const { portfolio, error: portfolioError, isLoading: portfolioLoading } = usePortfolioView()
  const position = portfolio?.openPositions.find((item) => item.securityId === security || item.symbol.toLocaleUpperCase() === security?.toLocaleUpperCase()) ?? null
  const research = useSecurityResearch(position?.securityId ?? null)
  const [tab, setTab] = useState<Tab>("Overview")
  if (portfolioLoading) return <Loading label="Loading cached portfolio context…" />
  if (portfolioError) return <div className="notice notice-error" role="alert">{portfolioError}</div>
  if (!position || !portfolio) return <ResearchNotFound />
  return <section className="research-page">
    <ResearchHeader position={position} research={research.data} currency={portfolio.portfolio.currency} />
    <ResearchTabs value={tab} onChange={setTab} />
    {research.isLoading ? <Loading label="Loading cached research evidence…" /> : research.error ? <div className="notice notice-error" role="alert"><strong>Cached research could not be loaded.</strong><span>{research.error}</span></div> : research.data ? <TabPanel tab={tab} position={position} research={research.data} onTabChange={setTab} /> : null}
  </section>
}

export function ResearchIndexPage() {
  const { portfolio, error, isLoading } = usePortfolioView()
  const [query, setQuery] = useState("")
  const positions = useMemo(() => (portfolio?.openPositions ?? []).filter((position) => `${position.symbol} ${position.company}`.toLocaleUpperCase().includes(query.trim().toLocaleUpperCase())), [portfolio, query])
  if (isLoading) return <Loading label="Loading research coverage…" />
  if (error || !portfolio) return <div className="notice notice-error" role="alert">{error ?? "Research coverage could not be loaded."}</div>
  return <section className="research-page"><div className="portfolio-hero compact-hero"><div><p className="eyebrow">Cached evidence library</p><h1>Research</h1><p>Open a current holding to inspect its trusted cached research evidence. Browsing this workspace never refreshes a provider.</p></div></div><section className="panel"><label className="research-search"><span>Find a security</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ticker or company" /></label><div className="research-directory">{positions.map((position) => <Link key={position.securityId} to={`/app/research/${position.securityId}`}><span><strong>{position.symbol}</strong>{position.company}</span><small>{position.exchange} · {position.assetClass} · {position.sector ?? "Sector unavailable"}</small></Link>)}</div>{!positions.length ? <Empty title="No matching securities" detail="Adjust the search to find a current holding." /> : null}</section></section>
}

function ResearchHeader({ position, research, currency }: { readonly position: PortfolioPosition; readonly research: SecurityResearch | null; readonly currency: string }) {
  const marketCap = latestByCode(research?.metrics ?? []).get("MARKET_CAP_PROVIDER_RAW")
  const brokers = position.brokerExposure ?? []
  return <header className="research-header"><div className="research-title"><Link to="/app/research" className="research-back">← Research</Link><h1>{research?.companyName ?? position.company}</h1><p className="security-identity-line"><strong>{position.symbol}</strong> · {position.exchange} · {titleCase(position.instrumentType)}</p><p>{research?.sector ?? position.sector ?? "Sector unavailable"} · {research?.industry ?? position.industry ?? "Industry unavailable"}</p><p>{research?.marketCapCategory ? titleCase(research.marketCapCategory) : "Market-cap category unavailable"} · {position.role === "UNCLASSIFIED" ? "Unclassified" : titleCase(position.role)}</p><p className="raw-market-cap">Raw market cap: {formatResearchMetric(marketCap)}</p><div className="identity-chips" aria-label="Themes">{position.themes.length ? position.themes.map((theme) => <span key={theme.id}>{theme.name}</span>) : <span>No themes</span>}</div></div><section className="position-dashboard" aria-labelledby="position-dashboard-title"><h2 id="position-dashboard-title">Your position</h2><div className="research-head-metrics"><MetricCard label="Current price / CMP" value={formatMoney(position.currentPrice, currency)} detail={position.currentPrice === null ? "Unavailable" : `${position.isPriceStale ? "Stale price" : "Current cache"} · ${position.priceProvider ?? "Angel One"}`} /><MetricCard label="Total quantity" value={formatQuantity(position.quantity)} /><MetricCard label="Average cost" value={formatMoney(position.averageCost, currency)} detail={titleCase(position.accountingBasis)} /><MetricCard label="Portfolio weight" value={formatPercent(position.portfolioWeightPercent)} /><MetricCard label="Invested amount" value={formatMoney(position.investedAmount, currency)} detail="Cost basis" /><MetricCard label="Current value" value={formatMoney(position.currentValue, currency)} detail="At cached CMP" /><PnlCard position={position} currency={currency} /><MetricCard label="Target price" value="Unavailable" detail="Not configured" /><MetricCard label="Stop loss" value="Unavailable" detail="Not configured" /><article className="research-metric-card broker-card"><span>Brokers / demat</span><div className="broker-chips">{brokers.length ? brokers.map((broker) => <span key={broker.broker} title={`${formatQuantity(broker.quantity)} shares`}>{broker.broker}</span>) : <strong>Unavailable</strong>}</div><small>{brokers.length ? `${brokers.length} account${brokers.length === 1 ? "" : "s"}` : "Attribution incomplete"}</small></article></div></section></header>
}

function ResearchTabs({ value, onChange }: { readonly value: Tab; readonly onChange: (tab: Tab) => void }) {
  const activate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length
    onChange(TABS[next]!); document.getElementById(`research-tab-${next}`)?.focus()
  }
  return <div className="research-tabs" role="tablist" aria-label="Research sections">{TABS.map((tab, index) => <button id={`research-tab-${index}`} key={tab} type="button" role="tab" aria-selected={value === tab} aria-controls="research-panel" tabIndex={value === tab ? 0 : -1} onClick={() => onChange(tab)} onKeyDown={(event) => activate(event, index)}>{tab}</button>)}</div>
}

function TabPanel({ tab, position, research, onTabChange }: { readonly tab: Tab; readonly position: PortfolioPosition; readonly research: SecurityResearch; readonly onTabChange: (tab: Tab) => void }) {
  return <div id="research-panel" role="tabpanel" tabIndex={0} aria-labelledby={`research-tab-${TABS.indexOf(tab)}`} className="research-panel">
    {tab === "Overview" ? <Overview position={position} research={research} onViewEvidence={() => onTabChange("Evidence")} /> : null}
    {tab === "Financials" ? <Financials research={research} /> : null}
    {tab === "Quality & Growth" ? <QualityGrowth research={research} /> : null}
    {tab === "Ownership" ? <Ownership research={research} /> : null}
    {tab === "Valuation" ? <Valuation research={research} /> : null}
    {tab === "Documents" ? <Documents research={research} /> : null}
    {tab === "Evidence" ? <Evidence research={research} /> : null}
  </div>
}

function Overview({ position, research, onViewEvidence }: { readonly position: PortfolioPosition; readonly research: SecurityResearch; readonly onViewEvidence: () => void }) {
  const metrics = latestByCode(research.metrics)
  const groups = [
    { title: "Quality at a glance", codes: [...QUALITY_CODES] },
    { title: "Growth at a glance", codes: [...GROWTH_CODES] },
    { title: "Valuation snapshot", codes: [...VALUATION_CODES] },
    { title: "Ownership snapshot", codes: [...OWNERSHIP_CODES] },
  ]
  const conflicts = research.metrics.filter((metric) => metric.status === "CONFLICTING").length
  const provisional = research.metrics.filter((metric) => metric.status === "PROVISIONAL").length
  const reviewRequired = research.documents.filter((document) => document.status === "REVIEW_REQUIRED").length
  const stale = research.metrics.filter((metric) => metric.status === "STALE").length
  const coverage = research.metrics.length ? "Partial" : "Unavailable"
  return <><SectionHeading title="Research at a glance" detail="A summary of stored evidence; the detailed tabs remain the source of truth." /><section className="context-strip" aria-label="Business and portfolio context"><div><span>Business</span><strong>{research.sector ?? position.sector ?? "Unavailable"}</strong><small>{research.industry ?? position.industry ?? "Industry unavailable"}</small></div><div><span>Portfolio</span><strong>{position.role === "UNCLASSIFIED" ? "Unclassified" : titleCase(position.role)}</strong><small>{formatPercent(position.portfolioWeightPercent)} weight · {position.brokerExposure?.length ?? 0} broker account(s)</small></div><div><span>Classification</span><strong>{research.marketCapCategory ? titleCase(research.marketCapCategory) : "Unavailable"}</strong><small>{position.themes.length ? position.themes.map((theme) => theme.name).join(", ") : "No themes"}</small></div></section><div className="research-cockpit">{groups.map((group) => <section className="cockpit-panel" key={group.title}><h2>{group.title}</h2><div className="snapshot-list">{group.codes.map((code) => { const metric = metrics.get(code); return <div key={code}><span>{metric?.label ?? metricLabelForCode(code)}</span><strong>{formatResearchMetric(metric)}</strong><small>{metric ? period(metric) : "Unavailable"}</small><Status value={coverageStatus(metric)} /></div> })}</div></section>)}</div><section className="research-health"><div><p className="eyebrow">Research health</p><h2>{coverage} coverage</h2><p>{research.metrics.length} cached observations · {stale ? "mixed freshness" : research.metrics.length ? "current cache" : "freshness unavailable"}</p></div><dl><div><dt>Conflicts</dt><dd>{conflicts}</dd></div><div><dt>Review required</dt><dd>{reviewRequired}</dd></div><div><dt>Provisional</dt><dd>{provisional}</dd></div></dl><button type="button" className="button button-secondary" onClick={onViewEvidence}>View Evidence</button></section><p className="assessment-note">Investment scoring and recommendations are not yet enabled.</p></>
}

function Financials({ research }: { readonly research: SecurityResearch }) {
  const rows = research.metrics.filter((metric) => !OWNERSHIP_CODES.has(metric.code) && !VALUATION_CODES.has(metric.code))
  return <><SectionHeading title="Financial evidence" detail="Only stored period-qualified observations are shown; no synthetic history is calculated." /><MetricTable rows={rows} empty="No supported financial observations are cached for this security." /></>
}

function QualityGrowth({ research }: { readonly research: SecurityResearch }) {
  const latest = latestByCode(research.metrics)
  const inputs = [{ title: "Growth inputs", codes: [...GROWTH_CODES] }, { title: "Quality inputs", codes: [...QUALITY_CODES] }]
  return <><section className="research-callout research-callout-neutral"><strong>Scoring not yet enabled</strong><p>Available evidence coverage is shown below. PortfolioAI does not calculate CAGR, quality, QGMV, or Core scores at this stage.</p></section><div className="coverage-columns">{inputs.map((group) => <section className="panel" key={group.title}><h2>{group.title}</h2><div className="coverage-list">{group.codes.map((code) => { const metric = latest.get(code); return <div key={code}><span>{metric?.label ?? code.replaceAll("_", " ")}</span><Status value={coverageStatus(metric)} />{metric ? <small>{formatResearchMetric(metric)} · {period(metric)}</small> : <small>No cached observation</small>}</div> })}</div></section>)}</div></>
}

function Ownership({ research }: { readonly research: SecurityResearch }) {
  const rows = research.metrics.filter((metric) => OWNERSHIP_CODES.has(metric.code))
  const periods = new Set(rows.map((row) => row.periodEnd).filter(Boolean)).size
  return <><SectionHeading title="Aggregate ownership" detail={periods > 1 ? `${periods} reporting periods are retained.` : "One reporting period is available; no trend is inferred."} /><MetricTable rows={rows} empty="No aggregate ownership observations are cached for this security." /></>
}

function Valuation({ research }: { readonly research: SecurityResearch }) {
  const rows = research.metrics.filter((metric) => VALUATION_CODES.has(metric.code))
  return <><SectionHeading title="Valuation evidence" detail="No cheap/fair/expensive classification or valuation score is calculated." /><MetricTable rows={rows} empty="No semantically approved valuation observations are cached for this security." /></>
}

function Documents({ research }: { readonly research: SecurityResearch }) {
  return <><SectionHeading title="Research documents" detail="Metadata and source appearances only; document bodies are not stored here." />{research.documents.length ? <div className="document-list">{research.documents.map((document) => <article key={document.id}><div><p className="eyebrow">{document.type.replaceAll("_", " ")}</p><h2>{document.title ?? "Title unavailable"}</h2><p>{document.periodEnd ? `Period ending ${date(document.periodEnd)}` : "Reporting period unavailable"} · {document.publishedAt ? `Published ${date(document.publishedAt)}` : "Publication date unavailable"}</p></div><div><Status value={document.status} /><small>{document.provider} · retrieved {dateTime(document.retrievedAt)}</small>{document.externalReference ? <span className="document-reference">Archived reference retained</span> : <span className="unavailable">No lawful retained open reference</span>}</div></article>)}</div> : <Empty title="No cached document appearances" detail="No document metadata has been retained for this security." />}</>
}

function Evidence({ research }: { readonly research: SecurityResearch }) {
  const [filter, setFilter] = useState("ALL")
  const rows = filter === "ALL" ? research.metrics : research.metrics.filter((metric) => metric.status === filter)
  return <><SectionHeading title="Evidence ledger" detail="Selected and competing observations remain visible with their original semantics." /><label className="evidence-filter"><span>Status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">All evidence</option>{["VERIFIED", "PROVISIONAL", "CONFLICTING", "AMBIGUOUS", "REVIEW_REQUIRED", "STALE"].map((value) => <option key={value}>{value}</option>)}</select></label><MetricTable rows={rows} detailed empty="No evidence matches this filter." /></>
}

function MetricTable({ rows, empty, detailed = false }: { readonly rows: readonly ResearchMetric[]; readonly empty: string; readonly detailed?: boolean }) {
  if (!rows.length) return <Empty title="Unavailable" detail={empty} />
  return <div className="research-table-wrap" tabIndex={0} aria-label="Scrollable research evidence"><table className="research-table"><thead><tr><th>Metric</th><th>Value</th><th>Period</th><th>Status</th>{detailed ? <><th>Provider / field</th><th>Scope / unit</th><th>Retrieved / freshness</th><th>Selection</th></> : <th>Source</th>}</tr></thead><tbody>{rows.map((metric) => <tr key={metric.id}><td><strong>{metric.label}</strong><small>{metric.code}</small></td><td>{formatResearchMetric(metric)}</td><td>{period(metric)}</td><td><Status value={metric.status} /></td>{detailed ? <><td>{metric.provider}<small>{metric.sourceField ?? "Source field unavailable"}</small></td><td>{metric.scope ?? "Scope unavailable"}<small>{[metric.unit, metric.currency].filter(Boolean).join(" · ") || "Unit unavailable"}</small></td><td>{dateTime(metric.retrievedAt)}<small>Fresh through {dateTime(metric.freshUntil)}</small></td><td>{metric.selected ? "Selected" : "Competing / unselected"}</td></> : <td>{metric.provider}<small>{dateTime(metric.retrievedAt)}</small></td>}</tr>)}</tbody></table></div>
}

function Status({ value }: { readonly value: ResearchEvidenceStatus }) { return <span className={`evidence-badge evidence-${value.toLocaleLowerCase()}`}>{value.replaceAll("_", " ")}</span> }
function PnlCard({ position, currency }: { readonly position: PortfolioPosition; readonly currency: string }) {
  const sign = position.unrealisedPnl === null ? "" : new Decimal(position.unrealisedPnl).gte(0) ? "+" : ""
  const percentSign = position.unrealisedPnlPercent === null ? "" : new Decimal(position.unrealisedPnlPercent).gte(0) ? "+" : ""
  const direction = position.unrealisedPnl === null ? "Unavailable" : new Decimal(position.unrealisedPnl).gte(0) ? "Gain" : "Loss"
  return <article className={`research-metric-card pnl-card pnl-${direction.toLocaleLowerCase()}`}><span>P/L</span><strong>{position.unrealisedPnl === null ? "Unavailable" : `${sign}${formatMoney(position.unrealisedPnl, currency)}`}</strong><small>{position.unrealisedPnlPercent === null ? "Unavailable" : `${percentSign}${formatPercent(position.unrealisedPnlPercent)} · ${direction}`}</small></article>
}
function MetricCard({ label, value, detail }: { readonly label: string; readonly value: string; readonly detail?: string }) { return <article className="research-metric-card"><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</article> }
function SectionHeading({ title, detail }: { readonly title: string; readonly detail: string }) { return <div className="research-section-heading"><h2>{title}</h2><p>{detail}</p></div> }
function Empty({ title, detail }: { readonly title: string; readonly detail: string }) { return <div className="data-empty"><strong>{title}</strong><p>{detail}</p></div> }
function Loading({ label }: { readonly label: string }) { return <div className="portfolio-loading" aria-live="polite"><span className="loader" /><p>{label}</p></div> }
function ResearchNotFound() { return <section className="research-page"><div className="notice notice-error" role="alert"><strong>Security unavailable</strong><span>This security is not available in the current open portfolio.</span></div><Link className="button button-secondary" to="/app/research">Return to Research</Link></section> }
function date(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.valueOf()) ? "Unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(parsed) }
function dateTime(value: string) { if (!value) return "Unavailable"; const parsed = new Date(value); return Number.isNaN(parsed.valueOf()) ? "Unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(parsed) }
function period(metric: ResearchMetric) { return [metric.periodType?.replaceAll("_", " "), metric.periodEnd ? date(metric.periodEnd) : null].filter(Boolean).join(" · ") || "Period unavailable" }
function titleCase(value: string) { return value.replaceAll("_", " ").toLocaleLowerCase().replace(/(^|\s)\S/gu, (match) => match.toLocaleUpperCase()) }
function metricLabelForCode(code: string) { return metricLabel(code) }
