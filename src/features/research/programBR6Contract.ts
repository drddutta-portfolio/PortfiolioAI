import { resolveK5PortfolioMethodState } from "./k5CrossSectorValidation"
import { sectorEngineForProfileCode } from "./sectorEngineRegistry"

export const PROGRAM_B_R6_CONTRACT_VERSION = "PROGRAM_B_R6_CONTRACT_V1" as const

export type ProgramBScoringReadinessState =
  | "READY"
  | "INSUFFICIENT_EVIDENCE"
  | "STALE_REQUIRED_EVIDENCE"
  | "CONFLICTING_EVIDENCE"
  | "REVIEW_REQUIRED"
  | "METHODOLOGY_NOT_AVAILABLE"
  | "NOT_APPLICABLE"
  | "BLOCKED_PREREQUISITE"

export type ProgramBClassificationState =
  | "READY"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export type ProgramBSecurityIdentityState =
  | "READY"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export type ProgramBEvidenceState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"

export type ProgramBEvidenceApplicability = "APPLICABLE" | "NOT_APPLICABLE"

export type ProgramBAssignmentState =
  | "VALID"
  | "NOT_REQUIRED"
  | "MISSING"
  | "PROVISIONAL"
  | "DISPUTED"
  | "CONFLICTING"
  | "EXPIRED"
  | "REVIEW_REQUIRED"

export type ProgramBMethodologyResolutionState =
  | "RESOLVED"
  | "METHODOLOGY_NOT_AVAILABLE"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"

export interface ProgramBMethodologyResolutionInput {
  readonly assetClass: string
  readonly sector: string | null
  readonly industry: string | null
  readonly basicIndustry: string | null
  readonly classificationVersion: string | null
  readonly classificationState: ProgramBClassificationState
}

export interface ProgramBMethodologyResolution {
  readonly version: typeof PROGRAM_B_R6_CONTRACT_VERSION
  readonly state: ProgramBMethodologyResolutionState
  readonly engineCode: string | null
  readonly routedProfileCode: string | null
  readonly methodologyAuthority: string | null
  readonly fallbackPolicy: "NONE_FAIL_CLOSED" | null
  readonly sector: string | null
  readonly industry: string | null
  readonly basicIndustry: string | null
  readonly classificationVersion: string | null
  readonly reasonCode: string
}

export interface ProgramBAssignmentInput {
  readonly required: boolean
  readonly state: ProgramBAssignmentState
  readonly assignmentId: string | null
  readonly assignmentVersion: string | number | null
  readonly methodologyRole: string | null
}

export interface ProgramBEvidenceRequirement {
  readonly blockingDomain: string
  readonly metricCode: string | null
  readonly required: boolean
  readonly applicability: ProgramBEvidenceApplicability
  readonly state: ProgramBEvidenceState
  readonly evidenceIds: readonly string[]
  readonly evidenceAsOfDates: readonly string[]
  readonly recommendedNextEvidenceAction: string | null
}

export interface ProgramBMarketHistoryRequirement {
  readonly required: boolean
  readonly state: ProgramBEvidenceState
  readonly evidenceIds: readonly string[]
  readonly evidenceAsOfDates: readonly string[]
  readonly recommendedNextEvidenceAction: string | null
}

export interface ProgramBScoringReadinessInput {
  readonly securityId: string | null
  readonly securityIdentityState: ProgramBSecurityIdentityState
  readonly asOfDate: string
  readonly methodology: ProgramBMethodologyResolution
  readonly methodologyVersion: string | null
  readonly assignment: ProgramBAssignmentInput
  readonly evidence: readonly ProgramBEvidenceRequirement[]
  readonly marketHistory: ProgramBMarketHistoryRequirement
}

export interface ProgramBReadinessBlocker {
  readonly securityId: string | null
  readonly readinessState: Exclude<ProgramBScoringReadinessState, "READY">
  readonly blockingDomain: string
  readonly blockingMetric: string | null
  readonly requiredState: string
  readonly observedState: string
  readonly reasonCode: string
  readonly methodologyId: string | null
  readonly methodologyRole: string | null
  readonly assignmentVersion: string | number | null
  readonly asOfDate: string
  readonly recommendedNextEvidenceAction: string | null
}

