import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { TrendlyneObservedMcpClient } from "../_shared/trendlyne-observed.ts"
import { PHARMA_VALUATION_DISCOVERY_METRIC_QUERY } from "../_shared/pharma-valuation-discovery.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const SOURCE_CODE = "TRENDLYNE_MCP"
const CONFIRMATION = "OWNER_CONFIRMED_H2_LOCAL_PHARMA_VALUATION_EVIDENCE"
const RECORD_KIND = "H2_LOCAL_PHARMA_VALUATION_EVIDENCE_V1"
const DATA_DOMAIN = "PHARMA_VALUATION_EVIDENCE"
const OPERATION = "H2_LOCAL_PHARMA_VALUATION_EVIDENCE"
const METRICS = [
  { code: "PE_TTM", label: "PE TTM" },
  { code: "EV_EBITDA", label: "EV Per EBITDA Ann." },
] as const
const SYMBOLS = ["TORNTPHARM", "MANKIND", "ERIS", "EMCURE"] as const
type SymbolCode = typeof SYMBOLS[number]
type Admin = ReturnType<typeof createClient>
type RequestBody = { action?: unknown; portfolioId?: unknown; confirmation?: unknown }

const timeoutFetch: typeof fetch = async (input, init = {}) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 45_000)
  try { return await fetch(input, { ...init, signal: controller.signal }) }
  finally { clearTimeout(timer) }
}

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("")
}

function unwrapProviderText(providerResult: string): string {
  let value: unknown = providerResult
  for (let i = 0; i < 6; i += 1) {
    if (typeof value === "string") {
      const text = value.trim()
      try { value = JSON.parse(text); continue } catch { return text.replace(/\\n/g, "\n").replace(/\\r/g, "") }
    }
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>
      if (typeof obj.markdown_data === "string") { value = obj.markdown_data; continue }
      if (typeof obj.result === "string") { value = obj.result; continue }
    }
    break
  }
  return typeof value === "string" ? value : JSON.stringify(value)
}

function parseValues(providerResult: string) {
  const text = unwrapProviderText(providerResult)
  const lines = text.split(/\r?\n/).map(x => x.trim().replace(/\\$/, "").trim()).filter(Boolean)
  const result: Record<SymbolCode, Record<string, number>> = {
    TORNTPHARM: {}, MANKIND: {}, ERIS: {}, EMCURE: {},
  }
  for (const metric of METRICS) {
    const labelIndex = lines.findIndex(line => line.toLowerCase() === metric.label.toLowerCase())
    if (labelIndex < 0) throw new Error(`MISSING_PROVIDER_LABEL_${metric.code}`)
    for (let i = labelIndex + 1; i < lines.length; i += 1) {
      if (/^-{3,}$/.test(lines[i])) break
      for (const symbol of SYMBOLS) {
        const prefix = `${symbol}:`
        if (lines[i].toUpperCase().startsWith(prefix)) {
          const raw = lines[i].slice(prefix.length).trim()
          if (!raw || raw.toLowerCase() === "none") throw new Error(`MISSING_VALUE_${metric.code}_${symbol}`)
          const numeric = Number(raw)
          if (!Number.isFinite(numeric) || numeric <= 0) throw new Error(`INVALID_VALUE_${metric.code}_${symbol}`)
          result[symbol][metric.code] = numeric
        }
      }
    }
    for (const symbol of SYMBOLS) {
      if (!(metric.code in result[symbol])) throw new Error(`MISSING_VALUE_${metric.code}_${symbol}`)
    }
  }
  return result
}

