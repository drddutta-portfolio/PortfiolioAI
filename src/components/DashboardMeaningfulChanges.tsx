import { useEffect, useMemo, useSyncExternalStore } from "react"
import { Link } from "react-router-dom"
import { buildProgramCR9LiveObservedProjection } from "../features/decision/r9LivePortfolioAdapter"
import { createProgramCR9LiveSessionStore } from "../features/decision/r9LiveSessionStore"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { useResearchCoverage } from "../features/research/useResearchCoverage"
import { dashboardScopeLabel, positionsForDashboardScope, useDashboardScope } from "./dashboardScope"
import "./DashboardMeaningfulChanges.css"

function pretty(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function DashboardMeaningfulChanges() {
  const { portfolio, isLoading, error } = usePortfolioView()
  const { scopeKey } = useDashboardScope()
  const positions = portfolio?.openPositions ?? []
  const coverage = useResearchCoverage(positions)
  const sessionStore = useMemo(() => createProgramCR9LiveSessionStore(), [])
  const session = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getSnapshot,
  )

  const projection = useMemo(() => {
    if (!portfolio || coverage.isLoading || coverage.error) return null
    return buildProgramCR9LiveObservedProjection(portfolio, coverage.data)
  }, [coverage.data, coverage.error, coverage.isLoading, portfolio])

  useEffect(() => {
    sessionStore.ingest(projection)
  }, [projection, sessionStore])

  const model = useMemo(() => {
    if (!portfolio || !session) return null
    const scoped = positionsForDashboardScope(portfolio.openPositions, scopeKey)
    const scopedIds = new Set(scoped.map((position) => position.securityId))
    const comparisons = session.comparisons.filter((row) => scopedIds.has(row.securityId))
    const newEvents = session.newEvents.filter((event) => scopedIds.has(event.securityId))
    return {
      scopeLabel: dashboardScopeLabel(scopeKey, portfolio),
      scoped,
      comparisons,
      newEvents,
      firstObservation: comparisons.filter((row) => row.comparison.transitionState === "FIRST_OBSERVATION").length,
      noChange: comparisons.filter((row) => row.comparison.transitionState === "NO_CHANGE").length,
      immaterial: comparisons.filter((row) => row.comparison.transitionState === "RAW_IMMATERIAL_CHANGE").length,
      meaningful: comparisons.filter((row) => row.comparison.transitionState === "MEANINGFUL_CHANGE").length,
      incomparable: comparisons.filter((row) => (
        row.comparison.transitionState === "INCOMPARABLE"
        || row.comparison.transitionState === "OUT_OF_ORDER"
      )).length,
    }
  }, [portfolio, scopeKey, session])

  if (isLoading || error || !portfolio) return null

  return <section className="dashboard-r9" aria-label="Meaningful portfolio change">
    <div className="dashboard-r9-heading">
      <div>
        <p className="eyebrow">Decision-state change</p>
        <h2>What changed in decision state, not just price?</h2>
        <p>Deterministic comparison of current portfolio-decision states. First observation, no change, immaterial change and meaningful change remain distinct outcomes.</p>
      </div>
      <span>{model?.scopeLabel ?? dashboardScopeLabel(scopeKey, portfolio)}</span>
    </div>

    {coverage.isLoading ? <div className="dashboard-r9-notice">Waiting for research coverage before establishing the in-memory comparison baseline…</div> : null}
    {coverage.error ? <div className="dashboard-r9-notice">The comparison baseline was not established because research coverage could not be read: {coverage.error}</div> : null}

    {model ? <>
      <div className="dashboard-r9-summary">
        <article><small>First observation</small><strong>{model.firstObservation}</strong><span>Baseline only — never reported as “no change”</span></article>
        <article><small>No semantic change</small><strong>{model.noChange}</strong><span>Same canonical observed state</span></article>
        <article><small>Raw / immaterial</small><strong>{model.immaterial}</strong><span>Difference exists but no approved materiality rule fired</span></article>
        <article className={model.meaningful ? "warning" : ""}><small>Meaningful change</small><strong>{model.meaningful}</strong><span>Versioned categorical/lineage rule fired</span></article>
        <article className={model.incomparable ? "warning" : ""}><small>Comparison blocked</small><strong>{model.incomparable}</strong><span>Incomparable or out-of-order observations</span></article>
      </div>

      <div className="dashboard-r9-panel">
        <div className="dashboard-r9-subheading">
          <div><span>New in-memory meaningful events</span><strong>{model.newEvents.length ? `${model.newEvents.length} event${model.newEvents.length === 1 ? "" : "s"}` : "No new meaningful event"}</strong></div>
          <Link to="/app/research">Research →</Link>
        </div>
        {model.newEvents.length ? <div className="dashboard-r9-events">{model.newEvents.slice(0, 8).map((event) => {
          const row = model.comparisons.find((candidate) => candidate.securityId === event.securityId)
          return <article key={event.eventId}>
            <div><Link to={`/app/research/${event.securityId}`}>{row?.symbol ?? event.securityId.slice(0, 8)}</Link><span>{row?.company ?? "Portfolio holding"}</span></div>
            <div><strong>{event.meaningfulChanges.map((change) => pretty(change.code)).join(" · ")}</strong><span>{event.meaningfulChanges.map((change) => `${change.previousValue ?? "None"} → ${change.currentValue ?? "None"}`).join(" · ")}</span></div>
          </article>
        })}</div> : <div className="dashboard-r9-empty">No new meaningful decision-state event is available in this session. On first observation PortfolioAI establishes an in-memory baseline; it does not fabricate “no change”.</div>}
      </div>

      <p className="dashboard-r9-method">Meaningful-change comparison is read-only and session-local. Acknowledgement, snooze, seen/unseen state and cross-session notification history are not persisted. Daily price movement remains a separate market view and is not treated as decision-state materiality.</p>
    </> : null}
  </section>
}
