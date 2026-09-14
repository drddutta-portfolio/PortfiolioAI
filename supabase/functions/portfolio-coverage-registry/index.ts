import { createClient } from "https://esm.sh/@supabase/supabase-js@2.115.0"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })

type RequestBody = { readonly portfolioId?: unknown }
type RegistryEnvelope = {
  readonly registryVersion?: unknown
  readonly generatedAt?: unknown
  readonly providerCalls?: unknown
  readonly budgetConsumed?: unknown
  readonly records?: unknown
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." })

  const authorization = request.headers.get("Authorization")
  if (!authorization) return reply(401, { error: "Authentication required." })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return reply(500, { error: "Server configuration is incomplete." })
  }

  try {
    const body = await request.json() as RequestBody
    if (typeof body.portfolioId !== "string" || !UUID_RE.test(body.portfolioId)) {
      return reply(400, { error: "A valid portfolioId is required." })
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const auth = await userClient.auth.getUser()
    if (auth.error || !auth.data.user) {
      return reply(401, { error: "Invalid authenticated session." })
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    // Explicit owner check before any service-role coverage reads.
    const portfolio = await admin
      .from("portfolios")
      .select("id")
      .eq("id", body.portfolioId)
      .eq("user_id", auth.data.user.id)
      .maybeSingle()

    if (portfolio.error) {
      console.error("portfolio-coverage-registry owner lookup failed", portfolio.error.code)
      return reply(500, { error: "Portfolio ownership could not be verified." })
    }
    if (!portfolio.data) return reply(404, { error: "Portfolio not found." })

    const registry = await admin.rpc("get_portfolio_coverage_registry_v1", {
      p_portfolio_id: body.portfolioId,
      p_user_id: auth.data.user.id,
    })

    if (registry.error) {
      console.error("portfolio-coverage-registry query failed", registry.error.code)
      const status = registry.error.code === "42501" ? 403 : 500
      return reply(status, { error: status === 403 ? "Portfolio access denied." : "Coverage registry could not be generated." })
    }

    const data = (registry.data ?? {}) as RegistryEnvelope
    if (!Array.isArray(data.records)) {
      return reply(500, { error: "Coverage registry returned an invalid response." })
    }

    return reply(200, {
      registryVersion: data.registryVersion ?? "PORTFOLIO_COVERAGE_V1",
      generatedAt: data.generatedAt ?? new Date().toISOString(),
      providerCalls: 0,
      budgetConsumed: 0,
      records: data.records,
    })
  } catch (error) {
    console.error("portfolio-coverage-registry failed", error instanceof Error ? error.message : "UNKNOWN_ERROR")
    return reply(500, { error: "Coverage registry could not be generated." })
  }
})
