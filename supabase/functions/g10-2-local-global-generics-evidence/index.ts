import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { AngelOneProvider, loadAngelOneConfig, type AngelDailyCandle } from "../_shared/angel-one.ts"
import { mapAngelInstruments } from "../_shared/instrument-mapping.ts"
import type { ProviderInstrument } from "../_shared/market-data.ts"
import { TrendlyneObservedMcpClient } from "../_shared/trendlyne-observed.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const CONFIRMATION = "OWNER_CONFIRMED_G10_2_LOCAL_GLOBAL_GENERICS_EVIDENCE"
const DAY = 86_400_000
const STOCKS = [
  { symbol: "AUROPHARMA", name: "Aurobindo Pharma Limited" },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories Limited" },
  { symbol: "LUPIN", name: "Lupin Limited" },
  { symbol: "ZYDUSLIFE", name: "Zydus Lifesciences Limited" },
] as const

const TRENDLYNE_QUERIES = [
  {
    code: "ANNUAL_FUNDAMENTALS",
    query: "Exact NSE stocks Aurobindo Pharma (AUROPHARMA), Dr Reddy's Laboratories (DRREDDY), Lupin (LUPIN), and Zydus Lifesciences (ZYDUSLIFE). For each stock return exact parameter labels and values for annual operating revenue, net profit/PAT, ROCE, cash from operating activities/CFO, capital expenditure/capex, free cash flow, total debt, cash and bank balance, net debt, interest coverage and EBITDA for current annual period and 1 year ago, 2 years ago, 3 years ago, 4 years ago where available. Do not substitute another company.",
  },
  {
    code: "QUARTERLY_MARGIN_HISTORY",
    query: "Exact NSE stocks Aurobindo Pharma (AUROPHARMA), Dr Reddy's Laboratories (DRREDDY), Lupin (LUPIN), and Zydus Lifesciences (ZYDUSLIFE). For each stock return exact parameter labels and values for operating profit margin OPM, operating profit and operating revenue for current quarter and 1Q ago through 8Q ago where available. Do not substitute another company.",
  },
  {
    code: "VALUATION_OWNERSHIP",
    query: "Exact NSE stocks Aurobindo Pharma (AUROPHARMA), Dr Reddy's Laboratories (DRREDDY), Lupin (LUPIN), and Zydus Lifesciences (ZYDUSLIFE). For each stock return exact parameter labels and current values for PE TTM, EV/EBITDA annual, free-cash-flow yield if available, promoter holding and promoter pledge; also return promoter holding and promoter pledge for the prior 3 completed shareholding quarters where available. Do not substitute another company.",
  },
] as const

type RequestBody = { action?: unknown; confirmation?: unknown }
type MasterRow = Readonly<Record<string, unknown>>

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function exactBenchmark(master: readonly MasterRow[]) {
  const aliases = new Set(["NIFTY PHARMA", "NIFTYPHARMA", "CNXPHARMA"])
  const matches = master.filter((row) => {
    const instrumentType = text(row.instrumenttype)?.toUpperCase()
    if (instrumentType !== "AMXIDX") return false
    const candidates = [text(row.symbol), text(row.name)].filter((value): value is string => Boolean(value))
    return candidates.some((value) => aliases.has(value.toUpperCase().replace(/\s+/g, " ").trim()))
  }).map((row) => ({
    token: text(row.token),
    exchange: text(row.exch_seg),
    symbol: text(row.symbol),
  })).filter((row) => row.token && row.exchange && row.symbol)

  const byToken = new Map(matches.map((row) => [row.token!, row]))
  if (byToken.size !== 1) throw new Error("NIFTY_PHARMA_IDENTITY_NOT_UNIQUE")
  return [...byToken.values()][0]!
}

function kolkataDateTime(ms: number) {
  const date = new Date(ms + 5.5 * 60 * 60_000)
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
}

function dayKey(value: string) {
  return value.slice(0, 10)
}

