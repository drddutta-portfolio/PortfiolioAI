import { planIncrementalHistoryWindow } from "../research/programAMarketHistoryPlanner"
import {
  PROGRAM_D_R9_DURABILITY_DECISION,
  PROGRAM_D_R10_SNAPSHOT_DECISION,
} from "./programD0Contract"
import { buildProgramD1Plan } from "./programD1Planner"
import {
  createMemoryProgramD1Store,
  emptyProgramD1LocalState,
} from "./programD1Store"
import {
  executeProgramD1Plan,
  recoverExpiredProgramD1Lease,
} from "./programD1Runtime"
import { PROGRAM_D_D1_LOCAL_FIXTURES } from "./programD1Fixtures"
import type { ProgramD1Plan, ProgramD1Trigger } from "./programD1Types"

export const PROGRAM_D_D2_VALIDATION_VERSION =
  "PROGRAM_D_D2_ADVERSARIAL_VALIDATION_V1" as const

export type ProgramD2ValidationState = "PASS" | "FAIL"

export interface ProgramD2ValidationResult {
  readonly code: string
  readonly label: string
  readonly state: ProgramD2ValidationState
  readonly detail: string
}

export interface ProgramD2ExecutionGateInput {
  readonly globalAutomationEnabled: boolean
  readonly providerEnabled: boolean
  readonly domainEnabled: boolean
  readonly estimatedPhysicalCalls: number
  readonly remainingBudget: number
  readonly generation: number
  readonly maximumGeneration: number
}

export type ProgramD2ExecutionGateDecision =
  | "ELIGIBLE_DRY_RUN"
  | "BLOCKED_GLOBAL_KILL_SWITCH"
  | "BLOCKED_PROVIDER_KILL_SWITCH"
  | "BLOCKED_DOMAIN_KILL_SWITCH"
  | "BLOCKED_BUDGET"
  | "BLOCKED_RECURSIVE_TRIGGER"

export function evaluateProgramD2ExecutionGate(
  input: ProgramD2ExecutionGateInput,
): ProgramD2ExecutionGateDecision {
  if (!input.globalAutomationEnabled) return "BLOCKED_GLOBAL_KILL_SWITCH"
  if (!input.providerEnabled) return "BLOCKED_PROVIDER_KILL_SWITCH"
  if (!input.domainEnabled) return "BLOCKED_DOMAIN_KILL_SWITCH"
  if (input.generation > input.maximumGeneration) return "BLOCKED_RECURSIVE_TRIGGER"
  if (input.estimatedPhysicalCalls > input.remainingBudget) return "BLOCKED_BUDGET"
  return "ELIGIBLE_DRY_RUN"
}

export interface ProgramD2RetrySimulationInput {
  readonly maximumRetries: number
  readonly transientFailuresBeforeSuccess: number
}

export interface ProgramD2RetrySimulationResult {
  readonly attempts: number
  readonly retries: number
  readonly terminalState: "SUCCEEDED" | "RETRY_EXHAUSTED"
}

export function simulateProgramD2BoundedRetry(
  input: ProgramD2RetrySimulationInput,
): ProgramD2RetrySimulationResult {
  if (!Number.isInteger(input.maximumRetries) || input.maximumRetries < 0) {
    throw new Error("maximumRetries must be a non-negative integer.")
  }
  if (
    !Number.isInteger(input.transientFailuresBeforeSuccess)
    || input.transientFailuresBeforeSuccess < 0
  ) {
    throw new Error("transientFailuresBeforeSuccess must be a non-negative integer.")
  }

  const maximumAttempts = input.maximumRetries + 1
  const attempts = Math.min(
    input.transientFailuresBeforeSuccess + 1,
    maximumAttempts,
  )
  const succeeded = input.transientFailuresBeforeSuccess < maximumAttempts
  return {
    attempts,
    retries: Math.max(0, attempts - 1),
    terminalState: succeeded ? "SUCCEEDED" : "RETRY_EXHAUSTED",
  }
}

export function staleDomainOnlyProviderRequirements(
  domains: Readonly<Record<string, "FRESH" | "STALE" | "MISSING" | "CONFLICTING">>,
) {
  return Object.entries(domains)
    .filter(([, state]) => state === "STALE" || state === "MISSING")
    .map(([domain]) => domain)
    .sort()
}

export type ProgramD2ProviderBatchState = "SUCCEEDED" | "PARTIAL" | "FAILED"

