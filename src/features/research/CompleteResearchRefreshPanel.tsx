import { useState } from "react"
import { discoverBankGrowthContract, type BankGrowthDiscoveryResult } from "../../data/bankGrowthDiscoveryRepository"
import { executeBankBenchmarkRefresh, planBankBenchmarkRefresh, type BankBenchmarkRefreshPlan, type BankBenchmarkRefreshResult } from "../../data/bankBenchmarkRefreshRepository"
import { executeCompleteResearchRefresh, planCompleteResearchRefresh, type CompleteResearchRefreshPlan, type CompleteResearchRefreshResult } from "../../data/completeResearchRefreshRepository"
import { executeMarketHistoryRefresh, planMarketHistoryRefresh, type MarketHistoryRefreshPlan, type MarketHistoryRefreshResult } from "../../data/marketHistoryRefreshRepository"
import { executeValuationEvidenceRefresh, planValuationEvidenceRefresh, type ValuationEvidenceRefreshPlan, type ValuationEvidenceRefreshResult } from "../../data/valuationEvidenceRefreshRepository"
import { displayError } from "../../lib/displayError"
import { researchProfileUiContract, researchRefreshModulesForSecurity } from "./researchProfileUiContract"
import "./CompleteResearchRefreshPanel.css"

export function CompleteResearchRefreshPanel({ portfolioId, securityId, symbol, profileCode, onCompleted }: {
  readonly portfolioId: string
  readonly securityId: string
  readonly symbol: string
  readonly profileCode: string | null | undefined
  readonly onCompleted: () => void
}) {
  const ui = researchProfileUiContract(profileCode)
  const refreshModules = researchRefreshModulesForSecurity(profileCode, symbol)
  const [plan, setPlan] = useState<CompleteResearchRefreshPlan | null>(null)
  const [result, setResult] = useState<CompleteResearchRefreshResult | null>(null)
  const [marketPlan, setMarketPlan] = useState<MarketHistoryRefreshPlan | null>(null)
  const [marketResult, setMarketResult] = useState<MarketHistoryRefreshResult | null>(null)
  const [benchmarkPlan, setBenchmarkPlan] = useState<BankBenchmarkRefreshPlan | null>(null)
  const [benchmarkResult, setBenchmarkResult] = useState<BankBenchmarkRefreshResult | null>(null)
  const [valuationPlan, setValuationPlan] = useState<ValuationEvidenceRefreshPlan | null>(null)
  const [valuationResult, setValuationResult] = useState<ValuationEvidenceRefreshResult | null>(null)
  const [growthResult, setGrowthResult] = useState<BankGrowthDiscoveryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<"PLAN" | "EXECUTE" | "MARKET_PLAN" | "MARKET_EXECUTE" | "BENCHMARK_PLAN" | "BENCHMARK_EXECUTE" | "VALUATION_PLAN" | "VALUATION_EXECUTE" | "GROWTH" | null>(null)

  const createPlan = async () => {
    setBusy("PLAN"); setError(null); setResult(null); setPlan(null)
    try { setPlan(await planCompleteResearchRefresh(portfolioId, securityId, ui.profileCode)) }
    catch (reason: unknown) { setError(displayError(reason)) }
    finally { setBusy(null) }
  }

  const execute = async () => {
    if (!plan?.executionAllowed) return
    const accepted = window.confirm(`Complete Research Refresh for ${symbol} will use up to ${plan.estimatedProviderCalls} Trendlyne calls. Continue?`)
    if (!accepted) return
    setBusy("EXECUTE"); setError(null); setResult(null)
    try {
      const next = await executeCompleteResearchRefresh(portfolioId, securityId, ui.profileCode)
      setResult(next)
      if (next.status !== "FAILED") onCompleted()
      setPlan(await planCompleteResearchRefresh(portfolioId, securityId, ui.profileCode))
    } catch (reason: unknown) { setError(displayError(reason)) }
    finally { setBusy(null) }
  }

  const createMarketPlan = async () => {
    setBusy("MARKET_PLAN"); setError(null); setMarketResult(null); setMarketPlan(null)
    try { setMarketPlan(await planMarketHistoryRefresh(portfolioId, securityId)) }
    catch (reason: unknown) { setError(displayError(reason)) }
    finally { setBusy(null) }
  }

  const executeMarket = async () => {
    if (!marketPlan) return
    const accepted = window.confirm(`Historical market refresh for ${symbol} will use ${marketPlan.estimatedProviderCalls} Angel One call and store about ${marketPlan.historyDays} calendar days of daily OHLCV. Continue?`)
    if (!accepted) return
    setBusy("MARKET_EXECUTE"); setError(null); setMarketResult(null)
    try {
      const next = await executeMarketHistoryRefresh(portfolioId, securityId)
      setMarketResult(next)
      onCompleted()
      setMarketPlan(await planMarketHistoryRefresh(portfolioId, securityId))
    } catch (reason: unknown) { setError(displayError(reason)) }
    finally { setBusy(null) }
  }

  const createBenchmarkPlan = async () => {
    setBusy("BENCHMARK_PLAN"); setError(null); setBenchmarkResult(null); setBenchmarkPlan(null)
    try { setBenchmarkPlan(await planBankBenchmarkRefresh(portfolioId, securityId)) }
    catch (reason: unknown) { setError(displayError(reason)) }
    finally { setBusy(null) }
  }

  const executeBenchmark = async () => {
    if (!benchmarkPlan) return
    const accepted = window.confirm(`NIFTY Bank benchmark refresh will use ${benchmarkPlan.estimatedProviderCalls} Angel One historical call and derive 12M relative strength for ${symbol}. Continue?`)
    if (!accepted) return
    setBusy("BENCHMARK_EXECUTE"); setError(null); setBenchmarkResult(null)
    try {
      const next = await executeBankBenchmarkRefresh(portfolioId, securityId)
      setBenchmarkResult(next)
      onCompleted()
      setBenchmarkPlan(await planBankBenchmarkRefresh(portfolioId, securityId))
    } catch (reason: unknown) { setError(displayError(reason)) }
    finally { setBusy(null) }
  }

  const createValuationPlan = async () => {
    setBusy("VALUATION_PLAN"); setError(null); setValuationResult(null); setValuationPlan(null)
    try { setValuationPlan(await planValuationEvidenceRefresh(portfolioId, securityId)) }
    catch (reason: unknown) { setError(displayError(reason)) }
    finally { setBusy(null) }
  }

  const executeValuation = async () => {
    if (!valuationPlan?.executionAllowed) return
    const accepted = window.confirm(`Valuation evidence refresh for ${symbol} will use exactly ${valuationPlan.estimatedProviderCalls} Trendlyne call. It refreshes only the approved 5-year P/E self-history valuation metric. Continue?`)
    if (!accepted) return
    setBusy("VALUATION_EXECUTE"); setError(null); setValuationResult(null)
    try {
      const next = await executeValuationEvidenceRefresh(portfolioId, securityId)
      setValuationResult(next)
      onCompleted()
      setValuationPlan(await planValuationEvidenceRefresh(portfolioId, securityId))
    } catch (reason: unknown) { setError(displayError(reason)) }
    finally { setBusy(null) }
  }

  const discoverGrowth = async () => {
    const accepted = window.confirm(`This targeted ${symbol} growth discovery will use exactly 1 Trendlyne call and will not promote any metric automatically. Continue?`)
    if (!accepted) return
    setBusy("GROWTH"); setError(null); setGrowthResult(null)
    try { setGrowthResult(await discoverBankGrowthContract(portfolioId, securityId)) }
    catch (reason: unknown) { setError(displayError(reason)) }
    finally { setBusy(null) }
  }

  return <section className="panel complete-research-refresh" aria-labelledby="complete-research-refresh-title" aria-busy={busy !== null}>
    {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
    {ui.completeResearchRefreshMode === "ENABLED" ? <><div className="section-heading">
      <div>
        <p className="eyebrow">Owner-controlled research refresh</p>
        <h2 id="complete-research-refresh-title">Research Refresh</h2>
        <p>Refreshes this stock's core fundamentals, detailed scoring metrics, ownership and document/evidence discovery. Planning itself uses zero Trendlyne calls.</p>
      </div>
      <button type="button" className="button button-secondary" disabled={busy !== null} onClick={() => void createPlan()}>{busy === "PLAN" ? "Planning…" : plan ? "Re-plan" : "Plan complete refresh"}</button>
    </div>

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
      <button type="button" className="button button-primary" disabled={!plan.executionAllowed || busy !== null} onClick={() => void execute()}>{busy === "EXECUTE" ? "Refreshing research…" : `Run Complete Research Refresh · ${plan.estimatedProviderCalls} calls`}</button>
    </div> : null}

    {result ? <div className={result.status === "SUCCEEDED" ? "notice notice-success" : result.status === "PARTIAL" ? "notice" : "notice notice-error"} role="status">
      <strong>{result.status === "SUCCEEDED" ? "Complete Research Refresh finished." : result.status === "PARTIAL" ? "Research refresh completed partially." : "Complete Research Refresh failed safely."}</strong>
      <span>{result.providerSucceeded} of {result.providerCalls} provider calls succeeded. Any accepted research evidence has been reloaded.</span>
    </div> : null}</> : <div className="section-heading">
      <div>
        <p className="eyebrow">Owner-controlled research refresh</p>
        <h2 id="complete-research-refresh-title">Research Refresh</h2>
        <p>The selected profile’s research areas are ready to receive evidence as their approved refresh capabilities become available.</p>
      </div>
      <button type="button" className="button button-secondary" disabled title="Complete refresh execution is not yet enabled for this profile">Plan complete refresh</button>
    </div>}

    {refreshModules.length ? <details className="refresh-capabilities"><summary>Profile refresh capabilities</summary><div className="profile-refresh-workspace" aria-label={`${ui.profileCode} research modules`}>
      {refreshModules.map((module) => <div className="complete-refresh-plan" key={module.code}>
        <div>
          <p className="eyebrow">{module.eyebrow}</p>
          <h3>{module.title}</h3>
          <p>{module.description}</p>
        </div>
        {module.state === "AVAILABLE_TO_PLAN" && module.actionKind === "VALUATION_EVIDENCE" ? <>
          <button type="button" className="button button-secondary" disabled={busy !== null} onClick={() => void createValuationPlan()}>{busy === "VALUATION_PLAN" ? "Planning…" : valuationPlan ? "Re-plan valuation refresh" : module.actionLabel}</button>
          {valuationPlan ? <>
            <div className="summary-grid">
              <Metric label="Trendlyne calls" value={String(valuationPlan.estimatedProviderCalls)} />
              <Metric label="Today's internal usage" value={`${valuationPlan.dailyObservedUsage}/${valuationPlan.dailyLimit}`} />
              <Metric label="Latest value" value={valuationPlan.latestValue === null ? "Unavailable" : `${valuationPlan.latestValue.toFixed(2)}%`} />
              <Metric label="Quota gate" value={valuationPlan.executionAllowed ? "Ready" : "Blocked"} />
            </div>
            <p className="assessment-note">{module.note}</p>
            <button type="button" className="button button-primary" disabled={!valuationPlan.executionAllowed || busy !== null} onClick={() => void executeValuation()}>{busy === "VALUATION_EXECUTE" ? "Refreshing valuation…" : "Run valuation refresh · 1 Trendlyne call"}</button>
          </> : null}
          {valuationResult ? <div className="notice notice-success" role="status"><strong>Valuation evidence refreshed.</strong><span>5-year P/E self-history implied upside is now {valuationResult.value.toFixed(2)}%. Research scoring and PortfolioAI advisory have been reloaded.</span></div> : null}
        </> : module.state === "AVAILABLE_TO_PLAN" && module.actionKind === "MARKET_HISTORY" ? <>
          <button type="button" className="button button-secondary" disabled={busy !== null} onClick={() => void createMarketPlan()}>{busy === "MARKET_PLAN" ? "Planning…" : marketPlan ? "Re-plan market refresh" : module.actionLabel ?? "Plan market history refresh"}</button>
          {marketPlan ? <>
            <div className="summary-grid">
              <Metric label="Angel One calls" value={String(marketPlan.estimatedProviderCalls)} />
              <Metric label="History window" value={`${marketPlan.historyDays} days`} />
              <Metric label="Interval" value={marketPlan.interval} />
              <Metric label="Existing latest candle" value={marketPlan.latestExistingCandle ? new Date(marketPlan.latestExistingCandle).toLocaleDateString("en-IN") : "None"} />
            </div>
            <p className="assessment-note">{module.note}</p>
            <button type="button" className="button button-primary" disabled={busy !== null} onClick={() => void executeMarket()}>{busy === "MARKET_EXECUTE" ? "Refreshing market history…" : `Run market history refresh · ${marketPlan.estimatedProviderCalls} call`}</button>
          </> : <p className="assessment-note">{module.note}</p>}
          {marketResult ? <div className="notice notice-success" role="status"><strong>Market history refreshed.</strong><span>{marketResult.candlesStored} daily candles stored. {marketResult.derivedMetrics.length} deterministic market metrics were derived and Research scoring has been reloaded.</span></div> : null}
        </> : module.state === "AVAILABLE_TO_PLAN" && module.actionKind === "BANK_BENCHMARK" ? <>
          <button type="button" className="button button-secondary" disabled={busy !== null} onClick={() => void createBenchmarkPlan()}>{busy === "BENCHMARK_PLAN" ? "Planning…" : benchmarkPlan ? "Re-plan benchmark refresh" : module.actionLabel}</button>
          {benchmarkPlan ? <>
            <div className="summary-grid">
              <Metric label="Angel One calls" value={String(benchmarkPlan.estimatedProviderCalls)} />
              <Metric label="Benchmark" value={benchmarkPlan.benchmark} />
              <Metric label="History window" value={`${benchmarkPlan.historyDays} days`} />
              <Metric label="Existing benchmark candle" value={benchmarkPlan.latestBenchmarkCandle ? new Date(benchmarkPlan.latestBenchmarkCandle).toLocaleDateString("en-IN") : "None"} />
            </div>
            <p className="assessment-note">{module.note}</p>
            <button type="button" className="button button-primary" disabled={busy !== null} onClick={() => void executeBenchmark()}>{busy === "BENCHMARK_EXECUTE" ? "Refreshing NIFTY Bank…" : `Run NIFTY Bank benchmark · ${benchmarkPlan.estimatedProviderCalls} call`}</button>
          </> : null}
          {benchmarkResult ? <div className="notice notice-success" role="status"><strong>NIFTY Bank relative strength added.</strong><span>{symbol} 12M return {benchmarkResult.stockReturn12M.toFixed(2)}% vs NIFTY Bank {benchmarkResult.benchmarkReturn12M.toFixed(2)}%; relative strength {benchmarkResult.relativeStrength12M.toFixed(2)} percentage points. Research scoring has been reloaded.</span></div> : null}
        </> : module.state === "EXECUTABLE" && module.actionKind === "BANK_GROWTH_DISCOVERY" ? <>
          <button type="button" className="button button-secondary" disabled={busy !== null} onClick={() => void discoverGrowth()}>{busy === "GROWTH" ? "Discovering…" : module.actionLabel}</button>
          {growthResult ? <div className="notice notice-success" role="status"><strong>Growth contract discovery captured.</strong><span>1 Trendlyne call used. No metric was promoted automatically; the capture is ready for semantic review.</span></div> : null}
        </> : <>
          <div className="profile-refresh-status"><strong>{module.state === "NOT_AVAILABLE" ? "Not available" : "Not enabled yet"}</strong><span>{module.state === "NOT_AVAILABLE" ? "This module is not available for the selected profile" : "Planning and execution are disabled"}</span></div>
          <button type="button" className="button button-secondary" disabled title={module.state === "NOT_AVAILABLE" ? "Not available for this profile" : "Execution is not yet enabled for this profile"}>{module.actionLabel ?? "Plan refresh"}</button>
          <p className="assessment-note">{module.note}</p>
        </>}
      </div>)}
    </div></details> : <p className="assessment-note">No approved profile-specific refresh capabilities are available.</p>}

  </section>
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return <article className="summary-card"><span>{label}</span><strong>{value}</strong></article>
}
