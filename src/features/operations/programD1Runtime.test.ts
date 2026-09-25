import { describe, expect, it } from "vitest"
import { buildProgramD1Plan } from "./programD1Planner"
import { PROGRAM_D_D1_LOCAL_FIXTURES } from "./programD1Fixtures"
import {
  createMemoryProgramD1Store,
  emptyProgramD1LocalState,
} from "./programD1Store"
import {
  executeProgramD1Plan,
  releaseProgramD1Lease,
} from "./programD1Runtime"

function fixture(code: string) {
  const found = PROGRAM_D_D1_LOCAL_FIXTURES.find((entry) => entry.code === code)
  if (!found) throw new Error(`Missing D1 fixture ${code}`)
  return found
}

describe("Program D D1 local orchestration", () => {
  it("plans unchanged semantic input as an audited no-op", async () => {
    const plan = await buildProgramD1Plan(fixture("UNCHANGED_INPUT_NO_OP").trigger)
    expect(plan.noOpReason).toBe("UNCHANGED_CANONICAL_DEPENDENCY_FINGERPRINT")
    expect(plan.affectedNodes).toEqual([])
    expect(plan.externalProviderCalls).toBe(0)

    const record = executeProgramD1Plan(plan, createMemoryProgramD1Store())
    expect(record.state).toBe("NO_OP")
    expect(record.externalProviderCalls).toBe(0)
  })

  it("builds stable SHA-256 semantic identity for identical input", async () => {
    const input = fixture("EVIDENCE_CHANGE_DRY_RUN").trigger
    const first = await buildProgramD1Plan(input)
    const second = await buildProgramD1Plan(input)
    expect(first.semanticJobId).toMatch(/^[a-f0-9]{64}$/)
    expect(second.semanticJobId).toBe(first.semanticJobId)
  })

  it("expands affected downstream dependencies without executing deterministic engines", async () => {
    const plan = await buildProgramD1Plan(fixture("EVIDENCE_CHANGE_DRY_RUN").trigger)
    expect(plan.affectedNodes).toContain("R6")
    expect(plan.affectedNodes).toContain("R7")
    expect(plan.affectedNodes).toContain("R9")
    expect(plan.affectedNodes).toContain("R10")
    expect(plan.automaticDeterministicExecution).toBe(false)

    const record = executeProgramD1Plan(plan, createMemoryProgramD1Store())
    expect(record.state).toBe("SUCCEEDED")
    expect(record.checkpoints.every((checkpoint) => checkpoint.state === "DRY_RUN_COMPLETED")).toBe(true)
    expect(record.automaticDeterministicExecution).toBe(false)
  })

  it("creates dry-run provider plans with zero physical calls", async () => {
    const plan = await buildProgramD1Plan(fixture("STALE_RESEARCH_PROVIDER_PLAN").trigger)
    expect(plan.providerPlans).toHaveLength(1)
    expect(plan.providerPlans[0]?.provider).toBe("TRENDLYNE")
    expect(plan.providerPlans[0]?.estimatedPhysicalCalls).toBe(1)
    expect(plan.providerPlans[0]?.physicalCallsExecuted).toBe(0)
    expect(plan.externalProviderCalls).toBe(0)

    const record = executeProgramD1Plan(plan, createMemoryProgramD1Store())
    expect(record.externalProviderCalls).toBe(0)
    expect(record.providerPlans[0]?.executionState).toBe("DRY_RUN_ONLY")
  })

  it("deduplicates duplicate semantic triggers", async () => {
    const plan = await buildProgramD1Plan(fixture("EVIDENCE_CHANGE_DRY_RUN").trigger)
    const store = createMemoryProgramD1Store()
    const first = executeProgramD1Plan(plan, store)
    const second = executeProgramD1Plan(plan, store)

    expect(first.state).toBe("SUCCEEDED")
    expect(second.state).toBe("SUCCEEDED")
    expect(second.runId).toBe(first.runId)
    expect(second.reusedExistingSemanticRun).toBe(true)
    expect(store.load().runs).toHaveLength(1)
  })

  it("blocks lease contention and does not steal the active lease", async () => {
    const plan = await buildProgramD1Plan(fixture("EVIDENCE_CHANGE_DRY_RUN").trigger)
    const leaseKey = "LOCAL_D1_PORTFOLIO::TORNTPHARM"
    const store = createMemoryProgramD1Store({
      ...emptyProgramD1LocalState(),
      leases: {
        [leaseKey]: {
          ownerRunId: "OTHER_ACTIVE_RUN",
          acquiredAt: "2026-09-25T00:00:00.000Z",
        },
      },
    })

    const record = executeProgramD1Plan(plan, store)
    expect(record.state).toBe("BLOCKED_LEASE")
    expect(record.failureReason).toBe("ACTIVE_DETERMINISTIC_CHAIN_LEASE")
    expect(store.load().leases[leaseKey]?.ownerRunId).toBe("OTHER_ACTIVE_RUN")
    expect(releaseProgramD1Lease(leaseKey, record.runId, store)).toBe(false)
  })

  it("resumes a partial local run from completed checkpoints", async () => {
    const plan = await buildProgramD1Plan(fixture("EVIDENCE_CHANGE_DRY_RUN").trigger)
    const store = createMemoryProgramD1Store()
    const partial = executeProgramD1Plan(plan, store, { failAtNode: "R7" })
    expect(partial.state).toBe("PARTIAL")
    expect(partial.checkpoints.find((checkpoint) => checkpoint.node === "R6")?.state).toBe("DRY_RUN_COMPLETED")
    expect(partial.checkpoints.find((checkpoint) => checkpoint.node === "R7")?.state).toBe("FAILED")

    const resumed = executeProgramD1Plan(plan, store)
    expect(resumed.state).toBe("SUCCEEDED")
    expect(resumed.resumedFromCheckpoint).toBe(true)
    expect(resumed.checkpoints.every((checkpoint) => checkpoint.state === "DRY_RUN_COMPLETED")).toBe(true)
    expect(store.load().leases[resumed.leaseKey]).toBeUndefined()
  })

  it("routes downstream events only inside the affected dry-run DAG", async () => {
    const plan = await buildProgramD1Plan(fixture("EVIDENCE_CHANGE_DRY_RUN").trigger)
    const record = executeProgramD1Plan(plan, createMemoryProgramD1Store())
    expect(record.routedEvents.length).toBeGreaterThan(0)
    expect(record.routedEvents.every((event) => event.mode === "DRY_RUN_EVENT")).toBe(true)
    expect(record.routedEvents.every((event) => event.semanticJobId === plan.semanticJobId)).toBe(true)
  })

  it("keeps all D1 external and deterministic execution disabled", async () => {
    for (const entry of PROGRAM_D_D1_LOCAL_FIXTURES) {
      const plan = await buildProgramD1Plan(entry.trigger)
      const record = executeProgramD1Plan(plan, createMemoryProgramD1Store())
      expect(plan.externalProviderCalls).toBe(0)
      expect(plan.automaticDeterministicExecution).toBe(false)
      expect(record.externalProviderCalls).toBe(0)
      expect(record.automaticDeterministicExecution).toBe(false)
      expect(record.providerPlans.every((provider) => provider.physicalCallsExecuted === 0)).toBe(true)
    }
  })
})
