import {
  buildPharmaG7OverlayNumericModifierProposal,
  PHARMA_G7_OVERLAY_NUMERIC_MODIFIER,
  PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION,
  type PharmaG7OverlayNumericModifierInput,
} from "./pharmaG7OverlayNumericModifierProposal"
import {
  evaluatePharmaGovernanceRegulatoryGate,
  PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT_VERSION,
  type PharmaGovernanceRegulatoryGateInput,
} from "./pharmaGovernanceRegulatoryGateContract"

export const PHARMA_GATE_G_FINAL_3_CROSS_CUTTING_CANDIDATE_VERSION =
  "PHARMA_GATE_G_FINAL_3_CROSS_CUTTING_CANDIDATE_V1" as const

export const PHARMA_GATE_G_FINAL_3_CROSS_CUTTING_CANDIDATE = {
  version: PHARMA_GATE_G_FINAL_3_CROSS_CUTTING_CANDIDATE_VERSION,
  state: "READY_FOR_OWNER_METHODOLOGY_REVIEW" as const,
  overlay: {
    contractVersion: PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION,
    formula: PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.formula,
    combinedPerDimensionCapPoints:
      PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.combinedPerDimensionCapPoints,
    confidenceFactors: PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.confidenceFactors,
    materialityScaling: PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.materialityScaling,
    readinessRule: PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.readinessRule,
    partialReadinessNumericModifierAllowed:
      PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.partialReadinessNumericModifierAllowed,
    independentOverlayCapStackingAllowed:
      PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.independentOverlayCapStackingAllowed,
    ownerApprovalRequired: true,
  },
  governanceRuntime: {
    contractVersion: PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT_VERSION,
    criticalEventBlocksPreview: true,
    highRiskBehavior: "INTERPRETATION_ONLY" as const,
    highRiskNumericCap: null,
    hiddenDoubleCountingAllowed: false,
    unknownRegulatoryMaterialityRequiresReview: true,
    remediationErasesHistoricalEvent: false,
    ownerApprovalRequired: true,
  },
  gFinal3Complete: false,
  gateHEligible: false,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
  recommendationEnabled: false,
  positionSizingEnabled: false,
} as const

export function evaluateGateGFinal3OverlayCandidate(
  input: PharmaG7OverlayNumericModifierInput,
) {
  return buildPharmaG7OverlayNumericModifierProposal(input)
}

export function evaluateGateGFinal3GovernanceRuntimeCandidate(
  input: PharmaGovernanceRegulatoryGateInput,
) {
  return evaluatePharmaGovernanceRegulatoryGate(input)
}
