import { describe, expect, it } from "vitest"
import {
  assessGlobalGenericsPipelineEvidence,
  PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE,
} from "./pharmaGlobalGenericsPipelineEvidenceContract"

describe("Global Generics pipeline/launch/approval evidence contract", () => {
  it("is mandatory Global-Generics Business Durability evidence", () => {
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.metricCode).toBe(
      "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE",
    )
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.supportedPrimarySubprofile).toBe(
      "GLOBAL_GENERICS",
    )
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.requirementLevel).toBe("MANDATORY")
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.canonicalDimension).toBe(
      "BUSINESS_DURABILITY",
    )
  })

  it("requires product, geography, dated stage, materiality and source traceability", () => {
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.identityRequirements).toEqual({
      productOrMoleculeRequired: true,
      geographyRequired: true,
      datedStageRequired: true,
      materialityRequired: true,
      economicRelevanceRequired: true,
      sourceTraceabilityRequired: true,
    })
  })

  it("distinguishes approval, launch and commercial traction states", () => {
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.allowedStages).toContain(
      "TENTATIVE_APPROVAL",
    )
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.allowedStages).toContain(
      "FINAL_APPROVAL",
    )
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.allowedStages).toContain("LAUNCHED")
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.allowedStages).toContain(
      "COMMERCIAL_TRACTION_CONFIRMED",
    )
    expect(
      PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.tentativeApprovalEquivalentToCommercialLaunch,
    ).toBe(false)
  })

  it("prohibits count-only automatic scoring", () => {
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.countOnlyScoringAllowed).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.approvalCountAutomaticallyPositive).toBe(
      false,
    )
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.launchCountAutomaticallyPositive).toBe(
      false,
    )
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.numericNormalizationState).toBe(
      "UNAPPROVED",
    )
  })

  it("retains adverse pipeline events instead of deleting them", () => {
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.delayedOrBlockedEventsRetained).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.withdrawnOrDiscontinuedEventsRetained).toBe(
      true,
    )
  })

  it("fails closed when no material economically relevant event exists", () => {
    expect(assessGlobalGenericsPipelineEvidence([])).toBe("INSUFFICIENT_EVIDENCE")
    expect(
      assessGlobalGenericsPipelineEvidence([
        {
          productOrMolecule: "Product A",
          geography: "US",
          stage: "FINAL_APPROVAL",
          eventDate: "2026-01-01",
          sourceType: "OFFICIAL_REGULATOR",
          materialityEstablished: false,
          economicRelevanceEstablished: true,
          evidenceReference: "REF-1",
        },
      ]),
    ).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("returns review required when only part of the evidence set is sufficiently identified", () => {
    expect(
      assessGlobalGenericsPipelineEvidence([
        {
          productOrMolecule: "Product A",
          geography: "US",
          stage: "FINAL_APPROVAL",
          eventDate: "2026-01-01",
          sourceType: "OFFICIAL_REGULATOR",
          materialityEstablished: true,
          economicRelevanceEstablished: true,
          evidenceReference: "REF-1",
        },
        {
          productOrMolecule: "",
          geography: "US",
          stage: "LAUNCHED",
          eventDate: "2026-02-01",
          sourceType: "ISSUER",
          materialityEstablished: true,
          economicRelevanceEstablished: true,
          evidenceReference: "REF-2",
        },
      ]),
    ).toBe("REVIEW_REQUIRED")
  })

  it("can become ready for a later numeric methodology without executing a score", () => {
    expect(
      assessGlobalGenericsPipelineEvidence([
        {
          productOrMolecule: "Product A",
          geography: "US",
          stage: "COMMERCIAL_TRACTION_CONFIRMED",
          eventDate: "2026-01-01",
          sourceType: "ISSUER",
          materialityEstablished: true,
          economicRelevanceEstablished: true,
          evidenceReference: "REF-1",
        },
      ]),
    ).toBe("READY_FOR_NUMERIC_METHODOLOGY")
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.scoreExecutionEnabled).toBe(false)
  })
})
