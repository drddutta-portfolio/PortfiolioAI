import "./ResearchScorecardPanel.css"
import type { DimensionScore, SecurityScoringSnapshot } from "./scoringTypes"

const DIMENSION_ORDER = [
  "QUALITY", "GROWTH", "CAPITAL_EFFICIENCY", "CASH_FLOW", "BALANCE_SHEET_CREDIT",
  "VALUATION", "MOMENTUM", "OWNERSHIP_GOVERNANCE", "RISK",
] as const

const SECTION_GROUPS = [
  { label: "Quality & Growth", codes: ["QUALITY", "GROWTH"] },
  { label: "Financial Strength", codes: ["CAPITAL_EFFICIENCY", "CASH_FLOW", "BALANCE_SHEET_CREDIT"] },
  { label: "Valuation", codes: ["VALUATION"] },
  { label: "Momentum", codes: ["MOMENTUM"] },
  { label: "Ownership", codes: ["OWNERSHIP_GOVERNANCE"] },
  { label: "Risk", codes: ["RISK"] },
] as const

const OVERALL_PREVIEW_COVERAGE_GATE = 0.70

const label = (value: string) => value.replaceAll("_", " ").toLocaleLowerCase().replace(/(^|\s)\S/gu, (match) => match.toLocaleUpperCase())
const percent = (value: number | null) => value === null ? "Unavailable" : `${Math.round(value * 100)}%`
const score = (value: number | null) => value === null ? "—" : value.toFixed(0)
const profileSourceLabel = (source: SecurityScoringSnapshot["profileSource"]) => source === "REVIEWED_ASSIGNMENT" ? "Reviewed profile" : source === "SECTOR_RULE" ? "Sector-resolved profile" : "General fallback"

function scoreBand(value: number) {
  if (value >= 80) return "Strong"
  if (value >= 65) return "Positive"
  if (value >= 50) return "Neutral"
  if (value >= 35) return "Weak"
  return "Risk"
}

function previewOverallScore(dimensions: readonly DimensionScore[], scoreReadyCoverage: number | null) {
  if (scoreReadyCoverage === null || scoreReadyCoverage < OVERALL_PREVIEW_COVERAGE_GATE) return null
  const weighted = dimensions.filter((dimension) => dimension.dimensionWeight > 0)
  if (!weighted.length || weighted.some((dimension) => dimension.rawScore === null)) return null
  const totalWeight = weighted.reduce((sum, dimension) => sum + dimension.dimensionWeight, 0)
  if (totalWeight <= 0) return null
  return weighted.reduce((sum, dimension) => sum + (dimension.rawScore ?? 0) * dimension.dimensionWeight, 0) / totalWeight
}

function sectionSummary(dimensions: readonly DimensionScore[], codes: readonly string[]) {
  const selected = codes.map((code) => dimensions.find((dimension) => dimension.dimensionCode === code)).filter((dimension): dimension is DimensionScore => Boolean(dimension && dimension.dimensionWeight > 0))
  const totalWeight = selected.reduce((sum, dimension) => sum + dimension.dimensionWeight, 0)
  if (!selected.length || totalWeight <= 0) return { score: null, evidenceCoverage: null, scoreReadyCoverage: null }
  const evidenceCoverage = selected.reduce((sum, dimension) => sum + dimension.evidenceCoverage * dimension.dimensionWeight, 0) / totalWeight
  const scoreReadyCoverage = selected.reduce((sum, dimension) => sum + dimension.scoreReadyCoverage * dimension.dimensionWeight, 0) / totalWeight
  const fullyScored = selected.every((dimension) => dimension.rawScore !== null)
  const sectionScore = fullyScored ? selected.reduce((sum, dimension) => sum + (dimension.rawScore ?? 0) * dimension.dimensionWeight, 0) / totalWeight : null
  return { score: sectionScore, evidenceCoverage, scoreReadyCoverage }
}

