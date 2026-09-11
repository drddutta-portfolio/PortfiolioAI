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

async function edgeErrorMessage(error: unknown): Promise<string> {
  if (!error || typeof error !== "object") return "Market history refresh failed."
  const context = "context" in error ? (error as { readonly context?: unknown }).context : null
  if (context instanceof Response) {
    try {
      const payload = await context.clone().json() as { readonly error?: unknown; readonly code?: unknown }
      const message = typeof payload.error === "string" ? payload.error : "Market history refresh failed."
      const code = typeof payload.code === "string" ? payload.code : null
      return code ? `${message} [${code}]` : message
    } catch {
      try {
        const text = await context.clone().text()
        if (text.trim()) return text.slice(0, 300)
      } catch {
        // Fall through to generic connector message.
      }
    }
  }
  if ("message" in error && typeof (error as { readonly message?: unknown }).message === "string") {
    return (error as { readonly message: string }).message
  }
  return "Market history refresh failed."
}

const invoke = async <T>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke("refresh-market-history", { body })
  if (error) throw new Error(await edgeErrorMessage(error))
  if (!data || typeof data !== "object") throw new Error("Market history refresh returned no result.")
  if ("error" in data && typeof data.error === "string") {
    const code = "code" in data && typeof data.code === "string" ? ` [${data.code}]` : ""
    throw new Error(`${data.error}${code}`)
  }
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
