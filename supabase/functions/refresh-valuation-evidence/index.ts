import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
})

const SOURCE_CODE = "TRENDLYNE_MCP"
const METRIC_CODE = "PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT"
const PROVIDER_LABEL = "Fair Price 5YrPE Upside%"
const CONFIRMATION = "OWNER_CONFIRMED_VALUATION_EVIDENCE_REFRESH"
const RESERVED_UNITS = 1

type Admin = ReturnType<typeof createClient>
type RequestBody = { readonly action?: unknown; readonly portfolioId?: unknown; readonly securityId?: unknown; readonly confirmation?: unknown }
type Security = { readonly id: string; readonly symbol: string; readonly name: string; readonly asset_class: string }

const decodeMcpResult = (body: string): unknown => {
  let payload: Record<string, unknown>
  try {
    const events = body.split(/\r?\n/).map(x => x.trim()).filter(x => x.startsWith("data:")).map(x => x.slice(5).trim()).filter(x => x && x !== "[DONE]")
    payload = (events.length ? events.map(JSON.parse).at(-1) : JSON.parse(body)) as Record<string, unknown>
  } catch { throw new Error("PROVIDER_PROTOCOL_ERROR") }
  if (!payload || payload.error) throw new Error("PROVIDER_RPC_ERROR")
  return payload.result
}

class TrendlyneClient {
  #session: string | null = null
  #next = 1
  constructor(private readonly endpoint: string) {}
  async #post(payload: unknown): Promise<unknown> {
    const headers: Record<string, string> = { "Content-Type": "application/json", "Accept": "application/json, text/event-stream" }
    if (this.#session) headers["Mcp-Session-Id"] = this.#session
    let response: Response
    try { response = await fetch(this.endpoint, { method: "POST", headers, body: JSON.stringify(payload) }) }
    catch { throw new Error("PROVIDER_NETWORK_ERROR") }
    if (!response.ok) throw new Error(`PROVIDER_HTTP_${response.status}`)
    this.#session = response.headers.get("mcp-session-id") ?? this.#session
    const body = await response.text()
    return body.trim() ? decodeMcpResult(body) : null
  }
  async initialize() {
    await this.#post({ jsonrpc: "2.0", id: this.#next++, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "PortfolioAI", version: "1" } } })
    await this.#post({ jsonrpc: "2.0", method: "notifications/initialized", params: {} })
  }
  async getParameterValuesMultiStock(query: string): Promise<string> {
    if (!this.#session) await this.initialize()
    const result = await this.#post({ jsonrpc: "2.0", id: this.#next++, method: "tools/call", params: { name: "get_parameter_values_multi_stock", arguments: { query, type: "stock" } } }) as { content?: { type: string; text?: string }[]; structuredContent?: { result?: string } }
    const text = result?.structuredContent?.result ?? result?.content?.find(x => x.type === "text")?.text
    if (typeof text !== "string") throw new Error("PROVIDER_RESULT_MISSING")
    const normalized = text.trim().toLowerCase()
    if (normalized.startsWith("unknown tool:") || normalized.includes("tool not found") || normalized.includes("method not found")) throw new Error("PROVIDER_TOOL_CONTRACT_ERROR")
    return text
  }
}

function parseTargetValue(providerResult: string, expectedSymbol: string, expectedInstrumentId: string): number {
  let parsed: unknown
  try { parsed = JSON.parse(providerResult) } catch { throw new Error("PROVIDER_RESULT_JSON_INVALID") }
  if (!parsed || typeof parsed !== "object" || typeof (parsed as { markdown_data?: unknown }).markdown_data !== "string") throw new Error("PROVIDER_MARKDOWN_MISSING")
  let markdown = (parsed as { markdown_data: string }).markdown_data.trim()
  if (markdown.startsWith('"') && markdown.endsWith('"')) markdown = markdown.slice(1, -1)
  markdown = markdown.replace(/\\n/g, "\n")
  const lines = markdown.split(/\r?\n/).map(x => x.trim())
  const first = lines.find(Boolean)
  if (!first) throw new Error("PROVIDER_PRIMARY_ENTITY_MISMATCH")
  const fields = first.split("|").map(x => x.trim())
  if (fields.length < 3 || fields[0] !== expectedInstrumentId || fields[2].toUpperCase() !== expectedSymbol.toUpperCase()) throw new Error("PROVIDER_PRIMARY_ENTITY_MISMATCH")
  const indexes = lines.flatMap((line, index) => line === PROVIDER_LABEL ? [index] : [])
  if (indexes.length !== 1) throw new Error("VALUATION_FIELD_NOT_FOUND")
  const values: string[] = []
  for (let index = indexes[0] + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line === "---") break
    if (line.startsWith(`${expectedSymbol}:`)) values.push(line.slice(expectedSymbol.length + 1).trim())
  }
  if (values.length !== 1 || !values[0] || values[0] === "None") throw new Error("VALUATION_FIELD_NOT_FOUND")
  const value = Number(values[0])
  if (!Number.isFinite(value)) throw new Error("VALUATION_VALUE_INVALID")
  return value
}

