import type { ProgramAA1MaterializedResult } from "./programAA1CacheMaterializer"
import { PHARMA_GATE_J_METHOD_AUTHORITIES } from "./pharmaGateJFinalPortability"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import type { PharmaSubprofileCode, ResearchSubprofileAssignmentState } from "./pharmaSubprofileAssignment"

export const PROGRAM_A_A2_PLAN_VERSION = "PROGRAM_A_A2_BOUNDED_PILOT_V12" as const
export const PROGRAM_A_A2_STOP_CONDITIONS = [
  "CLASSIFICATION_CONFLICT", "AMBIGUOUS_PROVIDER_IDENTITY", "AUTH_OR_CONFIG_ERROR",
  "PROVIDER_SCHEMA_MISMATCH", "CAPABILITY_MISMATCH", "CALL_BUDGET_EXCEEDED",
  "UNEXPECTED_PRODUCTION_DB_TARGET", "STALE_PLAN_REPLAN_REQUIRED", "LEASE_CONFLICT",
  "UNSUPPORTED_PROVIDER_ENDPOINT", "SCORING_RECOMMENDATION_SIZING_ACTIVATION_ATTEMPT",
  "PHARMA_SUBPROFILE_PREREQUISITE_MISSING",
  "EXECUTION_STAGE_AUTHORITY_MISSING", "EXECUTION_STAGE_AUTHORITY_INVALID",
  "APPROVED_STAGE_HAS_NO_ACTIONS",
  "TRENDLYNE_IDENTITY_PREREQUISITE_MISSING", "BLOCKED_IDENTITY_CONFLICT",
] as const

export type ProgramAA2Stage = "A2A" | "A2B" | "A2C"
export type ProgramAA2Provider = "TRENDLYNE_MCP" | "ANGEL_ONE"
export type ProgramAA2StopReason = typeof PROGRAM_A_A2_STOP_CONDITIONS[number]
  | "PROVIDER_NETWORK_ERROR" | "PROVIDER_PROTOCOL_ERROR" | "PROVIDER_REQUEST_FAILED"
  | "NO_EXACT_PROVIDER_IDENTITY" | "CLASSIFICATION_MISSING" | "CLASSIFICATION_IDENTITY_PREREQUISITE_MISSING"
  | "PHARMA_SUBPROFILE_PREREQUISITE_MISSING"
  | `PROVIDER_HTTP_${number}` | `PROVIDER_REMOTE_${number}`

export interface ProgramAA2Action {
  readonly stage: ProgramAA2Stage
  readonly provider: ProgramAA2Provider
  readonly capability: "SEARCH_ENTITIES_CLASSIFICATION" | "COMPLETE_RESEARCH_REFRESH" | "SECURITY_HISTORY" | "BANK_BENCHMARK_HISTORY" | "PHARMA_BENCHMARK_HISTORY"
  readonly securityId: string
  readonly symbol: string
  readonly canonicalName: string | null
  readonly canonicalIsin: string | null
  readonly identityPrerequisiteState: "READY" | "MISSING" | null
  readonly providerIdentityState: "VERIFIED_EXISTING_IDENTITY" | "VERIFIED_DURING_PREREQUISITE_DISCOVERY" | "IDENTITY_DISCOVERY_REQUIRED" | "BLOCKED_IDENTITY_CONFLICT" | null
  readonly providerInstrumentId: string | null
  readonly researchProfileCode: string | null
  readonly resolvedSubprofile: PharmaSubprofileCode | null
  readonly subprofileAssignmentState: ResearchSubprofileAssignmentState | null
  readonly subprofileContractVersion: string | null
  readonly methodologyVersion: string | null
  readonly selectionReason: string
  readonly domains: readonly string[]
  readonly historyWindow: { readonly from: string; readonly to: string } | null
  readonly estimatedPhysicalCalls: number
  readonly maxRetries: 1
}

