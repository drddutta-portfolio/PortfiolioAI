import Decimal from "decimal.js"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { PortfolioPosition } from "../features/portfolio/types"
import { formatMoney } from "../features/portfolio/format"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { supabase } from "../lib/supabase"
import "./DashboardDecisionLayer.css"

type Tone = "critical" | "warning" | "positive" | "neutral"
type RecommendationRow = { security_id: string; suggested_role: string | null; action_bias: string | null; change_signal: string | null; transition_status: string | null; created_at: string }
type SettingRow = { security_id: string; target_price: number | string | null; stop_loss_price: number | string | null; target_price_alert_enabled: boolean | null; stop_loss_alert_enabled: boolean | null }
type ActionItem = { id: string; securityId: string; symbol: string; company: string; label: string; detail: string; tone: Tone; priority: number }
type ThemeRow = { id: string; name: string; exposure: Decimal; currentValue: Decimal; coveredCost: Decimal; coveredPnl: Decimal; coveredCount: number; holdingCount: number; best: PortfolioPosition | null; maxAllocation: string | null }

const db = supabase as unknown as SupabaseClient

function d(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null
  try { return new Decimal(value) } catch { return null }
}
function pct(value: Decimal | null, digits = 1) { return value === null ? "—" : `${value.toDecimalPlaces(digits).toFixed(digits)}%` }
function pretty(value: string | null | undefined) { return value ? value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Pending" }
function recommendationTone(value: string | null): Tone {
  const v = (value ?? "").toUpperCase()
  if (v.includes("EXIT") || v.includes("REDUCE") || v.includes("AVOID")) return "critical"
  if (v.includes("ADD") || v.includes("ACCUMULATE") || v.includes("BUY")) return "positive"
  return "neutral"
}

function themes(positions: readonly PortfolioPosition[]): readonly ThemeRow[] {
  const pricedTotal = positions.reduce((sum, p) => sum.plus(p.currentValue ?? "0"), new Decimal(0))
  const map = new Map<string, Omit<ThemeRow, "exposure">>()
  positions.forEach((position) => position.themes.filter((theme) => theme.isActive).forEach((theme) => {
    const row = map.get(theme.id) ?? { id: theme.id, name: theme.name, currentValue: new Decimal(0), coveredCost: new Decimal(0), coveredPnl: new Decimal(0), coveredCount: 0, holdingCount: 0, best: null, maxAllocation: theme.maxAllocation }
    row.holdingCount += 1
    if (position.currentValue !== null) row.currentValue = row.currentValue.plus(position.currentValue)
    if (position.investedAmount !== null && position.unrealisedPnl !== null) {
      row.coveredCost = row.coveredCost.plus(position.investedAmount)
      row.coveredPnl = row.coveredPnl.plus(position.unrealisedPnl)
      row.coveredCount += 1
    }
    if (position.unrealisedPnl !== null && (!row.best || new Decimal(position.unrealisedPnl).gt(row.best.unrealisedPnl ?? "0"))) row.best = position
    map.set(theme.id, row)
  }))
  return [...map.values()].map((row) => ({ ...row, exposure: pricedTotal.isZero() ? new Decimal(0) : row.currentValue.div(pricedTotal).times(100) })).sort((a, b) => b.currentValue.comparedTo(a.currentValue))
}

function localActions(positions: readonly PortfolioPosition[], settings: ReadonlyMap<string, SettingRow>) {
  const actions: ActionItem[] = []
  positions.forEach((position) => {
    const current = d(position.currentPrice)
    const setting = settings.get(position.securityId)
    const target = d(setting?.target_price)
    const stop = d(setting?.stop_loss_price)
    if (current && target && setting?.target_price_alert_enabled !== false && current.gte(target)) actions.push({ id: `${position.securityId}:target`, securityId: position.securityId, symbol: position.symbol, company: position.company, label: "Target price reached", detail: `${formatMoney(position.currentPrice)} ≥ configured target ${formatMoney(target.toFixed())}`, tone: "positive", priority: 90 })
    if (current && stop && setting?.stop_loss_alert_enabled !== false && current.lte(stop)) actions.push({ id: `${position.securityId}:stop`, securityId: position.securityId, symbol: position.symbol, company: position.company, label: "Stop-loss level reached", detail: `${formatMoney(position.currentPrice)} ≤ configured stop ${formatMoney(stop.toFixed())}`, tone: "critical", priority: 100 })
    const weight = d(position.portfolioWeightPercent); const min = d(position.settings.minimumWeight); const max = d(position.settings.maximumWeight)
    if (weight && max && weight.gt(max)) actions.push({ id: `${position.securityId}:max`, securityId: position.securityId, symbol: position.symbol, company: position.company, label: "Above configured sizing range", detail: `${pct(weight, 2)} portfolio weight vs ${pct(max, 2)} maximum`, tone: "warning", priority: 70 })
    else if (weight && min && weight.lt(min)) actions.push({ id: `${position.securityId}:min`, securityId: position.securityId, symbol: position.symbol, company: position.company, label: "Below configured sizing range", detail: `${pct(weight, 2)} portfolio weight vs ${pct(min, 2)} minimum`, tone: "neutral", priority: 35 })
    if (position.isPriceStale) actions.push({ id: `${position.securityId}:stale`, securityId: position.securityId, symbol: position.symbol, company: position.company, label: "Price evidence is stale", detail: "Refresh market data before relying on current-value decisions.", tone: "warning", priority: 55 })
  })
  return actions
}

export function DashboardDecisionLayer() {
  const { portfolio, isLoading, error } = usePortfolioView()
  const [recommendations, setRecommendations] = useState<ReadonlyMap<string, RecommendationRow>>(new Map())
  const [settings, setSettings] = useState<ReadonlyMap<string, SettingRow>>(new Map())
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!portfolio?.portfolio.id || !portfolio.openPositions.length) return
    let cancelled = false
    const portfolioId = portfolio.portfolio.id
    const securityIds = portfolio.openPositions.map((position) => position.securityId)
    async function load() {
      const [recs, settingRows] = await Promise.all([
        db.from("stock_recommendation_runs").select("security_id,suggested_role,action_bias,change_signal,transition_status,created_at").eq("portfolio_id", portfolioId).in("security_id", securityIds).order("created_at", { ascending: false }),
        db.from("portfolio_security_settings").select("security_id,target_price,stop_loss_price,target_price_alert_enabled,stop_loss_alert_enabled").eq("portfolio_id", portfolioId).in("security_id", securityIds),
      ])
      if (cancelled) return
      if (recs.error || settingRows.error) { setLoadError(recs.error?.message ?? settingRows.error?.message ?? "Decision evidence could not be loaded."); return }
      const latest = new Map<string, RecommendationRow>()
      ;((recs.data ?? []) as RecommendationRow[]).forEach((row) => { if (!latest.has(row.security_id)) latest.set(row.security_id, row) })
      const settingMap = new Map<string, SettingRow>()
      ;((settingRows.data ?? []) as SettingRow[]).forEach((row) => settingMap.set(row.security_id, row))
      setRecommendations(latest); setSettings(settingMap); setLoadError(null)
    }
    void load(); return () => { cancelled = true }
  }, [portfolio])

  const themeRows = useMemo(() => themes(portfolio?.openPositions ?? []), [portfolio])
  const actions = useMemo(() => {
    if (!portfolio) return []
    const result = localActions(portfolio.openPositions, settings)
    portfolio.openPositions.forEach((position) => {
      const rec = recommendations.get(position.securityId)
      const bias = rec?.action_bias?.toUpperCase() ?? ""
      if (!rec?.action_bias || ["HOLD", "NEUTRAL", "PENDING"].includes(bias)) return
      const tone = recommendationTone(rec.action_bias)
      result.push({ id: `${position.securityId}:advisory`, securityId: position.securityId, symbol: position.symbol, company: position.company, label: `${pretty(rec.action_bias)} · persisted advisory`, detail: `${pretty(rec.suggested_role)} · ${pretty(rec.transition_status)}${rec.change_signal ? ` · ${pretty(rec.change_signal)}` : ""}`, tone, priority: tone === "critical" ? 85 : 60 })
    })
    return result.sort((a, b) => b.priority - a.priority || a.symbol.localeCompare(b.symbol)).slice(0, 12)
  }, [portfolio, recommendations, settings])

  if (isLoading || error || !portfolio) return null
  return <section className="dashboard-next-layer" aria-label="Dashboard decision layer">
    <div className="dashboard-next-heading"><div><p className="eyebrow">Decision layer</p><h2>Theme snapshot & action center</h2><p>Read-only signals from evidence already stored in PortfolioAI. Nothing here changes a holding, role, recommendation or transaction.</p></div><span>Consolidated portfolio</span></div>
    {loadError ? <div className="dashboard-next-notice">Some persisted decision evidence could not be loaded: {loadError}</div> : null}
    <div className="dashboard-next-grid">
      <section className="dashboard-theme-snapshot">
        <div className="dashboard-next-section-title"><div><span>Theme snapshot</span><strong>{themeRows.length} active themes</strong></div><Link to="/app/structure">Portfolio structure →</Link></div>
        {themeRows.length ? <div className="dashboard-theme-table"><div className="dashboard-theme-row dashboard-theme-header"><span>Theme</span><span>Exposure</span><span>Covered return</span><span>Best contributor</span><span>Allocation cap</span></div>{themeRows.slice(0, 8).map((row) => {
          const themeReturn = row.coveredCount && !row.coveredCost.isZero() ? row.coveredPnl.div(row.coveredCost).times(100) : null
          const max = d(row.maxAllocation); const overCap = max !== null && row.exposure.gt(max)
          return <div className="dashboard-theme-row" key={row.id}><span><strong>{row.name}</strong><small>{row.holdingCount} holding{row.holdingCount === 1 ? "" : "s"}</small></span><span className={overCap ? "is-warning" : ""}><strong>{pct(row.exposure)}</strong><small>{formatMoney(row.currentValue.toFixed())}</small></span><span className={themeReturn?.gte(0) ? "is-positive" : themeReturn?.lt(0) ? "is-negative" : ""}><strong>{pct(themeReturn)}</strong><small>{row.coveredCount}/{row.holdingCount} covered</small></span><span>{row.best ? <><Link to={`/app/research/${row.best.securityId}`}>{row.best.symbol}</Link><small>{formatMoney(row.best.unrealisedPnl)}</small></> : <><strong>—</strong><small>Unavailable</small></>}</span><span className={overCap ? "is-warning" : ""}><strong>{max ? pct(max) : "Not set"}</strong><small>{overCap ? "Above configured cap" : "User setting"}</small></span></div>
        })}</div> : <div className="dashboard-next-empty">No active theme assignments are available yet.</div>}
      </section>
      <section className="dashboard-action-center">
        <div className="dashboard-next-section-title"><div><span>Action center</span><strong>{actions.length} surfaced signals</strong></div><Link to="/app/research">Research →</Link></div>
        {actions.length ? <div className="dashboard-action-list">{actions.map((item) => <article className={`dashboard-action-item ${item.tone}`} key={item.id}><i /><div><Link to={`/app/research/${item.securityId}`}>{item.symbol}</Link><small>{item.company}</small></div><div><strong>{item.label}</strong><p>{item.detail}</p></div></article>)}</div> : <div className="dashboard-next-empty"><strong>No immediate action signals.</strong><span>No target/stop trigger, sizing-range breach, stale-price warning, or non-hold persisted advisory is currently surfaced.</span></div>}
      </section>
    </div>
  </section>
}
