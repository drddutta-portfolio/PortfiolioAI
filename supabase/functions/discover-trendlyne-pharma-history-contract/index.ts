import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { TrendlyneObservedMcpClient } from "../_shared/trendlyne-observed.ts"
import {
  PHARMA_HISTORY_DISCOVERY_MAX_PROVIDER_CALLS,
  PHARMA_HISTORY_DISCOVERY_REFERENCE,
  PHARMA_HISTORY_DISCOVERY_TERMS,
  PHARMA_HISTORY_DISCOVERY_VERSION,
} from "../_shared/pharma-history-discovery.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const SOURCE_CODE = "TRENDLYNE_MCP"
const DATA_DOMAIN = "PHARMA_HISTORY_CONTRACT_DISCOVERY_V2"
const OPERATION_CLASS = "GET_PARAMETER_VALUES_MULTI_STOCK"
const CAPTURE_RECORD_KIND = "PHARMA_HISTORY_CONTRACT_DISCOVERY_V2"
const MAX_CAPTURE_BYTES = 512 * 1024
const ACCOUNTING_WRITE_ATTEMPTS = 3

type Admin = ReturnType<typeof createClient>
type RequestBody = { readonly portfolioId?: unknown }

const budgetHttpStatus = (reasonCode: string) => {
  if (reasonCode === "INGESTION_DISABLED") return 409
  if (["DAILY_LIMIT", "ROLLING_LIMIT", "PER_RUN_LIMIT", "CONCURRENCY_LIMIT"].includes(reasonCode)) return 429
  return 503
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function recordUsage(
  admin: Admin,
  runId: string,
  runItemId: string,
  securityId: string,
  attemptNumber: number,
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
    p_idempotency_key: `${runId}:${OPERATION_CLASS}:${attemptNumber}`,
  }

  for (let accountingAttempt = 1; accountingAttempt <= ACCOUNTING_WRITE_ATTEMPTS; accountingAttempt += 1) {
    const usage = await admin.rpc("record_provider_usage_event_v1", payload)
    if (!usage.error) return
  }
  throw new Error("USAGE_ACCOUNTING_FAILED")
}

async function finishItem(
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
      mode: "PHARMA_HISTORY_TARGETED_DISCOVERY_ONLY",
      contract_version: PHARMA_HISTORY_DISCOVERY_VERSION,
      canonical_promotion_performed: false,
      research_writes_performed: 0,
    },
  })
  if (result.error) throw new Error("RUN_ITEM_ACCOUNTING_FAILED")
}

