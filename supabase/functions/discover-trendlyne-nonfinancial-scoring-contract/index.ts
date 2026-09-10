import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { TrendlyneObservedMcpClient } from "../_shared/trendlyne-observed.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const SOURCE_CODE = "TRENDLYNE_MCP"
const DATA_DOMAIN = "NONFINANCIAL_SCORING_CONTRACT_DISCOVERY"
const OPERATION_CLASS = "GET_PARAMETER_VALUES_MULTI_STOCK"
const RECORD_KIND = "NONFINANCIAL_SCORING_CONTRACT_DISCOVERY"
const MAX_CAPTURE_BYTES = 512 * 1024
const REQUIRED = [
  { symbol: "INFY", profile: "IT_TECH" },
  { symbol: "M&M", profile: "AUTO_COMPONENTS" },
  { symbol: "TORNTPHARM", profile: "PHARMA_HEALTHCARE" },
] as const
const REQUESTED_METRICS = [
  "revenue growth 3 year",
  "profit after tax growth 3 year",
  "EPS growth 3 year",
  "ROCE annual",
  "ROE annual",
  "operating profit margin TTM",
  "EBITDA TTM",
  "cash flow from operations annual",
  "debt equity ratio",
  "interest coverage ratio",
  "PE TTM",
  "price to book",
] as const

type Admin = ReturnType<typeof createClient>

