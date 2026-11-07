import type { ResultsSourceObservation } from "./resultsSourceRepository"

/** The seven-day indicator begins when the complete source-original result
 * was FIRST added to storage, not when it is re-fetched or the page refreshes.
 * 2026 Q2 onward is not a fixed boundary: only a reasonably recent reporting
 * quarter (<=180 days old) can be newly *reported*. Historical backfills stay
 * in Results but cannot masquerade as new company earnings announcements.
 */
export const NEW_RESULT_DURATION_MS = 7 * 24 * 60 * 60 * 1000
const MAX_QUARTER_AGE_MS = 180 * 24 * 60 * 60 * 1000
const OPERATING_CODES = [
  "OPERATING_REVENUE_QUARTER",
  "NET_INTEREST_INCOME_QUARTER",
  "NET_PREMIUM_EARNED_QUARTER",
] as const

/** Maps securityId|periodEnd to first complete financial-trio insertion time.
 * Only individually selected, same-source, same-scope issuer originals count.
 * Neither an unverified financial row nor a partial result earns a blue dot.
 */
export function newlyReportedQuarterKeys(
  observations: readonly ResultsSourceObservation[],
  nowMs: number = Date.now(),
): ReadonlyMap<string, number> {
  const byOriginal = new Map<string, ResultsSourceObservation[]>()
  for (const row of observations) {
    if (!row.selected || row.source !== "COMPANY_EXCHANGE_FILING" ||
      !row.sourceRecordId || !row.scope || row.currency !== "INR" ||
      !row.createdAt || !Number.isFinite(Date.parse(row.createdAt))) continue
    const quarter = Date.parse(row.periodEnd + "T00:00:00.000Z")
    if (!Number.isFinite(quarter) || quarter > nowMs ||
      nowMs - quarter > MAX_QUARTER_AGE_MS) continue
    const group = [row.securityId,row.periodEnd,row.sourceRecordId,row.scope].join("|")
    const existing = byOriginal.get(group) ?? []
    existing.push(row)
    byOriginal.set(group,existing)
  }
  const result = new Map<string,number>()
  for (const rows of byOriginal.values()) {
    const top = rows.find(row => OPERATING_CODES.some(code => code===row.code) && row.unit==="INR_CRORE")
    const pat = rows.find(row => row.code==="NET_PROFIT_QUARTER" && row.unit==="INR_CRORE")
    const eps = rows.find(row => row.code==="EPS_DILUTED" && row.unit==="INR_PER_SHARE")
    if (!top || !pat || !eps) continue
    const trio = [top,pat,eps]
    const addedAt = Math.max(...trio.map(row=>Date.parse(row.createdAt!)))
    if (addedAt > nowMs || nowMs - addedAt >= NEW_RESULT_DURATION_MS) continue
    const key = top.securityId + "|" + top.periodEnd
    const previous = result.get(key)
    // Preserve the earliest still eligible source-original addition within
    // the seven-day window rather than extending it on repeated observations.
    if (previous===undefined || addedAt<previous) result.set(key,addedAt)
  }
  return result
}
