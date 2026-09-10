import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { PLANNED_PRIMARY_ENRICHMENT_SOURCE } from "../_shared/enrichment.ts"
import { assertExpectedStockId, parseOverview, TrendlyneMcpClient } from "../_shared/trendlyne.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const COHORT_A = [
  "HDFCBANK", "M&M", "BHARTIARTL", "MOTHERSON", "BBOX",
  "AVALON", "ASTRAMICRO", "WABAG", "WAAREEENER", "ZAGGLE",
  "ICICIBANK", "SBIN", "FEDERALBNK", "INFY", "TITAN",
  "TORNTPHARM", "LAURUSLABS", "TVSMOTOR", "IREDA", "HUDCO",
  "TDPOWERSYS", "MTARTECH", "PIIND", "VBL", "NETWEB",
] as const
const WAVE_SIZE = 5
const CONFIRMATION = "OWNER_CONFIRMED_COHORT_A_FUNDAMENTALS"
const DOMAIN = "TTM_FUNDAMENTALS"

type Admin = ReturnType<typeof createClient>
type RequestBody = { readonly action?: unknown; readonly portfolioId?: unknown; readonly waveNumber?: unknown; readonly confirmation?: unknown }
type Security = { readonly id: string; readonly symbol: string; readonly name: string; readonly asset_class: string }
type Identity = { readonly security_id: string; readonly provider_instrument_id: string | null; readonly observed_symbol: string | null }

const hash = async (value: unknown) => Array.from(
  new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value))))
).map(x => x.toString(16).padStart(2, "0")).join("")

async function writeSourceRecord(admin: Admin, runId: string, security: Security, providerInstrumentId: string, metrics: unknown) {
  const rawPayload = { security_id: security.id, symbol: security.symbol, provider_instrument_id: providerInstrumentId, metrics }
  const payloadHash = await hash(rawPayload)
  const externalRecordId = `${providerInstrumentId}:manual-overview:${new Date().toISOString().slice(0, 10)}`
  const row = {
    source_code: PLANNED_PRIMARY_ENRICHMENT_SOURCE,
    ingestion_run_id: runId,
    record_kind: "MANUAL_FUNDAMENTAL_SNAPSHOT",
    external_record_id: externalRecordId,
    payload_hash: payloadHash,
    raw_payload: rawPayload,
    terms_snapshot: { approval_source: "OWNER_CONFIRMED_STAGE_7_2D_2B_4", body_retained: false },
  }
  const inserted = await admin.from("data_source_records")
    .upsert(row, { onConflict: "source_code,record_kind,external_record_id,payload_hash", ignoreDuplicates: true })
    .select("id").maybeSingle()
  if (inserted.error) throw inserted.error
  if (inserted.data?.id) return inserted.data.id as string
  const existing = await admin.from("data_source_records").select("id")
    .eq("source_code", row.source_code).eq("record_kind", row.record_kind)
    .eq("external_record_id", externalRecordId).eq("payload_hash", payloadHash).single()
  if (existing.error) throw existing.error
  return existing.data.id as string
}

