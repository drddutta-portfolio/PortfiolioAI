import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { TrendlyneMcpClient } from "../_shared/trendlyne.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const SOURCE_CODE = "TRENDLYNE_MCP"
const DATA_DOMAIN = "CONTRACT_DISCOVERY"
const OPERATION_CLASS = "SEARCH_PARAMETERS"
const DISCOVERY_TERMS = ["ROCE", "diluted EPS", "EBITDA", "operating margin"] as const
const RESERVED_UNITS = DISCOVERY_TERMS.length

type RequestBody = { readonly portfolioId?: unknown; readonly securityId?: unknown }
type Admin = ReturnType<typeof createClient>

const safeProviderErrorCode = (_error: unknown) => "PROVIDER_REQUEST_FAILED"

const budgetHttpStatus = (reasonCode: string) => {
  if (reasonCode === "INGESTION_DISABLED") return 409
  if (reasonCode === "DAILY_LIMIT" || reasonCode === "ROLLING_LIMIT" || reasonCode === "PER_RUN_LIMIT" || reasonCode === "CONCURRENCY_LIMIT") return 429
  return 503
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
  const usage = await admin.rpc("record_provider_usage_event_v1", {
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
  })
  if (usage.error) throw new Error("USAGE_ACCOUNTING_FAILED")
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
      mode: "CONTRACT_DISCOVERY_ONLY",
      research_writes_performed: 0,
      terms: DISCOVERY_TERMS,
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
    if (security.error || security.data.asset_class !== "EQUITY") return reply(400, { error: "Contract discovery is limited to held equities." })

    const identity = await admin.from("security_identity_observations")
      .select("provider_instrument_id,evidence_status")
      .eq("security_id", body.securityId)
      .eq("source_code", SOURCE_CODE)
      .eq("evidence_status", "MATCHED")
      .not("provider_instrument_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (identity.error || !identity.data?.provider_instrument_id) return reply(409, { error: "Verified Trendlyne identity is required before contract discovery." })

    const source = await admin.from("data_sources")
      .select("is_active,entitlement_verified,retention_rights_verified")
      .eq("code", SOURCE_CODE)
      .single()
    if (source.error) return reply(503, { error: "Provider configuration is unavailable." })
    if (!source.data.is_active || !source.data.entitlement_verified || !source.data.retention_rights_verified) {
      return reply(409, { error: "The trusted provider configuration is incomplete.", providerCalls: 0, budgetConsumed: 0 })
    }

    const control = await admin.from("provider_ingestion_controls")
      .select("ingestion_enabled,policy_version")
      .eq("source_code", SOURCE_CODE)
      .single()
    if (control.error) return reply(503, { error: "Provider safety controls are unavailable.", providerCalls: 0, budgetConsumed: 0 })
    if (!control.data.ingestion_enabled) {
      await admin.from("data_ingestion_runs").insert({
        source_code: SOURCE_CODE,
        portfolio_id: body.portfolioId,
        operation: DATA_DOMAIN,
        orchestration_type: DATA_DOMAIN,
        trigger_source: "OWNER",
        requested_by: auth.data.user.id,
        status: "CONFIGURATION_PENDING",
        completed_at: new Date().toISOString(),
        requested_count: 1,
        estimated_call_count: RESERVED_UNITS,
        reserved_call_count: 0,
        attempted_call_count: 0,
        skipped_count: 1,
        policy_version: control.data.policy_version,
        metadata: { reason: "PROVIDER_INGESTION_DISABLED", terms: DISCOVERY_TERMS },
      })
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
      estimated_call_count: RESERVED_UNITS,
      reserved_call_count: RESERVED_UNITS,
      attempted_call_count: 0,
      policy_version: control.data.policy_version,
      metadata: { mode: "CONTRACT_DISCOVERY_ONLY", terms: DISCOVERY_TERMS },
    }).select("id").single()
    if (run.error) throw new Error("RUN_ACCOUNTING_FAILED")
    const runId = run.data.id as string

    const runItem = await admin.from("data_ingestion_run_items").insert({
      ingestion_run_id: runId,
      security_id: body.securityId,
      data_domain: DATA_DOMAIN,
      status: "PLANNED",
      metadata: { terms: DISCOVERY_TERMS },
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
    let attempted = 0
    let providerFailed = 0
    let terminalError: Error | null = null
    const searches: Record<string, string> = {}

    try {
      const client = new TrendlyneMcpClient(mcpUrl)
      for (const term of DISCOVERY_TERMS) {
        attempted += 1
        const attemptedAt = new Date().toISOString()
        try {
          searches[term] = await client.searchParameters(term)
        } catch (error) {
          providerFailed += 1
          await recordUsage(admin, runId, runItemId, body.securityId, attempted, attemptedAt, "FAILED", safeProviderErrorCode(error))
          throw error
        }
        await recordUsage(admin, runId, runItemId, body.securityId, attempted, attemptedAt, "SUCCEEDED", null)
      }
    } catch (error) {
      terminalError = error instanceof Error ? error : new Error("CONTRACT_DISCOVERY_FAILED")
    }

    const consumedUnits = attempted - providerFailed
    const releasedUnits = RESERVED_UNITS - attempted
    const settlement = await admin.rpc("settle_provider_budget_v1", {
      p_reservation_id: reservationId,
      p_consumed_units: consumedUnits,
      p_failed_units: providerFailed,
      p_released_units: releasedUnits,
    })
    if (settlement.error && !terminalError) terminalError = new Error("BUDGET_SETTLEMENT_FAILED")

    try {
      await completeRunItem(admin, runItemId, terminalError ? "FAILED" : "ACCEPTED", terminalError ? "CONTRACT_DISCOVERY_FAILED" : null, attempted)
    } catch (error) {
      if (!terminalError) terminalError = error instanceof Error ? error : new Error("RUN_ITEM_ACCOUNTING_FAILED")
    }

    const completed = await admin.from("data_ingestion_runs").update({
      status: terminalError ? "FAILED" : "SUCCEEDED",
      completed_at: new Date().toISOString(),
      attempted_call_count: attempted,
      fetched_count: 0,
      accepted_count: 0,
      failed_count: terminalError ? 1 : 0,
      skipped_count: 0,
      error_summary: terminalError ? terminalError.message : null,
      metadata: {
        mode: "CONTRACT_DISCOVERY_ONLY",
        terms: DISCOVERY_TERMS,
        consumed_units: consumedUnits,
        failed_units: providerFailed,
        released_units: releasedUnits,
      },
    }).eq("id", runId)
    if (completed.error && !terminalError) terminalError = new Error("RUN_ACCOUNTING_FAILED")

    if (terminalError) throw terminalError

    return reply(200, {
      mode: "CONTRACT_DISCOVERY_ONLY",
      security: security.data.symbol,
      providerInstrumentId: identity.data.provider_instrument_id,
      terms: DISCOVERY_TERMS,
      providerCalls: attempted,
      budgetConsumed: consumedUnits,
      budgetFailed: providerFailed,
      budgetReleased: releasedUnits,
      researchWritesPerformed: 0,
      valuesRetrieved: false,
      operationalAccountingRecorded: true,
      runId,
      reservationId,
      searches,
      note: "No metric contract is promoted by this response. Results require owner review before parser/storage changes.",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Contract discovery failed."
    return reply(502, { error: message.replace(/https?:\/\/\S+/g, "[redacted-url]") })
  }
})
