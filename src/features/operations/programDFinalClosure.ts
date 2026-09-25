import { PROGRAM_D_D0_AUTHORITY } from "./programD0Contract"
import { PROGRAM_D_D2_BOUNDED_PILOT_READINESS } from "./programD2Validation"
import { PROGRAM_D_R12_D3_COST_CEILING } from "./programD3R12Contract"
import { buildProgramD4ValidationSummary } from "./programD4R12Validation"

export const PROGRAM_D_FINAL_CLOSURE_VERSION =
  "PROGRAM_D_FINAL_AUTHORIZED_SCOPE_CLOSURE_V1" as const

export const PROGRAM_D_FINAL_BRANCH_AUDIT = {
  branch: "program-d-operations-optional-ai",
  baseCommit: "f7c6cf45e7ec1d1820173addea0e18f38f84a25a",
  comparedAtCheckpoint: "D_FINAL",
  aheadByAtAudit: 95,
  behindByAtAudit: 0,
  programCDecisionFilesModified: 0,
  supabaseMigrationFilesModified: 0,
  providerFunctionFilesModified: 0,
  schedulerFilesModified: 0,
  tradingFilesModified: 0,
  allowedChangeFamilies: [
    "PROGRAM_D_DOCS",
    "PROGRAM_D_OPERATIONS",
    "PROGRAM_D_UI",
    "APP_ROUTE_NAVIGATION",
  ],
} as const

export const PROGRAM_D_FINAL_PRODUCTION_STATE = {
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
  programD: "AWAITING_FINAL_LOCAL_VALIDATION",
} as const

export async function buildProgramDFinalClosureAudit() {
  const d4 = await buildProgramD4ValidationSummary()

  const checks = [
    {
      code: "PROGRAM_C_FROZEN",
      pass:
        !PROGRAM_D_D0_AUTHORITY.programCMutationAllowed
        && PROGRAM_D_FINAL_BRANCH_AUDIT.programCDecisionFilesModified === 0,
    },
    {
      code: "R11_PROVIDER_SAFETY",
      pass:
        PROGRAM_D_D2_BOUNDED_PILOT_READINESS.realProviderExecutionAuthorized === false
        && PROGRAM_D_FINAL_PRODUCTION_STATE.realProviderPilotRun === false,
    },
    {
      code: "R12_AI_SAFETY",
      pass:
        PROGRAM_D_R12_D3_COST_CEILING.externalCallsPerRun === 0
        && PROGRAM_D_R12_D3_COST_CEILING.externalDailyCalls === 0
        && PROGRAM_D_R12_D3_COST_CEILING.externalWeeklyCalls === 0
        && PROGRAM_D_FINAL_PRODUCTION_STATE.realAiPilotRun === false
        && PROGRAM_D_FINAL_PRODUCTION_STATE.realExternalAiCalls === 0
        && PROGRAM_D_FINAL_PRODUCTION_STATE.externalAiCost === 0,
    },
    {
      code: "D4_ADVERSARIAL_CLEAN",
      pass: d4.failed === 0 && d4.total === 15,
    },
    {
      code: "NO_MIGRATIONS",
      pass:
        !PROGRAM_D_D0_AUTHORITY.migrationCreationAllowed
        && !PROGRAM_D_D0_AUTHORITY.migrationApplicationAllowed
        && PROGRAM_D_FINAL_BRANCH_AUDIT.supabaseMigrationFilesModified === 0
        && !PROGRAM_D_FINAL_PRODUCTION_STATE.migrationsApplied,
    },
    {
      code: "NO_SCHEDULER_ACTIVATION",
      pass:
        !PROGRAM_D_D0_AUTHORITY.schedulerActivationAllowed
        && !PROGRAM_D_FINAL_PRODUCTION_STATE.schedulerEnabled,
    },
    {
      code: "NO_PRODUCTION_MUTATION",
      pass:
        !PROGRAM_D_D0_AUTHORITY.productionMutationAllowed
        && !PROGRAM_D_FINAL_PRODUCTION_STATE.productionEnabled,
    },
    {
      code: "NO_OWNER_OR_SIZING_AUTHORITY",
      pass:
        PROGRAM_D_FINAL_PRODUCTION_STATE.numericSizingAuthority === "NONE"
        && !PROGRAM_D_FINAL_PRODUCTION_STATE.addReviewPromoted
        && !PROGRAM_D_FINAL_PRODUCTION_STATE.trimReviewPromoted,
    },
    {
      code: "NO_TRADING",
      pass:
        !PROGRAM_D_D0_AUTHORITY.tradingAllowed
        && !PROGRAM_D_FINAL_PRODUCTION_STATE.tradingAuthorized
        && PROGRAM_D_FINAL_BRANCH_AUDIT.tradingFilesModified === 0,
    },
    {
      code: "NO_MERGE_OR_DEPLOYMENT_AUTHORITY",
      pass:
        !PROGRAM_D_D0_AUTHORITY.mergeAllowed
        && !PROGRAM_D_D0_AUTHORITY.deploymentAllowed
        && !PROGRAM_D_FINAL_PRODUCTION_STATE.mergeAuthorized
        && !PROGRAM_D_FINAL_PRODUCTION_STATE.deploymentAuthorized,
    },
    {
      code: "HISTORY_BRANCH_BOUNDARY",
      pass:
        PROGRAM_D_FINAL_BRANCH_AUDIT.behindByAtAudit === 0
        && PROGRAM_D_FINAL_BRANCH_AUDIT.baseCommit ===
          "f7c6cf45e7ec1d1820173addea0e18f38f84a25a",
    },
    {
      code: "PRODUCTION_STATE_PRECISE",
      pass:
        !PROGRAM_D_FINAL_PRODUCTION_STATE.productionEnabled
        && !PROGRAM_D_FINAL_PRODUCTION_STATE.schedulerEnabled
        && !PROGRAM_D_FINAL_PRODUCTION_STATE.realProviderPilotRun
        && !PROGRAM_D_FINAL_PRODUCTION_STATE.realAiPilotRun,
    },
  ] as const

  return {
    version: PROGRAM_D_FINAL_CLOSURE_VERSION,
    checks,
    total: checks.length,
    passed: checks.filter((check) => check.pass).length,
    failed: checks.filter((check) => !check.pass).length,
    productionState: PROGRAM_D_FINAL_PRODUCTION_STATE,
    branchAudit: PROGRAM_D_FINAL_BRANCH_AUDIT,
    scope: PROGRAM_D_FINAL_AUTHORIZED_SCOPE,
    closureCandidate:
      checks.every((check) => check.pass)
      && d4.failed === 0,
  }
}
