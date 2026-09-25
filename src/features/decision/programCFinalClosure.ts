import { buildProgramBFinalAudit } from "../research/programBFinalClosure"
import { K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION } from "../research/k5CurrentPortfolioRoutingSnapshot"
import { programCR8CanonicalJson } from "./r8Determinism"
import { buildProgramCR8C2Validation } from "./r8C2Validation"
import { buildProgramCR8FrozenPortfolioDisposition } from "./r8FrozenPortfolioDisposition"
import { PROGRAM_C_R9_AUTHORITY } from "./r9AuthorityRegistry"
import { buildProgramCR9C3Validation } from "./r9C3Validation"
import { buildProgramCR9FrozenPortfolioDisposition } from "./r9FrozenPortfolioDisposition"
import { PROGRAM_C_R10_AUTHORITY } from "./r10AuthorityRegistry"
import { buildProgramCR10C4Validation } from "./r10C4Validation"
import { buildProgramCR10FrozenPortfolioDisposition } from "./r10FrozenPortfolioDisposition"
import { buildProgramCR10ReferenceValidation } from "./r10ReferenceValidation"

export const PROGRAM_C_FINAL_AUDIT_VERSION =
  "PROGRAM_C_FINAL_AUDIT_V1" as const

export const PROGRAM_C_VALIDATION_UNIVERSE_VERSION =
  "PROGRAM_C_VALIDATION_UNIVERSE_V1" as const

export const PROGRAM_C_FINAL_INTENTIONAL_LIMITATIONS = [
  "PORTFOLIO_WIDE_NUMERIC_R6_COVERAGE_NOT_COMPLETE",
  "PORTFOLIO_WIDE_NUMERIC_R7_COVERAGE_NOT_COMPLETE",
  "NUMERIC_SIZING_POLICY_NOT_APPROVED",
  "ADD_REVIEW_NOT_PROMOTED",
  "TRIM_REVIEW_NOT_PROMOTED",
  "SOME_HOLDINGS_FAIL_CLOSED_BLOCKED_OR_INSUFFICIENT",
  "R8_R9_R10_PERSISTENCE_NOT_ENABLED",
  "R9_DURABLE_ACKNOWLEDGEMENT_SNOOZE_NOT_ENABLED",
  "NO_PROVIDER_REFRESH_IN_PROGRAM_C",
  "NO_SCHEDULER",
  "NO_AI_INVESTMENT_DECISION_AUTHORITY",
  "NO_PRODUCTION_DEPLOYMENT",
  "NO_BRANCH_MERGE",
  "NO_TRADING",
  "FROZEN_VALIDATION_SNAPSHOT_IS_2026_09_22_NOT_LIVE_PRODUCTION_STATE",
  "PROGRAM_C_IS_VALIDATED_LOCAL_CANDIDATE_NOT_PRODUCTION_OPERATIONAL",
] as const

function frozenCrossEngineLineagePass() {
  const r8 = buildProgramCR8FrozenPortfolioDisposition()
  const r9 = buildProgramCR9FrozenPortfolioDisposition()
  const r10 = buildProgramCR10FrozenPortfolioDisposition()

  const r9BySymbol = new Map(r9.rows.map((row) => [row.symbol, row]))
  const r10BySymbol = new Map(r10.rows.map((row) => [row.symbol, row]))

  return r8.rows.every((r8Row) => {
    const r9Row = r9BySymbol.get(r8Row.symbol)
    const r10Row = r10BySymbol.get(r8Row.symbol)
    return Boolean(
      r9Row
      && r10Row
      && r9Row.sourceR8Disposition === r8Row.overallDisposition
      && r10Row.sourceR8Disposition === r8Row.overallDisposition
      && r10Row.sourceR9Transition === r9Row.transitionState
    )
  })
}

