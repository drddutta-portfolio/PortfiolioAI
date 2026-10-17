import type { ResultsSourceObservation } from "./resultsSourceRepository"

/**
 * R5-F Development projection refresh. No new provider calls, database writes,
 * research scoring or persisted duplicate financial observations.
 */
export const RESULTS_R5_REFRESH_INTERVAL_MS = 10 * 60 * 1000

/** A foreground resume should re-check R4 at most once a minute. */
export function shouldRefreshResultsEvidence(
  elapsedMs: number,
  visible: boolean,
): boolean {
  return visible && elapsedMs >= 60 * 1000
}

/** Preserve the previous React projection if R4 has not changed any facts.
 * loadResultsSourceInventory orders observations by immutable source ID.
 * Selected flags are included: a newly admitted R4 filing changes the result
 * even when the underlying observation already existed yesterday.
 */
export function resultsEvidenceEqual(
  previous: readonly ResultsSourceObservation[],
  next: readonly ResultsSourceObservation[],
): boolean {
  if (previous === next) return true
  if (previous.length !== next.length) return false
  return previous.every((row, i) => {
    const fresh = next[i]
    return fresh !== undefined &&
      row.id === fresh.id &&
      row.securityId === fresh.securityId &&
      row.code === fresh.code &&
      row.value === fresh.value &&
      row.periodStart === fresh.periodStart &&
      row.periodEnd === fresh.periodEnd &&
      row.unit === fresh.unit &&
      row.currency === fresh.currency &&
      row.scope === fresh.scope &&
      row.source === fresh.source &&
      row.sourceRecordId === fresh.sourceRecordId &&
      row.publishedAt === fresh.publishedAt &&
      row.selected === fresh.selected &&
      row.originalShareBasis === fresh.originalShareBasis
  })
}
