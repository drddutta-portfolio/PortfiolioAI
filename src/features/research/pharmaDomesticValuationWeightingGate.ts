export const PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE_VERSION =
  "PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE_V1_PROPOSAL" as const

export interface PharmaDomesticValuationWeightingGate {
  readonly contractVersion: typeof PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly canonicalDimension: "VALUATION"
  readonly dimensionWeightPercent: 12
  readonly requiredComponents: readonly [
    "SELF_HISTORY_RELATIVE_VALUATION",
    "PEER_RELATIVE_VALUATION",
    "CASH_FLOW_CORROBORATION",
  ]
  readonly approvedWeightingMethod: null
  readonly selfHistoryWeight: null
  readonly peerRelativeWeight: null
  readonly cashFlowCorroborationWeight: null
  readonly weightsMustSumToOneWhenApproved: true
  readonly explicitOwnerApprovalRequired: true
  readonly weightingContractVersionRequired: true
  readonly hiddenDefaultAllowed: false
  readonly equalThirdsDefaultAllowed: false
  readonly missingComponentRenormalizationAllowed: false
  readonly wholeValuationDimensionReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE: PharmaDomesticValuationWeightingGate = {
  contractVersion: PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE_VERSION,
  state: "PROPOSAL_ONLY",
  supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS",
  canonicalDimension: "VALUATION",
  dimensionWeightPercent: 12,
  requiredComponents: [
    "SELF_HISTORY_RELATIVE_VALUATION",
    "PEER_RELATIVE_VALUATION",
    "CASH_FLOW_CORROBORATION",
  ],
  approvedWeightingMethod: null,
  selfHistoryWeight: null,
  peerRelativeWeight: null,
  cashFlowCorroborationWeight: null,
  weightsMustSumToOneWhenApproved: true,
  explicitOwnerApprovalRequired: true,
  weightingContractVersionRequired: true,
  hiddenDefaultAllowed: false,
  equalThirdsDefaultAllowed: false,
  missingComponentRenormalizationAllowed: false,
  wholeValuationDimensionReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}

export interface PharmaDomesticValuationWeightingDecisionInput {
  readonly method: "WEIGHTED_MEAN"
  readonly selfHistoryWeight: number
  readonly peerRelativeWeight: number
  readonly cashFlowCorroborationWeight: number
}

export interface PharmaDomesticValuationWeightingDecisionReview {
  readonly structurallyValid: boolean
  readonly reason:
    | "READY_FOR_EXPLICIT_APPROVAL"
    | "INVALID_WEIGHT"
    | "WEIGHTS_MUST_SUM_TO_ONE"
  readonly approved: false
}

export function reviewDomesticValuationWeightingDecision(
  input: PharmaDomesticValuationWeightingDecisionInput,
): PharmaDomesticValuationWeightingDecisionReview {
  const weights = [
    input.selfHistoryWeight,
    input.peerRelativeWeight,
    input.cashFlowCorroborationWeight,
  ]

  if (weights.some((weight) => !Number.isFinite(weight) || weight < 0 || weight > 1)) {
    return { structurallyValid: false, reason: "INVALID_WEIGHT", approved: false }
  }

  const total = weights.reduce((sum, weight) => sum + weight, 0)
  if (Math.abs(total - 1) > 1e-9) {
    return { structurallyValid: false, reason: "WEIGHTS_MUST_SUM_TO_ONE", approved: false }
  }

  return { structurallyValid: true, reason: "READY_FOR_EXPLICIT_APPROVAL", approved: false }
}
