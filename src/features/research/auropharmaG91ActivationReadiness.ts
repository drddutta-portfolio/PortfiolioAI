import {
  AUROPHARMA_G8_1_CLASSIFICATION_REVIEW,
  AUROPHARMA_G8_1_CLASSIFICATION_REVIEW_VERSION,
} from "./auropharmaG8ClassificationEvidence"
import { buildPharmaThreeLayerResearchArchitecture } from "./pharmaThreeLayerResearchArchitecture"
import type { PharmaSubprofileAssignment } from "./pharmaSubprofileAssignment"
import type { ResearchMetric } from "./types"

export const AUROPHARMA_G9_1_ACTIVATION_READINESS_VERSION =
  "AUROPHARMA_G9_1_ACTIVATION_READINESS_AUTHORITY_V1" as const

export type AuropharmaG91ActivationState =
  | "READY"
  | "READY_FOR_ACTIVATION"
  | "READY_EMERGING"
  | "REVIEW_REQUIRED"
  | "BLOCKED_METHODOLOGY"
  | "BLOCKED_UPSTREAM_SCORING"
  | "BLOCKED_UPSTREAM_RECOMMENDATION"

export function buildAuropharmaG91AssignmentCandidate(
  securityId: string,
): PharmaSubprofileAssignment {
  return {
    securityId,
    profileCode: "PHARMA_V1",
    primarySubprofileCode: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.primary,
    assignmentVersion: 1,
    assignmentState: "REVIEWED",
    effectiveFrom: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.proposedEffectiveFrom,
    effectiveTo: null,
    sourceReference: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW_VERSION,
    reasonCode: "G9_1_ACTIVATION_READINESS_CANDIDATE",
    confidence: "HIGH",
    reviewedBy: "G9_1_LOCAL_ACTIVATION_READINESS",
    reviewedAt: "2026-09-20T00:00:00Z",
    secondaryExposures: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.emergingWatches.map(
      (exposureCode) => ({
        exposureCode,
        materiality: "EMERGING" as const,
        confidence: "HIGH" as const,
        assignmentState: "REVIEWED" as const,
        effectiveFrom: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.proposedEffectiveFrom,
        effectiveTo: null,
        sourceReference: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW_VERSION,
        reasonCode: "G9_1_REVIEWED_EMERGING_CONTEXT",
        reviewedBy: "G9_1_LOCAL_ACTIVATION_READINESS",
        reviewedAt: "2026-09-20T00:00:00Z",
      }),
    ),
  }
}

export interface AuropharmaG91ActivationReadinessContract {
  readonly version: typeof AUROPHARMA_G9_1_ACTIVATION_READINESS_VERSION
  readonly securitySymbol: "AUROPHARMA"
  readonly candidateAssignment: PharmaSubprofileAssignment
  readonly parentProfile: {
    readonly code: "PHARMA_V1"
    readonly state: "READY"
  }
  readonly primaryAuthority: {
    readonly subprofileCode: "GLOBAL_GENERICS"
    readonly state: "READY_FOR_ACTIVATION"
    readonly effectiveFrom: "2026-03-31"
  }
  readonly secondaryAuthority: {
    readonly subprofileCode: "API_BULK_DRUGS"
    readonly materiality: "EMERGING"
    readonly state: "READY_EMERGING"
    readonly includedInReadinessDenominator: false
    readonly includedInScoreDenominator: false
  }
  readonly unresolvedAuthority: {
    readonly subprofileCode: "BIOPHARMA_BIOSIMILARS"
    readonly state: "REVIEW_REQUIRED"
    readonly activeAssignmentRowAllowed: false
  }
  readonly numericScoring: {
    readonly state: "BLOCKED_METHODOLOGY"
    readonly reason: "GLOBAL_GENERICS_PRIMARY_METHODOLOGY_INCOMPLETE"
  }
  readonly recommendation: {
    readonly state: "BLOCKED_UPSTREAM_SCORING"
  }
  readonly positionSizing: {
    readonly state: "BLOCKED_UPSTREAM_RECOMMENDATION"
  }
  readonly readinessRoleAwareness: {
    readonly confirmed: true
    readonly interpretationScope: "COMPANY_ACTIVE_ASSIGNMENT_ROLE"
    readonly denominatorPrimarySubprofile: "GLOBAL_GENERICS"
    readonly excludedEmergingSubprofiles: readonly ["API_BULK_DRUGS"]
    readonly primaryRequirementCount: number
    readonly emergingRequirementCount: 0
  }
  readonly canonicalAssignmentPersisted: false
  readonly productionMutationEnabled: false
  readonly scoreExecutionEnabled: false
  readonly recommendationPersistenceEnabled: false
  readonly positionSizingPersistenceEnabled: false
}