export function ResearchScorecardPanel({ snapshot, isLoading, error }: {
  readonly snapshot: SecurityScoringSnapshot | null
  readonly isLoading: boolean
  readonly error: string | null
}) {
  if (isLoading) return <section className="panel"><p className="eyebrow">PortfolioAI scoring</p><h2>Loading scoring framework…</h2></section>
  if (error) return <section className="research-callout research-callout-neutral"><strong>Scoring framework unavailable</strong><p>{error}</p></section>
  if (!snapshot) return null

  const byCode = new Map(snapshot.dimensions.map((dimension) => [dimension.dimensionCode, dimension]))
  const hasRun = Boolean(snapshot.runState)
  const previewScore = hasRun ? null : previewOverallScore(snapshot.dimensions, snapshot.scoreReadyCoverage)
  const displayedOverallScore = hasRun ? snapshot.overallScore : previewScore
  const overallStatus = hasRun
    ? label(snapshot.runState ?? "PARTIAL")
    : previewScore === null
      ? "Awaiting evidence gate"
      : `Read-only preview · ${scoreBand(previewScore)}`
  const scoredSignals = snapshot.dimensions.flatMap((dimension) => (dimension.signals ?? []).filter((signal) => signal.state === "SCORED").map((signal) => ({ dimension: dimension.dimensionCode, ...signal })))

  return <>
    <section className="panel scoring-summary-panel" aria-labelledby="stock-scorecard-title">
      <div className="scoring-summary-head">
        <div>
          <p className="eyebrow">Investment decision cockpit</p>
          <h2 id="stock-scorecard-title">{snapshot.profileName}</h2>
          <p>{snapshot.modelName} · model {snapshot.modelStatus.toLocaleLowerCase()}</p>
          <small>{profileSourceLabel(snapshot.profileSource)}</small>
        </div>
        <div className="overall-score-box">
          <span>Overall stock score</span>
          <strong>{score(displayedOverallScore)}</strong>
          <small>{overallStatus}</small>
        </div>
        <div className="score-coverage-box">
          <span>Verified evidence</span>
          <strong>{percent(snapshot.evidenceCoverage)}</strong>
          <small>Score-ready {percent(snapshot.scoreReadyCoverage)}</small>
        </div>
      </div>

      <div className="investment-clarity-strip" aria-label="Section score summary">
        {SECTION_GROUPS.map((group) => {
          const summary = sectionSummary(snapshot.dimensions, group.codes)
          return <article key={group.label}>
            <span>{group.label}</span>
            <strong>{summary.score === null ? "—" : `${summary.score.toFixed(0)}`}</strong>
            <small>{summary.evidenceCoverage === null ? "Not applicable" : `${Math.round(summary.evidenceCoverage * 100)}% evidence · ${Math.round((summary.scoreReadyCoverage ?? 0) * 100)}% score-ready`}</small>
          </article>
        })}
      </div>

      {!hasRun ? <div className="research-callout research-callout-neutral"><strong>Read-only scoring preview</strong><p>Verified evidence and score readiness are shown separately. The overall preview appears only after at least 70% score-ready coverage and every weighted dimension has crossed its own scoring gate. It is not an official persisted score and does not change portfolio membership or role.</p></div> : null}

      <div className="heatmap-heading">
        <div><p className="eyebrow">Investment heatmap</p><h3>Where the stock is strong, weak or still unknown</h3></div>
        <div className="heatmap-legend" aria-label="Heatmap legend">
          <span className="legend-strong">Strong</span>
          <span className="legend-positive">Positive</span>
          <span className="legend-neutral">Neutral</span>
          <span className="legend-weak">Weak</span>
          <span className="legend-risk">Risk</span>
          <span className="legend-insufficient">Insufficient</span>
        </div>
      </div>
      <div className="score-heatmap" aria-label="Investment score heatmap">
        {DIMENSION_ORDER.map((dimensionCode) => {
          const dimension = byCode.get(dimensionCode)
          const heatState = dimension?.heatState ?? "INSUFFICIENT"
          const profileNotApplicable = snapshot.profileCode === "BANK_NBFC" && dimensionCode === "CASH_FLOW"
          const notApplicable = profileNotApplicable || Boolean(dimension && dimension.dimensionWeight === 0)
          const heatClass = notApplicable ? "heat-not-applicable" : `heat-${heatState.toLocaleLowerCase()}`
          return <article key={dimensionCode} className={`score-heat-cell ${heatClass}`}>
            <span>{label(dimensionCode)}</span>
            <strong>{notApplicable ? "N/A" : score(dimension?.rawScore ?? null)}</strong>
            <small>{notApplicable ? "Not applicable to this scoring profile" : dimension ? `${Math.round(dimension.evidenceCoverage * 100)}% evidence · ${Math.round(dimension.scoreReadyCoverage * 100)}% score-ready` : "Insufficient evidence"}</small>
            <em>{notApplicable ? "Not Applicable" : label(heatState)}</em>
          </article>
        })}
      </div>
      {scoredSignals.length ? <div className="verified-signal-strip" aria-label="Verified scoring inputs">
        {scoredSignals.map((signal) => <article key={`${signal.dimension}:${signal.inputCode}`}>
          <span>{label(signal.dimension)}</span>
          <strong>{signal.label}</strong>
          <small>{signal.value === null ? "Value unavailable" : `Value ${signal.value}`} · signal {signal.normalizedScore?.toFixed(0) ?? "—"}/100 · {signal.weight.toFixed(0)}% within dimension</small>
        </article>)}
      </div> : <p className="assessment-note">No metric has both reviewed semantics and a usable scoring rule yet for this security.</p>}
      <p className="assessment-note">Core/Satellite suitability is a downstream recommendation layer. PortfolioAI may recommend a role, but portfolio inclusion and role selection remain entirely user-controlled.</p>
    </section>

    <section className="panel external-ratings-panel" aria-labelledby="external-ratings-title">
      <div className="research-section-heading">
        <h2 id="external-ratings-title">External ratings</h2>
        <p>Instrument-level agency evidence. Ratings are not collapsed into one uncontrolled company label.</p>
      </div>
      {snapshot.ratings.length ? <div className="rating-grid">{snapshot.ratings.map((rating) => <article key={rating.id} className="rating-card">
        <div><span>{rating.agencyCode}</span><strong>{rating.ratingSymbol}{rating.outlook ? ` / ${label(rating.outlook)}` : ""}</strong></div>
        <p>{rating.instrumentDescription ?? (rating.instrumentType ? label(rating.instrumentType) : "Instrument unavailable")}</p>
        <small>{rating.ratingAction ? label(rating.ratingAction) : "Action unavailable"}{rating.ratingDate ? ` · ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(rating.ratingDate))}` : ""}</small>
      </article>)}</div> : <div className="data-empty"><strong>No external agency ratings cached</strong><p>Absence of a rating is treated as insufficient evidence, not a negative score.</p></div>}
    </section>
  </>
}
