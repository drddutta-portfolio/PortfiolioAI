import { buildProgramBFinalAudit } from "../research/programBFinalClosure"
import { programCR8CanonicalJson } from "./r8Determinism"
import { buildProgramCR8FrozenPortfolioDisposition } from "./r8FrozenPortfolioDisposition"
import { buildProgramCR8OwnerAuthorityRegression } from "./r8OwnerAuthority"
import { PROGRAM_C_R8_C2_SAFETY_BOUNDARY } from "./r8PortfolioDecisionEngine"
import { buildProgramCR8ReferenceValidationAssessments } from "./r8ReferenceValidation"

export const PROGRAM_C_R8_C2_VALIDATION_VERSION =
  "PROGRAM_C_R8_C2_VALIDATION_V1" as const

export function buildProgramCR8C2Validation() {
  const referenceFirst = buildProgramCR8ReferenceValidationAssessments()
  const referenceSecond = buildProgramCR8ReferenceValidationAssessments()
  const frozen = buildProgramCR8FrozenPortfolioDisposition()
  const firstReference = referenceFirst.rows[0]
  if (!firstReference) {
    throw new Error("Program C C2 validation requires at least one reference assessment.")
  }
  const owner = buildProgramCR8OwnerAuthorityRegression(
    firstReference.assessment,
  )
  const programB = buildProgramBFinalAudit()

  const deterministicReplayPass =
    programCR8CanonicalJson(referenceFirst) === programCR8CanonicalJson(referenceSecond)
  const portfolioDispositionPass =
    frozen.totalHoldings === 238
    && frozen.rows.length === 238
    && frozen.dispositionComplete
  const ownerAuthorityPass =
    owner.ownerContextAfter === owner.ownerContextBefore
    && owner.ownerFieldMutationCount === 0
    && owner.persistenceMutationCount === 0
    && owner.machineAssessmentWriteCount === 1
  const safetyPass =
    PROGRAM_C_R8_C2_SAFETY_BOUNDARY.readOnlyExecution
    && PROGRAM_C_R8_C2_SAFETY_BOUNDARY.providerCalls === 0
    && PROGRAM_C_R8_C2_SAFETY_BOUNDARY.angelOneCalls === 0
    && PROGRAM_C_R8_C2_SAFETY_BOUNDARY.trendlyneCalls === 0
    && PROGRAM_C_R8_C2_SAFETY_BOUNDARY.openAiDecisionCalls === 0
    && !PROGRAM_C_R8_C2_SAFETY_BOUNDARY.scoreRecomputation
    && !PROGRAM_C_R8_C2_SAFETY_BOUNDARY.recommendationRecomputation
    && !PROGRAM_C_R8_C2_SAFETY_BOUNDARY.numericSizingAuthority
    && !PROGRAM_C_R8_C2_SAFETY_BOUNDARY.ownerSettingsMutation
    && !PROGRAM_C_R8_C2_SAFETY_BOUNDARY.persistence
    && !PROGRAM_C_R8_C2_SAFETY_BOUNDARY.schemaMigration
    && !PROGRAM_C_R8_C2_SAFETY_BOUNDARY.productionMutation
    && !PROGRAM_C_R8_C2_SAFETY_BOUNDARY.deployment
    && !PROGRAM_C_R8_C2_SAFETY_BOUNDARY.merge
    && !PROGRAM_C_R8_C2_SAFETY_BOUNDARY.schedulerMutation
    && !PROGRAM_C_R8_C2_SAFETY_BOUNDARY.trading

  const referenceLineagePass = referenceFirst.rows.every((row) => (
    Boolean(row.assessment.upstreamLineage.scoreRunId)
    && Boolean(row.assessment.decisionRunId)
    && row.assessment.portfolioContextSnapshotId === referenceFirst.context.snapshotId
  ))

  const overallPass = (
    deterministicReplayPass
    && portfolioDispositionPass
    && ownerAuthorityPass
    && safetyPass
    && referenceLineagePass
    && programB.overallPass
  )

  return {
    version: PROGRAM_C_R8_C2_VALIDATION_VERSION,
    referenceCount: referenceFirst.rows.length,
    deterministicReplayPass,
    portfolioDispositionPass,
    frozenHoldingCount: frozen.totalHoldings,
    numericActionCoverageComplete: frozen.numericActionCoverageComplete,
    ownerAuthorityPass,
    safetyPass,
    referenceLineagePass,
    programBRegressionPass: programB.overallPass,
    providerCalls: 0 as const,
    persistedWrites: 0 as const,
    overallPass,
  }
}
