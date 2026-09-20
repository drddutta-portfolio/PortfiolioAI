import type { PharmaG7DimensionCode } from "./pharmaG7ReadOnlyScoringAdapter"
import type {
  PharmaSubprofileCode,
  PharmaSubprofileResolution,
  ResearchSubprofileExposure,
} from "./pharmaSubprofileAssignment"

export const PHARMA_GATE_I1_RECOMMENDATION_AUTHORITY_VERSION =
  "PHARMA_GATE_I1_RECOMMENDATION_AUTHORITY_V1" as const

export const PHARMA_GATE_I1_POLICY_IDENTITY = {
  version: "PHARMA_V1_RECOMMENDATION_POLICY_IDENTITY_V1",
  researchAuthority: {
    parentProfileCode: "PHARMA",
    parentProfileVersion: "PHARMA_V1",
  },
  recommendationPolicyCode: "PHARMA_V1",
  recommendationPolicyStorageState: "NOT_MATERIALIZED",
  legacyScoringProfileCode: "PHARMA_HEALTHCARE",
  legacyPolicyUsage: "FORBIDDEN_FOR_GATE_I",
} as const

export type PharmaRecommendationSuggestedRole =
  | "CORE_CANDIDATE"
  | "SATELLITE_CANDIDATE"
  | "WATCH"
  | "AVOID"
  | "INSUFFICIENT"

export interface PharmaRecommendationDimensionAuthority {
  readonly dimensionCode: PharmaG7DimensionCode
  readonly score: number
  readonly scoreContractVersion: string
  readonly evidenceLineage: readonly string[]
  readonly methodologyLineage: readonly {
    readonly decisionId: string
    readonly contractVersion: string
  }[]
}

export interface PharmaRecommendationScoreReadyAuthority {
  readonly state: "SCORE_READY"
  readonly securityId: string
  readonly securitySymbol: string
  readonly parentProfileCode: "PHARMA"
  readonly parentProfileVersion: "PHARMA_V1"
  readonly primarySubprofile: PharmaSubprofileCode
  readonly scoreContractVersion: string
  readonly overallScore: number
  readonly dimensions: readonly PharmaRecommendationDimensionAuthority[]
  readonly scoreReadyCoverage: number
  readonly governanceState: string
  readonly overlayContext: {
    readonly materialOverlayCode: PharmaSubprofileCode | null
    readonly numericModifierApplied: boolean
    readonly secondIndependentStockScore: null
  }
  readonly emergingWatch: {
    readonly code: PharmaSubprofileCode | null
    readonly numericParticipation: false
  }
  readonly evidenceLineage: readonly string[]
  readonly methodologyLineage: readonly {
    readonly decisionId: string
    readonly contractVersion: string
  }[]
  readonly readOnly: true
  readonly nonPersisting: true
}

export interface PharmaRecommendationScoreNotComputableAuthority {
  readonly state: "SCORE_NOT_COMPUTABLE"
  readonly securityId: string
  readonly securitySymbol: string
  readonly parentProfileCode: "PHARMA"
  readonly parentProfileVersion: "PHARMA_V1"
  readonly primarySubprofile: PharmaSubprofileCode
  readonly scoreContractVersion: string | null
  readonly overallScore: null
  readonly dimensions: readonly []
  readonly reasonCode: string
  readonly sourceContractVersions: readonly string[]
  readonly readOnly: true
  readonly nonPersisting: true
}

export type PharmaRecommendationScoreAuthority =
  | PharmaRecommendationScoreReadyAuthority
  | PharmaRecommendationScoreNotComputableAuthority

