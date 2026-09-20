import type { PharmaG7DimensionCode } from "./pharmaG7ReadOnlyScoringAdapter"
import type { PharmaRecommendationSuggestedRole } from "./pharmaRecommendationAuthority"

export const PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE_VERSION =
  "PHARMA_V1_RECOMMENDATION_POLICY_V1_CANDIDATE" as const

export type PharmaRecommendationDimensionTreatment =
  | "ROLE_BLOCKING_FLOOR"
  | "CAUTION_ONLY"
  | "CONTEXT_ONLY"
  | "NO_SEPARATE_ROLE_GATE"

export type PharmaRecommendationGovernanceState =
  | "CLEAR"
  | "INTERPRETATION_ONLY_HIGH_RISK"
  | "REVIEW_REQUIRED"
  | "BLOCKED_REVIEW"

export interface PharmaRecommendationPolicyEvaluationInput {
  readonly scoreState: "SCORE_READY" | "SCORE_NOT_COMPUTABLE"
  readonly overallScore: number | null
  readonly dimensionScores: Partial<
    Readonly<Record<PharmaG7DimensionCode, number | null>>
  >
  readonly governanceState: PharmaRecommendationGovernanceState
  readonly overlayContext: {
    readonly materialOverlayPresent: boolean
    readonly emergingWatchPresent: boolean
  }
}

export interface PharmaRecommendationFloorEvaluation {
  readonly dimensionCode: PharmaG7DimensionCode
  readonly minimum: number
  readonly observed: number | null
  readonly state: "PASS" | "FAIL" | "MISSING"
}

export interface PharmaRecommendationPolicyEvaluation {
  readonly policyVersion: typeof PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE_VERSION
  readonly policyState: "OWNER_REVIEW_PENDING"
  readonly suggestedRole: PharmaRecommendationSuggestedRole
  readonly overallScore: number | null
  readonly evaluatedRoleThreshold:
    | "CORE_CANDIDATE"
    | "SATELLITE_CANDIDATE"
    | "WATCH"
    | "AVOID"
    | "NOT_EVALUATED"
  readonly floorEvaluations: readonly PharmaRecommendationFloorEvaluation[]
  readonly cautions: readonly string[]
  readonly context: readonly string[]
  readonly reasonCodes: readonly string[]
}

const CORE_FLOORS = {
  QUALITY: 75,
  GROWTH: 50,
  CASH_FLOW: 50,
  BALANCE_SHEET_CREDIT: 50,
  BUSINESS_DURABILITY: 75,
  OWNERSHIP_GOVERNANCE: 50,
  RISK: 50,
} as const satisfies Partial<Record<PharmaG7DimensionCode, number>>

const SATELLITE_FLOORS = {
  QUALITY: 50,
  GROWTH: 50,
  CASH_FLOW: 50,
  BALANCE_SHEET_CREDIT: 50,
  BUSINESS_DURABILITY: 50,
  OWNERSHIP_GOVERNANCE: 50,
  RISK: 50,
} as const satisfies Partial<Record<PharmaG7DimensionCode, number>>