export interface ProgramBScoringReadinessResult {
  readonly version: typeof PROGRAM_B_R6_CONTRACT_VERSION
  readonly securityId: string | null
  readonly asOfDate: string
  readonly state: ProgramBScoringReadinessState
  readonly canScore: boolean
  readonly engineCode: string | null
  readonly routedProfileCode: string | null
  readonly methodologyId: string | null
  readonly methodologyVersion: string | null
  readonly methodologyRole: string | null
  readonly classificationVersion: string | null
  readonly assignmentId: string | null
  readonly assignmentVersion: string | number | null
  readonly reasonCodes: readonly string[]
  readonly blockers: readonly ProgramBReadinessBlocker[]
}

export type ProgramBMetricApplicability = "APPLICABLE" | "NOT_APPLICABLE"

export interface ProgramBScoreEvidenceFreshness {
  readonly evidenceId: string
  readonly state: "FRESH" | "NOT_APPLICABLE"
  readonly asOfDate: string | null
}

export interface ProgramBScoreLineageContract {
  readonly securityId: string
  readonly asOfDate: string
  readonly classificationVersion: string
  readonly assignmentId: string | null
  readonly assignmentVersion: string | number | null
  readonly methodologyRole: string
  readonly methodologyId: string
  readonly methodologyVersion: string
  readonly evidenceSnapshotId: string | null
  readonly evidenceIds: readonly string[]
  readonly evidenceAsOfDates: readonly string[]
  readonly evidenceFreshness: readonly ProgramBScoreEvidenceFreshness[]
  readonly metricValues: Readonly<Record<string, number | string | null>>
  readonly metricApplicability: Readonly<Record<string, ProgramBMetricApplicability>>
  readonly metricComponentScores: Readonly<Record<string, number | string>>
  readonly metricWeights: Readonly<Record<string, number | string>>
  readonly categoryScores: Readonly<Record<string, number | string>>
  readonly overallScore: number | string
  readonly readinessState: "READY"
  readonly reasonCodes: readonly string[]
  readonly calculationVersion: string
  readonly runId: string
  readonly createdAt: string
}

export interface ProgramBLineageIdentityInput {
  readonly securityId: string
  readonly methodologyRole: string
  readonly assignmentId: string | null
  readonly assignmentVersion: string | number | null
  readonly methodologyId: string
  readonly methodologyVersion: string
  readonly asOfDate: string
  readonly runId: string
}

export const PROGRAM_B_SCORE_LINEAGE_REQUIRED_FIELDS = [
  "securityId",
  "asOfDate",
  "classificationVersion",
  "assignmentId",
  "assignmentVersion",
  "methodologyRole",
  "methodologyId",
  "methodologyVersion",
  "evidenceSnapshotId",
  "evidenceIds",
  "evidenceAsOfDates",
  "evidenceFreshness",
  "metricValues",
  "metricApplicability",
  "metricComponentScores",
  "metricWeights",
  "categoryScores",
  "overallScore",
  "readinessState",
  "reasonCodes",
  "calculationVersion",
  "runId",
  "createdAt",
] as const satisfies readonly (keyof ProgramBScoreLineageContract)[]

export const PROGRAM_B_B1_SAFETY_BOUNDARY = {
  cacheOnly: true,
  providerCalls: 0,
  angelOneCalls: 0,
  trendlyneCalls: 0,
  openAiDecisionCalls: 0,
  numericScoringExecuted: false,
  scorePersistence: false,
  recommendationComputation: false,
  recommendationPersistence: false,
  positionSizing: false,
  productionMutation: false,
  migration: false,
  deployment: false,
  merge: false,
  schedulerMutation: false,
  trading: false,
} as const

function clean(value: string | null) {
  return value?.trim() || null
}