export interface ProgramAA2Plan {
  readonly version: typeof PROGRAM_A_A2_PLAN_VERSION
  readonly planId: string
  readonly baselineVersion: string
  readonly asOfDate: string
  readonly actions: readonly ProgramAA2Action[]
  readonly providerTotals: { readonly trendlyne: number; readonly angelOneSecurity: number; readonly angelOneBenchmark: number; readonly angelOneTotal: number }
  readonly ceilings: { readonly a2aTrendlyne: 5; readonly a2bTrendlyne: 6; readonly combinedTrendlyne: 11; readonly angelOneSecurity: 3; readonly angelOneBenchmark: 2; readonly angelOneTotal: 5 }
  readonly stopConditions: typeof PROGRAM_A_A2_STOP_CONDITIONS
  readonly confirmationToken: string
  readonly actualProviderCalls: 0
  readonly actualBudgetConsumed: 0
}

export interface ProgramAA2ExecutionResult {
  readonly approvedPlanId: string
  readonly status: "SUCCEEDED" | "PARTIAL_STOPPED" | "REFUSED"
  readonly actualCalls: Readonly<Record<ProgramAA2Provider, number>>
  readonly retries: number
  readonly successfulLocalWrites: number
  readonly failures: readonly { readonly symbol: string; readonly code: string }[]
  readonly stopReason: ProgramAA2StopReason | null
  readonly providerBudgetUsed: number
  readonly postExecutionA1Summary: { readonly totalHoldings: number; readonly eligible: number; readonly reviewRequired: number; readonly methodologyUnavailable: number } | null
  readonly scoreWrites: 0
  readonly recommendationWrites: 0
  readonly sizingWrites: 0
}

const CEILINGS = { a2aTrendlyne: 5, a2bTrendlyne: 6, combinedTrendlyne: 11, angelOneSecurity: 3, angelOneBenchmark: 2, angelOneTotal: 5 } as const

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`).join(",")}}`
  return JSON.stringify(value)
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function assertCeilings(actions: readonly ProgramAA2Action[]) {
  const a2a = actions.filter((action) => action.stage === "A2A").reduce((sum, action) => sum + action.estimatedPhysicalCalls, 0)
  const a2b = actions.filter((action) => action.stage === "A2B").reduce((sum, action) => sum + action.estimatedPhysicalCalls, 0)
  const security = actions.filter((action) => action.capability === "SECURITY_HISTORY").reduce((sum, action) => sum + action.estimatedPhysicalCalls, 0)
  const benchmark = actions.filter((action) => action.capability.endsWith("BENCHMARK_HISTORY")).reduce((sum, action) => sum + action.estimatedPhysicalCalls, 0)
  if (a2a > CEILINGS.a2aTrendlyne || a2b > CEILINGS.a2bTrendlyne || a2a + a2b > CEILINGS.combinedTrendlyne || security > CEILINGS.angelOneSecurity || benchmark > CEILINGS.angelOneBenchmark || security + benchmark > CEILINGS.angelOneTotal) throw new Error("CALL_BUDGET_EXCEEDED")
  return { trendlyne: a2a + a2b, angelOneSecurity: security, angelOneBenchmark: benchmark, angelOneTotal: security + benchmark }
}

