import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { mapObservedTrendlyneReviewCandidates } from "../_shared/trendlyne-observed-mapping.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const SOURCE_CODE = "TRENDLYNE_MCP"
const RECORD_KIND = "OBSERVED_CONTRACT_DISCOVERY_RESULT"
const APPROVED_CODES = new Set(["ROCE_ANNUAL", "EPS_DILUTED", "EBITDA_TTM", "OPM_TTM"])

type RequestBody = {
  readonly portfolioId?: unknown
  readonly securityId?: unknown
  readonly sourceRecordId?: unknown
}

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
    if (typeof body.portfolioId !== "string" || typeof body.securityId !== "string" || typeof body.sourceRecordId !== "string") {
      return reply(400, { error: "portfolioId, securityId and sourceRecordId are required." })
    }

    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session." })

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    const portfolio = await admin.from("portfolios")
      .select("id")
      .eq("id", body.portfolioId)
      .eq("user_id", auth.data.user.id)
      .single()
    if (portfolio.error) return reply(404, { error: "Portfolio not found." })

    const holding = await admin.from("current_holdings")
      .select("security_id")
      .eq("portfolio_id", body.portfolioId)
      .eq("security_id", body.securityId)
      .maybeSingle()
    if (holding.error || !holding.data) return reply(403, { error: "Security must be an open holding." })

    const security = await admin.from("securities")
      .select("id,symbol,asset_class")
      .eq("id", body.securityId)
      .single()
    if (security.error || security.data.asset_class !== "EQUITY") return reply(400, { error: "Promotion is limited to held equities." })

    const sourceRecord = await admin.from("data_source_records")
      .select("id,source_code,record_kind,retrieved_at,raw_payload")
      .eq("id", body.sourceRecordId)
      .single()
    if (sourceRecord.error || !sourceRecord.data) return reply(404, { error: "Source evidence record not found." })
    if (sourceRecord.data.source_code !== SOURCE_CODE || sourceRecord.data.record_kind !== RECORD_KIND) {
      return reply(409, { error: "Source record is not an approved observed-contract capture." })
    }

    const raw = sourceRecord.data.raw_payload as Record<string, unknown> | null
    if (!raw || raw.security_id !== body.securityId || raw.security_symbol !== security.data.symbol || typeof raw.result !== "string") {
      return reply(409, { error: "Captured evidence does not match the requested security." })
    }

    const candidates = mapObservedTrendlyneReviewCandidates(raw.result, security.data.symbol)
    if (candidates.length !== 4 || candidates.some(candidate => !APPROVED_CODES.has(candidate.canonicalCode))) {
      return reply(409, { error: "Captured evidence did not produce the exact four approved mappings." })
    }

    const definitions = await admin.from("fundamental_metric_definitions")
      .select("code,canonical_unit,is_active")
      .in("code", [...APPROVED_CODES])
    if (definitions.error) throw new Error("METRIC_DEFINITION_LOOKUP_FAILED")
    if ((definitions.data ?? []).length !== 4 || definitions.data?.some(row => !row.is_active)) {
      return reply(409, { error: "Approved canonical metric definitions are incomplete." })
    }

    const definitionUnits = new Map((definitions.data ?? []).map(row => [row.code, row.canonical_unit]))
    if (candidates.some(candidate => definitionUnits.get(candidate.canonicalCode) !== candidate.canonicalUnit)) {
      return reply(409, { error: "Canonical unit mismatch detected; promotion stopped." })
    }

    const retrievedAt = sourceRecord.data.retrieved_at
    const freshUntil = new Date(new Date(retrievedAt).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
    const rows = candidates.map(candidate => ({
      security_id: body.securityId,
      metric_code: candidate.canonicalCode,
      source_record_id: body.sourceRecordId,
      source_code: SOURCE_CODE,
      numeric_value: candidate.numericValue,
      currency: candidate.canonicalUnit === "INR_CRORE" || candidate.canonicalUnit === "INR_PER_SHARE" ? "INR" : null,
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

    const inserted = await admin.from("fundamental_observations")
      .upsert(rows, {
        onConflict: "security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id",
        ignoreDuplicates: true,
      })
      .select("id,metric_code,numeric_value,unit,period_type,retrieved_at,fresh_until")
    if (inserted.error) throw new Error("CANONICAL_PROMOTION_FAILED")

    return reply(200, {
      mode: "CONTROLLED_CANONICAL_PROMOTION",
      security: security.data.symbol,
      sourceRecordId: body.sourceRecordId,
      providerCalls: 0,
      promotedMetrics: candidates.map(candidate => ({
        canonicalCode: candidate.canonicalCode,
        providerLabel: candidate.providerLabel,
        numericValue: candidate.numericValue,
        unit: candidate.canonicalUnit,
        periodType: candidate.periodType,
      })),
      insertedOrExistingRows: inserted.data ?? [],
      note: "Promotion used previously captured Trendlyne evidence only; no provider call was made and no period-end date was invented.",
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : "CANONICAL_PROMOTION_FAILED"
    return reply(500, { error: "Controlled canonical promotion failed safely.", code })
  }
})
