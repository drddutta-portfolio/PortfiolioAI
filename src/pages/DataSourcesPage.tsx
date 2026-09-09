import { Link } from "react-router-dom"
import { useProviderOperationalSummary } from "../features/research/useResearchCoverage"

export function DataSourcesPage() {
  const summary = useProviderOperationalSummary()
  if (summary.isLoading) return <div className="page-loader" role="status">Loading provider operations…</div>
  if (summary.error || !summary.data) return <div className="notice notice-error" role="alert"><strong>Provider operations could not be loaded.</strong><span>{summary.error ?? "Operational summary unavailable."}</span></div>
  const data = summary.data
  return <section className="research-page">
    <div className="portfolio-hero compact-hero"><div><p className="eyebrow">Settings · Data Sources / Refresh</p><h1>Provider Operations</h1><p>Read-only safety and usage visibility for the approved research provider. This page does not invoke provider refreshes or modify controls.</p></div><Link className="button button-secondary" to="/app/research">Research Coverage</Link></div>

    <section className="panel"><div className="section-heading"><div><h2>{data.providerName}</h2><p>{data.sourceCode} · policy version {data.policyVersion}</p></div><span className={`status status-${data.utilizationState.toLocaleLowerCase().replaceAll("_", "-")}`}>{titleCase(data.utilizationState)}</span></div><div className="summary-grid"><Metric label="Ingestion" value={data.ingestionEnabled ? "Enabled" : "Disabled"} /><Metric label="Scheduler" value={data.schedulerEnabled ? "Enabled" : "Disabled"} /><Metric label="Active reservations" value={String(data.activeReservations)} /><Metric label="Active orchestrations" value={String(data.activeOrchestrations)} /><Metric label="Provider quota status" value={titleCase(data.actualProviderQuotaStatus)} /><Metric label="Policy version" value={String(data.policyVersion)} /></div></section>

    <section className="coverage-columns"><article className="panel"><h2>Daily internal safety budget</h2><Usage used={data.dailyObservedUsage} limit={data.dailyInternalAttemptLimit} remaining={data.dailyRemaining} /><p className="assessment-note">Internal attempt accounting protects PortfolioAI from accidental overuse. It is not a statement of the provider's contractual quota.</p></article><article className="panel"><h2>Rolling internal safety budget</h2><Usage used={data.rollingObservedUsage} limit={data.rollingInternalAttemptLimit} remaining={data.rollingRemaining} /><p className="assessment-note">The rolling window and limits are PortfolioAI safety controls. Actual provider quota remains {titleCase(data.actualProviderQuotaStatus)} until independently verified.</p></article></section>

    <section className="panel"><h2>Run health</h2><div className="summary-grid"><Metric label="Last successful run" value={formatDate(data.lastSuccessfulRunAt)} /><Metric label="Last failed run" value={formatDate(data.lastFailedRunAt)} /><Metric label="Latest safe error" value={data.latestSafeError ?? "None recorded"} /></div></section>

    <section className="research-callout research-callout-neutral"><strong>Manual refresh remains gated</strong><p>Stage 7.2B deliberately restricts live Trendlyne refresh to the exact owner-approved Cohort A. Stage 7.2D.1 therefore exposes coverage and safe operations visibility without weakening that production boundary. Any broader owner-confirmed refresh workflow will be implemented as a separately reviewed step.</p></section>
  </section>
}

function Usage({ used, limit, remaining }: { readonly used: number; readonly limit: number; readonly remaining: number }) {
  const percent = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0
  return <div><p><strong>{used}</strong> observed attempts of <strong>{limit}</strong> internal limit</p><progress max={100} value={percent} aria-label={`${percent.toFixed(0)} percent of internal safety budget used`} /><p>{remaining} internal attempts remaining</p></div>
}
function Metric({ label, value }: { readonly label: string; readonly value: string }) { return <article className="summary-card"><span>{label}</span><strong>{value}</strong></article> }
function formatDate(value: string | null) { if (!value) return "Unavailable"; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "Unavailable" : parsed.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) }
function titleCase(value: string) { return value.toLocaleLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toLocaleUpperCase()) }