export function resolveProgramBMethodology(
  input: ProgramBMethodologyResolutionInput,
): ProgramBMethodologyResolution {
  if (input.classificationState !== "READY") {
    return {
      version: PROGRAM_B_R6_CONTRACT_VERSION,
      state: "REVIEW_REQUIRED",
      engineCode: null,
      routedProfileCode: null,
      methodologyAuthority: null,
      fallbackPolicy: null,
      sector: clean(input.sector),
      industry: clean(input.industry),
      basicIndustry: clean(input.basicIndustry),
      classificationVersion: clean(input.classificationVersion),
      reasonCode: `CLASSIFICATION_${input.classificationState}`,
    }
  }

  const routed = resolveK5PortfolioMethodState({
    assetClass: input.assetClass,
    sector: input.sector,
    industry: input.industry,
  })

  if (routed.state !== "SUPPORTED_ENGINE" || routed.profileCode === null) {
    const unresolvedState: ProgramBMethodologyResolutionState =
      routed.state === "NOT_APPLICABLE"
        ? "NOT_APPLICABLE"
        : routed.state === "REVIEW_REQUIRED"
          ? "REVIEW_REQUIRED"
          : "METHODOLOGY_NOT_AVAILABLE"
    return {
      version: PROGRAM_B_R6_CONTRACT_VERSION,
      state: unresolvedState,
      engineCode: routed.engineCode,
      routedProfileCode: routed.profileCode,
      methodologyAuthority: null,
      fallbackPolicy: null,
      sector: clean(input.sector),
      industry: clean(input.industry),
      basicIndustry: clean(input.basicIndustry),
      classificationVersion: clean(input.classificationVersion),
      reasonCode: routed.reasonCode,
    }
  }

  const engine = sectorEngineForProfileCode(routed.profileCode)
  if (!engine || engine.engineCode !== routed.engineCode) {
    return {
      version: PROGRAM_B_R6_CONTRACT_VERSION,
      state: "METHODOLOGY_NOT_AVAILABLE",
      engineCode: routed.engineCode,
      routedProfileCode: routed.profileCode,
      methodologyAuthority: null,
      fallbackPolicy: null,
      sector: clean(input.sector),
      industry: clean(input.industry),
      basicIndustry: clean(input.basicIndustry),
      classificationVersion: clean(input.classificationVersion),
      reasonCode: "ENGINE_PROFILE_AUTHORITY_MISMATCH",
    }
  }

  const profileAuthority = engine.profileAuthorities?.[routed.profileCode]
  if (profileAuthority?.state === "PENDING_METHODOLOGY") {
    return {
      version: PROGRAM_B_R6_CONTRACT_VERSION,
      state: "METHODOLOGY_NOT_AVAILABLE",
      engineCode: engine.engineCode,
      routedProfileCode: routed.profileCode,
      methodologyAuthority: null,
      fallbackPolicy: engine.fallbackPolicy,
      sector: clean(input.sector),
      industry: clean(input.industry),
      basicIndustry: clean(input.basicIndustry),
      classificationVersion: clean(input.classificationVersion),
      reasonCode: "REGISTERED_PROFILE_METHODOLOGY_PENDING",
    }
  }

  return {
    version: PROGRAM_B_R6_CONTRACT_VERSION,
    state: "RESOLVED",
    engineCode: engine.engineCode,
    routedProfileCode: routed.profileCode,
    methodologyAuthority: profileAuthority?.methodologyAuthority ?? engine.methodologyAuthority,
    fallbackPolicy: engine.fallbackPolicy,
    sector: clean(input.sector),
    industry: clean(input.industry),
    basicIndustry: clean(input.basicIndustry),
    classificationVersion: clean(input.classificationVersion),
    reasonCode: "AUTHORITATIVE_METHODOLOGY_RESOLVED",
  }
}

function blocker(
  input: ProgramBScoringReadinessInput,
  readinessState: Exclude<ProgramBScoringReadinessState, "READY">,
  blockingDomain: string,
  blockingMetric: string | null,
  requiredState: string,
  observedState: string,
  reasonCode: string,
  recommendedNextEvidenceAction: string | null,
): ProgramBReadinessBlocker {
  return {
    securityId: clean(input.securityId),
    readinessState,
    blockingDomain,
    blockingMetric,
    requiredState,
    observedState,
    reasonCode,
    methodologyId: input.methodology.methodologyAuthority,
    methodologyRole: clean(input.assignment.methodologyRole) ?? input.methodology.routedProfileCode,
    assignmentVersion: input.assignment.assignmentVersion,
    asOfDate: input.asOfDate,
    recommendedNextEvidenceAction,
  }
}

const BLOCKER_PRIORITY: Readonly<Record<Exclude<ProgramBScoringReadinessState, "READY">, number>> = {
  NOT_APPLICABLE: 0,
  REVIEW_REQUIRED: 1,
  METHODOLOGY_NOT_AVAILABLE: 2,
  BLOCKED_PREREQUISITE: 3,
  CONFLICTING_EVIDENCE: 4,
  STALE_REQUIRED_EVIDENCE: 5,
  INSUFFICIENT_EVIDENCE: 6,
}

