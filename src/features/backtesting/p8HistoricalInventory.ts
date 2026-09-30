export const P8_HISTORICAL_INVENTORY_VERSION = "P8_HISTORICAL_INVENTORY_2026_09_30" as const
export type P8InventoryState = "USABLE_FOUNDATION" | "PARTIAL" | "BLOCKED"

export interface P8InventoryDomain {
  readonly code: string
  readonly label: string
  readonly state: P8InventoryState
  readonly coverage: string
  readonly finding: string
  readonly requiredRemediation: string
}

interface P8HistoricalInventory {
  readonly version: typeof P8_HISTORICAL_INVENTORY_VERSION
  readonly auditedAt: string
  readonly project: string
  readonly equityUniverse: number
  readonly domains: readonly P8InventoryDomain[]
  readonly p8BReady: boolean
  readonly performanceBacktestAuthorized: boolean
}

export const P8_HISTORICAL_INVENTORY: P8HistoricalInventory = {
  version: P8_HISTORICAL_INVENTORY_VERSION,
  auditedAt: "2026-09-30",
  project: "PortfolioAI Dev",
  equityUniverse: 239,
  domains: [
    { code: "DAILY_PRICES", label: "Daily market history", state: "PARTIAL", coverage: "239/239 · 63,927 rows", finding: "230 equities have at least 252 dates; maximum depth is 282 dates and 9 recent listings are shorter.", requiredRemediation: "Extend to multiple market cycles and preserve listing-aware eligibility." },
    { code: "CORPORATE_ACTIONS", label: "Corporate-action adjustment", state: "BLOCKED", coverage: "0/239 adjusted-close series", finding: "No held equity has adjusted_close populated.", requiredRemediation: "Approve and populate a split/dividend/bonus adjustment authority before return simulation." },
    { code: "BENCHMARKS", label: "Benchmark history", state: "PARTIAL", coverage: "10 series · 2,710 rows", finding: "All ten series contain 271 dates from 2025-08-25 to 2026-09-28.", requiredRemediation: "Extend matching benchmark history and approve missing benchmark authorities." },
    { code: "FUNDAMENTALS", label: "Point-in-time fundamentals", state: "BLOCKED", coverage: "114/239 · 2,428 rows", finding: "Only 2 rows have publication timestamps; 125 equities have no observations and only one equity has at least eight periods.", requiredRemediation: "Build multi-period histories with provable publication availability; exclude unknown dates." },
    { code: "DOCUMENTS", label: "Historical documents", state: "BLOCKED", coverage: "111/239 · 139 held-equity documents", finding: "No held equity has eight distinct publication dates; available documents begin in April 2026.", requiredRemediation: "Acquire dated annual, quarterly and presentation history with immutable source identity/content evidence." },
    { code: "CANONICAL_SNAPSHOTS", label: "Historical canonical snapshots", state: "BLOCKED", coverage: "239/239 current · 1 as-of date", finding: "All 1,246 immutable snapshots share the same 2026-09-29 as-of date.", requiredRemediation: "Materialize multiple eligible decision-date snapshots only after temporal evidence is proven." },
    { code: "UNIVERSE", label: "Historical eligible universe", state: "BLOCKED", coverage: "282 listings · 0 valid_from dates", finding: "All 284 securities are active; no inactive/delisted equity history exists and listing validity is undated.", requiredRemediation: "Establish dated listing/delisting and historical universe membership including inactive securities." },
    { code: "CLASSIFICATION", label: "Classification/methodology history", state: "BLOCKED", coverage: "0 classification changes", finding: "Market-cap evidence has one as-of date; only 6 subprofile assignments have effective dates.", requiredRemediation: "Version classification, methodology, assignment and threshold validity by decision date." },
    { code: "DECISION_RUNS", label: "Historical R6–R10 runs", state: "BLOCKED", coverage: "0 score runs", finding: "Five legacy recommendations cover one equity and do not constitute portfolio decision history.", requiredRemediation: "Replay R6–R10 only after point-in-time inputs and the experiment contract pass." },
  ],
  p8BReady: false,
  performanceBacktestAuthorized: false,
} as const

export function summarizeP8HistoricalInventory() {
  const counts = { usable: 0, partial: 0, blocked: 0 }
  for (const domain of P8_HISTORICAL_INVENTORY.domains) {
    if (domain.state === "USABLE_FOUNDATION") counts.usable += 1
    else if (domain.state === "PARTIAL") counts.partial += 1
    else counts.blocked += 1
  }
  return counts
}
