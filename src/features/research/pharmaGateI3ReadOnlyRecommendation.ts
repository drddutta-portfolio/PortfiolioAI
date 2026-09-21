import {
  buildGateHClosedScoreAuthority,
  buildPharmaReferenceScoreAuthority,
  buildPharmaRecommendationInput,
  buildPharmaScoreNotComputableAuthority,
  type PharmaRecommendationInput,
  type PharmaRecommendationSuggestedRole,
} from "./pharmaRecommendationAuthority"
import {
  evaluatePharmaV1RecommendationPolicyCandidate,
  PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE,
  type PharmaRecommendationFloorEvaluation,
  type PharmaRecommendationGovernanceState,
} from "./pharmaRecommendationPolicyCandidate"
import { AUROPHARMA_G9_1_ACTIVATION_READINESS_VERSION } from "./auropharmaG91ActivationReadiness"
import type { PharmaG7DimensionCode } from "./pharmaG7ReadOnlyScoringAdapter"
import type {
  PharmaSubprofileCode,
  PharmaSubprofileResolution,
} from "./pharmaSubprofileAssignment"
import { TORNTPHARM_GATE_H3_READ_ONLY_RESULT } from "./torntpharmGateH3ReadOnlyScore"
import { ALIVUS_G10_1_READ_ONLY_SCORE_RESULT } from "./alivusG101ReadOnlyScore"

export const PHARMA_GATE_I3_READ_ONLY_RECOMMENDATION_VERSION =
  "PHARMA_GATE_I3_READ_ONLY_RECOMMENDATION_V1" as const

export type PharmaGateI3CalculationState =
  | "READY_READ_ONLY_RECOMMENDATION"
  | "FAIL_CLOSED_INSUFFICIENT"

export interface PharmaGateI3DimensionResult {
  readonly dimensionCode: PharmaG7DimensionCode
  readonly score: number
}

export interface PharmaGateI3ReadOnlyRecommendationResult {
  readonly version: typeof PHARMA_GATE_I3_READ_ONLY_RECOMMENDATION_VERSION
  readonly securityId: string
  readonly securitySymbol: string
  readonly profileCode: "PHARMA_V1"
  readonly primarySubprofile: PharmaSubprofileCode
  readonly sourceAuthorityState: PharmaRecommendationInput["state"]
  readonly deterministicCalculationState: PharmaGateI3CalculationState
  readonly policyVersion: typeof PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.version
  readonly policyState: typeof PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.state
  readonly suggestedRole: PharmaRecommendationSuggestedRole
  readonly overallScore: number | null
  readonly dimensions: readonly PharmaGateI3DimensionResult[]
  readonly evaluatedRoleThreshold:
    | "CORE_CANDIDATE"
    | "SATELLITE_CANDIDATE"
    | "WATCH"
    | "AVOID"
    | "NOT_EVALUATED"
  readonly floorEvaluations: readonly PharmaRecommendationFloorEvaluation[]
  readonly cautions: readonly string[]
  readonly context: readonly string[]
  readonly governanceState: PharmaRecommendationGovernanceState | null
  readonly overlayTreatment: {
    readonly materialOverlayCode: PharmaSubprofileCode | null
    readonly materialOverlayTreatment: "CONTEXT_ONLY" | null
    readonly emergingWatchCode: PharmaSubprofileCode | null
    readonly emergingWatchTreatment: "CONTEXT_ONLY_NUMERICALLY_EXCLUDED" | null
    readonly numericModifierApplied: false
    readonly secondIndependentRecommendation: false
  }
  readonly reasonCodes: readonly string[]
  readonly evidenceLineage: readonly string[]
  readonly methodologyLineage: readonly {
    readonly decisionId: string
    readonly contractVersion: string
  }[]
  readonly deterministic: true
  readonly readOnly: true
  readonly nonPersisting: true
  readonly recommendationPersistenceEnabled: false
  readonly scorePersistenceEnabled: false
  readonly weightGuidanceEnabled: false
  readonly actionBiasEnabled: false
  readonly positionSizingEnabled: false
  readonly aiInterpretationEnabled: false
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)]
}

function governanceState(
  value: string,
): PharmaRecommendationGovernanceState | null {
  if (value === "CLEAR") return value
  if (value === "INTERPRETATION_ONLY_HIGH_RISK") return value
  if (value === "REVIEW_REQUIRED") return value
  if (value === "BLOCKED_REVIEW") return value
  return null
}