function referenceLineagePass() {
  const reference = buildProgramCR10ReferenceValidation()
  const input = reference.inputs.noAction
  const output = reference.noAction

  return (
    input.r9CurrentR8DecisionRunId === input.r8.decisionRunId
    && output.upstreamLineage.r8DecisionRunId === input.r8.decisionRunId
    && output.upstreamLineage.scoreRunId === input.r8.upstreamLineage.scoreRunId
    && output.upstreamLineage.recommendationRunId
      === input.r8.upstreamLineage.recommendationRunId
    && output.upstreamLineage.portfolioContextSnapshotId
      === input.r8.portfolioContextSnapshotId
    && output.upstreamLineage.r9CurrentObservedStateId
      === input.r9.currentObservedStateId
  )
}

export interface ProgramCFinalAudit {
  readonly version: typeof PROGRAM_C_FINAL_AUDIT_VERSION
  readonly validationUniverseVersion: typeof PROGRAM_C_VALIDATION_UNIVERSE_VERSION
  readonly sourceSnapshotVersion: typeof K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION
  readonly programBRegressionPass: boolean
  readonly r8ClosureRegressionPass: boolean
  readonly r9ClosureRegressionPass: boolean
  readonly r10ClosureRegressionPass: boolean
  readonly deterministicReplayPass: boolean
  readonly exactReferenceLineagePass: boolean
  readonly frozenCrossEngineLineagePass: boolean
  readonly portfolioDispositionComplete: boolean
  readonly crossSurfaceAuthorityPass: boolean
  readonly ownerAuthorityPass: boolean
  readonly providerAiPersistenceTradingSafetyPass: boolean
  readonly numericSizingBoundaryPass: boolean
  readonly frozenHoldingCount: number
  readonly r8FrozenHoldingCount: number
  readonly r9FrozenHoldingCount: number
  readonly r10FrozenHoldingCount: number
  readonly providerCalls: 0
  readonly persistedWrites: 0
  readonly productionOperational: false
  readonly branchMergeAuthorized: false
  readonly programDAuthorized: false
  readonly intentionalLimitations: typeof PROGRAM_C_FINAL_INTENTIONAL_LIMITATIONS
  readonly overallPass: boolean
}

