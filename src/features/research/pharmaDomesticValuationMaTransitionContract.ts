export const PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_VERSION =
  "PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_V1_OWNER_APPROVED" as const

export interface PharmaDomesticValuationMaTransitionContract {
  readonly contractVersion: typeof PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_VERSION
  readonly state: "OWNER_APPROVED_H2_TRANSITION_NOT_GLOBALLY_ACTIVE"
  readonly targetSecurity: "TORNTPHARM"
  readonly supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly canonicalDimension: "VALUATION"
  readonly baseContractVersion: "PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_V1_OWNER_APPROVED"
  readonly trigger: {
    readonly baseRevisitTrigger: "FCF_STRUCTURAL_DISTORTION_CAPEX_OR_M_AND_A_CYCLE"
    readonly transitionReason: "M_AND_A_SCOPE_MISMATCH"
    readonly comparablePostMergerAnnualFcfRequiredToExit: true
  }
  readonly method: "EXPLICIT_TRANSITION_WEIGHTED_MEAN"
  readonly weights: {
    readonly selfHistory: 0.5
    readonly peerRelative: 0.5
    readonly cashFlowCorroboration: 0
  }
  readonly cashFlowTreatment: {
    readonly suspendedBecauseNotComparable: true
    readonly neutralScoreSubstitutionAllowed: false
    readonly stalePreMergerFcfReuseAllowed: false
    readonly currentMarketCapCallRequiredWhileSuspended: false
  }
  readonly safeguards: {
    readonly hiddenRenormalizationAllowed: false
    readonly automaticFallbackAllowed: false
    readonly baseContractOverwritten: false
    readonly otherSecurityReuseAllowed: false
    readonly h3ScoreExecutionEnabled: false
    readonly persistedScoreRunEnabled: false
  }
  readonly exitRule: {
    readonly whenComparablePostMergerAnnualFcfExists: "REVERT_TO_BASE_40_40_20"
    readonly automaticPermanentExtensionAllowed: false
  }
}

export const PHARMA_DOMESTIC_VALUATION_MA_TRANSITION: PharmaDomesticValuationMaTransitionContract = {
  contractVersion: PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_VERSION,
  state: "OWNER_APPROVED_H2_TRANSITION_NOT_GLOBALLY_ACTIVE",
  targetSecurity: "TORNTPHARM",
  supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS",
  canonicalDimension: "VALUATION",
  baseContractVersion: "PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_V1_OWNER_APPROVED",
  trigger: {
    baseRevisitTrigger: "FCF_STRUCTURAL_DISTORTION_CAPEX_OR_M_AND_A_CYCLE",
    transitionReason: "M_AND_A_SCOPE_MISMATCH",
    comparablePostMergerAnnualFcfRequiredToExit: true,
  },
  method: "EXPLICIT_TRANSITION_WEIGHTED_MEAN",
  weights: {
    selfHistory: 0.5,
    peerRelative: 0.5,
    cashFlowCorroboration: 0,
  },
  cashFlowTreatment: {
    suspendedBecauseNotComparable: true,
    neutralScoreSubstitutionAllowed: false,
    stalePreMergerFcfReuseAllowed: false,
    currentMarketCapCallRequiredWhileSuspended: false,
  },
  safeguards: {
    hiddenRenormalizationAllowed: false,
    automaticFallbackAllowed: false,
    baseContractOverwritten: false,
    otherSecurityReuseAllowed: false,
    h3ScoreExecutionEnabled: false,
    persistedScoreRunEnabled: false,
  },
  exitRule: {
    whenComparablePostMergerAnnualFcfExists: "REVERT_TO_BASE_40_40_20",
    automaticPermanentExtensionAllowed: false,
  },
}

export type PharmaDomesticValuationMaTransitionState =
  | "M_AND_A_SCOPE_MISMATCH"
  | "COMPARABLE_POST_MERGER_FCF_AVAILABLE"
  | "OTHER"

export interface PharmaDomesticValuationMaTransitionInput {
  readonly symbol: string
  readonly selfHistoryScore: number | null
  readonly peerRelativeScore: number | null
  readonly transitionState: PharmaDomesticValuationMaTransitionState
}

export interface PharmaDomesticValuationMaTransitionResult {
  readonly state:
    | "READY_TRANSITION"
    | "INSUFFICIENT_EVIDENCE"
    | "NOT_APPLICABLE"
    | "TRANSITION_EXPIRED"
  readonly combinedScore: number | null
  readonly selfHistoryWeight: 0.5
  readonly peerRelativeWeight: 0.5
  readonly cashFlowCorroborationWeight: 0
  readonly nextContract:
    | "PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_V1_OWNER_APPROVED"
    | "PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_V1_OWNER_APPROVED"
    | null
}

function validScore(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function combineDomesticValuationMaTransitionScores(
  input: PharmaDomesticValuationMaTransitionInput,
): PharmaDomesticValuationMaTransitionResult {
  const weights = {
    selfHistoryWeight: 0.5 as const,
    peerRelativeWeight: 0.5 as const,
    cashFlowCorroborationWeight: 0 as const,
  }

  if (input.symbol !== "TORNTPHARM") {
    return {
      state: "NOT_APPLICABLE",
      combinedScore: null,
      ...weights,
      nextContract: null,
    }
  }

  if (input.transitionState === "COMPARABLE_POST_MERGER_FCF_AVAILABLE") {
    return {
      state: "TRANSITION_EXPIRED",
      combinedScore: null,
      ...weights,
      nextContract: "PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_V1_OWNER_APPROVED",
    }
  }

  if (input.transitionState !== "M_AND_A_SCOPE_MISMATCH") {
    return {
      state: "NOT_APPLICABLE",
      combinedScore: null,
      ...weights,
      nextContract: null,
    }
  }

  if (!validScore(input.selfHistoryScore) || !validScore(input.peerRelativeScore)) {
    return {
      state: "INSUFFICIENT_EVIDENCE",
      combinedScore: null,
      ...weights,
      nextContract: PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_VERSION,
    }
  }

  return {
    state: "READY_TRANSITION",
    combinedScore: input.selfHistoryScore * 0.5 + input.peerRelativeScore * 0.5,
    ...weights,
    nextContract: PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_VERSION,
  }
}
