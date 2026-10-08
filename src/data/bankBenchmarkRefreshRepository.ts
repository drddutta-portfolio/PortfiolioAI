import { supabase } from "../lib/supabase"

export interface BankBenchmarkRefreshPlan {
  readonly mode: "BANK_BENCHMARK_REFRESH_PLAN"
  readonly providerCalls: number
  readonly estimatedProviderCalls: number
  readonly benchmark: string
  readonly benchmarkCode: string
  readonly historyDays: number
  readonly latestBenchmarkCandle: string | null
  readonly stockHistoryObservations: number
  readonly metricAfterRefresh: "RELATIVE_STRENGTH_12M"
  readonly note: string
}

export interface BankBenchmarkRefreshResult {
  readonly mode: "BANK_BENCHMARK_REFRESH"
  readonly runId: string
  readonly providerCalls: number
  readonly benchmark: string
  readonly benchmarkCandlesStored: number
  readonly relativeStrength12M: number
  readonly stockReturn12M: number
  readonly benchmarkReturn12M: number
  readonly commonStart: string
  readonly commonEnd: string
  readonly note: string
}

async function edgeErrorMessage(error: unknown): Promise<string> {
  if (!error || typeof error !== "object") return "Bank benchmark refresh failed."
  const context = "context" in error ? (error as { readonly context?: unknown }).context : null
  if (context instanceof Response) {
    try {
      const payload = await context.clone().json() as { readonly error?: unknown; readonly code?: unknown }
      const message = typeof payload.error === "string" ? payload.error : "Bank benchmark refresh failed."
      const code = typeof payload.code === "string" ? payload.code : null
      return code ? `${message} [${code}]` : message
    } catch { /* fall through */ }
  }
  return "message" in error && typeof (error as { readonly message?: unknown }).message === "string"
    ? (error as { readonly message: string }).message
    : "Bank benchmark refresh failed."
}

const invoke = async <T>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke<unknown>("refresh-bank-benchmark", { body })
  if (error) throw new Error(await edgeErrorMessage(error))
  if (!data || typeof data !== "object") throw new Error("Bank benchmark refresh returned no result.")
  if ("error" in data && typeof data.error === "string") {
    const code = "code" in data && typeof data.code === "string" ? ` [${data.code}]` : ""
    throw new Error(`${data.error}${code}`)
  }
  return data as T
}

export const planBankBenchmarkRefresh = (portfolioId: string, securityId: string) =>
  invoke<BankBenchmarkRefreshPlan>({ action: "PLAN", portfolioId, securityId })

export const executeBankBenchmarkRefresh = (portfolioId: string, securityId: string) =>
  invoke<BankBenchmarkRefreshResult>({
    action: "EXECUTE",
    portfolioId,
    securityId,
    confirmation: "OWNER_CONFIRMED_BANK_BENCHMARK_REFRESH",
  })
