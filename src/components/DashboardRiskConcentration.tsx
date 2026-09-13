import Decimal from "decimal.js"
import { useMemo } from "react"
import { Link } from "react-router-dom"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { useResearchCoverage } from "../features/research/useResearchCoverage"
import type { PortfolioPosition } from "../features/portfolio/types"
import "./DashboardRiskConcentration.css"

type RiskTone = "critical" | "warning" | "neutral"
type RiskItem = { position: PortfolioPosition; flags: readonly string[]; priority: number; tone: RiskTone }

function d(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null
  try { return new Decimal(value) } catch { return null }
}
function pct(value: Decimal | number | null, digits = 1) {
  if (value === null) return "—"
  const decimal = value instanceof Decimal ? value : new Decimal(value)
  return `${decimal.toDecimalPlaces(digits).toFixed(digits)}%`
}
function money(value: Decimal | null) {
  if (!value) return "—"
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value.toFixed(0)))
}

export function DashboardRiskConcentration() {
  const { portfolio, isLoading, error } = usePortfolioView()
  const positions = portfolio?.openPositions ?? []
  const coverage = useResearchCoverage(positions)

  const model = useMemo(() => {
    const priced = positions.filter((position) => position.currentValue !== null)
    const total = priced.reduce((sum, position) => sum.plus(position.currentValue ?? "0"), new Decimal(0))
    const sorted = [...priced].sort((a, b) => new Decimal(b.currentValue ?? 0).comparedTo(a.currentValue ?? 0))
    const weightOf = (position: PortfolioPosition) => total.isZero() || position.currentValue === null ? new Decimal(0) : new Decimal(position.currentValue).div(total).times(100)
    const largest = sorted[0] ?? null
    const top5Value = sorted.slice(0, 5).reduce((sum, position) => sum.plus(position.currentValue ?? "0"), new Decimal(0))
    const top5 = total.isZero() ? new Decimal(0) : top5Value.div(total).times(100)

    const sectors = new Map<string, Decimal>()
    priced.forEach((position) => sectors.set(position.sector ?? "Sector unavailable", (sectors.get(position.sector ?? "Sector unavailable") ?? new Decimal(0)).plus(position.currentValue ?? "0")))
    const sectorRows = [...sectors.entries()].map(([name, value]) => ({ name, value, weight: total.isZero() ? new Decimal(0) : value.div(total).times(100) })).sort((a, b) => b.value.comparedTo(a.value))
    const largestSector = sectorRows[0] ?? null

    const staleValue = priced.filter((position) => position.isPriceStale).reduce((sum, position) => sum.plus(position.currentValue ?? "0"), new Decimal(0))
    const staleExposure = total.isZero() ? new Decimal(0) : staleValue.div(total).times(100)
    const unclassifiedValue = priced.filter((position) => position.role === "UNCLASSIFIED").reduce((sum, position) => sum.plus(position.currentValue ?? "0"), new Decimal(0))
    const unclassifiedExposure = total.isZero() ? new Decimal(0) : unclassifiedValue.div(total).times(100)

    const researchById = new Map(coverage.data.map((row) => [row.securityId, row]))
    const researchRiskValue = priced.filter((position) => {
      const row = researchById.get(position.securityId)
      return row && !["FRESH", "NOT_APPLICABLE"].includes(row.overall)
    }).reduce((sum, position) => sum.plus(position.currentValue ?? "0"), new Decimal(0))
    const researchRiskExposure = total.isZero() ? new Decimal(0) : researchRiskValue.div(total).times(100)

    const items: RiskItem[] = positions.map((position) => {
      const flags: string[] = []
      let priority = 0
      let tone: RiskTone = "neutral"
      const weight = d(position.portfolioWeightPercent)
      const maximum = d(position.settings.maximumWeight)
      if (weight && maximum && weight.gt(maximum)) { flags.push(`Above max weight ${pct(maximum)}`); priority += 35; tone = "critical" }
      if (position.isPriceStale) { flags.push("Stale market price"); priority += 20; if (tone !== "critical") tone = "warning" }
      if (position.currentValue === null) { flags.push("Unpriced holding"); priority += 25; if (tone !== "critical") tone = "warning" }
      if (position.role === "UNCLASSIFIED") { flags.push("Role unclassified"); priority += 10 }
      const research = researchById.get(position.securityId)
      if (research?.overall === "CONFLICTING" || research?.overall === "REVIEW_REQUIRED") { flags.push("Research needs review"); priority += 30; tone = "critical" }
      else if (research?.overall === "MISSING") { flags.push("Research evidence missing"); priority += 18; if (tone !== "critical") tone = "warning" }
      else if (research?.overall === "STALE") { flags.push("Research evidence stale"); priority += 12; if (tone === "neutral") tone = "warning" }
      if (weight && weight.gte(5)) { flags.push(`${pct(weight)} portfolio weight`); priority += Number(weight.toFixed(0)); }
      return { position, flags, priority, tone }
    }).filter((item) => item.flags.length > 0).sort((a, b) => b.priority - a.priority || a.position.symbol.localeCompare(b.position.symbol)).slice(0, 12)

    return { total, largest, largestWeight: largest ? weightOf(largest) : null, top5, largestSector, staleExposure, unclassifiedExposure, researchRiskExposure, sectorRows: sectorRows.slice(0, 6), items }
  }, [coverage.data, positions])

  if (isLoading || error || !portfolio) return null

  return <section className="dashboard-risk" aria-label="Portfolio risk and concentration">
    <div className="dashboard-risk-heading"><div><p className="eyebrow">Portfolio risk & concentration</p><h2>Where is portfolio risk concentrated?</h2><p>Read-only concentration and evidence-risk view using current portfolio weights, user sizing limits, market-data freshness and stored research coverage.</p></div><Link to="/app/holdings">Open holdings →</Link></div>

    {coverage.error ? <div className="dashboard-risk-notice">Research-risk exposure could not be fully assessed: {coverage.error}</div> : null}

    <div className="dashboard-risk-summary">
      <article><span>Largest holding</span><strong>{model.largest?.symbol ?? "—"}</strong><small>{model.largestWeight ? `${pct(model.largestWeight)} of priced portfolio` : "No priced holdings"}</small></article>
      <article><span>Top 5 concentration</span><strong>{pct(model.top5)}</strong><small>Share of priced portfolio held in the five largest positions</small></article>
      <article><span>Largest sector</span><strong>{model.largestSector?.name ?? "—"}</strong><small>{model.largestSector ? `${pct(model.largestSector.weight)} · ${money(model.largestSector.value)}` : "Sector data unavailable"}</small></article>
      <article className={model.staleExposure.gt(0) ? "warning" : ""}><span>Stale-price exposure</span><strong>{pct(model.staleExposure)}</strong><small>Priced capital relying on stale market evidence</small></article>
      <article className={model.researchRiskExposure.gte(25) ? "critical" : model.researchRiskExposure.gt(0) ? "warning" : ""}><span>Research-risk exposure</span><strong>{coverage.isLoading ? "…" : pct(model.researchRiskExposure)}</strong><small>Priced capital with non-fresh applicable research coverage</small></article>
    </div>

    <div className="dashboard-risk-grid">
      <section className="dashboard-risk-sectors">
        <div className="dashboard-risk-subheading"><div><span>Concentration map</span><strong>Largest sector exposures</strong></div><small>{pct(model.unclassifiedExposure)} in unclassified-role holdings</small></div>
        <div className="dashboard-risk-sector-list">{model.sectorRows.map((row) => <article key={row.name}><div><span>{row.name}</span><strong>{pct(row.weight)}</strong></div><div className="dashboard-risk-track"><i style={{ width: `${Math.min(100, Number(row.weight.toFixed(2)))}%` }} /></div><small>{money(row.value)}</small></article>)}</div>
      </section>

      <section className="dashboard-risk-queue">
        <div className="dashboard-risk-subheading"><div><span>Risk attention queue</span><strong>{model.items.length ? `${model.items.length} highest-priority holdings` : "No surfaced risk flags"}</strong></div><Link to="/app/research">Research →</Link></div>
        {model.items.length ? <div className="dashboard-risk-list">{model.items.map((item) => <article key={item.position.securityId} className={`tone-${item.tone}`}><i/><div><Link to={`/app/research/${item.position.securityId}`}>{item.position.symbol}</Link><small>{item.position.company}</small></div><div><strong>{item.flags[0]}</strong><p>{item.flags.slice(1).join(" · ") || "Single surfaced risk condition"}</p></div><div><b>{item.position.portfolioWeightPercent ? pct(d(item.position.portfolioWeightPercent), 2) : "—"}</b><small>portfolio weight</small></div></article>)}</div> : <div className="dashboard-risk-empty">No concentration, price-freshness, research-coverage or sizing-limit flags are currently surfaced.</div>}
      </section>
    </div>
  </section>
}