export async function buildProgramAA2Plan(materialized: ProgramAA1MaterializedResult): Promise<ProgramAA2Plan> {
  const baseline = materialized.baseline
  const classificationIdentityBySecurity = new Map(materialized.classificationIdentities.map((identity) => [identity.securityId, identity]))
  const trendlyneIdentityBySecurity = new Map(materialized.trendlyneIdentities.map((identity) => [identity.securityId, identity]))
  const pharmaPrerequisiteBySecurity = new Map(materialized.pharmaSubprofilePrerequisites.map((item) => [item.securityId, item]))
  const classification = baseline.eligibility
    .filter((row) => row.eligibilityState === "REVIEW_REQUIRED")
    .sort((a, b) => a.symbol.localeCompare(b.symbol)).slice(0, CEILINGS.a2aTrendlyne)
    .map((row): ProgramAA2Action => {
      const identity = classificationIdentityBySecurity.get(row.securityId)
      return { stage: "A2A", provider: "TRENDLYNE_MCP", capability: "SEARCH_ENTITIES_CLASSIFICATION", securityId: row.securityId, symbol: row.symbol, canonicalName: identity?.canonicalName ?? null, canonicalIsin: identity?.canonicalIsin ?? null, identityPrerequisiteState: identity?.state ?? "MISSING", providerIdentityState: null, providerInstrumentId: null, researchProfileCode: row.researchProfileCode, resolvedSubprofile: null, subprofileAssignmentState: null, subprofileContractVersion: null, methodologyVersion: null, selectionReason: row.reasonCode, domains: ["CLASSIFICATION"], historyWindow: null, estimatedPhysicalCalls: 1, maxRetries: 1 }
    })

  const eligible = [...baseline.eligibility].filter((row) => row.eligibilityState === "ELIGIBLE")
    .sort((a, b) => Number(b.portfolioWeightPercent ?? 0) - Number(a.portfolioWeightPercent ?? 0) || a.symbol.localeCompare(b.symbol))
  const r3: ProgramAA2Action[] = []
  for (const row of eligible) {
    const domains = baseline.r3Coverage.filter((domain) => domain.securityId === row.securityId && ["MISSING", "STALE"].includes(domain.state) && ["FUNDAMENTALS", "OWNERSHIP", "VALUATION", "DOCUMENTS"].includes(domain.domain)).map((domain) => domain.domain)
    if (!domains.length) continue
    const pharmaPrerequisite = row.researchProfileCode === "PHARMA_V1" ? pharmaPrerequisiteBySecurity.get(row.securityId) : null
    if (row.researchProfileCode === "PHARMA_V1" && (!pharmaPrerequisite || pharmaPrerequisite.state !== "READY" || !pharmaPrerequisite.resolvedSubprofile || pharmaPrerequisite.assignmentState !== "REVIEWED" || !pharmaPrerequisite.contractVersion)) continue
    const methodologyVersion = pharmaPrerequisite?.resolvedSubprofile
      ? PHARMA_GATE_J_METHOD_AUTHORITIES[pharmaPrerequisite.resolvedSubprofile].methodologyVersion
      : null
    const providerIdentity = trendlyneIdentityBySecurity.get(row.securityId)
    if (!providerIdentity || providerIdentity.state === "BLOCKED_IDENTITY_CONFLICT") continue
    const estimatedPhysicalCalls = providerIdentity.state === "IDENTITY_DISCOVERY_REQUIRED" ? 6 : 4
    if (r3.reduce((sum, action) => sum + action.estimatedPhysicalCalls, 0) + estimatedPhysicalCalls > CEILINGS.a2bTrendlyne) break
    const canonicalIdentity = classificationIdentityBySecurity.get(row.securityId)
    r3.push({ stage: "A2B", provider: "TRENDLYNE_MCP", capability: "COMPLETE_RESEARCH_REFRESH", securityId: row.securityId, symbol: row.symbol, canonicalName: canonicalIdentity?.canonicalName ?? null, canonicalIsin: canonicalIdentity?.canonicalIsin ?? null, identityPrerequisiteState: canonicalIdentity?.state ?? "MISSING", providerIdentityState: providerIdentity.state, providerInstrumentId: providerIdentity.providerInstrumentId, researchProfileCode: row.researchProfileCode, resolvedSubprofile: pharmaPrerequisite?.resolvedSubprofile ?? null, subprofileAssignmentState: pharmaPrerequisite?.assignmentState ?? null, subprofileContractVersion: pharmaPrerequisite?.contractVersion ?? null, methodologyVersion, selectionReason: pharmaPrerequisite ? "REVIEWED_PHARMA_SUBPROFILE_STALE_OR_MISSING_EVIDENCE" : row.scoringExecutionState === "PENDING_ADAPTER" ? "NON_PHARMA_K4_STALE_OR_MISSING_EVIDENCE" : "DETERMINISTIC_ELIGIBLE_STALE_OR_MISSING_EVIDENCE", domains, historyWindow: null, estimatedPhysicalCalls, maxRetries: 1 })
    if (r3.length === 3) break
  }

  const r5: ProgramAA2Action[] = []
  for (const row of baseline.r5Coverage.filter((item) => item.missingWindow && item.missingWindow.mode !== "NONE").sort((a, b) => a.symbol.localeCompare(b.symbol)).slice(0, 3)) {
    const window = row.missingWindow!
    r5.push({ stage: "A2C", provider: "ANGEL_ONE", capability: "SECURITY_HISTORY", securityId: row.securityId, symbol: row.symbol, canonicalName: null, canonicalIsin: null, identityPrerequisiteState: null, providerIdentityState: null, providerInstrumentId: null, researchProfileCode: row.profileCode, resolvedSubprofile: null, subprofileAssignmentState: null, subprofileContractVersion: null, methodologyVersion: null, selectionReason: window.mode === "INCREMENTAL" ? "PARTIAL_HISTORY" : "FULL_BACKFILL", domains: ["MARKET_HISTORY"], historyWindow: { from: window.requestStartDate!, to: window.requestEndDate! }, estimatedPhysicalCalls: window.estimatedProviderCalls, maxRetries: 1 })
    if (row.benchmarkCode && row.benchmarkReadiness === "MISSING" && r5.filter((action) => action.capability.endsWith("BENCHMARK_HISTORY")).length < 2) {
      const capability = row.benchmarkCode === "NIFTY_BANK" ? "BANK_BENCHMARK_HISTORY" : row.benchmarkCode === "NIFTY_PHARMA" ? "PHARMA_BENCHMARK_HISTORY" : null
      if (capability) r5.push({ stage: "A2C", provider: "ANGEL_ONE", capability, securityId: row.securityId, symbol: row.symbol, canonicalName: null, canonicalIsin: null, identityPrerequisiteState: null, providerIdentityState: null, providerInstrumentId: null, researchProfileCode: row.profileCode, resolvedSubprofile: null, subprofileAssignmentState: null, subprofileContractVersion: null, methodologyVersion: null, selectionReason: "IMPLEMENTED_BENCHMARK_HISTORY_MISSING", domains: [row.benchmarkCode], historyWindow: { from: window.requiredStartDate, to: baseline.asOfDate }, estimatedPhysicalCalls: 1, maxRetries: 1 })
    }
  }
  const actions = [...classification, ...r3, ...r5]
  const providerTotals = assertCeilings(actions)
  const fingerprint = { version: PROGRAM_A_A2_PLAN_VERSION, baselineVersion: baseline.version, asOfDate: baseline.asOfDate, eligibility: baseline.eligibility, r3: baseline.r3Coverage, r5: baseline.r5Coverage, actions, providerTotals, ceilings: CEILINGS }
  const planId = await sha256(stable(fingerprint))
  return { version: PROGRAM_A_A2_PLAN_VERSION, planId, baselineVersion: baseline.version, asOfDate: baseline.asOfDate, actions, providerTotals, ceilings: CEILINGS, stopConditions: PROGRAM_A_A2_STOP_CONDITIONS, confirmationToken: `APPROVE_PROGRAM_A_A2_${planId.slice(0, 16).toUpperCase()}`, actualProviderCalls: 0, actualBudgetConsumed: 0 }
}

