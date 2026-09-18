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
