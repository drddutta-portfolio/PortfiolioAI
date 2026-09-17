import { describe, expect, it } from "vitest"
import { PHARMA_SUBPROFILE_CANDIDATE_REGISTRY } from "./pharmaSubprofileCandidateRegistry"
import { buildPharmaSubprofileReviewPackage, type BuildPharmaSubprofileReviewPackageInput, type PharmaSubprofileReviewEvidenceItem } from "./pharmaSubprofileReviewPackage"

const candidate = PHARMA_SUBPROFILE_CANDIDATE_REGISTRY.find((item) => item.symbol === "TORNTPHARM")!
const LOCAL_SECURITY_ID = "a4000000-0000-0000-0000-000000000002"
const HISTORICAL_R4H_SECURITY_ID = "da69b3eb-0343-44f8-912c-288b826118cc"

function evidence(overrides: Partial<PharmaSubprofileReviewEvidenceItem> = {}): PharmaSubprofileReviewEvidenceItem {
  return {
    evidenceId: "evidence-1",
    sourceReference: "issuer-business-model-review",
    sourceRecordId: "source-record-1",
    classification: "SUBPROFILE_EVIDENCE",
    stance: "SUPPORTS",
    eligibleForPromotion: true,
    summary: "Evidence supports the proposed primary business model.",
    ...overrides,
  }
}

function input(overrides: Partial<BuildPharmaSubprofileReviewPackageInput> = {}): BuildPharmaSubprofileReviewPackageInput {
  return {
    candidate,
    securityId: LOCAL_SECURITY_ID,
    assignmentVersionCandidate: 1,
    proposedConfidence: "MEDIUM",
    effectiveFromCandidate: "2026-09-15",
    evidenceItems: [evidence()],
    secondaryExposureAssessment: [],
    secondaryExposuresReviewed: true,
    conditionalMaterialityReviewed: true,
    ...overrides,
  }
}

