import type { PortfolioProfileExposure, RecommendationPolicy } from "../../data/recommendationPolicyRepository"
import type { RecommendationPreview } from "./sectorRecommendation"
import type { SecurityScoringSnapshot } from "./scoringTypes"

export type WeightPosition = "BELOW_RANGE" | "WITHIN_RANGE" | "ABOVE_RANGE" | "ZERO_RANGE" | "UNAVAILABLE"

export interface SuggestedWeightPreview {
  readonly min: number | null
  readonly max: number | null
  readonly currentWeight: number | null
  readonly userTargetWeight: number | null
  readonly position: WeightPosition
  readonly label: string
  readonly reasons: readonly string[]
  readonly portfolioGuardStatus: "APPLIED" | "PENDING_CLASSIFICATION" | "NOT_REQUIRED"
  readonly profileExposure: number | null
  readonly reviewedProfileCoverage: number | null
}

function dim(snapshot: SecurityScoringSnapshot, code: string) {
  return snapshot.dimensions.find((item) => item.dimensionCode === code)?.rawScore ?? null
}

function rangeFor(recommendation: RecommendationPreview, snapshot: SecurityScoringSnapshot, policy: RecommendationPolicy) {
  const weights = policy.weightPolicy
  const score = recommendation.overallScore
  if (recommendation.suggestedRole === "CORE_CANDIDATE") {
    if (score !== null && weights.highConvictionScore !== null && score >= weights.highConvictionScore && weights.core?.high) return [...weights.core.high] as [number, number]
    if (score !== null && weights.cautionScore !== null && score < weights.cautionScore && weights.core?.cautious) return [...weights.core.cautious] as [number, number]
    if (weights.core?.standard) return [...weights.core.standard] as [number, number]
  }
  if (recommendation.suggestedRole === "SATELLITE_CANDIDATE") {
    if (score !== null && weights.cautionScore !== null && score < weights.cautionScore && weights.satellite?.cautious) return [...weights.satellite.cautious] as [number, number]
    if (weights.satellite?.standard) return [...weights.satellite.standard] as [number, number]
  }
  if (recommendation.suggestedRole === "WATCH" && weights.watch) return [...weights.watch] as [number, number]
  if (recommendation.suggestedRole === "AVOID" && weights.avoid) return [...weights.avoid] as [number, number]
  return null
}

function numeric(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function buildSuggestedWeightPreview(input: {
  readonly recommendation: RecommendationPreview
  readonly snapshot: SecurityScoringSnapshot
  readonly policy: RecommendationPolicy
  readonly currentWeight: string | number | null
  readonly userTargetWeight: string | number | null
  readonly exposure: PortfolioProfileExposure | null
}): SuggestedWeightPreview {
  const currentWeight = numeric(input.currentWeight)
  const userTargetWeight = numeric(input.userTargetWeight)
  const base = rangeFor(input.recommendation, input.snapshot, input.policy)
  if (!base) {
    return { min: null, max: null, currentWeight, userTargetWeight, position: "UNAVAILABLE", label: "Pending", reasons: ["Weight thresholds are not validated for this sector profile yet."], portfolioGuardStatus: "NOT_REQUIRED", profileExposure: null, reviewedProfileCoverage: input.exposure?.reviewedAssignmentCoverage ?? null }
  }

  let [min, max] = base
  const reasons: string[] = [`${input.recommendation.sectorProfile} ${input.recommendation.suggestedRole.replaceAll("_", " ").toLocaleLowerCase()} range.`]
  const weights = input.policy.weightPolicy
  const momentum = dim(input.snapshot, "MOMENTUM")
  const risk = dim(input.snapshot, "RISK")

  if (weights.singleStockMax !== null) max = Math.min(max, weights.singleStockMax)
  if (momentum !== null && weights.momentumCautionBelow !== null && momentum < weights.momentumCautionBelow && weights.momentumCap !== null) {
    max = Math.min(max, weights.momentumCap)
    reasons.push(`Weak momentum caps the upper end at ${weights.momentumCap}%.`)
  }
  if (risk !== null && weights.riskCautionBelow !== null && risk < weights.riskCautionBelow && weights.riskCap !== null) {
    max = Math.min(max, weights.riskCap)
    reasons.push(`Risk score caps the upper end at ${weights.riskCap}%.`)
  }

  let portfolioGuardStatus: SuggestedWeightPreview["portfolioGuardStatus"] = "NOT_REQUIRED"
  const coverage = input.exposure?.reviewedAssignmentCoverage ?? 0
  const exposure = input.exposure?.sameProfileWeight ?? 0
  if (weights.profileConcentrationSoftCap !== null) {
    if (coverage >= weights.minProfileCoverageForConcentration) {
      portfolioGuardStatus = "APPLIED"
      const current = currentWeight ?? 0
      const otherProfileWeight = Math.max(0, exposure - current)
      const capacity = Math.max(0, weights.profileConcentrationSoftCap - otherProfileWeight)
      const priorMax = max
      max = Math.min(max, capacity)
      if (max < priorMax) reasons.push(`Portfolio ${input.recommendation.sectorProfile} concentration soft-cap reduces the upper bound to ${max.toFixed(1)}%.`)
      if (weights.profileConcentrationHardCap !== null && otherProfileWeight >= weights.profileConcentrationHardCap) {
        min = 0; max = 0
        reasons.push(`Portfolio profile exposure is already at or above the configured hard concentration cap.`)
      }
    } else {
      portfolioGuardStatus = "PENDING_CLASSIFICATION"
      reasons.push(`Portfolio concentration guard is not applied yet because only ${coverage.toFixed(1)}% of portfolio weight has reviewed scoring-profile assignments.`)
    }
  }

  min = Math.max(0, Math.min(min, max))
  max = Math.max(0, max)
  let position: WeightPosition = "UNAVAILABLE"
  let label = "Suggested range"
  if (min === 0 && max === 0) { position = "ZERO_RANGE"; label = "No allocation suggested" }
  else if (currentWeight !== null) {
    if (currentWeight < min) { position = "BELOW_RANGE"; label = "Below suggested range" }
    else if (currentWeight > max) { position = "ABOVE_RANGE"; label = "Above suggested range" }
    else { position = "WITHIN_RANGE"; label = "Within suggested range" }
  }
  if (userTargetWeight !== null) {
    if (userTargetWeight < min) reasons.push(`Your ${userTargetWeight}% target is below the PortfolioAI range.`)
    else if (userTargetWeight > max) reasons.push(`Your ${userTargetWeight}% target is above the PortfolioAI range.`)
    else reasons.push(`Your ${userTargetWeight}% target sits inside the PortfolioAI range.`)
  }

  return {
    min,
    max,
    currentWeight,
    userTargetWeight,
    position,
    label,
    reasons,
    portfolioGuardStatus,
    profileExposure: input.exposure?.sameProfileWeight ?? null,
    reviewedProfileCoverage: input.exposure?.reviewedAssignmentCoverage ?? null,
  }
}

export function formatWeightRange(preview: SuggestedWeightPreview) {
  if (preview.min === null || preview.max === null) return "Pending"
  if (preview.min === preview.max) return `${preview.min.toFixed(preview.min % 1 ? 1 : 0)}%`
  const format = (value: number) => value.toFixed(value % 1 ? 1 : 0)
  return `${format(preview.min)}–${format(preview.max)}%`
}
