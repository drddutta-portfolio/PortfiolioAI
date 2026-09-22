export const PHARMA_GLOBAL_GENERICS_G10_2_NUMERIC_METHODOLOGY_VERSION =
  "PHARMA_GLOBAL_GENERICS_G10_2_NUMERIC_METHODOLOGY_V1_OWNER_APPROVED" as const

export const PHARMA_GLOBAL_GENERICS_G10_2_NUMERIC_METHODOLOGY = {
  version: PHARMA_GLOBAL_GENERICS_G10_2_NUMERIC_METHODOLOGY_VERSION,
  state: "OWNER_APPROVED_NOT_ACTIVE" as const,
  supportedPrimarySubprofile: "GLOBAL_GENERICS" as const,
  normalizationPolicy: "REVIEWED_REFERENCE_RELATIVE_MEDIAN_V1" as const,
  samePrimaryPeerCohortRequired: true,
  minimumPeerCount: 3,
  componentAggregation: "MEDIAN_NO_HIDDEN_WEIGHTS" as const,
  missingMandatoryComponentTreatment: "FAIL_CLOSED" as const,
  benchmarkCode: "NIFTY_PHARMA" as const,
  commonTenDimensionSpinePreserved: true,
  gateIRecommendationPolicyUnchanged: true,
  domesticBandsInherited: false,
  apiBandsInherited: false,
  bankNbfcBandsInherited: false,
  emergingApiNumericParticipation: false,
  unresolvedBiosimilarsNumericParticipation: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
  positionSizingEnabled: false,
  aiInterpretationEnabled: false,
  methodologyApproved: true,
  scoreExecutionEnabled: false,
} as const

export type PercentileDirection = "HIGHER_BETTER" | "LOWER_BETTER"

function assertFinite(values: readonly number[], label: string) {
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`${label} requires finite values`)
  }
}

export function median(values: readonly number[]): number {
  assertFinite(values, "median")
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2
}

export function scoreReviewedPeerPercentile(input: {
  readonly value: number
  readonly peerValues: readonly number[]
  readonly direction: PercentileDirection
}): number {
  if (!Number.isFinite(input.value)) throw new Error("reference value must be finite")
  assertFinite(input.peerValues, "peer percentile")
  if (input.peerValues.length < PHARMA_GLOBAL_GENERICS_G10_2_NUMERIC_METHODOLOGY.minimumPeerCount) {
    throw new Error("Global Generics peer percentile requires at least three reviewed same-primary peers")
  }

  const all = [...input.peerValues, input.value]
  const betterOrEqual = all.filter((candidate) =>
    input.direction === "HIGHER_BETTER"
      ? input.value >= candidate
      : input.value <= candidate,
  ).length

  return Math.round((betterOrEqual / all.length) * 10000) / 100
}

export function scoreReviewedComponentMedian(
  componentScores: readonly number[],
): number {
  if (!componentScores.length) throw new Error("at least one component score is required")
  if (componentScores.some((score) => !Number.isFinite(score) || score < 0 || score > 100)) {
    throw new Error("component scores must be finite values between 0 and 100")
  }
  return Math.round(median(componentScores) * 10000) / 10000
}

export function evaluatePeerRelativeLevelStabilityTrend(input: {
  readonly level: number
  readonly levelPeers: readonly number[]
  readonly stability: number
  readonly stabilityPeers: readonly number[]
  readonly trend: number
  readonly trendPeers: readonly number[]
  readonly stabilityDirection?: PercentileDirection
}) {
  const levelScore = scoreReviewedPeerPercentile({
    value: input.level,
    peerValues: input.levelPeers,
    direction: "HIGHER_BETTER",
  })
  const stabilityScore = scoreReviewedPeerPercentile({
    value: input.stability,
    peerValues: input.stabilityPeers,
    direction: input.stabilityDirection ?? "LOWER_BETTER",
  })
  const trendScore = scoreReviewedPeerPercentile({
    value: input.trend,
    peerValues: input.trendPeers,
    direction: "HIGHER_BETTER",
  })

  return {
    levelScore,
    stabilityScore,
    trendScore,
    score: scoreReviewedComponentMedian([levelScore, stabilityScore, trendScore]),
  }
}
