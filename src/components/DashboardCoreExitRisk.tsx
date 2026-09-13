import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { SupabaseClient } from "@supabase/supabase-js"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { supabase } from "../lib/supabase"
import { dashboardScopeLabel, positionsForDashboardScope, useDashboardScope } from "./DashboardScopeContext"
import "./DashboardCoreExitRisk.css"

type RecommendationRow = {
  security_id: string
  overall_score: number | string | null
  score_ready_coverage: number | string | null
  suggested_role: string | null
  action_bias: string | null
  current_user_role: string | null
  change_signal: string | null
  transition_status: string | null
  persistence_count: number | null
  created_at: string
}

type AdvisoryState = "supportive" | "review" | "neutral"

const db = supabase as unknown as SupabaseClient

function pretty(value: string | null | undefined) {
  return value ? value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Pending"
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function advisoryState(row: RecommendationRow): AdvisoryState {
  const action = (row.action_bias ?? "").toUpperCase()
  const transition = (row.transition_status ?? "").toUpperCase()
  const change = (row.change_signal ?? "").toUpperCase()
  const suggested = (row.suggested_role ?? "").toUpperCase()
  const current = (row.current_user_role ?? "").toUpperCase()

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
  const [rows, setRows] = useState<readonly RecommendationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!portfolio?.portfolio.id || !portfolio.openPositions.length) return
    let cancelled = false
    const ids = portfolio.openPositions.map((position) => position.securityId)
    async function load() {
      setLoading(true)
      setLoadError(null)
      const result = await db.from("stock_recommendation_runs")
        .select("security_id,overall_score,score_ready_coverage,suggested_role,action_bias,current_user_role,change_signal,transition_status,persistence_count,created_at")
        .eq("portfolio_id", portfolio!.portfolio.id)
        .in("security_id", ids)
        .order("created_at", { ascending: false })
      if (cancelled) return
      if (result.error) {
        setRows([])
        setLoadError(result.error.message)
        setLoading(false)
        return
      }
      const latest = new Map<string, RecommendationRow>()
      ;((result.data ?? []) as RecommendationRow[]).forEach((row) => {
        if (!latest.has(row.security_id)) latest.set(row.security_id, row)
      })
      setRows([...latest.values()])
      setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [portfolio])

  const model = useMemo(() => {
    if (!portfolio) return null
    const scoped = positionsForDashboardScope(portfolio.openPositions, scopeKey)
    const scopedIds = new Set(scoped.map((position) => position.securityId))
    const scopedRows = rows.filter((row) => scopedIds.has(row.security_id))
    const byId = new Map(scoped.map((position) => [position.securityId, position]))
    const latestById = new Map(scopedRows.map((row) => [row.security_id, row]))
    const core = scoped.filter((position) => position.role === "CORE")
    const coreWithAdvisory = core.flatMap((position) => {
      const row = latestById.get(position.securityId)
      return row ? [{ position, row, state: advisoryState(row) }] : []
    })
    const supportive = coreWithAdvisory.filter((item) => item.state === "supportive")
    const review = coreWithAdvisory.filter((item) => item.state === "review")
    const advisoryEscalations = scopedRows
      .map((row) => ({ row, position: byId.get(row.security_id), state: advisoryState(row) }))
      .filter((item) => item.state === "review")
      .sort((left, right) => right.row.created_at.localeCompare(left.row.created_at))
    return {
      scopeLabel: dashboardScopeLabel(scopeKey, portfolio),
      scoped,
      scopedRows,
      core,
      coreWithAdvisory,
      supportive,
      review,
      advisoryEscalations,
    }
  }, [portfolio, rows, scopeKey])

  if (isLoading || error || !portfolio || !model) return null

  return <section className="dashboard-core-exit-risk" aria-label="Core Health and Exit-Risk summary">
    <div className="dcer-heading">
      <div>
        <p className="eyebrow">Core health &amp; exit-risk</p>
        <h2>Where does the portfolio need structural attention?</h2>
        <p>Read-only summary of persisted advisory evidence. Formal Core Health and Exit-Risk engine statuses are shown only when those engines have actually produced evidence; nothing is inferred from price weakness alone.</p>
      </div>
      <span>{model.scopeLabel}</span>
    </div>

    {loading ? <div className="dcer-notice">Loading persisted advisory evidence…</div> : null}
    {loadError ? <div className="dcer-notice error">Health evidence could not be loaded: {loadError}</div> : null}

    {!loading && !loadError ? <>
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
        <article className="warning">
          <small>Formal Core Health engine</small>
          <strong>NOT YET PERSISTED</strong>
          <span>No fabricated Core / Watch / At Risk label</span>
        </article>
        <article className="warning">
          <small>Formal Exit-Risk engine</small>
          <strong>NOT YET PERSISTED</strong>
          <span>No fabricated Healthy / Exit Watch status</span>
        </article>
      </div>

      <div className="dcer-grid">
        <section className="dcer-panel">
          <div className="dcer-subheading">
            <div><span>Core advisory evidence</span><strong>{model.coreWithAdvisory.length ? `${model.coreWithAdvisory.length} covered Core holding${model.coreWithAdvisory.length === 1 ? "" : "s"}` : "No covered Core holdings"}</strong></div>
            <Link to="/app/structure">Portfolio structure →</Link>
          </div>
          {model.core.length === 0 ? <div className="dcer-empty">No Core holdings are present in the selected scope.</div> : model.coreWithAdvisory.length ? <div className="dcer-list">{model.coreWithAdvisory.map(({ position, row, state }) => {
            const score = numberValue(row.overall_score)
            const readiness = numberValue(row.score_ready_coverage)
            return <article key={position.securityId} className={`state-${state}`}>
              <i />
              <div><Link to={`/app/research/${position.securityId}`}>{position.symbol}</Link><span>{position.company}</span></div>
              <div><strong>{pretty(row.action_bias)}</strong><span>{pretty(row.suggested_role)} · {pretty(row.transition_status)}{row.change_signal ? ` · ${pretty(row.change_signal)}` : ""}</span></div>
              <div><strong>{score === null ? "Score —" : `Score ${score.toFixed(1)}`}</strong><span>{readiness === null ? "Readiness —" : `${Math.round(readiness * 100)}% ready`} · {ageLabel(row.created_at)}</span></div>
            </article>
          })}</div> : <div className="dcer-empty">Core holdings exist, but no persisted recommendation evidence has been generated for them yet.</div>}
        </section>

        <section className="dcer-panel">
          <div className="dcer-subheading"><div><span>Exit-risk readiness</span><strong>Formal engine pending</strong></div><Link to="/app/research">Research →</Link></div>
          <div className="dcer-engine-note">
            <strong>Why this panel does not show a risk score yet</strong>
            <p>The canonical Exit Radar requires evidence across earnings deterioration, cash flow, capital efficiency, balance sheet, competitive/business deterioration, management/governance, valuation, momentum confirmation and portfolio risk. PortfolioAI does not yet persist a formal assessment across those factors.</p>
          </div>
          <div className="dcer-readiness-row"><span>Current persisted advisories in scope</span><strong>{model.scopedRows.length}/{model.scoped.length}</strong></div>
          <div className="dcer-readiness-row"><span>Advisory escalation signals</span><strong>{model.advisoryEscalations.length}</strong></div>
          {model.advisoryEscalations.length ? <div className="dcer-escalations">{model.advisoryEscalations.slice(0, 5).map(({ row, position }) => <article key={row.security_id}><Link to={`/app/research/${row.security_id}`}>{position?.symbol ?? row.security_id.slice(0, 8)}</Link><span>{pretty(row.action_bias)} · {pretty(row.transition_status)}{row.change_signal ? ` · ${pretty(row.change_signal)}` : ""}</span></article>)}</div> : <p className="dcer-caution">No escalation is present in the currently persisted advisory evidence. This must not be interpreted as “zero exit risk” because formal Exit-Risk coverage is not yet available.</p>}
        </section>
      </div>

      <p className="dcer-method">Core Health and Exit Risk remain separate concepts: position sizing or valuation can justify reducing a stock without implying a thesis-breaking exit. The formal engine layer will plug into this summary when deterministic assessments are persisted.</p>
    </> : null}
  </section>
}
