export const PLANNED_PRIMARY_ENRICHMENT_SOURCE = "TRENDLYNE_MCP" as const
export const ENRICHMENT_ACTIONS = ["READ_CACHE", "REFRESH_IDENTITY", "REFRESH_CLASSIFICATION", "REFRESH_MARKET_CAP", "REFRESH_FUNDAMENTALS", "REFRESH_OWNERSHIP", "REFRESH_DOCUMENTS"] as const
export type EnrichmentAction = typeof ENRICHMENT_ACTIONS[number]

export interface EnrichmentProviderAdapter {
  readonly sourceCode: string
  readonly capabilities: ReadonlySet<Exclude<EnrichmentAction, "READ_CACHE">>
  fetch(action: Exclude<EnrichmentAction, "READ_CACHE">, securityIds: readonly string[]): Promise<readonly ProviderObservation[]>
}

export interface ProviderObservation {
  readonly externalRecordId: string | null
  readonly recordKind: string
  readonly observedAt: string | null
  readonly publishedAt: string | null
  readonly sourceFieldPath: string | null
  readonly rawPayload: Readonly<Record<string, unknown>>
}

export function parseEnrichmentAction(value: unknown): EnrichmentAction | null {
  return typeof value === "string" && (ENRICHMENT_ACTIONS as readonly string[]).includes(value) ? value as EnrichmentAction : null
}

export function prioritizeSecurityIds(
  openSecurityIds: readonly string[],
  historicallyHeldSecurityIds: readonly string[],
  remainingCanonicalSecurityIds: readonly string[],
): readonly string[] {
  const result: string[] = []
  const seen = new Set<string>()
  for (const group of [openSecurityIds, historicallyHeldSecurityIds, remainingCanonicalSecurityIds]) {
    for (const id of group) if (!seen.has(id)) { seen.add(id); result.push(id) }
  }
  return result
}

export function needsRefresh(freshUntil: string | null, now: Date): boolean {
  if (freshUntil === null) return true
  const expires = Date.parse(freshUntil)
  return !Number.isFinite(expires) || expires <= now.getTime()
}