export function buildAuropharmaG91ActivationReadinessContract(
  securityId: string,
  metrics: readonly ResearchMetric[],
  evaluationDate: string,
): AuropharmaG91ActivationReadinessContract {
  const candidateAssignment = buildAuropharmaG91AssignmentCandidate(securityId)
  const architecture = buildPharmaThreeLayerResearchArchitecture(
    candidateAssignment,
    metrics,
    evaluationDate,
    AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.unresolvedExposures.map(
      (exposureCode) => ({
        exposureCode,
        reasonCode: "NO_REVENUE_OR_PROFIT_SHARE",
      }),
    ),
  )

  const apiExposure = architecture.secondaryExposures.find(
    (item) => item.exposureCode === "API_BULK_DRUGS",
  )
  const biosimilars = architecture.unresolvedExposures.find(
    (item) => item.exposureCode === "BIOPHARMA_BIOSIMILARS",
  )

  const roleAwarenessConfirmed =
    architecture.primary.subprofileCode === "GLOBAL_GENERICS"
    && apiExposure?.mode === "EMERGING_WATCH"
    && apiExposure.requirements.length === 0
    && biosimilars?.exposureCode === "BIOPHARMA_BIOSIMILARS"
    && architecture.interpretationScope === "COMPANY_ACTIVE_ASSIGNMENT_ROLE"

  if (!roleAwarenessConfirmed) {
    throw new Error("G9.1 role-aware readiness contract no longer matches the reviewed AUROPHARMA architecture")
  }

  return {
    version: AUROPHARMA_G9_1_ACTIVATION_READINESS_VERSION,
    securitySymbol: "AUROPHARMA",
    candidateAssignment,
    parentProfile: {
      code: "PHARMA_V1",
      state: "READY",
    },
    primaryAuthority: {
      subprofileCode: "GLOBAL_GENERICS",
      state: "READY_FOR_ACTIVATION",
      effectiveFrom: "2026-03-31",
    },
    secondaryAuthority: {
      subprofileCode: "API_BULK_DRUGS",
      materiality: "EMERGING",
      state: "READY_EMERGING",
      includedInReadinessDenominator: false,
      includedInScoreDenominator: false,
    },
    unresolvedAuthority: {
      subprofileCode: "BIOPHARMA_BIOSIMILARS",
      state: "REVIEW_REQUIRED",
      activeAssignmentRowAllowed: false,
    },
    numericScoring: {
      state: "BLOCKED_METHODOLOGY",
      reason: "GLOBAL_GENERICS_PRIMARY_METHODOLOGY_INCOMPLETE",
    },
    recommendation: {
      state: "BLOCKED_UPSTREAM_SCORING",
    },
    positionSizing: {
      state: "BLOCKED_UPSTREAM_RECOMMENDATION",
    },
    readinessRoleAwareness: {
      confirmed: true,
      interpretationScope: "COMPANY_ACTIVE_ASSIGNMENT_ROLE",
      denominatorPrimarySubprofile: "GLOBAL_GENERICS",
      excludedEmergingSubprofiles: ["API_BULK_DRUGS"],
      primaryRequirementCount: architecture.primary.requirements.length,
      emergingRequirementCount: 0,
    },
    canonicalAssignmentPersisted: false,
    productionMutationEnabled: false,
    scoreExecutionEnabled: false,
    recommendationPersistenceEnabled: false,
    positionSizingPersistenceEnabled: false,
  }
}
