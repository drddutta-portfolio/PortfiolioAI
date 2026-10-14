import type { ResultsSourceObservation } from "./resultsSourceRepository"

/** Presentation authority: consume already-recorded decisions, never make
 * an evidence selection in the browser. Show only one accounting basis.
 * All unselected sources remain in Source & Verification Details.
 */
export function displayQuarterEvidence(rows: readonly ResultsSourceObservation[]): readonly ResultsSourceObservation[] {
  if (!rows.length) return []
  const selected = rows.filter((r) => r.selected)
  const selectedScope = selected.some((r) => r.scope === "CONSOLIDATED") ? "CONSOLIDATED"
    : selected.some((r) => r.scope === "STANDALONE") ? "STANDALONE" : null
  const scope = selectedScope ?? (rows.some((r) => r.scope === "CONSOLIDATED") ? "CONSOLIDATED"
    : rows.some((r) => r.scope === "STANDALONE") ? "STANDALONE" : rows[0]?.scope)
  const matching = rows.filter((r) => r.scope === scope)
  const byMetric = new Map<string, ResultsSourceObservation>()
  for (const row of matching) {
    const old = byMetric.get(row.code)
    if (!old || (!old.selected && row.selected)) byMetric.set(row.code, row)
  }
  return [...byMetric.values()]
}