function finalState(blockers: readonly ProgramBReadinessBlocker[]): ProgramBScoringReadinessState {
  if (!blockers.length) return "READY"
  return [...blockers]
    .sort((left, right) => BLOCKER_PRIORITY[left.readinessState] - BLOCKER_PRIORITY[right.readinessState])[0]!
    .readinessState
}

function evidenceBlocker(
  input: ProgramBScoringReadinessInput,
  evidence: {
    readonly blockingDomain: string
    readonly blockingMetric: string | null
    readonly state: ProgramBEvidenceState
    readonly recommendedNextEvidenceAction: string | null
  },
): ProgramBReadinessBlocker | null {
  if (evidence.state === "FRESH" || evidence.state === "NOT_APPLICABLE") return null
  if (evidence.state === "REVIEW_REQUIRED") {
    return blocker(input, "REVIEW_REQUIRED", evidence.blockingDomain, evidence.blockingMetric, "FRESH", evidence.state, `${evidence.blockingDomain}_REVIEW_REQUIRED`, evidence.recommendedNextEvidenceAction)
  }
  if (evidence.state === "CONFLICTING") {
    return blocker(input, "CONFLICTING_EVIDENCE", evidence.blockingDomain, evidence.blockingMetric, "FRESH", evidence.state, `${evidence.blockingDomain}_CONFLICTING`, evidence.recommendedNextEvidenceAction)
  }
  if (evidence.state === "STALE") {
    return blocker(input, "STALE_REQUIRED_EVIDENCE", evidence.blockingDomain, evidence.blockingMetric, "FRESH", evidence.state, `${evidence.blockingDomain}_STALE`, evidence.recommendedNextEvidenceAction)
  }
  return blocker(input, "INSUFFICIENT_EVIDENCE", evidence.blockingDomain, evidence.blockingMetric, "FRESH", evidence.state, `${evidence.blockingDomain}_MISSING`, evidence.recommendedNextEvidenceAction)
}

