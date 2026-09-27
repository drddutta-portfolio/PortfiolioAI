import { useState } from "react"
import { Link } from "react-router-dom"
import "../features/research/researchCoverage.css"
import { useProviderOperationalSummary } from "../features/research/useResearchCoverage"
import { useProviderQuotaSummary } from "../features/research/useProviderQuotaSummary"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { executeManualResearchRefreshWave, planManualResearchRefresh, type ManualRefreshExecution, type ManualRefreshPlan } from "../data/manualResearchRefreshRepository"
import { displayError } from "../lib/displayError"

export function DataSourcesPage() {
  const summary = useProviderOperationalSummary()
  const quota = useProviderQuotaSummary()
  const portfolioView = usePortfolioView()
  const [manualPlan, setManualPlan] = useState<ManualRefreshPlan | null>(null)
  const [manualError, setManualError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [lastExecution, setLastExecution] = useState<ManualRefreshExecution | null>(null)

  const portfolioId = portfolioView.portfolio?.portfolio.id ?? null
  const loadManualPlan = async () => {
    if (!portfolioId) return
    setBusy("plan")
    setManualError(null)
    try { setManualPlan(await planManualResearchRefresh(portfolioId)) }
    catch (error) { setManualError(displayError(error)) }
    finally { setBusy(null) }
  }
  const executeWave = async (waveNumber: number, symbols: readonly string[], calls: number) => {
    if (!portfolioId) return
    const approved = window.confirm(`Execute Trendlyne manual refresh wave ${waveNumber}?\n\nStocks: ${symbols.join(", ")}\nMaximum planned provider calls: ${calls}\n\nThis is an owner-confirmed live provider action.`)
    if (!approved) return
    setBusy(`wave-${waveNumber}`)
    setManualError(null)
    try {
      const result = await executeManualResearchRefreshWave(portfolioId, waveNumber)
      setLastExecution(result)
      setManualPlan(await planManualResearchRefresh(portfolioId))
    } catch (error) { setManualError(displayError(error)) }
    finally { setBusy(null) }
  }

  if (summary.isLoading || portfolioView.isLoading) return <div className="page-loader" role="status">Loading provider operations…</div>
  if (summary.error || !summary.data) return <div className="notice notice-error" role="alert"><strong>Provider operations could not be loaded.</strong><span>{summary.error ?? "Operational summary unavailable."}</span></div>
  const data = summary.data
  return <section className="research-page">
    <div className="portfolio-hero compact-hero"><div><p className="eyebrow">Settings · Data Sources / Refresh</p><h1>Provider Operations</h1><p>Safety, quota, refresh planning and owner-confirmed provider execution. Browsing this page never triggers a provider call.</p></div><Link className="button button-secondary" to="/app/research">Research Coverage</Link></div>

    <section className="panel"><div className="section-heading"><div><h2>{data.providerName}</h2><p>{data.sourceCode} · policy version {data.policyVersion}</p></div><span className={`status status-${data.utilizationState.toLocaleLowerCase().replaceAll("_", "-")}`}>{titleCase(data.utilizationState)}</span></div><div className="summary-grid"><Metric label="Ingestion" value={data.ingestionEnabled ? "Enabled" : "Disabled"} /><Metric label="Scheduler" value={data.schedulerEnabled ? "Enabled" : "Disabled"} /><Metric label="Active reservations" value={String(data.activeReservations)} /><Metric label="Active orchestrations" value={String(data.activeOrchestrations)} /><Metric label="Provider quota status" value={titleCase(data.actualProviderQuotaStatus)} /><Metric label="Policy version" value={String(data.policyVersion)} /></div></section>

    <section className="coverage-columns"><article className="panel"><h2>Daily internal safety budget</h2><Usage used={data.dailyObservedUsage} limit={data.dailyInternalAttemptLimit} remaining={data.dailyRemaining} /><p className="assessment-note">PortfolioAI is currently capped at 50 Trendlyne provider-tool attempts per UTC day. This is intentionally much lower than the provider entitlement.</p></article><article className="panel"><h2>Rolling internal safety budget</h2><Usage used={data.rollingObservedUsage} limit={data.rollingInternalAttemptLimit} remaining={data.rollingRemaining} /><p className="assessment-note">The rolling window remains a conservative PortfolioAI safety control and is independent of Trendlyne billing.</p></article></section>

    {quota.isLoading ? <section className="panel"><p role="status">Loading Trendlyne quota…</p></section> : quota.error || !quota.data ? <section className="notice notice-error" role="alert"><strong>Trendlyne quota visualizer unavailable.</strong><span>{quota.error ?? "Quota summary unavailable."}</span></section> : <section className="panel"><div className="section-heading"><div><h2>Trendlyne Pro quota</h2><p>{quota.data.planName} · {titleCase(quota.data.quotaStatus)}</p></div><span className="status status-normal">Owner confirmed</span></div><div className="coverage-columns"><article><h3>Daily provider quota</h3><Usage used={quota.data.providerDailyEstimatedUsed} limit={quota.data.providerDailyLimit} remaining={quota.data.providerDailyEstimatedRemaining} noun="estimated provider calls" /></article><article><h3>Monthly provider quota</h3><Usage used={quota.data.providerMonthlyEstimatedUsed} limit={quota.data.providerMonthlyLimit} remaining={quota.data.providerMonthlyEstimatedRemaining} noun="estimated provider calls" /></article></div><p className="assessment-note">{quota.data.usageBasis}</p></section>}

    <section className="panel"><div className="section-heading"><div><p className="eyebrow">Manual refresh</p><h2>Owner-confirmed research refresh</h2><p>Plan first with zero provider calls. A live Trendlyne request occurs only after you explicitly confirm an individual wave.</p></div><button className="button button-secondary" type="button" disabled={!portfolioId || busy !== null} onClick={() => void loadManualPlan()}>{busy === "plan" ? "Planning…" : "Plan Cohort A refresh"}</button></div>
      {manualError ? <div className="notice notice-error" role="alert"><strong>Manual refresh action stopped safely.</strong><span>{manualError}</span></div> : null}
      {manualPlan ? <>
        <div className="summary-grid"><Metric label="Stocks needing refresh" value={String(manualPlan.staleCount)} /><Metric label="Planned provider calls" value={String(manualPlan.plannedCalls)} /><Metric label="Usage before refresh" value={`${manualPlan.dailyObservedUsage}/${manualPlan.dailyLimit}`} /><Metric label="Projected usage" value={`${manualPlan.projectedDailyUsage}/${manualPlan.dailyLimit}`} /><Metric label="Provider quota" value={titleCase(manualPlan.providerQuotaStatus)} /><Metric label="Execution gate" value={manualPlan.executionAllowed ? "Ready" : "Blocked"} /></div>
        {manualPlan.waves.length ? <div className="coverage-columns">{manualPlan.waves.map((wave) => <article key={wave.waveNumber} className="panel"><h3>Wave {wave.waveNumber}</h3><p>{wave.symbols.join(", ")}</p><p><strong>{wave.calls}</strong> provider call{wave.calls === 1 ? "" : "s"} planned.</p><button className="button button-primary" type="button" disabled={!manualPlan.executionAllowed || busy !== null} onClick={() => void executeWave(wave.waveNumber, wave.symbols, wave.calls)}>{busy === `wave-${wave.waveNumber}` ? "Refreshing…" : `Review & execute wave ${wave.waveNumber}`}</button></article>)}</div> : <div className="research-callout research-callout-neutral"><strong>Cohort A is fresh</strong><p>No Trendlyne fundamentals refresh is currently required.</p></div>}
      </> : <p className="assessment-note">Planning is read-only and consumes zero Trendlyne calls.</p>}
      {lastExecution ? <div className="research-callout research-callout-neutral"><strong>Last manual wave completed</strong><p>Wave {lastExecution.waveNumber}: {lastExecution.succeeded} accepted, {lastExecution.failed} failed, {lastExecution.providerCalls} provider calls. Run {lastExecution.runId}.</p></div> : null}
    </section>

    <section className="panel"><h2>Run health</h2><div className="summary-grid"><Metric label="Last successful run" value={formatDate(data.lastSuccessfulRunAt)} /><Metric label="Last failed run" value={formatDate(data.lastFailedRunAt)} /><Metric label="Latest safe error" value={data.latestSafeError ?? "None recorded"} /></div></section>

    <section className="research-callout research-callout-neutral"><strong>Monthly fundamentals strategy</strong><p>Trendlyne fundamentals are intended to refresh roughly once per month per held stock, with calls staggered over the month. Live refresh remains budget-gated and every execution requires explicit owner confirmation.</p></section>
  </section>
}

function Usage({ used, limit, remaining, noun = "internal attempts" }: { readonly used: number; readonly limit: number; readonly remaining: number; readonly noun?: string }) {
  const percent = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0
  return <div><p><strong>{used}</strong> of <strong>{limit}</strong> {noun}</p><progress max={100} value={percent} aria-label={`${percent.toFixed(0)} percent of budget used`} /><p><strong>{remaining}</strong> remaining</p></div>
}
function Metric({ label, value }: { readonly label: string; readonly value: string }) { return <article className="summary-card"><span>{label}</span><strong>{value}</strong></article> }
function formatDate(value: string | null) { if (!value) return "Unavailable"; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "Unavailable" : parsed.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) }
function titleCase(value: string) { return value.toLocaleLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toLocaleUpperCase()) }