function closes(candles: readonly AngelDailyCandle[]) {
  return candles
    .map((row) => ({ date: dayKey(row.periodStart), close: Number(row.close) }))
    .filter((row) => Number.isFinite(row.close) && row.close > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function anchor(rows: readonly { date: string; close: number }[], targetMs: number) {
  const target = new Date(targetMs).toISOString().slice(0, 10)
  const eligible = rows.filter((row) => row.date <= target)
  const selected = eligible.at(-1)
  if (!selected) throw new Error("MARKET_LOOKBACK_ANCHOR_MISSING")
  if (targetMs - Date.parse(selected.date + "T00:00:00Z") > 14 * DAY) {
    throw new Error("MARKET_LOOKBACK_ANCHOR_TOO_OLD")
  }
  return selected
}

function marketMetrics(candles: readonly AngelDailyCandle[]) {
  const rows = closes(candles)
  if (rows.length < 120) throw new Error("MARKET_HISTORY_INSUFFICIENT")
  const end = rows.at(-1)!
  const endMs = Date.parse(end.date + "T00:00:00Z")
  const start12 = anchor(rows, endMs - 365 * DAY)
  const start6 = anchor(rows, endMs - 182 * DAY)
  const return12m = ((end.close / start12.close) - 1) * 100
  const return6m = ((end.close / start6.close) - 1) * 100

  const oneYear = rows.filter((row) => Date.parse(row.date + "T00:00:00Z") >= endMs - 365 * DAY)
  let peak = oneYear[0]!.close
  let worst = 0
  for (const row of oneYear) {
    if (row.close > peak) peak = row.close
    const dd = ((row.close / peak) - 1) * 100
    if (dd < worst) worst = dd
  }

  const logReturns: number[] = []
  for (let i = 1; i < oneYear.length; i += 1) {
    logReturns.push(Math.log(oneYear[i]!.close / oneYear[i - 1]!.close))
  }
  const mean = logReturns.reduce((sum, value) => sum + value, 0) / logReturns.length
  const variance = logReturns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (logReturns.length - 1)
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100

  return {
    asOfDate: end.date,
    return12mPercent: return12m,
    return6mPercent: return6m,
    maxDrawdown1YPercent: worst,
    volatility1YPercent: volatility,
    candleCount: candles.length,
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." })
  if (Deno.env.get("G10_2_LOCAL_GLOBAL_GENERICS_EVIDENCE_ENABLED") !== "true") {
    return reply(409, { error: "G10.2 local evidence acquisition is disabled.", providerCalls: 0 })
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

  if (body.action !== "PLAN" && body.action !== "EXECUTE") {
    return reply(400, { error: "action must be PLAN or EXECUTE.", providerCalls: 0 })
  }

  if (body.action === "PLAN") {
    return reply(200, {
      mode: "G10_2_GLOBAL_GENERICS_EVIDENCE_PLAN",
      providerCalls: 0,
      estimatedTrendlyneCalls: TRENDLYNE_QUERIES.length,
      estimatedAngelOneHistoryCalls: STOCKS.length + 1,
      totalEstimatedProviderCalls: TRENDLYNE_QUERIES.length + STOCKS.length + 1,
      reference: "AUROPHARMA",
      peers: STOCKS.slice(1).map((item) => item.symbol),
      benchmark: "NIFTY_PHARMA",
      productionWrites: 0,
      scoreRuns: 0,
    })
  }

  if (body.confirmation !== CONFIRMATION) {
    return reply(409, { error: "Explicit owner confirmation is required.", confirmation: CONFIRMATION, providerCalls: 0 })
  }
  if (!mcpUrl) return reply(409, { error: "TRENDLYNE_MCP_URL is missing.", providerCalls: 0 })

  try {
    const trendlyne = new TrendlyneObservedMcpClient(mcpUrl)
    const trendlyneResults: Record<string, string> = {}
    for (const item of TRENDLYNE_QUERIES) {
      trendlyneResults[item.code] = await trendlyne.getParameterValuesMultiStock(item.query, "stock")
    }

    const masterResponse = await fetch("https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json")
    if (!masterResponse.ok) throw new Error("ANGEL_INSTRUMENT_MASTER_FAILED")
    const master = await masterResponse.json() as readonly MasterRow[]
    const retrievedAt = new Date().toISOString()

    const mapped = mapAngelInstruments(
      STOCKS.map((stock) => ({
        id: stock.symbol,
        symbol: stock.symbol,
        exchange: "NSE",
        assetClass: "EQUITY",
      })),
      master,
      retrievedAt,
    )
    const unresolved = mapped.filter((row) => row.mappingStatus !== "VERIFIED" || !row.providerInstrumentId || !row.exchange || !row.tradingSymbol)
    if (unresolved.length) {
      return reply(409, {
        error: "One or more peer Angel One identities did not resolve exactly.",
        unresolved: unresolved.map((row) => ({ securityId: row.securityId, status: row.mappingStatus, evidence: row.evidence })),
        providerCalls: TRENDLYNE_QUERIES.length,
      })
    }

    const provider = new AngelOneProvider(loadAngelOneConfig())
    const now = Date.now()
    const from = kolkataDateTime(now - 400 * DAY)
    const to = kolkataDateTime(now)

    const market: Record<string, ReturnType<typeof marketMetrics>> = {}
    for (const mapping of mapped) {
      const instrument: ProviderInstrument = {
        mappingId: mapping.securityId,
        securityId: mapping.securityId,
        providerInstrumentId: mapping.providerInstrumentId!,
        exchange: mapping.exchange!,
        tradingSymbol: mapping.tradingSymbol!,
      }
      const candles = await provider.getDailyHistory(instrument, from, to)
      market[mapping.securityId] = marketMetrics(candles)
    }

    const benchmark = exactBenchmark(master)
    const benchmarkCandles = await provider.getDailyHistory({
      mappingId: "NIFTY_PHARMA",
      securityId: "NIFTY_PHARMA",
      providerInstrumentId: benchmark.token!,
      exchange: benchmark.exchange!,
      tradingSymbol: benchmark.symbol!,
    }, from, to)
    const benchmarkMetrics = marketMetrics(benchmarkCandles)

    const auro = market.AUROPHARMA
    const relativeStrength12mPercent = auro.return12mPercent - benchmarkMetrics.return12mPercent
    const relativeVolatility = auro.volatility1YPercent / benchmarkMetrics.volatility1YPercent

    return reply(200, {
      mode: "G10_2_GLOBAL_GENERICS_EVIDENCE_CAPTURE",
      providerCalls: TRENDLYNE_QUERIES.length + STOCKS.length + 1,
      trendlyneCalls: TRENDLYNE_QUERIES.length,
      angelOneHistoryCalls: STOCKS.length + 1,
      reference: "AUROPHARMA",
      peers: STOCKS.slice(1).map((item) => item.symbol),
      benchmark: "NIFTY_PHARMA",
      trendlyneResults,
      market,
      benchmarkMarket: benchmarkMetrics,
      auropharmaRelativeStrength12mPercent: relativeStrength12mPercent,
      auropharmaRelativeVolatilityRatio: relativeVolatility,
      productionWrites: 0,
      scoreRuns: 0,
      note: "Read-only local evidence capture. No canonical evidence promotion, score persistence, recommendation persistence, position sizing, deployment or PR merge.",
    })
  } catch (error) {
    return reply(502, {
      error: "G10.2 local evidence acquisition failed safely.",
      code: error instanceof Error ? error.message : "G10_2_LOCAL_EVIDENCE_FAILED",
    })
  }
})
