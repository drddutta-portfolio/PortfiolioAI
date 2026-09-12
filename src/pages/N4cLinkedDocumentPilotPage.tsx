import { useState } from "react"
import { supabase } from "../lib/supabase"

const PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
const NEWS_ITEM_ID = "821bd69d-d630-4cd7-9b86-e56fb5e78eb1"

export function N4cLinkedDocumentPilotPage() {
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

      setResult("Capturing one official NSE linked document…")
      const { data, error } = await supabase.functions.invoke("pilot-nse-linked-document", {
        body: {
          portfolioId: PORTFOLIO_ID,
          newsItemId: NEWS_ITEM_ID,
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
    <section style={{ maxWidth: 820, margin: "0 auto", padding: "24px" }}>
      <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#287150" }}>
        PortfolioAI controlled pilot
      </p>
      <h1>N4C — HDFCBANK Official NSE Linked-Document Capture</h1>
      <p>
        This authenticated page captures the official NSE document for the currently unclassified HDFCBANK announcement.
      </p>
      <div style={{ background: "#fff8e8", border: "1px solid #ebcf87", borderRadius: 10, padding: 14, margin: "18px 0", color: "#6e5410" }}>
        <strong>Exactly one external fetch maximum.</strong> The document is fetched only from the reviewed NSE archive host, stored privately, hashed, and recorded with ingestion lineage. No parsing, AI, news mutation, tone classification, or scheduling is enabled.
      </div>
      <button type="button" onClick={runPilot} disabled={running}>
        {running ? "Running…" : "Run HDFCBANK N4C Linked-Document Capture"}
      </button>
      <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#eef4f0", padding: 14, borderRadius: 10, marginTop: 18, minHeight: 70 }}>
        {result}
      </pre>
    </section>
  )
}
