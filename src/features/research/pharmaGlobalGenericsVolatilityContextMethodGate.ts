export const PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE_VERSION =
  "PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE_V1_PROPOSAL" as const

export type PharmaGlobalGenericsVolatilityContextMethod =
  | "SAME_SUBPROFILE_PEER_RELATIVE"
  | "BENCHMARK_RELATIVE"
  | "SELF_HISTORY_WITH_EXTERNAL_CONTEXT"
  | "HYBRID_EXPLICITLY_VERSIONED"

export interface PharmaGlobalGenericsVolatilityContextMethodGateContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "RISK"
  readonly metricCode: "VOLATILITY_1Y"
  readonly upstreamDefinition: "ANNUALIZED_SAMPLE_STDDEV_DAILY_LOG_RETURNS_SQRT_252"
  readonly contextRequired: true
  readonly standaloneAbsoluteBandsAllowed: false
  readonly candidateMethods: readonly PharmaGlobalGenericsVolatilityContextMethod[]
  readonly approvedMethod: null
  readonly methodRequirements: {
    readonly peerRelativeRequiresReviewedSamePrimaryCohort: true
    readonly benchmarkRelativeRequiresApprovedPharmaBenchmark: true
    readonly selfHistoryRequiresExternalContextCorroboration: true
    readonly hybridRequiresTwoEligibleMethodsAndVersionedWeights: true
  }
  readonly prohibitedDefaults: {
    readonly bankNbfcBandsInherited: false
    readonly absoluteVolatilityOnlyScoringAllowed: false
    readonly genericSectorPeerSetWithoutReviewedPrimaryAllowed: false
    readonly silentBenchmarkSelectionAllowed: false
    readonly hiddenHybridWeightingAllowed: false
    readonly missingEvidenceMayBecomeNeutral: false
  }
  readonly numericVolatilityCurveReady: false
  readonly wholeRiskDimensionReady: false
  readonly ownerApprovalRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE:
  PharmaGlobalGenericsVolatilityContextMethodGateContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "RISK",
    metricCode: "VOLATILITY_1Y",
    upstreamDefinition: "ANNUALIZED_SAMPLE_STDDEV_DAILY_LOG_RETURNS_SQRT_252",
    contextRequired: true,
    standaloneAbsoluteBandsAllowed: false,
    candidateMethods: [
      "SAME_SUBPROFILE_PEER_RELATIVE",
      "BENCHMARK_RELATIVE",
      "SELF_HISTORY_WITH_EXTERNAL_CONTEXT",
      "HYBRID_EXPLICITLY_VERSIONED",
    ],
    approvedMethod: null,
    methodRequirements: {
      peerRelativeRequiresReviewedSamePrimaryCohort: true,
      benchmarkRelativeRequiresApprovedPharmaBenchmark: true,
      selfHistoryRequiresExternalContextCorroboration: true,
      hybridRequiresTwoEligibleMethodsAndVersionedWeights: true,
    },
    prohibitedDefaults: {
      bankNbfcBandsInherited: false,
      absoluteVolatilityOnlyScoringAllowed: false,
      genericSectorPeerSetWithoutReviewedPrimaryAllowed: false,
      silentBenchmarkSelectionAllowed: false,
      hiddenHybridWeightingAllowed: false,
      missingEvidenceMayBecomeNeutral: false,
    },
    numericVolatilityCurveReady: false,
    wholeRiskDimensionReady: false,
    ownerApprovalRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export interface PharmaGlobalGenericsVolatilityContextReadinessInput {
  readonly reviewedSamePrimaryPeerCohortAvailable: boolean
  readonly approvedPharmaBenchmarkAvailable: boolean
  readonly sufficientComparableSelfHistoryAvailable: boolean
  readonly externalContextAvailableForSelfHistory: boolean
}

export interface PharmaGlobalGenericsVolatilityContextReadiness {
  readonly eligibleMethods: readonly PharmaGlobalGenericsVolatilityContextMethod[]
  readonly approvedMethod: null
  readonly ownerApprovalRequired: true
  readonly numericVolatilityCurveReady: false
}

export function assessGlobalGenericsVolatilityContextReadiness(
  input: PharmaGlobalGenericsVolatilityContextReadinessInput,
): PharmaGlobalGenericsVolatilityContextReadiness {
  const eligibleMethods: PharmaGlobalGenericsVolatilityContextMethod[] = []

  if (input.reviewedSamePrimaryPeerCohortAvailable) {
    eligibleMethods.push("SAME_SUBPROFILE_PEER_RELATIVE")
  }

  if (input.approvedPharmaBenchmarkAvailable) {
    eligibleMethods.push("BENCHMARK_RELATIVE")
  }

  if (input.sufficientComparableSelfHistoryAvailable && input.externalContextAvailableForSelfHistory) {
    eligibleMethods.push("SELF_HISTORY_WITH_EXTERNAL_CONTEXT")
  }

  if (eligibleMethods.length >= 2) {
    eligibleMethods.push("HYBRID_EXPLICITLY_VERSIONED")
  }

  return {
    eligibleMethods,
    approvedMethod: null,
    ownerApprovalRequired: true,
    numericVolatilityCurveReady: false,
  }
}
