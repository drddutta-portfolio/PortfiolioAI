import {
  PROGRAM_D_R11_DEPENDENCY_MATRIX,
  type ProgramDR11Node,
} from "./programD0Contract"
import type {
  ProgramD1Plan,
  ProgramD1RoutedEvent,
  ProgramD1RunRecord,
  ProgramD1StageCheckpoint,
} from "./programD1Types"
import { PROGRAM_D_D1_VERSION } from "./programD1Types"
import type { ProgramD1StateStore } from "./programD1Store"

export interface ProgramD1RuntimeOptions {
  readonly now?: () => string
  readonly failAtNode?: ProgramDR11Node | null
}

function defaultNow() {
  return new Date().toISOString()
}

function runIdFor(plan: ProgramD1Plan) {
  return `PROGRAM_D_D1::${plan.semanticJobId.slice(0, 24)}`
}

function leaseKeyFor(plan: ProgramD1Plan) {
  const subjects = [...plan.trigger.scope.subjectIds].sort().join(",")
  return `${plan.trigger.scope.portfolioId}::${subjects || "PORTFOLIO"}`
}

function terminal(state: ProgramD1RunRecord["state"]) {
  return state === "SUCCEEDED" || state === "NO_OP"
}

function routeEvents(
  semanticJobId: string,
  affectedNodes: readonly ProgramDR11Node[],
): readonly ProgramD1RoutedEvent[] {
  const affected = new Set(affectedNodes)
  const events: ProgramD1RoutedEvent[] = []
  for (const target of PROGRAM_D_R11_DEPENDENCY_MATRIX) {
    if (!affected.has(target.node)) continue
    for (const source of target.dependsOnNodes) {
      if (!affected.has(source)) continue
      events.push({
        sourceNode: source,
        targetNode: target.node,
        semanticJobId,
        mode: "DRY_RUN_EVENT",
      })
    }
  }
  return events
}

function mergeCheckpoints(
  plan: ProgramD1Plan,
  existing: ProgramD1RunRecord | undefined,
  failAtNode: ProgramDR11Node | null,
): {
  readonly checkpoints: readonly ProgramD1StageCheckpoint[]
  readonly failed: boolean
} {
  const prior = new Map(existing?.checkpoints.map((checkpoint) => [checkpoint.node, checkpoint]))
  const checkpoints: ProgramD1StageCheckpoint[] = []
  let failed = false

  for (const node of plan.affectedNodes) {
    const previous = prior.get(node)
    if (previous?.state === "DRY_RUN_COMPLETED") {
      checkpoints.push(previous)
      continue
    }
    if (failed) {
      checkpoints.push({ node, state: "PENDING", detail: "WAITING_FOR_PRIOR_DRY_RUN_STAGE" })
      continue
    }
    if (node === failAtNode) {
      checkpoints.push({ node, state: "FAILED", detail: "D1_INJECTED_LOCAL_FAILURE_FIXTURE" })
      failed = true
      continue
    }
    checkpoints.push({
      node,
      state: "DRY_RUN_COMPLETED",
      detail: "CANONICAL_STAGE_ADAPTER_DRY_RUN_ONLY_NO_ENGINE_EXECUTION",
    })
  }
  return { checkpoints, failed }
}

