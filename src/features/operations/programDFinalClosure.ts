import { PROGRAM_D_D0_AUTHORITY } from "./programD0Contract"
import { PROGRAM_D_D2_BOUNDED_PILOT_READINESS } from "./programD2Validation"
import { PROGRAM_D_R12_D3_COST_CEILING } from "./programD3R12Contract"
import { buildProgramD4ValidationSummary } from "./programD4R12Validation"

export const PROGRAM_D_FINAL_CLOSURE_VERSION =
  "PROGRAM_D_FINAL_AUTHORIZED_SCOPE_CLOSURE_V1" as const

export interface ProgramDFinalRepositoryEvidence {
  readonly evidenceClass: "EXECUTABLE_REPOSITORY_EVIDENCE"
  readonly branch: string
  readonly head: string
  readonly baseCommit: string
  readonly baseIsAncestor: boolean
  readonly ahead: number
  readonly behind: number
  readonly mergeCommitCount: number
  readonly changedFiles: readonly string[]
  readonly unexpectedFiles: readonly string[]
  readonly expectedBranch: string
  readonly programCDecisionFilesModified: number
  readonly researchAuthorityFilesModified: number
  readonly supabaseMigrationFilesModified: number
  readonly providerFunctionFilesModified: number
  readonly schedulerFilesModified: number
  readonly tradingFilesModified: number
}

export const PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT = {
  evidenceClass: "MANUALLY_VERIFIED_SNAPSHOT",
  productionEnabled: false,
  schedulerEnabled: false,
  migrationsApplied: false,
  realProviderPilotRun: false,
  realAiPilotRun: false,
  realExternalAiCalls: 0,
  externalAiCost: 0,
  mergeAuthorized: false,
  deploymentAuthorized: false,
  notificationsAuthorized: false,
  tradingAuthorized: false,
  numericSizingAuthority: "NONE",
  addReviewPromoted: false,
  trimReviewPromoted: false,
} as const

export const PROGRAM_D_FINAL_AUTHORIZED_SCOPE = {
  d0: "COMPLETE_PASS_CLOSED",
  d1: "COMPLETE_PASS_CLOSED",
  d2: "COMPLETE_PASS_CLOSED",
  r11: "COMPLETE_PASS_CLOSED",
  d3: "COMPLETE_PASS_CLOSED",
  d4: "COMPLETE_PASS_CLOSED",
  r12: "COMPLETE_PASS_CLOSED",
  programD: "COMPLETE_PASS_CLOSED",
} as const

export async function buildProgramDFinalClosureAudit(
  repositoryEvidence: ProgramDFinalRepositoryEvidence,
) {
  const d4 = await buildProgramD4ValidationSummary()

  const checks = [
    {
      code: "PROGRAM_C_FROZEN",
      pass:
        !PROGRAM_D_D0_AUTHORITY.programCMutationAllowed
        && repositoryEvidence.programCDecisionFilesModified === 0,
    },
    {
      code: "R11_PROVIDER_SAFETY",
      pass:
        PROGRAM_D_D2_BOUNDED_PILOT_READINESS.realProviderExecutionAuthorized === false
        && PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.realProviderPilotRun === false,
    },
    {
      code: "R12_AI_SAFETY",
      pass:
        PROGRAM_D_R12_D3_COST_CEILING.externalCallsPerRun === 0
        && PROGRAM_D_R12_D3_COST_CEILING.externalDailyCalls === 0
        && PROGRAM_D_R12_D3_COST_CEILING.externalWeeklyCalls === 0
        && PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.realAiPilotRun === false
        && PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.realExternalAiCalls === 0
        && PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.externalAiCost === 0,
    },
    {
      code: "D4_ADVERSARIAL_CLEAN",
      pass: d4.failed === 0 && d4.total === 16,
    },
    {
      code: "NO_MIGRATIONS",
      pass:
        !PROGRAM_D_D0_AUTHORITY.migrationCreationAllowed
        && !PROGRAM_D_D0_AUTHORITY.migrationApplicationAllowed
        && repositoryEvidence.supabaseMigrationFilesModified === 0
        && !PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.migrationsApplied,
    },
    {
      code: "NO_SCHEDULER_ACTIVATION",
      pass:
        !PROGRAM_D_D0_AUTHORITY.schedulerActivationAllowed
        && repositoryEvidence.schedulerFilesModified === 0
        && !PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.schedulerEnabled,
    },
    {
      code: "NO_PRODUCTION_MUTATION",
      pass:
        !PROGRAM_D_D0_AUTHORITY.productionMutationAllowed
        && !PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.productionEnabled,
    },
    {
      code: "NO_OWNER_OR_SIZING_AUTHORITY",
      pass:
        PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.numericSizingAuthority === "NONE"
        && !PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.addReviewPromoted
        && !PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.trimReviewPromoted,
    },
    {
      code: "NO_TRADING",
      pass:
        !PROGRAM_D_D0_AUTHORITY.tradingAllowed
        && !PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.tradingAuthorized
        && repositoryEvidence.tradingFilesModified === 0,
    },
    {
      code: "NO_MERGE_OR_DEPLOYMENT_AUTHORITY",
      pass:
        !PROGRAM_D_D0_AUTHORITY.mergeAllowed
        && !PROGRAM_D_D0_AUTHORITY.deploymentAllowed
        && !PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.mergeAuthorized
        && !PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.deploymentAuthorized,
    },
    {
      code: "HISTORY_BRANCH_BOUNDARY",
      pass:
        repositoryEvidence.evidenceClass === "EXECUTABLE_REPOSITORY_EVIDENCE"
        && repositoryEvidence.branch === repositoryEvidence.expectedBranch
        && repositoryEvidence.behind === 0
        && repositoryEvidence.baseIsAncestor
        && repositoryEvidence.mergeCommitCount === 0
        && repositoryEvidence.unexpectedFiles.length === 0
        && repositoryEvidence.providerFunctionFilesModified === 0
        && repositoryEvidence.researchAuthorityFilesModified === 0,
    },
    {
      code: "PRODUCTION_STATE_PRECISE",
      pass:
        !PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.productionEnabled
        && !PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.schedulerEnabled
        && !PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.realProviderPilotRun
        && !PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT.realAiPilotRun,
    },
  ] as const

  return {
    version: PROGRAM_D_FINAL_CLOSURE_VERSION,
    checks,
    total: checks.length,
    passed: checks.filter((check) => check.pass).length,
    failed: checks.filter((check) => !check.pass).length,
    productionState: PROGRAM_D_FINAL_MANUALLY_VERIFIED_SNAPSHOT,
    repositoryEvidence,
    scope: PROGRAM_D_FINAL_AUTHORIZED_SCOPE,
    closureCandidate:
      checks.every((check) => check.pass)
      && d4.failed === 0,
  }
}
