import "./ResearchScorecardPanel.css"
import "./ResearchScorecardPolish.css"
import { researchProfileUiContract } from "./researchProfileUiContract"
import type { DimensionScore, SecurityScoringSnapshot } from "./scoringTypes"

const OVERALL_PREVIEW_COVERAGE_GATE = 0.70

const label = (value: string) => value.replaceAll("_", " ").toLocaleLowerCase().replace(/(^|\s)\S/gu, (match) => match.toLocaleUpperCase())
const percent = (value: number | null) => value === null ? "Unavailable" : `${Math.round(value * 100)}%`
const score = (value: number | null) => value === null ? "—" : value.toFixed(0)
const profileSourceLabel = (source: SecurityScoringSnapshot["profileSource"]) => source === "REVIEWED_ASSIGNMENT" ? "Reviewed profile" : source === "SECTOR_RULE" ? "Sector-resolved profile" : "Methodology unavailable"

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

function ratingDate(value: string | null) {
  if (!value) return "Date unavailable"
  const parsed = new Date(value)
  return Number.isNaN(parsed.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(parsed)
}

export function ResearchScorecardPanel({ snapshot, isLoading, error }: {
  readonly snapshot: SecurityScoringSnapshot | null
  readonly isLoading: boolean
  readonly error: string | null
}) {
  if (isLoading) return <section className="panel"><p className="eyebrow">PortfolioAI scoring</p><h2>Loading scoring framework…</h2></section>
  if (error) return <section className="research-callout research-callout-neutral"><strong>Scoring framework unavailable</strong><p>{error}</p></section>
  if (!snapshot) return null
  if (snapshot.methodologyState && snapshot.methodologyState !== "AVAILABLE") return <section className="research-callout research-callout-neutral"><strong>{snapshot.profileName}</strong><p>{snapshot.methodologyState === "REVIEW_REQUIRED" ? "Canonical classification is missing or requires review. No scoring methodology or generic preview has been selected." : "No approved methodology is available for this classification. PortfolioAI will not substitute the GENERAL scoring profile."}</p><small>{snapshot.methodologyReasonCode?.replaceAll("_", " ") ?? "Fail-closed methodology state"}</small></section>
  if (snapshot.scoringExecutionState === "PENDING_ADAPTER") return <section className="research-callout research-callout-neutral"><strong>Sector methodology available</strong><p>Scoring execution is pending evidence/adapter rollout. PortfolioAI will not substitute GENERAL scoring rules.</p><small>{snapshot.profileName} · {snapshot.scoringExecutionReasonCode?.replaceAll("_", " ") ?? "Sector scoring adapter pending"}</small></section>

  const ui = researchProfileUiContract(snapshot.profileCode)
  const byCode = new Map(snapshot.dimensions.map((dimension) => [dimension.dimensionCode, dimension]))
  const hasRun = Boolean(snapshot.runState)
  const previewScore = hasRun ? null : previewOverallScore(snapshot.dimensions, snapshot.scoreReadyCoverage)
  const displayedOverallScore = hasRun ? snapshot.overallScore : previewScore
  const hasOverallEvidence = (snapshot.evidenceCoverage ?? 0) > 0
  const overallStatus = hasRun
    ? label(snapshot.runState ?? "PARTIAL")
    : previewScore === null
      ? "Awaiting evidence gate"
      : `Read-only preview · ${scoreBand(previewScore)}`
  const ratingsByAgency = new Map<string, typeof snapshot.ratings>()
  for (const rating of snapshot.ratings) ratingsByAgency.set(rating.agencyCode, [...(ratingsByAgency.get(rating.agencyCode) ?? []), rating])

  return <>
    <section className="panel scoring-summary-panel" aria-labelledby="stock-scorecard-title">
      <div className="scoring-summary-head">
        <div>
          <p className="eyebrow">Investment decision cockpit</p>
          <h2 id="stock-scorecard-title">{ui.profileDisplayName}</h2>
          <p>{snapshot.modelName} · model {snapshot.modelStatus.toLocaleLowerCase()}</p>
          <small>{profileSourceLabel(snapshot.profileSource)}</small>
        </div>
        <div className={`overall-score-box${displayedOverallScore === null ? " evidence-only-score" : ""}`}>
          <span>Overall stock score</span>
          <strong>{displayedOverallScore === null ? hasOverallEvidence ? "Not score-ready" : "No validated evidence" : score(displayedOverallScore)}</strong>
          <small>{overallStatus}</small>
        </div>
        <div className="score-coverage-box">
          <span>Verified evidence</span>
          <strong>{percent(snapshot.evidenceCoverage)}</strong>
          <small>Score-ready {percent(snapshot.scoreReadyCoverage)}</small>
        </div>
      </div>

      <div className="investment-clarity-strip" aria-label="Section score summary">
        {ui.scoreSectionGroups.map((group) => {
          const summary = sectionSummary(snapshot.dimensions, group.codes)
          const hasEvidence = (summary.evidenceCoverage ?? 0) > 0
          return <article key={group.label} className={summary.score === null ? "evidence-only-score" : undefined}>
            <span>{group.label}</span>
            <strong>{summary.score === null ? hasEvidence ? "Not score-ready" : "No validated evidence" : `${summary.score.toFixed(0)}`}</strong>
            <small>{summary.evidenceCoverage === null ? "Evidence unavailable" : `${Math.round(summary.evidenceCoverage * 100)}% evidence · ${Math.round((summary.scoreReadyCoverage ?? 0) * 100)}% score-ready`}</small>
          </article>
        })}
      </div>

      {!hasRun ? <div className="research-callout research-callout-neutral"><strong>Read-only scoring preview</strong><p>Verified evidence and score readiness are shown separately. The overall preview appears only after at least 70% score-ready coverage and every weighted dimension has crossed its own scoring gate. It is not an official persisted score and does not change portfolio membership or role.</p></div> : null}

      <div className="heatmap-heading">
        <div><p className="eyebrow">Investment heatmap</p><h3>Where the stock is strong, weak or still unknown</h3><p className="heatmap-help">Open any dimension to see the reviewed inputs that produced its score.</p></div>
        <div className="heatmap-legend" aria-label="Heatmap legend">
          <span className="legend-strong">Strong</span><span className="legend-positive">Positive</span><span className="legend-neutral">Neutral</span><span className="legend-weak">Weak</span><span className="legend-risk">Risk</span><span className="legend-insufficient">Insufficient</span>
        </div>
      </div>
      <div className="score-heatmap" aria-label="Investment score heatmap">
        {ui.dimensionOrder.map((dimensionCode) => {
          const dimension = byCode.get(dimensionCode)
          const heatState = dimension?.heatState ?? "INSUFFICIENT"
          const profileNotApplicable = ui.notApplicableDimensions.includes(dimensionCode)
          const notApplicable = profileNotApplicable || Boolean(dimension && dimension.dimensionWeight === 0)
          const evidenceOnly = !notApplicable && (dimension?.rawScore ?? null) === null
          const noEvidence = evidenceOnly && (dimension?.evidenceCoverage ?? 0) <= 0
          const heatClass = notApplicable ? "heat-not-applicable" : `heat-${heatState.toLocaleLowerCase()}`
          const signals = dimension?.signals ?? []
          const dimensionLabel = ui.dimensionLabels[dimensionCode] ?? label(dimensionCode)
          return <details key={dimensionCode} className={`score-heat-cell ${heatClass}${evidenceOnly ? " evidence-only-heat" : ""}`}>
            <summary aria-disabled={notApplicable || noEvidence} onClick={(event) => { if (notApplicable || noEvidence) event.preventDefault() }}>
              <span>{dimensionLabel}</span>
              <strong>{notApplicable ? "N/A" : noEvidence ? "No validated evidence yet" : evidenceOnly ? "Insufficient for score" : score(dimension?.rawScore ?? null)}</strong>
              <small>{notApplicable ? "Not applicable to this scoring profile" : dimension ? noEvidence ? "Evidence has not yet met validation requirements" : evidenceOnly ? `${Math.round(dimension.evidenceCoverage * 100)}% evidence reviewed` : `${Math.round(dimension.evidenceCoverage * 100)}% evidence · ${Math.round(dimension.scoreReadyCoverage * 100)}% score-ready` : "Evidence unavailable"}</small>
              <em>{notApplicable ? "Not Applicable" : noEvidence ? "No evidence" : evidenceOnly ? "Evidence only" : label(heatState)}</em>
              <b className={notApplicable || noEvidence ? "heat-footer-disabled" : undefined} aria-disabled={notApplicable || noEvidence}>{notApplicable ? "Not applicable" : noEvidence ? "Evidence unavailable" : evidenceOnly ? "View evidence" : "Why this score?"}</b>
            </summary>
            {!notApplicable ? <div className="heat-evidence-panel">
              {signals.length ? signals.map((signal) => <article key={signal.inputCode} className={`heat-signal signal-${signal.state.toLocaleLowerCase()}`}>
                <div><strong>{signal.label}</strong><span>{signal.state === "SCORED" ? `${signal.normalizedScore?.toFixed(0) ?? "—"}/100` : label(signal.state)}</span></div>
                <small>{signal.value === null ? "Value unavailable" : `Evidence periods/components ${signal.value}`} · {signal.weight.toFixed(0)}% of dimension</small>
              </article>) : <p>No reviewed metric inputs are configured for this dimension yet.</p>}
            </div> : null}
          </details>
        })}
      </div>
      <p className="assessment-note">PortfolioAI recommendation and your portfolio choice are intentionally separate. Any future Core/Satellite suggestion will be advisory; your selected role remains user-controlled.</p>
    </section>

    {ui.externalRatingsMode === "COMPACT" && snapshot.ratings.length === 0 ? <section className="panel external-ratings-panel" aria-labelledby="external-ratings-title">
      <div className="ratings-header"><div><p className="eyebrow">Credit evidence</p><h2 id="external-ratings-title">External ratings</h2><p>No material cached ratings. Absence of a rating is insufficient evidence, not a negative signal.</p></div><div><strong>0</strong><span>rated instruments</span></div></div>
    </section> : <section className="panel external-ratings-panel" aria-labelledby="external-ratings-title">
      <div className="ratings-header">
        <div><p className="eyebrow">Credit evidence</p><h2 id="external-ratings-title">External ratings</h2><p>Multi-agency, instrument-level evidence. Expand an agency only when you need the instrument detail.</p></div>
        <div><strong>{ratingsByAgency.size}</strong><span>agencies</span><strong>{snapshot.ratings.length}</strong><span>rated instruments</span></div>
      </div>
      {snapshot.ratings.length ? <div className="rating-agency-list">{[...ratingsByAgency.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([agency, ratings]) => {
        const sorted = [...ratings].sort((a, b) => (b.ratingDate ?? "").localeCompare(a.ratingDate ?? "") || a.instrumentType?.localeCompare(b.instrumentType ?? "") || 0)
        const senior = sorted.filter((item) => ["FIXED_DEPOSIT", "INFRASTRUCTURE_BOND", "NON_CONVERTIBLE_DEBENTURE"].includes(item.instrumentType ?? ""))
        const representative = senior[0] ?? sorted[0]
        return <details key={agency} className="rating-agency-row">
          <summary><strong>{agency}</strong><span>{representative ? `${representative.ratingSymbol}${representative.outlook ? ` / ${label(representative.outlook)}` : ""}` : "Rating available"}</span><small>{ratings.length} instruments · latest {ratingDate(sorted[0]?.ratingDate ?? null)}</small><b>Details</b></summary>
          <div className="rating-instrument-list">{sorted.map((rating) => <article key={rating.id}><div><strong>{rating.instrumentDescription ?? (rating.instrumentType ? label(rating.instrumentType) : "Instrument")}</strong><span>{rating.ratingSymbol}{rating.outlook ? ` / ${label(rating.outlook)}` : ""}</span></div><small>{rating.ratingAction ? label(rating.ratingAction) : "Action unavailable"} · {ratingDate(rating.ratingDate)}</small></article>)}</div>
        </details>
      })}</div> : <div className="data-empty"><strong>No external agency ratings cached</strong><p>Absence of a rating is treated as insufficient evidence, not a negative score.</p></div>}
    </section>}
  </>
}
