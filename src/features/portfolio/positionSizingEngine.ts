import Decimal from "decimal.js"

export const POSITION_SIZING_ENGINE_VERSION = "POSITION_SIZING_V1" as const
export const POSITION_SIZING_WEIGHT_SCALE = 6

export type PositionSizingAssessmentState =
  | "READY"
  | "INSUFFICIENT_EVIDENCE"
  | "BLOCKED_PREREQUISITE"
  | "NOT_APPLICABLE"

export type PositionSizingAction =
  | "ADD"
  | "HOLD"
  | "ADD_ON_WEAKNESS"
  | "REDUCE"
  | "TRIM_INTO_STRENGTH"
  | "FREEZE"
  | "EXIT_REVIEW"

export type UpstreamActionBias = "ACCUMULATE" | "HOLD" | "REDUCE" | "EXIT_CANDIDATE" | "WAIT"
export type RecommendationTransitionStatus =
  | "INITIAL"
  | "STABLE"
  | "EVIDENCE_PENDING"
  | "PENDING_UPGRADE"
  | "CONFIRMED_UPGRADE"
  | "PENDING_DOWNGRADE"
  | "CONFIRMED_DOWNGRADE"

export type PositionSizingReasonCode =
  | "ASSET_CLASS_NOT_EQUITY"
  | "MISSING_SOURCE_RECOMMENDATION"
  | "MISSING_SOURCE_SCORE"
  | "UPSTREAM_RECOMMENDATION_INSUFFICIENT"
  | "UPSTREAM_RECOMMENDATION_EVIDENCE_PENDING"
  | "MISSING_SCORE_COVERAGE"
  | "SCORE_COVERAGE_BELOW_POLICY"
  | "MISSING_WEIGHT_GUIDANCE"
  | "INVALID_WEIGHT_GUIDANCE"
  | "MISSING_CURRENT_WEIGHT"
  | "OWNER_POSITION_FROZEN"
  | "CURRENT_WEIGHT_BELOW_RANGE"
  | "CURRENT_WEIGHT_WITHIN_RANGE"
  | "CURRENT_WEIGHT_ABOVE_RANGE"
  | "UPSTREAM_ACCUMULATE"
  | "UPSTREAM_HOLD_OR_WAIT"
  | "UPSTREAM_REDUCE"
  | "EXIT_REQUIRES_THESIS_REVIEW"
  | "OWNER_TARGET_BELOW_ENGINE_RANGE"
  | "OWNER_TARGET_WITHIN_ENGINE_RANGE"
  | "OWNER_TARGET_ABOVE_ENGINE_RANGE"
  | "OWNER_MINIMUM_ABOVE_ENGINE_RANGE"
  | "OWNER_MAXIMUM_BELOW_ENGINE_RANGE"

export interface PositionSizingSourceRecommendation {
  readonly recommendationRunId: string | null
  readonly scoreRunId: string | null
  readonly suggestedRole: "CORE_CANDIDATE" | "SATELLITE_CANDIDATE" | "WATCH" | "AVOID" | "INSUFFICIENT"
  readonly actionBias: UpstreamActionBias | null
  readonly suggestedWeightMinimum: string | null
  readonly suggestedWeightMaximum: string | null
  readonly scoreReadyCoverage: string | null
  readonly evidenceConfidence: string | null
  readonly transitionStatus: RecommendationTransitionStatus | null
}

export interface PositionSizingOwnerContext {
  readonly portfolioRole: "CORE" | "SATELLITE" | "THEMATIC" | "ETF" | "OTHER" | "UNCLASSIFIED"
  readonly targetWeight: string | null
  readonly minimumWeight: string | null
  readonly maximumWeight: string | null
  readonly isFrozen: boolean
}

export interface PositionSizingInput {
  readonly portfolioId: string
  readonly securityId: string
  readonly assetClass: string
  readonly currentWeight: string | null
  readonly minimumScoreReadyCoverage: string
  readonly owner: PositionSizingOwnerContext
  readonly recommendation: PositionSizingSourceRecommendation
}

