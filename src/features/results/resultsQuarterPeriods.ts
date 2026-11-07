import type { ResultsSourceObservation } from "./resultsSourceRepository"

export interface ResultsQuarterPeriod { readonly end: string; readonly label: string }
const BASELINE_END = "2026-06-30"
const FIRST_DISPLAYED_END = "2025-03-31"
const CORE = new Set(["OPERATING_REVENUE_QUARTER", "NET_INTEREST_INCOME_QUARTER", "NET_PREMIUM_EARNED_QUARTER", "NET_PROFIT_QUARTER", "EPS_DILUTED"])

function quarterEndDate(end: string): Date | null {
  if (!/^\d{4}-(03-31|06-30|09-30|12-31)$/.test(end)) return null
  const date = new Date(end + "T00:00:00.000Z")
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === end ? date : null
}

export function latestCompletedCalendarQuarter(now: Date): string {
  const qStartMonth = Math.floor(now.getUTCMonth() / 3) * 3
  return new Date(Date.UTC(now.getUTCFullYear(), qStartMonth, 0)).toISOString().slice(0, 10)
}

export function labelResultsQuarter(end: string): string {
  const date = quarterEndDate(end)
  if (!date) throw new Error("Invalid quarter end: " + end)
  const month = date.getUTCMonth() + 1
  const quarter = month === 3 ? 4 : month === 6 ? 1 : month === 9 ? 2 : 3
  const fy = date.getUTCFullYear() + (month === 3 ? 0 : 1)
  return `Q${quarter} FY${String(fy).slice(-2)}`
}

/** The latest column advances only after a source-coherent, selected financial
 * trio exists for an already completed quarter. An arbitrary observation,
 * calendar rollover, or unselected source never creates a future column.
 * Historical and published quarters remain visible without changing UI layout.
 */
export function buildResultsQuarterPeriods(
  observations: readonly ResultsSourceObservation[],
  now: Date = new Date(),
): ResultsQuarterPeriod[] {
  const latestCompleted = latestCompletedCalendarQuarter(now)
  const candidates = new Map<string, Map<string, ResultsSourceObservation[]>>()
  for (const row of observations) {
    if (!row.selected || row.source !== "COMPANY_EXCHANGE_FILING" ||
      row.periodEnd <= BASELINE_END || row.periodEnd > latestCompleted ||
      !quarterEndDate(row.periodEnd) || !CORE.has(row.code) ||
      !row.sourceRecordId || !row.scope || row.currency !== "INR") continue
    const byStock: Map<string, ResultsSourceObservation[]> = candidates.get(row.periodEnd) ?? new Map<string, ResultsSourceObservation[]>()
    const facts: ResultsSourceObservation[] = byStock.get(row.securityId) ?? []
    facts.push(row)
    byStock.set(row.securityId, facts)
    candidates.set(row.periodEnd, byStock)
  }
  let latest = BASELINE_END
  for (const [end, byStock] of candidates) {
    const qualifies = [...byStock.values()].some(rows => {
      const codes = new Set(rows.map(r => r.code))
      const topCount = ["OPERATING_REVENUE_QUARTER", "NET_INTEREST_INCOME_QUARTER", "NET_PREMIUM_EARNED_QUARTER"]
        .filter(x => codes.has(x)).length
      return topCount === 1 && codes.has("NET_PROFIT_QUARTER") && codes.has("EPS_DILUTED") &&
        rows.length === 3 && new Set(rows.map(r => r.sourceRecordId)).size === 1 &&
        new Set(rows.map(r => r.scope)).size === 1 &&
        rows.every(r => r.unit === (r.code === "EPS_DILUTED" ? "INR_PER_SHARE" : "INR_CRORE"))
    })
    if (qualifies && end > latest) latest = end
  }
  const periods: ResultsQuarterPeriod[] = []
  for (let end = quarterEndDate(latest); end && end.toISOString().slice(0, 10) >= FIRST_DISPLAYED_END;
    end = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 2, 0))) {
    const iso = end.toISOString().slice(0, 10)
    periods.push({ end: iso, label: labelResultsQuarter(iso) })
  }
  return periods
}
