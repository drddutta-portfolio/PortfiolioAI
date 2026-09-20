import { describe, expect, it } from "vitest"
import {
  evaluatePharmaG7GovernanceConstraint,
  PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT,
} from "./pharmaG7GovernanceHighRiskConstraint"

const base = {
  eventClass: "GOVERNANCE" as const,
  severity: "LOW" as const,
  governanceBlockedReview: false,
  affectedFacilityProductGeographyEstablished: true,
  regulatoryMateriality: "NOT_APPLICABLE" as const,
  remediationState: "NOT_APPLICABLE" as const,
  subsequentOutcomeEstablished: true,
}

describe("G7-P2 governance high-risk constraint", () => {
  it("is owner-approved, non-active and has no numeric high-risk cap", () => {
    expect(PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.state).toBe("OWNER_APPROVED_NOT_ACTIVE")
    expect(PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.highRiskBehavior).toBe("INTERPRETATION_ONLY")
    expect(PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.highRiskNumericCapValue).toBeNull()
    expect(PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.highRiskDimensionPenaltyEnabled).toBe(false)
    expect(PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.highRiskOverallCapEnabled).toBe(false)
    expect(PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.hiddenDoubleCountingAllowed).toBe(false)
    expect(PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.methodologyApproved).toBe(true)
    expect(PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.ownerValidationRequired).toBe(false)
    expect(PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.g71ConsumptionApproved).toBe(true)
  })

  it("preserves explicit blocked-review behavior", () => {
    const result = evaluatePharmaG7GovernanceConstraint({
      ...base,
      governanceBlockedReview: true,
    })
    expect(result.constraintState).toBe("BLOCKED_REVIEW")
    expect(result.blocksOverallPreview).toBe(true)
    expect(result.numericPenalty).toBeNull()
    expect(result.overallScoreCap).toBeNull()
  })

  it("preserves CRITICAL governance blocking", () => {
    const result = evaluatePharmaG7GovernanceConstraint({
      ...base,
      severity: "CRITICAL",
    })
    expect(result.constraintState).toBe("BLOCKED_REVIEW")
    expect(result.blocksOverallPreview).toBe(true)
  })

  it("preserves material CRITICAL regulatory blocking", () => {
    const result = evaluatePharmaG7GovernanceConstraint({
      ...base,
      eventClass: "REGULATORY",
      severity: "CRITICAL",
      regulatoryMateriality: "KNOWN_MATERIAL",
    })
    expect(result.constraintState).toBe("BLOCKED_REVIEW")
    expect(result.blocksOverallPreview).toBe(true)
  })

  it("treats HIGH governance risk as interpretation-only", () => {
    const result = evaluatePharmaG7GovernanceConstraint({
      ...base,
      severity: "HIGH",
    })
    expect(result.constraintState).toBe("INTERPRETATION_ONLY_HIGH_RISK")
    expect(result.blocksOverallPreview).toBe(false)
    expect(result.numericPenalty).toBeNull()
    expect(result.overallScoreCap).toBeNull()
    expect(result.interpretationProminenceRequired).toBe(true)
    expect(result.reasonCodes).toContain("ANTI_DOUBLE_COUNTING_PRESERVED")
  })

  it("treats material HIGH regulatory risk as interpretation-only", () => {
    const result = evaluatePharmaG7GovernanceConstraint({
      ...base,
      eventClass: "REGULATORY",
      severity: "HIGH",
      regulatoryMateriality: "KNOWN_MATERIAL",
    })
    expect(result.constraintState).toBe("INTERPRETATION_ONLY_HIGH_RISK")
    expect(result.blocksOverallPreview).toBe(false)
    expect(result.numericPenalty).toBeNull()
  })

  it("keeps unresolved regulatory materiality in review rather than scoring it", () => {
    const result = evaluatePharmaG7GovernanceConstraint({
      ...base,
      eventClass: "REGULATORY",
      severity: "HIGH",
      regulatoryMateriality: "UNKNOWN",
    })
    expect(result.constraintState).toBe("REVIEW_REQUIRED")
    expect(result.numericPenalty).toBeNull()
    expect(result.overallScoreCap).toBeNull()
  })

  it("does not add a constraint to clear governance", () => {
    const result = evaluatePharmaG7GovernanceConstraint(base)
    expect(result.constraintState).toBe("CLEAR")
    expect(result.blocksOverallPreview).toBe(false)
    expect(result.numericPenalty).toBeNull()
    expect(result.overallScoreCap).toBeNull()
  })
})