describe("buildPharmaSubprofileReviewPackage", () => {
  it("keeps TORNTPHARM provisional when only identity-fixture context is available", () => {
    const result = buildPharmaSubprofileReviewPackage(input({
      proposedConfidence: "LOW",
      effectiveFromCandidate: null,
      evidenceItems: [evidence({
        sourceReference: "LOCAL_UI_FIXTURE",
        sourceRecordId: "10000000-0000-4000-8000-000000000072",
        classification: "CONTEXTUAL_NON_READINESS",
        stance: "NEUTRAL",
        eligibleForPromotion: false,
        summary: "Local fixture proves identity only and cannot support business-model promotion.",
      })],
      secondaryExposuresReviewed: false,
      conditionalMaterialityReviewed: false,
    }))

    expect(result.reviewDecision).toBe("KEEP_PROVISIONAL")
    expect(result.primaryModelAssessment.supportState).toBe("INSUFFICIENT")
    expect(result.blockers).toContain("NO_PROMOTION_ELIGIBLE_SUBPROFILE_EVIDENCE")
    expect(result.proposedAssignment).toBeNull()
  })

  it("prepares only a PROVISIONAL draft when the package is ready for explicit human review", () => {
    const result = buildPharmaSubprofileReviewPackage(input())

    expect(result.reviewDecision).toBe("READY_FOR_REVIEW")
    expect(result.primaryModelAssessment.supportState).toBe("SUPPORTED")
    expect(result.proposedAssignment?.assignmentState).toBe("PROVISIONAL")
    expect(result.proposedAssignment?.reviewedBy).toBeNull()
    expect(result.proposedAssignment?.reviewedAt).toBeNull()
    expect(result.proposedAssignment?.primarySubprofileCode).toBe("DOMESTIC_FORMULATIONS")
  })

  it("fails closed as disputed when eligible evidence contradicts the proposed primary model", () => {
    const result = buildPharmaSubprofileReviewPackage(input({
      evidenceItems: [
        evidence(),
        evidence({
          evidenceId: "conflict-1",
          sourceReference: "issuer-segment-disclosure",
          classification: "DUPLICATE_OR_CONFLICTING",
          stance: "CONTRADICTS",
          summary: "Reviewed evidence conflicts with the proposed primary model.",
        }),
      ],
    }))

    expect(result.reviewDecision).toBe("DISPUTED")
    expect(result.primaryModelAssessment.supportState).toBe("CONFLICTING")
    expect(result.blockers).toContain("CONFLICTING_PRIMARY_MODEL_EVIDENCE")
    expect(result.proposedAssignment).toBeNull()
  })

  it("does not infer promotion from LOW confidence or a missing effective date", () => {
    const lowConfidence = buildPharmaSubprofileReviewPackage(input({ proposedConfidence: "LOW" }))
    expect(lowConfidence.reviewDecision).toBe("KEEP_PROVISIONAL")
    expect(lowConfidence.blockers).toContain("LOW_CONFIDENCE")

    const missingDate = buildPharmaSubprofileReviewPackage(input({ effectiveFromCandidate: null }))
    expect(missingDate.reviewDecision).toBe("KEEP_PROVISIONAL")
    expect(missingDate.blockers).toContain("MISSING_EFFECTIVE_FROM")
  })

  it("keeps an UNKNOWN secondary exposure provisional until materiality is resolved", () => {
    const result = buildPharmaSubprofileReviewPackage(input({
      secondaryExposureAssessment: [{
        exposureCode: "GLOBAL_GENERICS",
        materiality: "UNKNOWN",
        confidence: "LOW",
        evidenceReferences: ["secondary-exposure-review"],
      }],
    }))

    expect(result.reviewDecision).toBe("KEEP_PROVISIONAL")
    expect(result.blockers).toContain("UNRESOLVED_SECONDARY_EXPOSURE_MATERIALITY")
    expect(result.proposedAssignment).toBeNull()
  })

  it("requires primary-subprofile reclassification review for a DOMINANT secondary exposure", () => {
    const result = buildPharmaSubprofileReviewPackage(input({
      secondaryExposureAssessment: [{
        exposureCode: "GLOBAL_GENERICS",
        materiality: "DOMINANT",
        confidence: "HIGH",
        evidenceReferences: ["secondary-exposure-review"],
      }],
    }))

    expect(result.reviewDecision).toBe("KEEP_PROVISIONAL")
    expect(result.blockers).toContain("DOMINANT_SECONDARY_EXPOSURE_RECLASSIFICATION_REQUIRED")
    expect(result.proposedAssignment).toBeNull()
  })

  it("allows a reviewed secondary exposure with resolved materiality to remain a provisional draft", () => {
    const result = buildPharmaSubprofileReviewPackage(input({
      secondaryExposureAssessment: [{
        exposureCode: "GLOBAL_GENERICS",
        materiality: "MATERIAL",
        confidence: "MEDIUM",
        evidenceReferences: ["secondary-exposure-review"],
      }],
    }))

    expect(result.reviewDecision).toBe("READY_FOR_REVIEW")
    expect(result.proposedAssignment?.secondaryExposures).toEqual([{
      exposureCode: "GLOBAL_GENERICS",
      materiality: "MATERIAL",
      confidence: "MEDIUM",
      assignmentState: "PROVISIONAL",
      effectiveFrom: "2026-09-15",
      effectiveTo: null,
      sourceReference: "secondary-exposure-review",
      reasonCode: "SECONDARY_EXPOSURE_REVIEWED_IN_PACKAGE",
      reviewedBy: null,
      reviewedAt: null,
    }])
  })

  it("uses the environment-resolved security id and never substitutes the historical R4H id", () => {
    const result = buildPharmaSubprofileReviewPackage(input())

    expect(result.securityId).toBe(LOCAL_SECURITY_ID)
    expect(result.proposedAssignment?.securityId).toBe(LOCAL_SECURITY_ID)
    expect(result.proposedAssignment?.securityId).not.toBe(HISTORICAL_R4H_SECURITY_ID)
  })

  it("requires a valid environment-resolved identity and assignment version", () => {
    const missingIdentity = buildPharmaSubprofileReviewPackage(input({ securityId: "" }))
    expect(missingIdentity.blockers).toContain("MISSING_CANONICAL_SECURITY_ID")
    expect(missingIdentity.proposedAssignment).toBeNull()

    const invalidVersion = buildPharmaSubprofileReviewPackage(input({ assignmentVersionCandidate: 0 }))
    expect(invalidVersion.blockers).toContain("INVALID_ASSIGNMENT_VERSION")
    expect(invalidVersion.proposedAssignment).toBeNull()
  })
})
