import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { TrendlyneObservedMcpClient } from "../_shared/trendlyne-observed.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const CONFIRMATION = "OWNER_CONFIRMED_K1_TRENDLYNE_CAPABILITY_DISCOVERY"

type RequestBody = {
  action?: unknown
  confirmation?: unknown
}

const MATCH_TERMS = [
  "sector",
  "industry",
  "classification",
  "company profile",
  "profile",
  "metadata",
  "security master",
  "security metadata",
  "stock details",
  "company details",
]

function normalizeTool(value: unknown) {
  if (!value || typeof value !== "object") return null
  const item = value as Record<string, unknown>
  const name = typeof item.name === "string" ? item.name : null
  if (!name) return null
  const description = typeof item.description === "string" ? item.description : ""
  const inputSchema = item.inputSchema && typeof item.inputSchema === "object" ? item.inputSchema : null
  const haystack = JSON.stringify({ name, description, inputSchema }).toLowerCase()
  const matches = MATCH_TERMS.filter((term) => haystack.includes(term))
  return {
    name,
    description,
    inputSchema,
    relevantToClassification: matches.length > 0,
    matchedTerms: matches,
  }
}

function extractTools(payload: unknown): unknown[] {
  if (!payload || typeof payload !== "object") return []
  const item = payload as Record<string, unknown>
  if (Array.isArray(item.tools)) return item.tools
  if (item.result && typeof item.result === "object" && Array.isArray((item.result as Record<string, unknown>).tools)) {
    return (item.result as { tools: unknown[] }).tools
  }
  return []
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed.", providerCalls: 0 })

  if (Deno.env.get("K1_LOCAL_TRENDLYNE_CAPABILITY_DISCOVERY_ENABLED") !== "true") {
    return reply(409, { error: "K1 Trendlyne capability discovery is disabled.", providerCalls: 0 })
  }

  const authorization = request.headers.get("Authorization")
  if (!authorization) return reply(401, { error: "Authentication required.", providerCalls: 0 })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const mcpUrl = Deno.env.get("TRENDLYNE_MCP_URL")
  if (!supabaseUrl || !anonKey) {
    return reply(500, { error: "Local Supabase configuration incomplete.", providerCalls: 0 })
  }

  const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
  const auth = await user.auth.getUser()
  if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session.", providerCalls: 0 })

  let body: RequestBody
  try {
    body = await request.json() as RequestBody
  } catch {
    return reply(400, { error: "Invalid JSON body.", providerCalls: 0 })
  }

  if (body.action === "PLAN") {
    return reply(200, {
      mode: "K1_TRENDLYNE_CAPABILITY_DISCOVERY_PLAN",
      estimatedProviderCalls: 1,
      providerCalls: 0,
      productionWrites: 0,
      scoreRuns: 0,
      note: "One MCP tools/list protocol request only; no stock data request.",
    })
  }

  if (body.action !== "EXECUTE") {
    return reply(400, { error: "action must be PLAN or EXECUTE.", providerCalls: 0 })
  }
  if (body.confirmation !== CONFIRMATION) {
    return reply(409, { error: "Explicit owner confirmation required.", confirmation: CONFIRMATION, providerCalls: 0 })
  }
  if (!mcpUrl) return reply(409, { error: "TRENDLYNE_MCP_URL is missing.", providerCalls: 0 })

  try {
    const trendlyne = new TrendlyneObservedMcpClient(mcpUrl)
    const raw = await trendlyne.listTools()
    const tools = extractTools(raw).map(normalizeTool).filter(Boolean)
    const relevantTools = tools.filter((item) => item?.relevantToClassification)

    return reply(200, {
      mode: "K1_TRENDLYNE_CAPABILITY_DISCOVERY_CAPTURE_V1",
      providerCalls: 1,
      toolCount: tools.length,
      relevantToolCount: relevantTools.length,
      relevantTools,
      tools,
      raw,
      productionWrites: 0,
      scoreRuns: 0,
    })
  } catch (error) {
    return reply(502, {
      error: "K1 Trendlyne capability discovery failed safely.",
      code: error instanceof Error ? error.message : "K1_TRENDLYNE_CAPABILITY_DISCOVERY_FAILED",
      providerCalls: 1,
      productionWrites: 0,
      scoreRuns: 0,
    })
  }
})