async function persistCapture(
  admin: Admin,
  runId: string,
  securityId: string,
  results: Readonly<Record<string, string>>,
) {
  const rawPayload = {
    mode: "PHARMA_HISTORY_TARGETED_DISCOVERY_ONLY",
    contract_version: PHARMA_HISTORY_DISCOVERY_VERSION,
    run_id: runId,
    security_id: securityId,
    security_symbol: PHARMA_HISTORY_DISCOVERY_REFERENCE.symbol,
    provider_instrument_id: PHARMA_HISTORY_DISCOVERY_REFERENCE.providerInstrumentId,
    provider_tool: "get_parameter_values_multi_stock",
    queries: PHARMA_HISTORY_DISCOVERY_TERMS,
    results,
  }
  const serialized = JSON.stringify(rawPayload)
  if (new TextEncoder().encode(serialized).byteLength > MAX_CAPTURE_BYTES) throw new Error("CAPTURE_PAYLOAD_TOO_LARGE")
  const payloadHash = await sha256Hex(serialized)
  const result = await admin.from("data_source_records").insert({
    source_code: SOURCE_CODE,
    ingestion_run_id: runId,
    record_kind: CAPTURE_RECORD_KIND,
    external_record_id: `${PHARMA_HISTORY_DISCOVERY_REFERENCE.providerInstrumentId}:${PHARMA_HISTORY_DISCOVERY_VERSION}:${runId}`,
    retrieved_at: new Date().toISOString(),
    payload_hash: payloadHash,
    raw_payload: rawPayload,
    terms_snapshot: {
      mode: "PHARMA_HISTORY_TARGETED_DISCOVERY_ONLY",
      contract_version: PHARMA_HISTORY_DISCOVERY_VERSION,
      canonical_promotion_performed: false,
      research_writes_performed: 0,
    },
  })
  if (result.error) throw new Error("CAPTURE_PERSISTENCE_FAILED")
  return payloadHash
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

    const security = await admin.from("securities")
      .select("id,symbol,asset_class")
      .eq("symbol", PHARMA_HISTORY_DISCOVERY_REFERENCE.symbol)
      .single()
    if (security.error || security.data.asset_class !== "EQUITY") {
      return reply(409, { error: "The reviewed PHARMA reference security is unavailable.", providerCalls: 0, budgetConsumed: 0 })
    }

    const holding = await admin.from("current_holdings")
      .select("security_id")
      .eq("portfolio_id", body.portfolioId)
      .eq("security_id", security.data.id)
      .maybeSingle()
    if (holding.error || !holding.data) {
      return reply(409, { error: "The reviewed PHARMA reference security is not an open holding.", providerCalls: 0, budgetConsumed: 0 })
    }

    const enrichment = await admin.from("current_security_enrichment_v1")
      .select("sector")
      .eq("security_id", security.data.id)
      .maybeSingle()
    if (enrichment.error || enrichment.data?.sector !== PHARMA_HISTORY_DISCOVERY_REFERENCE.applicationSector) {
      return reply(409, { error: "Shared application classification does not match the reviewed PHARMA reference.", providerCalls: 0, budgetConsumed: 0 })
    }

    const identity = await admin.from("security_identity_observations")
      .select("provider_instrument_id")
      .eq("security_id", security.data.id)
      .eq("source_code", SOURCE_CODE)
      .eq("evidence_status", "MATCHED")
      .not("provider_instrument_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (identity.error || String(identity.data?.provider_instrument_id ?? "") !== PHARMA_HISTORY_DISCOVERY_REFERENCE.providerInstrumentId) {
      return reply(409, { error: "Verified Trendlyne identity mismatch for the PHARMA reference security.", providerCalls: 0, budgetConsumed: 0 })
    }

    const source = await admin.from("data_sources")
      .select("is_active,entitlement_verified,retention_rights_verified")
      .eq("code", SOURCE_CODE)
      .single()
    if (source.error || !source.data.is_active || !source.data.entitlement_verified || !source.data.retention_rights_verified) {
      return reply(409, { error: "Trusted provider configuration is incomplete.", providerCalls: 0, budgetConsumed: 0 })
    }

    const control = await admin.from("provider_ingestion_controls")
      .select("ingestion_enabled,policy_version")
      .eq("source_code", SOURCE_CODE)
      .single()
    if (control.error) return reply(503, { error: "Provider safety controls are unavailable.", providerCalls: 0, budgetConsumed: 0 })
    if (!control.data.ingestion_enabled) {
      return reply(409, { error: "Provider ingestion is disabled.", code: "PROVIDER_INGESTION_DISABLED", providerCalls: 0, budgetConsumed: 0 })
    }

    const run = await admin.from("data_ingestion_runs").insert({
      source_code: SOURCE_CODE,
      portfolio_id: body.portfolioId,
      operation: DATA_DOMAIN,
      orchestration_type: DATA_DOMAIN,
      trigger_source: "OWNER",
      requested_by: auth.data.user.id,
      status: "RUNNING",
      requested_count: 1,
      estimated_call_count: PHARMA_HISTORY_DISCOVERY_MAX_PROVIDER_CALLS,
      reserved_call_count: PHARMA_HISTORY_DISCOVERY_MAX_PROVIDER_CALLS,
      attempted_call_count: 0,
      policy_version: control.data.policy_version,
      metadata: {
        mode: "PHARMA_HISTORY_TARGETED_DISCOVERY_ONLY",
        contract_version: PHARMA_HISTORY_DISCOVERY_VERSION,
        reference: PHARMA_HISTORY_DISCOVERY_REFERENCE,
        queries: PHARMA_HISTORY_DISCOVERY_TERMS,
      },
    }).select("id").single()
    if (run.error) throw new Error("RUN_ACCOUNTING_FAILED")
    const runId = run.data.id as string

    const runItem = await admin.from("data_ingestion_run_items").insert({
      ingestion_run_id: runId,
      security_id: security.data.id,
      data_domain: DATA_DOMAIN,
      status: "PLANNED",
      metadata: { contract_version: PHARMA_HISTORY_DISCOVERY_VERSION, queries: PHARMA_HISTORY_DISCOVERY_TERMS },
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
      p_estimated_units: PHARMA_HISTORY_DISCOVERY_MAX_PROVIDER_CALLS,
      p_reservation_seconds: 900,
    })
    const reservationRow = reservation.data?.[0]
    if (reservation.error || !reservationRow?.reserved || !reservationRow.reservation_id) {
      const reasonCode = reservationRow?.reason_code ?? "BUDGET_RESERVATION_FAILED"
      await finishItem(admin, runItemId, "SKIPPED_BUDGET", reasonCode, 0)
      await admin.from("data_ingestion_runs").update({
        status: "FAILED",
        completed_at: new Date().toISOString(),
        reserved_call_count: 0,
        attempted_call_count: 0,
        skipped_count: 1,
        error_summary: reasonCode,
      }).eq("id", runId)
      return reply(budgetHttpStatus(reasonCode), { error: "Provider budget reservation was not granted.", code: reasonCode, providerCalls: 0, budgetConsumed: 0, runId })
    }

    const reservationId = String(reservationRow.reservation_id)
    const results: Record<string, string> = {}
    let attempted = 0
    let succeeded = 0
    let failed = 0
    let terminalError: Error | null = null
    let capturePayloadHash: string | null = null

    const client = new TrendlyneObservedMcpClient(mcpUrl)
    for (const term of PHARMA_HISTORY_DISCOVERY_TERMS) {
      attempted += 1
      const attemptedAt = new Date().toISOString()
      try {
        results[term.code] = await client.getParameterValuesMultiStock(term.query, "stock")
        succeeded += 1
        await recordUsage(admin, runId, runItemId, security.data.id, attempted, attemptedAt, "SUCCEEDED", null)
      } catch (error) {
        failed += 1
        const message = error instanceof Error ? error.message : "PROVIDER_REQUEST_FAILED"
        const safeErrorCode = message === "PROVIDER_TOOL_CONTRACT_ERROR" ? message : "PROVIDER_REQUEST_FAILED"
        await recordUsage(admin, runId, runItemId, security.data.id, attempted, attemptedAt, "FAILED", safeErrorCode)
        terminalError = new Error(safeErrorCode)
        break
      }
    }

    const released = PHARMA_HISTORY_DISCOVERY_MAX_PROVIDER_CALLS - attempted
    const settlement = await admin.rpc("settle_provider_budget_v1", {
      p_reservation_id: reservationId,
      p_consumed_units: succeeded,
      p_failed_units: failed,
      p_released_units: released,
    })
    if (settlement.error) terminalError = new Error("BUDGET_SETTLEMENT_FAILED")

    if (!terminalError) {
      try {
        capturePayloadHash = await persistCapture(admin, runId, security.data.id, results)
      } catch (error) {
        terminalError = error instanceof Error ? error : new Error("CAPTURE_PERSISTENCE_FAILED")
      }
    }

    try {
      await finishItem(admin, runItemId, terminalError ? "FAILED" : "ACCEPTED", terminalError ? terminalError.message : null, attempted)
    } catch (error) {
      if (!terminalError) terminalError = error instanceof Error ? error : new Error("RUN_ITEM_ACCOUNTING_FAILED")
    }

    await admin.from("data_ingestion_runs").update({
      status: terminalError ? "FAILED" : "SUCCEEDED",
      completed_at: new Date().toISOString(),
      attempted_call_count: attempted,
      fetched_count: 0,
      accepted_count: 0,
      failed_count: terminalError ? 1 : 0,
      skipped_count: 0,
      error_summary: terminalError ? terminalError.message : null,
      metadata: {
        mode: "PHARMA_HISTORY_TARGETED_DISCOVERY_ONLY",
        contract_version: PHARMA_HISTORY_DISCOVERY_VERSION,
        reference: PHARMA_HISTORY_DISCOVERY_REFERENCE,
        queries: PHARMA_HISTORY_DISCOVERY_TERMS,
        consumed_units: succeeded,
        failed_units: failed,
        released_units: released,
        capture_record_kind: capturePayloadHash ? CAPTURE_RECORD_KIND : null,
        capture_payload_hash: capturePayloadHash,
        canonical_promotion_performed: false,
        research_writes_performed: 0,
      },
    }).eq("id", runId)

    if (terminalError) {
      return reply(502, {
        error: "PHARMA history discovery failed safely.",
        code: terminalError.message,
        providerCalls: attempted,
        budgetConsumed: succeeded,
        budgetFailed: failed,
        budgetReleased: released,
        runId,
      })
    }

    return reply(200, {
      mode: "PHARMA_HISTORY_TARGETED_DISCOVERY_ONLY",
      contractVersion: PHARMA_HISTORY_DISCOVERY_VERSION,
      security: security.data.symbol,
      providerInstrumentId: PHARMA_HISTORY_DISCOVERY_REFERENCE.providerInstrumentId,
      providerCalls: attempted,
      budgetConsumed: succeeded,
      budgetFailed: failed,
      budgetReleased: released,
      researchWritesPerformed: 0,
      canonicalPromotionPerformed: false,
      capturePayloadHash,
      runId,
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : "PHARMA_HISTORY_CONTRACT_DISCOVERY_FAILED"
    return reply(502, { error: "PHARMA history contract discovery failed safely.", code })
  }
})
