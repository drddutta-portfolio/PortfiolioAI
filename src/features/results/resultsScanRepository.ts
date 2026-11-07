import { supabase } from "../../lib/supabase"

export interface ResultsScanRun {
  readonly id: string
  readonly status: "RUNNING" | "SUCCEEDED" | "PARTIAL" | "FAILED" | "CONFIGURATION_PENDING"
  readonly started_at: string
  readonly completed_at: string | null
  readonly requested_count: number
  readonly processed: number
  readonly pending: number
  readonly accepted_count: number | null
  readonly failed_count: number
  readonly rejected_count?: number
  readonly unchanged_count?: number
  readonly observationsInserted?: number
  readonly documentsParsed?: number
  readonly error_summary?: string | null
}
export interface ResultsScanStatus {
  readonly lastScan: string | null
  /** Newly source-verified company/quarter results, NOT raw metric rows. */
  readonly newResults: number
  readonly run: ResultsScanRun | null
}
type Action = "STATUS" | "START"

async function invoke(action: Action, portfolioId: string): Promise<ResultsScanStatus> {
  const response = await supabase.functions.invoke<ResultsScanStatus>("results-quarterly-scan-v2", {
    body: { action, portfolioId },
  })
  if (response.error) {
    const context = (response.error as { context?: unknown }).context
    if (context && typeof context === "object" && "json" in context) {
      try {
        const body: unknown = await (context as Response).json()
        if (typeof body === "object" && body !== null) {
          const payload = body as { error?: unknown; details?: unknown }
          if (typeof payload.error === "string") {
            const description = typeof payload.details === "string" ? ": " + payload.details : ""
            throw new Error(payload.error + description)
          }
        }
      } catch (reason) {
        if (reason instanceof Error && reason.message.startsWith("SCAN_")) throw reason
      }
    }
    throw response.error
  }
  if (!response.data) throw new Error("Quarterly scan did not return status")
  return response.data
}
export const getResultsScanStatus = (portfolioId: string) => invoke("STATUS", portfolioId)
export const startResultsScan = (portfolioId: string) => invoke("START", portfolioId)
