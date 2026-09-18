export const PHARMA_MOMENTUM_CURVE_PROPOSAL_VERSION =
  "PHARMA_MARKET_MOMENTUM_CURVE_V1_PROPOSAL" as const

export interface PharmaMomentumCurveProposal {
  readonly proposalVersion: typeof PHARMA_MOMENTUM_CURVE_PROPOSAL_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly canonicalDimension: "MOMENTUM"
  readonly parentMetricContractState: "MISSING_DEDICATED_PHARMA_PARENT_CONTRACT"
  readonly parentContractRequiredBeforeActivation: true
  readonly marketEvidence: {
    readonly candidateMetrics: readonly [
      "PRICE_MOMENTUM_12M",
      "PRICE_MOMENTUM_6M",
      "RELATIVE_STRENGTH_12M",
    ]
    readonly rawAuthority: "MARKET_PRICE_HISTORY"
    readonly derivedEvidenceStore: "MARKET_METRIC_OBSERVATIONS"
    readonly absoluteMomentumDefinition: "CLOSE_TO_CLOSE_RETURN_WITH_14_DAY_LOOKBACK_TOLERANCE"
    readonly relativeStrengthDefinition: "STOCK_RETURN_MINUS_APPROVED_BENCHMARK_RETURN"
  }
  readonly methodologyShape: {
    readonly components: readonly [
      "ABSOLUTE_MOMENTUM_12M",
      "ABSOLUTE_MOMENTUM_6M",
      "BENCHMARK_RELATIVE_STRENGTH_12M",
    ]
    readonly componentWeightsState: "UNAPPROVED"
    readonly absoluteMomentumBandsState: "UNAPPROVED"
    readonly relativeStrengthBandsState: "UNAPPROVED"
  }
  readonly bankPilotSeparation: {
    readonly bankTwelveMonthWeightInherited: false
    readonly bankSixMonthWeightInherited: false
    readonly niftyBankBenchmarkInherited: false
    readonly trendlyneTechnicalScoreAllowed: false
  }
  readonly benchmarkContractState: "PHARMA_BENCHMARK_UNAPPROVED"
  readonly benchmarkRequiredBeforeRelativeStrengthScoring: true
  readonly missingRelativeStrengthMayBecomeNeutral: false
  readonly numericCurveReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_MOMENTUM_CURVE_PROPOSAL: PharmaMomentumCurveProposal = {
  proposalVersion: PHARMA_MOMENTUM_CURVE_PROPOSAL_VERSION,
  state: "PROPOSAL_ONLY",
  canonicalDimension: "MOMENTUM",
  parentMetricContractState: "MISSING_DEDICATED_PHARMA_PARENT_CONTRACT",
  parentContractRequiredBeforeActivation: true,
  marketEvidence: {
    candidateMetrics: [
      "PRICE_MOMENTUM_12M",
      "PRICE_MOMENTUM_6M",
      "RELATIVE_STRENGTH_12M",
    ],
    rawAuthority: "MARKET_PRICE_HISTORY",
    derivedEvidenceStore: "MARKET_METRIC_OBSERVATIONS",
    absoluteMomentumDefinition: "CLOSE_TO_CLOSE_RETURN_WITH_14_DAY_LOOKBACK_TOLERANCE",
    relativeStrengthDefinition: "STOCK_RETURN_MINUS_APPROVED_BENCHMARK_RETURN",
  },
  methodologyShape: {
    components: [
      "ABSOLUTE_MOMENTUM_12M",
      "ABSOLUTE_MOMENTUM_6M",
      "BENCHMARK_RELATIVE_STRENGTH_12M",
    ],
    componentWeightsState: "UNAPPROVED",
    absoluteMomentumBandsState: "UNAPPROVED",
    relativeStrengthBandsState: "UNAPPROVED",
  },
  bankPilotSeparation: {
    bankTwelveMonthWeightInherited: false,
    bankSixMonthWeightInherited: false,
    niftyBankBenchmarkInherited: false,
    trendlyneTechnicalScoreAllowed: false,
  },
  benchmarkContractState: "PHARMA_BENCHMARK_UNAPPROVED",
  benchmarkRequiredBeforeRelativeStrengthScoring: true,
  missingRelativeStrengthMayBecomeNeutral: false,
  numericCurveReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}
