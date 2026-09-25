import { describe, expect, it } from "vitest"
import {
  buildProgramD2ValidationSummary,
  classifyProgramD2ProviderBatch,
  evaluateProgramD2ExecutionGate,
  PROGRAM_D_D2_BOUNDED_PILOT_READINESS,
  simulateProgramD2BoundedRetry,
  staleDomainOnlyProviderRequirements,
} from "./programD2Validation"

describe("Program D D2 adversarial validation", () => {
  it("passes the complete local D2 adversarial matrix with zero provider calls", async () => {
    const summary = await buildProgramD2ValidationSummary()
    expect(summary.failed).toBe(0)
    expect(summary.passed).toBe(summary.total)
    expect(summary.total).toBeGreaterThanOrEqual(18)
    expect(summary.providerCalls).toBe(0)
    expect(summary.realProviderPilotAuthorized).toBe(false)
  })

  it("fails closed across global, provider, domain, budget and recursion gates", () => {
    expect(evaluateProgramD2ExecutionGate({
      globalAutomationEnabled: false,
      providerEnabled: true,
      domainEnabled: true,
      estimatedPhysicalCalls: 1,
      remainingBudget: 10,
      generation: 1,
      maximumGeneration: 4,
    })).toBe("BLOCKED_GLOBAL_KILL_SWITCH")
    expect(evaluateProgramD2ExecutionGate({
      globalAutomationEnabled: true,
      providerEnabled: false,
      domainEnabled: true,
      estimatedPhysicalCalls: 1,
      remainingBudget: 10,
      generation: 1,
      maximumGeneration: 4,
    })).toBe("BLOCKED_PROVIDER_KILL_SWITCH")
    expect(evaluateProgramD2ExecutionGate({
      globalAutomationEnabled: true,
      providerEnabled: true,
      domainEnabled: false,
      estimatedPhysicalCalls: 1,
      remainingBudget: 10,
      generation: 1,
      maximumGeneration: 4,
    })).toBe("BLOCKED_DOMAIN_KILL_SWITCH")
    expect(evaluateProgramD2ExecutionGate({
      globalAutomationEnabled: true,
      providerEnabled: true,
      domainEnabled: true,
      estimatedPhysicalCalls: 11,
      remainingBudget: 10,
      generation: 1,
      maximumGeneration: 4,
    })).toBe("BLOCKED_BUDGET")
    expect(evaluateProgramD2ExecutionGate({
      globalAutomationEnabled: true,
      providerEnabled: true,
      domainEnabled: true,
      estimatedPhysicalCalls: 0,
      remainingBudget: 10,
      generation: 5,
      maximumGeneration: 4,
    })).toBe("BLOCKED_RECURSIVE_TRIGGER")
  })

  it("keeps mixed provider outcomes explicitly partial", () => {
    expect(classifyProgramD2ProviderBatch(["ACCEPTED", "REJECTED"])).toBe("PARTIAL")
    expect(classifyProgramD2ProviderBatch(["ACCEPTED"])).toBe("SUCCEEDED")
    expect(classifyProgramD2ProviderBatch(["REJECTED"])).toBe("FAILED")
  })

  it("bounds transient retries", () => {
    expect(simulateProgramD2BoundedRetry({
      maximumRetries: 2,
      transientFailuresBeforeSuccess: 2,
    })).toEqual({ attempts: 3, retries: 2, terminalState: "SUCCEEDED" })
    expect(simulateProgramD2BoundedRetry({
      maximumRetries: 2,
      transientFailuresBeforeSuccess: 3,
    })).toEqual({ attempts: 3, retries: 2, terminalState: "RETRY_EXHAUSTED" })
  })

  it("plans only stale or missing domains", () => {
    expect(staleDomainOnlyProviderRequirements({
      IDENTITY: "FRESH",
      FUNDAMENTALS: "STALE",
      OWNERSHIP: "FRESH",
      DOCUMENTS: "MISSING",
    })).toEqual(["DOCUMENTS", "FUNDAMENTALS"])
  })

  it("keeps real bounded provider execution behind a separate owner gate", () => {
    expect(PROGRAM_D_D2_BOUNDED_PILOT_READINESS.status).toBe(
      "READY_FOR_OWNER_AUTHORIZATION",
    )
    expect(PROGRAM_D_D2_BOUNDED_PILOT_READINESS.realProviderExecutionAuthorized).toBe(false)
    expect(PROGRAM_D_D2_BOUNDED_PILOT_READINESS.requiredOwnerInputs).toEqual([
      "EXACT_PROVIDER",
      "EXACT_SECURITIES",
      "EXACT_DOMAINS",
      "EXACT_PHYSICAL_CALL_CEILING",
      "EXACT_BUDGET_CEILING",
      "MANUAL_START",
      "POST_RUN_REVIEW",
    ])
  })
})
