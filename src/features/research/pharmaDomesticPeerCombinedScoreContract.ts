export const PHARMA_DOMESTIC_PEER_COMBINED_SCORE_VERSION =
  "PHARMA_DOMESTIC_PEER_COMBINED_SCORE_V1_OWNER_APPROVED" as const

export interface PharmaDomesticPeerCombinedScoreContract {
  readonly contractVersion: typeof PHARMA_DOMESTIC_PEER_COMBINED_SCORE_VERSION
  readonly state: "OWNER_APPROVED_NOT_ACTIVE"
  readonly supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly canonicalDimension: "VALUATION"
  readonly component: "PEER_RELATIVE_VALUATION"
  readonly requiredInputs: readonly ["PE_TTM", "EV_EBITDA"]
  readonly method: "WEIGHTED_MEAN"
  readonly weights: {
    readonly pe: 0.5
    readonly evEbitda: 0.5
  }
  readonly rationale: {
    readonly evidenceForSystematicPreferenceExists: false
    readonly neutralStartingPoint: true
    readonly bothInputsMandatory: true
  }
  readonly revisitTriggers: readonly [
    {
      readonly code: "MATERIAL_PE_EV_SCORE_DIVERGENCE_IN_BACKTEST"
      readonly automaticNumericThresholdApproved: false
      readonly action: "METHODOLOGY_REVIEW_REQUIRED"
    },
    {
      readonly code: "MEANINGFUL_PEER_LEVERAGE_HETEROGENEITY"
      readonly examples: readonly ["M_AND_A_FUNDED_ENTRANT", "MATERIALLY_DIFFERENT_NET_DEBT_PROFILE"]
      readonly action: "METHODOLOGY_REVIEW_REQUIRED"
    },
  ]
  readonly singleMetricFallbackAllowed: false
  readonly hiddenReweightingAllowed: false
  readonly combinedPeerComponentScoreReady: true
  readonly wholeValuationDimensionReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_DOMESTIC_PEER_COMBINED_SCORE: PharmaDomesticPeerCombinedScoreContract = {
  contractVersion: PHARMA_DOMESTIC_PEER_COMBINED_SCORE_VERSION,
  state: "OWNER_APPROVED_NOT_ACTIVE",
  supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS",
  canonicalDimension: "VALUATION",
  component: "PEER_RELATIVE_VALUATION",
  requiredInputs: ["PE_TTM", "EV_EBITDA"],
  method: "WEIGHTED_MEAN",
  weights: {
    pe: 0.5,
    evEbitda: 0.5,
  },
  rationale: {
    evidenceForSystematicPreferenceExists: false,
    neutralStartingPoint: true,
    bothInputsMandatory: true,
  },
  revisitTriggers: [
    {
      code: "MATERIAL_PE_EV_SCORE_DIVERGENCE_IN_BACKTEST",
      automaticNumericThresholdApproved: false,
      action: "METHODOLOGY_REVIEW_REQUIRED",
    },
    {
      code: "MEANINGFUL_PEER_LEVERAGE_HETEROGENEITY",
      examples: ["M_AND_A_FUNDED_ENTRANT", "MATERIALLY_DIFFERENT_NET_DEBT_PROFILE"],
      action: "METHODOLOGY_REVIEW_REQUIRED",
    },
  ],
  singleMetricFallbackAllowed: false,
  hiddenReweightingAllowed: false,
  combinedPeerComponentScoreReady: true,
  wholeValuationDimensionReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}

export interface PharmaDomesticPeerCombinedScoreInput {
  readonly peScore: number | null
  readonly evEbitdaScore: number | null
}

export interface PharmaDomesticPeerCombinedScoreResult {
  readonly state: "READY" | "INSUFFICIENT_EVIDENCE"
  readonly combinedScore: number | null
  readonly peWeight: 0.5
  readonly evEbitdaWeight: 0.5
}

function validNormalizedScore(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function combineDomesticPeerRelativeScores(
  input: PharmaDomesticPeerCombinedScoreInput,
): PharmaDomesticPeerCombinedScoreResult {
  const peValid = validNormalizedScore(input.peScore)
  const evValid = validNormalizedScore(input.evEbitdaScore)

  if (!peValid || !evValid) {
    return {
      state: "INSUFFICIENT_EVIDENCE",
      combinedScore: null,
      peWeight: 0.5,
      evEbitdaWeight: 0.5,
    }
  }

  return {
    state: "READY",
    combinedScore: input.peScore * 0.5 + input.evEbitdaScore * 0.5,
    peWeight: 0.5,
    evEbitdaWeight: 0.5,
  }
}
