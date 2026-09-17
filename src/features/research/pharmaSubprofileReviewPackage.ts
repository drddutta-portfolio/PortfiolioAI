import type { PharmaSubprofileCandidate } from "./pharmaSubprofileCandidateRegistry"
import type {
  PharmaSubprofileAssignment,
  PharmaSubprofileCode,
  ResearchSubprofileConfidence,
  ResearchSubprofileExposureMateriality,
} from "./pharmaSubprofileAssignment"

export type PharmaSubprofileReviewEvidenceClass =
  | "PARENT_REQUIREMENT_EVIDENCE"
  | "SUBPROFILE_EVIDENCE"
  | "CONDITION_ACTIVATION_EVIDENCE"
  | "CONTEXTUAL_NON_READINESS"
  | "DUPLICATE_OR_CONFLICTING"
  | "UNSUPPORTED_FOR_PROMOTION"

export type PharmaSubprofileReviewEvidenceStance = "SUPPORTS" | "CONTRADICTS" | "NEUTRAL"

export interface PharmaSubprofileReviewEvidenceItem {
  readonly evidenceId: string
  readonly sourceReference: string
  readonly sourceRecordId: string | null
  readonly classification: PharmaSubprofileReviewEvidenceClass
  readonly stance: PharmaSubprofileReviewEvidenceStance
  readonly eligibleForPromotion: boolean
  readonly summary: string
}

export interface PharmaSubprofileSecondaryExposureAssessment {
  readonly exposureCode: PharmaSubprofileCode
  readonly materiality: ResearchSubprofileExposureMateriality
  readonly confidence: ResearchSubprofileConfidence
  readonly evidenceReferences: readonly string[]
}

export type PharmaSubprofileReviewDecision = "KEEP_PROVISIONAL" | "READY_FOR_REVIEW" | "DISPUTED"

export type PharmaSubprofileReviewBlocker =
  | "MISSING_CANONICAL_SECURITY_ID"
  | "INVALID_ASSIGNMENT_VERSION"
  | "NO_PROMOTION_ELIGIBLE_SUBPROFILE_EVIDENCE"
  | "LOW_CONFIDENCE"
  | "MISSING_EFFECTIVE_FROM"
  | "CONFLICTING_PRIMARY_MODEL_EVIDENCE"
  | "SECONDARY_EXPOSURE_REVIEW_INCOMPLETE"
  | "UNRESOLVED_SECONDARY_EXPOSURE_MATERIALITY"
  | "CONDITIONAL_MATERIALITY_REVIEW_INCOMPLETE"

export interface BuildPharmaSubprofileReviewPackageInput {
  readonly candidate: PharmaSubprofileCandidate
  readonly securityId: string
  readonly assignmentVersionCandidate: number
  readonly proposedConfidence: ResearchSubprofileConfidence
  readonly effectiveFromCandidate: string | null
  readonly evidenceItems: readonly PharmaSubprofileReviewEvidenceItem[]
  readonly secondaryExposureAssessment: readonly PharmaSubprofileSecondaryExposureAssessment[]
  readonly secondaryExposuresReviewed: boolean
  readonly conditionalMaterialityReviewed: boolean
}

