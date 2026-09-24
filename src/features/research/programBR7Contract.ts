import { POSITION_SIZING_ENGINE_VERSION } from "../portfolio/positionSizingEngine"
import {
  K5_RECOMMENDATION_PORTABILITY_STUDY,
} from "./k5CrossSectorValidation"
import {
  PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE,
} from "./pharmaRecommendationPolicyCandidate"

export const PROGRAM_B_R7_CONTRACT_VERSION = "PROGRAM_B_R7_CONTRACT_V1" as const

export type ProgramBRecommendationReadinessState =
  | "READY"
  | "INSUFFICIENT_EVIDENCE"
  | "METHODOLOGY_NOT_AVAILABLE"
  | "REVIEW_REQUIRED"
  | "BLOCKED_PREREQUISITE"
  | "NOT_APPLICABLE"

export type ProgramBRecommendationPolicyResolutionState =
  | "RESOLVED"
  | "METHODOLOGY_NOT_AVAILABLE"
  | "REVIEW_REQUIRED"

export type ProgramBRecommendationFinalState =
  | "CORE_CANDIDATE"
  | "SATELLITE_CANDIDATE"
  | "WATCH"
  | "AVOID"
  | "INSUFFICIENT"

export type ProgramBPolicyInputState =
  | "COMPLETE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export interface ProgramBRecommendationPolicyAuthority {
  readonly profileCode: string
  readonly policyId: string
  readonly policyVersion: string
  readonly state: "APPROVED"
  readonly sourceAuthority: string
  readonly numericThresholdScope: "PROFILE_SPECIFIC_ONLY"
  readonly overlayIndependentRoleAllowed: false
  readonly scoreReconstructionAllowed: false
  readonly denominatorRenormalizationAllowed: false
  readonly recommendationWritesAllowed: false
  readonly weightGuidanceAuthority: "NOT_APPROVED"
  readonly sizingAuthority: "NOT_APPROVED"
}

export const PROGRAM_B_RECOMMENDATION_POLICY_REGISTRY:
  readonly ProgramBRecommendationPolicyAuthority[] = [
    {
      profileCode: "PHARMA_V1",
      policyId: "PHARMA_V1_RECOMMENDATION_POLICY",
      policyVersion: PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.version,
      state: "APPROVED",
      sourceAuthority: "GATE_I_I2_OWNER_APPROVED_POLICY",
      numericThresholdScope: "PROFILE_SPECIFIC_ONLY",
      overlayIndependentRoleAllowed: false,
      scoreReconstructionAllowed: false,
      denominatorRenormalizationAllowed: false,
      recommendationWritesAllowed: false,
      weightGuidanceAuthority: "NOT_APPROVED",
      sizingAuthority: "NOT_APPROVED",
    },
  ] as const

export interface ProgramBRecommendationPolicyResolution {
  readonly state: ProgramBRecommendationPolicyResolutionState
  readonly profileCode: string | null
  readonly policyId: string | null
  readonly policyVersion: string | null
  readonly numericThresholdScope: "PROFILE_SPECIFIC_ONLY" | null
  readonly reasonCode: string
}

export function resolveProgramBRecommendationPolicy(
  profileCode: string | null,
): ProgramBRecommendationPolicyResolution {
  const cleanProfile = profileCode?.trim() || null
  if (!cleanProfile) {
    return {
      state: "REVIEW_REQUIRED",
      profileCode: null,
      policyId: null,
      policyVersion: null,
      numericThresholdScope: null,
      reasonCode: "RECOMMENDATION_PROFILE_MISSING",
    }
  }

  const authority = PROGRAM_B_RECOMMENDATION_POLICY_REGISTRY.find(
    (entry) => entry.profileCode === cleanProfile,
  )
  if (!authority) {
    return {
      state: "METHODOLOGY_NOT_AVAILABLE",
      profileCode: cleanProfile,
      policyId: null,
      policyVersion: null,
      numericThresholdScope: null,
      reasonCode: "PROFILE_RECOMMENDATION_POLICY_NOT_APPROVED",
    }
  }

  return {
    state: "RESOLVED",
    profileCode: authority.profileCode,
    policyId: authority.policyId,
    policyVersion: authority.policyVersion,
    numericThresholdScope: authority.numericThresholdScope,
    reasonCode: "APPROVED_PROFILE_RECOMMENDATION_POLICY_RESOLVED",
  }
}

