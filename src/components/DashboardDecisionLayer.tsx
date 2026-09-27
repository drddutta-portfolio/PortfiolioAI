import Decimal from "decimal.js"
import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useProgramCR10ActionCenter } from "../features/decision/useProgramCR10ActionCenter"
import { formatMoney } from "../features/portfolio/format"
import type { PortfolioPosition, PortfolioRole } from "../features/portfolio/types"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import "./DashboardDecisionLayer.css"

type ThemeRow = { id: string; name: string; exposure: Decimal; currentValue: Decimal; coveredCost: Decimal; coveredPnl: Decimal; coveredCount: number; holdingCount: number; best: PortfolioPosition | null; maxAllocation: string | null }
type RoleRow = { role: PortfolioRole; label: string; exposure: Decimal; currentValue: Decimal; coveredCost: Decimal; coveredPnl: Decimal; coveredCount: number; holdingCount: number; largest: PortfolioPosition | null; targetCount: number }

const ROLE_ORDER: readonly PortfolioRole[] = ["CORE", "SATELLITE", "THEMATIC", "ETF", "OTHER", "UNCLASSIFIED"]

function d(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null
  try { return new Decimal(value) } catch { return null }
}
function pct(value: Decimal | null, digits = 1) { return value === null ? "—" : `${value.toDecimalPlaces(digits).toFixed(digits)}%` }
function pretty(value: string | null | undefined) { return value ? value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Pending" }
function roleLabel(role: PortfolioRole) { return role === "UNCLASSIFIED" ? "Unclassified" : pretty(role) }
function roles(positions: readonly PortfolioPosition[]): readonly RoleRow[] {
  const pricedTotal = positions.reduce((sum, position) => sum.plus(position.currentValue ?? "0"), new Decimal(0))
  return ROLE_ORDER.map((role) => {
    const members = positions.filter((position) => position.role === role)
    const currentValue = members.reduce((sum, position) => sum.plus(position.currentValue ?? "0"), new Decimal(0))
    let coveredCost = new Decimal(0); let coveredPnl = new Decimal(0); let coveredCount = 0
    members.forEach((position) => {
      if (position.investedAmount !== null && position.unrealisedPnl !== null) {
        coveredCost = coveredCost.plus(position.investedAmount); coveredPnl = coveredPnl.plus(position.unrealisedPnl); coveredCount += 1
      }
    })
    const largest = [...members].filter((position) => position.currentValue !== null).sort((a, b) => new Decimal(b.currentValue ?? 0).comparedTo(a.currentValue ?? 0))[0] ?? null
    return {
      role, label: roleLabel(role), currentValue, coveredCost, coveredPnl, coveredCount, holdingCount: members.length, largest,
      targetCount: members.filter((position) => position.settings.targetWeight !== null).length,
      exposure: pricedTotal.isZero() ? new Decimal(0) : currentValue.div(pricedTotal).times(100),
    }
  }).filter((row) => row.holdingCount > 0)
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

export function DashboardDecisionLayer() {
  const { portfolio, isLoading, error } = usePortfolioView()
  const actionCenter = useProgramCR10ActionCenter(portfolio)
  const loadError = actionCenter.error

  const roleRows = useMemo(() => roles(portfolio?.openPositions ?? []), [portfolio])
  const themeRows = useMemo(() => themes(portfolio?.openPositions ?? []), [portfolio])
  const actions = actionCenter.data?.view.slice(0, 12) ?? []

  if (isLoading || error || !portfolio) return null
  return <section className="dashboard-next-layer" aria-label="Dashboard decision layer">
    <div className="dashboard-next-heading"><div><p className="eyebrow">Decision attention</p><h2>Portfolio structure & Action Center</h2><p>Roles and themes remain descriptive portfolio structure. Action Center attention is read-only and derived from current decision state plus your owner context.</p></div><span>Consolidated portfolio</span></div>
    {loadError ? <div className="dashboard-next-notice">Some cached owner/research context required by the canonical R10 projection could not be loaded: {loadError}</div> : null}
    <div className="dashboard-next-grid">
      <div className="dashboard-structure-stack">
        <section className="dashboard-role-snapshot">
          <div className="dashboard-next-section-title"><div><span>Portfolio role snapshot</span><strong>{roleRows.length} active roles · {portfolio.openPositions.length} holdings</strong></div><Link to="/app/structure">Portfolio structure →</Link></div>
          <div className="dashboard-role-table">
            <div className="dashboard-role-row dashboard-theme-header"><span>Role</span><span>Exposure</span><span>Covered return</span><span>Largest holding</span><span>Sizing targets</span></div>
            {roleRows.map((row) => {
              const roleReturn = row.coveredCount && !row.coveredCost.isZero() ? row.coveredPnl.div(row.coveredCost).times(100) : null
              return <div className="dashboard-role-row" key={row.role}><span><strong>{row.label}</strong><small>{row.holdingCount} holding{row.holdingCount === 1 ? "" : "s"}</small></span><span><strong>{pct(row.exposure)}</strong><small>{formatMoney(row.currentValue.toFixed())}</small></span><span className={roleReturn?.gte(0) ? "is-positive" : roleReturn?.lt(0) ? "is-negative" : ""}><strong>{pct(roleReturn)}</strong><small>{row.coveredCount}/{row.holdingCount} covered</small></span><span>{row.largest ? <><Link to={`/app/research/${row.largest.securityId}`}>{row.largest.symbol}</Link><small>{formatMoney(row.largest.currentValue)}</small></> : <><strong>—</strong><small>Unpriced</small></>}</span><span><strong>{row.targetCount}/{row.holdingCount}</strong><small>User target weights</small></span></div>
            })}
          </div>
        </section>

        <section className="dashboard-theme-snapshot">
          <div className="dashboard-next-section-title"><div><span>Theme snapshot</span><strong>{themeRows.length} active themes</strong></div><span className="dashboard-overlap-note">Themes may overlap</span></div>
          {themeRows.length ? <div className="dashboard-theme-table"><div className="dashboard-theme-row dashboard-theme-header"><span>Theme</span><span>Exposure</span><span>Covered return</span><span>Best contributor</span><span>Allocation cap</span></div>{themeRows.slice(0, 8).map((row) => {
            const themeReturn = row.coveredCount && !row.coveredCost.isZero() ? row.coveredPnl.div(row.coveredCost).times(100) : null
            const max = d(row.maxAllocation); const overCap = max !== null && row.exposure.gt(max)
            return <div className="dashboard-theme-row" key={row.id}><span><strong>{row.name}</strong><small>{row.holdingCount} holding{row.holdingCount === 1 ? "" : "s"}</small></span><span className={overCap ? "is-warning" : ""}><strong>{pct(row.exposure)}</strong><small>{formatMoney(row.currentValue.toFixed())}</small></span><span className={themeReturn?.gte(0) ? "is-positive" : themeReturn?.lt(0) ? "is-negative" : ""}><strong>{pct(themeReturn)}</strong><small>{row.coveredCount}/{row.holdingCount} covered</small></span><span>{row.best ? <><Link to={`/app/research/${row.best.securityId}`}>{row.best.symbol}</Link><small>{formatMoney(row.best.unrealisedPnl)}</small></> : <><strong>—</strong><small>Unavailable</small></>}</span><span className={overCap ? "is-warning" : ""}><strong>{max ? pct(max) : "Not set"}</strong><small>{overCap ? "Above configured cap" : "User setting"}</small></span></div>
          })}</div> : <div className="dashboard-next-empty">No active theme assignments are available yet.</div>}
        </section>
      </div>

      <section className="dashboard-action-center">
        <div className="dashboard-next-section-title"><div><span>Action Center</span><strong>{actionCenter.data?.view.length ?? 0} portfolio dispositions</strong></div><Link to="/app/research">Research →</Link></div>
        {actionCenter.isLoading ? <div className="dashboard-next-empty"><strong>Building current decision view…</strong><span>No provider refresh or persistence is triggered.</span></div> : actions.length ? <div className="dashboard-action-list">{actions.map((item) => <article className={`dashboard-action-item ${item.tone}`} key={item.id}><i /><div><Link to={`/app/research/${item.securityId}`}>{item.symbol}</Link><small>{item.company}</small></div><div><strong>{item.stateLabel}</strong><p>{item.primaryReason}{item.conflictLabels.length ? ` · ${item.conflictLabels.join(" · ")}` : ""}</p></div></article>)}</div> : <div className="dashboard-next-empty"><strong>No current Action Center dispositions available.</strong><span>Missing prerequisites stay unavailable rather than being replaced by guesses.</span></div>}
      </section>
    </div>
  </section>
}
