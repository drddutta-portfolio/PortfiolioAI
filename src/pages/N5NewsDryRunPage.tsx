import { useState } from "react"
import { supabase } from "../lib/supabase"

const PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"

type DryRunResult = {
  runId?: string
  eligibleHeldEquities?: number
  parsedItems?: number
  matchedItems?: number
  totalMatchedItems?: number
  unmatchedItems?: number
  ambiguousItems?: number
  existingCanonicalItems?: number
  plannedNewCanonicalItems?: number
  plannedMissingDocumentCaptures?: number
  externalFetches?: number
  linkedDocumentFetches?: number
  normalizedNewsWrites?: number
  sourceRecordWrites?: number
  storageWrites?: number
  refreshStateMutation?: boolean
  schedulerEnabled?: boolean
  note?: string
}

export function N5NewsDryRunPage() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<DryRunResult | null>(null)
  const [message, setMessage] = useState("Ready for one authenticated N5 dry run.")

  async function runDryRun() {
    setRunning(true)
    setResult(null)
    setMessage("Refreshing authenticated PortfolioAI session…")

    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError || !refreshData.session) {
        throw new Error("PortfolioAI session could not be refreshed. Please sign out and sign in again.")
      }

      setMessage("Running the owner-authenticated N5 dry run…")
      const { data, error } = await supabase.functions.invoke("run-nse-news-pipeline", {
        body: {
          action: "DRY_RUN",
          portfolioId: PORTFOLIO_ID,
        },
      })

      if (error) {
        const context = (error as { context?: Response }).context
        if (context) {
          const text = await context.text()
          throw new Error(`HTTP ${context.status}: ${text}`)
        }
        throw error
      }

      const dryRun = (data ?? {}) as DryRunResult
      setResult(dryRun)
      const safe =
        dryRun.externalFetches === 1 &&
        dryRun.linkedDocumentFetches === 0 &&
        dryRun.normalizedNewsWrites === 0 &&
        dryRun.sourceRecordWrites === 0 &&
        dryRun.storageWrites === 0 &&
        dryRun.refreshStateMutation === false &&
        dryRun.schedulerEnabled === false

      setMessage(safe
        ? "Dry run completed with the expected zero-mutation safety contract."
        : "Dry run completed, but one or more safety assertions differ from the expected contract. Review the result before any next step.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setRunning(false)
    }
  }

  return (
    <section style={{ maxWidth: 920, margin: "0 auto", padding: "24px" }}>
      <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#287150" }}>
        PortfolioAI controlled validation
      </p>
      <h1>N5 — NSE News Pipeline Dry Run</h1>
      <p>
        This owner-authenticated control runs only the N5 <strong>DRY_RUN</strong> action for the current PortfolioAI portfolio.
        The production policy still blocks live manual runs and scheduling.
      </p>

      <div style={{ background: "#eef7f2", border: "1px solid #aad1bb", borderRadius: 10, padding: 14, margin: "18px 0", color: "#285c40" }}>
        Expected contract: one official NSE RSS fetch, zero linked-document fetches, zero news/source/storage writes, zero freshness mutation, and scheduler disabled.
      </div>

      <button type="button" onClick={runDryRun} disabled={running}>
        {running ? "Running N5 dry run…" : "Run N5 Dry Run"}
      </button>

      <div style={{ marginTop: 18, fontWeight: 700 }}>{message}</div>

      {result ? (
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#eef4f0", padding: 14, borderRadius: 10, marginTop: 14, minHeight: 70 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </section>
  )
}