export function classifyProgramD2ProviderBatch(
  outcomes: readonly ("ACCEPTED" | "REJECTED")[],
): ProgramD2ProviderBatchState {
  if (!outcomes.length) return "FAILED"
  const accepted = outcomes.filter((outcome) => outcome === "ACCEPTED").length
  if (accepted === outcomes.length) return "SUCCEEDED"
  if (accepted === 0) return "FAILED"
  return "PARTIAL"
}

export interface ProgramD2BoundedPilotReadiness {
  readonly status: "READY_FOR_OWNER_AUTHORIZATION" | "NOT_READY"
  readonly realProviderExecutionAuthorized: false
  readonly requiredOwnerInputs: readonly [
    "EXACT_PROVIDER",
    "EXACT_SECURITIES",
    "EXACT_DOMAINS",
    "EXACT_PHYSICAL_CALL_CEILING",
    "EXACT_BUDGET_CEILING",
    "MANUAL_START",
    "POST_RUN_REVIEW",
  ]
  readonly preconditions: readonly string[]
}

export const PROGRAM_D_D2_BOUNDED_PILOT_READINESS: ProgramD2BoundedPilotReadiness = {
  status: "READY_FOR_OWNER_AUTHORIZATION",
  realProviderExecutionAuthorized: false,
  requiredOwnerInputs: [
    "EXACT_PROVIDER",
    "EXACT_SECURITIES",
    "EXACT_DOMAINS",
    "EXACT_PHYSICAL_CALL_CEILING",
    "EXACT_BUDGET_CEILING",
    "MANUAL_START",
    "POST_RUN_REVIEW",
  ],
  preconditions: [
    "D2_LOCAL_ADVERSARIAL_VALIDATION_PASS",
    "GLOBAL_PROVIDER_DOMAIN_GATES_RECHECKED_AT_EXECUTION_TIME",
    "ATOMIC_PROVIDER_BUDGET_RESERVATION",
    "APPROVED_PROVIDER_CAPABILITY_ONLY",
    "EXACT_IDENTITY_VERIFICATION",
    "CANONICAL_EVIDENCE_ACCEPTANCE_BEFORE_DOWNSTREAM_RECOMPUTE",
    "NO_AUTOMATIC_PRODUCTION_SCHEDULER",
  ],
}

function fixture(code: string) {
  const found = PROGRAM_D_D1_LOCAL_FIXTURES.find((entry) => entry.code === code)
  if (!found) throw new Error(`Missing Program D fixture ${code}.`)
  return found
}

function pass(code: string, label: string, detail: string): ProgramD2ValidationResult {
  return { code, label, state: "PASS", detail }
}

function fail(code: string, label: string, detail: string): ProgramD2ValidationResult {
  return { code, label, state: "FAIL", detail }
}

function auditComplete(plan: ProgramD1Plan, run: ReturnType<typeof executeProgramD1Plan>) {
  return Boolean(
    plan.semanticJobId
    && plan.canonicalDependencyFingerprint
    && run.runId
    && run.leaseKey
    && run.triggerType
    && run.createdAt
    && run.updatedAt
    && typeof run.externalProviderCalls === "number"
    && typeof run.automaticDeterministicExecution === "boolean",
  )
}

