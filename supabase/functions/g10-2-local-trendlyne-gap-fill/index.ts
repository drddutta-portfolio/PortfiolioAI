import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { TrendlyneObservedMcpClient } from "../_shared/trendlyne-observed.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const CONFIRMATION = "OWNER_CONFIRMED_G10_2_TRENDLYNE_GAP_FILL"

type RequestBody = { action?: unknown; confirmation?: unknown }

const STOCK_QUERY = [
  "Exact NSE stocks Aurobindo Pharma (AUROPHARMA), Dr Reddy's Laboratories (DRREDDY), Lupin (LUPIN), and Zydus Lifesciences (ZYDUSLIFE).",
  "Return exact Trendlyne parameter labels and current values for each stock for the following only:",
  "operating revenue 1 year growth %, operating revenue 3 year CAGR %, PE TTM, EV/EBITDA annual, free cash flow yield if available,",
  "6 month stock price return %, 1 year stock price return %, 1 year beta, 1 year volatility or closest available volatility parameter,",
  "maximum drawdown 1 year if available, RSI, MACD, and Trendlyne Momentum score if available.",
  "Do not substitute another company. Do not return unrelated parameters.",
].join(" ")

const INDEX_QUERY = [
  "Exact index NIFTY Pharma.",
  "Return exact Trendlyne parameter labels and current values for 6 month return % and 1 year return % only.",
  "Do not substitute another index.",
].join(" ")

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
  if (!supabaseUrl || !anonKey || !mcpUrl) {
    return reply(500, { error: "Local configuration incomplete.", providerCalls: 0 })
  }

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
      mode: "G10_2_TRENDLYNE_GAP_FILL_PLAN",
      providerCalls: 0,
      estimatedProviderCalls: 2,
      stockCall: "missing structured market/valuation/growth/risk parameters",
      indexCall: "NIFTY Pharma 6M/1Y returns",
      productionWrites: 0,
      scoreRuns: 0,
    })
  }

  if (body.confirmation !== CONFIRMATION) {
    return reply(409, { error: "Explicit confirmation required.", confirmation: CONFIRMATION, providerCalls: 0 })
  }

  try {
    const trendlyne = new TrendlyneObservedMcpClient(mcpUrl)
    const stocks = await trendlyne.getParameterValuesMultiStock(STOCK_QUERY, "stock")
    const index = await trendlyne.getParameterValuesMultiStock(INDEX_QUERY, "index")
    return reply(200, {
      mode: "G10_2_TRENDLYNE_GAP_FILL_CAPTURE",
      providerCalls: 2,
      stockResult: stocks,
      indexResult: index,
      productionWrites: 0,
      scoreRuns: 0,
    })
  } catch (error) {
    return reply(502, {
      error: "G10.2 Trendlyne gap-fill failed safely.",
      code: error instanceof Error ? error.message : "G10_2_TRENDLYNE_GAP_FILL_FAILED",
    })
  }
})
