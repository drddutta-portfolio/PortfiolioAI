export const PHARMA_DOMESTIC_PEER_WEIGHTING_GATE_VERSION =
  "PHARMA_DOMESTIC_PEER_WEIGHTING_GATE_V1_PROPOSAL" as const

export interface PharmaDomesticPeerWeightingGate {
  readonly contractVersion: typeof PHARMA_DOMESTIC_PEER_WEIGHTING_GATE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly canonicalDimension: "VALUATION"
  readonly component: "PEER_RELATIVE_VALUATION"
  readonly requiredInputs: readonly ["PE_TTM", "EV_EBITDA"]
  readonly approvedWeightingMethod: null
  readonly peWeight: null
  readonly evEbitdaWeight: null
  readonly weightsMustSumToOneWhenApproved: true
  readonly explicitOwnerApprovalRequired: true
  readonly weightingContractVersionRequired: true
  readonly hiddenDefaultAllowed: false
  readonly equalWeightDefaultAllowed: false
  readonly singleMetricFallbackAllowed: false
  readonly combinedPeerScoreReady: false
  readonly wholeValuationDimensionReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_DOMESTIC_PEER_WEIGHTING_GATE: PharmaDomesticPeerWeightingGate = {
  contractVersion: PHARMA_DOMESTIC_PEER_WEIGHTING_GATE_VERSION,
  state: "PROPOSAL_ONLY",
  supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS",
  canonicalDimension: "VALUATION",
  component: "PEER_RELATIVE_VALUATION",
  requiredInputs: ["PE_TTM", "EV_EBITDA"],
  approvedWeightingMethod: null,
  peWeight: null,
  evEbitdaWeight: null,
  weightsMustSumToOneWhenApproved: true,
  explicitOwnerApprovalRequired: true,
  weightingContractVersionRequired: true,
  hiddenDefaultAllowed: false,
  equalWeightDefaultAllowed: false,
  singleMetricFallbackAllowed: false,
  combinedPeerScoreReady: false,
  wholeValuationDimensionReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}

export interface PharmaDomesticPeerWeightingDecisionInput {
  readonly method: "WEIGHTED_MEAN"
  readonly peWeight: number
  readonly evEbitdaWeight: number
}

export interface PharmaDomesticPeerWeightingDecisionReview {
  readonly structurallyValid: boolean
  readonly reason:
    | "READY_FOR_EXPLICIT_APPROVAL"
    | "INVALID_WEIGHT"
    | "WEIGHTS_MUST_SUM_TO_ONE"
  readonly approved: false
}

export function reviewDomesticPeerWeightingDecision(
  input: PharmaDomesticPeerWeightingDecisionInput,
): PharmaDomesticPeerWeightingDecisionReview {
  const { peWeight, evEbitdaWeight } = input
  if (
    !Number.isFinite(peWeight)
    || !Number.isFinite(evEbitdaWeight)
    || peWeight < 0
    || evEbitdaWeight < 0
    || peWeight > 1
    || evEbitdaWeight > 1
  ) {
    return { structurallyValid: false, reason: "INVALID_WEIGHT", approved: false }
  }

  const total = peWeight + evEbitdaWeight
  if (Math.abs(total - 1) > 1e-9) {
    return { structurallyValid: false, reason: "WEIGHTS_MUST_SUM_TO_ONE", approved: false }
  }

  return { structurallyValid: true, reason: "READY_FOR_EXPLICIT_APPROVAL", approved: false }
}