export interface PharmaSubprofileReviewPackage {
  readonly symbol: string
  readonly securityId: string
  readonly profileCode: "PHARMA_V1"
  readonly proposedPrimarySubprofileCode: PharmaSubprofileCode
  readonly candidateSourceReference: string
  readonly evidenceItems: readonly PharmaSubprofileReviewEvidenceItem[]
  readonly primaryModelAssessment: {
    readonly proposedSubprofile: PharmaSubprofileCode
    readonly supportState: "SUPPORTED" | "INSUFFICIENT" | "CONFLICTING"
    readonly confidence: ResearchSubprofileConfidence
    readonly reasonCodes: readonly string[]
  }
  readonly secondaryExposureAssessment: readonly PharmaSubprofileSecondaryExposureAssessment[]
  readonly effectiveFromCandidate: string | null
  readonly reviewDecision: PharmaSubprofileReviewDecision
  readonly blockers: readonly PharmaSubprofileReviewBlocker[]
  readonly proposedAssignment: PharmaSubprofileAssignment | null
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u

function hasAtLeastMediumConfidence(confidence: ResearchSubprofileConfidence) {
  return confidence === "MEDIUM" || confidence === "HIGH"
}

function promotionEligibleSubprofileEvidence(items: readonly PharmaSubprofileReviewEvidenceItem[]) {
  return items.filter((item) =>
    item.classification === "SUBPROFILE_EVIDENCE"
    && item.stance === "SUPPORTS"
    && item.eligibleForPromotion
    && item.sourceReference.trim().length > 0)
}

function hasConflictingPrimaryModelEvidence(items: readonly PharmaSubprofileReviewEvidenceItem[]) {
  return items.some((item) =>
    item.stance === "CONTRADICTS"
    && item.eligibleForPromotion
    && (item.classification === "SUBPROFILE_EVIDENCE" || item.classification === "DUPLICATE_OR_CONFLICTING"))
}

function hasUnresolvedSecondaryExposureMateriality(items: readonly PharmaSubprofileSecondaryExposureAssessment[]) {
  return items.some((item) => item.materiality === "UNKNOWN")
}

function buildBlockers(input: BuildPharmaSubprofileReviewPackageInput): PharmaSubprofileReviewBlocker[] {
  const blockers: PharmaSubprofileReviewBlocker[] = []
  const eligibleEvidence = promotionEligibleSubprofileEvidence(input.evidenceItems)

  if (!input.securityId.trim()) blockers.push("MISSING_CANONICAL_SECURITY_ID")
  if (!Number.isInteger(input.assignmentVersionCandidate) || input.assignmentVersionCandidate < 1) blockers.push("INVALID_ASSIGNMENT_VERSION")
  if (!eligibleEvidence.length) blockers.push("NO_PROMOTION_ELIGIBLE_SUBPROFILE_EVIDENCE")
  if (!hasAtLeastMediumConfidence(input.proposedConfidence)) blockers.push("LOW_CONFIDENCE")
  if (input.effectiveFromCandidate === null || !ISO_DATE.test(input.effectiveFromCandidate)) blockers.push("MISSING_EFFECTIVE_FROM")
  if (hasConflictingPrimaryModelEvidence(input.evidenceItems)) blockers.push("CONFLICTING_PRIMARY_MODEL_EVIDENCE")
  if (!input.secondaryExposuresReviewed) blockers.push("SECONDARY_EXPOSURE_REVIEW_INCOMPLETE")
  if (hasUnresolvedSecondaryExposureMateriality(input.secondaryExposureAssessment)) blockers.push("UNRESOLVED_SECONDARY_EXPOSURE_MATERIALITY")
  if (!input.conditionalMaterialityReviewed) blockers.push("CONDITIONAL_MATERIALITY_REVIEW_INCOMPLETE")

  return blockers
}

function buildProvisionalReviewDraft(
  input: BuildPharmaSubprofileReviewPackageInput,
  eligibleEvidence: readonly PharmaSubprofileReviewEvidenceItem[],
): PharmaSubprofileAssignment {
  const sourceReference = [...new Set(eligibleEvidence.map((item) => item.sourceReference.trim()))].join("; ")

  return {
    securityId: input.securityId,
    profileCode: "PHARMA_V1",
    primarySubprofileCode: input.candidate.proposedPrimarySubprofileCode,
    assignmentVersion: input.assignmentVersionCandidate,
    assignmentState: "PROVISIONAL",
    effectiveFrom: input.effectiveFromCandidate,
    effectiveTo: null,
    sourceReference,
    reasonCode: "EVIDENCE_BACKED_REVIEW_READY",
    confidence: input.proposedConfidence,
    reviewedBy: null,
    reviewedAt: null,
    secondaryExposures: input.secondaryExposureAssessment.map((exposure) => ({
      exposureCode: exposure.exposureCode,
      materiality: exposure.materiality,
      confidence: exposure.confidence,
      assignmentState: "PROVISIONAL",
      effectiveFrom: input.effectiveFromCandidate,
      effectiveTo: null,
      sourceReference: exposure.evidenceReferences.join("; "),
      reasonCode: "SECONDARY_EXPOSURE_REVIEWED_IN_PACKAGE",
      reviewedBy: null,
      reviewedAt: null,
    })),
  }
}

/**
 * Builds a local/read-only Gate E review artifact. This function performs no I/O,
 * makes no provider calls and never promotes an assignment to REVIEWED. The
 * returned assignment, when present, is only a PROVISIONAL draft for explicit
 * human review and a separately gated persistence step.
 */
export function buildPharmaSubprofileReviewPackage(input: BuildPharmaSubprofileReviewPackageInput): PharmaSubprofileReviewPackage {
  const eligibleEvidence = promotionEligibleSubprofileEvidence(input.evidenceItems)
  const conflicting = hasConflictingPrimaryModelEvidence(input.evidenceItems)
  const blockers = buildBlockers(input)

  const supportState = conflicting
    ? "CONFLICTING"
    : eligibleEvidence.length
      ? "SUPPORTED"
      : "INSUFFICIENT"

  const reviewDecision: PharmaSubprofileReviewDecision = conflicting
    ? "DISPUTED"
    : blockers.length === 0
      ? "READY_FOR_REVIEW"
      : "KEEP_PROVISIONAL"

  const reasonCodes = blockers.length ? blockers : ["EVIDENCE_BACKED_REVIEW_READY"]

  return {
    symbol: input.candidate.symbol,
    securityId: input.securityId,
    profileCode: "PHARMA_V1",
    proposedPrimarySubprofileCode: input.candidate.proposedPrimarySubprofileCode,
    candidateSourceReference: input.candidate.sourceReference,
    evidenceItems: input.evidenceItems,
    primaryModelAssessment: {
      proposedSubprofile: input.candidate.proposedPrimarySubprofileCode,
      supportState,
      confidence: input.proposedConfidence,
      reasonCodes,
    },
    secondaryExposureAssessment: input.secondaryExposureAssessment,
    effectiveFromCandidate: input.effectiveFromCandidate,
    reviewDecision,
    blockers,
    proposedAssignment: reviewDecision === "READY_FOR_REVIEW"
      ? buildProvisionalReviewDraft(input, eligibleEvidence)
      : null,
  }
}
