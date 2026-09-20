export const PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION =
  "PHARMA_SEGMENT_GROWTH_CURVE_V1_PROPOSAL" as const

export interface PharmaSegmentGrowthBand {
  readonly minimumInclusive?: number
  readonly maximumExclusive?: number
  readonly score: number
}

export interface PharmaSegmentGrowthCurveProposal {
  readonly proposalVersion: typeof PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly appliesTo: readonly [
    "PHARMA_DOMESTIC_REVENUE_GROWTH",
    "PHARMA_EXPORT_US_REVENUE_GROWTH"
  ]
  readonly history: {
    readonly minimumComparableQuarters: 4
    readonly preferredComparableQuarters: 8
    readonly latestPeriodRequired: true
    readonly rejectedOrScopeIncompatibleClaimsExcluded: true
  }
  readonly components: {
    readonly level: {
      readonly weight: 60
      readonly statistic: "MEDIAN_LATEST_4_COMPARABLE_QUARTERS"
      readonly bands: readonly PharmaSegmentGrowthBand[]
    }
    readonly consistency: {
      readonly weight: 25
      readonly statistic: "POSITIVE_QUARTERS_OUT_OF_LATEST_4"
      readonly scores: Readonly<Record<"0" | "1" | "2" | "3" | "4", number>>
    }
    readonly trend: {
      readonly weight: 15
      readonly statistic: "LATEST_MINUS_MEDIAN_PRIOR_3_PERCENTAGE_POINTS"
      readonly bands: readonly PharmaSegmentGrowthBand[]
    }
  }
  readonly finalScore: "WEIGHTED_COMPONENT_AVERAGE_0_TO_100"
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL: PharmaSegmentGrowthCurveProposal = {
  proposalVersion: PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION,
  state: "PROPOSAL_ONLY",
  appliesTo: [
    "PHARMA_DOMESTIC_REVENUE_GROWTH",
    "PHARMA_EXPORT_US_REVENUE_GROWTH",
  ],
  history: {
    minimumComparableQuarters: 4,
    preferredComparableQuarters: 8,
    latestPeriodRequired: true,
    rejectedOrScopeIncompatibleClaimsExcluded: true,
  },
  components: {
    level: {
      weight: 60,
      statistic: "MEDIAN_LATEST_4_COMPARABLE_QUARTERS",
      bands: [
        { minimumInclusive: 20, score: 100 },
        { minimumInclusive: 15, maximumExclusive: 20, score: 85 },
        { minimumInclusive: 10, maximumExclusive: 15, score: 70 },
        { minimumInclusive: 5, maximumExclusive: 10, score: 55 },
        { minimumInclusive: 0, maximumExclusive: 5, score: 40 },
        { maximumExclusive: 0, score: 20 },
      ],
    },
    consistency: {
      weight: 25,
      statistic: "POSITIVE_QUARTERS_OUT_OF_LATEST_4",
      scores: { "0": 0, "1": 25, "2": 50, "3": 75, "4": 100 },
    },
    trend: {
      weight: 15,
      statistic: "LATEST_MINUS_MEDIAN_PRIOR_3_PERCENTAGE_POINTS",
      bands: [
        { minimumInclusive: 5, score: 100 },
        { minimumInclusive: 0, maximumExclusive: 5, score: 75 },
        { minimumInclusive: -5, maximumExclusive: 0, score: 50 },
        { minimumInclusive: -10, maximumExclusive: -5, score: 25 },
        { maximumExclusive: -10, score: 0 },
      ],
    },
  },
  finalScore: "WEIGHTED_COMPONENT_AVERAGE_0_TO_100",
  activationApproved: false,
  scoreExecutionEnabled: false,
}


export interface PharmaSegmentGrowthCurveStatistics {
  readonly medianLatest4ComparableQuartersPercent: number
  readonly positiveQuartersOutOfLatest4: 0 | 1 | 2 | 3 | 4
  readonly latestMinusMedianPrior3PercentagePoints: number
}

export interface PharmaSegmentGrowthCurveScoreResult {
  readonly proposalVersion: typeof PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION
  readonly state: "DETERMINISTIC_PROPOSAL_RESULT"
  readonly levelScore: number
  readonly consistencyScore: number
  readonly trendScore: number
  readonly combinedScore: number
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

function scoreGrowthBand(
  value: number,
  bands: readonly PharmaSegmentGrowthBand[],
): number {
  if (!Number.isFinite(value)) {
    throw new Error("Segment Growth curve statistic must be finite")
  }
  const band = bands.find((item) =>
    (item.minimumInclusive === undefined || value >= item.minimumInclusive)
    && (item.maximumExclusive === undefined || value < item.maximumExclusive))
  if (!band) throw new Error("Segment Growth curve statistic does not match a score band")
  return band.score
}

export function evaluatePharmaSegmentGrowthCurveProposal(
  statistics: PharmaSegmentGrowthCurveStatistics,
): PharmaSegmentGrowthCurveScoreResult {
  const levelScore = scoreGrowthBand(
    statistics.medianLatest4ComparableQuartersPercent,
    PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.components.level.bands,
  )
  const consistencyScore =
    PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.components.consistency.scores[
      String(statistics.positiveQuartersOutOfLatest4) as "0" | "1" | "2" | "3" | "4"
    ]
  const trendScore = scoreGrowthBand(
    statistics.latestMinusMedianPrior3PercentagePoints,
    PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.components.trend.bands,
  )
  const combinedScore =
    levelScore * 0.6
    + consistencyScore * 0.25
    + trendScore * 0.15

  return {
    proposalVersion: PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION,
    state: "DETERMINISTIC_PROPOSAL_RESULT",
    levelScore,
    consistencyScore,
    trendScore,
    combinedScore,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }
}
