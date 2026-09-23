import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { AngelOneProvider, loadAngelOneConfig, type AngelDailyCandle } from "../_shared/angel-one.ts"
import { MARKET_DATA_PROVIDER, type ProviderInstrument } from "../_shared/market-data.ts"
import { SafeOperationalError, safeError } from "../_shared/security.ts"
import { isBankBenchmarkEligibleClassification } from "../_shared/bank-benchmark-authority.ts"

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" }
const BENCHMARK_CODE = "NIFTY_BANK"
const BENCHMARK_NAME = "NIFTY Bank"
const HISTORY_DAYS = 400
const DAY = 86_400_000
const CONFIRMATION = "OWNER_CONFIRMED_BANK_BENCHMARK_REFRESH"
const LEASE_SECONDS = 300
const COOLDOWN_SECONDS = 60
const ACCEPTED_ALIASES = new Set(["NIFTY BANK", "BANKNIFTY"])
const REQUIRED_INDEX_INSTRUMENT_TYPE = "AMXIDX"

type Admin = ReturnType<typeof createClient>
type Body = { readonly action?: unknown; readonly portfolioId?: unknown; readonly securityId?: unknown; readonly confirmation?: unknown }
type MasterRow = Readonly<Record<string, unknown>>
type PriceRow = { readonly period_start: string; readonly open: number | string; readonly high: number | string; readonly low: number | string; readonly close: number | string; readonly volume: number | string | null; readonly retrieved_at: string }

function json(status: number, body: Readonly<Record<string, unknown>>) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } })
}
function text(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null }
function kolkataDateTime(date: Date) { const local = new Date(date.getTime() + 5.5 * 60 * 60_000); return `${local.toISOString().slice(0, 10)} ${local.toISOString().slice(11, 16)}` }
function dayKey(value: string) { return value.slice(0, 10) }

function exactBenchmark(master: readonly MasterRow[]) {
  const matches = master.filter((row) => {
    const exchange = text(row.exch_seg)?.toUpperCase()
    const instrumentType = text(row.instrumenttype)?.toUpperCase()
    if (exchange !== "NSE" || instrumentType !== REQUIRED_INDEX_INSTRUMENT_TYPE) return false
    const name = text(row.name)?.toUpperCase() ?? ""
    const symbol = text(row.symbol)?.toUpperCase() ?? ""
    return ACCEPTED_ALIASES.has(name) || ACCEPTED_ALIASES.has(symbol)
  }).map((row) => ({ token: text(row.token), exchange: text(row.exch_seg), symbol: text(row.symbol), name: text(row.name), instrumentType: text(row.instrumenttype) }))
    .filter((row) => row.token && row.exchange && row.symbol)
  const byToken = new Map(matches.map((row) => [row.token!, row]))
  if (byToken.size !== 1) throw new SafeOperationalError("BENCHMARK_IDENTITY_AMBIGUOUS", "NIFTY Bank could not be resolved to exactly one Angel One AMXIDX instrument.", 409)
  return [...byToken.values()][0]!
}

function relativeStrength(stock: readonly PriceRow[], benchmark: readonly AngelDailyCandle[]) {
  const stockByDay = new Map(stock.map((row) => [dayKey(row.period_start), Number(row.close)]))
  const benchmarkByDay = new Map(benchmark.map((row) => [dayKey(row.periodStart), Number(row.close)]))
  const common = [...stockByDay.keys()].filter((day) => benchmarkByDay.has(day)).sort()
  if (common.length < 120) throw new SafeOperationalError("BENCHMARK_OVERLAP_INSUFFICIENT", "Insufficient overlapping stock and NIFTY Bank history.", 409)
  const end = common.at(-1)!
  const endMs = Date.parse(`${end}T00:00:00Z`)
  const targetMs = endMs - 365 * DAY
  const start = common.find((day) => Date.parse(`${day}T00:00:00Z`) >= targetMs)
  if (!start || Date.parse(`${start}T00:00:00Z`) - targetMs > 14 * DAY) throw new SafeOperationalError("BENCHMARK_LOOKBACK_INSUFFICIENT", "A valid 12-month common benchmark anchor is unavailable.", 409)
  const stockStart = stockByDay.get(start)!, stockEnd = stockByDay.get(end)!, benchmarkStart = benchmarkByDay.get(start)!, benchmarkEnd = benchmarkByDay.get(end)!
  if (![stockStart, stockEnd, benchmarkStart, benchmarkEnd].every((value) => Number.isFinite(value) && value > 0)) throw new SafeOperationalError("BENCHMARK_PRICE_INVALID", "Benchmark-relative return could not be derived safely.", 409)
  const stockReturn = ((stockEnd / stockStart) - 1) * 100
  const benchmarkReturn = ((benchmarkEnd / benchmarkStart) - 1) * 100
  return { start, end, stockReturn, benchmarkReturn, relativeStrength: stockReturn - benchmarkReturn, stockStart, stockEnd, benchmarkStart, benchmarkEnd }
}

