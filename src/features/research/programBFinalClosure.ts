import {
  PROGRAM_B_PHARMA_DUAL_LAYER_RESEARCH,
  PROGRAM_B_R7_PORTABILITY_BOUNDARY,
  PROGRAM_B_B3_SAFETY_BOUNDARY,
} from "./programBR7Contract"
import {
  PROGRAM_B_B2_SAFETY_BOUNDARY,
  buildProgramB2FrozenPortfolioDisposition,
  buildProgramB2ReferenceResults,
  canonicalProgramB2ReferencePayload,
} from "./programBR6Execution"
import {
  PROGRAM_B_B4_SAFETY_BOUNDARY,
  buildProgramB4FrozenPortfolioDisposition,
  buildProgramB4OwnerAuthorityRegression,
  buildProgramB4ReferenceDecisions,
  canonicalProgramB4ReferencePayload,
} from "./programBR7Execution"
import { PROGRAM_B_B1_SAFETY_BOUNDARY as R6_B1_SAFETY } from "./programBR6Contract"

export const PROGRAM_B_FINAL_AUDIT_VERSION = "PROGRAM_B_FINAL_AUDIT_V1" as const

export interface ProgramBFinalAudit {
  readonly version: typeof PROGRAM_B_FINAL_AUDIT_VERSION
  readonly r6ToR7TraceabilityPass: boolean
  readonly securityRoleAssignmentLineagePass: boolean
  readonly portfolioDispositionComplete: boolean
  readonly deterministicReplayPass: boolean
  readonly isolationContractPass: boolean
  readonly stopConditionsPass: boolean
  readonly providerFreeComputePass: boolean
  readonly aiNumericDecisionPass: boolean
  readonly ownerAuthorityPass: boolean
  readonly persistenceSafetyPass: boolean
  readonly r6TotalHoldings: number
  readonly r7TotalHoldings: number
  readonly scoredReferenceCount: number
  readonly recommendationReadyReferenceCount: number
  readonly sizingReadyReferenceCount: number
  readonly portfolioRecommendationReadyCount: number
  readonly portfolioSizingReadyCount: number
  readonly intentionalLimitations: readonly string[]
  readonly overallPass: boolean
}

function stable(value: unknown) {
  return JSON.stringify(value)
}

function r6ToR7TraceabilityPass() {
  const r6 = new Map(
    buildProgramB2ReferenceResults().map((row) => [row.symbol, row]),
  )
  const r7 = buildProgramB4ReferenceDecisions().filter(
    (row) => row.recommendation.state === "RECOMMENDATION_READY",
  )

  return r7.every((row) => {
    const source = r6.get(row.symbol)
    return (
      source?.dispositionState === "SCORED"
      && source.overallScore === row.recommendation.sourceScore
      && source.methodologyRole === row.recommendation.methodologyRole
      && row.recommendation.sourceScoreRunId !== null
      && row.recommendation.recommendationRunId !== null
      && row.recommendation.recommendationRunId.includes(
        row.recommendation.sourceScoreRunId,
      )
      && row.sizing.sourceScoreRunId === row.recommendation.sourceScoreRunId
      && row.sizing.sourceRecommendationRunId
        === row.recommendation.recommendationRunId
    )
  })
}

function lineagePass() {
  return buildProgramB4ReferenceDecisions()
    .filter((row) => row.recommendation.state === "RECOMMENDATION_READY")
    .every((row) => (
      Boolean(row.recommendation.securityId)
      && row.recommendation.researchProfileCode === "PHARMA_V1"
      && Boolean(row.recommendation.methodologyRole)
      && row.recommendation.assignmentVersion !== null
      && Boolean(row.recommendation.sourceScoreRunId)
      && Boolean(row.recommendation.recommendationRunId)
    ))
}

function replayPass() {
  const r6First = buildProgramB2ReferenceResults()
    .map(canonicalProgramB2ReferencePayload)
  const r6Second = buildProgramB2ReferenceResults()
    .map(canonicalProgramB2ReferencePayload)
  const r7First = buildProgramB4ReferenceDecisions()
    .map(canonicalProgramB4ReferencePayload)
  const r7Second = buildProgramB4ReferenceDecisions()
    .map(canonicalProgramB4ReferencePayload)

  return stable(r6First) === stable(r6Second)
    && stable(r7First) === stable(r7Second)
}

function b1SafetyPass() {
  return (
    R6_B1_SAFETY.cacheOnly
    && R6_B1_SAFETY.providerCalls === 0
    && R6_B1_SAFETY.angelOneCalls === 0
    && R6_B1_SAFETY.trendlyneCalls === 0
    && R6_B1_SAFETY.openAiDecisionCalls === 0
    && !R6_B1_SAFETY.numericScoringExecuted
    && !R6_B1_SAFETY.scorePersistence
    && !R6_B1_SAFETY.recommendationComputation
    && !R6_B1_SAFETY.recommendationPersistence
    && !R6_B1_SAFETY.positionSizing
    && !R6_B1_SAFETY.productionMutation
    && !R6_B1_SAFETY.migration
    && !R6_B1_SAFETY.deployment
    && !R6_B1_SAFETY.merge
    && !R6_B1_SAFETY.schedulerMutation
    && !R6_B1_SAFETY.trading
  )
}

