import { isQualifiedResearchScore } from "./researchScoreEligibility"
import "./ResearchScorecardPanel.css"
import "./ResearchScorecardPolish.css"
import { researchProfileUiContract } from "./researchProfileUiContract"
import { programBMethodologyRoleLabel, type ProgramBR6ScoringPresentation } from "./programBR6Presentation"
import type { DimensionScore, SecurityScoringSnapshot } from "./scoringTypes"

const label = (value: string) => value.replaceAll("_", " ").toLocaleLowerCase().replace(/(^|\s)\S/gu, (match) => match.toLocaleUpperCase())
const percent = (value: number | null) => value === null ? "Unavailable" : `${Math.round(value * 100)}%`
const score = (value: number | null) => value === null ? "—" : value.toFixed(0)
const profileSourceLabel = (source: SecurityScoringSnapshot["profileSource"]) => source === "CANONICAL_ASSIGNMENT" ? "Canonical methodology assignment" : source === "REVIEWED_ASSIGNMENT" ? "Reviewed profile" : source === "SECTOR_RULE" ? "Sector-resolved profile" : "Methodology unavailable"

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

function ScoringContractStrip({ presentation }: {
  readonly presentation: ProgramBR6ScoringPresentation
}) {
  return <div className="investment-clarity-strip scoring-contract-strip" aria-label="Current scoring readiness">
    <article><span>Score readiness</span><strong>{label(presentation.readinessState)}</strong><small>Evidence coverage is separate from score readiness</small></article>
    <article><span>Methodology</span><strong>{presentation.researchProfileCode}</strong><small>{presentation.methodologyVersion ?? "Version unresolved"}</small></article>
    <article><span>Methodology role</span><strong title={presentation.methodologyRole ?? undefined}>{programBMethodologyRoleLabel(presentation.methodologyRole)}</strong><small>{presentation.methodologyRole ?? "Canonical Primary unresolved"}</small></article>
    <article><span>Evidence date / snapshot</span><strong>{presentation.asOfDate ?? "Date unresolved"}</strong><small>{presentation.evidenceSnapshotIdentity ?? "Snapshot unresolved"}</small></article>
    <article><span>Blocked inputs</span><strong>{presentation.blockerCount}</strong><small>Current scoring prerequisites</small></article>
    <article><span>Fail-closed reason</span><strong>{presentation.reasonCodes.length ? presentation.reasonCodes.map(label).join(" · ") : "None"}</strong><small>No hidden reconstruction</small></article>
  </div>
}

