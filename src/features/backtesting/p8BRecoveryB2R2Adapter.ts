import type { P8HistoricalAlias } from "./p8BRecoverySourceAdapters"

export const P8_B2_R2_LAYOUT = {
  listingObservations:
    "portfolioai-history/development/p8/b2/listing-observations/v1/source_date={YYYY-MM-DD}/part-00000.parquet",
  listingObservationManifest:
    "portfolioai-history/development/p8/b2/listing-observations/v1/source_date={YYYY-MM-DD}/manifest.json",
  universeMembers:
    "portfolioai-history/development/p8/b2/universe-members/v1/decision_date={YYYY-MM-DD}/part-00000.parquet",
  universeMemberManifest:
    "portfolioai-history/development/p8/b2/universe-members/v1/decision_date={YYYY-MM-DD}/manifest.json",
  exportManifest:
    "portfolioai-history/development/p8/manifests/v1/TABLE_EXPORT_COMPLETE.json",
} as const

export interface P8HistoricalIdentityRow {
  readonly id: string
  readonly historicalIsin: string
}

export interface P8B2ListingObservationRow {
  readonly historicalIdentityId: string
  readonly sourceDate: string
  readonly exchange: string
  readonly tradingSymbol: string
  readonly instrumentName: string
  readonly series: string | null
}

export interface P8B2UniverseMemberRow {
  readonly historicalIdentityId: string
  readonly decisionAt: string
  readonly membershipState: "ELIGIBLE" | "INELIGIBLE" | "BLOCKED"
}

function dayStartUtc(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date)) throw new Error("source date must be YYYY-MM-DD")
  return date + "T00:00:00.000Z"
}

function aliasKey(row: P8B2ListingObservationRow): string {
  return [
    row.exchange.trim().toUpperCase(),
    row.tradingSymbol.trim().toUpperCase(),
    row.instrumentName.trim().replace(/\s+/gu, " ").toUpperCase(),
  ].join("|")
}

export function b2R2ObjectKey(template: string, date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date)) throw new Error("date must be YYYY-MM-DD")
  return template.replace("{YYYY-MM-DD}", date)
}

/**
 * Derive bounded historical aliases from the immutable B2 listing snapshots.
 *
 * The projection does not claim daily exchange-history precision. An alias is valid
 * from a frozen B2 source snapshot until the next frozen source snapshot where that
 * exact alias is no longer observed. This is a deterministic "next observed change"
 * interval over existing B2 evidence, never a current-state or manual backfill.
 */
export function projectHistoricalAliasesFromB2(
  identities: readonly P8HistoricalIdentityRow[],
  observations: readonly P8B2ListingObservationRow[],
  frozenSourceDates: readonly string[],
): readonly P8HistoricalAlias[] {
  const identityById = new Map(identities.map((row) => [row.id, row]))
  if (identityById.size !== identities.length) throw new Error("historical identity IDs must be unique")

  const dates = [...new Set(frozenSourceDates)].sort()
  if (dates.length !== frozenSourceDates.length) throw new Error("frozen source dates must be unique")
  for (const date of dates) dayStartUtc(date)

  const byIdentityDate = new Map<string, Map<string, P8B2ListingObservationRow[]>>()
  for (const row of observations) {
    if (!identityById.has(row.historicalIdentityId)) {
      throw new Error("listing observation references an unknown historical identity")
    }
    if (!dates.includes(row.sourceDate)) {
      throw new Error("listing observation source date is outside the frozen B2 source dates")
    }
    if (row.exchange.trim().toUpperCase() !== "NSE") {
      throw new Error("P8 B2 listing alias projection expects NSE observations")
    }
    if (!row.tradingSymbol.trim() || !row.instrumentName.trim()) {
      throw new Error("listing observation requires symbol and company name")
    }

    const byDate = byIdentityDate.get(row.historicalIdentityId) ??
      new Map<string, P8B2ListingObservationRow[]>()
    const rows: P8B2ListingObservationRow[] = byDate.get(row.sourceDate) ?? []
    rows.push(row)
    byDate.set(row.sourceDate, rows)
    byIdentityDate.set(row.historicalIdentityId, byDate)
  }

  const result: P8HistoricalAlias[] = []

  for (const identity of identities) {
    const byDate = byIdentityDate.get(identity.id) ??
      new Map<string, P8B2ListingObservationRow[]>()
    const active = new Map<string, { startDate: string; row: P8B2ListingObservationRow }>()

    for (let dateIndex = 0; dateIndex < dates.length; dateIndex++) {
      const date = dates[dateIndex]!
      const rows: P8B2ListingObservationRow[] = byDate.get(date) ?? []
      const current = new Map(rows.map((row) => [aliasKey(row), row]))

      for (const [key, state] of active) {
        if (current.has(key)) continue
        result.push({
          historicalIdentityId: identity.id,
          historicalIsin: identity.historicalIsin,
          exchange: "NSE",
          symbol: state.row.tradingSymbol,
          companyName: state.row.instrumentName,
          validFrom: dayStartUtc(state.startDate),
          validTo: dayStartUtc(date),
        })
        active.delete(key)
      }

      for (const [key, row] of current) {
        if (!active.has(key)) active.set(key, { startDate: date, row })
      }
    }

    for (const state of active.values()) {
      result.push({
        historicalIdentityId: identity.id,
        historicalIsin: identity.historicalIsin,
        exchange: "NSE",
        symbol: state.row.tradingSymbol,
        companyName: state.row.instrumentName,
        validFrom: dayStartUtc(state.startDate),
        validTo: null,
      })
    }
  }

  return result.sort((a, b) =>
    a.historicalIdentityId.localeCompare(b.historicalIdentityId) ||
    a.validFrom.localeCompare(b.validFrom) ||
    a.symbol.localeCompare(b.symbol),
  )
}

export function eligiblePairsFromB2UniverseMembers(
  rows: readonly P8B2UniverseMemberRow[],
): readonly { historicalIdentityId: string; decisionAt: string }[] {
  const eligible = rows
    .filter((row) => row.membershipState === "ELIGIBLE")
    .map((row) => ({
      historicalIdentityId: row.historicalIdentityId,
      decisionAt: row.decisionAt,
    }))

  const unique = new Set(eligible.map((row) => row.historicalIdentityId + "|" + row.decisionAt))
  if (unique.size !== eligible.length) throw new Error("B2 eligible pairs must be unique")
  return eligible
}