export interface ProgramBRecommendationReadinessInput {
  readonly assetClass: string
  readonly securityId: string | null
  readonly scoreState:
    | "SCORED"
    | "INSUFFICIENT_EVIDENCE"
    | "STALE_REQUIRED_EVIDENCE"
    | "CONFLICTING_EVIDENCE"
    | "REVIEW_REQUIRED"
    | "METHODOLOGY_NOT_AVAILABLE"
    | "NOT_APPLICABLE"
    | "BLOCKED_PREREQUISITE"
  readonly scoreRunId: string | null
  readonly score: number | null
  readonly scoreLineageState: "COMPLETE" | "MISSING" | "CONFLICTING" | "REVIEW_REQUIRED"
  readonly scoreProfileCode: string | null
  readonly methodologyRole: string | null
  readonly recommendationPolicy: ProgramBRecommendationPolicyResolution
  readonly mandatoryFloorInputState: ProgramBPolicyInputState
  readonly cautionRiskInputState: ProgramBPolicyInputState
}

export interface ProgramBRecommendationReadinessResult {
  readonly version: typeof PROGRAM_B_R7_CONTRACT_VERSION
  readonly state: ProgramBRecommendationReadinessState
  readonly canRecommend: boolean
  readonly securityId: string | null
  readonly scoreRunId: string | null
  readonly policyId: string | null
  readonly policyVersion: string | null
  readonly methodologyRole: string | null
  readonly reasonCodes: readonly string[]
}

