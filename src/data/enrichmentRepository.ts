import type { SecurityEnrichment } from "../features/enrichment/types"
import { supabase } from "../lib/supabase"

export async function loadSecurityEnrichment(securityIds: readonly string[]): Promise<ReadonlyMap<string, SecurityEnrichment>> {
  if (!securityIds.length) return new Map()
  const result = await supabase.from("current_security_enrichment_v1").select("security_id,company_name,sector,industry,market_cap,market_cap_currency,market_cap_as_of_date,market_cap_category,market_cap_rank,market_cap_source,enrichment_state,fresh_until").in("security_id", [...securityIds])
  if (result.error) throw result.error
  return new Map(result.data.flatMap((row): readonly [string, SecurityEnrichment][] => row.security_id === null ? [] : [[row.security_id, {
    securityId: row.security_id,
    companyName: row.company_name ?? "Unavailable",
    sector: row.sector,
    industry: row.industry,
    marketCap: row.market_cap === null ? null : String(row.market_cap),
    marketCapCurrency: row.market_cap_currency,
    marketCapAsOfDate: row.market_cap_as_of_date,
    marketCapCategory: row.market_cap_category as SecurityEnrichment["marketCapCategory"],
    marketCapRank: row.market_cap_rank,
    marketCapSource: row.market_cap_source,
    state: (row.enrichment_state ?? "UNAVAILABLE") as SecurityEnrichment["state"],
    freshUntil: row.fresh_until,
  }]]))
}
