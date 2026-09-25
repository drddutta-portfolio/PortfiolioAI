import type {
  ProgramBRecommendationFinalState,
  ProgramBRecommendationReadinessState,
} from "../research/programBR7Contract"
import type { ProgramBScoringReadinessState } from "../research/programBR6Contract"
import type { ProgramCR8CoreHealthResult } from "./r8CoreHealthContract"
import type { ProgramCR8ExitIntelligenceResult } from "./r8ExitIntelligenceContract"
import type {
  ProgramCR8OwnerContext,
  ProgramCR8PortfolioContextSnapshot,
} from "./r8PortfolioContext"
import type { ProgramCR8PortfolioFitResult } from "./r8PortfolioFitContract"
import type { ProgramCR8PortfolioRiskResult } from "./r8PortfolioRiskContract"

export const PROGRAM_C_R8_DECISION_CONTRACT_VERSION =
  "PROGRAM_C_R8_DECISION_CONTRACT_V1" as const

export type ProgramCR8EvidenceState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"

export interface ProgramCR8R6Reference {
  readonly readinessState: ProgramBScoringReadinessState
  readonly scoreRunId: string | null
  readonly researchProfileCode: string | null
  readonly methodologyId: string | null
  readonly methodologyVersion: string | null
  readonly methodologyRole: string | null
  readonly assignmentId: string | null
  readonly assignmentVersion: string | number | null
  readonly classificationVersion: string | null
  readonly evidenceSnapshotId: string | null
  readonly evidenceAsOfDates: readonly string[]
  readonly reasonCodes: readonly string[]
}

export interface ProgramCR8R7Reference {
  readonly readinessState: ProgramBRecommendationReadinessState
  readonly recommendationRunId: string | null
  readonly sourceScoreRunId: string | null
  readonly finalRecommendation: ProgramBRecommendationFinalState | null
  readonly suggestedRole: string | null
  readonly policyId: string | null
  readonly policyVersion: string | null
  readonly reasonCodes: readonly string[]
}

export interface ProgramCR8CanonicalEvidenceReference {
  readonly domain: string
  readonly state: ProgramCR8EvidenceState
  readonly evidenceIds: readonly string[]
  readonly asOfDates: readonly string[]
  readonly authorityVersion: string | null
}

export interface ProgramCR8PortfolioDecisionInput {
  readonly version: typeof PROGRAM_C_R8_DECISION_CONTRACT_VERSION
  readonly securityId: string
  readonly assetClass: string
  readonly asOfDate: string
  readonly r6: ProgramCR8R6Reference
  readonly r7: ProgramCR8R7Reference | null
  readonly ownerContext: ProgramCR8OwnerContext
  readonly portfolioContext: ProgramCR8PortfolioContextSnapshot
  readonly canonicalEvidence: readonly ProgramCR8CanonicalEvidenceReference[]
}

export type ProgramCR8OverallDisposition =
  | "ASSESSMENT_COMPLETE"
  | "ASSESSMENT_PARTIAL"
  | "INSUFFICIENT_EVIDENCE"
  | "REVIEW_REQUIRED"
  | "BLOCKED_PREREQUISITE"
  | "NOT_APPLICABLE"

export type ProgramCR8BlockingDomain =
  | "SECURITY_IDENTITY"
  | "UPSTREAM_LINEAGE"
  | "PORTFOLIO_CONTEXT"
  | "OWNER_CONTEXT"
  | "CORE_HEALTH"
  | "PORTFOLIO_FIT"
  | "PORTFOLIO_RISK"
  | "EXIT_INTELLIGENCE"
  | "EVIDENCE"
  | "APPLICABILITY"

export interface ProgramCR8Blocker {
  readonly domain: ProgramCR8BlockingDomain
  readonly requiredState: string
  readonly observedState: string
  readonly reasonCode: ProgramCR8ReasonCode
  readonly sourceIdentity: string | null
}

export const PROGRAM_C_R8_REASON_CODES = [
  "R8_ASSESSMENT_COMPLETE",
  "R8_ASSESSMENT_PARTIAL",
  "ASSET_NOT_APPLICABLE",
  "SECURITY_IDENTITY_MISSING",
  "UPSTREAM_R6_LINEAGE_MISSING",
  "UPSTREAM_R7_LINEAGE_MISMATCH",
  "PORTFOLIO_CONTEXT_MISSING",
  "OWNER_CONTEXT_MISSING",
  "OWNER_ROLE_NOT_CORE",
  "MANDATORY_EVIDENCE_MISSING",
  "MANDATORY_EVIDENCE_STALE",
  "MANDATORY_EVIDENCE_CONFLICTING",
  "OWNER_LIMIT_NOT_CONFIGURED_RULE_DISABLED",
  "CORRELATION_EVIDENCE_NOT_AVAILABLE_RULE_DISABLED",
  "RISK_EVIDENCE_INSUFFICIENT",
  "THESIS_EVIDENCE_INSUFFICIENT",
  "RECOMMENDATION_OWNER_ROLE_TENSION",
  "NO_NUMERIC_SIZING_AUTHORITY",
] as const

