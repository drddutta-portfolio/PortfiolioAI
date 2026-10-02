interface Env {
  HISTORY_BUCKET: R2Bucket
  ALLOWED_ORIGINS: string
}

const ROOT_PREFIX = "portfolioai-history/development/p8/"
const BACKUP_MANIFEST_KEY = ROOT_PREFIX + "rescue-backup-v1/COMPLETE.json"
const CATALOG_KEY = ROOT_PREFIX + "catalog/v1/catalog.json"
const VERSION = "PORTFOLIOAI_HISTORY_GATEWAY_V1"

function allowedOrigins(env: Env) {
  return new Set(
    env.ALLOWED_ORIGINS.split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  )
}

function corsHeaders(request: Request, env: Env) {
  const origin = request.headers.get("Origin")
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  })

  if (origin && allowedOrigins(env).has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin)
  }

  return headers
}

function jsonResponse(
  request: Request,
  env: Env,
  body: unknown,
  init: ResponseInit = {},
) {
  const headers = new Headers(init.headers)
  corsHeaders(request, env).forEach((value, key) => headers.set(key, value))
  headers.set("Content-Type", "application/json; charset=utf-8")
  headers.set("Cache-Control", "no-store")
  return new Response(JSON.stringify(body), { ...init, headers })
}

function validDate(value: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
}

function rawPriceKey(year: number, symbol: string, series: string) {
  return (
    ROOT_PREFIX +
    `runtime/raw-prices/v1/year=${year}/series=${encodeURIComponent(series)}/symbol=${encodeURIComponent(symbol)}.json`
  )
}

async function loadRuntimeYear(
  env: Env,
  year: number,
  symbol: string,
  series: string,
) {
  const object = await env.HISTORY_BUCKET.get(rawPriceKey(year, symbol, series))
  if (!object) return null
  return object.json<{
    readonly rows?: readonly Record<string, string | null>[]
  }>()
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) })
    }

    if (request.method !== "GET") {
      return jsonResponse(request, env, { error: "METHOD_NOT_ALLOWED" }, { status: 405 })
    }

    const url = new URL(request.url)

    if (url.pathname === "/v1/health") {
      const backup = await env.HISTORY_BUCKET.get(BACKUP_MANIFEST_KEY)
      const catalog = await env.HISTORY_BUCKET.head(CATALOG_KEY)
      let backupStatus: unknown = null

      if (backup) {
        try {
          const manifest = await backup.json<Record<string, unknown>>()
          backupStatus = {
            status: manifest.status ?? null,
            backup_version: manifest.backup_version ?? null,
            source_counts: manifest.source_counts ?? null,
          }
        } catch {
          backupStatus = { status: "INVALID_MANIFEST" }
        }
      }

      return jsonResponse(
        request,
        env,
        {
          ok: Boolean(backup),
          version: VERSION,
          environment: "DEVELOPMENT",
          r2: {
            bucket_bound: true,
            backup_manifest_present: Boolean(backup),
            catalog_present: Boolean(catalog),
          },
          backup: backupStatus,
        },
        { status: backup ? 200 : 503 },
      )
    }

    if (url.pathname === "/v1/catalog") {
      const catalog = await env.HISTORY_BUCKET.get(CATALOG_KEY)
      if (!catalog) {
        return jsonResponse(
          request,
          env,
          { error: "CATALOG_NOT_READY", version: VERSION },
          { status: 503 },
        )
      }
      const headers = corsHeaders(request, env)
      headers.set("Content-Type", "application/json; charset=utf-8")
      headers.set("Cache-Control", "public, max-age=60")
      return new Response(catalog.body, { status: 200, headers })
    }

    if (url.pathname === "/v1/raw-prices") {
      const symbol = url.searchParams.get("symbol")?.trim().toUpperCase() ?? ""
      const series = url.searchParams.get("series")?.trim().toUpperCase() || "EQ"
      const from = url.searchParams.get("from")
      const to = url.searchParams.get("to")

      if (
        !symbol ||
        symbol.length > 64 ||
        series.length > 16 ||
        !validDate(from) ||
        !validDate(to) ||
        from! > to!
      ) {
        return jsonResponse(request, env, { error: "INVALID_QUERY" }, { status: 400 })
      }

      const firstYear = Number(from!.slice(0, 4))
      const lastYear = Number(to!.slice(0, 4))
      if (lastYear - firstYear > 5) {
        return jsonResponse(request, env, { error: "RANGE_TOO_LARGE" }, { status: 400 })
      }

      const years = Array.from(
        { length: lastYear - firstYear + 1 },
        (_, index) => firstYear + index,
      )
      const payloads = await Promise.all(
        years.map((year) => loadRuntimeYear(env, year, symbol, series)),
      )
      const rows = payloads
        .flatMap((payload) => payload?.rows ?? [])
        .filter((row) => {
          const date = row.trade_date
          return typeof date === "string" && date >= from! && date <= to!
        })
        .sort((left, right) =>
          String(left.trade_date).localeCompare(String(right.trade_date)),
        )

      if (!rows.length) {
        return jsonResponse(
          request,
          env,
          { error: "HISTORY_NOT_FOUND", symbol, series, from, to },
          { status: 404 },
        )
      }

      return jsonResponse(request, env, {
        version: "P8_RAW_PRICE_RUNTIME_V1",
        source: "CLOUDFLARE_R2",
        symbol,
        series,
        from,
        to,
        row_count: rows.length,
        rows,
      })
    }

    return jsonResponse(request, env, { error: "NOT_FOUND" }, { status: 404 })
  },
}
