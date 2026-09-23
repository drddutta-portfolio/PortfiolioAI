import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { parseTrendlyneClassificationCandidates } from "../_shared/trendlyne-classification.ts"
import { parseOverview, reconcileTrendlyneIdentityDiscovery } from "../_shared/trendlyne.ts"
import { TrendlyneObservedMcpClient } from "../_shared/trendlyne-observed.ts"

const SOURCE_CODE = "TRENDLYNE_MCP"
const CONFIRMATION = "OWNER_CONFIRMED_PROGRAM_A_A2_IDENTITY_DISCOVERY"
const RESERVED_UNITS = 2
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" }
const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })
const localUrl = (value: string) => { try { const url = new URL(value); return ["localhost", "127.0.0.1"].includes(url.hostname) || (url.hostname === "kong" && url.port === "8000") } catch { return false } }
const hash = async (value: unknown) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value))))).map(byte => byte.toString(16).padStart(2, "0")).join("")

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." })
  const authorization = request.headers.get("Authorization")
  if (!authorization) return reply(401, { error: "Authentication required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
  const supabaseUrl = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), mcpUrl = Deno.env.get("TRENDLYNE_MCP_URL")
  if (!supabaseUrl || !anonKey || !serviceKey || !mcpUrl) return reply(500, { error: "Server configuration is incomplete.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
  if (!localUrl(supabaseUrl)) return reply(409, { error: "Program A A2 execution is local-only.", code: "UNEXPECTED_PRODUCTION_DB_TARGET", providerCalls: 0 })
  try {
    const body = await request.json() as { action?: unknown; portfolioId?: unknown; securityId?: unknown; confirmation?: unknown }
    if (body.action !== "EXECUTE" || body.confirmation !== CONFIRMATION || typeof body.portfolioId !== "string" || typeof body.securityId !== "string") return reply(409, { error: "Exact Program A A2 identity authorization is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } }), auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return reply(401, { error: "Invalid session.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    const [portfolio, holding, securityResult, source, control] = await Promise.all([
      admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", auth.data.user.id).single(),
      admin.from("current_holdings").select("security_id").eq("portfolio_id", body.portfolioId).eq("security_id", body.securityId).maybeSingle(),
      admin.from("securities").select("id,name,symbol,isin,exchange,series,asset_class").eq("id", body.securityId).single(),
      admin.from("data_sources").select("is_active,entitlement_verified,retention_rights_verified").eq("code", SOURCE_CODE).single(),
      admin.from("provider_ingestion_controls").select("ingestion_enabled,daily_internal_attempt_limit,per_run_internal_attempt_limit,actual_provider_quota_status,policy_version").eq("source_code", SOURCE_CODE).single(),
    ])
    if (portfolio.error || holding.error || !holding.data) return reply(403, { error: "Identity discovery is limited to an owned open holding.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
    if (securityResult.error || securityResult.data.asset_class !== "EQUITY" || !securityResult.data.isin) return reply(409, { error: "Canonical equity identity is incomplete.", code: "CLASSIFICATION_IDENTITY_PREREQUISITE_MISSING", providerCalls: 0 })
    if (source.error || control.error || !source.data.is_active || !source.data.entitlement_verified || !source.data.retention_rights_verified || !control.data.ingestion_enabled || control.data.actual_provider_quota_status !== "VERIFIED" || RESERVED_UNITS > control.data.per_run_internal_attempt_limit) return reply(409, { error: "Provider controls do not allow identity discovery.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
    const existing = await admin.from("security_identity_observations").select("provider_instrument_id,evidence_status").eq("security_id", body.securityId).eq("source_code", SOURCE_CODE)
    if (existing.error) throw new Error("IDENTITY_READ_FAILED")
    const matched = (existing.data ?? []).filter(row => row.evidence_status === "MATCHED" && row.provider_instrument_id)
    if ((existing.data ?? []).some(row => row.evidence_status === "CONFLICTING") || new Set(matched.map(row => row.provider_instrument_id)).size > 1) return reply(409, { error: "Conflicting matched Trendlyne identity exists.", code: "BLOCKED_IDENTITY_CONFLICT", providerCalls: 0 })
    if (matched.length) return reply(200, { state: "VERIFIED_EXISTING_IDENTITY", providerInstrumentId: matched[0].provider_instrument_id, providerCalls: 0, localWrites: 0 })
    const today = new Date(); today.setUTCHours(0, 0, 0, 0)
    const usage = await admin.from("provider_usage_events").select("actual_internal_units").eq("source_code", SOURCE_CODE).eq("accounting_class", "PROVIDER_TOOL_ATTEMPT").gte("attempted_at", today.toISOString())
    const used = (usage.data ?? []).reduce((sum, row) => sum + Number(row.actual_internal_units ?? 0), 0)
    if (usage.error || used + RESERVED_UNITS > control.data.daily_internal_attempt_limit) return reply(429, { error: "Provider call budget unavailable.", code: "CALL_BUDGET_EXCEEDED", providerCalls: 0 })
    const run = await admin.from("data_ingestion_runs").insert({ source_code: SOURCE_CODE, portfolio_id: body.portfolioId, operation: "RESOLVE_PROVIDER_IDENTITY", orchestration_type: "PROGRAM_A_A2_IDENTITY_PREREQUISITE", trigger_source: "OWNER", requested_by: auth.data.user.id, status: "RUNNING", requested_count: 1, estimated_call_count: RESERVED_UNITS, reserved_call_count: RESERVED_UNITS, policy_version: control.data.policy_version, metadata: { security: securityResult.data.symbol } }).select("id").single()
    if (run.error) throw new Error("RUN_ACCOUNTING_FAILED")
    const item = await admin.from("data_ingestion_run_items").insert({ ingestion_run_id: run.data.id, security_id: body.securityId, data_domain: "PROVIDER_IDENTITY", status: "PLANNED" }).select("id").single()
    if (item.error) throw new Error("RUN_ITEM_ACCOUNTING_FAILED")
    const reservation = await admin.rpc("reserve_provider_budget_v1", { p_source_code: SOURCE_CODE, p_ingestion_run_id: run.data.id, p_reservation_key: `${run.data.id}:PROVIDER_IDENTITY`, p_estimated_units: RESERVED_UNITS, p_reservation_seconds: 900 })
    if (reservation.error || !reservation.data?.[0]?.reserved) return reply(429, { error: "Provider budget reservation failed.", code: "CALL_BUDGET_EXCEEDED", providerCalls: 0 })
    const client = new TrendlyneObservedMcpClient(mcpUrl)
    let attempted = 0
    const tracked = async (operation: string, call: () => Promise<string>) => {
      const started = new Date().toISOString(); attempted += 1
      try { const text = await call(); await admin.rpc("record_provider_usage_event_v1", { p_source_code: SOURCE_CODE, p_ingestion_run_id: run.data.id, p_run_item_id: item.data.id, p_security_id: body.securityId, p_data_domain: "PROVIDER_IDENTITY", p_operation_class: operation, p_accounting_class: "PROVIDER_TOOL_ATTEMPT", p_estimated_internal_units: 1, p_actual_internal_units: 1, p_attempted_at: started, p_completed_at: new Date().toISOString(), p_outcome: "SUCCEEDED", p_safe_error_code: null, p_retry_attempt: 0, p_idempotency_key: `${run.data.id}:${operation}` }); return text }
      catch (error) { const code = error instanceof Error ? error.message : "PROVIDER_REQUEST_FAILED"; await admin.rpc("record_provider_usage_event_v1", { p_source_code: SOURCE_CODE, p_ingestion_run_id: run.data.id, p_run_item_id: item.data.id, p_security_id: body.securityId, p_data_domain: "PROVIDER_IDENTITY", p_operation_class: operation, p_accounting_class: "PROVIDER_TOOL_ATTEMPT", p_estimated_internal_units: 1, p_actual_internal_units: 1, p_attempted_at: started, p_completed_at: new Date().toISOString(), p_outcome: "FAILED", p_safe_error_code: code, p_retry_attempt: 0, p_idempotency_key: `${run.data.id}:${operation}` }); throw error }
    }
    try {
      const searchText = await tracked("SEARCH_ENTITIES", () => client.searchEntities(`${securityResult.data.name} ${securityResult.data.symbol} ${securityResult.data.isin}`, "stock", 10))
      const overviewText = await tracked("GET_OVERVIEW_NEWS_CORP_EVENTS", () => client.getOverviewNewsCorpEvents(securityResult.data.symbol, "overview"))
      const identity = reconcileTrendlyneIdentityDiscovery({ name: securityResult.data.name, symbol: securityResult.data.symbol, isin: securityResult.data.isin, bseCode: null }, parseTrendlyneClassificationCandidates(searchText), parseOverview(overviewText))
      const payload = { security_id: body.securityId, canonical: { name: securityResult.data.name, symbol: securityResult.data.symbol, isin: securityResult.data.isin }, matched_identity: identity, search_result: searchText, overview_result: overviewText }
      const payloadHash = await hash(payload)
      const record = await admin.from("data_source_records").upsert({ source_code: SOURCE_CODE, ingestion_run_id: run.data.id, record_kind: "SECURITY_IDENTITY", external_record_id: `${identity.stockId}:identity`, payload_hash: payloadHash, raw_payload: payload, retrieved_at: new Date().toISOString(), terms_snapshot: { mode: "PROGRAM_A_A2_IDENTITY_PREREQUISITE", exact_symbol_isin_required: true } }, { onConflict: "source_code,record_kind,external_record_id,payload_hash", ignoreDuplicates: true }).select("id").maybeSingle()
      let sourceRecordId = record.data?.id
      if (!sourceRecordId) { const found = await admin.from("data_source_records").select("id").eq("source_code", SOURCE_CODE).eq("record_kind", "SECURITY_IDENTITY").eq("external_record_id", `${identity.stockId}:identity`).eq("payload_hash", payloadHash).single(); if (found.error) throw new Error("IDENTITY_PROVENANCE_FAILED"); sourceRecordId = found.data.id }
      const conflict = await admin.from("security_identity_observations").select("provider_instrument_id").eq("security_id", body.securityId).eq("source_code", SOURCE_CODE).eq("evidence_status", "MATCHED").neq("provider_instrument_id", identity.stockId)
      if (conflict.error || (conflict.data ?? []).length) throw new Error("BLOCKED_IDENTITY_CONFLICT")
      const same = await admin.from("security_identity_observations").select("id").eq("security_id", body.securityId).eq("source_code", SOURCE_CODE).eq("evidence_status", "MATCHED").eq("provider_instrument_id", identity.stockId).maybeSingle()
      let localWrites = record.data?.id ? 1 : 0
      if (!same.data) { const inserted = await admin.from("security_identity_observations").insert({ security_id: body.securityId, source_record_id: sourceRecordId, source_code: SOURCE_CODE, provider_instrument_id: identity.stockId, observed_name: identity.name, observed_isin: identity.isin, observed_exchange: securityResult.data.exchange, observed_symbol: identity.symbol, observed_series: securityResult.data.series, evidence_status: "MATCHED", confidence: "1.0000", observed_at: new Date().toISOString() }); if (inserted.error) throw new Error("IDENTITY_PERSISTENCE_FAILED"); localWrites += 1 }
      await admin.rpc("settle_provider_budget_v1", { p_reservation_id: reservation.data[0].reservation_id, p_consumed_units: attempted, p_failed_units: 0, p_released_units: RESERVED_UNITS - attempted })
      await admin.rpc("record_refresh_item_result_v1", { p_run_item_id: item.data.id, p_status: "ACCEPTED", p_safe_reason_code: null, p_attempted_call_count: attempted, p_accepted_record_count: 1, p_metadata: { provider_instrument_id: identity.stockId, exact_symbol_isin_match: true } })
      await admin.from("data_ingestion_runs").update({ status: "SUCCEEDED", completed_at: new Date().toISOString(), attempted_call_count: attempted, accepted_count: 1, fetched_count: 1, metadata: { security: securityResult.data.symbol, provider_instrument_id: identity.stockId } }).eq("id", run.data.id)
      return reply(200, { state: "VERIFIED_DURING_PREREQUISITE_DISCOVERY", providerInstrumentId: identity.stockId, providerCalls: attempted, localWrites, runId: run.data.id })
    } catch (error) {
      const code = error instanceof Error ? error.message : "PROVIDER_REQUEST_FAILED"
      await admin.rpc("settle_provider_budget_v1", { p_reservation_id: reservation.data[0].reservation_id, p_consumed_units: 0, p_failed_units: attempted, p_released_units: RESERVED_UNITS - attempted })
      await admin.rpc("record_refresh_item_result_v1", { p_run_item_id: item.data.id, p_status: "FAILED", p_safe_reason_code: code, p_attempted_call_count: attempted, p_accepted_record_count: 0, p_metadata: {} })
      await admin.from("data_ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), attempted_call_count: attempted, failed_count: 1, error_summary: code }).eq("id", run.data.id)
      return reply(409, { error: "Trendlyne identity discovery failed safely.", code, providerCalls: attempted, localWrites: 0, runId: run.data.id })
    }
  } catch (error) { return reply(500, { error: "Trendlyne identity discovery failed safely.", code: error instanceof Error ? error.message : "PROVIDER_REQUEST_FAILED", providerCalls: 0 }) }
})
