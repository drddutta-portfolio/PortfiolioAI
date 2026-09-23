import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SOURCE_CODE = "TRENDLYNE_MCP"
const MAX_LIMIT = 40
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-portfolioai-classification-token" }
const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const isLocalSupabaseUrl = (value: string) => {
  try {
    const url = new URL(value)
    return ["localhost", "127.0.0.1"].includes(url.hostname) || (url.hostname === "kong" && url.port === "8000")
  } catch { return false }
}

const sha = async (value: unknown) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value))))).map((x) => x.toString(16).padStart(2, "0")).join("")
const nullable = (value: string | undefined) => !value || value === "None" || value === "null" ? null : value.trim()
const tableRows = (text: string, start: string, end: string) => {
  const block = text.split(start)[1]?.split(end)[0] ?? ""
  return block.split("\n").map((line) => line.trim()).filter((line) => line.includes(" | ")).map((line) => line.split(" | ").map((x) => x.trim()))
}
interface Candidate { name: string; symbol: string; bseCode: string | null; isin: string | null; sector: string | null; industry: string | null }
const parseCandidates = (text: string): Candidate[] => tableRows(text, "data:", "__END__").slice(1).filter((r) => r.length >= 7).map((r) => ({ name: r[0], symbol: nullable(r[1]) ?? "", bseCode: nullable(r[2]), isin: nullable(r[3]), sector: nullable(r[5]), industry: nullable(r[6]) }))

const parseMcpResult = (body: string): unknown => {
  let payload: Record<string, unknown>
  try {
    const events = body.split(/\r?\n/).map((x) => x.trim()).filter((x) => x.startsWith("data:")).map((x) => x.slice(5).trim()).filter((x) => x && x !== "[DONE]")
    payload = (events.length ? events.map(JSON.parse).at(-1) : JSON.parse(body)) as Record<string, unknown>
  } catch { throw new Error("PROVIDER_PROTOCOL_ERROR") }
  if (!payload) throw new Error("PROVIDER_PROTOCOL_ERROR")
  if (payload.error) throw new Error("PROVIDER_RPC_ERROR")
  return payload.result
}

