import {
  evaluatePharmaGovernanceRegulatoryGate,
  PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT,
  type PharmaGovernanceRegulatoryGateInput,
} from "./pharmaGovernanceRegulatoryGateContract"

export const PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_VERSION =
  "PHARMA_V1_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_V1_PROPOSAL" as const

export const PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT = {
  version: PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_VERSION,
  state: "PROPOSAL_ONLY",
  sourceGovernanceContractVersion:
    PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT.version,
  blockedReviewBlocksOverallPreview: true,
  criticalBlocksOverallPreview: true,
  highRiskBehavior: "INTERPRETATION_ONLY",
  highRiskNumericCapValue: null,
  highRiskDimensionPenaltyEnabled: false,
  highRiskOverallCapEnabled: false,
  hiddenDoubleCountingAllowed: false,
  ownerValidationRequired: true,
  g71ConsumptionApproved: false,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
} as const

export type PharmaG7GovernanceConstraintState =
  | "CLEAR"
  | "INTERPRETATION_ONLY_HIGH_RISK"
  | "REVIEW_REQUIRED"
  | "BLOCKED_REVIEW"

export interface PharmaG7GovernanceConstraintResult {
  readonly contractVersion: typeof PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly constraintState: PharmaG7GovernanceConstraintState
  readonly blocksOverallPreview: boolean
  readonly numericPenalty: null
  readonly overallScoreCap: null
  readonly interpretationProminenceRequired: boolean
  readonly reasonCodes: readonly string[]
  readonly ownerValidationRequired: true
  readonly g71ConsumptionApproved: false
  readonly scoreExecutionEnabled: false
}

function result(
  constraintState: PharmaG7GovernanceConstraintState,
  blocksOverallPreview: boolean,
  interpretationProminenceRequired: boolean,
  reasonCodes: readonly string[],
): PharmaG7GovernanceConstraintResult {
  return {
    contractVersion: PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_VERSION,
    state: "PROPOSAL_ONLY",
    constraintState,
    blocksOverallPreview,
    numericPenalty: null,
    overallScoreCap: null,
    interpretationProminenceRequired,
    reasonCodes,
    ownerValidationRequired: true,
    g71ConsumptionApproved: false,
    scoreExecutionEnabled: false,
  }
}

export function evaluatePharmaG7GovernanceConstraint(
  input: PharmaGovernanceRegulatoryGateInput,
): PharmaG7GovernanceConstraintResult {
  const gate = evaluatePharmaGovernanceRegulatoryGate(input)

  if (gate.gateState === "BLOCKED_REVIEW") {
    return result("BLOCKED_REVIEW", true, true, [
      ...gate.reasonCodes,
      "G7_P2_BLOCKING_BEHAVIOR_PRESERVES_G4",
    ])
  }

  if (gate.gateState === "REVIEW_REQUIRED") {
    return result("REVIEW_REQUIRED", false, true, [
      ...gate.reasonCodes,
      "G7_P2_NO_NUMERIC_TREATMENT_WHILE_REVIEW_REQUIRED",
    ])
  }

  if (gate.gateState === "HIGH_RISK") {
    return result("INTERPRETATION_ONLY_HIGH_RISK", false, true, [
      ...gate.reasonCodes,
      "HIGH_RISK_INTERPRETATION_ONLY_NO_NUMERIC_CAP",
      "NO_ADDITIONAL_DIMENSION_PENALTY",
      "ANTI_DOUBLE_COUNTING_PRESERVED",
    ])
  }

  return result("CLEAR", false, gate.interpretationProminenceRequired, [
    ...gate.reasonCodes,
    "G7_P2_NO_ADDITIONAL_CONSTRAINT",
  ])
}
