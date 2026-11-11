import Decimal from "decimal.js"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { SupabaseClient } from "@supabase/supabase-js"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { supabase } from "../lib/supabase"
import { dashboardScopeLabel, positionsForDashboardScope, useDashboardScope } from "./DashboardScopeContext"
import "./DashboardPositionSizing.css"

type RecommendationRow = {
  security_id: string
  current_weight: number | string | null
  suggested_weight_min: number | string | null
  suggested_weight_max: number | string | null
  action_bias: string | null
  suggested_role: string | null
  score_ready_coverage: number | string | null
  created_at: string
}

type Tone = "positive" | "warning" | "negative" | "neutral"
const db = supabase as unknown as SupabaseClient

function d(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null
  try { return new Decimal(value) } catch { return null }
}
function pct(value: Decimal | null, digits = 2) { return value === null ? "—" : `${value.toDecimalPlaces(digits).toFixed(digits)}%` }
function pretty(value: string | null | undefined) { return value ? value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Pending" }
function toneForBias(value: string | null): Tone {
  const v = (value ?? "").toUpperCase()
  if (["ADD", "ACCUMULATE", "BUY"].some((term) => v.includes(term))) return "positive"
  if (["REDUCE", "TRIM", "EXIT", "SELL"].some((term) => v.includes(term))) return "negative"
  if (["WAIT", "WATCH", "FREEZE", "REVIEW"].some((term) => v.includes(term))) return "warning"
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

export function DashboardPositionSizing() {
  const { portfolio, isLoading, error } = usePortfolioView()
  const { scopeKey } = useDashboardScope()
  const [recommendations, setRecommendations] = useState<readonly RecommendationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!portfolio?.portfolio.id || !portfolio.openPositions.length) return
    let cancelled = false
    const ids = portfolio.openPositions.map((position) => position.securityId)
    async function load() {
      setLoading(true); setLoadError(null)
      const result = await db.from("stock_recommendation_runs")
        .select("security_id,current_weight,suggested_weight_min,suggested_weight_max,action_bias,suggested_role,score_ready_coverage,created_at")
        .eq("portfolio_id", portfolio!.portfolio.id)
        .in("security_id", ids)
        .order("created_at", { ascending: false })
      if (cancelled) return
      if (result.error) { setRecommendations([]); setLoadError(result.error.message); setLoading(false); return }
      const latest = new Map<string, RecommendationRow>()
      ;((result.data ?? []) as RecommendationRow[]).forEach((row) => { if (!latest.has(row.security_id)) latest.set(row.security_id, row) })
      setRecommendations([...latest.values()]); setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [portfolio])

  const model = useMemo(() => {
    if (!portfolio) return null
    const scoped = positionsForDashboardScope(portfolio.openPositions, scopeKey)
    const ids = new Set(scoped.map((position) => position.securityId))
    const byId = new Map(scoped.map((position) => [position.securityId, position]))
    const scopedRecs = recommendations.filter((row) => ids.has(row.security_id))
    const configured = scoped.filter((position) => position.settings.targetWeight !== null || position.settings.minimumWeight !== null || position.settings.maximumWeight !== null || position.settings.isFrozen)
    const targets = scoped.filter((position) => position.settings.targetWeight !== null)
    const ranges = scoped.filter((position) => position.settings.minimumWeight !== null && position.settings.maximumWeight !== null)

    const configuredRows = configured.map((position) => {
      const current = d(position.portfolioWeightPercent)
      const target = d(position.settings.targetWeight)
      const minimum = d(position.settings.minimumWeight)
      const maximum = d(position.settings.maximumWeight)
      let label = "Configured"
      let tone: Tone = "neutral"
      if (position.settings.isFrozen) { label = "Frozen"; tone = "warning" }
      else if (current && maximum && current.gt(maximum)) { label = "Above range"; tone = "negative" }
      else if (current && minimum && current.lt(minimum)) { label = "Below range"; tone = "warning" }
      else if (current && minimum && maximum) { label = "Within range"; tone = "positive" }
      else if (current && target) { label = current.gt(target) ? "Above target" : current.lt(target) ? "Below target" : "At target"; tone = current.eq(target) ? "positive" : "warning" }
      return { position, current, target, minimum, maximum, label, tone, gap: current && target ? current.minus(target) : null }
    }).sort((a, b) => Math.abs(Number(b.gap ?? 0)) - Math.abs(Number(a.gap ?? 0)))

    const advisoryRows = scopedRecs
      .filter((row) => row.suggested_weight_min !== null || row.suggested_weight_max !== null)
      .map((row) => ({ row, position: byId.get(row.security_id) }))
      .filter((item) => item.position)

    return { scopeLabel: dashboardScopeLabel(scopeKey, portfolio), scoped, configuredRows, targets, ranges, advisoryRows }
  }, [portfolio, recommendations, scopeKey])

  if (isLoading || error || !portfolio || !model) return null

  return <section className="dashboard-position-sizing" aria-label="Position sizing health">
    <div className="dps-heading">
      <div><p className="eyebrow">Position sizing health</p><h2>Is portfolio capital sized intentionally?</h2><p>Read-only view of stored target/range settings and persisted sizing advisories. Missing sizing evidence remains explicit; no target is inferred from current weight or performance.</p></div>
      <span>{model.scopeLabel}</span>
    </div>

    {loading ? <div className="dps-notice">Loading persisted sizing advisory evidence…</div> : null}
    {loadError ? <div className="dps-notice error">Sizing advisory evidence could not be loaded: {loadError}</div> : null}

    {!loading && !loadError ? <>
      <div className="dps-summary-grid">
        <article><small>Holdings in scope</small><strong>{model.scoped.length}</strong><span>Current scoped positions</span></article>
        <article className={model.targets.length === model.scoped.length && model.scoped.length ? "positive" : "warning"}><small>User target weights</small><strong>{model.targets.length}/{model.scoped.length}</strong><span>Positions with a stored target weight</span></article>
        <article className={model.ranges.length === model.scoped.length && model.scoped.length ? "positive" : "warning"}><small>Complete sizing ranges</small><strong>{model.ranges.length}/{model.scoped.length}</strong><span>Both minimum and maximum stored</span></article>
        <article className={model.advisoryRows.length ? "positive" : "neutral"}><small>Persisted sizing advisories</small><strong>{model.advisoryRows.length}/{model.scoped.length}</strong><span>Latest runs with suggested min/max</span></article>
        <article className="warning"><small>Formal sizing engine</small><strong>PARTIAL</strong><span>No dedicated portfolio-wide sizing assessment yet</span></article>
      </div>

      <div className="dps-grid">
        <section className="dps-panel">
          <div className="dps-subheading"><div><span>Configured sizing</span><strong>{model.configuredRows.length ? `${model.configuredRows.length} configured holding${model.configuredRows.length === 1 ? "" : "s"}` : "No sizing settings yet"}</strong></div><Link to="/app/structure">Manage structure →</Link></div>
          {model.configuredRows.length ? <div className="dps-table">
            <div className="dps-row dps-header"><span>Holding</span><span>Current</span><span>Target</span><span>Range</span><span>Status</span></div>
            {model.configuredRows.map(({ position, current, target, minimum, maximum, label, tone, gap }) => <div className="dps-row" key={position.securityId}>
              <span><Link to={`/app/research/${position.securityId}`}>{position.symbol}</Link><small>{position.company}</small></span>
              <span><strong>{pct(current)}</strong><small>portfolio weight</small></span>
              <span><strong>{pct(target)}</strong><small>{gap === null ? "Not comparable" : `${gap.gte(0) ? "+" : ""}${gap.toDecimalPlaces(2).toFixed(2)} pp vs target`}</small></span>
              <span><strong>{minimum === null && maximum === null ? "—" : `${pct(minimum)} – ${pct(maximum)}`}</strong><small>User range</small></span>
              <span className={`tone-${tone}`}><strong>{label}</strong><small>{position.settings.isFrozen ? "User freeze enabled" : "From stored sizing settings"}</small></span>
            </div>)}
          </div> : <div className="dps-empty">No target, minimum, maximum or freeze setting is stored for holdings in this scope yet.</div>}
        </section>

        <section className="dps-panel">
          <div className="dps-subheading"><div><span>Persisted sizing advisories</span><strong>{model.advisoryRows.length ? `${model.advisoryRows.length} covered holding${model.advisoryRows.length === 1 ? "" : "s"}` : "No covered holdings"}</strong></div><Link to="/app/research">Research →</Link></div>
          {model.advisoryRows.length ? <div className="dps-advisories">{model.advisoryRows.map(({ row, position }) => {
            const current = d(row.current_weight)
            const min = d(row.suggested_weight_min)
            const max = d(row.suggested_weight_max)
            const ready = d(row.score_ready_coverage)
            const tone = toneForBias(row.action_bias)
            return <article key={row.security_id} className={`tone-${tone}`}>
              <div><Link to={`/app/research/${row.security_id}`}>{position!.symbol}</Link><span>{position!.company}</span></div>
              <div><strong>{pretty(row.action_bias)}</strong><span>{pretty(row.suggested_role)} · persisted advisory</span></div>
              <div><strong>{pct(current)}</strong><span>captured current weight</span></div>
              <div><strong>{`${pct(min)} – ${pct(max)}`}</strong><span>suggested range</span></div>
              <div><strong>{ready ? `${ready.times(100).toDecimalPlaces(0).toFixed(0)}% ready` : "Readiness —"}</strong><span>{ageLabel(row.created_at)}</span></div>
            </article>
          })}</div> : <div className="dps-empty">No persisted recommendation run in this scope currently carries a suggested sizing range.</div>}
          <div className="dps-engine-note"><strong>Why coverage is still partial</strong><p>The blueprint requires sizing to consider conviction, role, business quality, growth durability, permanent-loss risk, valuation, volatility, concentration, liquidity and portfolio fit. PortfolioAI currently stores user targets/ranges and a suggested range on limited recommendation evidence, but it does not yet persist a dedicated portfolio-wide position-sizing assessment for every holding.</p></div>
        </section>
      </div>
      <p className="dps-method">Sizing is not an exit signal. A holding can be above target because of concentration or valuation while its investment thesis remains intact. Formal actions such as ADD, HOLD, REDUCE, TRIM, FREEZE or EXIT REVIEW should come from a deterministic sizing engine with sufficient evidence.</p>
    </> : null}
  </section>
}
