import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { TrendlyneObservedMcpClient } from "../_shared/trendlyne-observed.ts"
import {
  PHARMA_VALUATION_DISCOVERY_MAX_PROVIDER_CALLS,
  PHARMA_VALUATION_DISCOVERY_METRIC_QUERY,
  PHARMA_VALUATION_DISCOVERY_PEERS,
  PHARMA_VALUATION_DISCOVERY_REFERENCE,
  PHARMA_VALUATION_DISCOVERY_VERSION,
} from "../_shared/pharma-valuation-discovery.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const SOURCE_CODE = "TRENDLYNE_MCP"
const DATA_DOMAIN = "PHARMA_VALUATION_CONTRACT_DISCOVERY"
const OPERATION_CLASS = "PHARMA_VALUATION_DISCOVERY"
const CAPTURE_RECORD_KIND = "PHARMA_VALUATION_CONTRACT_DISCOVERY_V1"
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
      mode: "PHARMA_VALUATION_CONTRACT_DISCOVERY_ONLY",
      contract_version: PHARMA_VALUATION_DISCOVERY_VERSION,
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
  identities: Readonly<Record<string, string>>,
  metricResult: string,
) {
  const rawPayload = {
    mode: "PHARMA_VALUATION_CONTRACT_DISCOVERY_ONLY",
    contract_version: PHARMA_VALUATION_DISCOVERY_VERSION,
    run_id: runId,
    reference: PHARMA_VALUATION_DISCOVERY_REFERENCE,
    peer_identity_queries: PHARMA_VALUATION_DISCOVERY_PEERS,
    identity_results: identities,
    metric_query: PHARMA_VALUATION_DISCOVERY_METRIC_QUERY,
    metric_result: metricResult,
  }
  const serialized = JSON.stringify(rawPayload)
  if (new TextEncoder().encode(serialized).byteLength > MAX_CAPTURE_BYTES) throw new Error("CAPTURE_PAYLOAD_TOO_LARGE")
  const payloadHash = await sha256Hex(serialized)
  const result = await admin.from("data_source_records").insert({
    source_code: SOURCE_CODE,
    ingestion_run_id: runId,
    record_kind: CAPTURE_RECORD_KIND,
    external_record_id: `${PHARMA_VALUATION_DISCOVERY_REFERENCE.providerInstrumentId}:${PHARMA_VALUATION_DISCOVERY_VERSION}:${runId}`,
    retrieved_at: new Date().toISOString(),
    payload_hash: payloadHash,
    raw_payload: rawPayload,
    terms_snapshot: {
      mode: "PHARMA_VALUATION_CONTRACT_DISCOVERY_ONLY",
      contract_version: PHARMA_VALUATION_DISCOVERY_VERSION,
      canonical_promotion_performed: false,
      research_writes_performed: 0,
    },
  })
  if (result.error) throw new Error("CAPTURE_PERSISTENCE_FAILED")
  return payloadHash
}

const PROVIDER_REQUEST_TIMEOUT_MS = 45_000

