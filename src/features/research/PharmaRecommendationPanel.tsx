import {
  buildPharmaGateI3ReferenceRecommendation,
  type PharmaGateI3ReadOnlyRecommendationResult,
} from "./pharmaGateI3ReadOnlyRecommendation"
import type { PharmaSubprofileResolution } from "./pharmaSubprofileAssignment"

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .toLocaleLowerCase()
    .replace(/(^|\s)\S/gu, (match) => match.toLocaleUpperCase())
}

function roleLabel(
  role: PharmaGateI3ReadOnlyRecommendationResult["suggestedRole"],
) {
  if (role === "CORE_CANDIDATE") return "Core candidate"
  if (role === "SATELLITE_CANDIDATE") return "Satellite candidate"
  if (role === "WATCH") return "Watch"
  if (role === "AVOID") return "Avoid"
  return "Insufficient"
}

function cautionLabel(code: string) {
  if (code === "VALUATION_BELOW_NEUTRAL_ANCHOR") {
    return "Valuation is below the PHARMA_V1 neutral anchor."
  }
  if (code === "MOMENTUM_BELOW_NEUTRAL_ANCHOR") {
    return "Momentum is below the PHARMA_V1 neutral anchor."
  }
  if (code === "REGULATORY_HIGH_RISK_INTERPRETATION_ONLY") {
    return "Regulatory high-risk context remains visible without a second numeric penalty."
  }
  return titleCase(code)
}

function failClosedReason(result: PharmaGateI3ReadOnlyRecommendationResult) {
  if (
    result.reasonCodes.includes(
      "GLOBAL_GENERICS_PRIMARY_METHODOLOGY_INCOMPLETE",
    )
  ) {
    return "Global Generics Primary scoring methodology is incomplete, so no overall score or recommendation role is reconstructed from partial dimensions."
  }
  if (result.reasonCodes.includes("CANONICAL_ASSIGNMENT_NOT_RESOLVED")) {
    return "The canonical PHARMA_V1 assignment is not resolved, so recommendation evaluation remains fail-closed."
  }
  return "The authoritative recommendation input is incomplete, so PortfolioAI does not infer a role."
}

export function PharmaRecommendationPanel({
  securityId,
  symbol,
  assignmentResolution,
  currentUserRole,
}: {
  readonly securityId: string
  readonly symbol: string
  readonly assignmentResolution: PharmaSubprofileResolution | null
  readonly currentUserRole: string
}) {
  if (!assignmentResolution) return null

  const result = buildPharmaGateI3ReferenceRecommendation({
    securityId,
    securitySymbol: symbol,
    assignmentResolution,
  })
  if (!result) return null

  const role = roleLabel(result.suggestedRole)
  const floorPasses = result.floorEvaluations.filter(
    (item) => item.state === "PASS",
  ).length

  return <section className="panel scoring-summary-panel" aria-labelledby="pharma-i3-recommendation-title">
    <div className="scoring-summary-head">
      <div>
        <p className="eyebrow">Sector add-on · Pharmaceuticals</p>
        <h2 id="pharma-i3-recommendation-title">PHARMA_V1 recommendation detail</h2>
        <p>Gate I3 deterministic recommendation · read-only · non-persisting</p>
        <small>{result.policyVersion}</small>
      </div>
      <div className={`overall-score-box${result.overallScore === null ? " evidence-only-score" : ""}`}>
        <span>Suggested research role</span>
        <strong>{role}</strong>
        <small>{result.deterministicCalculationState === "READY_READ_ONLY_RECOMMENDATION" ? "Deterministic I3 result" : "Fail-closed authority state"}</small>
      </div>
      <div className="score-coverage-box">
        <span>Authoritative score</span>
        <strong>{result.overallScore === null ? "Not computable" : result.overallScore.toFixed(4)}</strong>
        <small>{result.overallScore === null ? "No score reconstruction" : "Locked Gate H score"}</small>
      </div>
    </div>

    <div className="investment-clarity-strip" aria-label="Recommendation and portfolio role separation">
      <article>
        <span>PortfolioAI suggested research role</span>
        <strong>{role}</strong>
        <small>Advisory research output</small>
      </article>
      <article>
        <span>Your selected portfolio role</span>
        <strong>{currentUserRole === "UNCLASSIFIED" ? "Unclassified" : titleCase(currentUserRole)}</strong>
        <small>User-controlled · unchanged by I3</small>
      </article>
      <article>
        <span>Role gate</span>
        <strong>{result.evaluatedRoleThreshold === "NOT_EVALUATED" ? "Not evaluated" : titleCase(result.evaluatedRoleThreshold)}</strong>
        <small>{result.floorEvaluations.length ? `${floorPasses}/${result.floorEvaluations.length} applicable floors passed` : "No partial floor inference"}</small>
      </article>
      <article>
        <span>Persistence / sizing</span>
        <strong>Off</strong>
        <small>No recommendation row · no weight or action bias</small>
      </article>
    </div>

    {result.deterministicCalculationState === "FAIL_CLOSED_INSUFFICIENT"
      ? <div className="research-callout research-callout-neutral">
          <strong>Recommendation remains insufficient</strong>
          <p>{failClosedReason(result)}</p>
        </div>
      : null}

    {result.cautions.length
      ? <div className="research-callout research-callout-neutral">
          <strong>Recommendation cautions</strong>
          <p>{result.cautions.map(cautionLabel).join(" ")}</p>
        </div>
      : null}

    {result.context.length
      ? <p className="assessment-note">
          Context only: {result.overlayTreatment.materialOverlayCode ? `${titleCase(result.overlayTreatment.materialOverlayCode)} material overlay` : "no material overlay"} · {result.overlayTreatment.emergingWatchCode ? `${titleCase(result.overlayTreatment.emergingWatchCode)} emerging watch` : "no emerging watch"}. These do not create a second score or recommendation.
        </p>
      : null}

    <p className="assessment-note">
      PortfolioAI suggested research role ≠ your selected portfolio role. I3 does not change holdings, target weight, target price, stop loss, portfolio settings or orders.
    </p>
  </section>
}
