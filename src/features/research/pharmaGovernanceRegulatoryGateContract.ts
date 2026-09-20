export const PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT_VERSION =
  "PHARMA_V1_GOVERNANCE_REGULATORY_GATE_V1_OWNER_APPROVED" as const

export const PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT = {
  version: PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT_VERSION,
  state: "OWNER_APPROVED_NOT_ACTIVE",
  criticalEventBlocksPreview: true,
  highRiskAutomaticallyBlocksPreview: false,
  highRiskConstraintContractRequiredBeforeNumericCap: true,
  highRiskCapValue: null,
  unknownRegulatoryMaterialityRequiresReview: true,
  remediationErasesHistoricalEvent: false,
  hiddenDoubleCountingAllowed: false,
  additionalNumericPenaltyEnabled: false,
  methodologyApproved: true,
  scoreExecutionEnabled: false,
} as const

export type PharmaGovernanceRegulatoryEventClass = "GOVERNANCE" | "REGULATORY"
export type PharmaGovernanceRegulatorySeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL"

export type PharmaRegulatoryMateriality =
  | "NOT_APPLICABLE"
  | "KNOWN_IMMATERIAL"
  | "KNOWN_MATERIAL"
  | "UNKNOWN"

export type PharmaRemediationState =
  | "NOT_APPLICABLE"
  | "OPEN"
  | "IN_PROGRESS"
  | "CLOSED_OUT"

export interface PharmaGovernanceRegulatoryGateInput {
  readonly eventClass: PharmaGovernanceRegulatoryEventClass
  readonly severity: PharmaGovernanceRegulatorySeverity
  readonly governanceBlockedReview: boolean
  readonly affectedFacilityProductGeographyEstablished: boolean
  readonly regulatoryMateriality: PharmaRegulatoryMateriality
  readonly remediationState: PharmaRemediationState
  readonly subsequentOutcomeEstablished: boolean
}

export type PharmaGovernanceRegulatoryGateState =
  | "CLEAR"
  | "HIGH_RISK"
  | "REVIEW_REQUIRED"
  | "BLOCKED_REVIEW"

export interface PharmaGovernanceRegulatoryGateResult {
  readonly contractVersion: typeof PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT_VERSION
  readonly state: "OWNER_APPROVED_NOT_ACTIVE"
  readonly gateState: PharmaGovernanceRegulatoryGateState
  readonly blocksPreview: boolean
  readonly interpretationProminenceRequired: boolean
  readonly highRiskConstraintEligible: boolean
  readonly highRiskCapValue: null
  readonly additionalNumericPenalty: null
  readonly historicalEventRetained: boolean
  readonly reasonCodes: readonly string[]
  readonly scoreExecutionEnabled: false
}

function result(
  input: PharmaGovernanceRegulatoryGateInput,
  gateState: PharmaGovernanceRegulatoryGateState,
  blocksPreview: boolean,
  interpretationProminenceRequired: boolean,
  highRiskConstraintEligible: boolean,
  reasonCodes: readonly string[],
): PharmaGovernanceRegulatoryGateResult {
  return {
    contractVersion: PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT_VERSION,
    state: "OWNER_APPROVED_NOT_ACTIVE",
    gateState,
    blocksPreview,
    interpretationProminenceRequired,
    highRiskConstraintEligible,
    highRiskCapValue: null,
    additionalNumericPenalty: null,
    historicalEventRetained:
      input.eventClass === "REGULATORY" && input.remediationState === "CLOSED_OUT",
    reasonCodes,
    scoreExecutionEnabled: false,
  }
}

export function evaluatePharmaGovernanceRegulatoryGate(
  input: PharmaGovernanceRegulatoryGateInput,
): PharmaGovernanceRegulatoryGateResult {
  if (input.governanceBlockedReview) {
    return result(input, "BLOCKED_REVIEW", true, true, false, [
      "GOVERNANCE_BLOCKED_REVIEW",
    ])
  }

  if (input.eventClass === "REGULATORY") {
    if (!input.affectedFacilityProductGeographyEstablished) {
      return result(input, "REVIEW_REQUIRED", false, true, false, [
        "REGULATORY_SCOPE_NOT_ESTABLISHED",
      ])
    }

    if (input.regulatoryMateriality === "UNKNOWN") {
      return result(input, "REVIEW_REQUIRED", false, true, false, [
        "REGULATORY_MATERIALITY_UNKNOWN",
        "DO_NOT_INFER_EXPOSURE",
      ])
    }

    if (input.regulatoryMateriality === "NOT_APPLICABLE") {
      return result(input, "REVIEW_REQUIRED", false, true, false, [
        "REGULATORY_EVENT_REQUIRES_MATERIALITY_CLASSIFICATION",
      ])
    }

    if (
      input.remediationState === "CLOSED_OUT"
      && !input.subsequentOutcomeEstablished
    ) {
      return result(input, "REVIEW_REQUIRED", false, true, false, [
        "REMEDIATION_CLOSEOUT_REQUIRES_SUBSEQUENT_OUTCOME_CONTEXT",
        "HISTORICAL_EVENT_RETAINED",
      ])
    }

    if (
      input.severity === "CRITICAL"
      && input.regulatoryMateriality === "KNOWN_MATERIAL"
    ) {
      return result(input, "BLOCKED_REVIEW", true, true, false, [
        "CRITICAL_MATERIAL_REGULATORY_EVENT",
        input.remediationState === "CLOSED_OUT"
          ? "HISTORICAL_EVENT_RETAINED_AFTER_CLOSEOUT"
          : "ACTIVE_OR_UNRESOLVED_CRITICAL_EVENT",
      ])
    }

    if (
      input.severity === "HIGH"
      && input.regulatoryMateriality === "KNOWN_MATERIAL"
    ) {
      return result(input, "HIGH_RISK", false, true, true, [
        "HIGH_RISK_MATERIAL_REGULATORY_EVENT",
        "HIGH_RISK_INTERPRETATION_ONLY_NO_NUMERIC_CAP",
      ])
    }

    return result(input, "CLEAR", false, input.severity !== "LOW", false, [
      input.remediationState === "CLOSED_OUT"
        ? "REGULATORY_EVENT_RETAINED_WITH_REMEDIATION"
        : "REGULATORY_GATE_NOT_BLOCKING",
    ])
  }

  if (input.severity === "CRITICAL") {
    return result(input, "BLOCKED_REVIEW", true, true, false, [
      "CRITICAL_GOVERNANCE_EVENT",
    ])
  }

  if (input.severity === "HIGH") {
    return result(input, "HIGH_RISK", false, true, true, [
      "GOVERNANCE_HIGH_RISK",
      "HIGH_RISK_INTERPRETATION_ONLY_NO_NUMERIC_CAP",
    ])
  }

  return result(input, "CLEAR", false, input.severity === "MODERATE", false, [
    "GOVERNANCE_GATE_NOT_BLOCKING",
  ])
}