function assignmentContext(input: PharmaRecommendationInput) {
  if (input.assignmentAuthority.state !== "RESOLVED") {
    return {
      materialOverlayCode: null,
      emergingWatchCode: null,
      evidenceLineage: [] as readonly string[],
    }
  }

  const materialOverlay = input.assignmentAuthority.secondaryExposures.find(
    (item) =>
      item.assignmentState === "REVIEWED"
      && item.materiality === "MATERIAL",
  )
  const emergingWatch = input.assignmentAuthority.secondaryExposures.find(
    (item) =>
      item.assignmentState === "REVIEWED"
      && item.materiality === "EMERGING",
  )

  return {
    materialOverlayCode: materialOverlay?.exposureCode ?? null,
    emergingWatchCode: emergingWatch?.exposureCode ?? null,
    evidenceLineage: [input.assignmentAuthority.assignmentSourceReference],
  }
}

function baseMethodologyLineage() {
  return [
    {
      decisionId: "GATE_I2_OWNER_APPROVED_RECOMMENDATION_POLICY",
      contractVersion: PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.version,
    },
    {
      decisionId: "GATE_I3_READ_ONLY_RECOMMENDATION",
      contractVersion: PHARMA_GATE_I3_READ_ONLY_RECOMMENDATION_VERSION,
    },
  ] as const
}

function failClosedResult(
  input: PharmaRecommendationInput,
  extraReasonCodes: readonly string[] = [],
): PharmaGateI3ReadOnlyRecommendationResult {
  const context = assignmentContext(input)
  const scoreReason =
    input.scoreAuthority.state === "SCORE_NOT_COMPUTABLE"
      ? [input.scoreAuthority.reasonCode]
      : []
  const upstreamMethodology =
    input.scoreAuthority.state === "SCORE_NOT_COMPUTABLE"
      ? input.scoreAuthority.sourceContractVersions.map((contractVersion) => ({
          decisionId: "UPSTREAM_SCORE_NOT_COMPUTABLE_SOURCE",
          contractVersion,
        }))
      : []

  return {
    version: PHARMA_GATE_I3_READ_ONLY_RECOMMENDATION_VERSION,
    securityId: input.securityId,
    securitySymbol: input.scoreAuthority.securitySymbol,
    profileCode: "PHARMA_V1",
    primarySubprofile: input.scoreAuthority.primarySubprofile,
    sourceAuthorityState: input.state,
    deterministicCalculationState: "FAIL_CLOSED_INSUFFICIENT",
    policyVersion: PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.version,
    policyState: PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.state,
    suggestedRole: "INSUFFICIENT",
    overallScore: null,
    dimensions: [],
    evaluatedRoleThreshold: "NOT_EVALUATED",
    floorEvaluations: [],
    cautions: [],
    context: [
      ...(context.materialOverlayCode ? ["MATERIAL_OVERLAY_CONTEXT_ONLY"] : []),
      ...(context.emergingWatchCode ? ["EMERGING_WATCH_CONTEXT_ONLY"] : []),
    ],
    governanceState: null,
    overlayTreatment: {
      materialOverlayCode: context.materialOverlayCode,
      materialOverlayTreatment:
        context.materialOverlayCode ? "CONTEXT_ONLY" : null,
      emergingWatchCode: context.emergingWatchCode,
      emergingWatchTreatment:
        context.emergingWatchCode
          ? "CONTEXT_ONLY_NUMERICALLY_EXCLUDED"
          : null,
      numericModifierApplied: false,
      secondIndependentRecommendation: false,
    },
    reasonCodes: unique([
      ...input.reasonCodes,
      ...scoreReason,
      ...extraReasonCodes,
      "GATE_I3_FAIL_CLOSED_INSUFFICIENT",
    ]),
    evidenceLineage: context.evidenceLineage,
    methodologyLineage: [
      ...upstreamMethodology,
      ...baseMethodologyLineage(),
    ],
    deterministic: true,
    readOnly: true,
    nonPersisting: true,
    recommendationPersistenceEnabled: false,
    scorePersistenceEnabled: false,
    weightGuidanceEnabled: false,
    actionBiasEnabled: false,
    positionSizingEnabled: false,
    aiInterpretationEnabled: false,
  }
}

