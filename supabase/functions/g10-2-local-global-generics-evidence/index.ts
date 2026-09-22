import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
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

const PUBLIC_MARKET_SYMBOLS = {
  AUROPHARMA: "AUROPHARMA.NS",
  DRREDDY: "DRREDDY.NS",
  LUPIN: "LUPIN.NS",
  ZYDUSLIFE: "ZYDUSLIFE.NS",
  NIFTY_PHARMA: "^CNXPHARMA",
} as const

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

interface PublicDailyCandle {
  readonly periodStart: string
  readonly close: number
}

async function fetchPublicMarketHistory(ticker: string): Promise<PublicDailyCandle[]> {
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/"
    + encodeURIComponent(ticker)
    + "?range=2y&interval=1d&events=history&includeAdjustedClose=false"

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PortfolioAI/1.0",
    },
  })
  if (!response.ok) throw new Error("PUBLIC_MARKET_HTTP_" + response.status)

  const payload = await response.json() as {
    readonly chart?: {
      readonly result?: readonly {
        readonly timestamp?: readonly number[]
        readonly indicators?: {
          readonly quote?: readonly {
            readonly close?: readonly (number | null)[]
          }[]
        }
      }[]
      readonly error?: unknown
    }
  }

  if (payload.chart?.error) throw new Error("PUBLIC_MARKET_PROVIDER_ERROR")
  const result = payload.chart?.result?.[0]
  const timestamps = result?.timestamp ?? []
  const quote = result?.indicators?.quote?.[0]
  const close = quote?.close ?? []
  const rows: PublicDailyCandle[] = []

  for (let index = 0; index < timestamps.length; index += 1) {
    const timestamp = timestamps[index]
    const value = close[index]
    if (!Number.isFinite(timestamp) || !Number.isFinite(value) || Number(value) <= 0) continue
    rows.push({
      periodStart: new Date(Number(timestamp) * 1000).toISOString(),
      close: Number(value),
    })
  }

  if (rows.length < 120) throw new Error("PUBLIC_MARKET_HISTORY_INSUFFICIENT")
  return rows.sort((a, b) => a.periodStart.localeCompare(b.periodStart))
}

function closes(candles: readonly PublicDailyCandle[]) {
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

function marketMetrics(candles: readonly PublicDailyCandle[]) {
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
      estimatedPublicMarketHistoryCalls: STOCKS.length + 1,
      totalEstimatedExternalReads: TRENDLYNE_QUERIES.length + STOCKS.length + 1,
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

  const trendlyneResults: Record<string, string> = {}
  try {
    const trendlyne = new TrendlyneObservedMcpClient(mcpUrl)
    for (const item of TRENDLYNE_QUERIES) {
      trendlyneResults[item.code] = await trendlyne.getParameterValuesMultiStock(item.query, "stock")
    }

    const market: Record<string, ReturnType<typeof marketMetrics>> = {}
    for (const stock of STOCKS) {
      const ticker = PUBLIC_MARKET_SYMBOLS[stock.symbol]
      const candles = await fetchPublicMarketHistory(ticker)
      market[stock.symbol] = marketMetrics(candles)
    }

    const benchmarkCandles = await fetchPublicMarketHistory(PUBLIC_MARKET_SYMBOLS.NIFTY_PHARMA)
    const benchmarkMetrics = marketMetrics(benchmarkCandles)

    const auro = market.AUROPHARMA
    const relativeStrength12mPercent =
      auro.return12mPercent - benchmarkMetrics.return12mPercent
    const relativeVolatility =
      auro.volatility1YPercent / benchmarkMetrics.volatility1YPercent

    return reply(200, {
      mode: "G10_2_GLOBAL_GENERICS_EVIDENCE_CAPTURE",
      externalReads: TRENDLYNE_QUERIES.length + STOCKS.length + 1,
      trendlyneCalls: TRENDLYNE_QUERIES.length,
      publicMarketHistoryCalls: STOCKS.length + 1,
      marketHistorySource: "YAHOO_FINANCE_PUBLIC_CHART",
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
      completedTrendlyneCalls: Object.keys(trendlyneResults).length,
      partialTrendlyneResults:
        Object.keys(trendlyneResults).length ? trendlyneResults : undefined,
    })
  }})
