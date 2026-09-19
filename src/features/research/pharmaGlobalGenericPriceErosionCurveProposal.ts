export const PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE_VERSION =
  "PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE_V1_PROPOSAL" as const

export interface PharmaGlobalGenericPriceErosionBand {
  readonly minimumInclusive?: number
  readonly maximumExclusive?: number
  readonly score: number
}

export interface PharmaGlobalGenericPriceErosionCurveProposal {
  readonly proposalVersion: typeof PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly metricCode: "PHARMA_US_GENERIC_PRICE_EROSION"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "GROWTH"
  readonly lowerIsBetter: true
  readonly evidenceBoundary: {
    readonly disclosedAspOrPriceEvidenceRequired: true
    readonly residualDerivationFromRevenueAndVolumeAllowed: false
    readonly minimumComparableQuarters: 4
    readonly preferredComparableQuarters: 8
    readonly latestPeriodRequired: true
  }
  readonly components: {
    readonly level: {
      readonly weight: 70
      readonly statistic: "MEDIAN_LATEST_4_COMPARABLE_PRICE_EROSION_PERCENT"
      readonly bands: readonly PharmaGlobalGenericPriceErosionBand[]
    }
    readonly trend: {
      readonly weight: 30
      readonly statistic: "LATEST_MINUS_MEDIAN_PRIOR_3_PERCENTAGE_POINTS"
      readonly lowerIsBetter: true
      readonly bands: readonly PharmaGlobalGenericPriceErosionBand[]
    }
  }
  readonly finalScore: "WEIGHTED_COMPONENT_AVERAGE_0_TO_100"
  readonly unsupportedPrimarySubprofilesFailClosed: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE: PharmaGlobalGenericPriceErosionCurveProposal = {
  proposalVersion: PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE_VERSION,
  state: "PROPOSAL_ONLY",
  metricCode: "PHARMA_US_GENERIC_PRICE_EROSION",
  supportedPrimarySubprofile: "GLOBAL_GENERICS",
  canonicalDimension: "GROWTH",
  lowerIsBetter: true,
  evidenceBoundary: {
    disclosedAspOrPriceEvidenceRequired: true,
    residualDerivationFromRevenueAndVolumeAllowed: false,
    minimumComparableQuarters: 4,
    preferredComparableQuarters: 8,
    latestPeriodRequired: true,
  },
  components: {
    level: {
      weight: 70,
      statistic: "MEDIAN_LATEST_4_COMPARABLE_PRICE_EROSION_PERCENT",
      bands: [
        { maximumExclusive: 0, score: 100 },
        { minimumInclusive: 0, maximumExclusive: 3, score: 85 },
        { minimumInclusive: 3, maximumExclusive: 5, score: 70 },
        { minimumInclusive: 5, maximumExclusive: 8, score: 55 },
        { minimumInclusive: 8, maximumExclusive: 12, score: 35 },
        { minimumInclusive: 12, score: 15 },
      ],
    },
    trend: {
      weight: 30,
      statistic: "LATEST_MINUS_MEDIAN_PRIOR_3_PERCENTAGE_POINTS",
      lowerIsBetter: true,
      bands: [
        { maximumExclusive: -3, score: 100 },
        { minimumInclusive: -3, maximumExclusive: 0, score: 80 },
        { minimumInclusive: 0, maximumExclusive: 3, score: 60 },
        { minimumInclusive: 3, maximumExclusive: 6, score: 40 },
        { minimumInclusive: 6, score: 20 },
      ],
    },
  },
  finalScore: "WEIGHTED_COMPONENT_AVERAGE_0_TO_100",
  unsupportedPrimarySubprofilesFailClosed: true,
  activationApproved: false,
  scoreExecutionEnabled: false,
}
