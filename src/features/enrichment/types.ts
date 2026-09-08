export type EnrichmentState = "LOADING" | "AVAILABLE" | "PARTIAL" | "UNAVAILABLE" | "STALE" | "FAILED"

export interface SecurityEnrichment {
  readonly securityId: string
  readonly companyName: string
  readonly sector: string | null
  readonly industry: string | null
  readonly marketCap: string | null
  readonly marketCapCurrency: string | null
  readonly marketCapAsOfDate: string | null
  readonly marketCapCategory: "LARGE_CAP" | "MID_CAP" | "SMALL_CAP" | "INSUFFICIENT_EVIDENCE" | "CONFLICTING" | null
  readonly marketCapRank: number | null
  readonly marketCapSource: string | null
  readonly state: Exclude<EnrichmentState, "LOADING">
  readonly freshUntil: string | null
}

export interface EnrichmentLoadResult {
  readonly bySecurityId: ReadonlyMap<string, SecurityEnrichment>
  readonly state: EnrichmentState
  readonly error: string | null
}