const timeoutFetch: typeof fetch = async (input, init = {}) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROVIDER_REQUEST_TIMEOUT_MS)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("PROVIDER_REQUEST_TIMEOUT")
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
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
  if (!supabaseUrl || !anonKey || !serviceKey || !mcpUrl) {
    return reply(500, { error: "Server configuration is incomplete." })
  }

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
      .eq("symbol", PHARMA_VALUATION_DISCOVERY_REFERENCE.symbol)
      .single()
    if (security.error || security.data.asset_class !== "EQUITY") {
      return reply(409, { error: "TORNTPHARM reference security is unavailable.", providerCalls: 0 })
    }

    const holding = await admin.from("current_holdings")
      .select("security_id")
      .eq("portfolio_id", body.portfolioId)
      .eq("security_id", security.data.id)
      .maybeSingle()
    if (holding.error || !holding.data) {
      return reply(409, { error: "TORNTPHARM reference security must be an open holding.", providerCalls: 0 })
    }

    const source = await admin.from("data_sources")
      .select("is_active,entitlement_verified,retention_rights_verified")
      .eq("code", SOURCE_CODE)
      .single()
    const control = await admin.from("provider_ingestion_controls")
      .select("ingestion_enabled,policy_version")
      .eq("source_code", SOURCE_CODE)
      .single()
    if (
      source.error || control.error
      || !source.data.is_active
      || !source.data.entitlement_verified
      || !source.data.retention_rights_verified
      || !control.data.ingestion_enabled
    ) {
      return reply(409, { error: "Trusted Trendlyne configuration is incomplete.", providerCalls: 0 })
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
      estimated_call_count: PHARMA_VALUATION_DISCOVERY_MAX_PROVIDER_CALLS,
      reserved_call_count: PHARMA_VALUATION_DISCOVERY_MAX_PROVIDER_CALLS,
      attempted_call_count: 0,
      policy_version: control.data.policy_version,
      metadata: {
        mode: "PHARMA_VALUATION_CONTRACT_DISCOVERY_ONLY",
        contract_version: PHARMA_VALUATION_DISCOVERY_VERSION,
        peers: PHARMA_VALUATION_DISCOVERY_PEERS,
      },
    }).select("id").single()
    if (run.error) throw new Error("RUN_ACCOUNTING_FAILED")
    const runId = String(run.data.id)

    const runItem = await admin.from("data_ingestion_run_items").insert({
      ingestion_run_id: runId,
      security_id: security.data.id,
      data_domain: DATA_DOMAIN,
      status: "PLANNED",
      metadata: { contract_version: PHARMA_VALUATION_DISCOVERY_VERSION },
    }).select("id").single()
    if (runItem.error) throw new Error("RUN_ITEM_ACCOUNTING_FAILED")
    const runItemId = String(runItem.data.id)

    const reservation = await admin.rpc("reserve_provider_budget_v1", {
      p_source_code: SOURCE_CODE,
      p_ingestion_run_id: runId,
      p_reservation_key: `${runId}:${DATA_DOMAIN}`,
      p_estimated_units: PHARMA_VALUATION_DISCOVERY_MAX_PROVIDER_CALLS,
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
      return reply(budgetHttpStatus(reasonCode), {
        error: "Provider budget reservation was not granted.",
        code: reasonCode,
        providerCalls: 0,
        runId,
      })
    }

    const reservationId = String(reservationRow.reservation_id)
    const client = new TrendlyneObservedMcpClient(mcpUrl, timeoutFetch)
    const identities: Record<string, string> = {}
    let metricResult = ""
    let attempted = 0
    let succeeded = 0
    let failed = 0
    let terminalError: Error | null = null
    let capturePayloadHash: string | null = null

    for (const peer of PHARMA_VALUATION_DISCOVERY_PEERS) {
      attempted += 1
      const attemptedAt = new Date().toISOString()
      try {
        identities[peer.symbol] = await client.searchEntities(`${peer.name} ${peer.symbol}`, "stock", 10)
        succeeded += 1
        await recordUsage(admin, runId, runItemId, security.data.id, attempted, attemptedAt, "SUCCEEDED", null)
      } catch {
        failed += 1
        await recordUsage(admin, runId, runItemId, security.data.id, attempted, attemptedAt, "FAILED", "PROVIDER_REQUEST_FAILED")
        terminalError = new Error("PROVIDER_REQUEST_FAILED")
        break
      }
    }

    if (!terminalError) {
      attempted += 1
      const attemptedAt = new Date().toISOString()
      try {
        metricResult = await client.getParameterValuesMultiStock(PHARMA_VALUATION_DISCOVERY_METRIC_QUERY, "stock")
        succeeded += 1
        await recordUsage(admin, runId, runItemId, security.data.id, attempted, attemptedAt, "SUCCEEDED", null)
      } catch {
        failed += 1
        await recordUsage(admin, runId, runItemId, security.data.id, attempted, attemptedAt, "FAILED", "PROVIDER_REQUEST_FAILED")
        terminalError = new Error("PROVIDER_REQUEST_FAILED")
      }
    }

    const released = PHARMA_VALUATION_DISCOVERY_MAX_PROVIDER_CALLS - attempted
    const settlement = await admin.rpc("settle_provider_budget_v1", {
      p_reservation_id: reservationId,
      p_consumed_units: succeeded,
      p_failed_units: failed,
      p_released_units: released,
    })
    if (settlement.error) terminalError = new Error("BUDGET_SETTLEMENT_FAILED")

    if (!terminalError) {
      try {
        capturePayloadHash = await persistCapture(admin, runId, security.data.id, identities, metricResult)
      } catch (error) {
        terminalError = error instanceof Error ? error : new Error("CAPTURE_PERSISTENCE_FAILED")
      }
    }

    await finishItem(
      admin,
      runItemId,
      terminalError ? "FAILED" : "ACCEPTED",
      terminalError ? terminalError.message : null,
      attempted,
    )

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
        mode: "PHARMA_VALUATION_CONTRACT_DISCOVERY_ONLY",
        contract_version: PHARMA_VALUATION_DISCOVERY_VERSION,
        consumed_units: succeeded,
        failed_units: failed,
        released_units: released,
        capture_payload_hash: capturePayloadHash,
        canonical_promotion_performed: false,
        research_writes_performed: 0,
      },
    }).eq("id", runId)

    if (terminalError) {
      return reply(502, {
        error: "Pharma valuation contract discovery failed safely.",
        code: terminalError.message,
        providerCalls: attempted,
        runId,
      })
    }

    return reply(200, {
      mode: "PHARMA_VALUATION_CONTRACT_DISCOVERY_ONLY",
      contractVersion: PHARMA_VALUATION_DISCOVERY_VERSION,
      providerCalls: attempted,
      identities,
      metricResult,
      capturePayloadHash,
      canonicalPromotionPerformed: false,
      researchWritesPerformed: 0,
      runId,
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : "PHARMA_VALUATION_CONTRACT_DISCOVERY_FAILED"
    return reply(502, { error: "Pharma valuation contract discovery failed safely.", code })
  }
})
