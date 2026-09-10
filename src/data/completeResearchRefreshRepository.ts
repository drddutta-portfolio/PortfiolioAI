import { supabase } from "../lib/supabase"

export interface CompleteResearchRefreshPlan {
  readonly mode: "COMPLETE_RESEARCH_REFRESH_PLAN"
  readonly providerCalls: number
  readonly security: string
  readonly company: string
  readonly providerInstrumentId: string
  readonly estimatedProviderCalls: number
  readonly dailyObservedUsage: number
  readonly projectedDailyUsage: number
  readonly dailyLimit: number
  readonly providerQuotaStatus: string
  readonly ingestionEnabled: boolean
  readonly executionAllowed: boolean
  readonly components: readonly { readonly domain: string; readonly calls: number }[]
  readonly note: string
}

export interface CompleteResearchRefreshResult {
  readonly mode: "COMPLETE_RESEARCH_REFRESH"
  readonly security: string
  readonly providerInstrumentId: string
  readonly providerCalls: number
  readonly providerSucceeded: number
  readonly providerFailed: number
  readonly releasedReservationUnits: number
  readonly status: "SUCCEEDED" | "PARTIAL" | "FAILED"
  readonly results: readonly Record<string, unknown>[]
  readonly runId: string
  readonly note: string
}

const invoke = async <T>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke("complete-research-refresh", { body })
  if (error) throw error
  if (!data || typeof data !== "object") throw new Error("Complete Research Refresh returned no result.")
  if ("error" in data && typeof data.error === "string") throw new Error(data.error)
  return data as T
}

export const planCompleteResearchRefresh = (portfolioId: string, securityId: string) =>
  invoke<CompleteResearchRefreshPlan>({ action: "PLAN", portfolioId, securityId })

export const executeCompleteResearchRefresh = (portfolioId: string, securityId: string) =>
  invoke<CompleteResearchRefreshResult>({
    action: "EXECUTE",
    portfolioId,
    securityId,
    confirmation: "OWNER_CONFIRMED_COMPLETE_RESEARCH_REFRESH",
  })
