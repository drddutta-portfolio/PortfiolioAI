import Decimal from "decimal.js"
import { useMemo } from "react"
import { Link } from "react-router-dom"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { useResearchCoverage } from "../features/research/useResearchCoverage"
import { buildProgramCR8LivePortfolioProjection } from "../features/decision/r8LivePortfolioAdapter"
import { useP5TerminalDispositions } from "../features/decision/useP5TerminalDispositions"
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
  const positions = useMemo(() => portfolio?.openPositions ?? [], [portfolio])
  const coverage = useResearchCoverage(positions)
  const p5 = useP5TerminalDispositions(portfolio?.portfolio.id ?? null)
  const r8Projection = useMemo(
    () => portfolio && !p5.isLoading
      ? buildProgramCR8LivePortfolioProjection(portfolio, coverage.data, p5.bySecurityId)
      : null,
    [coverage.data, p5.bySecurityId, p5.isLoading, portfolio],
  )

  const model = useMemo(() => {
    const priced = positions.filter((position) => position.currentValue !== null)
    const total = priced.reduce((sum, position) => sum.plus(position.currentValue ?? "0"), new Decimal(0))
    const sorted = [...priced].sort((a, b) => new Decimal(b.currentValue ?? 0).comparedTo(a.currentValue ?? 0))
    const weightOf = (position: PortfolioPosition) => total.isZero() || position.currentValue === null ? new Decimal(0) : new Decimal(position.currentValue).div(total).times(100)
    const largest = sorted[0] ?? null
    const top5Value = sorted.slice(0, 5).reduce((sum, position) => sum.plus(position.currentValue ?? "0"), new Decimal(0))
    const top5 = total.isZero() ? new Decimal(0) : top5Value.div(total).times(100)

    const knownSectorPositions = priced.filter((position) => Boolean(position.sector))
    const knownSectorValue = knownSectorPositions.reduce((sum, position) => sum.plus(position.currentValue ?? "0"), new Decimal(0))
    const sectorCoverage = total.isZero() ? new Decimal(0) : knownSectorValue.div(total).times(100)
    const unknownSectorExposure = total.isZero() ? new Decimal(0) : new Decimal(100).minus(sectorCoverage)
    const sectors = new Map<string, Decimal>()
    knownSectorPositions.forEach((position) => sectors.set(position.sector!, (sectors.get(position.sector!) ?? new Decimal(0)).plus(position.currentValue ?? "0")))
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

    const r8Rows = r8Projection?.rows ?? []
    const r8RiskEvaluated = r8Rows.filter(
      (row) => row.presentation.portfolioRisk.coverage === "EVALUATED",
    )
    const r8RiskInsufficient = r8Rows.filter(
      (row) => row.presentation.portfolioRisk.coverage === "INSUFFICIENT",
    )
    const r8FitReview = r8Rows.filter((row) => [
      "CONCENTRATION_REVIEW",
      "ROLE_COMPATIBILITY_REVIEW",
      "FIT_TENSION",
    ].includes(row.assessment.portfolioFit.state))

    const items: RiskItem[] = positions.map((position) => {
      const flags: string[] = []
      let priority = 0
      let tone: RiskTone = "neutral"
      const weight = d(position.portfolioWeightPercent)
      const maximum = d(position.settings.maximumWeight)
      const research = researchById.get(position.securityId)

      if (weight && maximum && weight.gt(maximum)) { flags.push(`Above max weight ${pct(maximum)}`); priority += 35; tone = "critical" }
      if (research?.overall === "CONFLICTING" || research?.overall === "REVIEW_REQUIRED") { flags.push("Research needs review"); priority += 30; tone = "critical" }
      else if (research?.overall === "MISSING") { flags.push("Research evidence missing"); priority += 18; if (tone !== "critical") tone = "warning" }
      else if (research?.overall === "STALE") { flags.push("Research evidence stale"); priority += 12; if (tone === "neutral") tone = "warning" }
      if (position.currentValue === null) { flags.push("Unpriced holding"); priority += 25; if (tone !== "critical") tone = "warning" }
      else if (position.isPriceStale) { flags.push("Market price is stale"); priority += 20; if (tone !== "critical") tone = "warning" }
      if (position.role === "UNCLASSIFIED") { flags.push("Role unclassified"); priority += 10 }
      if (weight && weight.gte(5)) { flags.push(`${pct(weight)} portfolio weight`); priority += Number(weight.toFixed(0)) }
      return { position, flags, priority, tone }
    }).filter((item) => item.flags.length > 0).sort((a, b) => b.priority - a.priority || a.position.symbol.localeCompare(b.position.symbol)).slice(0, 12)

    return {
      total,
      largest,
      largestWeight: largest ? weightOf(largest) : null,
      top5,
      largestSector,
      sectorCoverage,
      unknownSectorExposure,
      staleExposure,
      unclassifiedExposure,
      researchRiskExposure,
      sectorRows: sectorRows.slice(0, 6),
      items,
      r8Rows,
      r8RiskEvaluated,
      r8RiskInsufficient,
      r8FitReview,
    }
  }, [coverage.data, positions, r8Projection?.rows])

  if (isLoading || error || !portfolio) return null

  return <section className="dashboard-risk" aria-label="Portfolio risk and concentration">
    <div className="dashboard-risk-heading"><div><p className="eyebrow">Portfolio risk & concentration</p><h2>Where is portfolio risk concentrated?</h2><p>Read-only view separating descriptive concentration/data diagnostics from canonical on-demand R8 Portfolio Fit and Portfolio Risk states.</p></div><Link to="/app/holdings">Open holdings →</Link></div>

    {coverage.error ? <div className="dashboard-risk-notice">Research-risk exposure could not be fully assessed: {coverage.error}</div> : null}

    <div className="dashboard-risk-summary">
      <article><span>Largest holding</span><strong>{model.largest?.symbol ?? "—"}</strong><small>{model.largestWeight ? `${pct(model.largestWeight)} of priced portfolio` : "No priced holdings"}</small></article>
      <article><span>Top 5 concentration</span><strong>{pct(model.top5)}</strong><small>Share of priced portfolio held in the five largest positions</small></article>
      <article className={model.sectorCoverage.lt(80) ? "warning" : ""}><span>Sector classification coverage</span><strong>{pct(model.sectorCoverage)}</strong><small>{model.largestSector ? `Largest known sector: ${model.largestSector.name} at ${pct(model.largestSector.weight)}` : `${pct(model.unknownSectorExposure)} of priced capital lacks sector classification`}</small></article>
      <article className={model.staleExposure.gt(0) ? "warning" : ""}><span>Stale market-data exposure</span><strong>{pct(model.staleExposure)}</strong><small>Priced capital whose current-value evidence is stale</small></article>
      <article className={model.researchRiskExposure.gte(25) ? "critical" : model.researchRiskExposure.gt(0) ? "warning" : ""}><span>Research-evidence risk</span><strong>{coverage.isLoading ? "…" : pct(model.researchRiskExposure)}</strong><small>Priced capital with non-fresh applicable research coverage</small></article>
      <article className={model.r8FitReview.length ? "warning" : ""}><span>Canonical R8 Portfolio Fit review</span><strong>{model.r8FitReview.length}</strong><small>Owner-limit / owner-role-relative review states only; no machine target weight</small></article>
      <article className={model.r8RiskEvaluated.length ? "" : "warning"}><span>Canonical R8 Portfolio Risk evaluated</span><strong>{model.r8RiskEvaluated.length}/{model.r8Rows.length}</strong><small>{model.r8RiskInsufficient.length} insufficient due to absent canonical risk magnitude evidence</small></article>
    </div>

    <div className="dashboard-risk-grid">
      <section className="dashboard-risk-sectors">
        <div className="dashboard-risk-subheading"><div><span>Concentration map</span><strong>{model.sectorRows.length ? "Largest known sector exposures" : "Sector concentration unavailable"}</strong></div><small>{pct(model.unclassifiedExposure)} in unclassified-role holdings</small></div>
        {model.sectorRows.length ? <div className="dashboard-risk-sector-list">{model.sectorRows.map((row) => <article key={row.name}><div><span>{row.name}</span><strong>{pct(row.weight)}</strong></div><div className="dashboard-risk-track"><i style={{ width: `${Math.min(100, Number(row.weight.toFixed(2)))}%` }} /></div><small>{money(row.value)}</small></article>)}</div> : <div className="dashboard-risk-empty"><strong>Sector concentration cannot yet be measured reliably.</strong><span>{pct(model.unknownSectorExposure)} of priced portfolio value currently lacks sector classification. This is a classification-data gap, not a 100% sector concentration.</span></div>}
      </section>

      <section className="dashboard-risk-queue">
        <div className="dashboard-risk-subheading"><div><span>Descriptive data &amp; concentration queue</span><strong>{model.items.length ? `${model.items.length} highest-priority diagnostics` : "No surfaced diagnostics"}</strong></div><Link to="/app/research">Research →</Link></div>
        <div className="dashboard-risk-notice">This queue is descriptive and is not the canonical R8 Portfolio Risk engine. Formal R8 states are shown in the summary above.</div>
        {model.items.length ? <div className="dashboard-risk-list">{model.items.map((item) => <article key={item.position.securityId} className={`tone-${item.tone}`}><i/><div><Link to={`/app/research/${item.position.securityId}`}>{item.position.symbol}</Link><small>{item.position.company}</small></div><div><strong>{item.flags[0]}</strong><p>{item.flags.slice(1).join(" · ") || "Single surfaced diagnostic condition"}</p></div><div><b>{item.position.portfolioWeightPercent ? pct(d(item.position.portfolioWeightPercent), 2) : "—"}</b><small>portfolio weight</small></div></article>)}</div> : <div className="dashboard-risk-empty">No concentration, price-freshness, research-coverage or owner-limit diagnostics are currently surfaced.</div>}
      </section>
    </div>
  </section>
}
