import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { TrendlyneObservedMcpClient } from "../_shared/trendlyne-observed.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const SOURCE_CODE = "TRENDLYNE_MCP"
const DATA_DOMAIN = "CONTRACT_DISCOVERY_OBSERVED"
const OPERATION_CLASS = "GET_PARAMETER_VALUES_MULTI_STOCK"
const RECORD_KIND = "OBSERVED_CONTRACT_DISCOVERY_RESULT"
const RESERVED_UNITS = 1
const MAX_CAPTURE_BYTES = 512 * 1024
const ACCOUNTING_WRITE_ATTEMPTS = 3
const REQUESTED_METRICS = ["ROCE", "diluted EPS", "EBITDA", "operating margin"] as const

type RequestBody = { readonly portfolioId?: unknown; readonly securityId?: unknown }
type Admin = ReturnType<typeof createClient>

const budgetHttpStatus = (reasonCode: string) => {
  if (reasonCode === "INGESTION_DISABLED") return 409
  if (reasonCode === "DAILY_LIMIT" || reasonCode === "ROLLING_LIMIT" || reasonCode === "PER_RUN_LIMIT" || reasonCode === "CONCURRENCY_LIMIT") return 429
  return 503
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("")
}

async function recordUsage(
  admin: Admin,
  runId: string,
  runItemId: string,
  securityId: string,
  attemptedAt: string,
  outcome: "SUCCEEDED" | "FAILED",
  safeErrorCode: string | null,
) {
  const payload = {
    p_source_code: SOURCE_CODE,
    p_ingestion_run_id: runId,
    p_run_item_id: runItemId,
    p_security_id: securityId,
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
  }
  for (let accountingAttempt = 1; accountingAttempt <= ACCOUNTING_WRITE_ATTEMPTS; accountingAttempt += 1) {
    const usage = await admin.rpc("record_provider_usage_event_v1", payload)
    if (!usage.error) return
  }
  throw new Error("USAGE_ACCOUNTING_FAILED")
}

