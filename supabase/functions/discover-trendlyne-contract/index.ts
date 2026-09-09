import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { TrendlyneMcpClient } from "../_shared/trendlyne.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const DISCOVERY_TERMS = ["ROCE", "diluted EPS", "EBITDA", "operating margin"] as const

type RequestBody = { readonly portfolioId?: unknown; readonly securityId?: unknown }

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." })

  const authorization = request.headers.get("Authorization")
  if (!authorization) return reply(401, { error: "Authentication required." })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const mcpUrl = Deno.env.get("TRENDLYNE_MCP_URL")
  if (!supabaseUrl || !anonKey || !serviceKey || !mcpUrl) return reply(500, { error: "Server configuration is incomplete." })

  try {
    const body = await request.json() as RequestBody
    if (typeof body.portfolioId !== "string" || typeof body.securityId !== "string") {
      return reply(400, { error: "portfolioId and securityId are required." })
    }

    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session." })

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    const portfolio = await admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", auth.data.user.id).single()
    if (portfolio.error) return reply(404, { error: "Portfolio not found." })

    const holding = await admin.from("current_holdings").select("security_id").eq("portfolio_id", body.portfolioId).eq("security_id", body.securityId).maybeSingle()
    if (holding.error || !holding.data) return reply(403, { error: "Security must be an open holding." })

    const security = await admin.from("securities").select("id,symbol,asset_class").eq("id", body.securityId).single()
    if (security.error || security.data.asset_class !== "EQUITY") return reply(400, { error: "Contract discovery is limited to held equities." })

    const identity = await admin.from("security_identity_observations")
      .select("provider_instrument_id,evidence_status")
      .eq("security_id", body.securityId)
      .eq("source_code", "TRENDLYNE_MCP")
      .eq("evidence_status", "MATCHED")
      .not("provider_instrument_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (identity.error || !identity.data?.provider_instrument_id) return reply(409, { error: "Verified Trendlyne identity is required before contract discovery." })

    const client = new TrendlyneMcpClient(mcpUrl)
    const searches: Record<string, string> = {}
    for (const term of DISCOVERY_TERMS) searches[term] = await client.searchParameters(term)

    return reply(200, {
      mode: "CONTRACT_DISCOVERY_ONLY",
      security: security.data.symbol,
      providerInstrumentId: identity.data.provider_instrument_id,
      terms: DISCOVERY_TERMS,
      providerCalls: DISCOVERY_TERMS.length,
      writesPerformed: 0,
      valuesRetrieved: false,
      searches,
      note: "No metric contract is promoted by this response. Results require owner review before parser/storage changes.",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Contract discovery failed."
    return reply(502, { error: message.replace(/https?:\/\/\S+/g, "[redacted-url]") })
  }
})