export const PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE = {
  version: PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE_VERSION,
  state: "OWNER_REVIEW_PENDING",
  profileCode: "PHARMA_V1",
  methodologyBasis: {
    neutralAnchor: 50,
    strongComponentAnchor: 75,
    coreAggregateMinimum: 80,
    satelliteAggregateMinimum: 65,
    rationale: [
      "WATCH_MIN_EQUALS_APPROVED_NEUTRAL_ANCHOR_50",
      "CORE_MIN_80_IS_ABOVE_STRONG_COMPONENT_ANCHOR_75",
      "SATELLITE_MIN_65_IS_MIDPOINT_BETWEEN_WATCH_50_AND_CORE_80",
      "THRESHOLDS_DEFINED_WITHOUT_REFERENCE_COMPANY_SCORE_INPUT",
    ] as const,
  },
  overallThresholds: {
    coreMinimum: 80,
    satelliteMinimum: 65,
    watchMinimum: 50,
    avoidBelow: 50,
  },
  dimensionTreatment: {
    QUALITY: "ROLE_BLOCKING_FLOOR",
    GROWTH: "ROLE_BLOCKING_FLOOR",
    CAPITAL_EFFICIENCY: "NO_SEPARATE_ROLE_GATE",
    CASH_FLOW: "ROLE_BLOCKING_FLOOR",
    BALANCE_SHEET_CREDIT: "ROLE_BLOCKING_FLOOR",
    BUSINESS_DURABILITY: "ROLE_BLOCKING_FLOOR",
    VALUATION: "CAUTION_ONLY",
    MOMENTUM: "CAUTION_ONLY",
    OWNERSHIP_GOVERNANCE: "ROLE_BLOCKING_FLOOR",
    RISK: "ROLE_BLOCKING_FLOOR",
  } as const satisfies Readonly<
    Record<PharmaG7DimensionCode, PharmaRecommendationDimensionTreatment>
  >,
  roleFloors: {
    CORE_CANDIDATE: CORE_FLOORS,
    SATELLITE_CANDIDATE: SATELLITE_FLOORS,
  },
  cautionRules: {
    VALUATION: {
      below: 50,
      reasonCode: "VALUATION_BELOW_NEUTRAL_ANCHOR",
      label: "Valuation is below the PHARMA_V1 neutral anchor.",
    },
    MOMENTUM: {
      below: 50,
      reasonCode: "MOMENTUM_BELOW_NEUTRAL_ANCHOR",
      label: "Momentum is below the PHARMA_V1 neutral anchor.",
    },
  } as const,
  governanceRules: {
    CLEAR: {
      treatment: "NO_ADDITIONAL_RECOMMENDATION_CONSTRAINT",
      recommendationEffect: "NONE",
    },
    INTERPRETATION_ONLY_HIGH_RISK: {
      treatment: "CAUTION_ONLY",
      recommendationEffect: "NONE",
      reasonCode: "REGULATORY_HIGH_RISK_INTERPRETATION_ONLY",
    },
    REVIEW_REQUIRED: {
      treatment: "FAIL_CLOSED",
      recommendationEffect: "INSUFFICIENT",
      reasonCode: "GOVERNANCE_REVIEW_REQUIRED",
    },
    BLOCKED_REVIEW: {
      treatment: "FAIL_CLOSED",
      recommendationEffect: "INSUFFICIENT",
      reasonCode: "GOVERNANCE_BLOCKED_REVIEW",
    },
  } as const,
  overlayRules: {
    materialOverlay: "CONTEXT_ONLY_NO_INDEPENDENT_ROLE",
    emergingWatch: "CONTEXT_ONLY_NUMERICALLY_EXCLUDED",
    secondRecommendationAllowed: false,
    roleOverrideAllowed: false,
    roleBlendAllowed: false,
  } as const,
  globalNumericHardBlockers: [] as const,
  missingFloorBehavior: "INSUFFICIENT",
  failedRoleFloorBehavior: "ROLE_INELIGIBLE_CONTINUE_LADDER",
  avoidBehavior: "FULLY_EVALUABLE_OVERALL_SCORE_BELOW_WATCH_THRESHOLD",
  scoreReconstructionAllowed: false,
  denominatorRenormalizationAllowed: false,
  recommendationPersistenceEnabled: false,
  scorePersistenceEnabled: false,
  weightGuidanceEnabled: false,
  actionBiasEnabled: false,
  positionSizingEnabled: false,
  aiInterpretationEnabled: false,
  ownerApprovalRequired: true,
} as const

const REQUIRED_ROLE_FLOOR_DIMENSIONS = [
  "QUALITY",
  "GROWTH",
  "CASH_FLOW",
  "BALANCE_SHEET_CREDIT",
  "BUSINESS_DURABILITY",
  "OWNERSHIP_GOVERNANCE",
  "RISK",
] as const satisfies readonly PharmaG7DimensionCode[]