function validScore(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

function failRecommendation(
  input: ProgramBRecommendationReadinessInput,
  state: Exclude<ProgramBRecommendationReadinessState, "READY">,
  reasonCodes: readonly string[],
): ProgramBRecommendationReadinessResult {
  return {
    version: PROGRAM_B_R7_CONTRACT_VERSION,
    state,
    canRecommend: false,
    securityId: input.securityId?.trim() || null,
    scoreRunId: input.scoreRunId?.trim() || null,
    policyId: input.recommendationPolicy.policyId,
    policyVersion: input.recommendationPolicy.policyVersion,
    methodologyRole: input.methodologyRole?.trim() || null,
    reasonCodes,
  }
}

export function evaluateProgramBRecommendationReadiness(
  input: ProgramBRecommendationReadinessInput,
): ProgramBRecommendationReadinessResult {
  if (input.assetClass.toUpperCase() !== "EQUITY" || input.scoreState === "NOT_APPLICABLE") {
    return failRecommendation(input, "NOT_APPLICABLE", ["ASSET_CLASS_NOT_EQUITY"])
  }

  if (!input.securityId?.trim()) {
    return failRecommendation(input, "BLOCKED_PREREQUISITE", ["SECURITY_IDENTITY_MISSING"])
  }

  if (input.scoreState !== "SCORED") {
    if (input.scoreState === "METHODOLOGY_NOT_AVAILABLE") {
      return failRecommendation(input, "METHODOLOGY_NOT_AVAILABLE", ["SOURCE_SCORE_METHODOLOGY_NOT_AVAILABLE"])
    }
    if (input.scoreState === "REVIEW_REQUIRED" || input.scoreState === "CONFLICTING_EVIDENCE") {
      return failRecommendation(input, "REVIEW_REQUIRED", [`SOURCE_SCORE_${input.scoreState}`])
    }
    if (input.scoreState === "INSUFFICIENT_EVIDENCE" || input.scoreState === "STALE_REQUIRED_EVIDENCE") {
      return failRecommendation(input, "INSUFFICIENT_EVIDENCE", [`SOURCE_SCORE_${input.scoreState}`])
    }
    return failRecommendation(input, "BLOCKED_PREREQUISITE", ["SOURCE_SCORE_BLOCKED_PREREQUISITE"])
  }

  if (!input.scoreRunId?.trim() || !validScore(input.score)) {
    return failRecommendation(input, "BLOCKED_PREREQUISITE", [
      !input.scoreRunId?.trim() ? "SOURCE_SCORE_RUN_ID_MISSING" : "SOURCE_SCORE_INVALID",
    ])
  }

  if (input.scoreLineageState === "MISSING") {
    return failRecommendation(input, "BLOCKED_PREREQUISITE", ["SOURCE_SCORE_LINEAGE_MISSING"])
  }
  if (input.scoreLineageState === "CONFLICTING" || input.scoreLineageState === "REVIEW_REQUIRED") {
    return failRecommendation(input, "REVIEW_REQUIRED", [`SOURCE_SCORE_LINEAGE_${input.scoreLineageState}`])
  }

  if (input.recommendationPolicy.state === "METHODOLOGY_NOT_AVAILABLE") {
    return failRecommendation(input, "METHODOLOGY_NOT_AVAILABLE", [input.recommendationPolicy.reasonCode])
  }
  if (input.recommendationPolicy.state === "REVIEW_REQUIRED") {
    return failRecommendation(input, "REVIEW_REQUIRED", [input.recommendationPolicy.reasonCode])
  }
  if (input.recommendationPolicy.profileCode !== input.scoreProfileCode) {
    return failRecommendation(input, "METHODOLOGY_NOT_AVAILABLE", ["RECOMMENDATION_POLICY_PROFILE_MISMATCH"])
  }

  if (input.mandatoryFloorInputState === "MISSING") {
    return failRecommendation(input, "INSUFFICIENT_EVIDENCE", ["MANDATORY_RECOMMENDATION_FLOOR_INPUT_MISSING"])
  }
  if (
    input.mandatoryFloorInputState === "CONFLICTING"
    || input.mandatoryFloorInputState === "REVIEW_REQUIRED"
  ) {
    return failRecommendation(input, "REVIEW_REQUIRED", [`MANDATORY_RECOMMENDATION_FLOOR_${input.mandatoryFloorInputState}`])
  }

  if (input.cautionRiskInputState === "MISSING") {
    return failRecommendation(input, "INSUFFICIENT_EVIDENCE", ["RECOMMENDATION_CAUTION_RISK_INPUT_MISSING"])
  }
  if (
    input.cautionRiskInputState === "CONFLICTING"
    || input.cautionRiskInputState === "REVIEW_REQUIRED"
  ) {
    return failRecommendation(input, "REVIEW_REQUIRED", [`RECOMMENDATION_CAUTION_RISK_${input.cautionRiskInputState}`])
  }

  return {
    version: PROGRAM_B_R7_CONTRACT_VERSION,
    state: "READY",
    canRecommend: true,
    securityId: input.securityId.trim(),
    scoreRunId: input.scoreRunId.trim(),
    policyId: input.recommendationPolicy.policyId,
    policyVersion: input.recommendationPolicy.policyVersion,
    methodologyRole: input.methodologyRole?.trim() || null,
    reasonCodes: ["RECOMMENDATION_READINESS_READY"],
  }
}

export interface ProgramBRecommendationLineageContract {
  readonly recommendationRunId: string
  readonly securityId: string
  readonly scoreRunId: string
  readonly recommendationMethodologyId: string
  readonly recommendationMethodologyVersion: string
  readonly score: number
  readonly applicableThresholds: Readonly<Record<string, number>>
  readonly cautions: readonly string[]
  readonly reasonCodes: readonly string[]
  readonly finalRecommendation: ProgramBRecommendationFinalState
  readonly createdAt: string
}

export const PROGRAM_B_RECOMMENDATION_LINEAGE_REQUIRED_FIELDS = [
  "recommendationRunId",
  "securityId",
  "scoreRunId",
  "recommendationMethodologyId",
  "recommendationMethodologyVersion",
  "score",
  "applicableThresholds",
  "cautions",
  "reasonCodes",
  "finalRecommendation",
  "createdAt",
] as const satisfies readonly (keyof ProgramBRecommendationLineageContract)[]

export function programBRecommendationLineageIdentity(
  input: Pick<
    ProgramBRecommendationLineageContract,
    | "recommendationRunId"
    | "securityId"
    | "scoreRunId"
    | "recommendationMethodologyId"
    | "recommendationMethodologyVersion"
  >,
) {
  const parts = [
    input.recommendationRunId,
    input.securityId,
    input.scoreRunId,
    input.recommendationMethodologyId,
    input.recommendationMethodologyVersion,
  ].map((value) => value.trim())
  if (parts.some((value) => !value)) {
    throw new Error("Program B recommendation lineage requires exact recommendation, security, score-run and methodology identity.")
  }
  return parts.join("::")
}

export type ProgramBSizingMethodologyResolutionState =
  | "RESOLVED"
  | "METHODOLOGY_NOT_AVAILABLE"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"

export type ProgramBSizingFactor =
  | "CONVICTION"
  | "PORTFOLIO_ROLE"
  | "BUSINESS_QUALITY"
  | "GROWTH_DURABILITY"
  | "PERMANENT_LOSS_RISK"
  | "VALUATION"
  | "VOLATILITY"
  | "CONCENTRATION"
  | "LIQUIDITY"
  | "PORTFOLIO_FIT"

export type ProgramBSizingAction =
  | "ADD"
  | "HOLD"
  | "ADD_ON_WEAKNESS"
  | "REDUCE"
  | "TRIM"
  | "FREEZE"
  | "EXIT_REVIEW"

export interface ProgramBSizingPolicyAuthority {
  readonly policyId: string
  readonly policyVersion: string
  readonly state: "APPROVED"
  readonly profileCode: string
  readonly methodologyRole: string
  readonly factors: readonly ProgramBSizingFactor[]
  readonly actions: readonly ProgramBSizingAction[]
  readonly sourceAuthority: string
}

export const PROGRAM_B_SIZING_POLICY_REGISTRY:
  readonly ProgramBSizingPolicyAuthority[] = [] as const

export interface ProgramBSizingMethodologyResolution {
  readonly state: ProgramBSizingMethodologyResolutionState
  readonly policyId: string | null
  readonly policyVersion: string | null
  readonly profileCode: string | null
  readonly methodologyRole: string | null
  readonly reasonCode: string
}

export function resolveProgramBSizingMethodology(
  input: {
    readonly assetClass: string
    readonly profileCode: string | null
    readonly methodologyRole: string | null
  },
  registry: readonly ProgramBSizingPolicyAuthority[] = PROGRAM_B_SIZING_POLICY_REGISTRY,
): ProgramBSizingMethodologyResolution {
  if (input.assetClass.toUpperCase() !== "EQUITY") {
    return {
      state: "NOT_APPLICABLE",
      policyId: null,
      policyVersion: null,
      profileCode: input.profileCode,
      methodologyRole: input.methodologyRole,
      reasonCode: "ASSET_CLASS_NOT_EQUITY",
    }
  }

  const profileCode = input.profileCode?.trim() || null
  const methodologyRole = input.methodologyRole?.trim() || null
  if (!profileCode || !methodologyRole) {
    return {
      state: "REVIEW_REQUIRED",
      policyId: null,
      policyVersion: null,
      profileCode,
      methodologyRole,
      reasonCode: "SIZING_PROFILE_OR_ROLE_MISSING",
    }
  }

  const authority = registry.find(
    (entry) =>
      entry.profileCode === profileCode
      && entry.methodologyRole === methodologyRole,
  )
  if (!authority) {
    return {
      state: "METHODOLOGY_NOT_AVAILABLE",
      policyId: null,
      policyVersion: null,
      profileCode,
      methodologyRole,
      reasonCode: "PROFILE_ROLE_SIZING_POLICY_NOT_APPROVED",
    }
  }

  return {
    state: "RESOLVED",
    policyId: authority.policyId,
    policyVersion: authority.policyVersion,
    profileCode: authority.profileCode,
    methodologyRole: authority.methodologyRole,
    reasonCode: "APPROVED_PROFILE_ROLE_SIZING_POLICY_RESOLVED",
  }
}

export type ProgramBSizingReadinessState =
  | "READY"
  | "INSUFFICIENT_EVIDENCE"
  | "METHODOLOGY_NOT_AVAILABLE"
  | "REVIEW_REQUIRED"
  | "BLOCKED_PREREQUISITE"
  | "NOT_APPLICABLE"

export interface ProgramBSizingReadinessInput {
  readonly assetClass: string
  readonly securityId: string | null
  readonly recommendationState: "READY" | "INSUFFICIENT" | "BLOCKED" | "REVIEW_REQUIRED" | "NOT_APPLICABLE"
  readonly recommendationRunId: string | null
  readonly recommendationScoreRunId: string | null
  readonly sizingMethodology: ProgramBSizingMethodologyResolution
  readonly sizingInputState: ProgramBPolicyInputState
  readonly currentPortfolioContextState: ProgramBPolicyInputState
}

export interface ProgramBSizingReadinessResult {
  readonly version: typeof PROGRAM_B_R7_CONTRACT_VERSION
  readonly state: ProgramBSizingReadinessState
  readonly canSize: boolean
  readonly policyId: string | null
  readonly policyVersion: string | null
  readonly sourceRecommendationRunId: string | null
  readonly sourceScoreRunId: string | null
  readonly reasonCodes: readonly string[]
}

function failSizing(
  input: ProgramBSizingReadinessInput,
  state: Exclude<ProgramBSizingReadinessState, "READY">,
  reasonCodes: readonly string[],
): ProgramBSizingReadinessResult {
  return {
    version: PROGRAM_B_R7_CONTRACT_VERSION,
    state,
    canSize: false,
    policyId: input.sizingMethodology.policyId,
    policyVersion: input.sizingMethodology.policyVersion,
    sourceRecommendationRunId: input.recommendationRunId?.trim() || null,
    sourceScoreRunId: input.recommendationScoreRunId?.trim() || null,
    reasonCodes,
  }
}

export function evaluateProgramBSizingReadiness(
  input: ProgramBSizingReadinessInput,
): ProgramBSizingReadinessResult {
  if (input.assetClass.toUpperCase() !== "EQUITY" || input.recommendationState === "NOT_APPLICABLE") {
    return failSizing(input, "NOT_APPLICABLE", ["ASSET_CLASS_NOT_EQUITY"])
  }
  if (!input.securityId?.trim()) {
    return failSizing(input, "BLOCKED_PREREQUISITE", ["SECURITY_IDENTITY_MISSING"])
  }
  if (input.recommendationState === "INSUFFICIENT") {
    return failSizing(input, "INSUFFICIENT_EVIDENCE", ["SOURCE_RECOMMENDATION_INSUFFICIENT"])
  }
  if (input.recommendationState === "REVIEW_REQUIRED") {
    return failSizing(input, "REVIEW_REQUIRED", ["SOURCE_RECOMMENDATION_REVIEW_REQUIRED"])
  }
  if (input.recommendationState !== "READY") {
    return failSizing(input, "BLOCKED_PREREQUISITE", ["SOURCE_RECOMMENDATION_BLOCKED"])
  }
  if (!input.recommendationRunId?.trim() || !input.recommendationScoreRunId?.trim()) {
    return failSizing(input, "BLOCKED_PREREQUISITE", ["SOURCE_RECOMMENDATION_LINEAGE_INCOMPLETE"])
  }

  if (input.sizingMethodology.state === "NOT_APPLICABLE") {
    return failSizing(input, "NOT_APPLICABLE", [input.sizingMethodology.reasonCode])
  }
  if (input.sizingMethodology.state === "REVIEW_REQUIRED") {
    return failSizing(input, "REVIEW_REQUIRED", [input.sizingMethodology.reasonCode])
  }
  if (input.sizingMethodology.state === "METHODOLOGY_NOT_AVAILABLE") {
    return failSizing(input, "METHODOLOGY_NOT_AVAILABLE", [input.sizingMethodology.reasonCode])
  }

  for (const [domain, state] of [
    ["SIZING_INPUT", input.sizingInputState],
    ["PORTFOLIO_CONTEXT", input.currentPortfolioContextState],
  ] as const) {
    if (state === "MISSING") {
      return failSizing(input, "INSUFFICIENT_EVIDENCE", [`${domain}_MISSING`])
    }
    if (state === "CONFLICTING" || state === "REVIEW_REQUIRED") {
      return failSizing(input, "REVIEW_REQUIRED", [`${domain}_${state}`])
    }
  }

  return {
    version: PROGRAM_B_R7_CONTRACT_VERSION,
    state: "READY",
    canSize: true,
    policyId: input.sizingMethodology.policyId,
    policyVersion: input.sizingMethodology.policyVersion,
    sourceRecommendationRunId: input.recommendationRunId!.trim(),
    sourceScoreRunId: input.recommendationScoreRunId!.trim(),
    reasonCodes: ["SIZING_READINESS_READY"],
  }
}

export interface ProgramBMachineAssessmentOutput {
  readonly suggestedTargetWeight: string | null
  readonly suggestedMinimumWeight: string | null
  readonly suggestedMaximumWeight: string | null
  readonly recommendedAction: ProgramBSizingAction | null
  readonly reasonCodes: readonly string[]
  readonly confidence: string | null
  readonly assessmentState: ProgramBSizingReadinessState
}

export const PROGRAM_B_OWNER_CONTROLLED_FIELDS = [
  "targetPrice",
  "stopLossPrice",
  "targetWeight",
  "portfolioRole",
] as const

export const PROGRAM_B_MACHINE_OUTPUT_FIELDS = [
  "suggestedTargetWeight",
  "suggestedMinimumWeight",
  "suggestedMaximumWeight",
  "recommendedAction",
  "reasonCodes",
  "confidence",
  "assessmentState",
] as const satisfies readonly (keyof ProgramBMachineAssessmentOutput)[]

export const PROGRAM_B_LEGACY_RECOMMENDATION_BOUNDARY = {
  databaseDraftPoliciesAreProgramBAuthority: false,
  legacyBankNbfcDraftThresholdsInherited: false,
  recordRecommendationPreviewAllowedInB3: false,
} as const

export const PROGRAM_B_LEGACY_SIZING_BOUNDARY = {
  engineVersion: POSITION_SIZING_ENGINE_VERSION,
  contractStatus: "RECEIVING_ENGINE_SHELL_ONLY",
  programBNumericSizingAuthority: false,
  legacyHdfcBankPilotWeightGuidanceInherited: false,
  persistenceAuthorizedInB3: false,
} as const

export const PROGRAM_B_R7_PORTABILITY_BOUNDARY = {
  k5NumericThresholdPortability: K5_RECOMMENDATION_PORTABILITY_STUDY.numericThresholdPortability,
  k5Decision: K5_RECOMMENDATION_PORTABILITY_STUDY.decision,
  universalNumericRecommendationThresholdsAllowed: false,
  crossSectorSizingHeuristicBorrowingAllowed: false,
} as const

export const PROGRAM_B_B3_SAFETY_BOUNDARY = {
  recommendationComputationExecuted: false,
  recommendationPersistence: false,
  sizingComputationExecuted: false,
  sizingPersistence: false,
  ownerSettingsMutation: false,
  providerCalls: 0,
  angelOneCalls: 0,
  trendlyneCalls: 0,
  openAiDecisionCalls: 0,
  productionMutation: false,
  migration: false,
  deployment: false,
  merge: false,
  schedulerMutation: false,
  trading: false,
} as const
