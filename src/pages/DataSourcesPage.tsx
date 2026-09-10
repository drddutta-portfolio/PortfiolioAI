import { Link } from "react-router-dom"
import "../features/research/researchCoverage.css"
import { useProviderOperationalSummary } from "../features/research/useResearchCoverage"
import { useProviderQuotaSummary } from "../features/research/useProviderQuotaSummary"

export function DataSourcesPage() {
  const summary = useProviderOperationalSummary()
  const quota = useProviderQuotaSummary()
  if (summary.isLoading) return <div className="page-loader" role="status">Loading provider operations…</div>
  if (summary.error || !summary.data) return <div className="notice notice-error" role="alert"><strong>Provider operations could not be loaded.</strong><span>{summary.error ?? "Operational summary unavailable."}</span></div>
  const data = summary.data
  return <section className="research-page">
    <div className="portfolio-hero compact-hero"><div><p className="eyebrow">Settings · Data Sources / Refresh</p><h1>Provider Operations</h1><p>Read-only safety and usage visibility for the approved research provider. This page does not invoke provider refreshes or modify controls.</p></div><Link className="button button-secondary" to="/app/research">Research Coverage</Link></div>

    <section className="panel"><div className="section-heading"><div><h2>{data.providerName}</h2><p>{data.sourceCode} · policy version {data.policyVersion}</p></div><span className={`status status-${data.utilizationState.toLocaleLowerCase().replaceAll("_", "-")}`}>{titleCase(data.utilizationState)}</span></div><div className="summary-grid"><Metric label="Ingestion" value={data.ingestionEnabled ? "Enabled" : "Disabled"} /><Metric label="Scheduler" value={data.schedulerEnabled ? "Enabled" : "Disabled"} /><Metric label="Active reservations" value={String(data.activeReservations)} /><Metric label="Active orchestrations" value={String(data.activeOrchestrations)} /><Metric label="Provider quota status" value={titleCase(data.actualProviderQuotaStatus)} /><Metric label="Policy version" value={String(data.policyVersion)} /></div></section>

    <section className="coverage-columns"><article className="panel"><h2>Daily internal safety budget</h2><Usage used={data.dailyObservedUsage} limit={data.dailyInternalAttemptLimit} remaining={data.dailyRemaining} /><p className="assessment-note">PortfolioAI is currently capped at 50 Trendlyne provider-tool attempts per UTC day. This is intentionally much lower than the provider entitlement.</p></article><article className="panel"><h2>Rolling internal safety budget</h2><Usage used={data.rollingObservedUsage} limit={data.rollingInternalAttemptLimit} remaining={data.rollingRemaining} /><p className="assessment-note">The rolling window remains a conservative PortfolioAI safety control and is independent of Trendlyne billing.</p></article></section>

    {quota.isLoading ? <section className="panel"><p role="status">Loading Trendlyne quota…</p></section> : quota.error || !quota.data ? <section className="notice notice-error" role="alert"><strong>Trendlyne quota visualizer unavailable.</strong><span>{quota.error ?? "Quota summary unavailable."}</span></section> : <section className="panel"><div className="section-heading"><div><h2>Trendlyne Pro quota</h2><p>{quota.data.planName} · {titleCase(quota.data.quotaStatus)}</p></div><span className="status status-normal">Owner confirmed</span></div><div className="coverage-columns"><article><h3>Daily provider quota</h3><Usage used={quota.data.providerDailyEstimatedUsed} limit={quota.data.providerDailyLimit} remaining={quota.data.providerDailyEstimatedRemaining} noun="estimated provider calls" /></article><article><h3>Monthly provider quota</h3><Usage used={quota.data.providerMonthlyEstimatedUsed} limit={quota.data.providerMonthlyLimit} remaining={quota.data.providerMonthlyEstimatedRemaining} noun="estimated provider calls" /></article></div><p className="assessment-note">{quota.data.usageBasis}</p></section>}

    <section className="panel"><h2>Run health</h2><div className="summary-grid"><Metric label="Last successful run" value={formatDate(data.lastSuccessfulRunAt)} /><Metric label="Last failed run" value={formatDate(data.lastFailedRunAt)} /><Metric label="Latest safe error" value={data.latestSafeError ?? "None recorded"} /></div></section>

    <section className="research-callout research-callout-neutral"><strong>Monthly fundamentals strategy</strong><p>Trendlyne fundamentals are intended to refresh roughly once per month per held stock, with calls staggered over the month. Live refresh remains budget-gated and canonical research writes remain separately controlled.</p></section>
  </section>
}

function Usage({ used, limit, remaining, noun = "internal attempts" }: { readonly used: number; readonly limit: number; readonly remaining: number; readonly noun?: string }) {
  const percent = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0
  return <div><p><strong>{used}</strong> of <strong>{limit}</strong> {noun}</p><progress max={100} value={percent} aria-label={`${percent.toFixed(0)} percent of budget used`} /><p><strong>{remaining}</strong> remaining</p></div>
}
function Metric({ label, value }: { readonly label: string; readonly value: string }) { return <article className="summary-card"><span>{label}</span><strong>{value}</strong></article> }
function formatDate(value: string | null) { if (!value) return "Unavailable"; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "Unavailable" : parsed.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) }
function titleCase(value: string) { return value.toLocaleLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toLocaleUpperCase()) }