function assertScore(value: number | null | undefined, label: string) {
  if (value === null || value === undefined) return
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${label} must be between 0 and 100`)
  }
}

function evaluateFloors(
  input: PharmaRecommendationPolicyEvaluationInput,
  floors: Readonly<Partial<Record<PharmaG7DimensionCode, number>>>,
): readonly PharmaRecommendationFloorEvaluation[] {
  return Object.entries(floors).map(([dimensionCode, minimum]) => {
    const code = dimensionCode as PharmaG7DimensionCode
    const observed = input.dimensionScores[code] ?? null
    assertScore(observed, code)
    return {
      dimensionCode: code,
      minimum: minimum as number,
      observed,
      state:
        observed === null
          ? "MISSING"
          : observed >= (minimum as number)
            ? "PASS"
            : "FAIL",
    }
  })
}

function cautionList(
  input: PharmaRecommendationPolicyEvaluationInput,
): readonly string[] {
  const cautions: string[] = []
  const valuation = input.dimensionScores.VALUATION
  const momentum = input.dimensionScores.MOMENTUM
  assertScore(valuation, "VALUATION")
  assertScore(momentum, "MOMENTUM")

  if (
    valuation !== null
    && valuation !== undefined
    && valuation < PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.cautionRules.VALUATION.below
  ) {
    cautions.push(
      PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.cautionRules.VALUATION.reasonCode,
    )
  }
  if (
    momentum !== null
    && momentum !== undefined
    && momentum < PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.cautionRules.MOMENTUM.below
  ) {
    cautions.push(
      PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.cautionRules.MOMENTUM.reasonCode,
    )
  }
  if (input.governanceState === "INTERPRETATION_ONLY_HIGH_RISK") {
    cautions.push(
      PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE
        .governanceRules.INTERPRETATION_ONLY_HIGH_RISK.reasonCode,
    )
  }
  return cautions
}

function contextList(
  input: PharmaRecommendationPolicyEvaluationInput,
): readonly string[] {
  const context: string[] = []
  if (input.overlayContext.materialOverlayPresent) {
    context.push("MATERIAL_OVERLAY_CONTEXT_ONLY")
  }
  if (input.overlayContext.emergingWatchPresent) {
    context.push("EMERGING_WATCH_CONTEXT_ONLY")
  }
  return context
}

function result(
  input: PharmaRecommendationPolicyEvaluationInput,
  suggestedRole: PharmaRecommendationSuggestedRole,
  evaluatedRoleThreshold:
    | "CORE_CANDIDATE"
    | "SATELLITE_CANDIDATE"
    | "WATCH"
    | "AVOID"
    | "NOT_EVALUATED",
  floorEvaluations: readonly PharmaRecommendationFloorEvaluation[],
  reasonCodes: readonly string[],
): PharmaRecommendationPolicyEvaluation {
  return {
    policyVersion: PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE_VERSION,
    policyState: "OWNER_REVIEW_PENDING",
    suggestedRole,
    overallScore: input.overallScore,
    evaluatedRoleThreshold,
    floorEvaluations,
    cautions: cautionList(input),
    context: contextList(input),
    reasonCodes,
  }
}

function hasMissingRequiredRoleFloor(
  input: PharmaRecommendationPolicyEvaluationInput,
): boolean {
  return REQUIRED_ROLE_FLOOR_DIMENSIONS.some(
    (dimensionCode) => input.dimensionScores[dimensionCode] == null,
  )
}

export function evaluatePharmaV1RecommendationPolicyCandidate(
  input: PharmaRecommendationPolicyEvaluationInput,
): PharmaRecommendationPolicyEvaluation {
  assertScore(input.overallScore, "overallScore")

  if (input.scoreState === "SCORE_NOT_COMPUTABLE" || input.overallScore === null) {
    return result(
      input,
      "INSUFFICIENT",
      "NOT_EVALUATED",
      [],
      ["AUTHORITATIVE_SCORE_NOT_COMPUTABLE"],
    )
  }

  if (
    input.governanceState === "REVIEW_REQUIRED"
    || input.governanceState === "BLOCKED_REVIEW"
  ) {
    return result(
      input,
      "INSUFFICIENT",
      "NOT_EVALUATED",
      [],
      [
        input.governanceState === "REVIEW_REQUIRED"
          ? "GOVERNANCE_REVIEW_REQUIRED"
          : "GOVERNANCE_BLOCKED_REVIEW",
      ],
    )
  }

  if (hasMissingRequiredRoleFloor(input)) {
    return result(
      input,
      "INSUFFICIENT",
      "NOT_EVALUATED",
      evaluateFloors(
        input,
        PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.roleFloors.CORE_CANDIDATE,
      ),
      ["MANDATORY_ROLE_FLOOR_DATA_MISSING"],
    )
  }

  const thresholds =
    PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.overallThresholds

  if (input.overallScore >= thresholds.coreMinimum) {
    const floors = evaluateFloors(
      input,
      PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.roleFloors.CORE_CANDIDATE,
    )
    if (floors.every((item) => item.state === "PASS")) {
      return result(
        input,
        "CORE_CANDIDATE",
        "CORE_CANDIDATE",
        floors,
        ["CORE_OVERALL_THRESHOLD_PASSED", "CORE_ROLE_FLOORS_PASSED"],
      )
    }
  }

  if (input.overallScore >= thresholds.satelliteMinimum) {
    const floors = evaluateFloors(
      input,
      PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE
        .roleFloors.SATELLITE_CANDIDATE,
    )
    if (floors.every((item) => item.state === "PASS")) {
      return result(
        input,
        "SATELLITE_CANDIDATE",
        "SATELLITE_CANDIDATE",
        floors,
        [
          "SATELLITE_OVERALL_THRESHOLD_PASSED",
          "SATELLITE_ROLE_FLOORS_PASSED",
        ],
      )
    }
  }

  if (input.overallScore >= thresholds.watchMinimum) {
    return result(
      input,
      "WATCH",
      "WATCH",
      [],
      ["WATCH_OVERALL_THRESHOLD_PASSED", "HIGHER_ROLE_GATE_NOT_SATISFIED"],
    )
  }

  return result(
    input,
    "AVOID",
    "AVOID",
    [],
    ["FULLY_EVALUABLE_SCORE_BELOW_WATCH_THRESHOLD"],
  )
}
