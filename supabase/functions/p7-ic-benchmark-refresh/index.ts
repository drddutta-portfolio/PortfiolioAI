import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { AngelOneProvider, loadAngelOneConfig } from "../_shared/angel-one.ts"
import {
  buildBenchmarkExecutionPlan,
  P7_IC_BENCHMARK_REGISTRY,
  resolveAngelOneBenchmarkInstrument,
  type BenchmarkCacheState,
  type P7IcBenchmarkCode,
} from "../_shared/p7-ic-benchmark-adapter.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const DEV_REF = "lrgpjimipfkyoqbpsqzz"
const PROD_REF = "uxiyufbsbgzzdujzcdxe"
const PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
const CONFIRMATION = "OWNER_CONFIRMED_P7_IC2_BENCHMARK_REFRESH"
const DAY = 86_400_000

type Body = {
  readonly action?: unknown
  readonly portfolioId?: unknown
  readonly benchmarkCodes?: unknown
  readonly confirmation?: unknown
}

function projectRef(value: string) {
  try { return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1] ?? null } catch { return null }
}
function kolkataDateTime(date: Date) {
  const local = new Date(date.getTime() + 5.5 * 60 * 60_000)
  return `${local.toISOString().slice(0, 10)} ${local.toISOString().slice(11, 16)}`
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return json(405, { error: "Method not allowed." })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceKey) return json(500, { error: "Supabase server configuration is incomplete." })

  const ref = projectRef(supabaseUrl)
  if (ref === PROD_REF) return json(409, { error: "P7-IC benchmark refresh refuses Production.", code: "UNEXPECTED_PRODUCTION_DB_TARGET", providerCalls: 0 })
  if (ref !== DEV_REF) return json(409, { error: "P7-IC benchmark refresh requires PortfolioAI Dev.", code: "UNAPPROVED_DEVELOPMENT_DB_TARGET", providerCalls: 0 })

  try {
    const body = await request.json() as Body
    if (body.action !== "P7_IC2_PLAN" && body.action !== "P7_IC2_EXECUTE") return json(400, { error: "Unknown action.", providerCalls: 0 })
    if (body.portfolioId !== PORTFOLIO_ID) return json(409, { error: "Frozen Development portfolio is required.", providerCalls: 0 })

    const requested = Array.isArray(body.benchmarkCodes) && body.benchmarkCodes.every(code => typeof code === "string")
      ? [...new Set(body.benchmarkCodes as string[])]
      : []
    const allowed = new Set(P7_IC_BENCHMARK_REGISTRY.map(item => item.code))
    if (!requested.length || requested.length > P7_IC_BENCHMARK_REGISTRY.length || requested.some(code => !allowed.has(code as P7IcBenchmarkCode))) {
      return json(400, { error: "One to 22 approved benchmark codes are required.", providerCalls: 0 })
    }

    const authorization = request.headers.get("Authorization")
    if (!authorization) return json(401, { error: "Authentication required.", providerCalls: 0 })
    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return json(401, { error: "Invalid authenticated session.", providerCalls: 0 })

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    const portfolio = await admin.from("portfolios").select("id").eq("id", PORTFOLIO_ID).eq("user_id", auth.data.user.id).single()
    if (portfolio.error) return json(404, { error: "Portfolio not found.", providerCalls: 0 })

    const [mappingResult, historyResult, anchorResult] = await Promise.all([
      admin.from("market_benchmarks").select("code,mapping_status").in("code", requested),
      admin.from("market_benchmark_price_history").select("benchmark_code,period_start").in("benchmark_code", requested)
        .eq("provider_code", "ANGEL_ONE").eq("interval", "ONE_DAY"),
      admin.from("current_holdings").select("security_id").eq("portfolio_id", PORTFOLIO_ID).limit(1).single(),
    ])
    if (mappingResult.error || historyResult.error || anchorResult.error) throw new Error("P7_IC2_BENCHMARK_CACHE_READ_FAILED")

    const mappingByCode = new Map((mappingResult.data ?? []).map(row => [row.code, row.mapping_status]))
    const historyByCode = new Map<string, string[]>()
    for (const row of historyResult.data ?? []) {
      const list = historyByCode.get(row.benchmark_code) ?? []
      list.push(String(row.period_start).slice(0, 10))
      historyByCode.set(row.benchmark_code, list)
    }

    const cache: BenchmarkCacheState[] = requested.map(code => {
      const days = (historyByCode.get(code) ?? []).sort()
      return {
        code: code as P7IcBenchmarkCode,
        mappingStatus: mappingByCode.get(code) === "VERIFIED" ? "VERIFIED" : mappingByCode.has(code) ? "UNRESOLVED" : "MISSING",
        earliestStoredCandle: days[0] ?? null,
        latestStoredCandle: days.at(-1) ?? null,
      }
    })
    const plan = buildBenchmarkExecutionPlan({
      requiredCodes: requested as P7IcBenchmarkCode[],
      cache,
      asOfDate: new Date().toISOString().slice(0, 10),
    })

    if (body.action === "P7_IC2_PLAN") return json(200, { mode: "P7_IC2_BENCHMARK_PLAN", providerCalls: 0, ...plan })
    if (body.confirmation !== CONFIRMATION) return json(409, { error: "Exact P7-IC IC2 benchmark owner confirmation is required.", providerCalls: 0 })

    const holder = crypto.randomUUID()
    const lease = await admin.rpc("acquire_market_data_operation_lease", {
      p_portfolio_id: PORTFOLIO_ID,
      p_provider_code: "ANGEL_ONE",
      p_operation: "REFRESH_HISTORY",
      p_lease_holder: holder,
      p_lease_seconds: 900,
    })
    if (lease.error || lease.data?.[0]?.acquired !== true) return json(429, { error: "Another market-history operation is active.", providerCalls: 0 })

    let providerCalls = 0
    try {
      let master: readonly Record<string, unknown>[] = []
      if (plan.sharedInstrumentMasterFetches) {
        const response = await fetch("https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json")
        if (!response.ok) throw new Error("P7_IC2_BENCHMARK_MASTER_FAILED")
        master = await response.json() as readonly Record<string, unknown>[]
      }

      const provider = new AngelOneProvider(loadAngelOneConfig())
      const results: Record<string, unknown>[] = []
      for (const item of plan.plans) {
        let mapping = cache.find(row => row.code === item.code)?.mappingStatus === "VERIFIED"
          ? null
          : resolveAngelOneBenchmarkInstrument(item.code, master)

        if (mapping) {
          const definition = P7_IC_BENCHMARK_REGISTRY.find(row => row.code === item.code)!
          const upsert = await admin.from("market_benchmarks").upsert({
            code: item.code,
            name: definition.displayName,
            provider_code: "ANGEL_ONE",
            provider_instrument_id: mapping.token,
            exchange: mapping.exchange,
            trading_symbol: mapping.symbol,
            mapping_status: "VERIFIED",
            mapping_evidence: { method: mapping.resolutionBasis, adapter_version: "P7_IC_BENCHMARK_ADAPTER_V1" },
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "code" })
          if (upsert.error) throw upsert.error
        }

        if (item.providerCalls === 0) {
          results.push({ code: item.code, status: "CACHE_REUSED" })
          continue
        }

        if (!mapping) {
          const current = await admin.from("market_benchmarks")
            .select("provider_instrument_id,exchange,trading_symbol").eq("code", item.code).single()
          if (current.error || !current.data.provider_instrument_id || !current.data.trading_symbol) throw new Error("P7_IC2_BENCHMARK_MAPPING_MISSING")
          mapping = {
            code: item.code,
            token: String(current.data.provider_instrument_id),
            exchange: "NSE",
            symbol: String(current.data.trading_symbol),
            name: null,
            instrumentType: "AMXIDX",
            resolutionBasis: "EXACT_NORMALIZED_ALIAS",
          }
        }

        const from = new Date(String(item.requestFrom) + "T00:00:00Z")
        const to = new Date(String(item.requestTo) + "T00:00:00Z")
        const candles = await provider.getDailyHistory({
          mappingId: item.code,
          securityId: String(anchorResult.data.security_id),
          providerInstrumentId: mapping.token,
          exchange: mapping.exchange,
          tradingSymbol: mapping.symbol,
        }, kolkataDateTime(from), kolkataDateTime(new Date(to.getTime() + DAY - 1)))
        providerCalls += 1
        if (candles.length < 120) throw new Error("P7_IC2_BENCHMARK_HISTORY_INSUFFICIENT")

        const inserted = await admin.from("market_benchmark_price_history").upsert(candles.map(candle => ({
          benchmark_code: item.code,
          provider_code: "ANGEL_ONE",
          interval: "ONE_DAY",
          period_start: candle.periodStart,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          retrieved_at: candle.retrievedAt,
          provenance: {
            adapter_version: "P7_IC_BENCHMARK_ADAPTER_V1",
            requested_from: item.requestFrom,
            requested_to: item.requestTo,
          },
        })), { onConflict: "benchmark_code,provider_code,interval,period_start" })
        if (inserted.error) throw inserted.error
        results.push({ code: item.code, status: "REFRESHED", candles: candles.length })
        if (item !== plan.plans.at(-1)) await new Promise(resolve => setTimeout(resolve, 1_500))
      }
      return json(200, {
        mode: "P7_IC2_BENCHMARK_REFRESH",
        providerCalls,
        sharedInstrumentMasterFetches: plan.sharedInstrumentMasterFetches,
        results,
      })
    } finally {
      await admin.rpc("release_market_data_operation_lease", {
        p_portfolio_id: PORTFOLIO_ID,
        p_provider_code: "ANGEL_ONE",
        p_operation: "REFRESH_HISTORY",
        p_lease_holder: holder,
        p_cooldown_seconds: 0,
      })
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : "P7_IC2_BENCHMARK_REFRESH_FAILED"
    return json(500, { error: "P7-IC benchmark refresh failed safely.", code, providerCalls: 0 })
  }
})
