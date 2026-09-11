import { supabase } from "../lib/supabase"

export interface MarketHistoryRefreshPlan {
  readonly mode: "MARKET_HISTORY_REFRESH_PLAN"
  readonly providerCalls: number
  readonly security: string
  readonly company: string
  readonly provider: string
  readonly interval: "ONE_DAY"
  readonly historyDays: number
  readonly estimatedProviderCalls: number
  readonly latestExistingCandle: string | null
  readonly metricsAfterRefresh: readonly string[]
  readonly note: string
}

export interface MarketHistoryRefreshResult {
  readonly mode: "MARKET_HISTORY_REFRESH"
  readonly runId: string
  readonly security: string
  readonly providerCalls: number
  readonly candlesStored: number
  readonly historyStart: string
  readonly historyEnd: string
  readonly derivedMetrics: readonly { readonly code: string; readonly value: number; readonly unit: string }[]
  readonly note: string
}

const invoke = async <T>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke("refresh-market-history", { body })
  if (error) throw error
  if (!data || typeof data !== "object") throw new Error("Market history refresh returned no result.")
  if ("error" in data && typeof data.error === "string") throw new Error(data.error)
  return data as T
}

export const planMarketHistoryRefresh = (portfolioId: string, securityId: string) =>
  invoke<MarketHistoryRefreshPlan>({ action: "PLAN", portfolioId, securityId })

export const executeMarketHistoryRefresh = (portfolioId: string, securityId: string) =>
  invoke<MarketHistoryRefreshResult>({
    action: "EXECUTE",
    portfolioId,
    securityId,
    confirmation: "OWNER_CONFIRMED_MARKET_HISTORY_REFRESH",
  })
