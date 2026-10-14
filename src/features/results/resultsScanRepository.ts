import { supabase } from "../../lib/supabase"

export interface ResultsScanRun {
  readonly id: string
  readonly status: "RUNNING" | "SUCCEEDED" | "PARTIAL" | "FAILED" | "SKIPPED_FRESH" | "CONFIGURATION_PENDING"
  readonly started_at: string
  readonly completed_at: string | null
  readonly requested_count: number
  readonly processed: number
  readonly pending: number
  readonly accepted_count: number | null
  readonly failed_count: number
}
export interface ResultsScanStatus {
  readonly lastScan: string | null
  readonly newResults: number
  readonly run: ResultsScanRun | null
}
type Action = "STATUS" | "START" | "STEP"

async function invoke(action: Action, portfolioId: string, runId?: string): Promise<ResultsScanStatus> {
  const response = await supabase.functions.invoke<ResultsScanStatus>("results-quarterly-scan", {
    body: { action, portfolioId, ...(runId ? { runId } : {}) },
  })
  if (response.error) throw response.error
  if (!response.data) throw new Error("Quarterly scan did not return status")
  return response.data
}
export const getResultsScanStatus = (portfolioId: string) => invoke("STATUS", portfolioId)
export const startResultsScan = (portfolioId: string) => invoke("START", portfolioId)
export const stepResultsScan = (portfolioId: string, runId: string) => invoke("STEP", portfolioId, runId)