export function evaluatePharmaGateI3ReadOnlyRecommendation(
  input: PharmaRecommendationInput,
): PharmaGateI3ReadOnlyRecommendationResult {
  if (input.state !== "READY_FOR_POLICY") {
    return failClosedResult(input)
  }

  const resolvedGovernance = governanceState(
    input.scoreAuthority.governanceState,
  )
  if (resolvedGovernance === null) {
    return failClosedResult(input, ["UNRECOGNIZED_GOVERNANCE_STATE"])
  }

  const dimensionScores: Partial<
    Record<PharmaG7DimensionCode, number | null>
  > = {}
  for (const dimension of input.scoreAuthority.dimensions) {
    dimensionScores[dimension.dimensionCode] = dimension.score
  }

  const policyResult = evaluatePharmaV1RecommendationPolicyCandidate({
    scoreState: input.scoreAuthority.state,
    overallScore: input.scoreAuthority.overallScore,
    dimensionScores,
    governanceState: resolvedGovernance,
    overlayContext: {
      materialOverlayPresent:
        input.scoreAuthority.overlayContext.materialOverlayCode !== null,
      emergingWatchPresent: input.scoreAuthority.emergingWatch.code !== null,
    },
  })

  return {
    version: PHARMA_GATE_I3_READ_ONLY_RECOMMENDATION_VERSION,
    securityId: input.securityId,
    securitySymbol: input.scoreAuthority.securitySymbol,
    profileCode: "PHARMA_V1",
    primarySubprofile: input.scoreAuthority.primarySubprofile,
    sourceAuthorityState: input.state,
    deterministicCalculationState: "READY_READ_ONLY_RECOMMENDATION",
    policyVersion: policyResult.policyVersion,
    policyState: policyResult.policyState,
    suggestedRole: policyResult.suggestedRole,
    overallScore: input.scoreAuthority.overallScore,
    dimensions: input.scoreAuthority.dimensions.map((dimension) => ({
      dimensionCode: dimension.dimensionCode,
      score: dimension.score,
    })),
    evaluatedRoleThreshold: policyResult.evaluatedRoleThreshold,
    floorEvaluations: policyResult.floorEvaluations,
    cautions: policyResult.cautions,
    context: policyResult.context,
    governanceState: resolvedGovernance,
    overlayTreatment: {
      materialOverlayCode:
        input.scoreAuthority.overlayContext.materialOverlayCode,
      materialOverlayTreatment:
        input.scoreAuthority.overlayContext.materialOverlayCode
          ? "CONTEXT_ONLY"
          : null,
      emergingWatchCode: input.scoreAuthority.emergingWatch.code,
      emergingWatchTreatment:
        input.scoreAuthority.emergingWatch.code
          ? "CONTEXT_ONLY_NUMERICALLY_EXCLUDED"
          : null,
      numericModifierApplied: false,
      secondIndependentRecommendation: false,
    },
    reasonCodes: unique([
      ...input.reasonCodes,
      ...policyResult.reasonCodes,
      "GATE_I3_DETERMINISTIC_RECOMMENDATION_CALCULATED",
    ]),
    evidenceLineage: unique([
      input.assignmentAuthority.assignmentSourceReference,
      ...input.scoreAuthority.evidenceLineage,
    ]),
    methodologyLineage: [
      ...input.scoreAuthority.methodologyLineage,
      ...baseMethodologyLineage(),
    ],
    deterministic: true,
    readOnly: true,
    nonPersisting: true,
    recommendationPersistenceEnabled: false,
    scorePersistenceEnabled: false,
    weightGuidanceEnabled: false,
    actionBiasEnabled: false,
    positionSizingEnabled: false,
    aiInterpretationEnabled: false,
  }
}

export function buildPharmaGateI3ReferenceRecommendation(input: {
  readonly securityId: string
  readonly securitySymbol: string
  readonly assignmentResolution: PharmaSubprofileResolution
}): PharmaGateI3ReadOnlyRecommendationResult | null {
  const symbol = input.securitySymbol.toLocaleUpperCase()

  if (symbol === "TORNTPHARM") {
    const scoreAuthority = buildGateHClosedScoreAuthority(
      input.securityId,
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT,
    )
    return evaluatePharmaGateI3ReadOnlyRecommendation(
      buildPharmaRecommendationInput({
        securityId: input.securityId,
        assignmentResolution: input.assignmentResolution,
        scoreAuthority,
      }),
    )
  }

  if (symbol === "ALIVUS") {
    const scoreAuthority = buildPharmaReferenceScoreAuthority(
      input.securityId,
      ALIVUS_G10_1_READ_ONLY_SCORE_RESULT,
    )
    return evaluatePharmaGateI3ReadOnlyRecommendation(
      buildPharmaRecommendationInput({
        securityId: input.securityId,
        assignmentResolution: input.assignmentResolution,
        scoreAuthority,
      }),
    )
  }

  if (symbol === "AUROPHARMA") {
    const scoreAuthority = buildPharmaScoreNotComputableAuthority({
      securityId: input.securityId,
      securitySymbol: "AUROPHARMA",
      primarySubprofile: "GLOBAL_GENERICS",
      reasonCode: "GLOBAL_GENERICS_PRIMARY_METHODOLOGY_INCOMPLETE",
      sourceContractVersions: [
        AUROPHARMA_G9_1_ACTIVATION_READINESS_VERSION,
      ],
    })
    return evaluatePharmaGateI3ReadOnlyRecommendation(
      buildPharmaRecommendationInput({
        securityId: input.securityId,
        assignmentResolution: input.assignmentResolution,
        scoreAuthority,
      }),
    )
  }

  return null
}
