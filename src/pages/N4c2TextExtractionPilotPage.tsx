import { useState } from "react"
import { supabase } from "../lib/supabase"

const PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
const NEWS_ITEM_ID = "821bd69d-d630-4cd7-9b86-e56fb5e78eb1"
const CAPTURE_RECORD_ID = "a5a71840-6c74-432a-9a93-5a8284d83fbe"

export function N4c2TextExtractionPilotPage() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState("Ready.")

  async function runPilot() {
    setRunning(true)
    setResult("Refreshing authenticated PortfolioAI session…")

    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError || !refreshData.session) {
        throw new Error("PortfolioAI session could not be refreshed. Please sign out and sign in again.")
      }

      setResult("Extracting text from the already-stored official NSE PDF…")
      const { data, error } = await supabase.functions.invoke("extract-nse-linked-document-text-pilot", {
        body: {
          portfolioId: PORTFOLIO_ID,
          newsItemId: NEWS_ITEM_ID,
          captureRecordId: CAPTURE_RECORD_ID,
        },
      })

      if (error) {
        const context = (error as { context?: Response }).context
        if (context) {
          const text = await context.text()
          setResult(`HTTP ${context.status}\n\n${text}`)
          return
        }
        throw error
      }

      setResult(`Success\n\n${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(error instanceof Error ? error.message : String(error))
    } finally {
      setRunning(false)
    }
  }

  return (
    <section style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>
      <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#287150" }}>
        PortfolioAI controlled pilot
      </p>
      <h1>N4C.2 — HDFCBANK Stored NSE PDF Text Extraction</h1>
      <p>
        This authenticated page reads the already-captured HDFCBANK NSE PDF from private storage and extracts bounded text for review.
      </p>
      <div style={{ background: "#eef7f2", border: "1px solid #aad1bb", borderRadius: 10, padding: 14, margin: "18px 0", color: "#285c40" }}>
        <strong>No external NSE request.</strong> The stored PDF hash is verified before parsing. No AI, OCR, news mutation, tone/importance change, or scheduling is enabled.
      </div>
      <button type="button" onClick={runPilot} disabled={running}>
        {running ? "Running…" : "Run HDFCBANK N4C.2 Text Extraction Pilot"}
      </button>
      <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#eef4f0", padding: 14, borderRadius: 10, marginTop: 18, minHeight: 70 }}>
        {result}
      </pre>
    </section>
  )
}