export function assertLocalA2Target(url: string) {
  const parsed = new URL(url)
  if (!["localhost", "127.0.0.1"].includes(parsed.hostname) || !["54321", "54322"].includes(parsed.port)) throw new Error("UNEXPECTED_PRODUCTION_DB_TARGET")
}

function pharmaA2BPrerequisiteReady(action: ProgramAA2Action) {
  if (action.stage !== "A2B" || action.researchProfileCode !== "PHARMA_V1") return true
  if (!action.resolvedSubprofile || action.subprofileAssignmentState !== "REVIEWED") return false
  return action.subprofileContractVersion === PHARMA_SUBPROFILE_CONTRACTS[action.resolvedSubprofile].contractVersion
    && action.methodologyVersion === PHARMA_GATE_J_METHOD_AUTHORITIES[action.resolvedSubprofile].methodologyVersion
}

export async function executeProgramAA2Plan(input: {
  readonly approvedPlan: ProgramAA2Plan
  readonly currentPlan: ProgramAA2Plan
  readonly approvedStage: ProgramAA2Stage | null
  readonly confirmationToken: string
  readonly localSupabaseUrl: string
  readonly executeAction: (action: ProgramAA2Action) => Promise<{ readonly providerCalls: number; readonly localWrites: number }>
  readonly loadPostExecutionA1Summary?: () => Promise<ProgramAA2ExecutionResult["postExecutionA1Summary"]>
}): Promise<ProgramAA2ExecutionResult> {
  try { assertLocalA2Target(input.localSupabaseUrl) } catch { return refused(input.approvedPlan.planId, "UNEXPECTED_PRODUCTION_DB_TARGET") }
  if (input.approvedPlan.planId !== input.currentPlan.planId) return refused(input.approvedPlan.planId, "STALE_PLAN_REPLAN_REQUIRED")
  if (input.approvedStage === null || input.approvedStage === undefined) return refused(input.approvedPlan.planId, "EXECUTION_STAGE_AUTHORITY_MISSING")
  if (!["A2A", "A2B", "A2C"].includes(input.approvedStage)) return refused(input.approvedPlan.planId, "EXECUTION_STAGE_AUTHORITY_INVALID")
  if (input.confirmationToken !== input.approvedPlan.confirmationToken) return refused(input.approvedPlan.planId, "AUTH_OR_CONFIG_ERROR")
  const approvedActions = input.currentPlan.actions.filter((action) => action.stage === input.approvedStage)
  if (!approvedActions.length) return refused(input.approvedPlan.planId, "APPROVED_STAGE_HAS_NO_ACTIONS")
  if (approvedActions.some((action) => action.stage === "A2A" && (action.identityPrerequisiteState !== "READY" || !action.canonicalName || !action.canonicalIsin))) return refused(input.approvedPlan.planId, "CLASSIFICATION_IDENTITY_PREREQUISITE_MISSING")
  if (approvedActions.some((action) => !pharmaA2BPrerequisiteReady(action))) return refused(input.approvedPlan.planId, "PHARMA_SUBPROFILE_PREREQUISITE_MISSING")
  if (approvedActions.some((action) => action.stage === "A2B" && action.providerIdentityState === "BLOCKED_IDENTITY_CONFLICT")) return refused(input.approvedPlan.planId, "BLOCKED_IDENTITY_CONFLICT")
  if (approvedActions.some((action) => action.stage === "A2B" && (action.identityPrerequisiteState !== "READY" || !action.canonicalName || !action.canonicalIsin || !action.providerIdentityState || (action.providerIdentityState === "VERIFIED_EXISTING_IDENTITY" && !action.providerInstrumentId)))) return refused(input.approvedPlan.planId, "TRENDLYNE_IDENTITY_PREREQUISITE_MISSING")
  try { assertCeilings(input.currentPlan.actions) } catch { return refused(input.approvedPlan.planId, "CALL_BUDGET_EXCEEDED") }
  const calls: Record<ProgramAA2Provider, number> = { TRENDLYNE_MCP: 0, ANGEL_ONE: 0 }
  let writes = 0
  const failures: { symbol: string; code: string }[] = []
  for (const action of approvedActions) {
    try {
      const result = await input.executeAction(action)
      if (result.providerCalls > action.estimatedPhysicalCalls) return withPostSummary({ approvedPlanId: input.approvedPlan.planId, status: "PARTIAL_STOPPED", actualCalls: calls, retries: 0, successfulLocalWrites: writes, failures, stopReason: "CALL_BUDGET_EXCEEDED", providerBudgetUsed: calls.TRENDLYNE_MCP + calls.ANGEL_ONE, postExecutionA1Summary: null, scoreWrites: 0, recommendationWrites: 0, sizingWrites: 0 }, input.loadPostExecutionA1Summary)
      calls[action.provider] += result.providerCalls
      writes += result.localWrites
    } catch (error) {
      const code = error instanceof Error ? error.message : "CAPABILITY_MISMATCH"
      const attemptedCalls = error && typeof error === "object" && "providerCalls" in error && typeof error.providerCalls === "number" ? error.providerCalls : 0
      const completedWrites = error && typeof error === "object" && "localWrites" in error && typeof error.localWrites === "number" ? error.localWrites : 0
      calls[action.provider] += attemptedCalls
      writes += completedWrites
      failures.push({ symbol: action.symbol, code })
      return withPostSummary({ approvedPlanId: input.approvedPlan.planId, status: "PARTIAL_STOPPED", actualCalls: calls, retries: 0, successfulLocalWrites: writes, failures, stopReason: normalizeStop(code), providerBudgetUsed: calls.TRENDLYNE_MCP + calls.ANGEL_ONE, postExecutionA1Summary: null, scoreWrites: 0, recommendationWrites: 0, sizingWrites: 0 }, input.loadPostExecutionA1Summary)
    }
  }
  return withPostSummary({ approvedPlanId: input.approvedPlan.planId, status: "SUCCEEDED", actualCalls: calls, retries: 0, successfulLocalWrites: writes, failures, stopReason: null, providerBudgetUsed: calls.TRENDLYNE_MCP + calls.ANGEL_ONE, postExecutionA1Summary: null, scoreWrites: 0, recommendationWrites: 0, sizingWrites: 0 }, input.loadPostExecutionA1Summary)
}

