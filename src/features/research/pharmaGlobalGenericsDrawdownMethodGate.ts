export const PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE_VERSION =
  "PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE_V1_PROPOSAL" as const

export type PharmaGlobalGenericsDrawdownCandidateMethod =
  | "ABSOLUTE_BANDS"
  | "SAME_SUBPROFILE_PEER_RELATIVE"
  | "BENCHMARK_RELATIVE"
  | "SELF_HISTORY_RELATIVE"
  | "HYBRID_EXPLICITLY_VERSIONED"

export interface PharmaGlobalGenericsDrawdownMethodGateContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "RISK"
  readonly metricCode: "MAX_DRAWDOWN_1Y"
  readonly upstreamDefinition: "TRAILING_1Y_MAX_PEAK_TO_TROUGH_DAILY_CLOSE"
  readonly candidateMethods: readonly PharmaGlobalGenericsDrawdownCandidateMethod[]
  readonly approvedMethod: null
  readonly methodRequirements: {
    readonly absoluteBandsRequireEmpiricalPharmaEvidence: true
    readonly peerRelativeRequiresReviewedSamePrimaryCohort: true
    readonly benchmarkRelativeRequiresApprovedPharmaBenchmark: true
    readonly selfHistoryRequiresSufficientComparableHistory: true
    readonly hybridRequiresExplicitVersionedWeights: true
  }
  readonly prohibitedDefaults: {
    readonly bankNbfcBandsInherited: false
    readonly zeroToNeutralSubstitutionAllowed: false
    readonly genericSectorPercentileWithoutReviewedCohortAllowed: false
    readonly silentBenchmarkSelectionAllowed: false
    readonly hiddenHybridWeightingAllowed: false
  }
  readonly numericDrawdownCurveReady: false
  readonly wholeRiskDimensionReady: false
  readonly ownerApprovalRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE:
  PharmaGlobalGenericsDrawdownMethodGateContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "RISK",
    metricCode: "MAX_DRAWDOWN_1Y",
    upstreamDefinition: "TRAILING_1Y_MAX_PEAK_TO_TROUGH_DAILY_CLOSE",
    candidateMethods: [
      "ABSOLUTE_BANDS",
      "SAME_SUBPROFILE_PEER_RELATIVE",
      "BENCHMARK_RELATIVE",
      "SELF_HISTORY_RELATIVE",
      "HYBRID_EXPLICITLY_VERSIONED",
    ],
    approvedMethod: null,
    methodRequirements: {
      absoluteBandsRequireEmpiricalPharmaEvidence: true,
      peerRelativeRequiresReviewedSamePrimaryCohort: true,
      benchmarkRelativeRequiresApprovedPharmaBenchmark: true,
      selfHistoryRequiresSufficientComparableHistory: true,
      hybridRequiresExplicitVersionedWeights: true,
    },
    prohibitedDefaults: {
      bankNbfcBandsInherited: false,
      zeroToNeutralSubstitutionAllowed: false,
      genericSectorPercentileWithoutReviewedCohortAllowed: false,
      silentBenchmarkSelectionAllowed: false,
      hiddenHybridWeightingAllowed: false,
    },
    numericDrawdownCurveReady: false,
    wholeRiskDimensionReady: false,
    ownerApprovalRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export interface PharmaGlobalGenericsDrawdownMethodReadinessInput {
  readonly empiricalPharmaBandEvidenceAvailable: boolean
  readonly reviewedSamePrimaryPeerCohortAvailable: boolean
  readonly approvedPharmaBenchmarkAvailable: boolean
  readonly sufficientComparableSelfHistoryAvailable: boolean
}

export interface PharmaGlobalGenericsDrawdownMethodReadiness {
  readonly eligibleMethods: readonly PharmaGlobalGenericsDrawdownCandidateMethod[]
  readonly approvedMethod: null
  readonly ownerApprovalRequired: true
  readonly numericDrawdownCurveReady: false
}

export function assessGlobalGenericsDrawdownMethodReadiness(
  input: PharmaGlobalGenericsDrawdownMethodReadinessInput,
): PharmaGlobalGenericsDrawdownMethodReadiness {
  const eligibleMethods: PharmaGlobalGenericsDrawdownCandidateMethod[] = []

  if (input.empiricalPharmaBandEvidenceAvailable) eligibleMethods.push("ABSOLUTE_BANDS")
  if (input.reviewedSamePrimaryPeerCohortAvailable) eligibleMethods.push("SAME_SUBPROFILE_PEER_RELATIVE")
  if (input.approvedPharmaBenchmarkAvailable) eligibleMethods.push("BENCHMARK_RELATIVE")
  if (input.sufficientComparableSelfHistoryAvailable) eligibleMethods.push("SELF_HISTORY_RELATIVE")

  if (eligibleMethods.length >= 2) {
    eligibleMethods.push("HYBRID_EXPLICITLY_VERSIONED")
  }

  return {
    eligibleMethods,
    approvedMethod: null,
    ownerApprovalRequired: true,
    numericDrawdownCurveReady: false,
  }
}