export function ResearchScorecardPanel({ snapshot, isLoading, error, programB = null, retainedRatings, ratingsError, ratingsLoading = false }: {
  readonly snapshot: SecurityScoringSnapshot | null
  readonly isLoading: boolean
  readonly error: string | null
  readonly retainedRatings?: SecurityScoringSnapshot["ratings"]; readonly ratingsError?: string | null; readonly ratingsLoading?: boolean
  readonly programB?: ProgramBR6ScoringPresentation | null
}) {
  const unavailableReason = isLoading ? "Loading scoring framework…" : error ? error : !snapshot ? "No current scoring snapshot is available." : snapshot.methodologyState === "NOT_APPLICABLE" ? "Equity scoring not applicable. Portfolio accounting and owner settings are preserved." : snapshot.methodologyState === "REVIEW_REQUIRED" ? "The canonical assignment, its lineage or required primary subprofile needs review." : snapshot.methodologyState === "METHODOLOGY_NOT_AVAILABLE" ? "No approved methodology is available. PortfolioAI will not substitute the GENERAL scoring profile." : snapshot.scoringExecutionState === "PENDING_ADAPTER" ? "Sector methodology available; scoring execution is pending evidence/adapter rollout." : snapshot.scoringExecutionState === "BLOCKED" ? "Methodology resolved · scoring blocked. Required current evidence is not ready." : null
  const qualified = isQualifiedResearchScore(snapshot, isLoading, error, programB)
  const current: SecurityScoringSnapshot = snapshot ?? { profileCode: "UNRESOLVED", profileName: "Research profile unresolved", modelName: "PortfolioAI scoring", modelStatus: "UNAVAILABLE", profileSource: "METHODOLOGY_UNAVAILABLE", runState: null, overallScore: null, evidenceCoverage: null, scoreReadyCoverage: null, dimensions: [], ratings: [], evidenceConfidence: null, asOfDate: null }
  const ui = researchProfileUiContract(current.profileCode)
  const byCode = new Map(current.dimensions.map((dimension) => [dimension.dimensionCode, dimension]))
  const hasRun = qualified
  const displayedOverallScore = hasRun ? current.overallScore : null
  const hasOverallEvidence = (current.evidenceCoverage ?? 0) > 0
  const overallStatus = hasRun
    ? label(current.runState ?? "PARTIAL")
    : "No current canonical score"
  const ratingsUnavailable = ratingsLoading || Boolean(ratingsError)
  const ratings = retainedRatings ?? current.ratings
  const ratingsByAgency = new Map<string, typeof ratings>()
  for (const rating of ratings) ratingsByAgency.set(rating.agencyCode, [...(ratingsByAgency.get(rating.agencyCode) ?? []), rating])

  return <>
    <section className="panel scoring-summary-panel" aria-labelledby="stock-scorecard-title">
      <div className="scoring-summary-head">
        <div>
          <p className="eyebrow">Investment decision cockpit</p>
          <h2 id="stock-scorecard-title">{snapshot?.profileName ?? ui.profileDisplayName}</h2>
          <p>{current.modelName} · model {current.modelStatus.toLocaleLowerCase()}</p>
          <small>{profileSourceLabel(current.profileSource)}</small>
        </div>
        <div className={`overall-score-box${displayedOverallScore === null ? " evidence-only-score" : ""}`}>
          <span>Overall stock score</span>
          <strong>{displayedOverallScore === null ? hasOverallEvidence ? "Not score-ready" : "Not ready" : score(displayedOverallScore)}</strong>
          <small>{overallStatus}</small>
        </div>
        <div className="score-coverage-box">
          <span>Verified evidence</span>
          <strong>{percent(current.evidenceCoverage)}</strong>
          <small>Score-ready {percent(current.scoreReadyCoverage)}</small>
        </div>
      </div>

      <p className="assessment-note" role={error ? "alert" : undefined}>{unavailableReason ?? "Scores require a current authoritative run; source evidence alone is not a score."}</p>{programB ? <details className="scoring-lineage"><summary>Assessment prerequisites and lineage</summary><ScoringContractStrip presentation={programB} /></details> : null}

      <div className="investment-clarity-strip" aria-label="Section score summary">
        {ui.scoreSectionGroups.map((group) => {
          const summary = sectionSummary(qualified ? current.dimensions : [], group.codes)
          const hasEvidence = (summary.evidenceCoverage ?? 0) > 0
          return <article key={group.label} className={summary.score === null ? "evidence-only-score" : undefined}>
            <span>{group.label}</span>
            <strong>{summary.score === null ? hasEvidence ? "Not score-ready" : "No qualified assessment" : `${summary.score.toFixed(0)}`}</strong>
            <small>{summary.evidenceCoverage === null ? "Evidence unavailable" : `${Math.round(summary.evidenceCoverage * 100)}% evidence · ${Math.round((summary.scoreReadyCoverage ?? 0) * 100)}% score-ready`}</small>
          </article>
        })}
      </div>

      {!hasRun ? <div className="research-callout research-callout-neutral"><strong>No current canonical score</strong><p>Verified evidence and score readiness are shown separately. PortfolioAI does not reconstruct an overall score from historical fixtures or partial evidence. A numeric score appears here only when a current authoritative score run exists.</p></div> : null}

      <div className="heatmap-heading">
        <div><p className="eyebrow">Investment heatmap</p><h3>Where the stock is strong, weak or still unknown</h3><p className="heatmap-help">Scored dimensions link to their inputs. Unavailable assessments remain explicit.</p></div>
        <div className="heatmap-legend" aria-label="Heatmap legend">
          <span className="legend-strong">Strong</span><span className="legend-positive">Positive</span><span className="legend-neutral">Neutral</span><span className="legend-weak">Weak</span><span className="legend-risk">Risk</span><span className="legend-insufficient">Insufficient</span>
        </div>
      </div>
      <div className="score-heatmap" aria-label="Investment score heatmap">
        {ui.dimensionOrder.map((dimensionCode) => {
          const retained = byCode.get(dimensionCode)
          const dimension = qualified ? retained : retained ? { ...retained, rawScore: null, heatState: "INSUFFICIENT", signals: [] } : undefined
          const heatState = dimension?.heatState ?? "INSUFFICIENT"
          const profileNotApplicable = snapshot?.methodologyState === "NOT_APPLICABLE" || ui.notApplicableDimensions.includes(dimensionCode)
          const notApplicable = profileNotApplicable || Boolean(dimension && dimension.dimensionWeight === 0)
          const evidenceOnly = !notApplicable && (dimension?.rawScore ?? null) === null
          const noEvidence = evidenceOnly && (dimension?.evidenceCoverage ?? 0) <= 0
          const heatClass = notApplicable ? "heat-not-applicable" : `heat-${heatState.toLocaleLowerCase()}`
          const signals = dimension?.signals ?? []
          const dimensionLabel = ui.dimensionLabels[dimensionCode] ?? label(dimensionCode)
          return <details key={dimensionCode} className={`score-heat-cell ${heatClass}${evidenceOnly ? " evidence-only-heat" : ""}`}>
            <summary aria-disabled={notApplicable || noEvidence} onClick={(event) => { if (notApplicable || noEvidence) event.preventDefault() }}>
              <span>{dimensionLabel}</span>
              <strong>{notApplicable ? "N/A" : noEvidence ? "No qualified assessment" : evidenceOnly ? "Insufficient for score" : score(dimension?.rawScore ?? null)}</strong>
              <small>{notApplicable ? "Not applicable to this scoring profile" : dimension ? noEvidence ? "Assessment prerequisites are not met" : evidenceOnly ? `${Math.round(dimension.evidenceCoverage * 100)}% evidence reviewed` : `${Math.round(dimension.evidenceCoverage * 100)}% evidence · ${Math.round(dimension.scoreReadyCoverage * 100)}% score-ready` : "Evidence unavailable"}</small>
              <em>{notApplicable ? "Not Applicable" : noEvidence ? "Assessment unavailable" : evidenceOnly ? "Evidence only" : label(heatState)}</em>
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
        {!ui.dimensionOrder.length ? <p>No approved dimension presentation is available for this profile. Its requirements and retained evidence remain accessible below.</p> : null}
      </div>
      <p className="assessment-note">PortfolioAI recommendation and your portfolio choice are intentionally separate. Any future Core/Satellite suggestion will be advisory; your selected role remains user-controlled.</p>
    </section>

    {ratingsError ? <p role="alert">External ratings could not be loaded: {ratingsError}</p> : null}
    {ui.externalRatingsMode === "COMPACT" && ratings.length === 0 && !ratingsUnavailable ? <section className="panel external-ratings-panel" aria-labelledby="external-ratings-title">
      <div className="ratings-header"><div><p className="eyebrow">Credit evidence</p><h2 id="external-ratings-title">External ratings</h2><p>No material cached ratings. Absence of a rating is insufficient evidence, not a negative signal.</p></div><div><strong>0</strong><span>rated instruments</span></div></div>
    </section> : <section className="panel external-ratings-panel" aria-labelledby="external-ratings-title">
      <div className="ratings-header">
        <div><p className="eyebrow">Credit evidence</p><h2 id="external-ratings-title">External ratings</h2><p>Provider opinions, separate from PortfolioAI scores. Expand an agency for dated instrument evidence.</p></div>
        <div><strong>{ratingsUnavailable ? "Unavailable" : ratingsByAgency.size}</strong><span>agencies</span><strong>{ratingsUnavailable ? "Unavailable" : ratings.length}</strong><span>rated instruments</span></div>
      </div>
      {ratings.length ? <div className="rating-agency-list">{[...ratingsByAgency.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([agency, ratings]) => {
        const sorted = [...ratings].sort((a, b) => (b.ratingDate ?? "").localeCompare(a.ratingDate ?? "") || a.instrumentType?.localeCompare(b.instrumentType ?? "") || 0)
        const senior = sorted.filter((item) => ["FIXED_DEPOSIT", "INFRASTRUCTURE_BOND", "NON_CONVERTIBLE_DEBENTURE"].includes(item.instrumentType ?? ""))
        const representative = senior[0] ?? sorted[0]
        return <details key={agency} className="rating-agency-row">
          <summary><strong>{agency}</strong><span>{representative ? `${representative.ratingSymbol}${representative.outlook ? ` / ${label(representative.outlook)}` : ""}` : "Rating available"}</span><small>{ratings.length} instruments · latest {ratingDate(sorted[0]?.ratingDate ?? null)}</small><b>Details</b></summary>
          <div className="rating-instrument-list">{sorted.map((rating) => <article key={rating.id}><div><strong>{rating.instrumentDescription ?? (rating.instrumentType ? label(rating.instrumentType) : "Instrument")}</strong><span>{rating.ratingSymbol}{rating.outlook ? ` / ${label(rating.outlook)}` : ""}</span></div><small>{rating.ratingAction ? label(rating.ratingAction) : "Action unavailable"} · {ratingDate(rating.ratingDate)} · Source status: {rating.evidenceStatus} · Fresh through {ratingDate(rating.freshUntil)} · Retrieved {ratingDate(rating.retrievedAt)}</small><small>Source reference: {rating.sourceUrl || "Unavailable"}</small></article>)}</div>
        </details>
      })}</div> : <div className="data-empty"><strong>{ratingsLoading ? "Loading retained ratings…" : ratingsError ? "External ratings unavailable" : "No external agency ratings cached"}</strong><p>Provider rating availability is independent of PortfolioAI score readiness.</p></div>}
    </section>}
  </>
}
