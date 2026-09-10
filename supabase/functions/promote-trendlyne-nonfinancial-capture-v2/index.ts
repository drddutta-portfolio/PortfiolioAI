import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { mapExactNonfinancialTrendlyneMetrics } from "../_shared/trendlyne-nonfinancial-mapping.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const SOURCE_CODE = "TRENDLYNE_MCP"
const RECORD_KIND = "NONFINANCIAL_SCORING_CONTRACT_DISCOVERY_V2"
const REQUIRED = [
  { symbol: "INFY", profile: "IT_TECH", providerInstrumentId: "630" },
  { symbol: "M&M", profile: "AUTO_COMPONENTS", providerInstrumentId: "807" },
  { symbol: "TORNTPHARM", profile: "PHARMA_HEALTHCARE", providerInstrumentId: "1409" },
] as const

type RequestBody = { readonly portfolioId?: unknown }

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." })
  const authorization = request.headers.get("Authorization")
  if (!authorization) return reply(401, { error: "Authentication required." })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceKey) return reply(500, { error: "Server configuration is incomplete." })

  try {
    const body = await request.json() as RequestBody
    if (typeof body.portfolioId !== "string") return reply(400, { error: "portfolioId is required." })

    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session." })

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    const portfolio = await admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", auth.data.user.id).single()
    if (portfolio.error) return reply(404, { error: "Portfolio not found." })

    const promoted: Array<Record<string, unknown>> = []

    for (const required of REQUIRED) {
      const security = await admin.from("securities").select("id,symbol,asset_class").eq("symbol", required.symbol).single()
      if (security.error || security.data.asset_class !== "EQUITY") return reply(409, { error: `Invalid cohort security: ${required.symbol}.` })
      const holding = await admin.from("current_holdings").select("security_id").eq("portfolio_id", body.portfolioId).eq("security_id", security.data.id).maybeSingle()
      if (holding.error || !holding.data) return reply(409, { error: `${required.symbol} is not an open holding.` })
      const assignment = await admin.from("security_scoring_profile_assignments").select("scoring_profile_code").eq("security_id", security.data.id).eq("assignment_status", "REVIEWED").maybeSingle()
      if (assignment.error || assignment.data?.scoring_profile_code !== required.profile) return reply(409, { error: `${required.symbol} reviewed scoring profile mismatch.` })
      const identity = await admin.from("security_identity_observations").select("provider_instrument_id").eq("security_id", security.data.id).eq("source_code", SOURCE_CODE).eq("evidence_status", "MATCHED").not("provider_instrument_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle()
      if (identity.error || String(identity.data?.provider_instrument_id ?? "") !== required.providerInstrumentId) return reply(409, { error: `${required.symbol} Trendlyne identity mismatch.` })

      const sourceRecord = await admin.from("data_source_records")
        .select("id,retrieved_at,raw_payload")
        .eq("source_code", SOURCE_CODE)
        .eq("record_kind", RECORD_KIND)
        .contains("raw_payload", { security_id: security.data.id, security_symbol: required.symbol, provider_instrument_id: required.providerInstrumentId })
        .order("retrieved_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (sourceRecord.error || !sourceRecord.data) return reply(409, { error: `Verified V2 capture missing for ${required.symbol}.` })

      const raw = sourceRecord.data.raw_payload as Record<string, unknown> | null
      if (!raw || typeof raw.result !== "string" || raw.security_id !== security.data.id || raw.security_symbol !== required.symbol || raw.provider_instrument_id !== required.providerInstrumentId) {
        return reply(409, { error: `Capture identity mismatch for ${required.symbol}.` })
      }

      const candidates = mapExactNonfinancialTrendlyneMetrics(raw.result, required.symbol, required.providerInstrumentId)
      if (candidates.length !== 3) return reply(409, { error: `Approved mapping set incomplete for ${required.symbol}.` })

      const codes = candidates.map(x => x.canonicalCode)
      const definitions = await admin.from("fundamental_metric_definitions").select("code,canonical_unit,is_active").in("code", codes)
      if (definitions.error || (definitions.data ?? []).length !== 3 || definitions.data?.some(x => !x.is_active)) {
        return reply(409, { error: `Canonical definitions incomplete for ${required.symbol}.` })
      }
      const units = new Map((definitions.data ?? []).map(x => [x.code, x.canonical_unit]))
      if (candidates.some(x => units.get(x.canonicalCode) !== x.canonicalUnit)) {
        return reply(409, { error: `Canonical unit mismatch for ${required.symbol}.` })
      }

      const retrievedAt = sourceRecord.data.retrieved_at
      const freshUntil = new Date(new Date(retrievedAt).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
      const rows = candidates.map(candidate => ({
        security_id: security.data.id,
        metric_code: candidate.canonicalCode,
        source_record_id: sourceRecord.data.id,
        source_code: SOURCE_CODE,
        numeric_value: candidate.numericValue,
        currency: null,
        unit: candidate.canonicalUnit,
        period_start: null,
        period_end: null,
        period_type: candidate.periodType,
        accounting_standard: null,
        consolidation_scope: "UNKNOWN",
        observed_at: null,
        retrieved_at: retrievedAt,
        fresh_until: freshUntil,
        evidence_status: "AVAILABLE",
        published_at: null,
      }))

      const inserted = await admin.from("fundamental_observations").upsert(rows, {
        onConflict: "security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id",
        ignoreDuplicates: true,
      }).select("id,metric_code,numeric_value,unit,period_type,source_record_id")
      if (inserted.error) throw new Error(`CANONICAL_PROMOTION_FAILED:${required.symbol}`)

      promoted.push({
        symbol: required.symbol,
        sourceRecordId: sourceRecord.data.id,
        metrics: candidates,
        rows: inserted.data ?? [],
      })
    }

    return reply(200, {
      mode: "CONTROLLED_NONFINANCIAL_CANONICAL_PROMOTION_V2",
      providerCalls: 0,
      securities: promoted,
      note: "Used only previously captured exact-entity Trendlyne evidence. No provider call, score run, invented period-end date, or portfolio-role mutation occurred.",
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : "NONFINANCIAL_CANONICAL_PROMOTION_FAILED"
    return reply(500, { error: "Controlled non-financial canonical promotion failed safely.", code })
  }
})
