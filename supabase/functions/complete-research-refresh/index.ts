import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { PLANNED_PRIMARY_ENRICHMENT_SOURCE } from "../_shared/enrichment.ts"
import { mapApprovedCompleteResearchMetrics } from "../_shared/trendlyne-complete-research-mapping.ts"
import { TrendlyneObservedMcpClient } from "../_shared/trendlyne-observed.ts"
import { assertExpectedStockId, parseDocumentAppearances, parseOverview, parseOwnership } from "../_shared/trendlyne.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
})

const SOURCE_CODE = PLANNED_PRIMARY_ENRICHMENT_SOURCE
const CONFIRMATION = "OWNER_CONFIRMED_COMPLETE_RESEARCH_REFRESH"
const RESERVED_UNITS = 4
const MAX_CAPTURE_BYTES = 512 * 1024
const DAY = 24 * 60 * 60 * 1000
const DOMAINS = ["TTM_FUNDAMENTALS", "DETAILED_FUNDAMENTALS", "OWNERSHIP", "DOCUMENT_DISCOVERY"] as const

type Domain = typeof DOMAINS[number]
type Admin = ReturnType<typeof createClient>
type RequestBody = {
  readonly action?: unknown
  readonly portfolioId?: unknown
  readonly securityId?: unknown
  readonly confirmation?: unknown
}
type Security = { readonly id: string; readonly symbol: string; readonly name: string; readonly asset_class: string }
type Identity = { readonly provider_instrument_id: string | null; readonly observed_symbol: string | null }

const hash = async (value: unknown) => Array.from(new Uint8Array(await crypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode(JSON.stringify(value)),
))).map(byte => byte.toString(16).padStart(2, "0")).join("")

async function sourceRecord(admin: Admin, runId: string, kind: string, externalId: string, payload: Record<string, unknown>) {
  const serialized = JSON.stringify(payload)
  if (new TextEncoder().encode(serialized).byteLength > MAX_CAPTURE_BYTES) throw new Error("CAPTURE_PAYLOAD_TOO_LARGE")
  const payloadHash = await hash(payload)
  const row = {
    source_code: SOURCE_CODE,
    ingestion_run_id: runId,
    record_kind: kind,
    external_record_id: externalId,
    payload_hash: payloadHash,
    raw_payload: payload,
    retrieved_at: new Date().toISOString(),
    terms_snapshot: { mode: "COMPLETE_RESEARCH_REFRESH", owner_confirmed: true },
  }
  const inserted = await admin.from("data_source_records").upsert(row, {
    onConflict: "source_code,record_kind,external_record_id,payload_hash",
    ignoreDuplicates: true,
  }).select("id,retrieved_at").maybeSingle()
  if (inserted.error) throw inserted.error
  if (inserted.data) return inserted.data as { id: string; retrieved_at: string }
  const existing = await admin.from("data_source_records").select("id,retrieved_at")
    .eq("source_code", SOURCE_CODE).eq("record_kind", kind).eq("external_record_id", externalId)
    .eq("payload_hash", payloadHash).single()
  if (existing.error) throw existing.error
  return existing.data as { id: string; retrieved_at: string }
}

