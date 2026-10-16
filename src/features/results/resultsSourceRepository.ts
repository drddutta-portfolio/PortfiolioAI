import { supabase } from "../../lib/supabase"

/**
 * Results R3 source inventory. Displays selected figures as verified selections
 * and unselected figures as review-pending observations; no V1-4 inference.
 */
export interface ResultsSourceObservation {
  readonly id: string
  readonly securityId: string
  readonly code: string
  readonly value: string
  readonly periodEnd: string
  readonly periodStart?: string | null
  readonly currency?: string | null
  readonly sourceRecordId?: string | null
  readonly unit: string
  readonly scope: string | null
  readonly source: string
  readonly publishedAt: string | null
  readonly retrievedAt: string
  readonly selected: boolean
  readonly originalShareBasis?: boolean
}

const METRICS = [
  "OPERATING_REVENUE_QUARTER",
  "NET_PREMIUM_EARNED_QUARTER",
  "OPERATING_PROFIT_QUARTER",
  "ADVANCES_GROWTH_YOY",
  "DEPOSITS_GROWTH_YOY",
  "NET_INTEREST_INCOME_QUARTER",
  "NET_PROFIT_QUARTER",
  "EPS_DILUTED",
  "GROSS_NPA_PERCENT",
  "NET_NPA_PERCENT",
] as const

const PAGE_SIZE = 700
const MAX_PAGES_PER_BATCH = 100

/**
 * Reuse persisted source facts before considering provider calls. Paging is
 * essential: 80 held equities x several quarters easily exceeds 1,000 rows.
 * Stable sorting avoids treating a truncated response as complete coverage.
 */
export async function loadResultsSourceInventory(ids: readonly string[]): Promise<readonly ResultsSourceObservation[]> {
  if (!ids.length) return []
  const output: ResultsSourceObservation[] = []
  for (let offset = 0; offset < ids.length; offset += 80) {
    const batch = ids.slice(offset, offset + 80)
    const selected = new Set<string>()
    const originalShareIds = new Set<string>()
    for (let page = 0; page < MAX_PAGES_PER_BATCH; page++) {
      const { data, error } = await supabase.from("fundamental_observation_decisions")
        .select("security_id,metric_code,period_end,selected_observation_id,notes")
        .in("security_id", [...batch])
        .order("security_id", { ascending: true })
        .order("metric_code", { ascending: true })
        .order("period_end", { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      if (error) throw error
      for (const row of data) if (row.selected_observation_id) {
        selected.add(row.selected_observation_id)
        if (row.notes?.includes("REPORTED_PRE_SPLIT_EPS_NOT_ADJUSTED")) originalShareIds.add(row.selected_observation_id)
      }
      if (data.length < PAGE_SIZE) break
      if (page === MAX_PAGES_PER_BATCH - 1) throw new Error("Results decisions exceeded bounded read capacity")
    }
    for (let page = 0; page < MAX_PAGES_PER_BATCH; page++) {
      const { data, error } = await supabase.from("fundamental_observations")
        .select("id,security_id,metric_code,numeric_value,unit,currency,period_start,period_end,period_type,consolidation_scope,evidence_status,source_code,source_record_id,published_at,retrieved_at")
        .in("security_id", [...batch])
        .in("metric_code", [...METRICS])
        .eq("period_type", "QUARTER")
        .not("period_end", "is", null)
        .eq("evidence_status", "AVAILABLE")
        .order("id", { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      if (error) throw error
      for (const row of data) {
        if (row.period_end === null || row.numeric_value === null) continue
        output.push({
          id: row.id,
          securityId: row.security_id,
          code: row.metric_code,
          value: String(row.numeric_value),
          periodEnd: row.period_end,
          periodStart: row.period_start,
          currency: row.currency,
          sourceRecordId: row.source_record_id,
          unit: row.unit ?? "UNKNOWN",
          scope: row.consolidation_scope,
          source: row.source_code,
          publishedAt: row.published_at,
          retrievedAt: row.retrieved_at,
          selected: selected.has(row.id),
          originalShareBasis: originalShareIds.has(row.id),
        })
      }
      if (data.length < PAGE_SIZE) break
      if (page === MAX_PAGES_PER_BATCH - 1) throw new Error("Results observations exceeded bounded read capacity")
    }
  }
  return output
}
