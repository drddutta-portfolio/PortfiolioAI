import { useState } from "react"
import { executeCompleteResearchRefresh, planCompleteResearchRefresh, type CompleteResearchRefreshPlan, type CompleteResearchRefreshResult } from "../../data/completeResearchRefreshRepository"
import { displayError } from "../../lib/displayError"
import "./CompleteResearchRefreshPanel.css"

export function CompleteResearchRefreshPanel({ portfolioId, securityId, symbol, onCompleted }: {
  readonly portfolioId: string
  readonly securityId: string
  readonly symbol: string
  readonly onCompleted: () => void
}) {
  const [plan, setPlan] = useState<CompleteResearchRefreshPlan | null>(null)
  const [result, setResult] = useState<CompleteResearchRefreshResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<"PLAN" | "EXECUTE" | null>(null)

  const createPlan = async () => {
    setBusy("PLAN"); setError(null); setResult(null)
    try { setPlan(await planCompleteResearchRefresh(portfolioId, securityId)) }
    catch (reason: unknown) { setError(displayError(reason)) }
    finally { setBusy(null) }
  }

  const execute = async () => {
    if (!plan?.executionAllowed) return
    const accepted = window.confirm(`Complete Research Refresh for ${symbol} will use up to ${plan.estimatedProviderCalls} Trendlyne calls. Continue?`)
    if (!accepted) return
    setBusy("EXECUTE"); setError(null); setResult(null)
    try {
      const next = await executeCompleteResearchRefresh(portfolioId, securityId)
      setResult(next)
      if (next.status === "SUCCEEDED") onCompleted()
      setPlan(await planCompleteResearchRefresh(portfolioId, securityId))
    } catch (reason: unknown) { setError(displayError(reason)) }
    finally { setBusy(null) }
  }

  return <section className="panel complete-research-refresh" aria-labelledby="complete-research-refresh-title">
    <div className="section-heading">
      <div>
        <p className="eyebrow">Owner-controlled deep refresh</p>
        <h2 id="complete-research-refresh-title">Complete Research Refresh</h2>
        <p>Refreshes this stock's core fundamentals, detailed scoring metrics, ownership and document/evidence discovery. Planning itself uses zero Trendlyne calls.</p>
      </div>
      <button type="button" className="button button-secondary" disabled={busy !== null} onClick={createPlan}>{busy === "PLAN" ? "Planning…" : plan ? "Re-plan" : "Plan complete refresh"}</button>
    </div>

    {error ? <div className="notice notice-error" role="alert">{error}</div> : null}

    {plan ? <div className="complete-refresh-plan">
      <div className="summary-grid">
        <Metric label="Estimated Trendlyne calls" value={String(plan.estimatedProviderCalls)} />
        <Metric label="Today's internal usage" value={`${plan.dailyObservedUsage}/${plan.dailyLimit}`} />
        <Metric label="Projected after refresh" value={`${plan.projectedDailyUsage}/${plan.dailyLimit}`} />
        <Metric label="Quota gate" value={plan.executionAllowed ? "Ready" : "Blocked"} />
      </div>
      <div className="complete-refresh-components" aria-label="Complete refresh components">
        {plan.components.map(component => <span key={component.domain}><strong>{component.domain}</strong><small>{component.calls} call</small></span>)}
      </div>
      <p className="assessment-note">Current price is not refreshed here; Angel One remains the market-price authority. Only semantically approved fields are promoted into canonical research data.</p>
      <button type="button" className="button button-primary" disabled={!plan.executionAllowed || busy !== null} onClick={execute}>{busy === "EXECUTE" ? "Refreshing research…" : `Run Complete Research Refresh · ${plan.estimatedProviderCalls} calls`}</button>
    </div> : null}

    {result ? <div className={result.status === "SUCCEEDED" ? "notice notice-success" : "notice notice-error"} role="status">
      <strong>{result.status === "SUCCEEDED" ? "Complete Research Refresh finished." : "Refresh finished with incomplete domains."}</strong>
      <span>{result.providerSucceeded} of {result.providerCalls} provider calls succeeded. Research data has been reloaded where accepted.</span>
    </div> : null}
  </section>
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return <article className="summary-card"><span>{label}</span><strong>{value}</strong></article>
}