function b2SafetyPass() {
  return (
    PROGRAM_B_B2_SAFETY_BOUNDARY.providerCalls === 0
    && PROGRAM_B_B2_SAFETY_BOUNDARY.angelOneCalls === 0
    && PROGRAM_B_B2_SAFETY_BOUNDARY.trendlyneCalls === 0
    && PROGRAM_B_B2_SAFETY_BOUNDARY.openAiDecisionCalls === 0
    && !PROGRAM_B_B2_SAFETY_BOUNDARY.scorePersistence
    && !PROGRAM_B_B2_SAFETY_BOUNDARY.recommendationComputation
    && !PROGRAM_B_B2_SAFETY_BOUNDARY.recommendationPersistence
    && !PROGRAM_B_B2_SAFETY_BOUNDARY.positionSizing
    && !PROGRAM_B_B2_SAFETY_BOUNDARY.productionMutation
    && !PROGRAM_B_B2_SAFETY_BOUNDARY.migration
    && !PROGRAM_B_B2_SAFETY_BOUNDARY.deployment
    && !PROGRAM_B_B2_SAFETY_BOUNDARY.merge
    && !PROGRAM_B_B2_SAFETY_BOUNDARY.schedulerMutation
    && !PROGRAM_B_B2_SAFETY_BOUNDARY.trading
  )
}

function b3SafetyPass() {
  return (
    PROGRAM_B_B3_SAFETY_BOUNDARY.providerCalls === 0
    && PROGRAM_B_B3_SAFETY_BOUNDARY.angelOneCalls === 0
    && PROGRAM_B_B3_SAFETY_BOUNDARY.trendlyneCalls === 0
    && PROGRAM_B_B3_SAFETY_BOUNDARY.openAiDecisionCalls === 0
    && !PROGRAM_B_B3_SAFETY_BOUNDARY.recommendationComputationExecuted
    && !PROGRAM_B_B3_SAFETY_BOUNDARY.recommendationPersistence
    && !PROGRAM_B_B3_SAFETY_BOUNDARY.sizingComputationExecuted
    && !PROGRAM_B_B3_SAFETY_BOUNDARY.sizingPersistence
    && !PROGRAM_B_B3_SAFETY_BOUNDARY.ownerSettingsMutation
    && !PROGRAM_B_B3_SAFETY_BOUNDARY.productionMutation
    && !PROGRAM_B_B3_SAFETY_BOUNDARY.migration
    && !PROGRAM_B_B3_SAFETY_BOUNDARY.deployment
    && !PROGRAM_B_B3_SAFETY_BOUNDARY.merge
    && !PROGRAM_B_B3_SAFETY_BOUNDARY.schedulerMutation
    && !PROGRAM_B_B3_SAFETY_BOUNDARY.trading
  )
}

function b4SafetyPass() {
  return (
    PROGRAM_B_B4_SAFETY_BOUNDARY.providerCalls === 0
    && PROGRAM_B_B4_SAFETY_BOUNDARY.angelOneCalls === 0
    && PROGRAM_B_B4_SAFETY_BOUNDARY.trendlyneCalls === 0
    && PROGRAM_B_B4_SAFETY_BOUNDARY.openAiDecisionCalls === 0
    && !PROGRAM_B_B4_SAFETY_BOUNDARY.recommendationPersistence
    && !PROGRAM_B_B4_SAFETY_BOUNDARY.sizingPersistence
    && !PROGRAM_B_B4_SAFETY_BOUNDARY.ownerSettingsMutation
    && !PROGRAM_B_B4_SAFETY_BOUNDARY.productionMutation
    && !PROGRAM_B_B4_SAFETY_BOUNDARY.migration
    && !PROGRAM_B_B4_SAFETY_BOUNDARY.deployment
    && !PROGRAM_B_B4_SAFETY_BOUNDARY.merge
    && !PROGRAM_B_B4_SAFETY_BOUNDARY.schedulerMutation
    && !PROGRAM_B_B4_SAFETY_BOUNDARY.trading
  )
}