export function evaluateProgramBScoringReadiness(
  input: ProgramBScoringReadinessInput,
): ProgramBScoringReadinessResult {
  const blockers: ProgramBReadinessBlocker[] = []

  if (input.methodology.state === "NOT_APPLICABLE") {
    blockers.push(blocker(input, "NOT_APPLICABLE", "ASSET_TYPE", null, "EQUITY", "NOT_APPLICABLE", input.methodology.reasonCode, null))
  } else if (input.methodology.state === "REVIEW_REQUIRED") {
    blockers.push(blocker(input, "REVIEW_REQUIRED", "CLASSIFICATION", null, "READY", "REVIEW_REQUIRED", input.methodology.reasonCode, "REVIEW_CANONICAL_CLASSIFICATION"))
  } else if (input.methodology.state === "METHODOLOGY_NOT_AVAILABLE") {
    blockers.push(blocker(input, "METHODOLOGY_NOT_AVAILABLE", "METHODOLOGY", null, "AVAILABLE", "NOT_AVAILABLE", input.methodology.reasonCode, "REVIEW_METHODOLOGY_AUTHORITY"))
  }

  if (input.methodology.state === "RESOLVED") {
    if (!clean(input.securityId) || input.securityIdentityState === "MISSING") {
      blockers.push(blocker(input, "BLOCKED_PREREQUISITE", "SECURITY_IDENTITY", null, "READY", input.securityIdentityState, "SECURITY_IDENTITY_MISSING", "RECONCILE_SECURITY_IDENTITY"))
    } else if (input.securityIdentityState === "CONFLICTING" || input.securityIdentityState === "REVIEW_REQUIRED") {
      blockers.push(blocker(input, "REVIEW_REQUIRED", "SECURITY_IDENTITY", null, "READY", input.securityIdentityState, `SECURITY_IDENTITY_${input.securityIdentityState}`, "REVIEW_SECURITY_IDENTITY"))
    }

    if (!clean(input.methodology.classificationVersion)) {
      blockers.push(blocker(input, "BLOCKED_PREREQUISITE", "CLASSIFICATION", null, "VERSIONED", "VERSION_MISSING", "CLASSIFICATION_VERSION_MISSING", "MATERIALIZE_VERSIONED_CLASSIFICATION"))
    }

    if (!clean(input.methodologyVersion)) {
      blockers.push(blocker(input, "BLOCKED_PREREQUISITE", "METHODOLOGY", null, "VERSIONED", "VERSION_MISSING", "METHODOLOGY_VERSION_MISSING", "REGISTER_METHODOLOGY_VERSION"))
    }

    if (input.assignment.required) {
      if (input.assignment.state === "MISSING" || input.assignment.state === "EXPIRED") {
        blockers.push(blocker(input, "BLOCKED_PREREQUISITE", "ASSIGNMENT", null, "VALID", input.assignment.state, `ASSIGNMENT_${input.assignment.state}`, "MATERIALIZE_REVIEWED_ASSIGNMENT"))
      } else if (["PROVISIONAL", "DISPUTED", "CONFLICTING", "REVIEW_REQUIRED"].includes(input.assignment.state)) {
        blockers.push(blocker(input, "REVIEW_REQUIRED", "ASSIGNMENT", null, "VALID", input.assignment.state, `ASSIGNMENT_${input.assignment.state}`, "REVIEW_METHODOLOGY_ASSIGNMENT"))
      } else if (input.assignment.state !== "VALID") {
        blockers.push(blocker(input, "BLOCKED_PREREQUISITE", "ASSIGNMENT", null, "VALID", input.assignment.state, "ASSIGNMENT_REQUIRED_BUT_NOT_VALID", "MATERIALIZE_REVIEWED_ASSIGNMENT"))
      }

      if (input.assignment.state === "VALID" && (!clean(input.assignment.methodologyRole) || input.assignment.assignmentVersion === null)) {
        blockers.push(blocker(input, "BLOCKED_PREREQUISITE", "ASSIGNMENT", null, "VERSIONED_ROLE", "INCOMPLETE", "ASSIGNMENT_LINEAGE_INCOMPLETE", "REPAIR_ASSIGNMENT_LINEAGE"))
      }
    }

    for (const evidence of input.evidence) {
      if (!evidence.required || evidence.applicability === "NOT_APPLICABLE") continue
      const next = evidenceBlocker(input, evidence)
      if (next) blockers.push(next)
    }

    if (input.marketHistory.required) {
      const next = evidenceBlocker(input, {
        blockingDomain: "MARKET_HISTORY",
        blockingMetric: null,
        state: input.marketHistory.state,
        recommendedNextEvidenceAction: input.marketHistory.recommendedNextEvidenceAction,
      })
      if (next) blockers.push(next)
    }
  }

  const state = finalState(blockers)
  const methodologyRole = clean(input.assignment.methodologyRole) ?? input.methodology.routedProfileCode
  const reasonCodes = [...new Set(blockers.map((item) => item.reasonCode))]

  return {
    version: PROGRAM_B_R6_CONTRACT_VERSION,
    securityId: clean(input.securityId),
    asOfDate: input.asOfDate,
    state,
    canScore: state === "READY",
    engineCode: input.methodology.engineCode,
    routedProfileCode: input.methodology.routedProfileCode,
    methodologyId: input.methodology.methodologyAuthority,
    methodologyVersion: clean(input.methodologyVersion),
    methodologyRole,
    classificationVersion: input.methodology.classificationVersion,
    assignmentId: clean(input.assignment.assignmentId),
    assignmentVersion: input.assignment.assignmentVersion,
    reasonCodes: state === "READY" ? ["SCORING_READINESS_READY"] : reasonCodes,
    blockers,
  }
}

export function programBLineageIdentity(input: ProgramBLineageIdentityInput): string {
  const required = [
    input.securityId,
    input.methodologyRole,
    input.methodologyId,
    input.methodologyVersion,
    input.asOfDate,
    input.runId,
  ].map((value) => value.trim())

  if (required.some((value) => !value)) {
    throw new Error("Program B score lineage identity requires non-empty security, role, methodology, as-of date and run identity.")
  }

  const assignmentId = input.assignmentId?.trim() || "ASSIGNMENT_NOT_REQUIRED"
  const assignmentVersion = input.assignmentVersion === null ? "ASSIGNMENT_VERSION_NOT_REQUIRED" : String(input.assignmentVersion)

  return [
    input.securityId.trim(),
    input.methodologyRole.trim(),
    assignmentId,
    assignmentVersion,
    input.methodologyId.trim(),
    input.methodologyVersion.trim(),
    input.asOfDate.trim(),
    input.runId.trim(),
  ].join("::")
}