export type PharmaRecommendationAssignmentAuthority =
  | {
      readonly state: "RESOLVED"
      readonly securityId: string
      readonly parentProfileCode: "PHARMA"
      readonly parentProfileVersion: "PHARMA_V1"
      readonly primarySubprofile: PharmaSubprofileCode
      readonly assignmentVersion: number
      readonly assignmentSourceReference: string
      readonly secondaryExposures: readonly ResearchSubprofileExposure[]
    }
  | {
      readonly state: "BLOCKED"
      readonly securityId: string
      readonly parentProfileCode: "PHARMA"
      readonly parentProfileVersion: "PHARMA_V1"
      readonly reasonCode:
        | "MISSING_ASSIGNMENT"
        | "PROVISIONAL_ASSIGNMENT"
        | "DISPUTED_ASSIGNMENT"
        | "NO_ACTIVE_REVIEWED_ASSIGNMENT"
        | "CONFLICTING_REVIEWED_ASSIGNMENTS"
    }

export type PharmaRecommendationInput =
  | {
      readonly contractVersion: typeof PHARMA_GATE_I1_RECOMMENDATION_AUTHORITY_VERSION
      readonly state: "READY_FOR_POLICY"
      readonly securityId: string
      readonly assignmentAuthority: Extract<PharmaRecommendationAssignmentAuthority, { state: "RESOLVED" }>
      readonly scoreAuthority: PharmaRecommendationScoreReadyAuthority
      readonly recommendationEligibility: "ELIGIBLE_FOR_POLICY"
      readonly reasonCodes: readonly ["AUTHORITATIVE_ASSIGNMENT_RESOLVED", "AUTHORITATIVE_SCORE_READY"]
      readonly readOnly: true
      readonly nonPersisting: true
    }
  | {
      readonly contractVersion: typeof PHARMA_GATE_I1_RECOMMENDATION_AUTHORITY_VERSION
      readonly state: "ASSIGNMENT_BLOCKED"
      readonly securityId: string
      readonly assignmentAuthority: Extract<PharmaRecommendationAssignmentAuthority, { state: "BLOCKED" }>
      readonly scoreAuthority: PharmaRecommendationScoreAuthority
      readonly recommendationEligibility: "FAIL_CLOSED"
      readonly reasonCodes: readonly ["CANONICAL_ASSIGNMENT_NOT_RESOLVED"]
      readonly readOnly: true
      readonly nonPersisting: true
    }
  | {
      readonly contractVersion: typeof PHARMA_GATE_I1_RECOMMENDATION_AUTHORITY_VERSION
      readonly state: "SCORE_NOT_COMPUTABLE"
      readonly securityId: string
      readonly assignmentAuthority: Extract<PharmaRecommendationAssignmentAuthority, { state: "RESOLVED" }>
      readonly scoreAuthority: PharmaRecommendationScoreNotComputableAuthority
      readonly recommendationEligibility: "FAIL_CLOSED"
      readonly reasonCodes: readonly ["AUTHORITATIVE_SCORE_NOT_COMPUTABLE"]
      readonly readOnly: true
      readonly nonPersisting: true
    }

interface GateHClosedReadOnlyScoreLike {
  readonly securitySymbol: string
  readonly profileCode: "PHARMA_V1"
  readonly primarySubprofile: PharmaSubprofileCode
  readonly contractVersion: string
  readonly overallScore: number | null
  readonly dimensions: readonly {
    readonly dimensionCode: PharmaG7DimensionCode
    readonly finalScore: number | null
    readonly primaryScoreContractVersion: string
    readonly evidenceLineage: readonly string[]
    readonly methodologyLineage: readonly {
      readonly decisionId: string
      readonly contractVersion: string
    }[]
    readonly readinessCoverage: number
  }[]
  readonly governance: {
    readonly constraintState: string
  }
  readonly globalGenericsOverlay: {
    readonly code: "GLOBAL_GENERICS"
    readonly numericModifierApplied: boolean
    readonly secondIndependentStockScore: null
  }
  readonly emergingWatch: {
    readonly code: "CDMO_CRAMS"
    readonly numericParticipation: boolean
  }
  readonly evidenceLineage: readonly string[]
  readonly methodologyLineage: readonly {
    readonly decisionId: string
    readonly contractVersion: string
  }[]
  readonly readOnly: true
  readonly nonPersisting: true
  readonly persistedScoreRunEnabled: false
}

