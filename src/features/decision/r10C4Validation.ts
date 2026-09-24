import { buildProgramCR8C2Validation } from "./r8C2Validation"
import { programCR8CanonicalJson } from "./r8Determinism"
import { buildProgramCR9C3Validation } from "./r9C3Validation"
import { PROGRAM_C_R10_AUTHORITY } from "./r10AuthorityRegistry"
import {
  PROGRAM_C_R10_DIRECTIONAL_CANDIDATES,
  PROGRAM_C_R10_SAFETY_BOUNDARY,
  PROGRAM_C_R10_STATES,
} from "./r10ActionCenterContract"
import { buildProgramCR10FrozenPortfolioDisposition } from "./r10FrozenPortfolioDisposition"
import { buildProgramCR10OwnerAuthorityRegression } from "./r10OwnerAuthority"
import { buildProgramCR10ReferenceValidation } from "./r10ReferenceValidation"

export const PROGRAM_C_R10_C4_VALIDATION_VERSION =
  "PROGRAM_C_R10_C4_VALIDATION_V1" as const

export function buildProgramCR10C4Validation() {
  const first = buildProgramCR10ReferenceValidation()
  const second = buildProgramCR10ReferenceValidation()
  const frozen = buildProgramCR10FrozenPortfolioDisposition()
  const r8 = buildProgramCR8C2Validation()
  const r9 = buildProgramCR9C3Validation()
  const owner = buildProgramCR10OwnerAuthorityRegression(first.noAction)

  const replayPass = programCR8CanonicalJson(first) === programCR8CanonicalJson(second)
  const precedencePass = (
    first.exitConflict.state === "EXIT_REVIEW"
    && first.exitConflict.conflicts.length > 0
    && first.evidenceReview.state === "EVIDENCE_REVIEW"
    && first.concentration.state === "CONCENTRATION_REVIEW"
    && first.roleReview.state === "ROLE_REVIEW"
    && first.blocked.state === "BLOCKED_PREREQUISITE"
    && first.stopThreshold.state === "REVIEW_REQUIRED"
    && first.noAction.state === "NO_ACTION_REQUIRED"
    && first.firstObservation.state === "MONITOR"
  )
  const conflictPass = first.exitConflict.conflicts.some(
    (conflict) => conflict.code === "FAVOURABLE_RECOMMENDATION_VS_EXIT_RISK",
  )
  const canonicalStates: readonly string[] = PROGRAM_C_R10_STATES
  const directionalBoundaryPass = (
    !canonicalStates.includes("ADD_REVIEW")
    && !canonicalStates.includes("TRIM_REVIEW")
    && !PROGRAM_C_R10_DIRECTIONAL_CANDIDATES.ADD_REVIEW.canonical
    && !PROGRAM_C_R10_DIRECTIONAL_CANDIDATES.TRIM_REVIEW.canonical
  )
  const portfolioDispositionPass = (
    frozen.totalHoldings === 238
    && frozen.rows.length === 238
    && frozen.dispositionComplete
    && frozen.directionalAddReviewCount === 0
    && frozen.directionalTrimReviewCount === 0
  )
  const ownerAuthorityPass = (
    owner.ownerContextAfter === owner.ownerContextBefore
    && owner.ownerFieldMutationCount === 0
    && owner.attentionWriteCount === 1
    && owner.persistenceMutationCount === 0
  )
  const authorityPass = (
    PROGRAM_C_R10_AUTHORITY.executionAuthority === "C4_OWNER_AUTHORIZED_READ_ONLY"
    && PROGRAM_C_R10_AUTHORITY.actionCenterAuthority === "ONE_CANONICAL_R10_COLLECTION"
    && PROGRAM_C_R10_AUTHORITY.addReviewAuthority === "NOT_PROMOTED"
    && PROGRAM_C_R10_AUTHORITY.trimReviewAuthority === "NOT_PROMOTED"
    && PROGRAM_C_R10_AUTHORITY.numericSizingAuthority === "NONE"
    && PROGRAM_C_R10_AUTHORITY.providerAuthority === "NONE"
    && PROGRAM_C_R10_AUTHORITY.persistenceAuthority === "NONE"
    && PROGRAM_C_R10_AUTHORITY.tradingAuthority === "NONE"
  )
  const safetyPass = (
    PROGRAM_C_R10_SAFETY_BOUNDARY.reviewOrientedOnly
    && !PROGRAM_C_R10_SAFETY_BOUNDARY.addReviewPromoted
    && !PROGRAM_C_R10_SAFETY_BOUNDARY.trimReviewPromoted
    && !PROGRAM_C_R10_SAFETY_BOUNDARY.numericSizingAuthority
    && !PROGRAM_C_R10_SAFETY_BOUNDARY.tradeInstructionAllowed
    && !PROGRAM_C_R10_SAFETY_BOUNDARY.ownerSettingsMutation
    && !PROGRAM_C_R10_SAFETY_BOUNDARY.aiDecisionAuthority
    && PROGRAM_C_R10_SAFETY_BOUNDARY.providerCalls === 0
    && !PROGRAM_C_R10_SAFETY_BOUNDARY.persistence
    && !PROGRAM_C_R10_SAFETY_BOUNDARY.schedulerMutation
    && !PROGRAM_C_R10_SAFETY_BOUNDARY.trading
  )

  const overallPass = (
    replayPass
    && precedencePass
    && conflictPass
    && directionalBoundaryPass
    && portfolioDispositionPass
    && ownerAuthorityPass
    && authorityPass
    && safetyPass
    && r8.overallPass
    && r9.overallPass
  )

  return {
    version: PROGRAM_C_R10_C4_VALIDATION_VERSION,
    deterministicReplayPass: replayPass,
    deterministicPrecedencePass: precedencePass,
    conflictPreservationPass: conflictPass,
    addTrimCandidateOnlyPass: directionalBoundaryPass,
    frozenPortfolioDispositionPass: portfolioDispositionPass,
    frozenHoldingCount: frozen.totalHoldings,
    ownerAuthorityPass,
    authorityRegistryPass: authorityPass,
    safetyPass,
    r8RegressionPass: r8.overallPass,
    r9RegressionPass: r9.overallPass,
    providerCalls: 0 as const,
    persistedWrites: 0 as const,
    overallPass,
  }
}
