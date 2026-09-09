import { supabase } from "../lib/supabase"
import type { CoverageDocument, CoverageIdentity, CoverageObservation } from "../features/research/researchCoverage"

export interface ResearchCoverageEvidence {
  readonly observations: readonly CoverageObservation[]
  readonly documents: readonly CoverageDocument[]
  readonly identities: readonly CoverageIdentity[]
  readonly enrichment: readonly { readonly securityId: string; readonly marketCapCategory: string | null }[]
}

export async function loadResearchCoverageEvidence(securityIds: readonly string[]): Promise<ResearchCoverageEvidence> {
  const ids = [...new Set(securityIds)]
  if (!ids.length) return { observations: [], documents: [], identities: [], enrichment: [] }

  const [observations, documents, identities, enrichment] = await Promise.all([
    supabase.from("fundamental_observations")
      .select("security_id,metric_code,evidence_status,fresh_until,retrieved_at")
      .in("security_id", ids),
    supabase.from("research_documents")
      .select("security_id,identity_status,created_at")
      .in("security_id", ids),
    supabase.from("security_identity_observations")
      .select("security_id,evidence_status,created_at")
      .eq("source_code", "TRENDLYNE_MCP")
      .in("security_id", ids),
    supabase.from("current_security_enrichment_v1")
      .select("security_id,market_cap_category")
      .in("security_id", ids),
  ])

  const failure = [observations, documents, identities, enrichment].find((result) => result.error)
  if (failure?.error) throw failure.error

  return {
    observations: (observations.data ?? []).map((row) => ({
      securityId: row.security_id,
      metricCode: row.metric_code,
      evidenceStatus: row.evidence_status,
      freshUntil: row.fresh_until,
      retrievedAt: row.retrieved_at,
    })),
    documents: (documents.data ?? []).map((row) => ({
      securityId: row.security_id,
      identityStatus: row.identity_status,
      createdAt: row.created_at,
    })),
    identities: (identities.data ?? []).flatMap((row) => row.security_id ? [{
      securityId: row.security_id,
      evidenceStatus: row.evidence_status,
      createdAt: row.created_at,
    }] : []),
    enrichment: (enrichment.data ?? []).flatMap((row) => row.security_id ? [{
      securityId: row.security_id,
      marketCapCategory: row.market_cap_category,
    }] : []),
  }
}

export interface ProviderOperationalSummary {
  readonly sourceCode: string
  readonly providerName: string
  readonly ingestionEnabled: boolean
  readonly schedulerEnabled: boolean
  readonly dailyInternalAttemptLimit: number
  readonly dailyObservedUsage: number
  readonly dailyRemaining: number
  readonly rollingInternalAttemptLimit: number
  readonly rollingObservedUsage: number
  readonly rollingRemaining: number
  readonly utilizationState: string
  readonly activeReservations: number
  readonly activeOrchestrations: number
  readonly lastSuccessfulRunAt: string | null
  readonly lastFailedRunAt: string | null
  readonly latestSafeError: string | null
  readonly actualProviderQuotaStatus: string
  readonly policyVersion: number
}

export async function loadProviderOperationalSummary(): Promise<ProviderOperationalSummary> {
  const result = await supabase.rpc("get_provider_operational_summary_v1", { p_source_code: "TRENDLYNE_MCP" })
  if (result.error) throw result.error
  const row = result.data?.[0]
  if (!row) throw new Error("Provider operational summary is unavailable.")
  return {
    sourceCode: row.source_code,
    providerName: row.provider_name,
    ingestionEnabled: row.ingestion_enabled,
    schedulerEnabled: row.scheduler_enabled,
    dailyInternalAttemptLimit: row.daily_internal_attempt_limit,
    dailyObservedUsage: row.daily_observed_usage,
    dailyRemaining: row.daily_remaining,
    rollingInternalAttemptLimit: row.rolling_internal_attempt_limit,
    rollingObservedUsage: row.rolling_observed_usage,
    rollingRemaining: row.rolling_remaining,
    utilizationState: row.utilization_state,
    activeReservations: row.active_reservations,
    activeOrchestrations: row.active_orchestrations,
    lastSuccessfulRunAt: row.last_successful_run_at,
    lastFailedRunAt: row.last_failed_run_at,
    latestSafeError: row.latest_safe_error,
    actualProviderQuotaStatus: row.actual_provider_quota_status,
    policyVersion: row.policy_version,
  }
}

export type RefreshPlanDomainState = "REQUIRED" | "SKIPPED_FRESH" | "NOT_APPROVED"
export interface ResearchRefreshPlanSecurity {
  readonly securityId: string
  readonly symbol: string
  readonly domains: Readonly<Record<"IDENTITY" | "FUNDAMENTALS" | "OWNERSHIP" | "DOCUMENTS", RefreshPlanDomainState>>
  readonly operations: readonly string[]
  readonly baseCalls: number
}
export interface ResearchRefreshPlanBatch {
  readonly batchNumber: number
  readonly baseCalls: number
  readonly retryReserve: number
  readonly reservedAttempts: number
}
export interface ResearchRefreshPlan {
  readonly selectedSecurityCount: number
  readonly plan: {
    readonly securities: readonly ResearchRefreshPlanSecurity[]
    readonly batches: readonly ResearchRefreshPlanBatch[]
    readonly baseCalls: number
    readonly retryReserve: number
    readonly worstCaseAttempts: number
  }
  readonly projectedDailyUsage: number
  readonly dailyRemaining: number
  readonly fitsDailyBudget: boolean
  readonly providerQuotaStatus: string
  readonly providerCalls: number
  readonly budgetConsumed: number
  readonly executionAllowed: false
  readonly executionGateReason: string
  readonly perRunInternalAttemptLimit: number
  readonly dailyInternalAttemptLimit: number
  readonly dailyObservedUsage: number
}

export async function estimateResearchRefresh(portfolioId: string, securityIds: readonly string[], documentSecurityIds: readonly string[] = []): Promise<ResearchRefreshPlan> {
  const result = await supabase.functions.invoke("plan-research-refresh", {
    body: { portfolioId, securityIds: [...new Set(securityIds)], documentSecurityIds: [...new Set(documentSecurityIds)], sourceCode: "TRENDLYNE_MCP" },
  })
  if (result.error) throw result.error
  if (!result.data || typeof result.data !== "object") throw new Error("Research refresh estimate is unavailable.")
  if ("error" in result.data && typeof result.data.error === "string") throw new Error(result.data.error)
  return result.data as ResearchRefreshPlan
}
