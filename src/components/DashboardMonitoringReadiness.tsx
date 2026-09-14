import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useDashboardMonitoringSettings, useDashboardRecommendations } from "../features/dashboard/useDashboardEvidence"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { useResearchCoverage } from "../features/research/useResearchCoverage"
import "./DashboardMonitoringReadiness.css"

type GapItem = { securityId: string; symbol: string; company: string; issues: readonly string[]; priority: number; weight: number }

function percent(count: number, total: number) {
  if (!total) return "0%"
  const raw = (count / total) * 100
  return `${raw < 1 && raw > 0 ? raw.toFixed(1) : Math.round(raw)}%`
}

function barWidth(count: number, total: number) {
  return total ? Math.max(count > 0 ? 1.5 : 0, (count / total) * 100) : 0
}

export function DashboardMonitoringReadiness() {
  const { portfolio, isLoading, error } = usePortfolioView()
  const positions = useMemo(() => portfolio?.openPositions ?? [], [portfolio])
  const securityIds = useMemo(() => positions.map((position) => position.securityId), [positions])
  const research = useResearchCoverage(positions)
  const monitoringSettings = useDashboardMonitoringSettings(portfolio?.portfolio.id ?? null, securityIds)
  const recommendations = useDashboardRecommendations(portfolio?.portfolio.id ?? null, securityIds)

  const researchById = useMemo(() => new Map(research.data.map((row) => [row.securityId, row])), [research.data])

  const model = useMemo(() => {
    const total = positions.length
    const roleAssigned = positions.filter((position) => position.role !== "UNCLASSIFIED").length
    const targetWeight = positions.filter((position) => position.settings.targetWeight !== null).length
    const sizingRange = positions.filter((position) => position.settings.minimumWeight !== null && position.settings.maximumWeight !== null).length
    const watchlisted = positions.filter((position) => position.settings.isWatchlisted).length
    const frozen = positions.filter((position) => position.settings.isFrozen).length
    const freshPrice = positions.filter((position) => position.currentValue !== null && !position.isPriceStale).length
    const researchEvidence = positions.filter((position) => Boolean(researchById.get(position.securityId)?.latestEvidenceAt)).length
    const advisoryCoverage = positions.filter((position) => recommendations.data.has(position.securityId)).length
    const priceAlerts = positions.filter((position) => {
      const row = monitoringSettings.data.get(position.securityId)
      if (!row) return false
      const targetEnabled = row.targetPrice !== null && row.targetPriceAlertEnabled !== false
      const stopEnabled = row.stopLossPrice !== null && row.stopLossAlertEnabled !== false
      return targetEnabled || stopEnabled
    }).length

    const coverageRows = [
      { label: "Portfolio role assigned", count: roleAssigned, detail: "Core / Satellite / Thematic / ETF / Other" },
      { label: "Target weight configured", count: targetWeight, detail: "User target allocation is stored" },
      { label: "Sizing range configured", count: sizingRange, detail: "Both minimum and maximum weights are stored" },
      { label: "Price monitoring configured", count: priceAlerts, detail: "Target-price or stop-loss alert is enabled" },
      { label: "Fresh market evidence", count: freshPrice, detail: "Current value is available and not stale" },
      { label: "Stored research evidence", count: researchEvidence, detail: "At least one research evidence timestamp exists" },
      { label: "Persisted advisory", count: advisoryCoverage, detail: "At least one recommendation run exists" },
    ]

    const gaps: GapItem[] = positions.map((position) => {
      const issues: string[] = []
      let priority = 0
      if (position.currentValue === null) { issues.push("No current price"); priority += 45 }
      else if (position.isPriceStale) { issues.push("Market price stale"); priority += 30 }
      const coverage = researchById.get(position.securityId)
      if (!coverage?.latestEvidenceAt) { issues.push("No stored research evidence"); priority += 25 }
      if (position.role === "UNCLASSIFIED") { issues.push("Role not assigned"); priority += 20 }
      if (position.settings.targetWeight === null) { issues.push("Target weight not set"); priority += 12 }
      if (position.settings.minimumWeight === null || position.settings.maximumWeight === null) { issues.push("Sizing range incomplete"); priority += 10 }
      const alerts = monitoringSettings.data.get(position.securityId)
      const hasPriceAlert = Boolean(alerts && ((alerts.targetPrice !== null && alerts.targetPriceAlertEnabled !== false) || (alerts.stopLossPrice !== null && alerts.stopLossAlertEnabled !== false)))
      if (!hasPriceAlert) { issues.push("No target/stop monitoring"); priority += 8 }
      if (!recommendations.data.has(position.securityId)) { issues.push("No persisted advisory"); priority += 4 }
      const weight = Number(position.portfolioWeightPercent ?? 0)
      priority += Math.min(15, Math.max(0, weight))
      return { securityId: position.securityId, symbol: position.symbol, company: position.company, issues, priority, weight }
    }).filter((item) => item.issues.length > 0)
      .sort((a, b) => b.priority - a.priority || b.weight - a.weight || a.symbol.localeCompare(b.symbol))
      .slice(0, 12)

    return { total, roleAssigned, targetWeight, sizingRange, priceAlerts, freshPrice, researchEvidence, advisoryCoverage, watchlisted, frozen, coverageRows, gaps }
  }, [positions, researchById, recommendations.data, monitoringSettings.data])

  if (isLoading || error || !portfolio) return null

  const loadError = monitoringSettings.error ?? recommendations.error ?? research.error

  return <section className="dashboard-monitoring" aria-label="Monitoring and configuration readiness">
    <div className="dashboard-monitoring-heading">
      <div>
        <p className="eyebrow">Monitoring & configuration coverage</p>
        <h2>How ready is the portfolio for continuous monitoring?</h2>
        <p>Read-only readiness view of portfolio settings, price freshness, stored research and persisted advisory coverage. No alert or recommendation is generated here.</p>
      </div>
      <Link to="/app/structure">Open portfolio structure →</Link>
    </div>

    {loadError ? <div className="dashboard-monitoring-notice">Some readiness evidence could not be loaded: {loadError}</div> : null}

    <div className="dashboard-monitoring-summary">
      <article><span>Roles assigned</span><strong>{percent(model.roleAssigned, model.total)}</strong><small>{model.roleAssigned} of {model.total} current holdings</small></article>
      <article><span>Sizing ranges</span><strong>{percent(model.sizingRange, model.total)}</strong><small>{model.sizingRange} holdings have both min and max weights</small></article>
      <article><span>Price monitoring</span><strong>{percent(model.priceAlerts, model.total)}</strong><small>{model.priceAlerts} holdings have a target or stop alert configured</small></article>
      <article className={model.freshPrice < model.total ? "warning" : ""}><span>Fresh market evidence</span><strong>{percent(model.freshPrice, model.total)}</strong><small>{model.freshPrice} holdings have non-stale current-value evidence</small></article>
      <article className={model.researchEvidence < model.total ? "warning" : ""}><span>Research evidence</span><strong>{research.isLoading ? "…" : percent(model.researchEvidence, model.total)}</strong><small>{model.researchEvidence} holdings have stored research evidence</small></article>
    </div>

    <div className="dashboard-monitoring-grid">
      <section className="dashboard-monitoring-coverage">
        <div className="dashboard-monitoring-subheading"><div><span>Readiness matrix</span><strong>Portfolio monitoring coverage</strong></div><small>{model.watchlisted} watchlisted · {model.frozen} frozen</small></div>
        <div className="dashboard-monitoring-bars">{model.coverageRows.map((row) => <article key={row.label}>
          <div><span>{row.label}</span><strong>{percent(row.count, model.total)}</strong></div>
          <div className="dashboard-monitoring-track"><i style={{ width: `${barWidth(row.count, model.total)}%` }} /></div>
          <small>{row.count}/{model.total} · {row.detail}</small>
        </article>)}</div>
        <p className="dashboard-monitoring-footnote">These percentages measure configuration/evidence availability only. They are not investment scores and do not imply that every holding should use every optional setting.</p>
      </section>

      <section className="dashboard-monitoring-gaps">
        <div className="dashboard-monitoring-subheading"><div><span>Monitoring setup gaps</span><strong>{model.gaps.length ? `${model.gaps.length} highest-priority holdings` : "No setup gaps surfaced"}</strong></div><Link to="/app/holdings">Holdings →</Link></div>
        {model.gaps.length ? <div className="dashboard-monitoring-gap-list">{model.gaps.map((item) => <article key={item.securityId}>
          <i />
          <div><Link to={`/app/research/${item.securityId}`}>{item.symbol}</Link><small>{item.company}</small></div>
          <div><strong>{item.issues[0]}</strong><p>{item.issues.slice(1, 4).join(" · ") || "Single monitoring gap"}{item.issues.length > 4 ? ` · +${item.issues.length - 4} more` : ""}</p></div>
          <div><b>{item.weight ? `${item.weight.toFixed(2)}%` : "—"}</b><small>portfolio weight</small></div>
        </article>)}</div> : <div className="dashboard-monitoring-empty">The current portfolio has no surfaced monitoring-configuration gaps.</div>}
      </section>
    </div>
  </section>
}
