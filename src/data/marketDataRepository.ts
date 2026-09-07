import type { MarketPrice } from "../features/portfolio/types"
import { publicConfig } from "../lib/config"
import { supabase } from "../lib/supabase"
import type { MarketPriceProvider } from "./portfolioRepository"

export const PRICE_STALE_AFTER_SECONDS = 15 * 60

interface CachedPriceRecord {
  readonly securityId: string
  readonly price: string
  readonly currency: string
  readonly priceTimestamp: string | null
  readonly retrievedAt: string
  readonly provider: string
  readonly marketSessionStatus: MarketPrice["marketSessionStatus"]
}

interface MarketDataResponse {
  readonly prices?: readonly CachedPriceRecord[]
  readonly unresolvedSecurityIds?: readonly string[]
  readonly error?: string
}

export function priceIsStale(retrievedAt: string, now = Date.now()) {
  const retrieved = Date.parse(retrievedAt)
  return !Number.isFinite(retrieved) || now - retrieved >= PRICE_STALE_AFTER_SECONDS * 1000
}

function toPrice(record: CachedPriceRecord, now = Date.now()): MarketPrice {
  return {
    ...record,
    staleAfterSeconds: PRICE_STALE_AFTER_SECONDS,
    isStale: priceIsStale(record.retrievedAt, now),
  }
}

export const supabaseMarketPriceProvider: MarketPriceProvider = {
  async loadLatestPrices(securityIds) {
    if (!publicConfig.marketDataEnabled || !securityIds.length) return []
    const response = await supabase.functions.invoke<MarketDataResponse>("refresh-market-data", {
      body: { action: "READ_CACHE", securityIds },
    }) as unknown as { readonly data: MarketDataResponse | null; readonly error: Error | null }
    const { data, error } = response
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return (data?.prices ?? []).map((record) => toPrice(record))
  },
}

export async function refreshPortfolioMarketData(portfolioId: string, force = false) {
  const response = await supabase.functions.invoke<MarketDataResponse & Readonly<Record<string, unknown>>>("refresh-market-data", {
    body: { action: "REFRESH", portfolioId, force },
  }) as unknown as { readonly data: (MarketDataResponse & Readonly<Record<string, unknown>>) | null; readonly error: Error | null }
  const { data, error } = response
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

export function isMarketDataEnabled() {
  return publicConfig.marketDataEnabled
}
