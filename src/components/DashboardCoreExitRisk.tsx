import { useMemo } from "react"
import { Link } from "react-router-dom"
import type { DashboardRecommendationEvidence } from "../data/dashboardEvidenceRepository"
import { useDashboardRecommendations } from "../features/dashboard/useDashboardEvidence"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { useResearchCoverage } from "../features/research/useResearchCoverage"
import { buildProgramCR8LivePortfolioProjection } from "../features/decision/r8LivePortfolioAdapter"
import { useP5TerminalDispositions } from "../features/decision/useP5TerminalDispositions"
import { dashboardScopeLabel, positionsForDashboardScope, useDashboardScope } from "./dashboardScope"
import "./DashboardCoreExitRisk.css"

type AdvisoryState = "supportive" | "review" | "neutral"

function pretty(value: string | null | undefined) {
  return value ? value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Pending"
}

function numberValue(value: string | null | undefined) {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function advisoryState(row: DashboardRecommendationEvidence): AdvisoryState {
  const action = (row.actionBias ?? "").toUpperCase()
  const transition = (row.transitionStatus ?? "").toUpperCase()
  const change = (row.changeSignal ?? "").toUpperCase()
  const suggested = (row.suggestedRole ?? "").toUpperCase()
  const current = (row.currentUserRole ?? "").toUpperCase()

  if (["REDUCE", "EXIT", "SELL", "REVIEW", "AVOID"].some((term) => action.includes(term))) return "review"
  if (["DOWNGRADE", "DEMOTION", "EXIT", "REVIEW"].some((term) => transition.includes(term) || change.includes(term))) return "review"
  if (current === "CORE" && suggested && !suggested.includes("CORE")) return "review"
  if (["ACCUMULATE", "ADD", "BUY", "HOLD"].some((term) => action.includes(term)) && ["STABLE", "UNCHANGED", "INITIAL"].some((term) => transition.includes(term) || change.includes(term))) return "supportive"
  return "neutral"
}

function ageLabel(value: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return "Date unavailable"
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
  if (days === 0) return "Today"
  if (days === 1) return "1 day ago"
  return `${days} days ago`
}

export function DashboardCoreExitRisk() {
  const { portfolio, isLoading, error } = usePortfolioView()
  const { scopeKey } = useDashboardScope()
  const securityIds = useMemo(() => portfolio?.openPositions.map((position) => position.securityId) ?? [], [portfolio])
  const recommendations = useDashboardRecommendations(portfolio?.portfolio.id ?? null, securityIds)
  const rows = useMemo(() => [...recommendations.data.values()], [recommendations.data])
  const coverage = useResearchCoverage(portfolio?.openPositions ?? [])
  const p5 = useP5TerminalDispositions(portfolio?.portfolio.id ?? null)
  const r8Projection = useMemo(
    () => portfolio && !p5.isLoading
      ? buildProgramCR8LivePortfolioProjection(portfolio, coverage.data, p5.bySecurityId)
      : null,
    [coverage.data, p5.bySecurityId, p5.isLoading, portfolio],
  )

  const model = useMemo(() => {
    if (!portfolio) return null
    const scoped = positionsForDashboardScope(portfolio.openPositions, scopeKey)
    const scopedIds = new Set(scoped.map((position) => position.securityId))
    const scopedRows = rows.filter((row) => scopedIds.has(row.securityId))
    const byId = new Map(scoped.map((position) => [position.securityId, position]))
    const latestById = new Map(scopedRows.map((row) => [row.securityId, row]))
    const r8ById = new Map((r8Projection?.rows ?? []).map((row) => [row.securityId, row]))
    const core = scoped.filter((position) => position.role === "CORE")
    const coreWithAdvisory = core.flatMap((position) => {
      const row = latestById.get(position.securityId)
      return row ? [{ position, row, state: advisoryState(row) }] : []
    })
    const supportive = coreWithAdvisory.filter((item) => item.state === "supportive")
    const review = coreWithAdvisory.filter((item) => item.state === "review")
    const advisoryEscalations = scopedRows
      .map((row) => ({ row, position: byId.get(row.securityId), state: advisoryState(row) }))
      .filter((item) => item.state === "review")
      .sort((left, right) => right.row.createdAt.localeCompare(left.row.createdAt))
    const r8CoreRows = core.flatMap((position) => {
      const row = r8ById.get(position.securityId)
      return row ? [{ position, row }] : []
    })
    const r8ScopedRows = scoped.flatMap((position) => {
      const row = r8ById.get(position.securityId)
      return row ? [{ position, row }] : []
    })
    const r8CoreEvaluated = r8CoreRows.filter(
      ({ row }) => row.presentation.coreHealth.coverage === "EVALUATED",
    )
    const r8ExitEvaluated = r8ScopedRows.filter(
      ({ row }) => row.presentation.exitIntelligence.coverage === "EVALUATED",
    )
    return {
      scopeLabel: dashboardScopeLabel(scopeKey, portfolio),
      scoped,
      scopedRows,
      core,
      coreWithAdvisory,
      supportive,
      review,
      advisoryEscalations,
      r8CoreRows,
      r8ScopedRows,
      r8CoreEvaluated,
      r8ExitEvaluated,
    }
  }, [portfolio, r8Projection?.rows, rows, scopeKey])

  if (isLoading || error || !portfolio || !model) return null

  return <section className="dashboard-core-exit-risk" aria-label="Core Health and Exit-Risk summary">
    <div className="dcer-heading">
      <div>
        <p className="eyebrow">Core health &amp; exit-risk</p>
        <h2>Where does the portfolio need structural attention?</h2>
        <p>Read-only summary combining persisted advisory evidence with current Core Health and Exit Intelligence. Missing upstream authority stays blocked or insufficient; nothing is inferred from price weakness alone.</p>
      </div>
      <span>{model.scopeLabel}</span>
    </div>

    {recommendations.isLoading ? <div className="dcer-notice">Loading persisted advisory evidence…</div> : null}
    {recommendations.error ? <div className="dcer-notice error">Health evidence could not be loaded: {recommendations.error}</div> : null}

    {!recommendations.isLoading && !recommendations.error ? <>
      <div className="dcer-summary-grid">
        <article>
          <small>Core holdings in scope</small>
          <strong>{model.core.length}</strong>
          <span>User-assigned Core positions</span>
        </article>
        <article className={model.coreWithAdvisory.length === model.core.length && model.core.length ? "positive" : "warning"}>
          <small>Core advisory coverage</small>
          <strong>{model.coreWithAdvisory.length}/{model.core.length}</strong>
          <span>Latest persisted recommendation evidence</span>
        </article>
        <article className={model.review.length ? "negative" : "neutral"}>
          <small>Core review signals</small>
          <strong>{model.review.length}</strong>
          <span>Advisory escalation only — not formal Exit Risk</span>
        </article>
        <article className={model.r8CoreEvaluated.length === model.core.length && model.core.length ? "positive" : "warning"}>
          <small>Core Health</small>
          <strong>{model.r8CoreEvaluated.length}/{model.core.length}</strong>
          <span>On-demand, read-only; blocked/insufficient states remain explicit</span>
        </article>
        <article className={model.r8ExitEvaluated.length === model.scoped.length && model.scoped.length ? "positive" : "warning"}>
          <small>Exit Intelligence</small>
          <strong>{model.r8ExitEvaluated.length}/{model.scoped.length}</strong>
          <span>On-demand, non-persisted thesis/permanent-loss assessment</span>
        </article>
      </div>

      <div className="dcer-grid">
        <section className="dcer-panel">
          <div className="dcer-subheading">
            <div><span>Core advisory evidence</span><strong>{model.coreWithAdvisory.length ? `${model.coreWithAdvisory.length} covered Core holding${model.coreWithAdvisory.length === 1 ? "" : "s"}` : "No covered Core holdings"}</strong></div>
            <Link to="/app/structure">Portfolio structure →</Link>
          </div>
          {model.core.length === 0 ? <div className="dcer-empty">No Core holdings are present in the selected scope.</div> : model.coreWithAdvisory.length ? <div className="dcer-list">{model.coreWithAdvisory.map(({ position, row, state }) => {
            const score = numberValue(row.overallScore)
            const readiness = numberValue(row.scoreReadyCoverage)
            return <article key={position.securityId} className={`state-${state}`}>
              <i />
              <div><Link to={`/app/research/${position.securityId}`}>{position.symbol}</Link><span>{position.company}</span></div>
              <div><strong>{pretty(row.actionBias)}</strong><span>{pretty(row.suggestedRole)} · {pretty(row.transitionStatus)}{row.changeSignal ? ` · ${pretty(row.changeSignal)}` : ""}</span></div>
              <div><strong>{score === null ? "Score —" : `Score ${score.toFixed(1)}`}</strong><span>{readiness === null ? "Readiness —" : `${Math.round(readiness * 100)}% ready`} · {ageLabel(row.createdAt)}</span></div>
            </article>
          })}</div> : <div className="dcer-empty">Core holdings exist, but no persisted recommendation evidence has been generated for them yet.</div>}
        </section>

        <section className="dcer-panel">
          <div className="dcer-subheading"><div><span>Current decision states</span><strong>Core Health + Exit Intelligence</strong></div><Link to="/app/research">Research →</Link></div>
          <div className="dcer-engine-note">
            <strong>Read-only and fail-closed</strong>
            <p>PortfolioAI evaluates this view on demand from current portfolio context. Where required score lineage, risk magnitude or thesis-deterioration evidence is unavailable, the result stays blocked or insufficient rather than fabricating a positive state.</p>
          </div>
          {model.r8ScopedRows.slice(0, 6).map(({ position, row }) => <div className="dcer-readiness-row" key={position.securityId}><span>{position.symbol} · Core: {row.presentation.coreHealth.label}</span><strong>Exit: {row.presentation.exitIntelligence.label}</strong></div>)}
          <div className="dcer-readiness-row"><span>Current persisted advisories in scope</span><strong>{model.scopedRows.length}/{model.scoped.length}</strong></div>
          <div className="dcer-readiness-row"><span>Advisory escalation signals</span><strong>{model.advisoryEscalations.length}</strong></div>
          {model.advisoryEscalations.length ? <div className="dcer-escalations">{model.advisoryEscalations.slice(0, 5).map(({ row, position }) => <article key={row.securityId}><Link to={`/app/research/${row.securityId}`}>{position?.symbol ?? row.securityId.slice(0, 8)}</Link><span>{pretty(row.actionBias)} · {pretty(row.transitionStatus)}{row.changeSignal ? ` · ${pretty(row.changeSignal)}` : ""}</span></article>)}</div> : <p className="dcer-caution">No escalation is present in the currently persisted advisory evidence. This must not be interpreted as “zero exit risk”; Exit Intelligence remains fail-closed where thesis/permanent-loss evidence is insufficient.</p>}
        </section>
      </div>

      <p className="dcer-method">Core Health and Exit Intelligence remain separate concepts. They are evaluated on demand; persisted advisory metadata remains separate context, and price weakness, valuation or concentration alone cannot become a thesis-breaking exit signal.</p>
    </> : null}
  </section>
}