export type ProgramCR8ReasonCode = typeof PROGRAM_C_R8_REASON_CODES[number]

export interface ProgramCR8PortfolioDecisionAssessment {
  readonly version: typeof PROGRAM_C_R8_DECISION_CONTRACT_VERSION
  readonly decisionRunId: string
  readonly securityId: string
  readonly portfolioId: string
  readonly asOfDate: string
  readonly upstreamLineage: {
    readonly scoreRunId: string | null
    readonly recommendationRunId: string | null
    readonly researchProfileCode: string | null
    readonly methodologyId: string | null
    readonly methodologyVersion: string | null
    readonly methodologyRole: string | null
    readonly assignmentId: string | null
    readonly assignmentVersion: string | number | null
    readonly evidenceSnapshotId: string | null
  }
  readonly portfolioContextSnapshotId: string
  readonly coreHealth: ProgramCR8CoreHealthResult
  readonly portfolioFit: ProgramCR8PortfolioFitResult
  readonly portfolioRisk: ProgramCR8PortfolioRiskResult
  readonly exitIntelligence: ProgramCR8ExitIntelligenceResult
  readonly overallDisposition: ProgramCR8OverallDisposition
  readonly blockers: readonly ProgramCR8Blocker[]
  readonly reasonCodes: readonly ProgramCR8ReasonCode[]
}

export interface ProgramCR8RunIdentityInput {
  readonly securityId: string
  readonly portfolioId: string
  readonly portfolioContextSnapshotId: string
  readonly scoreRunId: string | null
  readonly recommendationRunId: string | null
  readonly semanticInputFingerprint: string
  readonly contractVersion?: string
}

function identityPart(value: string, field: string) {
  const clean = value.trim()
  if (!clean) throw new Error(`Program C R8 run identity requires ${field}.`)
  return clean
}

export function programCR8DecisionRunIdentity(input: ProgramCR8RunIdentityInput) {
  const parts = [
    identityPart(input.securityId, "securityId"),
    identityPart(input.portfolioId, "portfolioId"),
    identityPart(input.portfolioContextSnapshotId, "portfolioContextSnapshotId"),
    input.scoreRunId?.trim() || "R6_RUN_NONE",
    input.recommendationRunId?.trim() || "R7_RUN_NONE",
    identityPart(input.semanticInputFingerprint, "semanticInputFingerprint"),
    input.contractVersion?.trim() || PROGRAM_C_R8_DECISION_CONTRACT_VERSION,
  ]
  return `PROGRAM_C_R8_RUN::${parts.join("::")}`
}

export const PROGRAM_C_R8_OWNER_CONTROLLED_FIELDS = [
  "portfolioRole",
  "targetPrice",
  "stopLossPrice",
  "targetWeight",
  "minimumAllocation",
  "maximumAllocation",
  "investmentHorizon",
  "freezeMonitoringPreference",
] as const

export const PROGRAM_C_R8_PROHIBITED_OUTPUT_FIELDS = [
  "machineGeneratedTargetWeight",
  "machineGeneratedMinimumWeight",
  "machineGeneratedMaximumWeight",
  "exactAddPercentage",
  "exactTrimPercentage",
  "orderQuantity",
  "orderInstruction",
  "opaquePortfolioDecisionScore",
] as const

export const PROGRAM_C_R8_C1_SAFETY_BOUNDARY = {
  contractArchitectureOnly: true,
  r8EvaluationExecuted: false,
  portfolioWideR8DispositionExecuted: false,
  providerCalls: 0,
  angelOneCalls: 0,
  trendlyneCalls: 0,
  openAiDecisionCalls: 0,
  scoreRecomputation: false,
  recommendationRecomputation: false,
  numericSizingAuthority: false,
  opaquePortfolioDecisionScoreAllowed: false,
  ownerSettingsMutation: false,
  persistence: false,
  schemaMigration: false,
  productionMutation: false,
  deployment: false,
  merge: false,
  schedulerMutation: false,
  trading: false,
} as const