type RequestBody = { portfolioId?: unknown }

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function finishItem(admin: Admin, runItemId: string, status: "ACCEPTED" | "FAILED" | "SKIPPED_BUDGET", safeReasonCode: string | null, attemptedCallCount: number) {
  const result = await admin.rpc("record_refresh_item_result_v1", {
    p_run_item_id: runItemId,
    p_status: status,
    p_safe_reason_code: safeReasonCode,
    p_attempted_call_count: attemptedCallCount,
    p_accepted_record_count: 0,
    p_metadata: { mode: "NONFINANCIAL_SCORING_CONTRACT_DISCOVERY_ONLY", requested_metrics: REQUESTED_METRICS, canonical_promotion_performed: false },
  })
  if (result.error) throw new Error("RUN_ITEM_ACCOUNTING_FAILED")
}

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
    if (typeof body.portfolioId !== "string") return reply(400, { error: "portfolioId is required." })

    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session." })
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    const portfolio = await admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", auth.data.user.id).single()
    if (portfolio.error) return reply(404, { error: "Portfolio not found." })

    const securities = await admin.from("securities").select("id,symbol,asset_class").in("symbol", REQUIRED.map((row) => row.symbol))
    if (securities.error || (securities.data?.length ?? 0) !== REQUIRED.length) return reply(409, { error: "Validation cohort is incomplete." })

    const cohort: Array<{ id: string; symbol: string; profile: string; providerInstrumentId: string }> = []
    for (const required of REQUIRED) {
      const security = securities.data!.find((row) => row.symbol === required.symbol)
      if (!security || security.asset_class !== "EQUITY") return reply(409, { error: `Invalid cohort security: ${required.symbol}.` })
      const holding = await admin.from("current_holdings").select("security_id").eq("portfolio_id", body.portfolioId).eq("security_id", security.id).maybeSingle()
      if (holding.error || !holding.data) return reply(409, { error: `${required.symbol} is not an open holding.` })
      const assignment = await admin.from("security_scoring_profile_assignments").select("scoring_profile_code").eq("security_id", security.id).eq("assignment_status", "REVIEWED").maybeSingle()
      if (assignment.error || assignment.data?.scoring_profile_code !== required.profile) return reply(409, { error: `${required.symbol} reviewed scoring profile is unavailable.` })
      const identity = await admin.from("security_identity_observations").select("provider_instrument_id").eq("security_id", security.id).eq("source_code", SOURCE_CODE).eq("evidence_status", "MATCHED").not("provider_instrument_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle()
      if (identity.error || !identity.data?.provider_instrument_id) return reply(409, { error: `${required.symbol} verified Trendlyne identity is unavailable.` })
      cohort.push({ id: security.id, symbol: required.symbol, profile: required.profile, providerInstrumentId: String(identity.data.provider_instrument_id) })
    }

    const source = await admin.from("data_sources").select("is_active,entitlement_verified,retention_rights_verified").eq("code", SOURCE_CODE).single()
    if (source.error || !source.data.is_active || !source.data.entitlement_verified || !source.data.retention_rights_verified) return reply(409, { error: "Trusted provider configuration is incomplete.", providerCalls: 0 })
    const control = await admin.from("provider_ingestion_controls").select("ingestion_enabled,policy_version").eq("source_code", SOURCE_CODE).single()
    if (control.error || !control.data.ingestion_enabled) return reply(409, { error: "Provider ingestion is disabled or unavailable.", providerCalls: 0 })

    const run = await admin.from("data_ingestion_runs").insert({
      source_code: SOURCE_CODE,
      portfolio_id: body.portfolioId,
      operation: DATA_DOMAIN,
      orchestration_type: DATA_DOMAIN,
      trigger_source: "OWNER",
      requested_by: auth.data.user.id,
      status: "RUNNING",
      requested_count: REQUIRED.length,
      estimated_call_count: 1,
      reserved_call_count: 1,
      attempted_call_count: 0,
      policy_version: control.data.policy_version,
      metadata: { mode: "NONFINANCIAL_SCORING_CONTRACT_DISCOVERY_ONLY", cohort: REQUIRED, requested_metrics: REQUESTED_METRICS },
    }).select("id").single()
    if (run.error) throw new Error("RUN_ACCOUNTING_FAILED")
    const runId = run.data.id as string

    const item = await admin.from("data_ingestion_run_items").insert({
      ingestion_run_id: runId,
      security_id: cohort[0]!.id,
      data_domain: DATA_DOMAIN,
      status: "PLANNED",
      metadata: { cohort_security_ids: cohort.map((row) => row.id), cohort_symbols: cohort.map((row) => row.symbol), requested_metrics: REQUESTED_METRICS },
    }).select("id").single()
    if (item.error) throw new Error("RUN_ITEM_ACCOUNTING_FAILED")
    const runItemId = item.data.id as string

    const reservation = await admin.rpc("reserve_provider_budget_v1", {
      p_source_code: SOURCE_CODE,
      p_ingestion_run_id: runId,
      p_reservation_key: `${runId}:${DATA_DOMAIN}`,
      p_estimated_units: 1,
      p_reservation_seconds: 900,
    })
    const reservationRow = reservation.data?.[0]
    if (reservation.error || !reservationRow?.reserved || !reservationRow.reservation_id) {
      const reasonCode = reservationRow?.reason_code ?? "BUDGET_RESERVATION_FAILED"
      await finishItem(admin, runItemId, "SKIPPED_BUDGET", reasonCode, 0)
      await admin.from("data_ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), reserved_call_count: 0, skipped_count: 1, error_summary: reasonCode }).eq("id", runId)
      return reply(429, { error: "Provider budget reservation was not granted.", code: reasonCode, providerCalls: 0, runId })
    }
    const reservationId = String(reservationRow.reservation_id)

    const attemptedAt = new Date().toISOString()
    let providerResult: string | null = null
    let outcome: "SUCCEEDED" | "FAILED" = "SUCCEEDED"
    let safeErrorCode: string | null = null
    try {
      const client = new TrendlyneObservedMcpClient(mcpUrl)
      const query = `${cohort.map((row) => `${row.symbol} instrument ${row.providerInstrumentId}`).join("; ")} latest and historical scoring fundamentals: ${REQUESTED_METRICS.join(", ")}`
      providerResult = await client.getParameterValuesMultiStock(query, "stock")
    } catch (error) {
      outcome = "FAILED"
      const message = error instanceof Error ? error.message : ""
      safeErrorCode = message.includes("PROVIDER_TOOL_CONTRACT_ERROR") ? "PROVIDER_TOOL_CONTRACT_ERROR" : "PROVIDER_REQUEST_FAILED"
    }

    const usage = await admin.rpc("record_provider_usage_event_v1", {
      p_source_code: SOURCE_CODE,
      p_ingestion_run_id: runId,
      p_run_item_id: runItemId,
      p_security_id: cohort[0]!.id,
      p_data_domain: DATA_DOMAIN,
      p_operation_class: OPERATION_CLASS,
      p_accounting_class: "PROVIDER_TOOL_ATTEMPT",
      p_estimated_internal_units: 1,
      p_actual_internal_units: 1,
      p_attempted_at: attemptedAt,
      p_completed_at: new Date().toISOString(),
      p_outcome: outcome,
      p_safe_error_code: safeErrorCode,
      p_retry_attempt: 0,
      p_idempotency_key: `${runId}:${OPERATION_CLASS}:1`,
    })
    if (usage.error) throw new Error("USAGE_ACCOUNTING_FAILED")

    let captureId: string | null = null
    let payloadHash: string | null = null
    if (outcome === "SUCCEEDED" && providerResult !== null) {
      const rawPayload = { mode: "NONFINANCIAL_SCORING_CONTRACT_DISCOVERY_ONLY", run_id: runId, cohort, provider_tool: "get_parameter_values_multi_stock", requested_metrics: REQUESTED_METRICS, result: providerResult }
      const serialized = JSON.stringify(rawPayload)
      if (new TextEncoder().encode(serialized).byteLength > MAX_CAPTURE_BYTES) throw new Error("CAPTURE_PAYLOAD_TOO_LARGE")
      payloadHash = await sha256Hex(serialized)
      const capture = await admin.from("data_source_records").insert({
        source_code: SOURCE_CODE,
        ingestion_run_id: runId,
        record_kind: RECORD_KIND,
        external_record_id: `cohort-nonfinancial-scoring:${runId}`,
        retrieved_at: new Date().toISOString(),
        payload_hash: payloadHash,
        raw_payload: rawPayload,
        terms_snapshot: { mode: "NONFINANCIAL_SCORING_CONTRACT_DISCOVERY_ONLY", provider_tool: "get_parameter_values_multi_stock", requested_metrics: REQUESTED_METRICS, canonical_promotion_performed: false },
      }).select("id").single()
      if (capture.error) throw new Error("CAPTURE_PERSISTENCE_FAILED")
      captureId = capture.data.id as string
    }

    const settlement = await admin.rpc("settle_provider_budget_v1", { p_reservation_id: reservationId, p_consumed_units: outcome === "SUCCEEDED" ? 1 : 0, p_failed_units: outcome === "FAILED" ? 1 : 0, p_released_units: 0 })
    if (settlement.error) throw new Error("BUDGET_SETTLEMENT_FAILED")
    await finishItem(admin, runItemId, outcome === "SUCCEEDED" ? "ACCEPTED" : "FAILED", safeErrorCode, 1)
    await admin.from("data_ingestion_runs").update({ status: outcome === "SUCCEEDED" ? "SUCCEEDED" : "FAILED", completed_at: new Date().toISOString(), attempted_call_count: 1, failed_count: outcome === "FAILED" ? 1 : 0, error_summary: safeErrorCode, metadata: { mode: "NONFINANCIAL_SCORING_CONTRACT_DISCOVERY_ONLY", cohort: REQUIRED, capture_id: captureId, capture_payload_hash: payloadHash } }).eq("id", runId)

    if (outcome === "FAILED") return reply(502, { error: "Provider contract discovery failed safely.", code: safeErrorCode, providerCalls: 1, runId })
    return reply(200, { mode: "NONFINANCIAL_SCORING_CONTRACT_DISCOVERY_ONLY", cohort: REQUIRED, requestedMetrics: REQUESTED_METRICS, providerCalls: 1, budgetConsumed: 1, captureRecorded: true, captureId, capturePayloadHash: payloadHash, runId, note: "Raw contract evidence only. No canonical metrics or stock scores were written." })
  } catch (error) {
    const code = error instanceof Error ? error.message : "NONFINANCIAL_SCORING_CONTRACT_DISCOVERY_FAILED"
    return reply(502, { error: "Non-financial scoring contract discovery failed safely.", code })
  }
})