async function buildPlan(admin: Admin, portfolioId: string) {
  const securitiesResult = await admin.from("securities").select("id,symbol,name,asset_class").in("symbol", [...COHORT_A])
  if (securitiesResult.error) throw securitiesResult.error
  const securities = (securitiesResult.data ?? []) as Security[]
  if (securities.length !== COHORT_A.length) throw new Error("COHORT_SECURITY_SET_INCOMPLETE")
  const bySymbol = new Map(securities.map(row => [row.symbol, row]))
  const ordered = COHORT_A.map(symbol => bySymbol.get(symbol)).filter((row): row is Security => Boolean(row))
  if (ordered.some(row => row.asset_class !== "EQUITY")) throw new Error("COHORT_CONTAINS_NON_EQUITY")

  const holdings = await admin.from("current_holdings").select("security_id")
    .eq("portfolio_id", portfolioId).in("security_id", ordered.map(row => row.id))
  if (holdings.error) throw holdings.error
  const held = new Set((holdings.data ?? []).map(row => row.security_id))
  if (ordered.some(row => !held.has(row.id))) throw new Error("COHORT_NOT_FULLY_HELD")

  const identities = await admin.from("security_identity_observations")
    .select("security_id,provider_instrument_id,observed_symbol,created_at")
    .eq("source_code", PLANNED_PRIMARY_ENRICHMENT_SOURCE).eq("evidence_status", "MATCHED")
    .in("security_id", ordered.map(row => row.id)).order("created_at", { ascending: false })
  if (identities.error) throw identities.error
  const identityBySecurity = new Map<string, Identity>()
  for (const row of identities.data ?? []) if (!identityBySecurity.has(row.security_id)) identityBySecurity.set(row.security_id, row as Identity)
  if (ordered.some(row => !identityBySecurity.get(row.id)?.provider_instrument_id)) throw new Error("MATCHED_IDENTITY_REQUIRED")

  const states = await admin.from("security_refresh_states").select("security_id,fresh_until,refresh_status")
    .eq("source_code", PLANNED_PRIMARY_ENRICHMENT_SOURCE).eq("data_domain", DOMAIN)
    .in("security_id", ordered.map(row => row.id))
  if (states.error) throw states.error
  const stateBySecurity = new Map((states.data ?? []).map(row => [row.security_id, row]))
  const now = Date.now()
  const stale = ordered.filter(row => {
    const value = stateBySecurity.get(row.id)?.fresh_until
    return !value || !Number.isFinite(Date.parse(value)) || Date.parse(value) <= now
  })
  const staleIds = new Set(stale.map(row => row.id))
  const waves = Array.from({ length: Math.ceil(COHORT_A.length / WAVE_SIZE) }, (_, index) => {
    const waveRows = ordered.slice(index * WAVE_SIZE, (index + 1) * WAVE_SIZE).filter(row => staleIds.has(row.id))
    return { waveNumber: index + 1, symbols: waveRows.map(row => row.symbol), securityIds: waveRows.map(row => row.id), calls: waveRows.length }
  }).filter(wave => wave.calls > 0)

  const control = await admin.from("provider_ingestion_controls")
    .select("ingestion_enabled,daily_internal_attempt_limit,per_run_internal_attempt_limit,actual_provider_quota_status")
    .eq("source_code", PLANNED_PRIMARY_ENRICHMENT_SOURCE).single()
  if (control.error) throw control.error
  const usage = await admin.from("provider_usage_events").select("actual_internal_units")
    .eq("source_code", PLANNED_PRIMARY_ENRICHMENT_SOURCE).eq("accounting_class", "PROVIDER_TOOL_ATTEMPT")
    .gte("attempted_at", new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString())
  if (usage.error) throw usage.error
  const dailyObservedUsage = (usage.data ?? []).reduce((sum, row) => sum + Number(row.actual_internal_units ?? 0), 0)
  const plannedCalls = waves.reduce((sum, wave) => sum + wave.calls, 0)
  const projectedDailyUsage = dailyObservedUsage + plannedCalls
  const executionAllowed = Boolean(
    control.data.ingestion_enabled && control.data.actual_provider_quota_status === "VERIFIED" &&
    projectedDailyUsage <= control.data.daily_internal_attempt_limit &&
    waves.every(wave => wave.calls <= control.data.per_run_internal_attempt_limit)
  )
  return { ordered, identityBySecurity, waves, staleCount: stale.length, plannedCalls, dailyObservedUsage, projectedDailyUsage,
    dailyLimit: control.data.daily_internal_attempt_limit, perRunLimit: control.data.per_run_internal_attempt_limit,
    providerQuotaStatus: control.data.actual_provider_quota_status, ingestionEnabled: control.data.ingestion_enabled, executionAllowed }
}