const hash = async (value: unknown) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value))))).map(byte => byte.toString(16).padStart(2, "0")).join("")

async function recordUsage(admin: Admin, runId: string, itemId: string, securityId: string, attemptedAt: string, outcome: "SUCCEEDED" | "FAILED", safeCode: string | null) {
  const result = await admin.rpc("record_provider_usage_event_v1", {
    p_source_code: SOURCE_CODE,
    p_ingestion_run_id: runId,
    p_run_item_id: itemId,
    p_security_id: securityId,
    p_data_domain: "DETAILED_FUNDAMENTALS",
    p_operation_class: "GET_PARAMETER_VALUES_MULTI_STOCK",
    p_accounting_class: "PROVIDER_TOOL_ATTEMPT",
    p_estimated_internal_units: 1,
    p_actual_internal_units: 1,
    p_attempted_at: attemptedAt,
    p_completed_at: new Date().toISOString(),
    p_outcome: outcome,
    p_safe_error_code: safeCode,
    p_retry_attempt: 0,
    p_idempotency_key: `${runId}:VALUATION:1`,
  })
  if (result.error) throw new Error("USAGE_ACCOUNTING_FAILED")
}

async function markItem(admin: Admin, itemId: string, status: "ACCEPTED" | "FAILED" | "SKIPPED_BUDGET", safeCode: string | null, attempted: number, accepted: number, metadata: Record<string, unknown> = {}) {
  const result = await admin.rpc("record_refresh_item_result_v1", {
    p_run_item_id: itemId,
    p_status: status,
    p_safe_reason_code: safeCode,
    p_attempted_call_count: attempted,
    p_accepted_record_count: accepted,
    p_metadata: metadata,
  })
  if (result.error) throw new Error("RUN_ITEM_ACCOUNTING_FAILED")
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." })
  const authorization = request.headers.get("Authorization")
  if (!authorization) return reply(401, { error: "Authentication required." })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const mcpUrl = Deno.env.get("TRENDLYNE_MCP_URL")
  if (!supabaseUrl || !anonKey || !serviceKey) return reply(500, { error: "Server configuration is incomplete." })

  try {
    const body = await request.json() as RequestBody
    if (typeof body.portfolioId !== "string" || typeof body.securityId !== "string") return reply(400, { error: "portfolioId and securityId are required." })
    if (body.action !== "PLAN" && body.action !== "EXECUTE") return reply(400, { error: "Unknown action." })

    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session." })
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    const portfolio = await admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", auth.data.user.id).single()
    if (portfolio.error) return reply(404, { error: "Portfolio not found." })
    const holding = await admin.from("current_holdings").select("security_id").eq("portfolio_id", body.portfolioId).eq("security_id", body.securityId).maybeSingle()
    if (holding.error || !holding.data) return reply(403, { error: "Valuation refresh is limited to open holdings." })
    const securityResult = await admin.from("securities").select("id,symbol,name,asset_class").eq("id", body.securityId).single()
    if (securityResult.error || securityResult.data.asset_class !== "EQUITY") return reply(400, { error: "Valuation refresh currently supports held equities only." })
    const security = securityResult.data as Security

    const identityResult = await admin.from("security_identity_observations").select("provider_instrument_id,observed_symbol,created_at")
      .eq("security_id", body.securityId).eq("source_code", SOURCE_CODE).eq("evidence_status", "MATCHED")
      .not("provider_instrument_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle()
    if (identityResult.error || !identityResult.data?.provider_instrument_id) return reply(409, { error: "Verified Trendlyne identity is required before valuation refresh." })
    const providerInstrumentId = String(identityResult.data.provider_instrument_id)
    if (identityResult.data.observed_symbol && identityResult.data.observed_symbol !== security.symbol) return reply(409, { error: "Stored Trendlyne identity no longer matches the security symbol." })

    const source = await admin.from("data_sources").select("is_active,entitlement_verified,retention_rights_verified").eq("code", SOURCE_CODE).single()
    const control = await admin.from("provider_ingestion_controls").select("ingestion_enabled,daily_internal_attempt_limit,per_run_internal_attempt_limit,actual_provider_quota_status,policy_version").eq("source_code", SOURCE_CODE).single()
    if (source.error || control.error) return reply(503, { error: "Provider controls are unavailable." })

    const today = new Date(); today.setUTCHours(0, 0, 0, 0)
    const usage = await admin.from("provider_usage_events").select("actual_internal_units").eq("source_code", SOURCE_CODE).eq("accounting_class", "PROVIDER_TOOL_ATTEMPT").gte("attempted_at", today.toISOString())
    if (usage.error) return reply(503, { error: "Provider usage could not be calculated." })
    const dailyObservedUsage = (usage.data ?? []).reduce((sum, row) => sum + Number(row.actual_internal_units ?? 0), 0)
    const projectedDailyUsage = dailyObservedUsage + RESERVED_UNITS
    const trustedConfiguration = Boolean(source.data.is_active && source.data.entitlement_verified && source.data.retention_rights_verified)
    const executionAllowed = Boolean(trustedConfiguration && control.data.ingestion_enabled && control.data.actual_provider_quota_status === "VERIFIED" && RESERVED_UNITS <= control.data.per_run_internal_attempt_limit && projectedDailyUsage <= control.data.daily_internal_attempt_limit)

    const latest = await admin.from("fundamental_observations").select("numeric_value,retrieved_at,fresh_until,evidence_status")
      .eq("security_id", body.securityId).eq("metric_code", METRIC_CODE).order("retrieved_at", { ascending: false }).limit(1).maybeSingle()

    if (body.action === "PLAN") return reply(200, {
      mode: "VALUATION_EVIDENCE_REFRESH_PLAN",
      providerCalls: 0,
      security: security.symbol,
      providerInstrumentId,
      estimatedProviderCalls: RESERVED_UNITS,
      dailyObservedUsage,
      projectedDailyUsage,
      dailyLimit: control.data.daily_internal_attempt_limit,
      executionAllowed,
      latestValue: latest.data?.numeric_value === null || latest.data?.numeric_value === undefined ? null : Number(latest.data.numeric_value),
      latestRetrievedAt: latest.data?.retrieved_at ?? null,
      latestFreshUntil: latest.data?.fresh_until ?? null,
      latestEvidenceStatus: latest.data?.evidence_status ?? null,
      note: "Planning consumes zero provider calls. This refresh targets only the approved 5-year P/E self-history valuation evidence.",
    })

    if (body.confirmation !== CONFIRMATION) return reply(409, { error: "Explicit owner confirmation is required.", providerCalls: 0 })
    if (!executionAllowed) return reply(409, { error: "Current safety, quota, or provider-trust gates do not allow execution.", providerCalls: 0 })
    if (!mcpUrl) return reply(409, { error: "Trendlyne provider configuration is incomplete.", providerCalls: 0 })

    const run = await admin.from("data_ingestion_runs").insert({
      source_code: SOURCE_CODE,
      portfolio_id: body.portfolioId,
      operation: "VALUATION_EVIDENCE_REFRESH",
      orchestration_type: "SINGLE_SECURITY_TARGETED_REFRESH",
      trigger_source: "OWNER",
      requested_by: auth.data.user.id,
      status: "RUNNING",
      requested_count: 1,
      estimated_call_count: 1,
      reserved_call_count: 1,
      attempted_call_count: 0,
      policy_version: control.data.policy_version,
      metadata: { security: security.symbol, provider_instrument_id: providerInstrumentId, metric_code: METRIC_CODE, confirmation: CONFIRMATION },
    }).select("id").single()
    if (run.error) throw run.error
    const runId = run.data.id as string
    const item = await admin.from("data_ingestion_run_items").insert({ ingestion_run_id: runId, security_id: security.id, data_domain: "DETAILED_FUNDAMENTALS", status: "PLANNED", metadata: { mode: "VALUATION_EVIDENCE_REFRESH", metric_code: METRIC_CODE } }).select("id").single()
    if (item.error) throw item.error
    const itemId = item.data.id as string

    const reservation = await admin.rpc("reserve_provider_budget_v1", { p_source_code: SOURCE_CODE, p_ingestion_run_id: runId, p_reservation_key: `${runId}:VALUATION_EVIDENCE_REFRESH`, p_estimated_units: 1, p_reservation_seconds: 300 })
    if (reservation.error || !reservation.data?.[0]?.reserved) {
      const safeCode = reservation.data?.[0]?.reason_code ?? "BUDGET_RESERVATION_FAILED"
      await markItem(admin, itemId, "SKIPPED_BUDGET", safeCode, 0, 0)
      await admin.from("data_ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), skipped_count: 1, error_summary: safeCode }).eq("id", runId)
      return reply(429, { error: "Provider budget reservation was not granted.", providerCalls: 0, runId })
    }
    const reservationId = reservation.data[0].reservation_id as string
    const leaseHolder = crypto.randomUUID()
    const lease = await admin.rpc("acquire_data_ingestion_lease_v1", { p_source_code: SOURCE_CODE, p_operation: "VALUATION_EVIDENCE_REFRESH", p_lease_holder: leaseHolder, p_lease_seconds: 300 })
    if (lease.error || !lease.data?.[0]?.acquired) {
      await admin.rpc("settle_provider_budget_v1", { p_reservation_id: reservationId, p_consumed_units: 0, p_failed_units: 0, p_released_units: 1 })
      await markItem(admin, itemId, "SKIPPED_BUDGET", "REFRESH_IN_PROGRESS", 0, 0)
      await admin.from("data_ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), skipped_count: 1, error_summary: "REFRESH_IN_PROGRESS" }).eq("id", runId)
      return reply(409, { error: "Another valuation refresh is currently running.", providerCalls: 0, runId })
    }

    let providerSucceeded = 0
    let providerFailed = 0
    let safeCode: string | null = null
    let value: number | null = null
    let freshUntil: string | null = null
    const attemptedAt = new Date().toISOString()
    try {
      const client = new TrendlyneClient(mcpUrl)
      const query = `${security.name} ${security.symbol} instrument ${providerInstrumentId} ${PROVIDER_LABEL}`
      let text: string
      try {
        text = await client.getParameterValuesMultiStock(query)
        await recordUsage(admin, runId, itemId, security.id, attemptedAt, "SUCCEEDED", null)
        providerSucceeded = 1
      } catch (error) {
        safeCode = error instanceof Error && error.message.startsWith("PROVIDER_") ? error.message.replace(/[^A-Z0-9_]/gi, "_").toUpperCase() : "PROVIDER_REQUEST_FAILED"
        await recordUsage(admin, runId, itemId, security.id, attemptedAt, "FAILED", safeCode)
        providerFailed = 1
        throw error
      }

      value = parseTargetValue(text, security.symbol, providerInstrumentId)
      const definition = await admin.from("fundamental_metric_definitions").select("code,canonical_unit,is_active,freshness_seconds").eq("code", METRIC_CODE).single()
      if (definition.error || !definition.data.is_active || definition.data.canonical_unit !== "PERCENT") throw new Error("METRIC_CONTRACT_INVALID")
      const freshnessSeconds = Number(definition.data.freshness_seconds)
      if (!Number.isFinite(freshnessSeconds) || freshnessSeconds <= 0) throw new Error("METRIC_FRESHNESS_CONTRACT_INVALID")

      const rawPayload = { security_id: security.id, security_symbol: security.symbol, provider_instrument_id: providerInstrumentId, provider_tool: "get_parameter_values_multi_stock", requested_metric: PROVIDER_LABEL, result: text }
      const payloadHash = await hash(rawPayload)
      const record = await admin.from("data_source_records").insert({ source_code: SOURCE_CODE, ingestion_run_id: runId, record_kind: "TARGETED_VALUATION_REFRESH", external_record_id: `${providerInstrumentId}:valuation:${runId}`, payload_hash: payloadHash, raw_payload: rawPayload, retrieved_at: new Date().toISOString(), terms_snapshot: { mode: "VALUATION_EVIDENCE_REFRESH", owner_confirmed: true } }).select("id,retrieved_at").single()
      if (record.error) throw record.error
      freshUntil = new Date(new Date(record.data.retrieved_at).getTime() + freshnessSeconds * 1000).toISOString()
      const inserted = await admin.from("fundamental_observations").insert({
        security_id: security.id,
        metric_code: METRIC_CODE,
        source_record_id: record.data.id,
        source_code: SOURCE_CODE,
        numeric_value: value,
        currency: null,
        unit: "PERCENT",
        period_start: null,
        period_end: null,
        period_type: "POINT_IN_TIME",
        accounting_standard: null,
        consolidation_scope: "UNKNOWN",
        observed_at: null,
        retrieved_at: record.data.retrieved_at,
        fresh_until: freshUntil,
        evidence_status: "AVAILABLE",
        published_at: null,
      })
      if (inserted.error) throw inserted.error
      await markItem(admin, itemId, "ACCEPTED", null, 1, 1, { metricCode: METRIC_CODE, value, freshUntil })
      await admin.from("data_ingestion_runs").update({ status: "SUCCEEDED", completed_at: new Date().toISOString(), attempted_call_count: 1, fetched_count: 1, accepted_count: 1, failed_count: 0, skipped_count: 0, error_summary: null, metadata: { security: security.symbol, provider_instrument_id: providerInstrumentId, metric_code: METRIC_CODE, value, fresh_until: freshUntil } }).eq("id", runId)
    } catch (error) {
      safeCode = safeCode ?? (error instanceof Error ? error.message.replace(/[^A-Z0-9_]/gi, "_").toUpperCase().slice(0, 120) : "VALUATION_REFRESH_FAILED")
      await markItem(admin, itemId, "FAILED", safeCode, 1, 0)
      await admin.from("data_ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), attempted_call_count: 1, fetched_count: providerSucceeded, accepted_count: 0, failed_count: 1, skipped_count: 0, error_summary: safeCode }).eq("id", runId)
    } finally {
      await admin.rpc("settle_provider_budget_v1", { p_reservation_id: reservationId, p_consumed_units: providerSucceeded, p_failed_units: providerFailed, p_released_units: 0 })
      await admin.rpc("release_data_ingestion_lease_v1", { p_source_code: SOURCE_CODE, p_operation: "VALUATION_EVIDENCE_REFRESH", p_lease_holder: leaseHolder, p_cooldown_seconds: 0 })
    }

    if (safeCode) return reply(502, { error: "Valuation evidence refresh failed safely.", code: safeCode, providerCalls: 1, runId })
    return reply(200, { mode: "VALUATION_EVIDENCE_REFRESH", security: security.symbol, metricCode: METRIC_CODE, value, freshUntil, providerCalls: 1, providerSucceeded: 1, status: "SUCCEEDED", runId, note: "Only the approved valuation evidence was refreshed. No score run, role change, target change or trade was performed." })
  } catch (error) {
    const code = error instanceof Error ? error.message : "VALUATION_EVIDENCE_REFRESH_FAILED"
    return reply(500, { error: "Valuation evidence refresh failed safely.", code })
  }
})