async function recordUsage(admin: Admin, runId: string, itemId: string, securityId: string, attemptedAt: string, outcome: "SUCCEEDED"|"FAILED", safeCode: string|null) {
  const result = await admin.rpc("record_provider_usage_event_v1", {
    p_source_code: SOURCE_CODE,
    p_ingestion_run_id: runId,
    p_run_item_id: itemId,
    p_security_id: securityId,
    p_data_domain: DATA_DOMAIN,
    p_operation_class: "GET_PARAMETER_VALUES_MULTI_STOCK",
    p_accounting_class: "PROVIDER_TOOL_ATTEMPT",
    p_estimated_internal_units: 1,
    p_actual_internal_units: 1,
    p_attempted_at: attemptedAt,
    p_completed_at: new Date().toISOString(),
    p_outcome: outcome,
    p_safe_error_code: safeCode,
    p_retry_attempt: 0,
    p_idempotency_key: `${runId}:H2_PHARMA_VALUATION:1`,
  })
  if (result.error) throw new Error("USAGE_ACCOUNTING_FAILED")
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." })
  if (Deno.env.get("H2_LOCAL_PHARMA_VALUATION_ENABLED") !== "true") {
    return reply(409, { error: "Local H2 valuation acquisition is disabled.", providerCalls: 0 })
  }

  const authorization = request.headers.get("Authorization")
  if (!authorization) return reply(401, { error: "Authentication required." })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const mcpUrl = Deno.env.get("TRENDLYNE_MCP_URL")
  if (!supabaseUrl || !anonKey || !serviceKey) return reply(500, { error: "Server configuration incomplete.", providerCalls: 0 })

  try {
    const body = await request.json() as RequestBody
    if (body.action !== "PLAN" && body.action !== "EXECUTE") return reply(400, { error: "action must be PLAN or EXECUTE.", providerCalls: 0 })
    if (typeof body.portfolioId !== "string") return reply(400, { error: "portfolioId is required.", providerCalls: 0 })

    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session.", providerCalls: 0 })
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    const portfolio = await admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", auth.data.user.id).single()
    if (portfolio.error) return reply(404, { error: "Portfolio not found.", providerCalls: 0 })

    const securityResult = await admin.from("securities").select("id,symbol,isin,creation_source,is_active").in("symbol", [...SYMBOLS]).eq("exchange", "NSE")
    if (securityResult.error) throw new Error("SECURITY_LOOKUP_FAILED")
    const securities = new Map((securityResult.data ?? []).map(row => [String(row.symbol), row]))
    for (const symbol of SYMBOLS) {
      const row = securities.get(symbol)
      if (!row || !row.is_active) return reply(409, { error: `Required local security missing: ${symbol}`, providerCalls: 0 })
      if (symbol !== "TORNTPHARM" && row.creation_source !== "H2_LOCAL_VALUATION_PEER") {
        return reply(409, { error: `Peer is not an H2 local-only security: ${symbol}`, providerCalls: 0 })
      }
    }

    const tornt = securities.get("TORNTPHARM")!
    const holding = await admin.from("current_holdings").select("security_id").eq("portfolio_id", body.portfolioId).eq("security_id", tornt.id).maybeSingle()
    if (holding.error || !holding.data) return reply(409, { error: "TORNTPHARM must remain an open local holding.", providerCalls: 0 })

    const defs = await admin.from("fundamental_metric_definitions").select("code,canonical_unit,statement_scope,freshness_seconds,is_active,definition").in("code", ["PE_TTM","EV_EBITDA"])
    if (defs.error || (defs.data ?? []).length !== 2) return reply(409, { error: "Locked valuation metric definitions are incomplete.", providerCalls: 0 })
    for (const metric of METRICS) {
      const def = (defs.data ?? []).find(d => d.code === metric.code)
      if (!def || !def.is_active || def.canonical_unit !== "RATIO" || def.statement_scope !== "VALUATION" || Number(def.freshness_seconds) !== 86400) {
        return reply(409, { error: `Metric contract mismatch: ${metric.code}`, providerCalls: 0 })
      }
      if (metric.code === "EV_EBITDA" && String((def.definition as Record<string, unknown>)?.provider_label ?? "") !== metric.label) {
        return reply(409, { error: "EV_EBITDA provider label is not locked correctly.", providerCalls: 0 })
      }
    }

    const source = await admin.from("data_sources").select("is_active,entitlement_verified,retention_rights_verified").eq("code", SOURCE_CODE).single()
    const control = await admin.from("provider_ingestion_controls").select("ingestion_enabled,daily_internal_attempt_limit,per_run_internal_attempt_limit,actual_provider_quota_status,policy_version").eq("source_code", SOURCE_CODE).single()
    if (source.error || control.error) return reply(503, { error: "Provider controls unavailable.", providerCalls: 0 })

    const today = new Date(); today.setUTCHours(0,0,0,0)
    const usage = await admin.from("provider_usage_events").select("actual_internal_units").eq("source_code", SOURCE_CODE).eq("accounting_class", "PROVIDER_TOOL_ATTEMPT").gte("attempted_at", today.toISOString())
    if (usage.error) return reply(503, { error: "Provider usage unavailable.", providerCalls: 0 })
    const dailyObservedUsage = (usage.data ?? []).reduce((sum,row) => sum + Number(row.actual_internal_units ?? 0), 0)
    const executionAllowed = Boolean(
      source.data.is_active &&
      source.data.entitlement_verified &&
      source.data.retention_rights_verified &&
      control.data.ingestion_enabled &&
      control.data.actual_provider_quota_status === "VERIFIED" &&
      Number(control.data.per_run_internal_attempt_limit) >= 1 &&
      dailyObservedUsage + 1 <= Number(control.data.daily_internal_attempt_limit)
    )

    const existing = await admin.from("fundamental_observations").select("security_id,metric_code,numeric_value,retrieved_at,fresh_until,evidence_status").in("security_id", SYMBOLS.map(s => securities.get(s)!.id)).in("metric_code", ["PE_TTM","EV_EBITDA"]).order("retrieved_at", { ascending: false })
    const freshCount = (existing.data ?? []).filter(r => r.evidence_status === "AVAILABLE" && r.fresh_until && new Date(r.fresh_until).getTime() > Date.now()).length

    if (body.action === "PLAN") return reply(200, {
      mode: "H2_LOCAL_PHARMA_VALUATION_PLAN",
      providerCalls: 0,
      estimatedProviderCalls: 1,
      symbols: SYMBOLS,
      metrics: METRICS,
      dailyObservedUsage,
      projectedDailyUsage: dailyObservedUsage + 1,
      dailyLimit: control.data.daily_internal_attempt_limit,
      executionAllowed,
      currentlyFreshObservationRows: freshCount,
      note: "PLAN is zero-call. EXECUTE uses one Trendlyne multi-stock call and writes only PE_TTM and EV_EBITDA locally.",
    })

    if (body.confirmation !== CONFIRMATION) return reply(409, { error: "Explicit owner confirmation is required.", providerCalls: 0 })
    if (!executionAllowed) return reply(409, { error: "Provider safety/quota gates do not allow execution.", providerCalls: 0 })
    if (!mcpUrl) return reply(409, { error: "TRENDLYNE_MCP_URL is missing.", providerCalls: 0 })

    const run = await admin.from("data_ingestion_runs").insert({
      source_code: SOURCE_CODE,
      portfolio_id: body.portfolioId,
      operation: OPERATION,
      orchestration_type: "H2_LOCAL_SINGLE_CALL_MULTI_STOCK",
      trigger_source: "OWNER",
      requested_by: auth.data.user.id,
      status: "RUNNING",
      requested_count: 4,
      estimated_call_count: 1,
      reserved_call_count: 1,
      attempted_call_count: 0,
      policy_version: control.data.policy_version,
      metadata: { local_only: true, symbols: SYMBOLS, metrics: METRICS.map(m => m.code), confirmation: CONFIRMATION },
    }).select("id").single()
    if (run.error) throw new Error("RUN_ACCOUNTING_FAILED")
    const runId = String(run.data.id)

    const item = await admin.from("data_ingestion_run_items").insert({
      ingestion_run_id: runId,
      security_id: tornt.id,
      data_domain: DATA_DOMAIN,
      status: "PLANNED",
      metadata: { local_only: true, symbols: SYMBOLS, metrics: METRICS.map(m => m.code) },
    }).select("id").single()
    if (item.error) throw new Error("RUN_ITEM_ACCOUNTING_FAILED")
    const itemId = String(item.data.id)

    const reservation = await admin.rpc("reserve_provider_budget_v1", {
      p_source_code: SOURCE_CODE,
      p_ingestion_run_id: runId,
      p_reservation_key: `${runId}:H2_LOCAL_PHARMA_VALUATION`,
      p_estimated_units: 1,
      p_reservation_seconds: 300,
    })
    if (reservation.error || !reservation.data?.[0]?.reserved) return reply(429, { error: "Provider budget reservation not granted.", providerCalls: 0, runId })
    const reservationId = String(reservation.data[0].reservation_id)

    let succeeded = 0
    let failed = 0
    const attemptedAt = new Date().toISOString()
    try {
      const client = new TrendlyneObservedMcpClient(mcpUrl, timeoutFetch)
      const providerResult = await client.getParameterValuesMultiStock(PHARMA_VALUATION_DISCOVERY_METRIC_QUERY, "stock")
      await recordUsage(admin, runId, itemId, tornt.id, attemptedAt, "SUCCEEDED", null)
      succeeded = 1

      const values = parseValues(providerResult)
      const retrievedAt = new Date().toISOString()
      const rawPayload = {
        mode: "H2_LOCAL_PHARMA_VALUATION_EVIDENCE",
        query: PHARMA_VALUATION_DISCOVERY_METRIC_QUERY,
        locked_labels: METRICS,
        values,
        provider_result: providerResult,
      }
      const payloadHash = await sha256Hex(JSON.stringify(rawPayload))
      const record = await admin.from("data_source_records").insert({
        source_code: SOURCE_CODE,
        ingestion_run_id: runId,
        record_kind: RECORD_KIND,
        external_record_id: `H2_LOCAL_PHARMA_VALUATION:${runId}`,
        retrieved_at: retrievedAt,
        payload_hash: payloadHash,
        raw_payload: rawPayload,
        terms_snapshot: { local_only: true, owner_confirmed: true, canonical_metrics: ["PE_TTM","EV_EBITDA"] },
      }).select("id,retrieved_at").single()
      if (record.error) throw new Error("SOURCE_RECORD_INSERT_FAILED")

      const freshUntil = new Date(new Date(record.data.retrieved_at).getTime() + 86400 * 1000).toISOString()
      const observations = SYMBOLS.flatMap(symbol => METRICS.map(metric => ({
        security_id: securities.get(symbol)!.id,
        metric_code: metric.code,
        source_record_id: record.data.id,
        source_code: SOURCE_CODE,
        numeric_value: values[symbol][metric.code],
        currency: null,
        unit: "RATIO",
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
      })))
      const inserted = await admin.from("fundamental_observations").insert(observations)
      if (inserted.error) throw new Error("OBSERVATION_INSERT_FAILED")

      const itemDone = await admin.rpc("record_refresh_item_result_v1", {
        p_run_item_id: itemId,
        p_status: "ACCEPTED",
        p_safe_reason_code: null,
        p_attempted_call_count: 1,
        p_accepted_record_count: observations.length,
        p_metadata: { local_only: true, source_record_id: record.data.id, values, fresh_until: freshUntil },
      })
      if (itemDone.error) throw new Error("RUN_ITEM_ACCOUNTING_FAILED")

      await admin.from("data_ingestion_runs").update({
        status: "SUCCEEDED",
        completed_at: new Date().toISOString(),
        attempted_call_count: 1,
        fetched_count: 1,
        accepted_count: observations.length,
        failed_count: 0,
        skipped_count: 0,
        metadata: { local_only: true, values, source_record_id: record.data.id, fresh_until: freshUntil },
      }).eq("id", runId)

      await admin.rpc("settle_provider_budget_v1", { p_reservation_id: reservationId, p_consumed_units: 1, p_failed_units: 0, p_released_units: 0 })
      return reply(200, {
        mode: "H2_LOCAL_PHARMA_VALUATION_EVIDENCE",
        providerCalls: 1,
        status: "SUCCEEDED",
        values,
        freshUntil,
        sourceRecordId: record.data.id,
        observationsInserted: observations.length,
        runId,
      })
    } catch (error) {
      failed = succeeded ? 0 : 1
      const safeCode = error instanceof Error ? error.message.replace(/[^A-Z0-9_]/gi, "_").toUpperCase().slice(0,120) : "H2_LOCAL_VALUATION_FAILED"
      if (!succeeded) {
        try { await recordUsage(admin, runId, itemId, tornt.id, attemptedAt, "FAILED", safeCode) } catch { /* usage-accounting failure is secondary to the provider failure */ }
      }
      await admin.rpc("settle_provider_budget_v1", { p_reservation_id: reservationId, p_consumed_units: succeeded, p_failed_units: failed, p_released_units: 0 })
      await admin.rpc("record_refresh_item_result_v1", {
        p_run_item_id: itemId,
        p_status: "FAILED",
        p_safe_reason_code: safeCode,
        p_attempted_call_count: 1,
        p_accepted_record_count: 0,
        p_metadata: { local_only: true },
      })
      await admin.from("data_ingestion_runs").update({
        status: "FAILED",
        completed_at: new Date().toISOString(),
        attempted_call_count: 1,
        fetched_count: succeeded,
        accepted_count: 0,
        failed_count: 1,
        skipped_count: 0,
        error_summary: safeCode,
      }).eq("id", runId)
      return reply(502, { error: "Local H2 valuation acquisition failed safely.", code: safeCode, providerCalls: 1, runId })
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : "H2_LOCAL_PHARMA_VALUATION_FAILED"
    return reply(500, { error: "Local H2 valuation acquisition failed safely.", code, providerCalls: 0 })
  }
})