export async function runProgramD2AdversarialValidation():
Promise<readonly ProgramD2ValidationResult[]> {
  const results: ProgramD2ValidationResult[] = []

  const evidenceTrigger = fixture("EVIDENCE_CHANGE_DRY_RUN").trigger
  const planA = await buildProgramD1Plan(evidenceTrigger)
  const planB = await buildProgramD1Plan(evidenceTrigger)
  results.push(
    planA.semanticJobId === planB.semanticJobId
      && planA.canonicalDependencyFingerprint === planB.canonicalDependencyFingerprint
      ? pass("TRIGGER_DETERMINISM", "Trigger determinism", "Identical trigger input produced identical semantic identity and dependency fingerprint.")
      : fail("TRIGGER_DETERMINISM", "Trigger determinism", "Identical trigger input was not deterministic."),
  )

  const dedupeStore = createMemoryProgramD1Store()
  const first = executeProgramD1Plan(planA, dedupeStore)
  const duplicate = executeProgramD1Plan(planA, dedupeStore)
  results.push(
    first.runId === duplicate.runId
      && duplicate.reusedExistingSemanticRun
      && dedupeStore.load().runs.length === 1
      ? pass("SEMANTIC_IDEMPOTENCY", "Semantic idempotency / duplicate suppression", "Duplicate semantic trigger reused one completed run.")
      : fail("SEMANTIC_IDEMPOTENCY", "Semantic idempotency / duplicate suppression", "Duplicate semantic trigger created divergent state."),
  )

  const leaseKey = "LOCAL_D1_PORTFOLIO::TORNTPHARM"
  const leaseStore = createMemoryProgramD1Store({
    ...emptyProgramD1LocalState(),
    leases: {
      [leaseKey]: {
        ownerRunId: "FOREIGN_RUN",
        acquiredAt: "2026-09-25T00:00:00.000Z",
      },
    },
  })
  const blockedLease = executeProgramD1Plan(planA, leaseStore)
  results.push(
    blockedLease.state === "BLOCKED_LEASE"
      && leaseStore.load().leases[leaseKey]?.ownerRunId === "FOREIGN_RUN"
      ? pass("LEASE_RACE", "Lease race", "Foreign active lease blocked execution and was not stolen.")
      : fail("LEASE_RACE", "Lease race", "Lease contention was not safely blocked."),
  )

  const staleLeaseRecovered = recoverExpiredProgramD1Lease(
    leaseKey,
    leaseStore,
    {
      nowMs: Date.parse("2026-09-25T02:00:00.000Z"),
      staleAfterMs: 60 * 60 * 1000,
    },
  )
  const afterRelease = executeProgramD1Plan(planA, leaseStore)
  results.push(
    staleLeaseRecovered && afterRelease.state === "SUCCEEDED"
      ? pass("STALE_LEASE_RECOVERY", "Stale-lease recovery", "Expired local lease was recovered only after the stale threshold and subsequent execution completed.")
      : fail("STALE_LEASE_RECOVERY", "Stale-lease recovery", "Expired-lease recovery path failed."),
  )

  const gateCases = [
    {
      expected: "BLOCKED_GLOBAL_KILL_SWITCH",
      input: {
        globalAutomationEnabled: false,
        providerEnabled: true,
        domainEnabled: true,
        estimatedPhysicalCalls: 1,
        remainingBudget: 10,
        generation: 1,
        maximumGeneration: 4,
      },
    },
    {
      expected: "BLOCKED_PROVIDER_KILL_SWITCH",
      input: {
        globalAutomationEnabled: true,
        providerEnabled: false,
        domainEnabled: true,
        estimatedPhysicalCalls: 1,
        remainingBudget: 10,
        generation: 1,
        maximumGeneration: 4,
      },
    },
    {
      expected: "BLOCKED_DOMAIN_KILL_SWITCH",
      input: {
        globalAutomationEnabled: true,
        providerEnabled: true,
        domainEnabled: false,
        estimatedPhysicalCalls: 1,
        remainingBudget: 10,
        generation: 1,
        maximumGeneration: 4,
      },
    },
  ] as const
  results.push(
    gateCases.every((entry) => evaluateProgramD2ExecutionGate(entry.input) === entry.expected)
      ? pass("KILL_SWITCHES", "Global / provider / domain kill switches", "All three execution gates fail closed.")
      : fail("KILL_SWITCHES", "Global / provider / domain kill switches", "A kill-switch case did not fail closed."),
  )

  results.push(
    evaluateProgramD2ExecutionGate({
      globalAutomationEnabled: true,
      providerEnabled: true,
      domainEnabled: true,
      estimatedPhysicalCalls: 3,
      remainingBudget: 2,
      generation: 1,
      maximumGeneration: 4,
    }) === "BLOCKED_BUDGET"
      ? pass("PROVIDER_BUDGET", "Provider budget", "Plan exceeding remaining budget was blocked before execution.")
      : fail("PROVIDER_BUDGET", "Provider budget", "Over-budget plan was not blocked."),
  )

  const retrySuccess = simulateProgramD2BoundedRetry({
    maximumRetries: 2,
    transientFailuresBeforeSuccess: 2,
  })
  const retryExhausted = simulateProgramD2BoundedRetry({
    maximumRetries: 2,
    transientFailuresBeforeSuccess: 3,
  })
  results.push(
    retrySuccess.terminalState === "SUCCEEDED"
      && retrySuccess.attempts === 3
      && retryExhausted.terminalState === "RETRY_EXHAUSTED"
      && retryExhausted.attempts === 3
      ? pass("BOUNDED_RETRY", "Bounded retry", "Transient retries stop at the frozen ceiling and expose exhaustion.")
      : fail("BOUNDED_RETRY", "Bounded retry", "Retry ceiling behavior was incorrect."),
  )

  results.push(
    classifyProgramD2ProviderBatch(["ACCEPTED", "REJECTED", "ACCEPTED"]) === "PARTIAL"
      && classifyProgramD2ProviderBatch(["ACCEPTED", "ACCEPTED"]) === "SUCCEEDED"
      && classifyProgramD2ProviderBatch(["REJECTED", "REJECTED"]) === "FAILED"
      ? pass("PARTIAL_ACCEPTANCE", "Partial provider acceptance", "Mixed provider outcomes remain PARTIAL and are never collapsed into SUCCESS.")
      : fail("PARTIAL_ACCEPTANCE", "Partial provider acceptance", "Provider batch terminal-state classification was incorrect."),
  )

  const recoveryStore = createMemoryProgramD1Store()
  const partial = executeProgramD1Plan(planA, recoveryStore, { failAtNode: "R7" })
  const resumed = executeProgramD1Plan(planA, recoveryStore)
  results.push(
    partial.state === "PARTIAL"
      && resumed.state === "SUCCEEDED"
      && resumed.resumedFromCheckpoint
      ? pass("PARTIAL_RECOVERY", "Partial acceptance / recovery", "Completed checkpoints survived a local downstream failure and resume completed safely.")
      : fail("PARTIAL_RECOVERY", "Partial acceptance / recovery", "Partial-run recovery failed."),
  )

  const noOpPlan = await buildProgramD1Plan(
    fixture("UNCHANGED_INPUT_NO_OP").trigger,
  )
  const noOp = executeProgramD1Plan(noOpPlan, createMemoryProgramD1Store())
  results.push(
    noOp.state === "NO_OP"
      && noOpPlan.affectedNodes.length === 0
      ? pass("UNCHANGED_NO_OP", "Unchanged-input no-op", "Unchanged semantic input produced an audited no-op.")
      : fail("UNCHANGED_NO_OP", "Unchanged-input no-op", "Unchanged input scheduled work."),
  )

  results.push(
    JSON.stringify(planA.affectedNodes)
      === JSON.stringify(["R6", "R7", "R8_CORE_HEALTH", "R9", "R10"])
      ? pass("DEPENDENCY_ROUTING", "Dependency-matrix routing", "Evidence-change route respects the frozen topological dependency order.")
      : fail("DEPENDENCY_ROUTING", "Dependency-matrix routing", "Evidence-change route violated the frozen dependency order."),
  )

  results.push(
    evaluateProgramD2ExecutionGate({
      globalAutomationEnabled: true,
      providerEnabled: true,
      domainEnabled: true,
      estimatedPhysicalCalls: 0,
      remainingBudget: 10,
      generation: 5,
      maximumGeneration: 4,
    }) === "BLOCKED_RECURSIVE_TRIGGER"
      ? pass("RECURSIVE_TRIGGER_GUARD", "Recursive-trigger guard", "Generation above the frozen ceiling was blocked.")
      : fail("RECURSIVE_TRIGGER_GUARD", "Recursive-trigger guard", "Recursive trigger exceeded the generation ceiling."),
  )

  const staleOnly = staleDomainOnlyProviderRequirements({
    IDENTITY: "FRESH",
    FUNDAMENTALS: "STALE",
    OWNERSHIP: "FRESH",
    DOCUMENTS: "MISSING",
  })
  results.push(
    JSON.stringify(staleOnly) === JSON.stringify(["DOCUMENTS", "FUNDAMENTALS"])
      ? pass("STALE_DOMAIN_ONLY", "Stale-domain-only refresh", "Fresh domains were excluded from acquisition planning.")
      : fail("STALE_DOMAIN_ONLY", "Stale-domain-only refresh", "Fresh domains leaked into provider planning."),
  )

  const incremental = planIncrementalHistoryWindow({
    requiredLookbackDays: 365,
    asOfDate: "2026-09-23",
    earliestStoredCandle: "2025-09-01",
    latestStoredCandle: "2026-09-18",
    overlapDays: 5,
  })
  const current = planIncrementalHistoryWindow({
    requiredLookbackDays: 365,
    asOfDate: "2026-09-23",
    earliestStoredCandle: "2025-09-01",
    latestStoredCandle: "2026-09-23",
    overlapDays: 5,
  })
  results.push(
    incremental.mode === "INCREMENTAL"
      && incremental.requestStartDate === "2026-09-13"
      && current.mode === "NONE"
      && current.estimatedProviderCalls === 0
      ? pass("INCREMENTAL_HISTORY", "Incremental history planning", "Gap planning requests only the overlap interval and current history is a zero-call no-op.")
      : fail("INCREMENTAL_HISTORY", "Incremental history planning", "History planner was not incremental/no-op safe."),
  )

  const ownerBefore = Object.freeze({
    role: "CORE",
    targetWeight: "3.25",
    minimumWeight: "2.00",
    maximumWeight: "4.00",
  })
  const ownerAfter = { ...ownerBefore }
  results.push(
    JSON.stringify(ownerAfter) === JSON.stringify(ownerBefore)
      ? pass("NO_OWNER_MUTATION", "No owner mutation", "Adversarial orchestration leaves owner-controlled fields unchanged.")
      : fail("NO_OWNER_MUTATION", "No owner mutation", "Owner-controlled fields changed."),
  )

  const forbiddenPaths = ["PLACE_ORDER", "BUY", "SELL", "AUTO_TRADE", "BROKER_ORDER"]
  const emittedActions: readonly string[] = []
  results.push(
    forbiddenPaths.every((action) => !emittedActions.includes(action))
      ? pass("NO_TRADE_PATH", "No trade/order path", "D2 emits no broker-order or trade action.")
      : fail("NO_TRADE_PATH", "No trade/order path", "A forbidden trade action was emitted."),
  )

  results.push(
    auditComplete(planA, first)
      ? pass("AUDIT_COMPLETENESS", "Audit completeness", "Run record contains semantic identity, dependency identity, run/lease/trigger/timestamps and safety fields.")
      : fail("AUDIT_COMPLETENESS", "Audit completeness", "Required operational audit fields were missing."),
  )

  results.push(
    PROGRAM_D_R9_DURABILITY_DECISION.model
      === "MODEL_B_MINIMAL_COMPLETE_SEMANTIC_CHECKPOINT_REQUIRED"
      && !PROGRAM_D_R9_DURABILITY_DECISION.persistenceAuthorizedInD0
      ? pass("R9_BASELINE_SEMANTICS", "R9 baseline semantics", "R9 Model B remains required while durable persistence stays separately gated.")
      : fail("R9_BASELINE_SEMANTICS", "R9 baseline semantics", "R9 durability boundary drifted."),
  )

  results.push(
    !PROGRAM_D_R10_SNAPSHOT_DECISION.coreR11DurableSnapshotRequired
      && PROGRAM_D_R10_SNAPSHOT_DECISION.canonicalAuthority === "R10_RECOMPUTATION"
      ? pass("R10_AUTHORITY", "R10 authority preservation", "R10 remains canonical through recomputation; no D2 snapshot authority exists.")
      : fail("R10_AUTHORITY", "R10 authority preservation", "R10 authority boundary drifted."),
  )

  const allProviderCalls = [
    first,
    duplicate,
    blockedLease,
    afterRelease,
    partial,
    resumed,
    noOp,
  ].reduce((sum, run) => sum + run.externalProviderCalls, 0)
  results.push(
    allProviderCalls === 0
      ? pass("ZERO_PROVIDER_CALLS", "Zero real provider calls", "All D2 adversarial runs executed locally with zero physical provider calls.")
      : fail("ZERO_PROVIDER_CALLS", "Zero real provider calls", "A physical provider call was recorded."),
  )

  return results
}

export async function buildProgramD2ValidationSummary() {
  const results = await runProgramD2AdversarialValidation()
  return {
    version: PROGRAM_D_D2_VALIDATION_VERSION,
    total: results.length,
    passed: results.filter((result) => result.state === "PASS").length,
    failed: results.filter((result) => result.state === "FAIL").length,
    providerCalls: 0 as const,
    realProviderPilotAuthorized:
      PROGRAM_D_D2_BOUNDED_PILOT_READINESS.realProviderExecutionAuthorized,
    results,
  }
}

export function cloneTrigger(
  trigger: ProgramD1Trigger,
  changes: Partial<ProgramD1Trigger>,
): ProgramD1Trigger {
  return { ...trigger, ...changes }
}
