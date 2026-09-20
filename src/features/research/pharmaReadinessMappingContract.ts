export const PHARMA_READINESS_MAPPING_CONTRACT_VERSION =
  "PHARMA_V1_READINESS_MAPPING_V1_OWNER_APPROVED" as const

export const PHARMA_READINESS_MAPPING_CONTRACT = {
  version: PHARMA_READINESS_MAPPING_CONTRACT_VERSION,
  state: "OWNER_APPROVED_NOT_ACTIVE",
  dimensionMinimumScoreReadyCoverage: 0.6,
  overallMinimumScoreReadyCoverage: 0.7,
  requiresEveryWeightedDimensionReady: true,
  requiresCommonCoreReady: true,
  requiresPrimaryReady: true,
  emergingWatchIncludedInReadinessDenominator: false,
  missingMaterialOverlayMayBecomeNeutral: false,
  methodologyApproved: true,
  scoreExecutionEnabled: false,
} as const

export type PharmaVisibleReadinessState =
  | "READY"
  | "PARTIAL"
  | "INSUFFICIENT_EVIDENCE"
  | "PROFILE_PENDING"
  | "BLOCKED_REVIEW"
  | "NOT_APPLICABLE"

export type PharmaOverlayReadinessInput =
  | "NONE"
  | "READY"
  | "PARTIAL"
  | "INSUFFICIENT_EVIDENCE"
  | "BLOCKED_REVIEW"
  | "EMERGING_WATCH"

export interface PharmaDimensionReadinessInput {
  readonly applicable: boolean
  readonly profileResolved: boolean
  readonly scoreReadyCoverage: number | null
  readonly mandatoryBlockingConditionsSatisfied: boolean
  readonly reviewBlocked: boolean
  readonly overlayReadiness: PharmaOverlayReadinessInput
}

export interface PharmaDimensionReadinessResult {
  readonly contractVersion: typeof PHARMA_READINESS_MAPPING_CONTRACT_VERSION
  readonly state: "OWNER_APPROVED_NOT_ACTIVE"
  readonly visibleState: PharmaVisibleReadinessState
  readonly scoreReady: boolean
  readonly denominatorEligible: boolean
  readonly reasonCodes: readonly string[]
  readonly scoreExecutionEnabled: false
}

export interface PharmaOverallReadinessInput {
  readonly profileResolved: boolean
  readonly commonCoreState: PharmaVisibleReadinessState
  readonly primaryState: PharmaVisibleReadinessState
  readonly weightedDimensionStates: readonly PharmaVisibleReadinessState[]
  readonly overallScoreReadyCoverage: number | null
  readonly governanceBlocked: boolean
}

export interface PharmaOverallReadinessResult {
  readonly contractVersion: typeof PHARMA_READINESS_MAPPING_CONTRACT_VERSION
  readonly state: "OWNER_APPROVED_NOT_ACTIVE"
  readonly visibleState: Exclude<PharmaVisibleReadinessState, "NOT_APPLICABLE">
  readonly previewEligible: boolean
  readonly reasonCodes: readonly string[]
  readonly scoreExecutionEnabled: false
}

