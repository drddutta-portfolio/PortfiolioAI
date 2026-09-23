import { describe, expect, it, vi } from "vitest"
import type { ProgramAA1MaterializedResult } from "./programAA1CacheMaterializer"
import { PHARMA_GATE_J_METHOD_AUTHORITIES } from "./pharmaGateJFinalPortability"
import { PHARMA_SUBPROFILE_CANDIDATE_REGISTRY } from "./pharmaSubprofileCandidateRegistry"
import { buildProgramAA2Plan, executeProgramAA2Plan } from "./programAA2PilotController"

function materialized(): ProgramAA1MaterializedResult {
  const review = Array.from({ length: 6 }, (_, index) => ({
    securityId: `review-${index}`, symbol: `REVIEW${index}`, assetClass: "EQUITY", canonicalSector: null, canonicalIndustry: null,
    researchProfileCode: null, researchSubprofileCode: null, methodologyState: "REVIEW_REQUIRED" as const,
    scoringExecutionState: "BLOCKED" as const, eligibilityState: "REVIEW_REQUIRED" as const, r3Applicable: false, r5Applicable: false,
    reasonCode: "APPLICATION_SECTOR_MISSING", portfolioWeightPercent: null,
  }))
  const eligible = {
    securityId: "pharma", symbol: "ALIVUS", assetClass: "EQUITY", canonicalSector: "Pharma", canonicalIndustry: "Pharmaceuticals",
    researchProfileCode: "PHARMA_V1", researchSubprofileCode: "PHARMA", methodologyState: "AVAILABLE" as const,
    scoringExecutionState: "AVAILABLE" as const, eligibilityState: "ELIGIBLE" as const, r3Applicable: true, r5Applicable: true,
    reasonCode: "SUPPORTED_ENGINE_ROUTED", portfolioWeightPercent: null,
  }
  return {
    holdings: [],
    classificationIdentities: review.map((row, index) => ({ securityId: row.securityId, canonicalName: `${row.symbol} Limited`, canonicalIsin: `INE0000000${index + 1}`, state: "READY" as const })),
    pharmaSubprofilePrerequisites: [{ securityId: "pharma", state: "READY", resolvedSubprofile: "API_BULK_DRUGS", assignmentState: "REVIEWED", contractVersion: "API_BULK_DRUGS_V1" }],
    benchmarkEvidence: [],
    baseline: {
      version: "PROGRAM_A_A1_EVIDENCE_BASELINE_V1", asOfDate: "2026-09-23", eligibility: [...review, eligible],
      r3Coverage: ["FUNDAMENTALS", "OWNERSHIP", "VALUATION", "DOCUMENTS"].map((domain) => ({ securityId: "pharma", symbol: "ALIVUS", profileCode: "PHARMA_V1", domain: domain as "FUNDAMENTALS", state: "MISSING" as const, freshUntil: null, authoritySource: "cache", blockingReason: "MISSING", estimatedRefreshAction: "REVIEWED_ADAPTER", projectedProviderCalls: 1, sharedCallKey: null })),
      r5Coverage: [{ securityId: "pharma", symbol: "ALIVUS", profileCode: "PHARMA_V1", identityState: "FRESH", earliestStoredCandle: "2025-09-01", latestStoredCandle: "2026-09-18", availableHistoryDays: 382, lookbackSatisfied: true, missingWindow: { version: "PROGRAM_A_A1_MARKET_HISTORY_V1", mode: "INCREMENTAL", requiredStartDate: "2025-09-23", requestStartDate: "2026-09-13", requestEndDate: "2026-09-23", lookbackSatisfied: true, reasonCode: "LATEST_CANDLE_GAP", estimatedProviderCalls: 1 }, derivedMetrics: { PRICE_MOMENTUM_6M: "FRESH", PRICE_MOMENTUM_12M: "FRESH", MAX_DRAWDOWN_1Y: "FRESH", VOLATILITY_1Y: "FRESH", RELATIVE_STRENGTH_12M: "MISSING", BENCHMARK_RELATIVE_VOLATILITY_1Y: "MISSING" }, benchmarkAuthority: "PHARMA_V1", benchmarkCode: "NIFTY_PHARMA", benchmarkReadiness: "MISSING", blockingReason: "BENCHMARK_HISTORY_MISSING" }],
      benchmarkInventory: [], projectedProviderCost: { providerCalls: 0, budgetConsumed: 0, trendlyne: { holdingsNeedingRefresh: 1, domainRefreshes: 4, estimatedPhysicalCalls: 2, sharedCallGroups: 2 }, angelOne: { holdingsNeedingHistory: 1, fullBackfills: 0, incrementalRefreshes: 1, estimatedSecurityRequests: 1, estimatedBenchmarkRequests: 1 } }, pilotProposal: { r3: [], r5: [] }, providerCalls: 0, budgetConsumed: 0,
    },
  }
}

