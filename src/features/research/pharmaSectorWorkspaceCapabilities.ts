import { PHARMA_G8_3_PORTABILITY_VALIDATION } from "./pharmaG8PortabilityIsolationValidation"
import { PHARMA_G7_VALIDATION_INVARIANTS } from "./pharmaG7ValidationAndResearchGapRegister"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import type {
  PharmaSubprofileAssignment,
  PharmaSubprofileCode,
  ResearchSubprofileExposure,
} from "./pharmaSubprofileAssignment"
import {
  buildPharmaThreeLayerResearchArchitecture,
  type PharmaUnresolvedExposure,
} from "./pharmaThreeLayerResearchArchitecture"
import type { ResearchMetric } from "./types"

export const PHARMA_SECTOR_WORKSPACE_CAPABILITIES_VERSION =
  "PHARMA_V1_SECTOR_WORKSPACE_CAPABILITIES_V1" as const

export type PharmaCapabilityAuthorityState =
  | "READY"
  | "READY_PRIMARY"
  | "READY_MATERIAL"
  | "READY_EMERGING"
  | "REVIEW_REQUIRED"
  | "NOT_ENGAGED"
  | "BLOCKED_METHODOLOGY"
  | "BLOCKED_UPSTREAM_SCORING"
  | "BLOCKED_UPSTREAM_RECOMMENDATION"

export interface PharmaSectorWorkspaceCapabilities {
  readonly version: typeof PHARMA_SECTOR_WORKSPACE_CAPABILITIES_VERSION
  readonly securityId: string
  readonly profileCode: "PHARMA_V1"
  readonly classificationLock: {
    readonly primary: {
      readonly code: PharmaSubprofileCode
      readonly displayName: string
      readonly assignmentState: PharmaSubprofileAssignment["assignmentState"]
      readonly confidence: PharmaSubprofileAssignment["confidence"]
      readonly effectiveFrom: string
    }
    readonly materialOverlays: readonly {
      readonly code: PharmaSubprofileCode
      readonly displayName: string
      readonly confidence: ResearchSubprofileExposure["confidence"]
      readonly state: "READY_MATERIAL"
    }[]
    readonly emergingWatches: readonly {
      readonly code: PharmaSubprofileCode
      readonly displayName: string
      readonly confidence: ResearchSubprofileExposure["confidence"]
      readonly state: "READY_EMERGING"
    }[]
    readonly unresolvedExposures: readonly {
      readonly code: PharmaSubprofileCode
      readonly displayName: string
      readonly reasonCode: string
      readonly state: "REVIEW_REQUIRED"
    }[]
    readonly state: "READY"
  }
  readonly architecture: ReturnType<typeof buildPharmaThreeLayerResearchArchitecture>
  readonly portability: {
    readonly passCount: number
    readonly totalCount: number
    readonly engineChangeResult: string
    readonly rawEvidenceScope: "SECURITY_COMPANY"
    readonly interpretationScope: "COMPANY_ACTIVE_ASSIGNMENT_ROLE"
  }
  readonly activation: {
    readonly parentProfile: "READY"
    readonly primaryAuthority: "READY_PRIMARY"
    readonly materialOverlayAuthority: "READY_MATERIAL" | "NOT_ENGAGED"
    readonly emergingAuthority: "READY_EMERGING" | "NOT_ENGAGED"
    readonly unresolvedAuthority: "REVIEW_REQUIRED" | "NOT_ENGAGED"
    readonly numericScoring: "BLOCKED_METHODOLOGY"
    readonly recommendation: "BLOCKED_UPSTREAM_SCORING"
    readonly positionSizing: "BLOCKED_UPSTREAM_RECOMMENDATION"
    readonly scoreExecutionEnabled: false
    readonly recommendationPersistenceEnabled: false
    readonly positionSizingPersistenceEnabled: false
  }
  readonly canonicalAssignment: {
    readonly resolverState: "RESOLVED"
    readonly assignmentVersion: number
    readonly sourceReference: string
    readonly reasonCode: string
    readonly reviewedBy: string | null
    readonly reviewedAt: string | null
    readonly effectiveFrom: string
    readonly effectiveTo: string | null
  }
}

function isActiveReviewedExposure(
  exposure: ResearchSubprofileExposure,
  evaluationDate: string,
) {
  return exposure.assignmentState === "REVIEWED"
    && exposure.effectiveFrom !== null
    && exposure.effectiveFrom <= evaluationDate
    && (exposure.effectiveTo === null || evaluationDate < exposure.effectiveTo)
}

function displayName(code: PharmaSubprofileCode) {
  return PHARMA_SUBPROFILE_CONTRACTS[code].displayName
}