async function markItem(admin: Admin, itemId: string, status: "ACCEPTED" | "FAILED", safeCode: string | null, acceptedRecordCount: number, metadata: Record<string, unknown>) {
  const result = await admin.rpc("record_refresh_item_result_v1", {
    p_run_item_id: itemId,
    p_status: status,
    p_safe_reason_code: safeCode,
    p_attempted_call_count: 1,
    p_accepted_record_count: acceptedRecordCount,
    p_metadata: metadata,
  })
  if (result.error) throw result.error
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
  if (!supabaseUrl || !anonKey || !serviceKey) return reply(500, { error: "Server configuration is incomplete." })

  try {
    const body = await request.json() as RequestBody
    if (typeof body.portfolioId !== "string") return reply(400, { error: "portfolioId is required." })
    if (body.action !== "PLAN" && body.action !== "EXECUTE_WAVE") return reply(400, { error: "Unknown action." })

    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session." })
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    const portfolio = await admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", auth.data.user.id).single()
    if (portfolio.error) return reply(404, { error: "Portfolio not found." })

    const currentPlan = await buildPlan(admin, body.portfolioId)
    if (body.action === "PLAN") return reply(200, {
      mode: "OWNER_MANUAL_RESEARCH_REFRESH_PLAN", providerCalls: 0,
      staleCount: currentPlan.staleCount, plannedCalls: currentPlan.plannedCalls,
      dailyObservedUsage: currentPlan.dailyObservedUsage, projectedDailyUsage: currentPlan.projectedDailyUsage,
      dailyLimit: currentPlan.dailyLimit, perRunLimit: currentPlan.perRunLimit,
      providerQuotaStatus: currentPlan.providerQuotaStatus, ingestionEnabled: currentPlan.ingestionEnabled,
      executionAllowed: currentPlan.executionAllowed,
      waves: currentPlan.waves.map(wave => ({ waveNumber: wave.waveNumber, symbols: wave.symbols, calls: wave.calls })),
    })

    if (body.confirmation !== CONFIRMATION) return reply(409, { error: "Explicit owner confirmation is required.", providerCalls: 0 })
    if (!currentPlan.executionAllowed) return reply(409, { error: "Current safety or quota gates do not allow execution.", providerCalls: 0 })
    if (!Number.isInteger(body.waveNumber)) return reply(400, { error: "waveNumber is required.", providerCalls: 0 })
    const wave = currentPlan.waves.find(item => item.waveNumber === body.waveNumber)
    if (!wave) return reply(409, { error: "The selected wave has no refresh work remaining.", providerCalls: 0 })
    if (!mcpUrl) return reply(409, { error: "Trendlyne provider configuration is incomplete.", providerCalls: 0 })

    const run = await admin.from("data_ingestion_runs").insert({
      source_code: PLANNED_PRIMARY_ENRICHMENT_SOURCE, portfolio_id: body.portfolioId,
      operation: "MANUAL_FUNDAMENTALS_REFRESH", orchestration_type: "BOUNDED_REFRESH", trigger_source: "OWNER",
      requested_by: auth.data.user.id, status: "RUNNING", requested_count: wave.calls,
      estimated_call_count: wave.calls, reserved_call_count: wave.calls,
      metadata: { cohort: "A", wave: wave.waveNumber, confirmation: CONFIRMATION },
    }).select("id").single()
    if (run.error) throw run.error
    const runId = run.data.id as string

    const runItems = await admin.from("data_ingestion_run_items").insert(wave.securityIds.map(securityId => ({
      ingestion_run_id: runId, security_id: securityId, data_domain: DOMAIN, status: "PLANNED",
    }))).select("id,security_id")
    if (runItems.error) throw runItems.error
    const itemBySecurity = new Map((runItems.data ?? []).map(row => [row.security_id, row.id]))

    const reservation = await admin.rpc("reserve_provider_budget_v1", {
      p_source_code: PLANNED_PRIMARY_ENRICHMENT_SOURCE, p_ingestion_run_id: runId,
      p_reservation_key: `${runId}:MANUAL_WAVE_${wave.waveNumber}`, p_estimated_units: wave.calls, p_reservation_seconds: 900,
    })
    if (reservation.error || !reservation.data?.[0]?.reserved) throw new Error(reservation.data?.[0]?.reason_code ?? "BUDGET_RESERVATION_FAILED")
    const reservationId = reservation.data[0].reservation_id as string

    const leaseHolder = crypto.randomUUID()
    const lease = await admin.rpc("acquire_data_ingestion_lease_v1", {
      p_source_code: PLANNED_PRIMARY_ENRICHMENT_SOURCE, p_operation: "MANUAL_FUNDAMENTALS_REFRESH",
      p_lease_holder: leaseHolder, p_lease_seconds: 900,
    })
    if (lease.error || !lease.data?.[0]?.acquired) {
      await admin.rpc("settle_provider_budget_v1", { p_reservation_id: reservationId, p_consumed_units: 0, p_failed_units: 0, p_released_units: wave.calls })
      throw new Error("REFRESH_IN_PROGRESS")
    }

    let attempted = 0, providerFailures = 0, itemSuccesses = 0, itemFailures = 0
    const results: Array<Record<string, unknown>> = []
    try {
      const policy = await admin.from("refresh_domain_policies").select("freshness_seconds,cooldown_seconds")
        .eq("source_code", PLANNED_PRIMARY_ENRICHMENT_SOURCE).eq("data_domain", DOMAIN)
        .is("effective_to", null).eq("is_enabled", true).single()
      if (policy.error) throw policy.error
      const mcp = new TrendlyneMcpClient(mcpUrl)

      for (const securityId of wave.securityIds) {
        const security = currentPlan.ordered.find(row => row.id === securityId)!
        const identity = currentPlan.identityBySecurity.get(securityId)!
        const providerInstrumentId = String(identity.provider_instrument_id)
        const itemId = itemBySecurity.get(securityId)!
        const attemptedAt = new Date().toISOString()
        attempted += 1
        let text: string
        try {
          text = await mcp.call("get_overview_news_corp_events", { stock_code: security.symbol, type: "overview" })
          const usage = await admin.rpc("record_provider_usage_event_v1", {
            p_source_code: PLANNED_PRIMARY_ENRICHMENT_SOURCE, p_ingestion_run_id: runId, p_run_item_id: itemId,
            p_security_id: securityId, p_data_domain: DOMAIN, p_operation_class: "GET_OVERVIEW_NEWS_CORP_EVENTS",
            p_accounting_class: "PROVIDER_TOOL_ATTEMPT", p_estimated_internal_units: 1, p_actual_internal_units: 1,
            p_attempted_at: attemptedAt, p_completed_at: new Date().toISOString(), p_outcome: "SUCCEEDED",
            p_safe_error_code: null, p_retry_attempt: 0, p_idempotency_key: `${runId}:${securityId}:OVERVIEW:1`,
          })
          if (usage.error) throw usage.error
        } catch (providerError) {
          providerFailures += 1
          itemFailures += 1
          const safeCode = providerError instanceof Error ? providerError.message.slice(0, 96) : "PROVIDER_REQUEST_FAILED"
          await admin.rpc("record_provider_usage_event_v1", {
            p_source_code: PLANNED_PRIMARY_ENRICHMENT_SOURCE, p_ingestion_run_id: runId, p_run_item_id: itemId,
            p_security_id: securityId, p_data_domain: DOMAIN, p_operation_class: "GET_OVERVIEW_NEWS_CORP_EVENTS",
            p_accounting_class: "PROVIDER_TOOL_ATTEMPT", p_estimated_internal_units: 1, p_actual_internal_units: 1,
            p_attempted_at: attemptedAt, p_completed_at: new Date().toISOString(), p_outcome: "FAILED",
            p_safe_error_code: safeCode, p_retry_attempt: 0, p_idempotency_key: `${runId}:${securityId}:OVERVIEW:1`,
          })
          await markItem(admin, itemId, "FAILED", safeCode, 0, { provider_call_failed: true })
          results.push({ symbol: security.symbol, status: "FAILED", safeCode })
          continue
        }

        try {
          const overview = parseOverview(text)
          assertExpectedStockId(providerInstrumentId, overview.identity.stockId)
          if (overview.identity.symbol !== security.symbol) throw new Error("UNEXPECTED_PROVIDER_SECURITY")
          const sourceRecordId = await writeSourceRecord(admin, runId, security, providerInstrumentId, overview.metrics)
          const completedAt = new Date()
          const freshUntil = new Date(completedAt.getTime() + Number(policy.data.freshness_seconds) * 1000).toISOString()
          const rows = overview.metrics.map(metric => ({
            security_id: securityId, metric_code: metric.code, source_record_id: sourceRecordId,
            source_code: PLANNED_PRIMARY_ENRICHMENT_SOURCE, numeric_value: metric.value, unit: metric.unit,
            period_start: null, period_end: null, period_type: metric.periodType, accounting_standard: null,
            consolidation_scope: null, observed_at: null, retrieved_at: completedAt.toISOString(), fresh_until: freshUntil,
            evidence_status: metric.evidenceStatus, published_at: null,
          }))
          const write = await admin.from("fundamental_observations").upsert(rows, {
            onConflict: "security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id", ignoreDuplicates: true,
          })
          if (write.error) throw write.error
          await markItem(admin, itemId, "ACCEPTED", null, overview.metrics.length, { exact_identity_verified: true, provider_instrument_id: providerInstrumentId })
          const state = await admin.from("security_refresh_states").upsert({
            source_code: PLANNED_PRIMARY_ENRICHMENT_SOURCE, security_id: securityId, data_domain: DOMAIN,
            last_attempt_at: completedAt.toISOString(), last_success_at: completedAt.toISOString(), last_evidence_change_at: completedAt.toISOString(),
            fresh_until: freshUntil, next_eligible_refresh_at: freshUntil, consecutive_failures: 0,
            last_safe_error_code: null, last_run_id: runId, refresh_status: "FRESH",
          })
          if (state.error) throw state.error
          itemSuccesses += 1
          results.push({ symbol: security.symbol, status: "ACCEPTED", metricCount: overview.metrics.length })
        } catch (processingError) {
          itemFailures += 1
          const safeCode = processingError instanceof Error ? processingError.message.slice(0, 96) : "CANONICAL_PROCESSING_FAILED"
          await markItem(admin, itemId, "FAILED", safeCode, 0, { provider_call_succeeded: true, exact_identity_required: true })
          results.push({ symbol: security.symbol, status: "FAILED", safeCode })
        }
      }
    } finally {
      await admin.rpc("settle_provider_budget_v1", {
        p_reservation_id: reservationId,
        p_consumed_units: Math.max(0, attempted - providerFailures),
        p_failed_units: providerFailures,
        p_released_units: Math.max(0, wave.calls - attempted),
      })
      await admin.rpc("release_data_ingestion_lease_v1", {
        p_source_code: PLANNED_PRIMARY_ENRICHMENT_SOURCE, p_operation: "MANUAL_FUNDAMENTALS_REFRESH",
        p_lease_holder: leaseHolder, p_cooldown_seconds: 0,
      })
      await admin.from("data_ingestion_runs").update({
        status: itemFailures === 0 ? "SUCCEEDED" : itemSuccesses > 0 ? "PARTIAL" : "FAILED",
        completed_at: new Date().toISOString(), attempted_call_count: attempted,
        accepted_count: itemSuccesses, failed_count: itemFailures, fetched_count: itemSuccesses,
        skipped_count: Math.max(0, wave.calls - itemSuccesses - itemFailures),
        metadata: { cohort: "A", wave: wave.waveNumber, results },
      }).eq("id", runId)
    }

    return reply(200, {
      mode: "OWNER_CONFIRMED_MANUAL_FUNDAMENTALS_REFRESH", waveNumber: wave.waveNumber, runId,
      providerCalls: attempted, succeeded: itemSuccesses, failed: itemFailures, results,
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : "MANUAL_RESEARCH_REFRESH_FAILED"
    return reply(500, { error: "Manual research refresh failed safely.", code })
  }
})
