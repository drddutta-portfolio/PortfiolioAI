import { supabase } from "../lib/supabase"

export interface ProviderQuotaSummary {
  readonly sourceCode: string
  readonly quotaStatus: string
  readonly planName: string
  readonly internalDailyLimit: number
  readonly internalDailyUsed: number
  readonly internalDailyRemaining: number
  readonly providerDailyLimit: number
  readonly providerDailyEstimatedUsed: number
  readonly providerDailyEstimatedRemaining: number
  readonly providerMonthlyLimit: number
  readonly providerMonthlyEstimatedUsed: number
  readonly providerMonthlyEstimatedRemaining: number
  readonly dayStartedAt: string
  readonly monthStartedAt: string
  readonly usageBasis: string
}

export async function loadProviderQuotaSummary(): Promise<ProviderQuotaSummary> {
  const result = await supabase.rpc("get_provider_quota_summary_v1", { p_source_code: "TRENDLYNE_MCP" })
  if (result.error) throw result.error
  const row = result.data?.[0]
  if (!row) throw new Error("Provider quota summary is unavailable.")
  return {
    sourceCode: row.source_code,
    quotaStatus: row.quota_status,
    planName: row.plan_name,
    internalDailyLimit: Number(row.internal_daily_limit),
    internalDailyUsed: Number(row.internal_daily_used),
    internalDailyRemaining: Number(row.internal_daily_remaining),
    providerDailyLimit: Number(row.provider_daily_limit),
    providerDailyEstimatedUsed: Number(row.provider_daily_estimated_used),
    providerDailyEstimatedRemaining: Number(row.provider_daily_estimated_remaining),
    providerMonthlyLimit: Number(row.provider_monthly_limit),
    providerMonthlyEstimatedUsed: Number(row.provider_monthly_estimated_used),
    providerMonthlyEstimatedRemaining: Number(row.provider_monthly_estimated_remaining),
    dayStartedAt: row.day_started_at,
    monthStartedAt: row.month_started_at,
    usageBasis: row.usage_basis,
  }
}