function normalizeStop(code: string): ProgramAA2StopReason {
  if (PROGRAM_A_A2_STOP_CONDITIONS.includes(code as typeof PROGRAM_A_A2_STOP_CONDITIONS[number])) return code as ProgramAA2StopReason
  if (/^PROVIDER_(?:HTTP|REMOTE)_\d+$/u.test(code)) return code as ProgramAA2StopReason
  if (["PROVIDER_NETWORK_ERROR", "PROVIDER_PROTOCOL_ERROR", "PROVIDER_REQUEST_FAILED", "NO_EXACT_PROVIDER_IDENTITY", "CLASSIFICATION_MISSING", "CLASSIFICATION_IDENTITY_PREREQUISITE_MISSING", "PHARMA_SUBPROFILE_PREREQUISITE_MISSING", "TRENDLYNE_IDENTITY_PREREQUISITE_MISSING", "BLOCKED_IDENTITY_CONFLICT"].includes(code)) return code as ProgramAA2StopReason
  if (code.includes("LEASE") || code.includes("RATE_LIMITED")) return "LEASE_CONFLICT"
  if (code.includes("AMBIGUOUS") || code.includes("IDENTITY")) return "AMBIGUOUS_PROVIDER_IDENTITY"
  if (code.includes("SCHEMA")) return "PROVIDER_SCHEMA_MISMATCH"
  return "CAPABILITY_MISMATCH"
}

function refused(planId: string, stopReason: ProgramAA2StopReason): ProgramAA2ExecutionResult {
  return { approvedPlanId: planId, status: "REFUSED", actualCalls: { TRENDLYNE_MCP: 0, ANGEL_ONE: 0 }, retries: 0, successfulLocalWrites: 0, failures: [], stopReason, providerBudgetUsed: 0, postExecutionA1Summary: null, scoreWrites: 0, recommendationWrites: 0, sizingWrites: 0 }
}

async function withPostSummary(result: ProgramAA2ExecutionResult, loader: (() => Promise<ProgramAA2ExecutionResult["postExecutionA1Summary"]>) | undefined): Promise<ProgramAA2ExecutionResult> {
  if (!loader) return result
  try { return { ...result, postExecutionA1Summary: await loader() } } catch { return { ...result, status: "PARTIAL_STOPPED", stopReason: result.stopReason ?? "CAPABILITY_MISMATCH", failures: [...result.failures, { symbol: "POST_EXECUTION_A1", code: "POST_EXECUTION_BASELINE_FAILED" }] } }
}
