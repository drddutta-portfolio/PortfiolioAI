import { publicConfig } from "../lib/config"

export interface HistoricalRawPrice {
  readonly trade_date: string
  readonly exchange: string | null
  readonly trading_symbol: string
  readonly series: string | null
  readonly source_format: string | null
  readonly previous_close: string | null
  readonly open: string | null
  readonly high: string | null
  readonly low: string | null
  readonly close: string | null
  readonly last_price: string | null
  readonly volume: string | null
  readonly traded_value: string | null
  readonly trade_count: string | null
}

interface HistoricalPriceResponse {
  readonly version: "P8_RAW_PRICE_RUNTIME_V1"
  readonly source: "CLOUDFLARE_R2"
  readonly symbol: string
  readonly series: string
  readonly from: string
  readonly to: string
  readonly row_count: number
  readonly rows: readonly HistoricalRawPrice[]
}

export interface HistoricalGatewayHealth {
  readonly ok: boolean
  readonly version: string
  readonly environment: "DEVELOPMENT"
  readonly r2: {
    readonly bucket_bound: boolean
    readonly backup_manifest_present: boolean
    readonly catalog_present: boolean
  }
}

function historyApiUrl(path: string) {
  if (!publicConfig.historyApiUrl) {
    throw new Error("Historical R2 gateway is not configured.")
  }
  return new URL(path, publicConfig.historyApiUrl + "/")
}

async function readJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  })

  if (!response.ok) {
    let detail = ""
    try {
      const payload = await response.json() as { readonly error?: unknown }
      detail = typeof payload.error === "string" ? ` [${payload.error}]` : ""
    } catch {
      // Preserve the HTTP failure as the authoritative error.
    }
    throw new Error(`Historical R2 gateway request failed: HTTP ${response.status}${detail}`)
  }

  return response.json() as Promise<T>
}

export async function loadHistoricalGatewayHealth() {
  return readJson<HistoricalGatewayHealth>(historyApiUrl("v1/health"))
}

export async function loadHistoricalRawPrices(input: {
  readonly symbol: string
  readonly series?: string
  readonly from: string
  readonly to: string
}) {
  const url = historyApiUrl("v1/raw-prices")
  url.searchParams.set("symbol", input.symbol.trim().toUpperCase())
  url.searchParams.set("series", (input.series ?? "EQ").trim().toUpperCase())
  url.searchParams.set("from", input.from)
  url.searchParams.set("to", input.to)

  const result = await readJson<HistoricalPriceResponse>(url)
  if (result.row_count !== result.rows.length) {
    throw new Error("Historical R2 gateway returned an invalid row-count contract.")
  }
  return result
}
