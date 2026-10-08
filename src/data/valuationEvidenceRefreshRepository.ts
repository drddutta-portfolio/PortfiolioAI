import { asEdgeFunctionError, invokeEdgeFunction } from "../lib/edgeFunction"

export interface ValuationEvidenceRefreshPlan {
  readonly mode: "VALUATION_EVIDENCE_REFRESH_PLAN"
  readonly providerCalls: 0
  readonly security: string
  readonly providerInstrumentId: string
  readonly estimatedProviderCalls: number
  readonly dailyObservedUsage: number
  readonly projectedDailyUsage: number
  readonly dailyLimit: number
  readonly executionAllowed: boolean
  readonly latestValue: number | null
  readonly latestRetrievedAt: string | null
  readonly latestFreshUntil: string | null
  readonly latestEvidenceStatus: string | null
  readonly note: string
}

export interface ValuationEvidenceRefreshResult {
  readonly mode: "VALUATION_EVIDENCE_REFRESH"
  readonly security: string
  readonly metricCode: "PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT"
  readonly value: number
  readonly freshUntil: string
  readonly providerCalls: 1
  readonly providerSucceeded: 1
  readonly status: "SUCCEEDED"
  readonly runId: string
  readonly note: string
}

const invoke = async <T>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await invokeEdgeFunction("refresh-valuation-evidence", body)
  if (error) throw asEdgeFunctionError(error, "Valuation evidence refresh failed.")
  if (!data || typeof data !== "object") throw new Error("Valuation evidence refresh returned no result.")
  if ("error" in data && typeof data.error === "string") throw new Error(data.error)
  return data as T
}

export const planValuationEvidenceRefresh = (portfolioId: string, securityId: string) =>
  invoke<ValuationEvidenceRefreshPlan>({ action: "PLAN", portfolioId, securityId })

export const executeValuationEvidenceRefresh = (portfolioId: string, securityId: string) =>
  invoke<ValuationEvidenceRefreshResult>({
    action: "EXECUTE",
    portfolioId,
    securityId,
    confirmation: "OWNER_CONFIRMED_VALUATION_EVIDENCE_REFRESH",
  })
