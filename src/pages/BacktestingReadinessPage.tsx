import { Link } from "react-router-dom"
import { useP7CurrentIntelligence } from "../features/decision/useP7CurrentIntelligence"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import "./BacktestingReadinessPage.css"

export function BacktestingReadinessPage() {
  const { portfolio, isLoading, error } = usePortfolioView()
  const intelligence = useP7CurrentIntelligence(portfolio?.portfolio.id ?? null)
  if (isLoading) return <div className="portfolio-loading"><span className="loader" /><p>Auditing point-in-time readiness…</p></div>
  if (error || !portfolio) return <div className="notice notice-error" role="alert">{error ?? "Backtesting readiness could not be loaded."}</div>

  const equityCount = portfolio.openPositions.filter((position) => position.assetClass !== "ETF").length
  const scored = intelligence.data.filter((row) => row.r6State === "SCORED" && row.r7State !== "INSUFFICIENT_EVIDENCE").length
  const historicalDecisionStates = 0
  const ready = equityCount > 0 && scored === equityCount && historicalDecisionStates >= 8

  return <section className="portfolio-page p8-readiness-page">
    <div className="portfolio-hero compact-hero"><div><p className="eyebrow">P8 · Advanced Quant / Backtesting</p><h1>Backtesting readiness</h1><p>Point-in-time evidence must prove what PortfolioAI could actually have known on each historical decision date. Current data is never silently treated as historical data.</p></div><Link className="button button-secondary" to="/app/intelligence">Back to Intelligence</Link></div>

    <section className={`p8-gate ${ready ? "is-ready" : "is-blocked"}`}>
      <div><span>P8 execution gate</span><strong>{ready ? "READY" : "BLOCKED — DATA FOUNDATION"}</strong></div>
      <p>{ready ? "The minimum deterministic history contract is satisfied." : "PortfolioAI can build and validate the backtest contract, but it cannot publish performance results until sufficient point-in-time decision history and historical universe membership exist."}</p>
    </section>

    <div className="p8-readiness-grid">
      <article><span>Current equity universe</span><strong>{equityCount}</strong><small>Current holdings are not a historical survivor-free universe</small></article>
      <article><span>Current R6/R7 ready</span><strong>{scored}/{equityCount}</strong><small>Current fail-closed results cannot seed historical recommendations</small></article>
      <article><span>Historical decision states</span><strong>{historicalDecisionStates}</strong><small>Minimum proposed validation depth: 8 dated states</small></article>
      <article><span>Published backtest results</span><strong>0</strong><small>No return, alpha or hit-rate claim is authorized</small></article>
    </div>

    <section className="panel p8-contract-panel"><div className="section-heading"><div><p className="eyebrow">P8-A contract freeze</p><h2>What every historical input must prove</h2></div><span className="coverage-badge">Fail closed</span></div>
      <div className="p8-rule-grid">
        <article><b>Availability time</b><p>Observation and publication timestamps must be on or before the simulated decision.</p></article>
        <article><b>Immutable provenance</b><p>Later capture is permitted only when an immutable publication archive proves historical availability.</p></article>
        <article><b>Historical universe</b><p>Membership must be reconstructed as of the decision date; today’s holdings cannot define the past universe.</p></article>
        <article><b>Forward outcome separation</b><p>Return windows must start strictly after the decision instant.</p></article>
        <article><b>Versioned methodology</b><p>Classification, methodology, thresholds and benchmark authority must be frozen per run.</p></article>
        <article><b>No automatic promotion</b><p>Backtest results cannot change live R6–R10 policy, owner settings, sizing or trades.</p></article>
      </div>
    </section>

    <section className="panel p8-next-panel"><p className="eyebrow">Next controlled step</p><h2>Historical data sufficiency inventory</h2><p>Count usable price, fundamental, document, classification, benchmark and universe-membership history by security and date. The inventory is read-only and must precede any backtest engine or performance UI.</p></section>
  </section>
}