function assertFiniteScore(value: number | null, label: string): asserts value is number {
  if (value === null || !Number.isFinite(value)) {
    throw new Error(`Gate I1 closed-score authority requires a finite ${label}`)
  }
}

export function buildGateHClosedScoreAuthority(
  securityId: string,
  result: GateHClosedReadOnlyScoreLike,
): PharmaRecommendationScoreReadyAuthority {
  if (!securityId) throw new Error("Gate I1 score authority requires securityId")
  assertFiniteScore(result.overallScore, "overall score")
  if (result.dimensions.length !== 10) {
    throw new Error("Gate I1 closed-score authority requires all ten PHARMA_V1 dimensions")
  }
  if (result.emergingWatch.numericParticipation !== false) {
    throw new Error(
      "Gate I1 closed-score authority requires Emerging Watch numeric participation to remain disabled",
    )
  }
  if (result.globalGenericsOverlay.numericModifierApplied !== false) {
    throw new Error(
      "Gate I1 closed-score authority requires the locked material overlay numeric modifier to remain unapplied",
    )
  }
  if (
    result.readOnly !== true
    || result.nonPersisting !== true
    || result.persistedScoreRunEnabled !== false
  ) {
    throw new Error(
      "Gate I1 closed-score authority requires the Gate H read-only non-persisting safety boundary",
    )
  }

  const dimensions = result.dimensions.map((dimension) => {
    assertFiniteScore(dimension.finalScore, dimension.dimensionCode)
    if (dimension.readinessCoverage !== 1) {
      throw new Error(
        `Gate I1 closed-score authority requires full readiness for ${dimension.dimensionCode}`,
      )
    }
    return {
      dimensionCode: dimension.dimensionCode,
      score: dimension.finalScore,
      scoreContractVersion: dimension.primaryScoreContractVersion,
      evidenceLineage: dimension.evidenceLineage,
      methodologyLineage: dimension.methodologyLineage,
    }
  })

  return {
    state: "SCORE_READY",
    securityId,
    securitySymbol: result.securitySymbol,
    parentProfileCode: "PHARMA",
    parentProfileVersion: result.profileCode,
    primarySubprofile: result.primarySubprofile,
    scoreContractVersion: result.contractVersion,
    overallScore: result.overallScore,
    dimensions,
    scoreReadyCoverage: 1,
    governanceState: result.governance.constraintState,
    overlayContext: {
      materialOverlayCode: result.globalGenericsOverlay.code,
      numericModifierApplied: result.globalGenericsOverlay.numericModifierApplied,
      secondIndependentStockScore:
        result.globalGenericsOverlay.secondIndependentStockScore,
    },
    emergingWatch: {
      code: result.emergingWatch.code,
      numericParticipation: false,
    },
    evidenceLineage: result.evidenceLineage,
    methodologyLineage: result.methodologyLineage,
    readOnly: true,
    nonPersisting: true,
  }
}

export function buildPharmaScoreNotComputableAuthority(input: {
  readonly securityId: string
  readonly securitySymbol: string
  readonly primarySubprofile: PharmaSubprofileCode
  readonly reasonCode: string
  readonly sourceContractVersions: readonly string[]
}): PharmaRecommendationScoreNotComputableAuthority {
  if (!input.securityId) throw new Error("Gate I1 score authority requires securityId")
  return {
    state: "SCORE_NOT_COMPUTABLE",
    securityId: input.securityId,
    securitySymbol: input.securitySymbol,
    parentProfileCode: "PHARMA",
    parentProfileVersion: "PHARMA_V1",
    primarySubprofile: input.primarySubprofile,
    scoreContractVersion: null,
    overallScore: null,
    dimensions: [],
    reasonCode: input.reasonCode,
    sourceContractVersions: input.sourceContractVersions,
    readOnly: true,
    nonPersisting: true,
  }
}

