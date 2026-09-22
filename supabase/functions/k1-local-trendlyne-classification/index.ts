import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { TrendlyneObservedMcpClient } from "../_shared/trendlyne-observed.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const CONFIRMATION = "OWNER_CONFIRMED_K1_LOCAL_TRENDLYNE_CLASSIFICATION"
const BATCH_SIZE = 20
const MAX_SYMBOLS = 80

type RequestBody = {
  action?: unknown
  confirmation?: unknown
  symbols?: unknown
}

type ClassificationRow = {
  symbol: string
  isin: string | null
  sector: string | null
  industry: string | null
  companyName: string | null
}

function normalizedSymbol(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : ""
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function parseJsonArray(text: string): unknown[] {
  const trimmed = text.trim()
  const candidates = [
    trimmed,
    trimmed.replace(/^```\(?:json)\s*/iu, "").replace(/\s*```$/u, ""),
  ]

  const firstBracket = trimmed.indexOf("[")
  const lastBracket = trimmed.lastIndexOf("]")
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    candidates.push(trimmed.slice(firstBracket, lastBracket + 1))
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (Array.isArray(parsed)) return parsed
      if (parsed && typeof parsed === "object" && Array.isArray((parsed as { rows?: unknown[] }).rows)) {
        return (parsed as { rows: unknown[] }).rows
      }
    } catch {
      // Try next candidate.
    }
  }
  throw new Error("TRENDLYNE_CLASSIFICATION_JSON_PARSE_FAILED")
}

function coerceRows(text: string, requested: readonly string[]): ClassificationRow[] {
  const requestedSet = new Set(requested)
  const rawRows = parseJsonArray(text)
  const rows: ClassificationRow[] = []
  const seen = new Set<string>()

  for (const raw of rawRows) {
    if (!raw || typeof raw !== "object") continue
    const item = raw as Record<string, unknown>
    const symbol = normalizedSymbol(item.symbol ?? item.nse_symbol ?? item.ticker)
    if (!symbol || !requestedSet.has(symbol) || seen.has(symbol)) continue
    seen.add(symbol)
    rows.push({
      symbol,
      isin: clean(item.isin ?? item.isin_code),
      sector: clean(item.sector ?? item.sector_name),
      industry: clean(item.industry ?? item.industry_name),
      companyName: clean(item.company_name ?? item.companyName ?? item.name),
    }))
  }

  return rows
}

function chunks<T>(values: readonly T[], size: number) {
  const result: T[][] = []
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size))
  return result
}

function queryFor(symbols: readonly string[]) {
  return [
    "Exact NSE-listed stocks only:",
    symbols.join(", ") + ".",
    "For each requested stock return current Trendlyne classification fields only.",
    "Return ONLY a valid JSON array with one object per stock and exactly these keys:",
    "symbol, isin, company_name, sector, industry.",
    "Use the NSE symbol exactly as requested. Use null when a field is unavailable.",
    "Do not substitute peers, similarly named companies, indexes, ETFs, or other securities.",
    "Do not add markdown, commentary, explanations, parameter labels, or extra keys.",
  ].join(" ")
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed.", providerCalls: 0 })

  if (Deno.env.get("K1_LOCAL_TRENDLYNE_CLASSIFICATION_ENABLED") !== "true") {
    return reply(409, { error: "K1 local Trendlyne classification is disabled.", providerCalls: 0 })
  }

  const authorization = request.headers.get("Authorization")
  if (!authorization) return reply(401, { error: "Authentication required.", providerCalls: 0 })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const mcpUrl = Deno.env.get("TRENDLYNE_MCP_URL")
  if (!supabaseUrl || !anonKey) return reply(500, { error: "Local Supabase configuration incomplete.", providerCalls: 0 })

  const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
  const auth = await user.auth.getUser()
  if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session.", providerCalls: 0 })

  let body: RequestBody
  try { body = await request.json() as RequestBody }
  catch { return reply(400, { error: "Invalid JSON body.", providerCalls: 0 }) }

  const symbols = Array.isArray(body.symbols)
    ? [...new Set(body.symbols.map(normalizedSymbol).filter(Boolean))]
    : []

  if (!symbols.length) return reply(400, { error: "symbols must contain at least one NSE symbol.", providerCalls: 0 })
  if (symbols.length > MAX_SYMBOLS) return reply(400, { error: `symbols exceeds max ${MAX_SYMBOLS}.`, providerCalls: 0 })

  const batchCount = Math.ceil(symbols.length / BATCH_SIZE)

  if (body.action === "PLAN") {
    return reply(200, {
      mode: "K1_LOCAL_TRENDLYNE_CLASSIFICATION_PLAN",
      symbols,
      symbolCount: symbols.length,
      batchSize: BATCH_SIZE,
      estimatedProviderCalls: batchCount,
      providerCalls: 0,
      productionWrites: 0,
      scoreRuns: 0,
    })
  }

  if (body.action !== "EXECUTE") {
    return reply(400, { error: "action must be PLAN or EXECUTE.", providerCalls: 0 })
  }
  if (body.confirmation !== CONFIRMATION) {
    return reply(409, { error: "Explicit owner confirmation required.", confirmation: CONFIRMATION, providerCalls: 0 })
  }
  if (!mcpUrl) return reply(409, { error: "TRENDLYNE_MCP_URL is missing.", providerCalls: 0 })

  const trendlyne = new TrendlyneObservedMcpClient(mcpUrl)
  const rows: ClassificationRow[] = []
  const rawBatches: { symbols: string[]; raw: string }[] = []
  let providerCalls = 0

  try {
    for (const batch of chunks(symbols, BATCH_SIZE)) {
      const raw = await trendlyne.getParameterValuesMultiStock(queryFor(batch), "stock")
      providerCalls += 1
      rawBatches.push({ symbols: batch, raw })
      rows.push(...coerceRows(raw, batch))
    }
  } catch (error) {
    return reply(502, {
      error: "K1 Trendlyne classification capture failed safely.",
      code: error instanceof Error ? error.message : "K1_TRENDLYNE_CLASSIFICATION_FAILED",
      providerCalls,
      partialRows: rows,
      productionWrites: 0,
    })
  }

  const bySymbol = new Map(rows.map((row) => [row.symbol, row]))
  const orderedRows = symbols.map((symbol) => bySymbol.get(symbol)).filter((row): row is ClassificationRow => Boolean(row))
  const unresolved = symbols.filter((symbol) => !bySymbol.has(symbol) || !bySymbol.get(symbol)?.sector)

  return reply(200, {
    mode: "K1_LOCAL_TRENDLYNE_CLASSIFICATION_CAPTURE_V1",
    source: "TRENDLYNE_MCP",
    capturedAt: new Date().toISOString(),
    symbolCount: symbols.length,
    batchSize: BATCH_SIZE,
    providerCalls,
    resolvedCount: orderedRows.filter((row) => Boolean(row.sector)).length,
    unresolvedCount: unresolved.length,
    unresolved,
    rows: orderedRows,
    rawBatches,
    productionWrites: 0,
    scoreRuns: 0,
    note: "Local read-only K1 classification capture. Persist the response as a review artifact; no production mutation is performed.",
  })
})
