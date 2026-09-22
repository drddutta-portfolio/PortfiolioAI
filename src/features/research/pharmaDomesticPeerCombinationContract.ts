export const PHARMA_DOMESTIC_PEER_COMBINATION_VERSION =
  "PHARMA_DOMESTIC_PEER_COMBINATION_V1_PROPOSAL" as const

export interface PharmaDomesticPeerCombinationContract {
  readonly contractVersion: typeof PHARMA_DOMESTIC_PEER_COMBINATION_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly canonicalDimension: "VALUATION"
  readonly component: "PEER_RELATIVE_VALUATION"
  readonly requiredNormalizedInputs: readonly ["PE_TTM", "EV_EBITDA"]
  readonly inputRequirements: {
    readonly bothMetricFamiliesRequired: true
    readonly oneMetricMaySubstituteForOther: false
    readonly missingMetricFamilyFailsClosed: true
    readonly invalidMetricFamilyFailsClosed: true
  }
  readonly combinationMethodState: "UNAPPROVED"
  readonly equalWeightMeanApproved: false
  readonly weightedMeanApproved: false
  readonly bestOfApproved: false
  readonly worstOfApproved: false
  readonly fallbackToSingleMetricApproved: false
  readonly peWeight: null
  readonly evEbitdaWeight: null
  readonly combinedPeerComponentScoreReady: false
  readonly wholeValuationDimensionReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_DOMESTIC_PEER_COMBINATION: PharmaDomesticPeerCombinationContract = {
  contractVersion: PHARMA_DOMESTIC_PEER_COMBINATION_VERSION,
  state: "PROPOSAL_ONLY",
  supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS",
  canonicalDimension: "VALUATION",
  component: "PEER_RELATIVE_VALUATION",
  requiredNormalizedInputs: ["PE_TTM", "EV_EBITDA"],
  inputRequirements: {
    bothMetricFamiliesRequired: true,
    oneMetricMaySubstituteForOther: false,
    missingMetricFamilyFailsClosed: true,
    invalidMetricFamilyFailsClosed: true,
  },
  combinationMethodState: "UNAPPROVED",
  equalWeightMeanApproved: false,
  weightedMeanApproved: false,
  bestOfApproved: false,
  worstOfApproved: false,
  fallbackToSingleMetricApproved: false,
  peWeight: null,
  evEbitdaWeight: null,
  combinedPeerComponentScoreReady: false,
  wholeValuationDimensionReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}

export interface PharmaDomesticPeerCombinationInput {
  readonly peScore: number | null
  readonly evEbitdaScore: number | null
}

export interface PharmaDomesticPeerCombinationReadiness {
  readonly state: "READY_FOR_WEIGHTING_DECISION" | "INSUFFICIENT_EVIDENCE"
  readonly peScorePresent: boolean
  readonly evEbitdaScorePresent: boolean
  readonly combinedScore: null
}

function validScore(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function assessDomesticPeerCombinationReadiness(
  input: PharmaDomesticPeerCombinationInput,
): PharmaDomesticPeerCombinationReadiness {
  const peScorePresent = validScore(input.peScore)
  const evEbitdaScorePresent = validScore(input.evEbitdaScore)

  return {
    state: peScorePresent && evEbitdaScorePresent
      ? "READY_FOR_WEIGHTING_DECISION"
      : "INSUFFICIENT_EVIDENCE",
    peScorePresent,
    evEbitdaScorePresent,
    combinedScore: null,
  }
}
