import { useState } from "react"
import { supabase } from "../lib/supabase"

const PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
const SECURITY_ID = "b47b007d-1990-4504-a5a2-4391c07687c5"
const CAPTURE_RECORD_ID = "de7493fd-6908-426e-85e3-848c39a5e04f"

export function N4aNormalizationPilotPage() {
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

      setResult("Normalizing from the stored NSE capture only…")
      const { data, error } = await supabase.functions.invoke("normalize-nse-news-pilot", {
        body: {
          portfolioId: PORTFOLIO_ID,
          securityId: SECURITY_ID,
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
    <section style={{ maxWidth: 820, margin: "0 auto", padding: "24px" }}>
      <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#287150" }}>
        PortfolioAI controlled pilot
      </p>
      <h1>N4A — HDFCBANK NSE Normalization Pilot</h1>
      <p>
        This authenticated app page uses the same Supabase client and refreshed session as PortfolioAI itself.
      </p>
      <div style={{ background: "#fff8e8", border: "1px solid #ebcf87", borderRadius: 10, padding: 14, margin: "18px 0", color: "#6e5410" }}>
        <strong>Zero external fetches.</strong> It reads only the reviewed stored NSE capture, normalizes at most one deterministically matched HDFCBANK announcement, and leaves tone classification and scheduling disabled.
      </div>
      <button type="button" onClick={runPilot} disabled={running}>
        {running ? "Running…" : "Run HDFCBANK N4A Normalization Pilot"}
      </button>
      <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#eef4f0", padding: 14, borderRadius: 10, marginTop: 18, minHeight: 70 }}>
        {result}
      </pre>
    </section>
  )
}