export interface PositionSizingAssessment {
  readonly engineVersion: typeof POSITION_SIZING_ENGINE_VERSION
  readonly portfolioId: string
  readonly securityId: string
  readonly assessmentState: PositionSizingAssessmentState
  readonly currentWeight: string | null
  readonly suggestedTargetWeight: string | null
  readonly suggestedMinimumWeight: string | null
  readonly suggestedMaximumWeight: string | null
  readonly recommendedAction: PositionSizingAction | null
  readonly evidenceCoverage: string | null
  readonly evidenceConfidence: string | null
  readonly reasonCodes: readonly PositionSizingReasonCode[]
  readonly rationale: readonly string[]
  readonly sourceScoreRunId: string | null
  readonly sourceRecommendationRunId: string | null
}

function decimalOrNull(value: string | null, label: string, minimum: Decimal, maximum: Decimal): Decimal | null {
  if (value === null || value.trim() === "") return null
  let parsed: Decimal
  try {
    parsed = new Decimal(value)
  } catch {
    throw new Error(`${label} must be a valid decimal.`)
  }
  if (!parsed.isFinite() || parsed.lt(minimum) || parsed.gt(maximum)) {
    throw new Error(`${label} must be between ${minimum.toFixed()} and ${maximum.toFixed()}.`)
  }
  return parsed
}

function weightOrNull(value: string | null, label: string): Decimal | null {
  return decimalOrNull(value, label, new Decimal(0), new Decimal(100))
}

function coverageOrNull(value: string | null, label: string): Decimal | null {
  return decimalOrNull(value, label, new Decimal(0), new Decimal(1))
}

function confidenceOrNull(value: string | null): Decimal | null {
  return decimalOrNull(value, "Evidence confidence", new Decimal(0), new Decimal(100))
}

function canonical(value: Decimal | null): string | null {
  if (value === null) return null
  const rounded = value.toDecimalPlaces(POSITION_SIZING_WEIGHT_SCALE, Decimal.ROUND_HALF_UP)
  return rounded.toFixed().replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1")
}

function baseAssessment(input: PositionSizingInput): Omit<PositionSizingAssessment, "assessmentState" | "suggestedTargetWeight" | "suggestedMinimumWeight" | "suggestedMaximumWeight" | "recommendedAction" | "reasonCodes" | "rationale"> {
  return {
    engineVersion: POSITION_SIZING_ENGINE_VERSION,
    portfolioId: input.portfolioId,
    securityId: input.securityId,
    currentWeight: input.currentWeight,
    evidenceCoverage: input.recommendation.scoreReadyCoverage,
    evidenceConfidence: input.recommendation.evidenceConfidence,
    sourceScoreRunId: input.recommendation.scoreRunId,
    sourceRecommendationRunId: input.recommendation.recommendationRunId,
  }
}

function stopped(
  input: PositionSizingInput,
  state: Exclude<PositionSizingAssessmentState, "READY">,
  reasonCodes: readonly PositionSizingReasonCode[],
  rationale: readonly string[],
): PositionSizingAssessment {
  return {
    ...baseAssessment(input),
    assessmentState: state,
    suggestedTargetWeight: null,
    suggestedMinimumWeight: null,
    suggestedMaximumWeight: null,
    recommendedAction: null,
    reasonCodes,
    rationale,
  }
}

function addOwnerComparisonReasons(
  owner: PositionSizingOwnerContext,
  minimum: Decimal,
  maximum: Decimal,
  reasonCodes: PositionSizingReasonCode[],
  rationale: string[],
) {
  const target = weightOrNull(owner.targetWeight, "Owner target weight")
  const ownerMinimum = weightOrNull(owner.minimumWeight, "Owner minimum weight")
  const ownerMaximum = weightOrNull(owner.maximumWeight, "Owner maximum weight")

  if (target !== null) {
    if (target.lt(minimum)) {
      reasonCodes.push("OWNER_TARGET_BELOW_ENGINE_RANGE")
      rationale.push(`Owner target ${canonical(target)}% is below the deterministic engine range.`)
    } else if (target.gt(maximum)) {
      reasonCodes.push("OWNER_TARGET_ABOVE_ENGINE_RANGE")
      rationale.push(`Owner target ${canonical(target)}% is above the deterministic engine range.`)
    } else {
      reasonCodes.push("OWNER_TARGET_WITHIN_ENGINE_RANGE")
      rationale.push(`Owner target ${canonical(target)}% is within the deterministic engine range.`)
    }
  }

  if (ownerMinimum !== null && ownerMinimum.gt(maximum)) {
    reasonCodes.push("OWNER_MINIMUM_ABOVE_ENGINE_RANGE")
    rationale.push(`Owner minimum ${canonical(ownerMinimum)}% is above the deterministic engine range.`)
  }
  if (ownerMaximum !== null && ownerMaximum.lt(minimum)) {
    reasonCodes.push("OWNER_MAXIMUM_BELOW_ENGINE_RANGE")
    rationale.push(`Owner maximum ${canonical(ownerMaximum)}% is below the deterministic engine range.`)
  }
}

