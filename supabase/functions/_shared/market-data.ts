export const MARKET_DATA_PROVIDER = "ANGEL_ONE" as const
export const QUOTE_BATCH_SIZE = 50
export const DEFAULT_CACHE_TTL_SECONDS = 300

export interface ProviderInstrument {
  readonly mappingId: string
  readonly securityId: string
  readonly providerInstrumentId: string
  readonly exchange: string
  readonly tradingSymbol: string
}

export interface LatestPriceObservation {
  readonly mappingId: string
  readonly securityId: string
  readonly providerCode: typeof MARKET_DATA_PROVIDER
  readonly price: string
  readonly priceTimestamp: string | null
  readonly retrievedAt: string
  readonly marketSessionStatus: "OPEN" | "CLOSED" | "PRE_OPEN" | "POST_CLOSE" | "UNKNOWN"
  readonly previousClose: string | null
  readonly dayOpen: string | null
  readonly dayHigh: string | null
  readonly dayLow: string | null
  readonly provenance: Readonly<Record<string, unknown>>
}

export interface MarketDataProvider {
  readonly code: string
  getLatestPrices(instruments: readonly ProviderInstrument[]): Promise<readonly LatestPriceObservation[]>
}

export function chunk<T>(values: readonly T[], size: number): T[][] {
  if (!Number.isSafeInteger(size) || size <= 0) throw new Error("Chunk size must be a positive integer.")
  const result: T[][] = []
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size))
  return result
}

export function exactDecimal(value: unknown, field: string): string | null {
  if (typeof value !== "number" && typeof value !== "string") return null
  const text = String(value).trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text)) throw new Error(`Angel One returned invalid ${field}.`)
  return text
}

export function parseAngelTimestamp(value: unknown): string | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    const milliseconds = value < 10_000_000_000 ? value * 1000 : value
    const date = new Date(milliseconds)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  return null
}

export function isFresh(retrievedAt: string, now: Date, ttlSeconds: number) {
  const retrieved = new Date(retrievedAt).getTime()
  return Number.isFinite(retrieved) && now.getTime() - retrieved < ttlSeconds * 1000
}