async function acquireLease(admin: Admin, portfolioId: string, holder: string) {
  const { data, error } = await admin.rpc("acquire_market_data_operation_lease", { p_portfolio_id: portfolioId, p_provider_code: MARKET_DATA_PROVIDER, p_operation: "REFRESH_HISTORY", p_lease_holder: holder, p_lease_seconds: LEASE_SECONDS })
  if (error) throw new SafeOperationalError("LEASE_ACQUIRE_FAILED", "Benchmark refresh could not be started.")
  const row = Array.isArray(data) ? data[0] as { acquired?: unknown } | undefined : undefined
  if (row?.acquired !== true) throw new SafeOperationalError("MARKET_DATA_RATE_LIMITED", "Another market-history operation is running or cooling down.", 429)
}
async function releaseLease(admin: Admin, portfolioId: string, holder: string) {
  const { error } = await admin.rpc("release_market_data_operation_lease", { p_portfolio_id: portfolioId, p_provider_code: MARKET_DATA_PROVIDER, p_operation: "REFRESH_HISTORY", p_lease_holder: holder, p_cooldown_seconds: COOLDOWN_SECONDS })
  if (error) throw new SafeOperationalError("LEASE_RELEASE_FAILED", "Benchmark refresh completed but its cooldown could not be recorded.")
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (request.method !== "POST") return json(405, { error: "Method not allowed." })
  const authorization = request.headers.get("Authorization")
  if (!authorization) return json(401, { error: "Authentication required." })
  const supabaseUrl = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY"), serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json(500, { error: "Supabase server configuration is incomplete." })

  try {
    const body = await request.json() as Body
    if (body.action !== "PLAN" && body.action !== "EXECUTE") return json(400, { error: "action must be PLAN or EXECUTE." })
    if (typeof body.portfolioId !== "string" || typeof body.securityId !== "string") return json(400, { error: "portfolioId and securityId are required." })
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await userClient.auth.getUser()
    if (auth.error || !auth.data.user) return json(401, { error: "Invalid authenticated session." })
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    const portfolio = await admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", auth.data.user.id).single()
    if (portfolio.error || !portfolio.data) return json(404, { error: "Portfolio not found." })
    const holding = await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id", body.portfolioId).eq("security_id", body.securityId).maybeSingle()
    if (holding.error || !holding.data || /^[-+]?0(?:\.0+)?$/u.test(String(holding.data.current_quantity))) return json(403, { error: "Benchmark refresh is limited to open holdings." })
    const security = await admin.from("securities").select("id,symbol,name,asset_class").eq("id", body.securityId).single()
    if (security.error || !security.data || security.data.asset_class !== "EQUITY") return json(409, { error: "Bank benchmark refresh requires an equity security." })
    const classification = await admin.from("current_security_enrichment_v1").select("sector,industry").eq("security_id", body.securityId).maybeSingle()
    if (classification.error || !classification.data) return json(409, { error: "Reviewed sector/industry classification is required before bank benchmark refresh." })
    if (!isBankBenchmarkEligibleClassification(classification.data.sector, classification.data.industry)) return json(409, { error: "NIFTY Bank benchmark refresh is available only to the approved BANK methodology classifications (Banking + Banks / Private Sector Bank). NBFC_LENDING requires its own approved benchmark authority." })
    const stockHistory = await admin.from("market_price_history").select("period_start,open,high,low,close,volume,retrieved_at").eq("security_id", body.securityId).eq("provider_code", MARKET_DATA_PROVIDER).eq("interval", "ONE_DAY").order("period_start", { ascending: true })
    if (stockHistory.error) throw stockHistory.error
    const stockRows = (stockHistory.data ?? []) as PriceRow[]
    if (stockRows.length < 120) return json(409, { error: "Refresh the bank stock market history first; at least 120 daily observations are required." })
    const latestBenchmark = await admin.from("market_benchmark_price_history").select("period_start").eq("benchmark_code", BENCHMARK_CODE).eq("provider_code", MARKET_DATA_PROVIDER).eq("interval", "ONE_DAY").order("period_start", { ascending: false }).limit(1).maybeSingle()
    if (latestBenchmark.error) throw latestBenchmark.error

    if (body.action === "PLAN") return json(200, { mode: "BANK_BENCHMARK_REFRESH_PLAN", providerCalls: 0, estimatedProviderCalls: 1, benchmark: BENCHMARK_NAME, benchmarkCode: BENCHMARK_CODE, historyDays: HISTORY_DAYS, latestBenchmarkCandle: latestBenchmark.data?.period_start ?? null, stockHistoryObservations: stockRows.length, metricAfterRefresh: "RELATIVE_STRENGTH_12M", note: "Planning uses zero Angel One historical calls. Execution resolves the NIFTY Bank AMXIDX instrument exactly from the current Angel One master before fetching history." })
    if (body.confirmation !== CONFIRMATION) return json(409, { error: "Explicit owner confirmation is required.", providerCalls: 0 })

    const holder = crypto.randomUUID()
    await acquireLease(admin, body.portfolioId, holder)
    const run = await admin.from("market_data_refresh_runs").insert({ portfolio_id: body.portfolioId, provider_code: MARKET_DATA_PROVIDER, requested_by: auth.data.user.id, status: "RUNNING", requested_security_count: 1, metadata: { operation: "REFRESH_BANK_BENCHMARK", security_id: body.securityId, symbol: security.data.symbol, benchmark: BENCHMARK_CODE, history_days: HISTORY_DAYS } }).select("id").single()
    if (run.error) throw run.error
    try {
      const masterResponse = await fetch("https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json")
      if (!masterResponse.ok) throw new SafeOperationalError("BENCHMARK_MASTER_FAILED", "Angel One instrument master could not be loaded.", 502)
      const master = await masterResponse.json() as readonly MasterRow[]
      const resolved = exactBenchmark(master)
      const verifiedAt = new Date().toISOString()
      const mapping = await admin.from("market_benchmarks").upsert({ code: BENCHMARK_CODE, name: BENCHMARK_NAME, provider_code: MARKET_DATA_PROVIDER, provider_instrument_id: resolved.token, exchange: resolved.exchange, trading_symbol: resolved.symbol, mapping_status: "VERIFIED", mapping_evidence: { method: "Exact NSE AMXIDX alias match in Angel One instrument master", accepted_aliases: [...ACCEPTED_ALIASES], required_instrument_type: REQUIRED_INDEX_INSTRUMENT_TYPE, candidate: resolved, instrument_master_retrieved_at: verifiedAt, mapping_version: "nifty-bank-v2" }, verified_at: verifiedAt, updated_at: verifiedAt }, { onConflict: "code" })
      if (mapping.error) throw mapping.error

      const to = new Date(), from = new Date(to.getTime() - HISTORY_DAYS * DAY)
      const instrument: ProviderInstrument = { mappingId: BENCHMARK_CODE, securityId: body.securityId, providerInstrumentId: resolved.token!, exchange: resolved.exchange!, tradingSymbol: resolved.symbol! }
      const candles = await new AngelOneProvider(loadAngelOneConfig()).getDailyHistory(instrument, kolkataDateTime(from), kolkataDateTime(to))
      if (candles.length < 120) throw new SafeOperationalError("BENCHMARK_HISTORY_EMPTY", "Angel One returned insufficient NIFTY Bank daily history.", 502)
      const history = await admin.from("market_benchmark_price_history").upsert(candles.map((candle) => ({ benchmark_code: BENCHMARK_CODE, provider_code: MARKET_DATA_PROVIDER, interval: "ONE_DAY", period_start: candle.periodStart, open: candle.open, high: candle.high, low: candle.low, close: candle.close, volume: candle.volume, retrieved_at: candle.retrievedAt, provenance: { endpoint: "/rest/secure/angelbroking/historical/v1/getCandleData", benchmark_code: BENCHMARK_CODE, exchange: resolved.exchange, trading_symbol: resolved.symbol, symbol_token: resolved.token, requested_from: kolkataDateTime(from), requested_to: kolkataDateTime(to) } })), { onConflict: "benchmark_code,provider_code,interval,period_start" })
      if (history.error) throw history.error

      const derived = relativeStrength(stockRows, candles)
      const retrievedAt = candles.at(-1)!.retrievedAt
      const metric = await admin.from("market_metric_observations").upsert({ security_id: body.securityId, provider_code: MARKET_DATA_PROVIDER, metric_code: "RELATIVE_STRENGTH_12M", numeric_value: derived.relativeStrength, unit: "PERCENTAGE_POINTS", as_of_date: derived.end, lookback_start: derived.start, lookback_end: derived.end, retrieved_at: retrievedAt, fresh_until: new Date(Date.parse(retrievedAt) + 48 * 60 * 60_000).toISOString(), evidence_status: "AVAILABLE", derivation: { method: "STOCK_12M_RETURN_MINUS_BENCHMARK_12M_RETURN", benchmark_code: BENCHMARK_CODE, common_start: derived.start, common_end: derived.end, stock_return_percent: derived.stockReturn, benchmark_return_percent: derived.benchmarkReturn, stock_start_close: derived.stockStart, stock_end_close: derived.stockEnd, benchmark_start_close: derived.benchmarkStart, benchmark_end_close: derived.benchmarkEnd, source_provider: MARKET_DATA_PROVIDER, benchmark_candles: candles.length, stock_observations: stockRows.length } }, { onConflict: "security_id,provider_code,metric_code,as_of_date" })
      if (metric.error) throw metric.error

      await admin.from("market_data_refresh_runs").update({ status: "SUCCEEDED", completed_at: new Date().toISOString(), fetched_security_count: 1, metadata: { operation: "REFRESH_BANK_BENCHMARK", security_id: body.securityId, symbol: security.data.symbol, benchmark: BENCHMARK_CODE, benchmark_candles: candles.length, relative_strength_12m: derived.relativeStrength, stock_return_12m: derived.stockReturn, benchmark_return_12m: derived.benchmarkReturn } }).eq("id", run.data.id)
      return json(200, { mode: "BANK_BENCHMARK_REFRESH", runId: run.data.id, providerCalls: 1, benchmark: BENCHMARK_NAME, benchmarkCandlesStored: candles.length, relativeStrength12M: derived.relativeStrength, stockReturn12M: derived.stockReturn, benchmarkReturn12M: derived.benchmarkReturn, commonStart: derived.start, commonEnd: derived.end, note: "Relative strength is deterministic stock return minus NIFTY Bank return. No official score run or portfolio mutation was performed." })
    } catch (error) {
      const operational = safeError(error)
      await admin.from("market_data_refresh_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), failed_security_count: 1, error_summary: operational.code }).eq("id", run.data.id)
      throw error
    } finally {
      await releaseLease(admin, body.portfolioId, holder)
    }
  } catch (error) {
    const operational = safeError(error)
    return json(operational.status, { error: operational.message, code: operational.code })
  }
})
