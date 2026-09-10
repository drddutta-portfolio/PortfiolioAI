import type { DimensionScore, SecurityScoringSnapshot } from "./scoringTypes"
import "./ResearchScorecardPanel.css"

type SectionConfig = {
  readonly title: string
  readonly dimensions: readonly string[]
}

const CONFIG: Readonly<Record<string, SectionConfig>> = {
  FINANCIALS: { title: "Financial Strength", dimensions: ["CAPITAL_EFFICIENCY", "CASH_FLOW", "BALANCE_SHEET_CREDIT"] },
  QUALITY_GROWTH: { title: "Quality & Growth", dimensions: ["QUALITY", "GROWTH"] },
  OWNERSHIP: { title: "Ownership & Governance", dimensions: ["OWNERSHIP_GOVERNANCE"] },
  VALUATION: { title: "Valuation", dimensions: ["VALUATION"] },
}

function aggregate(dimensions: readonly DimensionScore[]) {
  const applicable = dimensions.filter((dimension) => dimension.heatState !== "NOT_APPLICABLE")
  const totalWeight = applicable.reduce((sum, dimension) => sum + dimension.dimensionWeight, 0)
  const weightedCoverage = totalWeight > 0
    ? applicable.reduce((sum, dimension) => sum + dimension.evidenceCoverage * dimension.dimensionWeight, 0) / totalWeight
    : 0
  const scored = applicable.filter((dimension) => dimension.rawScore !== null)
  const scoredWeight = scored.reduce((sum, dimension) => sum + dimension.dimensionWeight, 0)
  const score = scoredWeight > 0 && scored.length === applicable.length
    ? scored.reduce((sum, dimension) => sum + (dimension.rawScore ?? 0) * dimension.dimensionWeight, 0) / scoredWeight
    : null
  const confidence = scoredWeight > 0
    ? scored.reduce((sum, dimension) => sum + dimension.confidence * dimension.dimensionWeight, 0) / scoredWeight
    : null
  return { score, coverage: weightedCoverage, confidence }
}

export function ResearchSectionScore({ snapshot, section }: {
  readonly snapshot: SecurityScoringSnapshot | null
  readonly section: keyof typeof CONFIG
}) {
  const config = CONFIG[section]
  if (!config || !snapshot) return null
  const dimensions = config.dimensions
    .map((code) => snapshot.dimensions.find((dimension) => dimension.dimensionCode === code))
    .filter((dimension): dimension is DimensionScore => Boolean(dimension))
  const result = aggregate(dimensions)
  return <section className="section-score-banner" aria-label={`${config.title} score`}>
    <div>
      <span>Section score</span>
      <strong>{config.title}</strong>
      <small>{result.score === null ? "Score withheld until all required dimensions pass their evidence gates" : "Derived from the same audited dimension engine as the overall stock score"}</small>
    </div>
    <div className="section-score-number">
      <span>Score</span>
      <strong>{result.score === null ? "—" : `${result.score.toFixed(0)}/100`}</strong>
    </div>
    <div className="section-score-number">
      <span>Verified coverage</span>
      <strong>{Math.round(result.coverage * 100)}%</strong>
      <small>Confidence {result.confidence === null ? "—" : `${result.confidence.toFixed(0)}%`}</small>
    </div>
  </section>
}