export function buildPharmaSectorWorkspaceCapabilities(
  assignment: PharmaSubprofileAssignment,
  metrics: readonly ResearchMetric[],
  evaluationDate: string,
  unresolvedExposures: readonly PharmaUnresolvedExposure[] = [],
): PharmaSectorWorkspaceCapabilities {
  if (assignment.profileCode !== "PHARMA_V1") {
    throw new Error("PHARMA_V1 sector workspace requires a Pharma assignment")
  }
  if (
    assignment.assignmentState !== "REVIEWED"
    || assignment.effectiveFrom === null
    || assignment.effectiveFrom > evaluationDate
    || (assignment.effectiveTo !== null && evaluationDate >= assignment.effectiveTo)
  ) {
    throw new Error("PHARMA_V1 sector workspace requires an active reviewed assignment")
  }

  const activeSecondaries = assignment.secondaryExposures.filter(
    (exposure) => isActiveReviewedExposure(exposure, evaluationDate),
  )
  const materialOverlays = activeSecondaries.filter(
    (exposure) => exposure.materiality === "MATERIAL",
  )
  const emergingWatches = activeSecondaries.filter(
    (exposure) => exposure.materiality === "EMERGING",
  )
  const architecture = buildPharmaThreeLayerResearchArchitecture(
    assignment,
    metrics,
    evaluationDate,
    unresolvedExposures,
  )

  if (architecture.rawEvidenceScope !== "SECURITY_COMPANY") {
    throw new Error("Pharma capability model requires company-scoped raw evidence")
  }
  if (architecture.interpretationScope !== "COMPANY_ACTIVE_ASSIGNMENT_ROLE") {
    throw new Error("Pharma capability model requires role-aware interpretation")
  }
  if (
    PHARMA_G7_VALIDATION_INVARIANTS.bankNbfcFallbackAllowed
    || PHARMA_G7_VALIDATION_INVARIANTS.hiddenReweightingAllowed
    || PHARMA_G7_VALIDATION_INVARIANTS.governanceHiddenDoubleCountingAllowed
  ) {
    throw new Error("Pharma capability model violates locked G7 isolation invariants")
  }

  return {
    version: PHARMA_SECTOR_WORKSPACE_CAPABILITIES_VERSION,
    securityId: assignment.securityId,
    profileCode: "PHARMA_V1",
    classificationLock: {
      primary: {
        code: assignment.primarySubprofileCode,
        displayName: displayName(assignment.primarySubprofileCode),
        assignmentState: assignment.assignmentState,
        confidence: assignment.confidence,
        effectiveFrom: assignment.effectiveFrom,
      },
      materialOverlays: materialOverlays.map((exposure) => ({
        code: exposure.exposureCode,
        displayName: displayName(exposure.exposureCode),
        confidence: exposure.confidence,
        state: "READY_MATERIAL" as const,
      })),
      emergingWatches: emergingWatches.map((exposure) => ({
        code: exposure.exposureCode,
        displayName: displayName(exposure.exposureCode),
        confidence: exposure.confidence,
        state: "READY_EMERGING" as const,
      })),
      unresolvedExposures: unresolvedExposures.map((exposure) => ({
        code: exposure.exposureCode,
        displayName: displayName(exposure.exposureCode),
        reasonCode: exposure.reasonCode,
        state: "REVIEW_REQUIRED" as const,
      })),
      state: "READY",
    },
    architecture,
    portability: {
      passCount: PHARMA_G8_3_PORTABILITY_VALIDATION.passCount,
      totalCount: PHARMA_G8_3_PORTABILITY_VALIDATION.totalCount,
      engineChangeResult: PHARMA_G8_3_PORTABILITY_VALIDATION.engineChangeTest.result,
      rawEvidenceScope: architecture.rawEvidenceScope,
      interpretationScope: architecture.interpretationScope,
    },
    activation: {
      parentProfile: "READY",
      primaryAuthority: "READY_PRIMARY",
      materialOverlayAuthority: materialOverlays.length ? "READY_MATERIAL" : "NOT_ENGAGED",
      emergingAuthority: emergingWatches.length ? "READY_EMERGING" : "NOT_ENGAGED",
      unresolvedAuthority: unresolvedExposures.length ? "REVIEW_REQUIRED" : "NOT_ENGAGED",
      numericScoring: "BLOCKED_METHODOLOGY",
      recommendation: "BLOCKED_UPSTREAM_SCORING",
      positionSizing: "BLOCKED_UPSTREAM_RECOMMENDATION",
      scoreExecutionEnabled: false,
      recommendationPersistenceEnabled: false,
      positionSizingPersistenceEnabled: false,
    },
    canonicalAssignment: {
      resolverState: "RESOLVED",
      assignmentVersion: assignment.assignmentVersion,
      sourceReference: assignment.sourceReference,
      reasonCode: assignment.reasonCode,
      reviewedBy: assignment.reviewedBy,
      reviewedAt: assignment.reviewedAt,
      effectiveFrom: assignment.effectiveFrom,
      effectiveTo: assignment.effectiveTo,
    },
  }
}
