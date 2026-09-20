export const PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL_VERSION =
  "PHARMA_OPERATING_MARGIN_CURVE_V1_OWNER_APPROVED" as const

export interface PharmaOperatingMarginBand {
  readonly minimumInclusive?: number
  readonly maximumExclusive?: number
  readonly score: number
}

export interface PharmaOperatingMarginCurveProposal {
  readonly proposalVersion: typeof PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL_VERSION
  readonly state: "OWNER_APPROVED_NOT_ACTIVE"
  readonly metricCode: "PHARMA_OPERATING_MARGIN_HISTORY"
  readonly supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly unsupportedPrimarySubprofilesFailClosed: true
  readonly history: {
    readonly minimumComparableQuarters: 8
    readonly preferredComparableQuarters: 12
    readonly latestPeriodRequired: true
    readonly matchedRevenueAndOperatingProfitPeriodsRequired: true
  }
  readonly components: {
    readonly level: {
      readonly weight: 50
      readonly statistic: "MEDIAN_LATEST_8_OPERATING_MARGIN_PERCENT"
      readonly bands: readonly PharmaOperatingMarginBand[]
    }
    readonly stability: {
      readonly weight: 30
      readonly statistic: "INTERQUARTILE_RANGE_LATEST_8_PERCENTAGE_POINTS"
      readonly lowerIsBetter: true
      readonly bands: readonly PharmaOperatingMarginBand[]
    }
    readonly trend: {
      readonly weight: 20
      readonly statistic: "MEDIAN_LATEST_4_MINUS_MEDIAN_PRIOR_4_PERCENTAGE_POINTS"
      readonly bands: readonly PharmaOperatingMarginBand[]
    }
  }
  readonly finalScore: "WEIGHTED_COMPONENT_AVERAGE_0_TO_100"
  readonly methodologyApproved: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL: PharmaOperatingMarginCurveProposal = {
  proposalVersion: PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL_VERSION,
  state: "OWNER_APPROVED_NOT_ACTIVE",
  metricCode: "PHARMA_OPERATING_MARGIN_HISTORY",
  supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS",
  unsupportedPrimarySubprofilesFailClosed: true,
  history: {
    minimumComparableQuarters: 8,
    preferredComparableQuarters: 12,
    latestPeriodRequired: true,
    matchedRevenueAndOperatingProfitPeriodsRequired: true,
  },
  components: {
    level: {
      weight: 50,
      statistic: "MEDIAN_LATEST_8_OPERATING_MARGIN_PERCENT",
      bands: [
        { minimumInclusive: 25, score: 100 },
        { minimumInclusive: 20, maximumExclusive: 25, score: 85 },
        { minimumInclusive: 16, maximumExclusive: 20, score: 70 },
        { minimumInclusive: 12, maximumExclusive: 16, score: 55 },
        { minimumInclusive: 8, maximumExclusive: 12, score: 35 },
        { maximumExclusive: 8, score: 15 },
      ],
    },
    stability: {
      weight: 30,
      statistic: "INTERQUARTILE_RANGE_LATEST_8_PERCENTAGE_POINTS",
      lowerIsBetter: true,
      bands: [
        { maximumExclusive: 2, score: 100 },
        { minimumInclusive: 2, maximumExclusive: 4, score: 80 },
        { minimumInclusive: 4, maximumExclusive: 6, score: 60 },
        { minimumInclusive: 6, maximumExclusive: 9, score: 40 },
        { minimumInclusive: 9, score: 20 },
      ],
    },
    trend: {
      weight: 20,
      statistic: "MEDIAN_LATEST_4_MINUS_MEDIAN_PRIOR_4_PERCENTAGE_POINTS",
      bands: [
        { minimumInclusive: 3, score: 100 },
        { minimumInclusive: 1, maximumExclusive: 3, score: 80 },
        { minimumInclusive: -1, maximumExclusive: 1, score: 60 },
        { minimumInclusive: -3, maximumExclusive: -1, score: 40 },
        { maximumExclusive: -3, score: 20 },
      ],
    },
  },
  finalScore: "WEIGHTED_COMPONENT_AVERAGE_0_TO_100",
  methodologyApproved: true,
  activationApproved: false,
  scoreExecutionEnabled: false,
}


export interface PharmaOperatingMarginCurveStatistics {
  readonly medianLatest8OperatingMarginPercent: number
  readonly interquartileRangeLatest8PercentagePoints: number
  readonly medianLatest4MinusPrior4PercentagePoints: number
}

export interface PharmaOperatingMarginCurveScoreResult {
  readonly proposalVersion: typeof PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL_VERSION
  readonly state: "DETERMINISTIC_OWNER_APPROVED_RESULT"
  readonly levelScore: number
  readonly stabilityScore: number
  readonly trendScore: number
  readonly combinedScore: number
  readonly methodologyApproved: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

function scoreNumericBand(
  value: number,
  bands: readonly PharmaOperatingMarginBand[],
): number {
  if (!Number.isFinite(value)) {
    throw new Error("Operating Margin curve statistic must be finite")
  }
  const band = bands.find((item) =>
    (item.minimumInclusive === undefined || value >= item.minimumInclusive)
    && (item.maximumExclusive === undefined || value < item.maximumExclusive))
  if (!band) throw new Error("Operating Margin curve statistic does not match a score band")
  return band.score
}

export function evaluatePharmaOperatingMarginCurveProposal(
  statistics: PharmaOperatingMarginCurveStatistics,
): PharmaOperatingMarginCurveScoreResult {
  if (statistics.interquartileRangeLatest8PercentagePoints < 0) {
    throw new Error("Operating Margin IQR cannot be negative")
  }

  const levelScore = scoreNumericBand(
    statistics.medianLatest8OperatingMarginPercent,
    PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.components.level.bands,
  )
  const stabilityScore = scoreNumericBand(
    statistics.interquartileRangeLatest8PercentagePoints,
    PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.components.stability.bands,
  )
  const trendScore = scoreNumericBand(
    statistics.medianLatest4MinusPrior4PercentagePoints,
    PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.components.trend.bands,
  )
  const combinedScore =
    levelScore * 0.5
    + stabilityScore * 0.3
    + trendScore * 0.2

  return {
    proposalVersion: PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL_VERSION,
    state: "DETERMINISTIC_OWNER_APPROVED_RESULT",
    levelScore,
    stabilityScore,
    trendScore,
    combinedScore,
    methodologyApproved: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }
}
