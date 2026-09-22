export const PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_VERSION =
  "PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_V1_OWNER_APPROVED" as const

export interface PharmaDomesticValuationCombinedScoreContract {
  readonly contractVersion: typeof PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_VERSION
  readonly state: "OWNER_APPROVED_NOT_ACTIVE"
  readonly supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly canonicalDimension: "VALUATION"
  readonly parentDimensionWeightPercent: 12
  readonly requiredComponents: readonly [
    "SELF_HISTORY_RELATIVE_VALUATION",
    "PEER_RELATIVE_VALUATION",
    "CASH_FLOW_CORROBORATION",
  ]
  readonly method: "WEIGHTED_MEAN"
  readonly weights: {
    readonly selfHistory: 0.4
    readonly peerRelative: 0.4
    readonly cashFlowCorroboration: 0.2
  }
  readonly upstreamAssumptions: {
    readonly peerRelativeContract: "PHARMA_DOMESTIC_PEER_COMBINED_SCORE_V1_OWNER_APPROVED"
    readonly peerRelativePeWeight: 0.5
    readonly peerRelativeEvEbitdaWeight: 0.5
    readonly crossReference: "G6.15_TO_G6.17"
  }
  readonly rationale: {
    readonly selfHistoryAndPeerCoEqualPrimaryLenses: true
    readonly fcfIsCorroborationNotStandaloneVerdict: true
    readonly fcfVolatilityCanReflectWorkingCapitalCapexOrLaunchTiming: true
  }
  readonly revisitTriggers: readonly [
    {
      readonly code: "PERSISTENT_THREE_COMPONENT_DISAGREEMENT"
      readonly automaticNumericThresholdApproved: false
      readonly action: "METHODOLOGY_REVIEW_REQUIRED"
    },
    {
      readonly code: "FCF_STRUCTURAL_DISTORTION_CAPEX_OR_M_AND_A_CYCLE"
      readonly action: "METHODOLOGY_REVIEW_REQUIRED"
    },
    {
      readonly code: "PEER_COMPARABILITY_MATERIALLY_CHANGES"
      readonly direction: "WEAKER_OR_STRONGER"
      readonly action: "METHODOLOGY_REVIEW_REQUIRED"
    },
  ]
  readonly missingComponentRenormalizationAllowed: false
  readonly hiddenReweightingAllowed: false
  readonly combinedValuationScoreReady: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
  readonly persistedScoreRunEnabled: false
}

export const PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE: PharmaDomesticValuationCombinedScoreContract = {
  contractVersion: PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_VERSION,
  state: "OWNER_APPROVED_NOT_ACTIVE",
  supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS",
  canonicalDimension: "VALUATION",
  parentDimensionWeightPercent: 12,
  requiredComponents: [
    "SELF_HISTORY_RELATIVE_VALUATION",
    "PEER_RELATIVE_VALUATION",
    "CASH_FLOW_CORROBORATION",
  ],
  method: "WEIGHTED_MEAN",
  weights: {
    selfHistory: 0.4,
    peerRelative: 0.4,
    cashFlowCorroboration: 0.2,
  },
  upstreamAssumptions: {
    peerRelativeContract: "PHARMA_DOMESTIC_PEER_COMBINED_SCORE_V1_OWNER_APPROVED",
    peerRelativePeWeight: 0.5,
    peerRelativeEvEbitdaWeight: 0.5,
    crossReference: "G6.15_TO_G6.17",
  },
  rationale: {
    selfHistoryAndPeerCoEqualPrimaryLenses: true,
    fcfIsCorroborationNotStandaloneVerdict: true,
    fcfVolatilityCanReflectWorkingCapitalCapexOrLaunchTiming: true,
  },
  revisitTriggers: [
    {
      code: "PERSISTENT_THREE_COMPONENT_DISAGREEMENT",
      automaticNumericThresholdApproved: false,
      action: "METHODOLOGY_REVIEW_REQUIRED",
    },
    {
      code: "FCF_STRUCTURAL_DISTORTION_CAPEX_OR_M_AND_A_CYCLE",
      action: "METHODOLOGY_REVIEW_REQUIRED",
    },
    {
      code: "PEER_COMPARABILITY_MATERIALLY_CHANGES",
      direction: "WEAKER_OR_STRONGER",
      action: "METHODOLOGY_REVIEW_REQUIRED",
    },
  ],
  missingComponentRenormalizationAllowed: false,
  hiddenReweightingAllowed: false,
  combinedValuationScoreReady: true,
  activationApproved: false,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
}

export interface PharmaDomesticValuationCombinedScoreInput {
  readonly selfHistoryScore: number | null
  readonly peerRelativeScore: number | null
  readonly cashFlowCorroborationScore: number | null
}

export interface PharmaDomesticValuationCombinedScoreResult {
  readonly state: "READY" | "INSUFFICIENT_EVIDENCE"
  readonly combinedScore: number | null
  readonly selfHistoryWeight: 0.4
  readonly peerRelativeWeight: 0.4
  readonly cashFlowCorroborationWeight: 0.2
}

function validScore(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function combineDomesticValuationScores(
  input: PharmaDomesticValuationCombinedScoreInput,
): PharmaDomesticValuationCombinedScoreResult {
  if (
    !validScore(input.selfHistoryScore)
    || !validScore(input.peerRelativeScore)
    || !validScore(input.cashFlowCorroborationScore)
  ) {
    return {
      state: "INSUFFICIENT_EVIDENCE",
      combinedScore: null,
      selfHistoryWeight: 0.4,
      peerRelativeWeight: 0.4,
      cashFlowCorroborationWeight: 0.2,
    }
  }

  return {
    state: "READY",
    combinedScore:
      input.selfHistoryScore * 0.4
      + input.peerRelativeScore * 0.4
      + input.cashFlowCorroborationScore * 0.2,
    selfHistoryWeight: 0.4,
    peerRelativeWeight: 0.4,
    cashFlowCorroborationWeight: 0.2,
  }
}