function assertCoverage(value: number | null, label: string) {
  if (value === null) return
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be between 0 and 1`)
  }
}

function dimensionResult(
  visibleState: PharmaVisibleReadinessState,
  scoreReady: boolean,
  denominatorEligible: boolean,
  reasonCodes: readonly string[],
): PharmaDimensionReadinessResult {
  return {
    contractVersion: PHARMA_READINESS_MAPPING_CONTRACT_VERSION,
    state: "OWNER_APPROVED_NOT_ACTIVE",
    visibleState,
    scoreReady,
    denominatorEligible,
    reasonCodes,
    scoreExecutionEnabled: false,
  }
}

export function mapPharmaDimensionReadiness(
  input: PharmaDimensionReadinessInput,
): PharmaDimensionReadinessResult {
  assertCoverage(input.scoreReadyCoverage, "scoreReadyCoverage")

  if (!input.applicable) {
    return dimensionResult("NOT_APPLICABLE", false, false, ["DIMENSION_NOT_APPLICABLE"])
  }

  if (!input.profileResolved) {
    return dimensionResult("PROFILE_PENDING", false, true, ["PROFILE_REVIEW_PENDING"])
  }

  if (input.reviewBlocked || input.overlayReadiness === "BLOCKED_REVIEW") {
    return dimensionResult("BLOCKED_REVIEW", false, true, ["REVIEW_BLOCKER_PRESENT"])
  }

  if (input.overlayReadiness === "EMERGING_WATCH") {
    // Emerging Watch is visible research context only and cannot worsen or improve
    // the numeric readiness denominator.
  } else if (input.overlayReadiness === "PARTIAL" || input.overlayReadiness === "INSUFFICIENT_EVIDENCE") {
    return dimensionResult("PARTIAL", false, true, ["MATERIAL_OVERLAY_EVIDENCE_INCOMPLETE"])
  }

  if (input.scoreReadyCoverage === null) {
    return dimensionResult("INSUFFICIENT_EVIDENCE", false, true, ["DIMENSION_COVERAGE_UNAVAILABLE"])
  }

  if (!input.mandatoryBlockingConditionsSatisfied) {
    return dimensionResult("INSUFFICIENT_EVIDENCE", false, true, ["MANDATORY_BLOCKING_CONDITION_UNSATISFIED"])
  }

  if (input.scoreReadyCoverage < PHARMA_READINESS_MAPPING_CONTRACT.dimensionMinimumScoreReadyCoverage) {
    return dimensionResult("INSUFFICIENT_EVIDENCE", false, true, ["DIMENSION_COVERAGE_BELOW_60_PERCENT"])
  }

  return dimensionResult("READY", true, true, [
    input.overlayReadiness === "EMERGING_WATCH"
      ? "DIMENSION_READY_EMERGING_WATCH_EXCLUDED"
      : "DIMENSION_SCORE_READY_GATE_SATISFIED",
  ])
}

function overallResult(
  visibleState: PharmaOverallReadinessResult["visibleState"],
  previewEligible: boolean,
  reasonCodes: readonly string[],
): PharmaOverallReadinessResult {
  return {
    contractVersion: PHARMA_READINESS_MAPPING_CONTRACT_VERSION,
    state: "OWNER_APPROVED_NOT_ACTIVE",
    visibleState,
    previewEligible,
    reasonCodes,
    scoreExecutionEnabled: false,
  }
}

export function mapPharmaOverallReadiness(
  input: PharmaOverallReadinessInput,
): PharmaOverallReadinessResult {
  assertCoverage(input.overallScoreReadyCoverage, "overallScoreReadyCoverage")

  if (!input.profileResolved || input.primaryState === "PROFILE_PENDING") {
    return overallResult("PROFILE_PENDING", false, ["PRIMARY_PROFILE_NOT_RESOLVED"])
  }

  if (
    input.governanceBlocked
    || input.commonCoreState === "BLOCKED_REVIEW"
    || input.primaryState === "BLOCKED_REVIEW"
    || input.weightedDimensionStates.includes("BLOCKED_REVIEW")
  ) {
    return overallResult("BLOCKED_REVIEW", false, ["REVIEW_OR_GOVERNANCE_BLOCKER_PRESENT"])
  }

  if (
    input.commonCoreState === "INSUFFICIENT_EVIDENCE"
    || input.primaryState === "INSUFFICIENT_EVIDENCE"
    || input.weightedDimensionStates.includes("INSUFFICIENT_EVIDENCE")
    || input.overallScoreReadyCoverage === null
    || input.overallScoreReadyCoverage < PHARMA_READINESS_MAPPING_CONTRACT.overallMinimumScoreReadyCoverage
  ) {
    return overallResult("INSUFFICIENT_EVIDENCE", false, ["OVERALL_SCORE_READY_REQUIREMENTS_NOT_MET"])
  }

  if (
    input.commonCoreState === "PARTIAL"
    || input.primaryState === "PARTIAL"
    || input.weightedDimensionStates.includes("PARTIAL")
  ) {
    return overallResult("PARTIAL", false, ["READINESS_PARTIAL"])
  }

  const everyWeightedDimensionReady =
    input.weightedDimensionStates.length > 0
    && input.weightedDimensionStates.every((state) => state === "READY")

  if (!everyWeightedDimensionReady) {
    return overallResult("INSUFFICIENT_EVIDENCE", false, ["EVERY_WEIGHTED_DIMENSION_MUST_BE_READY"])
  }

  if (input.commonCoreState !== "READY") {
    return overallResult("INSUFFICIENT_EVIDENCE", false, ["COMMON_PHARMA_CORE_NOT_READY"])
  }

  if (input.primaryState !== "READY") {
    return overallResult("INSUFFICIENT_EVIDENCE", false, ["PRIMARY_SUBPROFILE_NOT_READY"])
  }

  return overallResult("READY", true, ["OVERALL_PREVIEW_READINESS_GATE_SATISFIED"])
}