describe("Program A A2 bounded pilot", () => {
  it("selects exact bounded cohorts and deterministic incremental actions", async () => {
    const plan = await buildProgramAA2Plan(materialized())
    expect(plan.actions.filter((action) => action.stage === "A2A")).toHaveLength(5)
    expect(plan.actions.find((action) => action.capability === "COMPLETE_RESEARCH_REFRESH")).toMatchObject({
      estimatedPhysicalCalls: 4, symbol: "ALIVUS", resolvedSubprofile: "API_BULK_DRUGS",
      subprofileAssignmentState: "REVIEWED", subprofileContractVersion: "API_BULK_DRUGS_V1",
      methodologyVersion: PHARMA_GATE_J_METHOD_AUTHORITIES.API_BULK_DRUGS.methodologyVersion,
      selectionReason: "REVIEWED_PHARMA_SUBPROFILE_STALE_OR_MISSING_EVIDENCE",
    })
    expect(plan.actions.find((action) => action.capability === "SECURITY_HISTORY")?.historyWindow).toEqual({ from: "2026-09-13", to: "2026-09-23" })
    expect(plan.providerTotals).toEqual({ trendlyne: 9, angelOneSecurity: 1, angelOneBenchmark: 1, angelOneTotal: 2 })
    expect(plan.actualProviderCalls).toBe(0)
    expect(plan.confirmationToken).toBe(`APPROVE_PROGRAM_A_A2_${plan.planId.slice(0, 16).toUpperCase()}`)
    expect(await buildProgramAA2Plan(materialized())).toEqual(plan)
  })

  it("changes the fingerprint when the reviewed Pharma subprofile or contract binding changes", async () => {
    const api = materialized()
    const apiPlan = await buildProgramAA2Plan(api)
    const global = {
      ...api,
      pharmaSubprofilePrerequisites: [{ securityId: "pharma", state: "READY" as const, resolvedSubprofile: "GLOBAL_GENERICS" as const, assignmentState: "REVIEWED" as const, contractVersion: "GLOBAL_GENERICS_V1" }],
    }
    const globalPlan = await buildProgramAA2Plan(global)
    expect(globalPlan.planId).not.toBe(apiPlan.planId)
    expect(globalPlan.actions.find((action) => action.stage === "A2B")).toMatchObject({
      resolvedSubprofile: "GLOBAL_GENERICS", subprofileContractVersion: "GLOBAL_GENERICS_V1",
      methodologyVersion: PHARMA_GATE_J_METHOD_AUTHORITIES.GLOBAL_GENERICS.methodologyVersion,
    })

    const mismatchedContract = { ...api, pharmaSubprofilePrerequisites: [{ ...api.pharmaSubprofilePrerequisites[0]!, state: "CONTRACT_VERSION_MISMATCH" as const, resolvedSubprofile: null, contractVersion: null }] }
    const blocked = await buildProgramAA2Plan(mismatchedContract)
    expect(blocked.planId).not.toBe(apiPlan.planId)
    expect(blocked.actions.some((action) => action.stage === "A2B")).toBe(false)
  })

  it("blocks missing Pharma authority before dispatch and never promotes provisional candidates", async () => {
    const ready = materialized()
    const validPlan = await buildProgramAA2Plan(ready)
    const invalidActions = validPlan.actions.map((action) => action.stage === "A2B"
      ? { ...action, resolvedSubprofile: null, subprofileAssignmentState: null, subprofileContractVersion: null, methodologyVersion: null }
      : action)
    const malformed = { ...validPlan, actions: invalidActions }
    const dispatch = vi.fn()
    await expect(executeProgramAA2Plan({ approvedPlan: malformed, currentPlan: malformed, confirmationToken: malformed.confirmationToken, localSupabaseUrl: "http://127.0.0.1:54321", executeAction: dispatch })).resolves.toMatchObject({ status: "REFUSED", stopReason: "PHARMA_SUBPROFILE_PREREQUISITE_MISSING", actualCalls: { TRENDLYNE_MCP: 0, ANGEL_ONE: 0 } })
    expect(dispatch).not.toHaveBeenCalled()

    for (const symbol of ["BIOCON", "SYNGENE"] as const) {
      expect(PHARMA_SUBPROFILE_CANDIDATE_REGISTRY.some((candidate) => candidate.symbol === symbol && candidate.reviewState === "PROVISIONAL")).toBe(true)
      const base = materialized()
      const candidateOnly = {
        ...base,
        pharmaSubprofilePrerequisites: [{ securityId: "pharma", state: "MISSING_ASSIGNMENT" as const, resolvedSubprofile: null, assignmentState: null, contractVersion: null }],
        baseline: {
          ...base.baseline,
          eligibility: base.baseline.eligibility.map((row) => row.securityId === "pharma" ? { ...row, symbol } : row),
          r3Coverage: base.baseline.r3Coverage.map((row) => row.securityId === "pharma" ? { ...row, symbol } : row),
        },
      }
      expect((await buildProgramAA2Plan(candidateOnly)).actions.some((action) => action.stage === "A2B")).toBe(false)
    }
  })

  it("preserves non-Pharma A2B selection without Pharma bindings", async () => {
    const base = materialized()
    const nonPharma = {
      ...base,
      pharmaSubprofilePrerequisites: [],
      baseline: {
        ...base.baseline,
        eligibility: base.baseline.eligibility.map((row) => row.securityId === "pharma" ? { ...row, symbol: "INFY", canonicalSector: "Information Technology", canonicalIndustry: "IT Services", researchProfileCode: "IT_TECH", researchSubprofileCode: "IT_SERVICES", scoringExecutionState: "PENDING_ADAPTER" as const } : row),
        r3Coverage: base.baseline.r3Coverage.map((row) => row.securityId === "pharma" ? { ...row, symbol: "INFY", profileCode: "IT_TECH" } : row),
      },
    }
    const action = (await buildProgramAA2Plan(nonPharma)).actions.find((item) => item.stage === "A2B")
    expect(action).toMatchObject({ symbol: "INFY", researchProfileCode: "IT_TECH", resolvedSubprofile: null, subprofileAssignmentState: null, subprofileContractVersion: null, methodologyVersion: null, estimatedPhysicalCalls: 4 })
  })

  it("refuses non-local execution and stale plans before dispatch", async () => {
    const plan = await buildProgramAA2Plan(materialized())
    const dispatch = vi.fn()
    await expect(executeProgramAA2Plan({ approvedPlan: plan, currentPlan: plan, confirmationToken: plan.confirmationToken, localSupabaseUrl: "https://production.example.com", executeAction: dispatch })).resolves.toMatchObject({ status: "REFUSED", stopReason: "UNEXPECTED_PRODUCTION_DB_TARGET" })
    const changed = { ...plan, planId: "changed" }
    await expect(executeProgramAA2Plan({ approvedPlan: plan, currentPlan: changed, confirmationToken: plan.confirmationToken, localSupabaseUrl: "http://127.0.0.1:54321", executeAction: dispatch })).resolves.toMatchObject({ status: "REFUSED", stopReason: "STALE_PLAN_REPLAN_REQUIRED" })
    expect(dispatch).not.toHaveBeenCalled()
  })

  it("binds canonical ISIN readiness into the plan and fails closed before provider dispatch", async () => {
    const ready = materialized()
    const plan = await buildProgramAA2Plan(ready)
    expect(plan.actions.filter((action) => action.stage === "A2A").every((action) => action.identityPrerequisiteState === "READY" && action.canonicalName && action.canonicalIsin)).toBe(true)

    const changedIsin = { ...ready, classificationIdentities: ready.classificationIdentities.map((identity, index) => index === 0 ? { ...identity, canonicalIsin: "INE999999999" } : identity) }
    expect((await buildProgramAA2Plan(changedIsin)).planId).not.toBe(plan.planId)

    const changedName = { ...ready, classificationIdentities: ready.classificationIdentities.map((identity, index) => index === 0 ? { ...identity, canonicalName: "Changed Name Limited" } : identity) }
    expect((await buildProgramAA2Plan(changedName)).planId).not.toBe(plan.planId)

    const missingIdentity = { ...ready, classificationIdentities: ready.classificationIdentities.map((identity, index) => index === 0 ? { ...identity, canonicalIsin: null, state: "MISSING" as const } : identity) }
    const blockedPlan = await buildProgramAA2Plan(missingIdentity)
    expect(blockedPlan.planId).not.toBe(plan.planId)
    const dispatch = vi.fn()
    await expect(executeProgramAA2Plan({ approvedPlan: blockedPlan, currentPlan: blockedPlan, confirmationToken: blockedPlan.confirmationToken, localSupabaseUrl: "http://127.0.0.1:54321", executeAction: dispatch })).resolves.toMatchObject({ status: "REFUSED", stopReason: "CLASSIFICATION_IDENTITY_PREREQUISITE_MISSING" })
    expect(dispatch).not.toHaveBeenCalled()
  })

  it("requires exact confirmation and stops on the first provider-control failure without retry", async () => {
    const plan = await buildProgramAA2Plan(materialized())
    const dispatch = vi.fn().mockRejectedValue(new Error("LEASE_ACQUIRE_FAILED"))
    const denied = await executeProgramAA2Plan({ approvedPlan: plan, currentPlan: plan, confirmationToken: "wrong", localSupabaseUrl: "http://localhost:54321", executeAction: dispatch })
    expect(denied).toMatchObject({ status: "REFUSED", stopReason: "AUTH_OR_CONFIG_ERROR", retries: 0 })
    const stopped = await executeProgramAA2Plan({ approvedPlan: plan, currentPlan: plan, confirmationToken: plan.confirmationToken, localSupabaseUrl: "http://localhost:54321", executeAction: dispatch })
    expect(stopped).toMatchObject({ status: "PARTIAL_STOPPED", stopReason: "LEASE_CONFLICT", retries: 0, scoreWrites: 0, recommendationWrites: 0, sizingWrites: 0 })
    expect(dispatch).toHaveBeenCalledTimes(1)
  })

  it("stops when an adapter reports calls above its approved action budget", async () => {
    const plan = await buildProgramAA2Plan(materialized())
    const result = await executeProgramAA2Plan({ approvedPlan: plan, currentPlan: plan, confirmationToken: plan.confirmationToken, localSupabaseUrl: "http://127.0.0.1:54321", executeAction: (action) => Promise.resolve({ providerCalls: action.estimatedPhysicalCalls + 1, localWrites: 0 }) })
    expect(result).toMatchObject({ status: "PARTIAL_STOPPED", stopReason: "CALL_BUDGET_EXCEEDED", retries: 0 })
  })

  it("retains successful evidence writes reported with a fail-closed stop", async () => {
    const plan = await buildProgramAA2Plan(materialized())
    const error = Object.assign(new Error("CLASSIFICATION_CONFLICT"), { providerCalls: 1, localWrites: 1 })
    const result = await executeProgramAA2Plan({ approvedPlan: plan, currentPlan: plan, confirmationToken: plan.confirmationToken, localSupabaseUrl: "http://127.0.0.1:54321", executeAction: () => Promise.reject(error) })
    expect(result).toMatchObject({ status: "PARTIAL_STOPPED", successfulLocalWrites: 1, stopReason: "CLASSIFICATION_CONFLICT" })
  })

  it("re-materializes between stages and requires a new approval after classification changes", async () => {
    const plan = await buildProgramAA2Plan(materialized())
    const dispatch = vi.fn((action: { estimatedPhysicalCalls: number }) => Promise.resolve({ providerCalls: action.estimatedPhysicalCalls, localWrites: 1 }))
    const result = await executeProgramAA2Plan({
      approvedPlan: plan, currentPlan: plan, confirmationToken: plan.confirmationToken,
      localSupabaseUrl: "http://127.0.0.1:54321", executeAction: dispatch,
      reloadCurrentPlan: () => Promise.resolve({ ...plan, planId: "post-classification-cache-state" }),
    })
    expect(dispatch).toHaveBeenCalledTimes(5)
    expect(result).toMatchObject({ status: "PARTIAL_STOPPED", stopReason: "STALE_PLAN_REPLAN_REQUIRED", actualCalls: { TRENDLYNE_MCP: 5, ANGEL_ONE: 0 } })
  })

  it("preserves safe provider and classification prerequisite codes", async () => {
    const plan = await buildProgramAA2Plan(materialized())
    for (const code of ["PROVIDER_HTTP_403", "PROVIDER_REMOTE_1007", "CLASSIFICATION_IDENTITY_PREREQUISITE_MISSING"] as const) {
      const error = Object.assign(new Error(code), { providerCalls: code.startsWith("PROVIDER_") ? 1 : 0 })
      const result = await executeProgramAA2Plan({ approvedPlan: plan, currentPlan: plan, confirmationToken: plan.confirmationToken, localSupabaseUrl: "http://127.0.0.1:54321", executeAction: () => Promise.reject(error) })
      expect(result).toMatchObject({ status: "PARTIAL_STOPPED", stopReason: code })
    }
  })
})
