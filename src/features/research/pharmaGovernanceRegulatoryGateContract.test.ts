import { describe, expect, it } from "vitest"
import {
  evaluatePharmaGovernanceRegulatoryGate,
  PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT,
} from "./pharmaGovernanceRegulatoryGateContract"

describe("PHARMA governance/regulatory gate contract", () => {
  it("is owner-approved and does not invent a high-risk cap or extra penalty", () => {
    expect(PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT.state).toBe("OWNER_APPROVED_NOT_ACTIVE")
    expect(PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT.methodologyApproved).toBe(true)
    expect(PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT.highRiskCapValue).toBeNull()
    expect(PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT.additionalNumericPenaltyEnabled).toBe(false)
    expect(PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT.hiddenDoubleCountingAllowed).toBe(false)
    expect(PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT.scoreExecutionEnabled).toBe(false)
  })

  it("blocks on explicit governance blocked-review state", () => {
    const result = evaluatePharmaGovernanceRegulatoryGate({
      eventClass: "GOVERNANCE",
      severity: "MODERATE",
      governanceBlockedReview: true,
      affectedFacilityProductGeographyEstablished: false,
      regulatoryMateriality: "NOT_APPLICABLE",
      remediationState: "NOT_APPLICABLE",
      subsequentOutcomeEstablished: false,
    })
    expect(result.gateState).toBe("BLOCKED_REVIEW")
    expect(result.blocksPreview).toBe(true)
  })

  it("blocks a critical governance event", () => {
    const result = evaluatePharmaGovernanceRegulatoryGate({
      eventClass: "GOVERNANCE",
      severity: "CRITICAL",
      governanceBlockedReview: false,
      affectedFacilityProductGeographyEstablished: false,
      regulatoryMateriality: "NOT_APPLICABLE",
      remediationState: "NOT_APPLICABLE",
      subsequentOutcomeEstablished: false,
    })
    expect(result.gateState).toBe("BLOCKED_REVIEW")
    expect(result.reasonCodes).toContain("CRITICAL_GOVERNANCE_EVENT")
  })

  it("keeps governance high risk non-blocking while leaving cap mechanics unapproved", () => {
    const result = evaluatePharmaGovernanceRegulatoryGate({
      eventClass: "GOVERNANCE",
      severity: "HIGH",
      governanceBlockedReview: false,
      affectedFacilityProductGeographyEstablished: false,
      regulatoryMateriality: "NOT_APPLICABLE",
      remediationState: "NOT_APPLICABLE",
      subsequentOutcomeEstablished: false,
    })
    expect(result.gateState).toBe("HIGH_RISK")
    expect(result.blocksPreview).toBe(false)
    expect(result.interpretationProminenceRequired).toBe(true)
    expect(result.highRiskConstraintEligible).toBe(true)
    expect(result.highRiskCapValue).toBeNull()
    expect(result.additionalNumericPenalty).toBeNull()
  })

  it("requires regulatory scope before interpreting event materiality", () => {
    const result = evaluatePharmaGovernanceRegulatoryGate({
      eventClass: "REGULATORY",
      severity: "HIGH",
      governanceBlockedReview: false,
      affectedFacilityProductGeographyEstablished: false,
      regulatoryMateriality: "UNKNOWN",
      remediationState: "OPEN",
      subsequentOutcomeEstablished: false,
    })
    expect(result.gateState).toBe("REVIEW_REQUIRED")
    expect(result.reasonCodes).toContain("REGULATORY_SCOPE_NOT_ESTABLISHED")
  })

  it("fails closed when regulatory economic materiality is unknown", () => {
    const result = evaluatePharmaGovernanceRegulatoryGate({
      eventClass: "REGULATORY",
      severity: "HIGH",
      governanceBlockedReview: false,
      affectedFacilityProductGeographyEstablished: true,
      regulatoryMateriality: "UNKNOWN",
      remediationState: "OPEN",
      subsequentOutcomeEstablished: false,
    })
    expect(result.gateState).toBe("REVIEW_REQUIRED")
    expect(result.reasonCodes).toContain("DO_NOT_INFER_EXPOSURE")
  })

  it("blocks a critical regulatory event only after material exposure is established", () => {
    const result = evaluatePharmaGovernanceRegulatoryGate({
      eventClass: "REGULATORY",
      severity: "CRITICAL",
      governanceBlockedReview: false,
      affectedFacilityProductGeographyEstablished: true,
      regulatoryMateriality: "KNOWN_MATERIAL",
      remediationState: "OPEN",
      subsequentOutcomeEstablished: false,
    })
    expect(result.gateState).toBe("BLOCKED_REVIEW")
    expect(result.blocksPreview).toBe(true)
  })

  it("keeps a material high-risk regulatory event prominent but non-blocking", () => {
    const result = evaluatePharmaGovernanceRegulatoryGate({
      eventClass: "REGULATORY",
      severity: "HIGH",
      governanceBlockedReview: false,
      affectedFacilityProductGeographyEstablished: true,
      regulatoryMateriality: "KNOWN_MATERIAL",
      remediationState: "IN_PROGRESS",
      subsequentOutcomeEstablished: true,
    })
    expect(result.gateState).toBe("HIGH_RISK")
    expect(result.blocksPreview).toBe(false)
    expect(result.highRiskCapValue).toBeNull()
  })

  it("does not let closeout erase the historical regulatory event", () => {
    const result = evaluatePharmaGovernanceRegulatoryGate({
      eventClass: "REGULATORY",
      severity: "MODERATE",
      governanceBlockedReview: false,
      affectedFacilityProductGeographyEstablished: true,
      regulatoryMateriality: "KNOWN_MATERIAL",
      remediationState: "CLOSED_OUT",
      subsequentOutcomeEstablished: true,
    })
    expect(result.historicalEventRetained).toBe(true)
    expect(result.reasonCodes).toContain("REGULATORY_EVENT_RETAINED_WITH_REMEDIATION")
  })

  it("requires subsequent outcome context before treating closeout as resolved context", () => {
    const result = evaluatePharmaGovernanceRegulatoryGate({
      eventClass: "REGULATORY",
      severity: "MODERATE",
      governanceBlockedReview: false,
      affectedFacilityProductGeographyEstablished: true,
      regulatoryMateriality: "KNOWN_MATERIAL",
      remediationState: "CLOSED_OUT",
      subsequentOutcomeEstablished: false,
    })
    expect(result.gateState).toBe("REVIEW_REQUIRED")
    expect(result.historicalEventRetained).toBe(true)
  })
})
