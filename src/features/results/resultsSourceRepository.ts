import { supabase } from "../../lib/supabase"

/** R3 read-only source inventory, never a competing selector of canonical financial facts. */
export interface ResultsSourceObservation {
  readonly id: string
  readonly securityId: string
  readonly code: string
  readonly value: string
  readonly periodEnd: string
  readonly unit: string
  readonly scope: string | null
  readonly source: string
  readonly publishedAt: string | null
  readonly retrievedAt: string
  readonly selected: boolean
}

const METRICS = [
  "OPERATING_REVENUE_QUARTER",
  "OPERATING_PROFIT_QUARTER",
  "ADVANCES_GROWTH_YOY",
  "DEPOSITS_GROWTH_YOY",
] as const

/** Only selected observations can be presented as qualified financial facts. */
export async function loadResultsSourceInventory(ids: readonly string[]): Promise<readonly ResultsSourceObservation[]> {
  if (!ids.length) return []
  const output: ResultsSourceObservation[] = []
  for (let offset = 0; offset < ids.length; offset += 80) {
    const batch = ids.slice(offset, offset + 80)
    const [observations, decisions] = await Promise.all([
      supabase.from("fundamental_observations")
        .select("id,security_id,metric_code,numeric_value,unit,period_end,period_type,consolidation_scope,evidence_status,source_code,published_at,retrieved_at")
        .in("security_id", [...batch])
        .in("metric_code", [...METRICS])
        .eq("period_type", "QUARTER")
        .not("period_end", "is", null)
        .eq("evidence_status", "AVAILABLE")
        .range(0, 999),
      supabase.from("fundamental_observation_decisions")
        .select("selected_observation_id")
        .in("security_id", [...batch]),
    ])
    if (observations.error) throw observations.error
    if (decisions.error) throw decisions.error
    if (observations.data.length === 1000) throw new Error("R3 source inventory page limit reached; refusing silent truncation")
    const selected = new Set(decisions.data.map((row) => row.selected_observation_id))
    for (const row of observations.data) {
      if (row.period_end === null || row.numeric_value === null) continue
      output.push({
        id: row.id,
        securityId: row.security_id,
        code: row.metric_code,
        value: String(row.numeric_value),
        periodEnd: row.period_end,
        unit: row.unit ?? "UNKNOWN",
        scope: row.consolidation_scope,
        source: row.source_code,
        publishedAt: row.published_at,
        retrievedAt: row.retrieved_at,
        selected: selected.has(row.id),
      })
    }
  }
  return output
}