async function recordUsage(admin: Admin, runId: string, itemId: string, securityId: string, domain: Domain, operation: string, sequence: number, attemptedAt: string, outcome: "SUCCEEDED" | "FAILED", safeCode: string | null) {
  const result = await admin.rpc("record_provider_usage_event_v1", {
    p_source_code: SOURCE_CODE,
    p_ingestion_run_id: runId,
    p_run_item_id: itemId,
    p_security_id: securityId,
    p_data_domain: domain,
    p_operation_class: operation,
    p_accounting_class: "PROVIDER_TOOL_ATTEMPT",
    p_estimated_internal_units: 1,
    p_actual_internal_units: 1,
    p_attempted_at: attemptedAt,
    p_completed_at: new Date().toISOString(),
    p_outcome: outcome,
    p_safe_error_code: safeCode,
    p_retry_attempt: 0,
    p_idempotency_key: `${runId}:${domain}:${sequence}`,
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

async function writeOverview(admin: Admin, runId: string, security: Security, providerInstrumentId: string, text: string) {
  const overview = parseOverview(text)
  assertExpectedStockId(providerInstrumentId, overview.identity.stockId)
  if (overview.identity.symbol !== security.symbol) throw new Error("UNEXPECTED_PROVIDER_SECURITY")
  const record = await sourceRecord(admin, runId, "COMPLETE_RESEARCH_OVERVIEW", `${providerInstrumentId}:overview:${runId}`, {
    security_id: security.id,
    security_symbol: security.symbol,
    provider_instrument_id: providerInstrumentId,
    provider_tool: "get_overview_news_corp_events",
    result: text,
  })
  const freshUntil = new Date(new Date(record.retrieved_at).getTime() + 30 * DAY).toISOString()
  const rows = overview.metrics.map(metric => ({
    security_id: security.id,
    metric_code: metric.code,
    source_record_id: record.id,
    source_code: SOURCE_CODE,
    numeric_value: metric.value,
    currency: null,
    unit: metric.unit,
    period_start: null,
    period_end: null,
    period_type: metric.periodType,
    accounting_standard: null,
    consolidation_scope: "UNKNOWN",
    observed_at: null,
    retrieved_at: record.retrieved_at,
    fresh_until: freshUntil,
    evidence_status: metric.evidenceStatus,
    published_at: null,
  }))
  if (rows.length) {
    const inserted = await admin.from("fundamental_observations").upsert(rows, {
      onConflict: "security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id",
      ignoreDuplicates: true,
    })
    if (inserted.error) throw inserted.error
  }
  return { metricCount: rows.length, identity: overview.identity }
}

async function writeDetailed(admin: Admin, runId: string, security: Security, providerInstrumentId: string, text: string) {
  const record = await sourceRecord(admin, runId, "COMPLETE_RESEARCH_STRUCTURED_METRICS", `${providerInstrumentId}:structured:${runId}`, {
    security_id: security.id,
    security_symbol: security.symbol,
    provider_instrument_id: providerInstrumentId,
    provider_tool: "get_parameter_values_multi_stock",
    result: text,
  })
  const mapped = mapApprovedCompleteResearchMetrics(text, security.symbol, providerInstrumentId)
  if (!mapped.length) return { metricCount: 0, captured: true }
  const definitions = await admin.from("fundamental_metric_definitions").select("code,canonical_unit,is_active")
    .in("code", mapped.map(metric => metric.canonicalCode))
  if (definitions.error) throw definitions.error
  const definitionByCode = new Map((definitions.data ?? []).map(row => [row.code, row]))
  const accepted = mapped.filter(metric => {
    const definition = definitionByCode.get(metric.canonicalCode)
    return definition?.is_active && definition.canonical_unit === metric.canonicalUnit
  })
  const freshUntil = new Date(new Date(record.retrieved_at).getTime() + 90 * DAY).toISOString()
  const rows = accepted.map(metric => ({
    security_id: security.id,
    metric_code: metric.canonicalCode,
    source_record_id: record.id,
    source_code: SOURCE_CODE,
    numeric_value: metric.numericValue,
    currency: null,
    unit: metric.canonicalUnit,
    period_start: null,
    period_end: null,
    period_type: metric.periodType,
    accounting_standard: null,
    consolidation_scope: "UNKNOWN",
    observed_at: null,
    retrieved_at: record.retrieved_at,
    fresh_until: freshUntil,
    evidence_status: "AVAILABLE",
    published_at: null,
  }))
  if (rows.length) {
    const inserted = await admin.from("fundamental_observations").upsert(rows, {
      onConflict: "security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id",
      ignoreDuplicates: true,
    })
    if (inserted.error) throw inserted.error
  }
  return { metricCount: rows.length, captured: true }
}

async function writeOwnership(admin: Admin, runId: string, security: Security, providerInstrumentId: string, text: string) {
  const values = parseOwnership(text)
  const record = await sourceRecord(admin, runId, "COMPLETE_RESEARCH_OWNERSHIP", `${providerInstrumentId}:ownership:${runId}`, {
    security_id: security.id,
    security_symbol: security.symbol,
    provider_instrument_id: providerInstrumentId,
    provider_tool: "get_ownership_deals_insider_sast",
    result: text,
  })
  const freshUntil = new Date(new Date(record.retrieved_at).getTime() + 45 * DAY).toISOString()
  const rows = values.map(value => ({
    security_id: security.id,
    metric_code: value.code,
    source_record_id: record.id,
    source_code: SOURCE_CODE,
    numeric_value: value.value,
    currency: null,
    unit: value.unit,
    period_start: null,
    period_end: value.periodEnd,
    period_type: value.periodEnd ? "QUARTER" : null,
    accounting_standard: null,
    consolidation_scope: "UNKNOWN",
    observed_at: null,
    retrieved_at: record.retrieved_at,
    fresh_until: freshUntil,
    evidence_status: "AVAILABLE",
    published_at: null,
  }))
  if (rows.length) {
    const inserted = await admin.from("fundamental_observations").upsert(rows, {
      onConflict: "security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id",
      ignoreDuplicates: true,
    })
    if (inserted.error) throw inserted.error
  }
  return { metricCount: rows.length }
}

async function writeDocuments(admin: Admin, runId: string, security: Security, providerInstrumentId: string, text: string) {
  const rawRecord = await sourceRecord(admin, runId, "COMPLETE_RESEARCH_DOCUMENT_SEARCH", `${providerInstrumentId}:documents:${runId}`, {
    security_id: security.id,
    security_symbol: security.symbol,
    provider_instrument_id: providerInstrumentId,
    provider_tool: "get_document_search_results",
    document_bodies_retained: false,
    result: text,
  })
  const appearances = parseDocumentAppearances(text)
    .filter(item => item.stockId === providerInstrumentId && item.symbol === security.symbol)
    .slice(0, 10)
  let insertedCount = 0
  for (const appearance of appearances) {
    const metadataHash = await hash({ source: SOURCE_CODE, stock_id: providerInstrumentId, provider_document_id: appearance.providerDocumentId })
    const existingDocument = await admin.from("research_documents").select("id")
      .eq("security_id", security.id).eq("metadata_identity_hash", metadataHash).maybeSingle()
    if (existingDocument.error) throw existingDocument.error
    let documentId = existingDocument.data?.id as string | undefined
    if (!documentId) {
      const inserted = await admin.from("research_documents").insert({
        security_id: security.id,
        document_type: appearance.documentType,
        published_at: appearance.publishedAt,
        metadata_identity_hash: metadataHash,
        identity_basis: "REVIEW_REQUIRED",
        identity_status: "REVIEW_REQUIRED",
        identity_evidence: {
          provider_document_id: appearance.providerDocumentId,
          provider_stock_id: providerInstrumentId,
          exact_symbol: security.symbol,
          complete_refresh_run_id: runId,
        },
      }).select("id").single()
      if (inserted.error) throw inserted.error
      documentId = inserted.data.id as string
      insertedCount += 1
    }
    const existingSource = await admin.from("research_document_sources").select("id")
      .eq("source_code", SOURCE_CODE).eq("provider_document_id", appearance.providerDocumentId).maybeSingle()
    if (existingSource.error) throw existingSource.error
    if (!existingSource.data) {
      const source = await admin.from("research_document_sources").insert({
        research_document_id: documentId,
        source_code: SOURCE_CODE,
        source_record_id: rawRecord.id,
        provider_document_id: appearance.providerDocumentId,
        source_title: appearance.documentType,
        source_published_at: appearance.publishedAt,
        retrieved_at: rawRecord.retrieved_at,
        extraction_method: "MCP_SEMANTIC_SEARCH_HEADER",
        extraction_version: "2",
        extraction_provenance: { document_bodies_retained: false, exact_stock_id: providerInstrumentId, exact_symbol: security.symbol },
        source_status: "REVIEW_REQUIRED",
      })
      if (source.error) throw source.error
    }
  }
  return { documentAppearances: appearances.length, documentsInserted: insertedCount }
}

async function updateRefreshState(admin: Admin, securityId: string, domain: "TTM_FUNDAMENTALS" | "OWNERSHIP" | "DOCUMENT_DISCOVERY", runId: string, freshDays: number) {
  const now = new Date()
  const result = await admin.from("security_refresh_states").upsert({
    source_code: SOURCE_CODE,
    security_id: securityId,
    data_domain: domain,
    last_attempt_at: now.toISOString(),
    last_success_at: now.toISOString(),
    last_evidence_change_at: now.toISOString(),
    fresh_until: new Date(now.getTime() + freshDays * DAY).toISOString(),
    next_eligible_refresh_at: new Date(now.getTime() + freshDays * DAY).toISOString(),
    consecutive_failures: 0,
    last_safe_error_code: null,
    last_run_id: runId,
    refresh_status: "FRESH",
  })
  if (result.error) throw result.error
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
    if (holding.error || !holding.data) return reply(403, { error: "Complete Research Refresh is limited to open holdings." })
    const securityResult = await admin.from("securities").select("id,symbol,name,asset_class").eq("id", body.securityId).single()
    if (securityResult.error || securityResult.data.asset_class !== "EQUITY") return reply(400, { error: "Complete Research Refresh currently supports held equities only." })
    const security = securityResult.data as Security

    const identityResult = await admin.from("security_identity_observations")
      .select("provider_instrument_id,observed_symbol,created_at")
      .eq("security_id", body.securityId).eq("source_code", SOURCE_CODE).eq("evidence_status", "MATCHED")
      .not("provider_instrument_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle()
    if (identityResult.error || !identityResult.data?.provider_instrument_id) return reply(409, { error: "Verified Trendlyne identity is required before a complete refresh." })
    const identity = identityResult.data as Identity
    if (identity.observed_symbol && identity.observed_symbol !== security.symbol) return reply(409, { error: "Stored Trendlyne identity no longer matches the security symbol." })
    const providerInstrumentId = String(identity.provider_instrument_id)

    const source = await admin.from("data_sources").select("is_active,entitlement_verified,retention_rights_verified").eq("code", SOURCE_CODE).single()
    const control = await admin.from("provider_ingestion_controls")
      .select("ingestion_enabled,daily_internal_attempt_limit,per_run_internal_attempt_limit,actual_provider_quota_status,policy_version")
      .eq("source_code", SOURCE_CODE).single()
    if (source.error || control.error) return reply(503, { error: "Provider controls are unavailable." })

    const today = new Date(); today.setUTCHours(0, 0, 0, 0)
    const usage = await admin.from("provider_usage_events").select("actual_internal_units")
      .eq("source_code", SOURCE_CODE).eq("accounting_class", "PROVIDER_TOOL_ATTEMPT").gte("attempted_at", today.toISOString())
    if (usage.error) return reply(503, { error: "Provider usage could not be calculated." })
    const dailyObservedUsage = (usage.data ?? []).reduce((sum, row) => sum + Number(row.actual_internal_units ?? 0), 0)
    const projectedDailyUsage = dailyObservedUsage + RESERVED_UNITS
    const trustedConfiguration = Boolean(source.data.is_active && source.data.entitlement_verified && source.data.retention_rights_verified)
    const executionAllowed = Boolean(
      trustedConfiguration && control.data.ingestion_enabled && control.data.actual_provider_quota_status === "VERIFIED" &&
      RESERVED_UNITS <= control.data.per_run_internal_attempt_limit && projectedDailyUsage <= control.data.daily_internal_attempt_limit
    )

    if (body.action === "PLAN") return reply(200, {
      mode: "COMPLETE_RESEARCH_REFRESH_PLAN",
      providerCalls: 0,
      security: security.symbol,
      company: security.name,
      providerInstrumentId,
      estimatedProviderCalls: RESERVED_UNITS,
      dailyObservedUsage,
      projectedDailyUsage,
      dailyLimit: control.data.daily_internal_attempt_limit,
      providerQuotaStatus: control.data.actual_provider_quota_status,
      ingestionEnabled: control.data.ingestion_enabled,
      executionAllowed,
      components: [
        { domain: "Overview & core fundamentals", calls: 1 },
        { domain: "Detailed scoring metrics", calls: 1 },
        { domain: "Ownership & pledge", calls: 1 },
        { domain: "Documents & evidence", calls: 1 },
      ],
      note: "Planning consumes zero provider calls. Angel One market pricing is not changed by this action.",
    })

    if (body.confirmation !== CONFIRMATION) return reply(409, { error: "Explicit owner confirmation is required.", providerCalls: 0 })
    if (!executionAllowed) return reply(409, { error: "Current safety, quota, or provider-trust gates do not allow execution.", providerCalls: 0 })
    if (!mcpUrl) return reply(409, { error: "Trendlyne provider configuration is incomplete.", providerCalls: 0 })

    const run = await admin.from("data_ingestion_runs").insert({
      source_code: SOURCE_CODE,
      portfolio_id: body.portfolioId,
      operation: "COMPLETE_RESEARCH_REFRESH",
      orchestration_type: "SINGLE_SECURITY_DEEP_REFRESH",
      trigger_source: "OWNER",
      requested_by: auth.data.user.id,
      status: "RUNNING",
      requested_count: 1,
      estimated_call_count: RESERVED_UNITS,
      reserved_call_count: RESERVED_UNITS,
      attempted_call_count: 0,
      policy_version: control.data.policy_version,
      metadata: { security: security.symbol, provider_instrument_id: providerInstrumentId, confirmation: CONFIRMATION },
    }).select("id").single()
    if (run.error) throw run.error
    const runId = run.data.id as string

    const insertedItems = await admin.from("data_ingestion_run_items").insert(DOMAINS.map(domain => ({
      ingestion_run_id: runId,
      security_id: security.id,
      data_domain: domain,
      status: "PLANNED",
      metadata: { mode: "COMPLETE_RESEARCH_REFRESH" },
    }))).select("id,data_domain")
    if (insertedItems.error) throw insertedItems.error
    const itemByDomain = new Map((insertedItems.data ?? []).map(row => [row.data_domain as Domain, row.id as string]))

    const reservation = await admin.rpc("reserve_provider_budget_v1", {
      p_source_code: SOURCE_CODE,
      p_ingestion_run_id: runId,
      p_reservation_key: `${runId}:COMPLETE_RESEARCH_REFRESH`,
      p_estimated_units: RESERVED_UNITS,
      p_reservation_seconds: 900,
    })
    if (reservation.error || !reservation.data?.[0]?.reserved) {
      const safeCode = reservation.data?.[0]?.reason_code ?? "BUDGET_RESERVATION_FAILED"
      for (const domain of DOMAINS) await markItem(admin, itemByDomain.get(domain)!, "SKIPPED_BUDGET", safeCode, 0, 0)
      await admin.from("data_ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), skipped_count: 4, error_summary: safeCode }).eq("id", runId)
      return reply(429, { error: "Provider budget reservation was not granted.", providerCalls: 0, runId })
    }
    const reservationId = reservation.data[0].reservation_id as string

    const leaseHolder = crypto.randomUUID()
    const lease = await admin.rpc("acquire_data_ingestion_lease_v1", {
      p_source_code: SOURCE_CODE,
      p_operation: "COMPLETE_RESEARCH_REFRESH",
      p_lease_holder: leaseHolder,
      p_lease_seconds: 900,
    })
    if (lease.error || !lease.data?.[0]?.acquired) {
      await admin.rpc("settle_provider_budget_v1", { p_reservation_id: reservationId, p_consumed_units: 0, p_failed_units: 0, p_released_units: RESERVED_UNITS })
      for (const domain of DOMAINS) await markItem(admin, itemByDomain.get(domain)!, "SKIPPED_BUDGET", "REFRESH_IN_PROGRESS", 0, 0)
      await admin.from("data_ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), skipped_count: 4, error_summary: "REFRESH_IN_PROGRESS" }).eq("id", runId)
      return reply(409, { error: "Another complete research refresh is currently running.", providerCalls: 0, runId })
    }

    const client = new TrendlyneObservedMcpClient(mcpUrl)
    let attempted = 0, providerSucceeded = 0, providerFailed = 0, acceptedItems = 0, failedItems = 0
    const results: Array<Record<string, unknown>> = []
    let abortRemaining = false

    const executeCall = async (domain: Domain, operation: string, fn: () => Promise<string>, writer: (text: string) => Promise<Record<string, unknown>>) => {
      const itemId = itemByDomain.get(domain)!
      const attemptedAt = new Date().toISOString()
      attempted += 1
      let text: string
      try {
        text = await fn()
        await recordUsage(admin, runId, itemId, security.id, domain, operation, attempted, attemptedAt, "SUCCEEDED", null)
        providerSucceeded += 1
      } catch (error) {
        const safeCode = error instanceof Error && error.message.startsWith("PROVIDER_") ? error.message.replace(/[^A-Z0-9_]/gi, "_").toUpperCase() : "PROVIDER_REQUEST_FAILED"
        await recordUsage(admin, runId, itemId, security.id, domain, operation, attempted, attemptedAt, "FAILED", safeCode)
        providerFailed += 1
        failedItems += 1
        await markItem(admin, itemId, "FAILED", safeCode, 1, 0)
        results.push({ domain, status: "FAILED", safeCode })
        return false
      }
      try {
        const output = await writer(text)
        acceptedItems += 1
        const acceptedCount = Number(output.metricCount ?? output.documentAppearances ?? 1)
        await markItem(admin, itemId, "ACCEPTED", null, 1, acceptedCount, output)
        results.push({ domain, status: "ACCEPTED", ...output })
        return true
      } catch (error) {
        const safeCode = error instanceof Error ? error.message.replace(/[^A-Z0-9_]/gi, "_").toUpperCase().slice(0, 120) : "POSTPROCESSING_FAILED"
        failedItems += 1
        await markItem(admin, itemId, "FAILED", safeCode, 1, 0)
        results.push({ domain, status: "FAILED", safeCode })
        return false
      }
    }

    try {
      const overviewOk = await executeCall(
        "TTM_FUNDAMENTALS",
        "GET_OVERVIEW_NEWS_CORP_EVENTS",
        () => client.getOverviewNewsCorpEvents(security.symbol, "overview"),
        async text => writeOverview(admin, runId, security, providerInstrumentId, text),
      )
      if (!overviewOk) abortRemaining = true

      if (!abortRemaining) {
        const detailedQuery = `${security.name} ${security.symbol} instrument ${providerInstrumentId} latest ROCE Ann. %, OPM TTM %, promoter holding pledge percentage, Gross NPA ratio Qtr %, Net NPA ratio % Qtr, EPS Qtr YoY Growth %, net profit 3Y growth, cash EPS 3Y growth, operating cash flow 3Y growth, debt equity, interest coverage, ROA, NIM, capital adequacy and CET1`
        await executeCall(
          "DETAILED_FUNDAMENTALS",
          "GET_PARAMETER_VALUES_MULTI_STOCK",
          () => client.getParameterValuesMultiStock(detailedQuery, "stock"),
          async text => writeDetailed(admin, runId, security, providerInstrumentId, text),
        )
        await executeCall(
          "OWNERSHIP",
          "GET_OWNERSHIP_DEALS_INSIDER_SAST",
          () => client.getOwnershipDealsInsiderSast(security.symbol, "shareholding"),
          async text => writeOwnership(admin, runId, security, providerInstrumentId, text),
        )
        const documentQuery = `${security.name} ${security.symbol} stock id ${providerInstrumentId} annual report quarterly result investor presentation earnings call`
        await executeCall(
          "DOCUMENT_DISCOVERY",
          "GET_DOCUMENT_SEARCH_RESULTS",
          () => client.getDocumentSearchResults(documentQuery),
          async text => writeDocuments(admin, runId, security, providerInstrumentId, text),
        )
      }

      if (abortRemaining) {
        for (const domain of DOMAINS.slice(1)) {
          const itemId = itemByDomain.get(domain)!
          await markItem(admin, itemId, "SKIPPED_BUDGET", "IDENTITY_REVALIDATION_FAILED", 0, 0)
          results.push({ domain, status: "SKIPPED", safeCode: "IDENTITY_REVALIDATION_FAILED" })
        }
      } else {
        if (results.some(result => result.domain === "TTM_FUNDAMENTALS" && result.status === "ACCEPTED")) await updateRefreshState(admin, security.id, "TTM_FUNDAMENTALS", runId, 30)
        if (results.some(result => result.domain === "OWNERSHIP" && result.status === "ACCEPTED")) await updateRefreshState(admin, security.id, "OWNERSHIP", runId, 45)
        if (results.some(result => result.domain === "DOCUMENT_DISCOVERY" && result.status === "ACCEPTED")) await updateRefreshState(admin, security.id, "DOCUMENT_DISCOVERY", runId, 7)
      }
    } finally {
      const released = RESERVED_UNITS - attempted
      const settlement = await admin.rpc("settle_provider_budget_v1", {
        p_reservation_id: reservationId,
        p_consumed_units: providerSucceeded,
        p_failed_units: providerFailed,
        p_released_units: released,
      })
      if (settlement.error) results.push({ domain: "ACCOUNTING", status: "FAILED", safeCode: "BUDGET_SETTLEMENT_FAILED" })
      const release = await admin.rpc("release_data_ingestion_lease_v1", {
        p_source_code: SOURCE_CODE,
        p_operation: "COMPLETE_RESEARCH_REFRESH",
        p_lease_holder: leaseHolder,
        p_cooldown_seconds: 0,
      })
      if (release.error) results.push({ domain: "ACCOUNTING", status: "FAILED", safeCode: "LEASE_RELEASE_FAILED" })
    }

    const finalStatus = abortRemaining || acceptedItems === 0 ? "FAILED" : failedItems > 0 ? "PARTIAL" : "SUCCEEDED"
    await admin.from("data_ingestion_runs").update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
      attempted_call_count: attempted,
      fetched_count: acceptedItems,
      accepted_count: acceptedItems,
      failed_count: failedItems,
      skipped_count: RESERVED_UNITS - attempted,
      error_summary: finalStatus === "SUCCEEDED" ? null : "COMPLETE_RESEARCH_REFRESH_PARTIAL_OR_FAILED",
      metadata: { security: security.symbol, provider_instrument_id: providerInstrumentId, results },
    }).eq("id", runId)

    return reply(finalStatus === "SUCCEEDED" ? 200 : finalStatus === "PARTIAL" ? 207 : 502, {
      mode: "COMPLETE_RESEARCH_REFRESH",
      security: security.symbol,
      providerInstrumentId,
      providerCalls: attempted,
      providerSucceeded,
      providerFailed,
      releasedReservationUnits: RESERVED_UNITS - attempted,
      status: finalStatus,
      results,
      runId,
      note: "Trendlyne refreshed research evidence only. Angel One remains the current-price authority; no score run or portfolio-role mutation was performed.",
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : "COMPLETE_RESEARCH_REFRESH_FAILED"
    return reply(500, { error: "Complete Research Refresh failed safely.", code })
  }
})