export function recommendationAssignmentAuthority(
  securityId: string,
  resolution: PharmaSubprofileResolution,
): PharmaRecommendationAssignmentAuthority {
  if (resolution.status !== "RESOLVED") {
    return {
      state: "BLOCKED",
      securityId,
      parentProfileCode: "PHARMA",
      parentProfileVersion: "PHARMA_V1",
      reasonCode: resolution.blocker,
    }
  }

  if (resolution.assignment.securityId !== securityId) {
    throw new Error("Gate I1 canonical assignment securityId mismatch")
  }

  return {
    state: "RESOLVED",
    securityId,
    parentProfileCode: "PHARMA",
    parentProfileVersion: resolution.profileCode,
    primarySubprofile: resolution.assignment.primarySubprofileCode,
    assignmentVersion: resolution.assignment.assignmentVersion,
    assignmentSourceReference: resolution.assignment.sourceReference,
    secondaryExposures: resolution.assignment.secondaryExposures,
  }
}

export function buildPharmaRecommendationInput(input: {
  readonly securityId: string
  readonly assignmentResolution: PharmaSubprofileResolution
  readonly scoreAuthority: PharmaRecommendationScoreAuthority
}): PharmaRecommendationInput {
  const assignmentAuthority = recommendationAssignmentAuthority(
    input.securityId,
    input.assignmentResolution,
  )

  if (input.scoreAuthority.securityId !== input.securityId) {
    throw new Error("Gate I1 score authority securityId mismatch")
  }

  if (
    input.scoreAuthority.parentProfileCode !== "PHARMA"
    || input.scoreAuthority.parentProfileVersion !== "PHARMA_V1"
  ) {
    throw new Error("Gate I1 score authority is not PHARMA / PHARMA_V1")
  }

  if (assignmentAuthority.state === "BLOCKED") {
    return {
      contractVersion: PHARMA_GATE_I1_RECOMMENDATION_AUTHORITY_VERSION,
      state: "ASSIGNMENT_BLOCKED",
      securityId: input.securityId,
      assignmentAuthority,
      scoreAuthority: input.scoreAuthority,
      recommendationEligibility: "FAIL_CLOSED",
      reasonCodes: ["CANONICAL_ASSIGNMENT_NOT_RESOLVED"],
      readOnly: true,
      nonPersisting: true,
    }
  }

  if (
    assignmentAuthority.primarySubprofile
    !== input.scoreAuthority.primarySubprofile
  ) {
    throw new Error("Gate I1 assignment / score Primary subprofile mismatch")
  }

  if (input.scoreAuthority.state === "SCORE_NOT_COMPUTABLE") {
    return {
      contractVersion: PHARMA_GATE_I1_RECOMMENDATION_AUTHORITY_VERSION,
      state: "SCORE_NOT_COMPUTABLE",
      securityId: input.securityId,
      assignmentAuthority,
      scoreAuthority: input.scoreAuthority,
      recommendationEligibility: "FAIL_CLOSED",
      reasonCodes: ["AUTHORITATIVE_SCORE_NOT_COMPUTABLE"],
      readOnly: true,
      nonPersisting: true,
    }
  }

  return {
    contractVersion: PHARMA_GATE_I1_RECOMMENDATION_AUTHORITY_VERSION,
    state: "READY_FOR_POLICY",
    securityId: input.securityId,
    assignmentAuthority,
    scoreAuthority: input.scoreAuthority,
    recommendationEligibility: "ELIGIBLE_FOR_POLICY",
    reasonCodes: [
      "AUTHORITATIVE_ASSIGNMENT_RESOLVED",
      "AUTHORITATIVE_SCORE_READY",
    ],
    readOnly: true,
    nonPersisting: true,
  }
}