/**
 * D35B reference sizing contract.
 *
 * V1 deliberately does not recreate Quality/Growth/Valuation/Risk calculations. It consumes
 * the versioned recommendation/score lineage and validated upstream weight guidance, then
 * makes the portfolio-position decision deterministically. Missing prerequisites fail closed.
 * Owner settings are comparison context only; this function never mutates or treats them as
 * PortfolioAI-generated targets.
 */
export function assessPositionSizingV1(input: PositionSizingInput): PositionSizingAssessment {
  if (input.assetClass.toUpperCase() !== "EQUITY") {
    return stopped(input, "NOT_APPLICABLE", ["ASSET_CLASS_NOT_EQUITY"], [
      `Asset class ${input.assetClass || "UNKNOWN"} is outside the equity position-sizing contract.`,
    ])
  }

  if (!input.recommendation.recommendationRunId) {
    return stopped(input, "BLOCKED_PREREQUISITE", ["MISSING_SOURCE_RECOMMENDATION"], [
      "A persisted upstream recommendation run is required before position sizing can be assessed.",
    ])
  }
  if (!input.recommendation.scoreRunId) {
    return stopped(input, "BLOCKED_PREREQUISITE", ["MISSING_SOURCE_SCORE"], [
      "A persisted deterministic score run is required for sizing lineage.",
    ])
  }
  if (input.recommendation.suggestedRole === "INSUFFICIENT") {
    return stopped(input, "BLOCKED_PREREQUISITE", ["UPSTREAM_RECOMMENDATION_INSUFFICIENT"], [
      "The upstream recommendation is explicitly insufficient, so D35B does not manufacture a sizing range.",
    ])
  }
  if (input.recommendation.transitionStatus === "EVIDENCE_PENDING") {
    return stopped(input, "BLOCKED_PREREQUISITE", ["UPSTREAM_RECOMMENDATION_EVIDENCE_PENDING"], [
      "The upstream recommendation is waiting for sufficient evidence.",
    ])
  }

  const coverage = coverageOrNull(input.recommendation.scoreReadyCoverage, "Score-ready coverage")
  const minimumCoverage = coverageOrNull(input.minimumScoreReadyCoverage, "Minimum score-ready coverage")
  if (coverage === null) {
    return stopped(input, "INSUFFICIENT_EVIDENCE", ["MISSING_SCORE_COVERAGE"], [
      "Score-ready coverage is unavailable, so D35B fails closed.",
    ])
  }
  if (minimumCoverage === null) throw new Error("Minimum score-ready coverage is required.")
  if (coverage.lt(minimumCoverage)) {
    return stopped(input, "INSUFFICIENT_EVIDENCE", ["SCORE_COVERAGE_BELOW_POLICY"], [
      `Score-ready coverage ${canonical(coverage)} is below the policy minimum ${canonical(minimumCoverage)}.`,
    ])
  }

  confidenceOrNull(input.recommendation.evidenceConfidence)

  if (input.recommendation.suggestedWeightMinimum === null || input.recommendation.suggestedWeightMaximum === null) {
    return stopped(input, "INSUFFICIENT_EVIDENCE", ["MISSING_WEIGHT_GUIDANCE"], [
      "Validated upstream minimum and maximum weight guidance is required; no default range is substituted.",
    ])
  }

  const minimum = weightOrNull(input.recommendation.suggestedWeightMinimum, "Suggested minimum weight")
  const maximum = weightOrNull(input.recommendation.suggestedWeightMaximum, "Suggested maximum weight")
  if (minimum === null || maximum === null || minimum.gt(maximum)) {
    return stopped(input, "INSUFFICIENT_EVIDENCE", ["INVALID_WEIGHT_GUIDANCE"], [
      "The upstream suggested weight range is invalid and cannot be used for sizing.",
    ])
  }

  const currentWeight = weightOrNull(input.currentWeight, "Current weight")
  if (currentWeight === null) {
    return stopped(input, "INSUFFICIENT_EVIDENCE", ["MISSING_CURRENT_WEIGHT"], [
      "Current portfolio weight is unavailable, so a position action cannot be determined.",
    ])
  }

  if (!input.recommendation.actionBias) {
    return stopped(input, "BLOCKED_PREREQUISITE", ["MISSING_SOURCE_RECOMMENDATION"], [
      "The persisted upstream recommendation does not contain an action bias.",
    ])
  }

  const target = minimum.plus(maximum).dividedBy(2).toDecimalPlaces(POSITION_SIZING_WEIGHT_SCALE, Decimal.ROUND_HALF_UP)
  const reasonCodes: PositionSizingReasonCode[] = []
  const rationale: string[] = []
  let action: PositionSizingAction

  if (input.owner.isFrozen) {
    action = "FREEZE"
    reasonCodes.push("OWNER_POSITION_FROZEN")
    rationale.push("The owner has frozen this position; D35B preserves that human control instead of proposing a trade action.")
  } else if (input.recommendation.actionBias === "EXIT_CANDIDATE") {
    action = "EXIT_REVIEW"
    reasonCodes.push("EXIT_REQUIRES_THESIS_REVIEW")
    rationale.push("The upstream recommendation flags an exit candidate; position sizing escalates to EXIT REVIEW and never converts sizing alone into an automatic exit.")
  } else if (currentWeight.gt(maximum)) {
    action = "REDUCE"
    reasonCodes.push("CURRENT_WEIGHT_ABOVE_RANGE")
    rationale.push(`Current weight ${canonical(currentWeight)}% is above the deterministic ${canonical(minimum)}–${canonical(maximum)}% range.`)
    if (input.recommendation.actionBias === "REDUCE") reasonCodes.push("UPSTREAM_REDUCE")
  } else if (currentWeight.lt(minimum) && input.recommendation.actionBias === "ACCUMULATE") {
    action = "ADD"
    reasonCodes.push("CURRENT_WEIGHT_BELOW_RANGE", "UPSTREAM_ACCUMULATE")
    rationale.push(`Current weight ${canonical(currentWeight)}% is below the deterministic ${canonical(minimum)}–${canonical(maximum)}% range and the upstream bias is ACCUMULATE.`)
  } else {
    action = "HOLD"
    reasonCodes.push(currentWeight.lt(minimum) ? "CURRENT_WEIGHT_BELOW_RANGE" : "CURRENT_WEIGHT_WITHIN_RANGE")
    if (input.recommendation.actionBias === "ACCUMULATE") reasonCodes.push("UPSTREAM_ACCUMULATE")
    else if (input.recommendation.actionBias === "REDUCE") reasonCodes.push("UPSTREAM_REDUCE")
    else reasonCodes.push("UPSTREAM_HOLD_OR_WAIT")
    rationale.push(
      currentWeight.lt(minimum)
        ? `Current weight ${canonical(currentWeight)}% is below the deterministic range, but the upstream action bias does not support an ADD action.`
        : `Current weight ${canonical(currentWeight)}% is within the deterministic ${canonical(minimum)}–${canonical(maximum)}% range.`,
    )
  }

  addOwnerComparisonReasons(input.owner, minimum, maximum, reasonCodes, rationale)

  return {
    ...baseAssessment(input),
    assessmentState: "READY",
    currentWeight: canonical(currentWeight),
    suggestedTargetWeight: canonical(target),
    suggestedMinimumWeight: canonical(minimum),
    suggestedMaximumWeight: canonical(maximum),
    recommendedAction: action,
    evidenceCoverage: canonical(coverage),
    evidenceConfidence: canonical(confidenceOrNull(input.recommendation.evidenceConfidence)),
    reasonCodes,
    rationale,
  }
}
