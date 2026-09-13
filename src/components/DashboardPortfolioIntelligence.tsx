import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { SupabaseClient } from "@supabase/supabase-js"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { supabase } from "../lib/supabase"
import "./DashboardPortfolioIntelligence.css"

type RecommendationRow = {
  security_id: string
  overall_score: number | string | null
  score_ready_coverage: number | string | null
  evidence_confidence: number | string | null
  suggested_role: string | null
  action_bias: string | null
  current_user_role: string | null
  change_signal: string | null
  transition_status: string | null
  persistence_count: number | null
  created_at: string
}

type Tone = "positive" | "negative" | "warning" | "neutral"
const db = supabase as unknown as SupabaseClient

function n(value: number | string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
function pretty(value: string | null | undefined) {
  return value ? value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Pending"
}
function actionTone(value: string | null): Tone {
  const action = (value ?? "").toUpperCase()
  if (["ADD", "ACCUMULATE", "BUY"].some((term) => action.includes(term))) return "positive"
  if (["REDUCE", "EXIT", "AVOID", "SELL"].some((term) => action.includes(term))) return "negative"
  if (["WATCH", "REVIEW", "CAUTION"].some((term) => action.includes(term))) return "warning"
  return "neutral"
}
function age(value: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return "Date unavailable"
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
  if (days === 0) return "Today"
  if (days === 1) return "1 day ago"
  return `${days} days ago`
}
function coverageLabel(analyzed: number, total: number) {
  if (!total) return "0%"
  const value = (analyzed / total) * 100
  if (value > 0 && value < 1) return `${value.toFixed(1)}%`
  return `${Math.round(value)}%`
}

export function DashboardPortfolioIntelligence() {
  const { portfolio, isLoading, error } = usePortfolioView()
  const [rows, setRows] = useState<readonly RecommendationRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!portfolio?.portfolio.id || !portfolio.openPositions.length) return
    let cancelled = false
    const securityIds = portfolio.openPositions.map((position) => position.securityId)
    async function load() {
      setLoading(true); setLoadError(null)
      const result = await db.from("stock_recommendation_runs")
        .select("security_id,overall_score,score_ready_coverage,evidence_confidence,suggested_role,action_bias,current_user_role,change_signal,transition_status,persistence_count,created_at")
        .eq("portfolio_id", portfolio!.portfolio.id)
        .in("security_id", securityIds)
        .order("created_at", { ascending: false })
      if (cancelled) return
      if (result.error) { setLoadError(result.error.message); setLoading(false); return }
      const latest = new Map<string, RecommendationRow>()
      ;((result.data ?? []) as RecommendationRow[]).forEach((row) => { if (!latest.has(row.security_id)) latest.set(row.security_id, row) })
      setRows([...latest.values()]); setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [portfolio])

  const summary = useMemo(() => {
    const total = portfolio?.openPositions.length ?? 0
    const analyzed = rows.length
    const coverage = coverageLabel(analyzed, total)
    const readiness = rows.map((row) => n(row.score_ready_coverage)).filter((value): value is number => value !== null)
    const avgReadiness = readiness.length ? Math.round((readiness.reduce((sum, value) => sum + value, 0) / readiness.length) * 100) : null
    const roleChanges = rows.filter((row) => row.current_user_role && row.suggested_role && row.current_user_role !== row.suggested_role).length
    const confirmedTransitions = rows.filter((row) => ["CONFIRMED_UPGRADE", "CONFIRMED_DOWNGRADE"].includes(row.transition_status ?? "")).length
    const counts = new Map<string, number>()
    rows.forEach((row) => { const key = (row.action_bias ?? "PENDING").toUpperCase(); counts.set(key, (counts.get(key) ?? 0) + 1) })
    return { total, analyzed, coverage, avgReadiness, readinessCount: readiness.length, roleChanges, confirmedTransitions, counts }
  }, [portfolio, rows])

  const latest = useMemo(() => [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 12), [rows])
  const byId = useMemo(() => new Map((portfolio?.openPositions ?? []).map((position) => [position.securityId, position])), [portfolio])

  if (isLoading || error || !portfolio) return null

  return <section className="dashboard-portfolio-intelligence" aria-label="Portfolio intelligence snapshot">
    <div className="dashboard-pi-heading"><div><p className="eyebrow">Portfolio intelligence snapshot</p><h2>What is PortfolioAI currently saying?</h2><p>Read-only view of the latest persisted recommendation evidence. It does not create a recommendation, rerun scoring or change any holding.</p></div><Link to="/app/research">Open research →</Link></div>

    {loading ? <div className="dashboard-pi-notice">Loading persisted recommendation evidence…</div> : null}
    {loadError ? <div className="dashboard-pi-notice error">Portfolio intelligence could not be loaded: {loadError}</div> : null}

    {!loading && !loadError ? <>
      <div className="dashboard-pi-summary">
        <article><span>Analysis coverage</span><strong>{summary.coverage}</strong><small>{summary.analyzed} of {summary.total} current holdings have a persisted recommendation run</small></article>
        <article><span>Average score readiness</span><strong>{summary.avgReadiness === null ? "—" : `${summary.avgReadiness}%`}</strong><small>Based on {summary.readinessCount} analyzed holding{summary.readinessCount === 1 ? "" : "s"} with persisted readiness evidence</small></article>
        <article><span>Role-change suggestions</span><strong>{summary.roleChanges}</strong><small>Latest suggested role differs from the current user role</small></article>
        <article><span>Confirmed transitions</span><strong>{summary.confirmedTransitions}</strong><small>Persisted recommendation upgrades or downgrades confirmed</small></article>
      </div>

      <div className="dashboard-pi-grid">
        <section className="dashboard-pi-biases">
          <div className="dashboard-pi-subheading"><div><span>Action-bias distribution</span><strong>{summary.analyzed ? `${summary.analyzed} analyzed holdings` : "No analyzed holdings"}</strong></div></div>
          {summary.counts.size ? <div className="dashboard-pi-bias-list">{[...summary.counts.entries()].sort((a,b) => b[1]-a[1]).map(([label,count]) => <div key={label} className={`tone-${actionTone(label)}`}><span>{pretty(label)}</span><strong>{count}</strong><i style={{ width: `${summary.analyzed ? Math.max(6, (count / summary.analyzed) * 100) : 0}%` }} /></div>)}</div> : <div className="dashboard-pi-empty">Recommendation coverage has not yet been generated for the portfolio.</div>}
          <p className="dashboard-pi-footnote">Coverage is intentionally shown separately from research coverage: stored research evidence can exist before a recommendation run is produced.</p>
        </section>

        <section className="dashboard-pi-latest">
          <div className="dashboard-pi-subheading"><div><span>Latest persisted advisories</span><strong>{latest.length ? `${latest.length} most recent` : "None yet"}</strong></div></div>
          {latest.length ? <div className="dashboard-pi-list">{latest.map((row) => { const position = byId.get(row.security_id); const score=n(row.overall_score); const ready=n(row.score_ready_coverage); return <article key={row.security_id} className={`tone-${actionTone(row.action_bias)}`}><i/><div><Link to={`/app/research/${row.security_id}`}>{position?.symbol ?? row.security_id.slice(0,8)}</Link><small>{position?.company ?? "Portfolio holding"}</small></div><div><strong>{pretty(row.action_bias)}</strong><p>{pretty(row.suggested_role)} · {pretty(row.transition_status)}{row.change_signal ? ` · ${pretty(row.change_signal)}` : ""}</p></div><div><b>{score === null ? "Score —" : `Score ${score.toFixed(1)}`}</b><small>{ready === null ? "Readiness —" : `${Math.round(ready*100)}% ready`} · {age(row.created_at)}</small></div></article>})}</div> : <div className="dashboard-pi-empty">No persisted recommendation runs are available for current holdings yet.</div>}
        </section>
      </div>
    </> : null}
  </section>
}