async function completeRunItem(
  admin: Admin,
  runItemId: string,
  status: "ACCEPTED" | "FAILED" | "SKIPPED_BUDGET",
  safeReasonCode: string | null,
  attemptedCallCount: number,
) {
  const result = await admin.rpc("record_refresh_item_result_v1", {
    p_run_item_id: runItemId,
    p_status: status,
    p_safe_reason_code: safeReasonCode,
    p_attempted_call_count: attemptedCallCount,
    p_accepted_record_count: 0,
    p_metadata: {
      mode: "OBSERVED_CONTRACT_DISCOVERY_ONLY",
      requested_metrics: REQUESTED_METRICS,
      research_writes_performed: 0,
      canonical_promotion_performed: false,
    },
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
    if (security.error || security.data.asset_class !== "EQUITY") return reply(400, { error: "Observed contract discovery is limited to held equities." })

    const identity = await admin.from("security_identity_observations")
      .select("provider_instrument_id,evidence_status")
      .eq("security_id", body.securityId)
      .eq("source_code", SOURCE_CODE)
      .eq("evidence_status", "MATCHED")
      .not("provider_instrument_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (identity.error || !identity.data?.provider_instrument_id) return reply(409, { error: "Verified Trendlyne identity is required." })

    const source = await admin.from("data_sources")
      .select("is_active,entitlement_verified,retention_rights_verified")
      .eq("code", SOURCE_CODE)
      .single()
    if (source.error || !source.data.is_active || !source.data.entitlement_verified || !source.data.retention_rights_verified) {
      return reply(409, { error: "The trusted provider configuration is incomplete.", providerCalls: 0, budgetConsumed: 0 })
    }

    const control = await admin.from("provider_ingestion_controls")
      .select("ingestion_enabled,policy_version")
      .eq("source_code", SOURCE_CODE)
      .single()
    if (control.error) return reply(503, { error: "Provider safety controls are unavailable.", providerCalls: 0, budgetConsumed: 0 })
    if (!control.data.ingestion_enabled) return reply(409, { error: "Provider ingestion is disabled.", providerCalls: 0, budgetConsumed: 0 })

    const run = await admin.from("data_ingestion_runs").insert({
      source_code: SOURCE_CODE,
      portfolio_id: body.portfolioId,
      operation: DATA_DOMAIN,
      orchestration_type: DATA_DOMAIN,
      trigger_source: "OWNER",
      requested_by: auth.data.user.id,
      status: "RUNNING",
      requested_count: 1,
      estimated_call_count: RESERVED_UNITS,
      reserved_call_count: RESERVED_UNITS,
      attempted_call_count: 0,
      policy_version: control.data.policy_version,
      metadata: { mode: "OBSERVED_CONTRACT_DISCOVERY_ONLY", requested_metrics: REQUESTED_METRICS },
    }).select("id").single()
    if (run.error) throw new Error("RUN_ACCOUNTING_FAILED")
    const runId = run.data.id as string

    const runItem = await admin.from("data_ingestion_run_items").insert({
      ingestion_run_id: runId,
      security_id: body.securityId,
      data_domain: DATA_DOMAIN,
      status: "PLANNED",
      metadata: { requested_metrics: REQUESTED_METRICS },
    }).select("id").single()
    if (runItem.error) {
      await admin.from("data_ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), error_summary: "RUN_ITEM_ACCOUNTING_FAILED" }).eq("id", runId)
      throw new Error("RUN_ITEM_ACCOUNTING_FAILED")
    }
    const runItemId = runItem.data.id as string

    const reservation = await admin.rpc("reserve_provider_budget_v1", {
      p_source_code: SOURCE_CODE,
      p_ingestion_run_id: runId,
      p_reservation_key: `${runId}:${DATA_DOMAIN}`,
      p_estimated_units: RESERVED_UNITS,
      p_reservation_seconds: 900,
    })
    const reservationRow = reservation.data?.[0]
    if (reservation.error || !reservationRow?.reserved || !reservationRow.reservation_id) {
      const reasonCode = reservationRow?.reason_code ?? "BUDGET_RESERVATION_FAILED"
      try {
        await completeRunItem(admin, runItemId, "SKIPPED_BUDGET", reasonCode, 0)
      } finally {
        await admin.from("data_ingestion_runs").update({
          status: "FAILED",
          completed_at: new Date().toISOString(),
          reserved_call_count: 0,
          attempted_call_count: 0,
          skipped_count: 1,
          error_summary: reasonCode,
        }).eq("id", runId)
      }
      return reply(budgetHttpStatus(reasonCode), { error: "Provider budget reservation was not granted.", code: reasonCode, providerCalls: 0, budgetConsumed: 0, runId })
    }

    const reservationId = reservationRow.reservation_id as string
    const attemptedAt = new Date().toISOString()
    let outcome: "SUCCEEDED" | "FAILED" = "SUCCEEDED"
    let safeErrorCode: string | null = null
    let terminalError: Error | null = null
    let providerResult: string | null = null
    let capturePayloadHash: string | null = null

    try {
      const client = new TrendlyneObservedMcpClient(mcpUrl)
      const query = `${security.data.symbol} latest ${REQUESTED_METRICS.join(", ")}`
      providerResult = await client.getParameterValuesMultiStock(query, "stock")
    } catch (error) {
      outcome = "FAILED"
      const message = error instanceof Error ? error.message : ""
      safeErrorCode = message.includes("PROVIDER_TOOL_CONTRACT_ERROR") ? "PROVIDER_TOOL_CONTRACT_ERROR" : "PROVIDER_REQUEST_FAILED"
      terminalError = new Error(safeErrorCode)
    }

    try {
      await recordUsage(admin, runId, runItemId, body.securityId, attemptedAt, outcome, safeErrorCode)
    } catch (error) {
      terminalError = error instanceof Error ? error : new Error("USAGE_ACCOUNTING_FAILED")
    }

    if (!terminalError && providerResult !== null) {
      const rawPayload = {
        mode: "OBSERVED_CONTRACT_DISCOVERY_ONLY",
        run_id: runId,
        security_id: body.securityId,
        security_symbol: security.data.symbol,
        provider_instrument_id: identity.data.provider_instrument_id,
        provider_tool: "get_parameter_values_multi_stock",
        requested_metrics: REQUESTED_METRICS,
        result: providerResult,
      }
      const serialized = JSON.stringify(rawPayload)
      if (new TextEncoder().encode(serialized).byteLength > MAX_CAPTURE_BYTES) {
        terminalError = new Error("CAPTURE_PAYLOAD_TOO_LARGE")
      } else {
        capturePayloadHash = await sha256Hex(serialized)
        const capture = await admin.from("data_source_records").upsert({
          source_code: SOURCE_CODE,
          ingestion_run_id: runId,
          record_kind: RECORD_KIND,
          external_record_id: `${identity.data.provider_instrument_id}:observed-contract:${runId}`,
          retrieved_at: new Date().toISOString(),
          payload_hash: capturePayloadHash,
          raw_payload: rawPayload,
          terms_snapshot: {
            mode: "OBSERVED_CONTRACT_DISCOVERY_ONLY",
            provider_tool: "get_parameter_values_multi_stock",
            requested_metrics: REQUESTED_METRICS,
            research_writes_performed: 0,
            canonical_promotion_performed: false,
          },
        }, {
          onConflict: "source_code,record_kind,external_record_id,payload_hash",
          ignoreDuplicates: true,
        })
        if (capture.error) terminalError = new Error("CAPTURE_PERSISTENCE_FAILED")
      }
    }

    const settlement = await admin.rpc("settle_provider_budget_v1", {
      p_reservation_id: reservationId,
      p_consumed_units: outcome === "SUCCEEDED" ? 1 : 0,
      p_failed_units: outcome === "FAILED" ? 1 : 0,
      p_released_units: 0,
    })
    if (settlement.error) terminalError = new Error("BUDGET_SETTLEMENT_FAILED")

    try {
      await completeRunItem(admin, runItemId, terminalError ? "FAILED" : "ACCEPTED", terminalError ? terminalError.message : null, 1)
    } catch (error) {
      if (!terminalError) terminalError = error instanceof Error ? error : new Error("RUN_ITEM_ACCOUNTING_FAILED")
    }

    const completed = await admin.from("data_ingestion_runs").update({
      status: terminalError ? "FAILED" : "SUCCEEDED",
      completed_at: new Date().toISOString(),
      attempted_call_count: 1,
      fetched_count: 0,
      accepted_count: 0,
      failed_count: terminalError ? 1 : 0,
      skipped_count: 0,
      error_summary: terminalError ? terminalError.message : null,
      metadata: {
        mode: "OBSERVED_CONTRACT_DISCOVERY_ONLY",
        provider_tool: "get_parameter_values_multi_stock",
        requested_metrics: REQUESTED_METRICS,
        consumed_units: outcome === "SUCCEEDED" ? 1 : 0,
        failed_units: outcome === "FAILED" ? 1 : 0,
        released_units: 0,
        capture_record_kind: capturePayloadHash ? RECORD_KIND : null,
        capture_payload_hash: capturePayloadHash,
      },
    }).eq("id", runId)
    if (completed.error && !terminalError) terminalError = new Error("RUN_ACCOUNTING_FAILED")

    if (terminalError) throw terminalError

    return reply(200, {
      mode: "OBSERVED_CONTRACT_DISCOVERY_ONLY",
      security: security.data.symbol,
      providerInstrumentId: identity.data.provider_instrument_id,
      providerTool: "get_parameter_values_multi_stock",
      requestedMetrics: REQUESTED_METRICS,
      providerCalls: 1,
      budgetConsumed: 1,
      budgetFailed: 0,
      researchWritesPerformed: 0,
      canonicalPromotionPerformed: false,
      operationalAccountingRecorded: true,
      captureRecorded: true,
      capturePayloadHash,
      runId,
      reservationId,
      result: providerResult,
      note: "Discovery evidence only. No metric contract was promoted and no canonical fundamentals were written.",
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : "OBSERVED_CONTRACT_DISCOVERY_FAILED"
    return reply(502, { error: "Observed contract discovery failed safely.", code })
  }
})