class McpClient {
  #session: string | null = null
  #next = 1
  constructor(private readonly endpoint: string) {}
  async #post(payload: unknown): Promise<unknown> {
    const headers: Record<string, string> = { "Content-Type": "application/json", "Accept": "application/json, text/event-stream" }
    if (this.#session) headers["Mcp-Session-Id"] = this.#session
    let response: Response
    try { response = await fetch(this.endpoint, { method: "POST", headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) }) }
    catch { throw new Error("PROVIDER_NETWORK_ERROR") }
    if (!response.ok) throw new Error(`PROVIDER_HTTP_${response.status}`)
    this.#session = response.headers.get("mcp-session-id") ?? this.#session
    const body = await response.text()
    return body.trim() ? parseMcpResult(body) : null
  }
  async initialize() {
    await this.#post({ jsonrpc: "2.0", id: this.#next++, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "PortfolioAI", version: "1" } } })
    await this.#post({ jsonrpc: "2.0", method: "notifications/initialized", params: {} })
  }
  async call(name: string, args: Record<string, unknown>): Promise<string> {
    if (!this.#session) await this.initialize()
    const result = await this.#post({ jsonrpc: "2.0", id: this.#next++, method: "tools/call", params: { name, arguments: args } }) as { content?: { type: string; text?: string }[]; structuredContent?: { result?: string } }
    const text = result?.structuredContent?.result ?? result?.content?.find((x) => x.type === "text")?.text
    if (typeof text !== "string") throw new Error("PROVIDER_RESULT_MISSING")
    return text
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." })

  const token = request.headers.get("x-portfolioai-classification-token")
  if (!token) return reply(401, { error: "Internal authentication required." })
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const mcpUrl = Deno.env.get("TRENDLYNE_MCP_URL")
  if (!supabaseUrl || !serviceKey || !mcpUrl) return reply(500, { error: "Server configuration is incomplete." })
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const verified = await admin.rpc("verify_trendlyne_classification_refresh_token_v1", { p_token: token })
  if (verified.error || verified.data !== true) return reply(401, { error: "Internal authentication failed." })

  let body: { action?: unknown; limit?: unknown; portfolioId?: unknown; securityIds?: unknown; confirmation?: unknown }
  try { body = await request.json() } catch { return reply(400, { error: "Invalid JSON body." }) }
  const action = body.action === "RUN" ? "RUN" : body.action === "DRY_RUN" ? "DRY_RUN" : body.action === "A2_EXECUTE" ? "A2_EXECUTE" : null
  const a2SecurityIds = action === "A2_EXECUTE" && Array.isArray(body.securityIds) && body.securityIds.every(id => typeof id === "string") ? body.securityIds as string[] : []
  const limit = action === "A2_EXECUTE" ? a2SecurityIds.length : Number(body.limit ?? MAX_LIMIT)
  if (!action || !Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return reply(400, { error: "Invalid action or limit." })
  if (action === "A2_EXECUTE") {
    const local = isLocalSupabaseUrl(supabaseUrl)
    if (!local) return reply(409, { error: "Program A A2 execution is local-only.", code: "UNEXPECTED_PRODUCTION_DB_TARGET", providerCalls: 0 })
    if (body.confirmation !== "OWNER_CONFIRMED_PROGRAM_A_A2_CLASSIFICATION") return reply(409, { error: "Exact Program A A2 confirmation is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
    if (typeof body.portfolioId !== "string" || a2SecurityIds.length < 1 || a2SecurityIds.length > 5 || new Set(a2SecurityIds).size !== a2SecurityIds.length) return reply(400, { error: "A2 requires one to five unique exact security IDs.", code: "CALL_BUDGET_EXCEEDED", providerCalls: 0 })
  }

  const control = await admin.from("provider_ingestion_controls").select("ingestion_enabled,daily_internal_attempt_limit,per_run_internal_attempt_limit,policy_version").eq("source_code", SOURCE_CODE).single()
  const source = await admin.from("data_sources").select("is_active,entitlement_verified,retention_rights_verified").eq("code", SOURCE_CODE).single()
  if (control.error || source.error) return reply(503, { error: "Provider controls are unavailable." })
  if (!control.data.ingestion_enabled || !source.data.is_active || !source.data.entitlement_verified || !source.data.retention_rights_verified) return reply(409, { error: "Provider classification refresh is not enabled." })
  if (limit > control.data.per_run_internal_attempt_limit) return reply(400, { error: "Requested limit exceeds the provider per-run control." })

  let holdingsQuery = admin.from("current_holdings").select("security_id,current_quantity")
  if (action === "A2_EXECUTE") holdingsQuery = holdingsQuery.eq("portfolio_id", body.portfolioId as string).in("security_id", a2SecurityIds)
  const holdings = await holdingsQuery
  if (holdings.error) return reply(500, { error: "Holdings could not be loaded." })
  const openQty = new Map<string, number>()
  for (const row of holdings.data ?? []) if (Number(row.current_quantity) > 0) openQty.set(row.security_id as string, (openQty.get(row.security_id as string) ?? 0) + Number(row.current_quantity))
  const ids = [...openQty.keys()]
  if (!ids.length) return reply(200, { action, targetCount: 0, providerCalls: 0 })

  const securities = await admin.from("securities").select("id,symbol,isin,asset_class").in("id", ids)
  const classifications = await admin.from("current_security_classification_v1").select("security_id,sector").in("security_id", ids)
  const prices = await admin.from("market_price_latest").select("security_id,price").in("security_id", ids)
  if (securities.error || classifications.error || prices.error) return reply(500, { error: "Classification planning data could not be loaded." })
  const sectorBy = new Map((classifications.data ?? []).map((row) => [row.security_id as string, row.sector as string | null]))
  const priceBy = new Map((prices.data ?? []).map((row) => [row.security_id as string, Number(row.price)]))
  const exactA2Ids = new Set(a2SecurityIds)
  const targets = (securities.data ?? [])
    .filter((row) => row.asset_class === "EQUITY" && typeof row.isin === "string" && row.isin.length === 12 && (action === "A2_EXECUTE" ? exactA2Ids.has(row.id as string) : !sectorBy.get(row.id as string)))
    .map((row) => ({ id: row.id as string, symbol: row.symbol as string, isin: (row.isin as string).toUpperCase(), currentValue: (openQty.get(row.id as string) ?? 0) * (priceBy.get(row.id as string) ?? 0) }))
    .sort((a, b) => b.currentValue - a.currentValue || a.symbol.localeCompare(b.symbol))
    .slice(0, limit)
  if (action === "A2_EXECUTE" && (targets.length !== a2SecurityIds.length || targets.some(target => !exactA2Ids.has(target.id)))) return reply(409, { error: "Exact A2 classification cohort is not executable.", code: "CAPABILITY_MISMATCH", providerCalls: 0 })

  const today = new Date(); today.setUTCHours(0, 0, 0, 0)
  const usage = await admin.from("provider_usage_events").select("actual_internal_units").eq("source_code", SOURCE_CODE).eq("accounting_class", "PROVIDER_TOOL_ATTEMPT").gte("attempted_at", today.toISOString())
  if (usage.error) return reply(503, { error: "Provider usage accounting is unavailable." })
  const usedToday = (usage.data ?? []).reduce((sum, row) => sum + Number(row.actual_internal_units ?? 0), 0)
  const projected = usedToday + targets.length
  const budgetEligible = projected <= control.data.daily_internal_attempt_limit

  if (action === "DRY_RUN") return reply(200, { action, targetCount: targets.length, providerCalls: 0, plannedCalls: targets.length, usedToday, projectedDailyUsage: projected, dailyLimit: control.data.daily_internal_attempt_limit, budgetEligible, targets: targets.map((x) => ({ symbol: x.symbol, currentValue: Math.round(x.currentValue * 100) / 100 })) })
  if (!targets.length) return reply(200, { action, targetCount: 0, providerCalls: 0, accepted: 0 })
  if (!budgetEligible) return reply(429, { error: "The classification cohort exceeds the remaining provider daily budget.", usedToday, plannedCalls: targets.length, dailyLimit: control.data.daily_internal_attempt_limit })

  const run = await admin.from("data_ingestion_runs").insert({ source_code: SOURCE_CODE, operation: "REFRESH_CLASSIFICATION", orchestration_type: "BOUNDED_CLASSIFICATION_COHORT", trigger_source: "MANUAL", status: "RUNNING", requested_count: targets.length, estimated_call_count: targets.length, reserved_call_count: targets.length, policy_version: control.data.policy_version, metadata: { selection: "HIGHEST_CURRENT_VALUE_UNCLASSIFIED_WITH_CANONICAL_ISIN", limit } }).select("id").single()
  if (run.error) return reply(500, { error: "Classification ingestion run could not be created." })
  const runId = run.data.id as string
  const itemRows = targets.map((target) => ({ ingestion_run_id: runId, security_id: target.id, data_domain: "CLASSIFICATION", status: "PLANNED" }))
  const items = await admin.from("data_ingestion_run_items").insert(itemRows).select("id,security_id")
  if (items.error) {
    await admin.from("data_ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), failed_count: targets.length }).eq("id", runId)
    return reply(500, { error: "Classification run items could not be created.", runId })
  }
  const itemBySecurity = new Map((items.data ?? []).map((row) => [row.security_id as string, row.id as string]))

  const reservation = await admin.rpc("reserve_provider_budget_v1", { p_source_code: SOURCE_CODE, p_ingestion_run_id: runId, p_reservation_key: `${runId}:CLASSIFICATION`, p_estimated_units: targets.length, p_reservation_seconds: 900 })
  if (reservation.error || !reservation.data?.[0]?.reserved) {
    await admin.from("data_ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), failed_count: targets.length, metadata: { reason: "BUDGET_RESERVATION_FAILED" } }).eq("id", runId)
    return reply(429, { error: "Provider budget reservation failed.", runId })
  }
  const reservationId = reservation.data[0].reservation_id as string
  const leaseHolder = crypto.randomUUID()
  const lease = await admin.rpc("acquire_data_ingestion_lease_v1", { p_source_code: SOURCE_CODE, p_operation: "REFRESH_CLASSIFICATION", p_lease_holder: leaseHolder, p_lease_seconds: 900 })
  if (lease.error || !lease.data?.[0]?.acquired) {
    await admin.rpc("settle_provider_budget_v1", { p_reservation_id: reservationId, p_consumed_units: 0, p_failed_units: 0, p_released_units: targets.length })
    await admin.from("data_ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), failed_count: targets.length, metadata: { reason: "REFRESH_IN_PROGRESS" } }).eq("id", runId)
    return reply(409, { error: "A classification refresh is already in progress.", runId })
  }

  const mappings = await admin.from("classification_source_mappings").select("source_sector,source_industry,mapping_status").eq("source_code", SOURCE_CODE).eq("mapping_status", "VERIFIED")
  const mappedPairs = new Set((mappings.data ?? []).map((row) => `${row.source_sector ?? ""}\u0000${row.source_industry ?? ""}`))
  const mcp = new McpClient(mcpUrl)
  let attempted = 0, failed = 0, accepted = 0, rejected = 0, normalized = 0
  const pendingPairs = new Map<string, { sector: string; industry: string; symbols: string[] }>()

  const sourceRecord = async (target: { id: string; symbol: string; isin: string }, candidate: Candidate) => {
    const payload = { query_symbol: target.symbol, exact_isin: target.isin, selected_candidate: candidate }
    const payloadHash = await sha(payload)
    const externalId = `CLASSIFICATION:${target.isin}`
    const inserted = await admin.from("data_source_records").upsert({ source_code: SOURCE_CODE, ingestion_run_id: runId, record_kind: "SECURITY_CLASSIFICATION_SEARCH", external_record_id: externalId, payload_hash: payloadHash, raw_payload: payload, terms_snapshot: { approval_source: "OWNER_APPROVED_STAGE_7_1C", normalized_classification_capture: true } }, { onConflict: "source_code,record_kind,external_record_id,payload_hash", ignoreDuplicates: true }).select("id").maybeSingle()
    if (inserted.error) throw inserted.error
    if (inserted.data?.id) return inserted.data.id as string
    const existing = await admin.from("data_source_records").select("id").eq("source_code", SOURCE_CODE).eq("record_kind", "SECURITY_CLASSIFICATION_SEARCH").eq("external_record_id", externalId).eq("payload_hash", payloadHash).single()
    if (existing.error) throw existing.error
    return existing.data.id as string
  }

  try {
    for (const target of targets) {
      const runItemId = itemBySecurity.get(target.id)!
      const attemptedAt = new Date().toISOString()
      attempted++
      let text: string
      try {
        text = await mcp.call("search_entities", { query: target.symbol, entity_type: "stock", limit: 10 })
        const usageResult = await admin.rpc("record_provider_usage_event_v1", { p_source_code: SOURCE_CODE, p_ingestion_run_id: runId, p_run_item_id: runItemId, p_security_id: target.id, p_data_domain: "CLASSIFICATION", p_operation_class: "SEARCH_ENTITIES", p_accounting_class: "PROVIDER_TOOL_ATTEMPT", p_estimated_internal_units: 1, p_actual_internal_units: 1, p_attempted_at: attemptedAt, p_completed_at: new Date().toISOString(), p_outcome: "SUCCEEDED", p_safe_error_code: null, p_retry_attempt: 0, p_idempotency_key: `${runId}:${target.id}:SEARCH_ENTITIES:1` })
        if (usageResult.error) throw new Error("USAGE_ACCOUNTING_FAILED")
      } catch (error) {
        failed++
        const code = error instanceof Error && /^PROVIDER_[A-Z0-9_]+$/.test(error.message) ? error.message : "PROVIDER_REQUEST_FAILED"
        await admin.rpc("record_provider_usage_event_v1", { p_source_code: SOURCE_CODE, p_ingestion_run_id: runId, p_run_item_id: runItemId, p_security_id: target.id, p_data_domain: "CLASSIFICATION", p_operation_class: "SEARCH_ENTITIES", p_accounting_class: "PROVIDER_TOOL_ATTEMPT", p_estimated_internal_units: 1, p_actual_internal_units: 1, p_attempted_at: attemptedAt, p_completed_at: new Date().toISOString(), p_outcome: "FAILED", p_safe_error_code: code, p_retry_attempt: 0, p_idempotency_key: `${runId}:${target.id}:SEARCH_ENTITIES:1` })
        await admin.rpc("record_refresh_item_result_v1", { p_run_item_id: runItemId, p_status: "FAILED", p_safe_reason_code: code, p_attempted_call_count: 1, p_accepted_record_count: 0, p_metadata: {} })
        continue
      }

      const exact = parseCandidates(text).filter((candidate) => candidate.isin?.toUpperCase() === target.isin && candidate.symbol === target.symbol)
      if (exact.length !== 1 || !exact[0].sector || !exact[0].industry) {
        rejected++
        const reason = exact.length > 1 ? "AMBIGUOUS_PROVIDER_IDENTITY" : exact.length === 0 ? "NO_EXACT_PROVIDER_IDENTITY" : "CLASSIFICATION_MISSING"
        await admin.rpc("record_refresh_item_result_v1", { p_run_item_id: runItemId, p_status: "REJECTED", p_safe_reason_code: reason, p_attempted_call_count: 1, p_accepted_record_count: 0, p_metadata: {} })
        continue
      }

      const candidate = exact[0]
      const recordId = await sourceRecord(target, candidate)
      const freshUntil = new Date(Date.now() + 180 * 86400000).toISOString()
      const pairKey = `${candidate.sector}\u0000${candidate.industry}`
      const pairMapped = mappedPairs.has(pairKey)
      const sectorObs = await admin.from("security_attribute_observations").upsert({ security_id: target.id, source_record_id: recordId, source_code: SOURCE_CODE, attribute_code: "SECTOR", text_value: candidate.sector, normalized_value: pairMapped ? candidate.sector : null, observed_at: new Date().toISOString(), retrieved_at: new Date().toISOString(), fresh_until: freshUntil, evidence_status: "AVAILABLE" }, { onConflict: "source_record_id,security_id,attribute_code", ignoreDuplicates: false }).select("id").single()
      const industryObs = await admin.from("security_attribute_observations").upsert({ security_id: target.id, source_record_id: recordId, source_code: SOURCE_CODE, attribute_code: "INDUSTRY", text_value: candidate.industry, normalized_value: pairMapped ? candidate.industry : null, observed_at: new Date().toISOString(), retrieved_at: new Date().toISOString(), fresh_until: freshUntil, evidence_status: "AVAILABLE" }, { onConflict: "source_record_id,security_id,attribute_code", ignoreDuplicates: false }).select("id").single()
      if (sectorObs.error || industryObs.error) throw sectorObs.error ?? industryObs.error

      if (pairMapped) {
        const sectorDecision = await admin.from("security_attribute_decisions").upsert({ security_id: target.id, attribute_code: "SECTOR", selected_observation_id: sectorObs.data.id, decision_basis: "EVIDENCE_PRIORITY", decided_at: new Date().toISOString(), notes: "Automatically selected from an already verified Trendlyne source-sector/source-industry mapping." }, { onConflict: "security_id,attribute_code" })
        const industryDecision = await admin.from("security_attribute_decisions").upsert({ security_id: target.id, attribute_code: "INDUSTRY", selected_observation_id: industryObs.data.id, decision_basis: "EVIDENCE_PRIORITY", decided_at: new Date().toISOString(), notes: "Automatically selected from an already verified Trendlyne source-sector/source-industry mapping." }, { onConflict: "security_id,attribute_code" })
        if (sectorDecision.error || industryDecision.error) throw sectorDecision.error ?? industryDecision.error
        normalized++
      } else {
        const pending = pendingPairs.get(pairKey) ?? { sector: candidate.sector, industry: candidate.industry, symbols: [] }
        pending.symbols.push(target.symbol)
        pendingPairs.set(pairKey, pending)
      }

      accepted++
      await admin.rpc("record_refresh_item_result_v1", { p_run_item_id: runItemId, p_status: "ACCEPTED", p_safe_reason_code: null, p_attempted_call_count: 1, p_accepted_record_count: 1, p_metadata: { sector: candidate.sector, industry: candidate.industry, mapping_status: pairMapped ? "VERIFIED" : "PENDING_REVIEW" } })
    }
  } catch {
    failed++
  } finally {
    const consumed = Math.max(0, attempted - failed)
    const released = Math.max(0, targets.length - attempted)
    await admin.rpc("settle_provider_budget_v1", { p_reservation_id: reservationId, p_consumed_units: consumed, p_failed_units: failed, p_released_units: released })
    await admin.rpc("release_data_ingestion_lease_v1", { p_source_code: SOURCE_CODE, p_operation: "REFRESH_CLASSIFICATION", p_lease_holder: leaseHolder, p_cooldown_seconds: 0 })
    const status = failed > 0 ? (accepted > 0 ? "PARTIAL" : "FAILED") : "SUCCEEDED"
    await admin.from("data_ingestion_runs").update({ status, completed_at: new Date().toISOString(), attempted_call_count: attempted, accepted_count: accepted, rejected_count: rejected, failed_count: failed, fetched_count: accepted, skipped_count: Math.max(0, targets.length - accepted - failed), metadata: { selection: "HIGHEST_CURRENT_VALUE_UNCLASSIFIED_WITH_CANONICAL_ISIN", normalized_count: normalized, pending_mapping_pairs: [...pendingPairs.values()] } }).eq("id", runId)
  }

  return reply(200, { action, runId, targetCount: targets.length, providerCalls: attempted, attempted, accepted, rejected, failed, normalized, pendingReview: pendingPairs.size, pendingMappingPairs: [...pendingPairs.values()] })
})
