import { useState } from "react"
import { loadRecommendationHistory, type RecommendationTrackingRecord } from "../../data/recommendationPolicyRepository"
import { displayError } from "../../lib/displayError"

export function ResearchTrackingHistory({ portfolioId, securityId }: { readonly portfolioId: string; readonly securityId: string }) {
  const [rows, setRows] = useState<readonly RecommendationTrackingRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const load = async () => {
    setLoading(true)
    try { setRows(await loadRecommendationHistory(portfolioId, securityId)); setError(null) }
    catch (reason: unknown) { setError(displayError(reason)) }
    finally { setLoading(false) }
  }
  return <details className="advisory-reasons"><summary onClick={() => { if (!rows && !loading) void load() }}>Tracking history</summary>
    <p>Retained historical records are not current recommendations. Viewing does not add evaluations or confirmations.</p>
    {loading ? <p role="status">Loading retained history…</p> : error ? <p role="alert">{error}</p> : rows?.length ? rows.map(row => <article key={row.id}><strong>{row.transitionStatus.replaceAll("_", " ")}</strong><p>{row.createdAt} · recorded role {row.suggestedRole} · action {row.actionBias ?? "Unavailable"} · {row.persistenceCount} recorded confirmations</p></article>) : <p>No retained tracking records available.</p>}
  </details>
}
