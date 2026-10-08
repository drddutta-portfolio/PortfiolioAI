import { supabase } from "../lib/supabase"

export type ManualRefreshWave = {
  readonly waveNumber: number
  readonly symbols: readonly string[]
  readonly calls: number
}

export type ManualRefreshPlan = {
  readonly mode: string
  readonly providerCalls: number
  readonly staleCount: number
  readonly plannedCalls: number
  readonly dailyObservedUsage: number
  readonly projectedDailyUsage: number
  readonly dailyLimit: number
  readonly perRunLimit: number
  readonly providerQuotaStatus: string
  readonly ingestionEnabled: boolean
  readonly executionAllowed: boolean
  readonly waves: readonly ManualRefreshWave[]
}

export type ManualRefreshExecution = {
  readonly mode: string
  readonly waveNumber: number
  readonly runId: string
  readonly providerCalls: number
  readonly succeeded: number
  readonly failed: number
  readonly results: readonly { readonly symbol: string; readonly status: string; readonly metricCount?: number; readonly safeCode?: string }[]
}

const CONFIRMATION = "OWNER_CONFIRMED_COHORT_A_FUNDAMENTALS"

export async function planManualResearchRefresh(portfolioId: string): Promise<ManualRefreshPlan> {
  const { data, error } = await supabase.functions.invoke<unknown>("manual-research-refresh", {
    body: { action: "PLAN", portfolioId },
  })
  if (error) throw error
  return data as ManualRefreshPlan
}

export async function executeManualResearchRefreshWave(portfolioId: string, waveNumber: number): Promise<ManualRefreshExecution> {
  const { data, error } = await supabase.functions.invoke<unknown>("manual-research-refresh", {
    body: { action: "EXECUTE_WAVE", portfolioId, waveNumber, confirmation: CONFIRMATION },
  })
  if (error) throw error
  return data as ManualRefreshExecution
}
