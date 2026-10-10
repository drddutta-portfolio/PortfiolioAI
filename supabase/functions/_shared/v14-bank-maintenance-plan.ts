/**
 * V1-4 bank maintenance: read-only orchestration decisions.
 * The exchange calendar and freshness policy must be supplied by established
 * canonical authorities. This module never admits evidence or calculates READY.
 * No provider calls, database writes, timers or scheduler activation.
 */
export type BankMaintenanceReason =
  | "CALENDAR_UNVERIFIED" | "SESSION_UNPUBLISHED" | "NO_MISSING_SESSIONS"
  | "MISSING_QUALIFIED_SESSIONS" | "EVIDENCE_EXPIRED"
  | "EVIDENCE_EXPIRY_UNPROVEN" | "REVIEW_PENDING"
  | "PROVIDER_UNAVAILABLE" | "BUDGET_UNAVAILABLE" | "IN_FLIGHT"

export interface BankMaintenanceInput {
  readonly securityIds: readonly string[]
  readonly benchmarkCode: "NIFTY_BANK"
  /** Verified finished exchange sessions within requested tail; no calendar inference. */
  readonly completedSessions: readonly string[]
  readonly calendarVerified: boolean
  /** Explicit provider-close publication eligibility, determined externally. */
  readonly publicationReady: boolean
  readonly stockSessions: Readonly<Record<string, readonly string[]>>
  readonly benchmarkSessions: readonly string[]
  /** Exact canonical evidence expiry instants by security; null = not proven. */
  readonly requiredEvidenceFreshUntil: Readonly<Record<string, string | null>>
  readonly pendingReviewSecurityIds: readonly string[]
  readonly inFlightSecurityIds: readonly string[]
  readonly providerAvailable: boolean
  readonly budgetAvailable: boolean
  readonly evaluationAsOf: string
}

export interface BankMaintenanceDecision {
  readonly securityId: string
  readonly acquireStockSessions: readonly string[]
  readonly expiredOrUnproven: boolean
  readonly reviewPending: boolean
  readonly evaluationRequired: boolean
  /** A separate current-ready system is forbidden: this is only a safety veto. */
  readonly mustNotDisplayCurrentReady: boolean
  readonly reasons: readonly BankMaintenanceReason[]
}
export interface BankMaintenancePlan {
  readonly executionAllowed: false
  readonly stockDecisions: readonly BankMaintenanceDecision[]
  readonly missingBenchmarkSessions: readonly string[]
  readonly benchmarkFetchCount: 0 | 1
  readonly safeToAcquire: boolean
  readonly failureReasons: readonly BankMaintenanceReason[]
  /** Owner-approved upper bound, not authority to execute provider calls. */
  readonly boundedStockRequestCount: number
  readonly boundedTotalRequestCount: number
  readonly requiresManualCanary: true
}

const validDate = (v: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v + "T00:00:00Z")) &&
  new Date(v + "T00:00:00Z").toISOString().slice(0, 10) === v

const distinctSorted = (v: readonly string[]): string[] => [...new Set(v)].sort()

export function planBankMaintenance(input: BankMaintenanceInput): BankMaintenancePlan {
  if (input.benchmarkCode !== "NIFTY_BANK") throw new Error("BANK_BENCHMARK_IDENTITY_INVALID")
  if (!Number.isFinite(Date.parse(input.evaluationAsOf))) throw new Error("EVALUATION_CUTOFF_INVALID")
  if (!input.securityIds.length || input.securityIds.length > 13 ||
      new Set(input.securityIds).size !== input.securityIds.length ||
      input.securityIds.some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
    throw new Error("BANK_SECURITY_SCOPE_INVALID")
  }
  const sessions = distinctSorted(input.completedSessions)
  if (sessions.some(s => !validDate(s))) throw new Error("EXCHANGE_SESSIONS_INVALID")
  for (const value of Object.values(input.stockSessions)) {
    if (value.some(s => !validDate(s))) throw new Error("STOCK_SESSIONS_INVALID")
  }
  if (input.benchmarkSessions.some(s => !validDate(s))) throw new Error("BENCHMARK_SESSIONS_INVALID")
  const failureReasons: BankMaintenanceReason[] = []
  if (!input.calendarVerified) failureReasons.push("CALENDAR_UNVERIFIED")
  if (!input.publicationReady) failureReasons.push("SESSION_UNPUBLISHED")
  if (!input.providerAvailable) failureReasons.push("PROVIDER_UNAVAILABLE")
  if (!input.budgetAvailable) failureReasons.push("BUDGET_UNAVAILABLE")
  const missingBenchmarkSessions = sessions.filter(s => !input.benchmarkSessions.includes(s))
  const reviewIds = new Set(input.pendingReviewSecurityIds)
  const inFlightIds = new Set(input.inFlightSecurityIds)
  const now = Date.parse(input.evaluationAsOf)
  const stockDecisions = input.securityIds.map((securityId): BankMaintenanceDecision => {
    const missing = sessions.filter(s => !(input.stockSessions[securityId] ?? []).includes(s))
    const until = input.requiredEvidenceFreshUntil[securityId]
    const expiryUnproven = until == null || !Number.isFinite(Date.parse(until))
    const expired = !expiryUnproven && Date.parse(until) < now
    const reviewPending = reviewIds.has(securityId)
    const reasons: BankMaintenanceReason[] = []
    if (expiryUnproven) reasons.push("EVIDENCE_EXPIRY_UNPROVEN")
    if (expired) reasons.push("EVIDENCE_EXPIRED")
    if (reviewPending) reasons.push("REVIEW_PENDING")
    if (inFlightIds.has(securityId)) reasons.push("IN_FLIGHT")
    if (missing.length) reasons.push("MISSING_QUALIFIED_SESSIONS")
    if (reasons.length === 0) reasons.push("NO_MISSING_SESSIONS")
    return {
      securityId,
      acquireStockSessions: missing,
      expiredOrUnproven: expired || expiryUnproven,
      reviewPending,
      evaluationRequired: expired || expiryUnproven || reviewPending || missing.length > 0,
      mustNotDisplayCurrentReady: expired || expiryUnproven || reviewPending || missing.length > 0 || missingBenchmarkSessions.length > 0 || !input.calendarVerified,
      reasons,
    }
  })
  const boundedStockRequestCount=stockDecisions.filter(d=>d.acquireStockSessions.length>0).length
  const boundedTotalRequestCount=boundedStockRequestCount+(missingBenchmarkSessions.length>0?1:0)
  const requestedSessions=new Set([...missingBenchmarkSessions,...stockDecisions.flatMap(d=>d.acquireStockSessions)])
  if(requestedSessions.size>1)failureReasons.push("BUDGET_UNAVAILABLE")
  if(boundedTotalRequestCount>14)failureReasons.push("BUDGET_UNAVAILABLE")
  return {
    executionAllowed: false,
    boundedStockRequestCount,
    boundedTotalRequestCount,
    requiresManualCanary:true,
    stockDecisions,
    missingBenchmarkSessions,
    benchmarkFetchCount: missingBenchmarkSessions.length ? 1 : 0,
    safeToAcquire:failureReasons.length===0,
    failureReasons,
  }
}
