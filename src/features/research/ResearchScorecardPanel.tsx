import type { SecurityScoringSnapshot } from "./scoringTypes"

const DIMENSION_ORDER = [
  "QUALITY", "GROWTH", "CAPITAL_EFFICIENCY", "CASH_FLOW", "BALANCE_SHEET_CREDIT",
  "VALUATION", "MOMENTUM", "OWNERSHIP_GOVERNANCE", "RISK",
] as const

const label = (value: string) => value.replaceAll("_", " ").toLocaleLowerCase().replace(/(^|\s)\S/gu, (match) => match.toLocaleUpperCase())
const percent = (value: number | null) => value === null ? "Unavailable" : `${Math.round(value * 100)}%`
const score = (value: number | null) => value === null ? "—" : value.toFixed(0)

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

  return <>
    <section className="panel scoring-summary-panel" aria-labelledby="stock-scorecard-title">
      <div className="scoring-summary-head">
        <div>
          <p className="eyebrow">PortfolioAI Stock Score</p>
          <h2 id="stock-scorecard-title">{snapshot.profileName}</h2>
          <p>{snapshot.modelName} · model {snapshot.modelStatus.toLocaleLowerCase()}</p>
        </div>
        <div className="overall-score-box">
          <span>Overall score</span>
          <strong>{score(snapshot.overallScore)}</strong>
          <small>{hasRun ? label(snapshot.runState ?? "PARTIAL") : "Not calculated yet"}</small>
        </div>
        <div className="score-coverage-box">
          <span>Evidence coverage</span>
          <strong>{percent(snapshot.evidenceCoverage)}</strong>
          <small>Confidence {snapshot.evidenceConfidence === null ? "—" : `${snapshot.evidenceConfidence.toFixed(0)}%`}</small>
        </div>
      </div>
      {!hasRun ? <div className="research-callout research-callout-neutral"><strong>Scoring framework is ready; score is intentionally withheld.</strong><p>The sector-aware model is visible now, but PortfolioAI will not manufacture a number until the evidence and coverage gates are met.</p></div> : null}
      <div className="score-heatmap" aria-label="Investment score heatmap">
        {DIMENSION_ORDER.map((dimensionCode) => {
          const dimension = byCode.get(dimensionCode)
          const heatState = dimension?.heatState ?? "INSUFFICIENT"
          return <article key={dimensionCode} className={`score-heat-cell heat-${heatState.toLocaleLowerCase()}`}>
            <span>{label(dimensionCode)}</span>
            <strong>{score(dimension?.rawScore ?? null)}</strong>
            <small>{dimension ? `${Math.round(dimension.evidenceCoverage * 100)}% evidence` : "Insufficient evidence"}</small>
            <em>{label(heatState)}</em>
          </article>
        })}
      </div>
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
