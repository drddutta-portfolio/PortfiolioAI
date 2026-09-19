import { describe, expect, it } from "vitest"
import { evaluatePharmaGovernanceRegulatoryGate } from "./pharmaGovernanceRegulatoryGateContract"
import {
  PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT,
  projectGlobalGenericsRegulatorySiteTreatment,
} from "./pharmaGlobalGenericsRegulatorySiteTreatmentContract"

describe("PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT", () => {
  it("keeps G4 authoritative and prohibits a second numeric regulatory penalty", () => {
    expect(PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT.g4Separation.g4IsAuthoritativeForBlockReviewAndHighRiskState).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT.g4Separation.g4BlockedReviewMayReceiveSecondNumericPenalty).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT.g4Separation.g4HighRiskMayReceiveSecondNumericPenalty).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT.riskDimensionBoundary.regulatoryNumericScoreApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT.riskDimensionBoundary.wholeRiskDimensionReady).toBe(false)
  })

  it("projects a critical material regulatory event as blocked review with no numeric score", () => {
    const gate = evaluatePharmaGovernanceRegulatoryGate({
      eventClass: "REGULATORY",
      severity: "CRITICAL",
      governanceBlockedReview: false,
      affectedFacilityProductGeographyEstablished: true,
      regulatoryMateriality: "KNOWN_MATERIAL",
      remediationState: "OPEN",
      subsequentOutcomeEstablished: false,
    })

    expect(projectGlobalGenericsRegulatorySiteTreatment(gate)).toMatchObject({
      contextState: "BLOCKED_REVIEW",
      blocksPreview: true,
      regulatoryNumericScore: null,
      additionalNumericPenalty: null,
      wholeRiskDimensionReady: false,
    })
  })

  it("keeps high-risk context visible without inventing a second numeric deduction", () => {
    const gate = evaluatePharmaGovernanceRegulatoryGate({
      eventClass: "REGULATORY",
      severity: "HIGH",
      governanceBlockedReview: false,
      affectedFacilityProductGeographyEstablished: true,
      regulatoryMateriality: "KNOWN_MATERIAL",
      remediationState: "IN_PROGRESS",
      subsequentOutcomeEstablished: false,
    })

    expect(projectGlobalGenericsRegulatorySiteTreatment(gate)).toMatchObject({
      contextState: "HIGH_RISK_CONTEXT",
      blocksPreview: false,
      interpretationProminenceRequired: true,
      regulatoryNumericScore: null,
      additionalNumericPenalty: null,
      wholeRiskDimensionReady: false,
    })
  })

  it("keeps unknown materiality in review-required state rather than neutralizing it", () => {
    const gate = evaluatePharmaGovernanceRegulatoryGate({
      eventClass: "REGULATORY",
      severity: "MODERATE",
      governanceBlockedReview: false,
      affectedFacilityProductGeographyEstablished: true,
      regulatoryMateriality: "UNKNOWN",
      remediationState: "OPEN",
      subsequentOutcomeEstablished: false,
    })

    const projected = projectGlobalGenericsRegulatorySiteTreatment(gate)
    expect(projected.contextState).toBe("REVIEW_REQUIRED")
    expect(projected.regulatoryNumericScore).toBeNull()
    expect(projected.reasonCodes).toContain("REGULATORY_MATERIALITY_UNKNOWN")
  })

  it("retains closed-out historical events while keeping the whole Risk dimension incomplete", () => {
    const gate = evaluatePharmaGovernanceRegulatoryGate({
      eventClass: "REGULATORY",
      severity: "MODERATE",
      governanceBlockedReview: false,
      affectedFacilityProductGeographyEstablished: true,
      regulatoryMateriality: "KNOWN_MATERIAL",
      remediationState: "CLOSED_OUT",
      subsequentOutcomeEstablished: true,
    })

    const projected = projectGlobalGenericsRegulatorySiteTreatment(gate)
    expect(projected.contextState).toBe("CLEAR_CONTEXT")
    expect(projected.historicalEventRetained).toBe(true)
    expect(projected.wholeRiskDimensionReady).toBe(false)
  })
})