export function buildProgramCFinalAudit(): ProgramCFinalAudit {
  const programB = buildProgramBFinalAudit()
  const r8 = buildProgramCR8C2Validation()
  const r9 = buildProgramCR9C3Validation()
  const r10 = buildProgramCR10C4Validation()

  const r8Frozen = buildProgramCR8FrozenPortfolioDisposition()
  const r9Frozen = buildProgramCR9FrozenPortfolioDisposition()
  const r10Frozen = buildProgramCR10FrozenPortfolioDisposition()

  const replayPass = (
    r8.deterministicReplayPass
    && r9.deterministicReplayPass
    && r10.deterministicReplayPass
    && programCR8CanonicalJson(buildProgramCR10ReferenceValidation())
      === programCR8CanonicalJson(buildProgramCR10ReferenceValidation())
  )

  const referenceLineage = referenceLineagePass()
  const frozenLineage = frozenCrossEngineLineagePass()

  const dispositionComplete = (
    r8Frozen.dispositionComplete
    && r9Frozen.dispositionComplete
    && r10Frozen.dispositionComplete
    && r8Frozen.totalHoldings === 238
    && r9Frozen.totalHoldings === 238
    && r10Frozen.totalHoldings === 238
    && r8Frozen.rows.length === 238
    && r9Frozen.rows.length === 238
    && r10Frozen.rows.length === 238
    && r8Frozen.sourceSnapshotVersion === K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION
    && r9Frozen.sourceSnapshotVersion === K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION
    && r10Frozen.sourceSnapshotVersion === K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION
  )

  const crossSurfaceAuthority = (
    PROGRAM_C_R10_AUTHORITY.actionCenterAuthority
      === "ONE_CANONICAL_R10_COLLECTION"
    && PROGRAM_C_R10_AUTHORITY.conflictAuthority
      === "EXPLICIT_PRESERVATION_NO_AVERAGING"
  )

  const ownerAuthority = (
    r8.ownerAuthorityPass
    && r10.ownerAuthorityPass
    && PROGRAM_C_R9_AUTHORITY.ownerMutationAuthority === "NONE"
    && PROGRAM_C_R10_AUTHORITY.ownerMutationAuthority === "NONE"
  )

  const safety = (
    r8.safetyPass
    && r9.safetyPass
    && r10.safetyPass
    && r8.providerCalls === 0
    && r9.providerCalls === 0
    && r10.providerCalls === 0
    && r8.persistedWrites === 0
    && r9.persistedWrites === 0
    && r10.persistedWrites === 0
    && PROGRAM_C_R9_AUTHORITY.aiDecisionAuthority === "NONE"
    && PROGRAM_C_R9_AUTHORITY.providerAuthority === "NONE"
    && PROGRAM_C_R9_AUTHORITY.persistenceAuthority === "NONE"
    && PROGRAM_C_R9_AUTHORITY.schedulerAuthority === "NONE"
    && PROGRAM_C_R9_AUTHORITY.tradingAuthority === "NONE"
    && PROGRAM_C_R10_AUTHORITY.aiDecisionAuthority === "NONE"
    && PROGRAM_C_R10_AUTHORITY.providerAuthority === "NONE"
    && PROGRAM_C_R10_AUTHORITY.persistenceAuthority === "NONE"
    && PROGRAM_C_R10_AUTHORITY.schedulerAuthority === "NONE"
    && PROGRAM_C_R10_AUTHORITY.tradingAuthority === "NONE"
  )

  const sizingBoundary = (
    !r8.numericActionCoverageComplete
    && programB.sizingReadyReferenceCount === 0
    && programB.portfolioSizingReadyCount === 0
    && r10.addTrimCandidateOnlyPass
    && r10Frozen.directionalAddReviewCount === 0
    && r10Frozen.directionalTrimReviewCount === 0
    && PROGRAM_C_R10_AUTHORITY.numericSizingAuthority === "NONE"
    && PROGRAM_C_R10_AUTHORITY.addReviewAuthority === "NOT_PROMOTED"
    && PROGRAM_C_R10_AUTHORITY.trimReviewAuthority === "NOT_PROMOTED"
  )

  const overallPass = (
    programB.overallPass
    && r8.overallPass
    && r9.overallPass
    && r10.overallPass
    && replayPass
    && referenceLineage
    && frozenLineage
    && dispositionComplete
    && crossSurfaceAuthority
    && ownerAuthority
    && safety
    && sizingBoundary
  )

  return {
    version: PROGRAM_C_FINAL_AUDIT_VERSION,
    validationUniverseVersion: PROGRAM_C_VALIDATION_UNIVERSE_VERSION,
    sourceSnapshotVersion: K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION,
    programBRegressionPass: programB.overallPass,
    r8ClosureRegressionPass: r8.overallPass,
    r9ClosureRegressionPass: r9.overallPass,
    r10ClosureRegressionPass: r10.overallPass,
    deterministicReplayPass: replayPass,
    exactReferenceLineagePass: referenceLineage,
    frozenCrossEngineLineagePass: frozenLineage,
    portfolioDispositionComplete: dispositionComplete,
    crossSurfaceAuthorityPass: crossSurfaceAuthority,
    ownerAuthorityPass: ownerAuthority,
    providerAiPersistenceTradingSafetyPass: safety,
    numericSizingBoundaryPass: sizingBoundary,
    frozenHoldingCount: r10Frozen.totalHoldings,
    r8FrozenHoldingCount: r8Frozen.totalHoldings,
    r9FrozenHoldingCount: r9Frozen.totalHoldings,
    r10FrozenHoldingCount: r10Frozen.totalHoldings,
    providerCalls: 0,
    persistedWrites: 0,
    productionOperational: false,
    branchMergeAuthorized: false,
    programDAuthorized: false,
    intentionalLimitations: PROGRAM_C_FINAL_INTENTIONAL_LIMITATIONS,
    overallPass,
  }
}
