import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const DEV_PROJECT_REF = "lrgpjimipfkyoqbpsqzz"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
}
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })

function projectRef(url: string) {
  try {
    return new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1] ?? null
  } catch {
    return null
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return reply(500, { error: "Supabase server configuration is incomplete." })
  }
  if (projectRef(supabaseUrl) !== DEV_PROJECT_REF) {
    return reply(409, { error: "P6 terminal-disposition read is Development-only.", code: "PRODUCTION_REJECTED" })
  }

  const authorization = request.headers.get("Authorization")
  if (!authorization) return reply(401, { error: "Authentication required." })

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const auth = await userClient.auth.getUser()
  if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session." })

  let body: { portfolioId?: unknown }
  try {
    body = await request.json()
  } catch {
    return reply(400, { error: "Invalid request body." })
  }
  if (typeof body.portfolioId !== "string") return reply(400, { error: "portfolioId is required." })

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  const portfolio = await admin.from("portfolios").select("id,user_id").eq("id", body.portfolioId).single()
  if (portfolio.error || !portfolio.data || portfolio.data.user_id !== auth.data.user.id) {
    return reply(404, { error: "Portfolio not found." })
  }

  const result = await admin
    .from("data_source_records")
    .select("external_record_id,retrieved_at,raw_payload")
    .eq("record_kind", "P5_TERMINAL_DISPOSITION_V1")
    .order("retrieved_at", { ascending: false })

  if (result.error) return reply(500, { error: "P5 terminal dispositions could not be loaded." })

  const seen = new Set<string>()
  const rows = []
  for (const record of result.data ?? []) {
    const payload = record.raw_payload as Record<string, unknown> | null
    if (!payload || payload.portfolio_id !== body.portfolioId) continue
    const securityId = typeof payload.security_id === "string" ? payload.security_id : null
    if (!securityId || seen.has(securityId)) continue
    seen.add(securityId)
    const methodology = payload.methodology as Record<string, unknown> | undefined
    const r6 = payload.r6 as Record<string, unknown> | undefined
    const r7 = payload.r7 as Record<string, unknown> | undefined
    const sizing = payload.sizing as Record<string, unknown> | undefined
    const assignment = payload.assignment as Record<string, unknown> | undefined
    const inputLineage = payload.input_lineage as Record<string, unknown> | undefined
    rows.push({
      securityId,
      symbol: typeof payload.symbol === "string" ? payload.symbol : null,
      assetClass: typeof payload.asset_class === "string" ? payload.asset_class : null,
      retrievedAt: record.retrieved_at,
      p4PayloadHash: typeof inputLineage?.p4_payload_hash === "string" ? inputLineage.p4_payload_hash : null,
      methodologyState: typeof methodology?.state === "string" ? methodology.state : null,
      engineCode: typeof methodology?.engine_code === "string" ? methodology.engine_code : null,
      profileCode: typeof methodology?.profile_code === "string" ? methodology.profile_code : null,
      methodologyId: typeof methodology?.authority === "string" ? methodology.authority : null,
      methodologyReason: typeof methodology?.reason === "string" ? methodology.reason : null,
      assignmentId: typeof assignment?.id === "string" ? assignment.id : null,
      assignmentVersion: typeof assignment?.version === "string" ? assignment.version : null,
      methodologyRole: typeof assignment?.role === "string" ? assignment.role : null,
      r6Disposition: typeof r6?.disposition === "string" ? r6.disposition : null,
      r6ReasonCodes: Array.isArray(r6?.reason_codes) ? r6.reason_codes.filter((x): x is string => typeof x === "string") : [],
      scoreRunId: typeof r6?.score_run_id === "string" ? r6.score_run_id : null,
      r7Disposition: typeof r7?.disposition === "string" ? r7.disposition : null,
      r7ReasonCodes: Array.isArray(r7?.reason_codes) ? r7.reason_codes.filter((x): x is string => typeof x === "string") : [],
      recommendationRunId: typeof r7?.recommendation_run_id === "string" ? r7.recommendation_run_id : null,
      sizingDisposition: typeof sizing?.disposition === "string" ? sizing.disposition : null,
    })
  }

  return reply(200, {
    version: "POST_D_P6_P5_TERMINAL_READ_V1",
    portfolioId: body.portfolioId,
    count: rows.length,
    rows,
  })
})