export function buildProgramBFinalAudit(): ProgramBFinalAudit {
  const r6Portfolio = buildProgramB2FrozenPortfolioDisposition()
  const r7Portfolio = buildProgramB4FrozenPortfolioDisposition()
  const r6References = buildProgramB2ReferenceResults()
  const r7References = buildProgramB4ReferenceDecisions()
  const owner = buildProgramB4OwnerAuthorityRegression()

  const traceability = r6ToR7TraceabilityPass()
  const lineage = lineagePass()
  const replay = replayPass()
  const isolation = (
    PROGRAM_B_R7_PORTABILITY_BOUNDARY.universalNumericRecommendationThresholdsAllowed
      === false
    && PROGRAM_B_R7_PORTABILITY_BOUNDARY.crossSectorSizingHeuristicBorrowingAllowed
      === false
    && PROGRAM_B_PHARMA_DUAL_LAYER_RESEARCH.parentProfileCode === "PHARMA_V1"
    && PROGRAM_B_PHARMA_DUAL_LAYER_RESEARCH.primarySubprofiles.length === 5
    && PROGRAM_B_PHARMA_DUAL_LAYER_RESEARCH.subprofilesReplaceParent === false
  )
  const stopConditions = b1SafetyPass()
    && b2SafetyPass()
    && b3SafetyPass()
    && b4SafetyPass()
  const providerFree = (
    R6_B1_SAFETY.providerCalls === 0
    && PROGRAM_B_B2_SAFETY_BOUNDARY.providerCalls === 0
    && PROGRAM_B_B3_SAFETY_BOUNDARY.providerCalls === 0
    && PROGRAM_B_B4_SAFETY_BOUNDARY.providerCalls === 0
    && r6Portfolio.providerCalls === 0
    && r7Portfolio.providerCalls === 0
  )
  const aiFree = (
    R6_B1_SAFETY.openAiDecisionCalls === 0
    && PROGRAM_B_B2_SAFETY_BOUNDARY.openAiDecisionCalls === 0
    && PROGRAM_B_B3_SAFETY_BOUNDARY.openAiDecisionCalls === 0
    && PROGRAM_B_B4_SAFETY_BOUNDARY.openAiDecisionCalls === 0
  )
  const ownerAuthority = (
    stable(owner.ownerSettingsBefore) === stable(owner.ownerSettingsAfter)
    && owner.ownerFieldMutationCount === 0
  )
  const persistenceSafety = (
    r7Portfolio.persistedWrites === 0
    && owner.persistenceMutationCount === 0
    && !PROGRAM_B_B4_SAFETY_BOUNDARY.recommendationPersistence
    && !PROGRAM_B_B4_SAFETY_BOUNDARY.sizingPersistence
  )
  const dispositionComplete = (
    r6Portfolio.dispositionComplete
    && r7Portfolio.dispositionComplete
    && r6Portfolio.totalHoldings === 238
    && r7Portfolio.totalHoldings === 238
    && r6Portfolio.rows.length === 238
    && r7Portfolio.rows.length === 238
  )

  const overallPass = (
    traceability
    && lineage
    && dispositionComplete
    && replay
    && isolation
    && stopConditions
    && providerFree
    && aiFree
    && ownerAuthority
    && persistenceSafety
  )

  return {
    version: PROGRAM_B_FINAL_AUDIT_VERSION,
    r6ToR7TraceabilityPass: traceability,
    securityRoleAssignmentLineagePass: lineage,
    portfolioDispositionComplete: dispositionComplete,
    deterministicReplayPass: replay,
    isolationContractPass: isolation,
    stopConditionsPass: stopConditions,
    providerFreeComputePass: providerFree,
    aiNumericDecisionPass: aiFree,
    ownerAuthorityPass: ownerAuthority,
    persistenceSafetyPass: persistenceSafety,
    r6TotalHoldings: r6Portfolio.totalHoldings,
    r7TotalHoldings: r7Portfolio.totalHoldings,
    scoredReferenceCount: r6References.filter(
      (row) => row.dispositionState === "SCORED",
    ).length,
    recommendationReadyReferenceCount: r7References.filter(
      (row) => row.recommendation.state === "RECOMMENDATION_READY",
    ).length,
    sizingReadyReferenceCount: r7References.filter(
      (row) => row.sizing.state === "READY",
    ).length,
    portfolioRecommendationReadyCount: r7Portfolio.recommendationReady,
    portfolioSizingReadyCount: r7Portfolio.sizingReady,
    intentionalLimitations: [
      "PORTFOLIO_WIDE_NUMERIC_SCORING_COVERAGE_NOT_COMPLETE",
      "PORTFOLIO_WIDE_NUMERIC_RECOMMENDATION_COVERAGE_NOT_COMPLETE",
      "PROGRAM_B_NUMERIC_SIZING_POLICY_NOT_APPROVED",
      "FROZEN_PORTFOLIO_SNAPSHOT_IS_2026_09_22_NOT_LIVE_PRODUCTION_STATE",
      "PROGRAM_B_BRANCH_IS_LOCAL_CANDIDATE_AND_UNMERGED",
      "PIPELINE_NOT_PRODUCTION_OPERATIONAL",
    ],
    overallPass,
  }
}