export function executeProgramD1Plan(
  plan: ProgramD1Plan,
  store: ProgramD1StateStore,
  options: ProgramD1RuntimeOptions = {},
): ProgramD1RunRecord {
  const now = options.now ?? defaultNow
  const timestamp = now()
  const state = store.load()
  const runId = runIdFor(plan)
  const leaseKey = leaseKeyFor(plan)
  const existing = state.runs.find((run) => run.semanticJobId === plan.semanticJobId)

  if (existing && terminal(existing.state)) {
    return {
      ...existing,
      reusedExistingSemanticRun: true,
    }
  }

  if (plan.noOpReason) {
    const record: ProgramD1RunRecord = {
      version: PROGRAM_D_D1_VERSION,
      runId,
      semanticJobId: plan.semanticJobId,
      leaseKey,
      state: "NO_OP",
      triggerType: plan.trigger.type,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      checkpoints: [],
      providerPlans: plan.providerPlans,
      routedEvents: [],
      externalProviderCalls: 0,
      automaticDeterministicExecution: false,
      reusedExistingSemanticRun: false,
      resumedFromCheckpoint: Boolean(existing),
      failureReason: plan.noOpReason,
    }
    store.save({
      ...state,
      runs: [...state.runs.filter((run) => run.semanticJobId !== plan.semanticJobId), record],
    })
    return record
  }

  const lease = state.leases[leaseKey]
  if (lease && lease.ownerRunId !== runId) {
    const blocked: ProgramD1RunRecord = {
      version: PROGRAM_D_D1_VERSION,
      runId,
      semanticJobId: plan.semanticJobId,
      leaseKey,
      state: "BLOCKED_LEASE",
      triggerType: plan.trigger.type,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      checkpoints: existing?.checkpoints ?? [],
      providerPlans: plan.providerPlans,
      routedEvents: existing?.routedEvents ?? [],
      externalProviderCalls: 0,
      automaticDeterministicExecution: false,
      reusedExistingSemanticRun: false,
      resumedFromCheckpoint: Boolean(existing),
      failureReason: "ACTIVE_DETERMINISTIC_CHAIN_LEASE",
    }
    store.save({
      ...state,
      runs: [...state.runs.filter((run) => run.semanticJobId !== plan.semanticJobId), blocked],
    })
    return blocked
  }

  const stateWithLease = {
    ...state,
    leases: {
      ...state.leases,
      [leaseKey]: { ownerRunId: runId, acquiredAt: lease?.acquiredAt ?? timestamp },
    },
  }

  const { checkpoints, failed } = mergeCheckpoints(
    plan,
    existing,
    options.failAtNode ?? null,
  )
  const completed = checkpoints.every((checkpoint) => checkpoint.state === "DRY_RUN_COMPLETED")
  const record: ProgramD1RunRecord = {
    version: PROGRAM_D_D1_VERSION,
    runId,
    semanticJobId: plan.semanticJobId,
    leaseKey,
    state: failed ? "PARTIAL" : completed ? "SUCCEEDED" : "RUNNING",
    triggerType: plan.trigger.type,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    checkpoints,
    providerPlans: plan.providerPlans,
    routedEvents: routeEvents(plan.semanticJobId, plan.affectedNodes),
    externalProviderCalls: 0,
    automaticDeterministicExecution: false,
    reusedExistingSemanticRun: false,
    resumedFromCheckpoint: Boolean(existing),
    failureReason: failed ? "D1_INJECTED_LOCAL_FAILURE_FIXTURE" : null,
  }

  const leases = { ...stateWithLease.leases }
  if (record.state === "SUCCEEDED") delete leases[leaseKey]

  store.save({
    ...stateWithLease,
    runs: [...stateWithLease.runs.filter((run) => run.semanticJobId !== plan.semanticJobId), record],
    leases,
  })
  return record
}

export function releaseProgramD1Lease(
  leaseKey: string,
  ownerRunId: string,
  store: ProgramD1StateStore,
): boolean {
  const state = store.load()
  const lease = state.leases[leaseKey]
  if (!lease || lease.ownerRunId !== ownerRunId) return false
  const leases = { ...state.leases }
  delete leases[leaseKey]
  store.save({ ...state, leases })
  return true
}


export function recoverExpiredProgramD1Lease(
  leaseKey: string,
  store: ProgramD1StateStore,
  options: {
    readonly nowMs: number
    readonly staleAfterMs: number
  },
): boolean {
  if (!Number.isFinite(options.nowMs) || options.nowMs < 0) {
    throw new Error("nowMs must be a non-negative finite number.")
  }
  if (!Number.isFinite(options.staleAfterMs) || options.staleAfterMs <= 0) {
    throw new Error("staleAfterMs must be a positive finite number.")
  }
  const state = store.load()
  const lease = state.leases[leaseKey]
  if (!lease) return false
  const acquiredAtMs = Date.parse(lease.acquiredAt)
  if (!Number.isFinite(acquiredAtMs)) return false
  if (options.nowMs - acquiredAtMs <= options.staleAfterMs) return false

  const leases = { ...state.leases }
  delete leases[leaseKey]
  store.save({ ...state, leases })
  return true
}
