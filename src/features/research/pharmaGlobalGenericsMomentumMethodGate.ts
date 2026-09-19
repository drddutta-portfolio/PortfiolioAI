import { PHARMA_MOMENTUM_CURVE_PROPOSAL } from "./pharmaMomentumCurveProposal"

export const PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE_VERSION =
  "PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE_V1_PROPOSAL" as const

export interface PharmaGlobalGenericsMomentumMethodGateContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "MOMENTUM"
  readonly parentMetricContractState: typeof PHARMA_MOMENTUM_CURVE_PROPOSAL.parentMetricContractState
  readonly parentContractRequiredBeforeActivation: true
  readonly benchmarkContractState: typeof PHARMA_MOMENTUM_CURVE_PROPOSAL.benchmarkContractState
  readonly benchmarkRequiredBeforeRelativeStrengthScoring: true
  readonly reusableEvidenceShape: {
    readonly absoluteMomentum12mRequired: true
    readonly absoluteMomentum6mRequired: true
    readonly benchmarkRelativeStrength12mRequired: true
    readonly rawAuthority: "MARKET_PRICE_HISTORY"
    readonly derivedEvidenceStore: "MARKET_METRIC_OBSERVATIONS"
    readonly absoluteMomentumDefinition: "CLOSE_TO_CLOSE_RETURN_WITH_14_DAY_LOOKBACK_TOLERANCE"
    readonly relativeStrengthDefinition: "STOCK_RETURN_MINUS_APPROVED_BENCHMARK_RETURN"
  }
  readonly globalGenericsSpecificDecisions: {
    readonly componentWeightsApproved: false
    readonly absoluteMomentumBandsApproved: false
    readonly relativeStrengthBandsApproved: false
    readonly approvedBenchmark: null
    readonly finalAggregationApproved: false
  }
  readonly bankPilotSeparation: {
    readonly bankTwelveMonthWeightInherited: false
    readonly bankSixMonthWeightInherited: false
    readonly niftyBankBenchmarkInherited: false
    readonly trendlyneTechnicalScoreAllowed: false
  }
  readonly missingRelativeStrengthMayBecomeNeutral: false
  readonly numericMomentumCurveReady: false
  readonly ownerApprovalRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE:
  PharmaGlobalGenericsMomentumMethodGateContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "MOMENTUM",
    parentMetricContractState: PHARMA_MOMENTUM_CURVE_PROPOSAL.parentMetricContractState,
    parentContractRequiredBeforeActivation: true,
    benchmarkContractState: PHARMA_MOMENTUM_CURVE_PROPOSAL.benchmarkContractState,
    benchmarkRequiredBeforeRelativeStrengthScoring: true,
    reusableEvidenceShape: {
      absoluteMomentum12mRequired: true,
      absoluteMomentum6mRequired: true,
      benchmarkRelativeStrength12mRequired: true,
      rawAuthority: "MARKET_PRICE_HISTORY",
      derivedEvidenceStore: "MARKET_METRIC_OBSERVATIONS",
      absoluteMomentumDefinition: "CLOSE_TO_CLOSE_RETURN_WITH_14_DAY_LOOKBACK_TOLERANCE",
      relativeStrengthDefinition: "STOCK_RETURN_MINUS_APPROVED_BENCHMARK_RETURN",
    },
    globalGenericsSpecificDecisions: {
      componentWeightsApproved: false,
      absoluteMomentumBandsApproved: false,
      relativeStrengthBandsApproved: false,
      approvedBenchmark: null,
      finalAggregationApproved: false,
    },
    bankPilotSeparation: {
      bankTwelveMonthWeightInherited: false,
      bankSixMonthWeightInherited: false,
      niftyBankBenchmarkInherited: false,
      trendlyneTechnicalScoreAllowed: false,
    },
    missingRelativeStrengthMayBecomeNeutral: false,
    numericMomentumCurveReady: false,
    ownerApprovalRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }
