import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { parseTrendlyneClassificationCandidates } from "../_shared/trendlyne-classification.ts"
import { parseOverview, reconcileTrendlyneIdentityDiscovery } from "../_shared/trendlyne.ts"
import { TrendlyneObservedMcpClient } from "../_shared/trendlyne-observed.ts"
import { consumeP4ExecutionGrant } from "../_shared/p4-execution-grant.ts"

const SOURCE_CODE = "TRENDLYNE_MCP"
const CONFIRMATION = "OWNER_CONFIRMED_PROGRAM_A_A2_IDENTITY_DISCOVERY"
const P4_CONFIRMATION = "OWNER_CONFIRMED_POST_D_P4_IDENTITY_DISCOVERY"
const P4B_CONFIRMATION = "OWNER_CONFIRMED_POST_D_P4B_IDENTITY_DISCOVERY"
const P7_USHAMART_CONFIRMATION = "OWNER_CONFIRMED_P7_IC2_USHAMART_IDENTITY_REMEDIATION"
const P7_USHAMART_SECURITY_ID = "84455cdf-46f9-48d3-a323-8b46ef8cd9f6"
const P7_USHAMART_SYMBOL = "USHAMART"
const P7_USHAMART_ISIN = "INE228A01035"
const P7_USHAMART_STOCK_ID = "1456"
const P7_MAXHEALTH_CONFIRMATION = "OWNER_CONFIRMED_P7_IC2_MAXHEALTH_IDENTITY_REMEDIATION"
const P7_MAXHEALTH_SECURITY_ID = "6acf47cc-f868-41d3-b37c-1f7a0c29021b"
const P7_MAXHEALTH_SYMBOL = "MAXHEALTH"
const P7_MAXHEALTH_ISIN = "INE027H01010"
const P7_MAXHEALTH_STOCK_ID = "276825"
const P7_TMCV_CONFIRMATION = "OWNER_CONFIRMED_P7_IC2_TMCV_IDENTITY_REMEDIATION"
const P7_TMCV_SECURITY_ID = "986f6527-d5e6-4fe2-af2d-576ddccedb57"
const P7_TMCV_SYMBOL = "TMCV"
const P7_TMCV_ISIN = "INE1TAE01010"
const P7_TMCV_STOCK_ID = "3327757"
const P7_VEDL_CONFIRMATION = "OWNER_CONFIRMED_P7_IC2_VEDL_IDENTITY_REMEDIATION"
const P7_VEDL_SECURITY_ID = "2065b292-6f3a-4c30-8e63-e2b845862ad4"
const P7_VEDL_SYMBOL = "VEDL"
const P7_VEDL_ISIN = "INE205A01025"
const P7_VEDL_STOCK_ID = "1289"
const P7_CHOLAFIN_CONFIRMATION = "OWNER_CONFIRMED_P7_IC2_CHOLAFIN_IDENTITY_REMEDIATION"
const P7_CHOLAFIN_SECURITY_ID = "cbdbea24-eb1d-489f-ab6f-7800f04f28ca"
const P7_CHOLAFIN_SYMBOL = "CHOLAFIN"
const P7_CHOLAFIN_ISIN = "INE121A01024"
const P7_CHOLAFIN_STOCK_ID = "262"
const P7_HAL_CONFIRMATION = "OWNER_CONFIRMED_P7_IC2_HAL_IDENTITY_REMEDIATION"
const P7_HAL_SECURITY_ID = "ece0aa93-0d35-4748-9316-dd2eb100ad63"
const P7_HAL_SYMBOL = "HAL"
const P7_HAL_ISIN = "INE066F01020"
const P7_HAL_STOCK_ID = "80502"
const P7_RHIM_CONFIRMATION = "OWNER_CONFIRMED_P7_IC2_RHIM_IDENTITY_REMEDIATION"
const P7_RHIM_SECURITY_ID = "46c4b2bd-194f-4a83-beb3-36274960edfd"
const P7_RHIM_SYMBOL = "RHIM"
const P7_RHIM_ISIN = "INE743M01012"
const P7_RHIM_STOCK_ID = "989"
const P4_DEV_REF = "lrgpjimipfkyoqbpsqzz"
const P4_PROD_REF = "uxiyufbsbgzzdujzcdxe"
const P4_PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
const P4_SECURITY_IDS = new Set([
  "fdec39e9-08a7-418d-ae96-9d8ce834d26c",
  "6771f493-c29a-477e-8cc8-2bede0941e44",
])
const projectRef = (value: string) => { try { return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1] ?? null } catch { return null } }
const RESERVED_UNITS = 2
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-portfolioai-classification-token" }
const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })
const localUrl = (value: string) => { try { const url = new URL(value); return ["localhost", "127.0.0.1"].includes(url.hostname) || (url.hostname === "kong" && url.port === "8000") } catch { return false } }
const hash = async (value: unknown) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value))))).map(byte => byte.toString(16).padStart(2, "0")).join("")

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." })
  const supabaseUrl = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), mcpUrl = Deno.env.get("TRENDLYNE_MCP_URL")
  if (!supabaseUrl || !anonKey || !serviceKey || !mcpUrl) return reply(500, { error: "Server configuration is incomplete.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
  try {
    const body = await request.json() as { action?: unknown; portfolioId?: unknown; securityId?: unknown; confirmation?: unknown; grantId?: unknown }
    const p4 = body.action === "P4_EXECUTE"
    const p4b = body.action === "P4B_EXECUTE"
    const p7Ushamart = body.action === "P7_IC2_USHAMART_REMEDIATE"
    const p7Maxhealth = body.action === "P7_IC2_MAXHEALTH_REMEDIATE"
    const p7Tmcv = body.action === "P7_IC2_TMCV_REMEDIATE"
    const p7Vedl = body.action === "P7_IC2_VEDL_REMEDIATE"
    const p7Cholafin = body.action === "P7_IC2_CHOLAFIN_REMEDIATE"
    const p7Hal = body.action === "P7_IC2_HAL_REMEDIATE"
    const p7Rhim = body.action === "P7_IC2_RHIM_REMEDIATE"
    const a2 = body.action === "EXECUTE"
    if (!p4 && !p4b && !p7Ushamart && !p7Maxhealth && !p7Tmcv && !p7Vedl && !p7Cholafin && !p7Hal && !p7Rhim && !a2) return reply(409, { error: "Exact identity authorization is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
    if (typeof body.portfolioId !== "string" || typeof body.securityId !== "string") return reply(409, { error: "Exact identity scope is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    let requestedBy: string

    if (p4 || p4b || p7Ushamart || p7Maxhealth || p7Tmcv || p7Vedl || p7Cholafin || p7Hal || p7Rhim) {
      const ref = projectRef(supabaseUrl)
      if (ref === P4_PROD_REF) return reply(409, { error: "P4 identity discovery refuses Production.", code: "UNEXPECTED_PRODUCTION_DB_TARGET", providerCalls: 0 })
      if (ref !== P4_DEV_REF || body.portfolioId !== P4_PORTFOLIO_ID) {
        return reply(409, { error: "Exact Post-D P4 identity authorization is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
      }
      if (p7Rhim) {
        if (
          body.portfolioId !== P4_PORTFOLIO_ID ||
          body.securityId !== P7_RHIM_SECURITY_ID ||
          body.confirmation !== P7_RHIM_CONFIRMATION
        ) return reply(409, { error: "Exact RHIM remediation scope is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
        const grant = await consumeP4ExecutionGrant(admin, {
          grantId: body.grantId,
          action: "P7_IC2_RHIM_REMEDIATE",
          portfolioId: body.portfolioId,
          securityId: body.securityId,
        })
        if (!grant.ok) return reply(401, { error: grant.message, code: grant.code, providerCalls: 0 })
      } else if (p7Hal) {
        if (
          body.portfolioId !== P4_PORTFOLIO_ID ||
          body.securityId !== P7_HAL_SECURITY_ID ||
          body.confirmation !== P7_HAL_CONFIRMATION
        ) return reply(409, { error: "Exact HAL remediation scope is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
        const grant = await consumeP4ExecutionGrant(admin, {
          grantId: body.grantId,
          action: "P7_IC2_HAL_REMEDIATE",
          portfolioId: body.portfolioId,
          securityId: body.securityId,
        })
        if (!grant.ok) return reply(401, { error: grant.message, code: grant.code, providerCalls: 0 })
      } else if (p7Cholafin) {
        if (
          body.portfolioId !== P4_PORTFOLIO_ID ||
          body.securityId !== P7_CHOLAFIN_SECURITY_ID ||
          body.confirmation !== P7_CHOLAFIN_CONFIRMATION
        ) return reply(409, { error: "Exact CHOLAFIN remediation scope is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
        const grant = await consumeP4ExecutionGrant(admin, {
          grantId: body.grantId,
          action: "P7_IC2_CHOLAFIN_REMEDIATE",
          portfolioId: body.portfolioId,
          securityId: body.securityId,
        })
        if (!grant.ok) return reply(401, { error: grant.message, code: grant.code, providerCalls: 0 })
      } else if (p7Vedl) {
        if (
          body.portfolioId !== P4_PORTFOLIO_ID ||
          body.securityId !== P7_VEDL_SECURITY_ID ||
          body.confirmation !== P7_VEDL_CONFIRMATION
        ) return reply(409, { error: "Exact VEDL remediation scope is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
        const grant = await consumeP4ExecutionGrant(admin, {
          grantId: body.grantId,
          action: "P7_IC2_VEDL_REMEDIATE",
          portfolioId: body.portfolioId,
          securityId: body.securityId,
        })
        if (!grant.ok) return reply(401, { error: grant.message, code: grant.code, providerCalls: 0 })
      } else if (p7Tmcv) {
        if (
          body.portfolioId !== P4_PORTFOLIO_ID ||
          body.securityId !== P7_TMCV_SECURITY_ID ||
          body.confirmation !== P7_TMCV_CONFIRMATION
        ) return reply(409, { error: "Exact TMCV remediation scope is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
        const grant = await consumeP4ExecutionGrant(admin, {
          grantId: body.grantId,
          action: "P7_IC2_TMCV_REMEDIATE",
          portfolioId: body.portfolioId,
          securityId: body.securityId,
        })
        if (!grant.ok) return reply(401, { error: grant.message, code: grant.code, providerCalls: 0 })
      } else if (p7Maxhealth) {
        if (
          body.portfolioId !== P4_PORTFOLIO_ID ||
          body.securityId !== P7_MAXHEALTH_SECURITY_ID ||
          body.confirmation !== P7_MAXHEALTH_CONFIRMATION
        ) return reply(409, { error: "Exact MAXHEALTH remediation scope is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
        const grant = await consumeP4ExecutionGrant(admin, {
          grantId: body.grantId,
          action: "P7_IC2_MAXHEALTH_REMEDIATE",
          portfolioId: body.portfolioId,
          securityId: body.securityId,
        })
        if (!grant.ok) return reply(401, { error: grant.message, code: grant.code, providerCalls: 0 })
      } else if (p7Ushamart) {
        if (
          body.portfolioId !== P4_PORTFOLIO_ID ||
          body.securityId !== P7_USHAMART_SECURITY_ID ||
          body.confirmation !== P7_USHAMART_CONFIRMATION
        ) return reply(409, { error: "Exact USHAMART remediation scope is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
        const grant = await consumeP4ExecutionGrant(admin, {
          grantId: body.grantId,
          action: "P7_IC2_USHAMART_REMEDIATE",
          portfolioId: body.portfolioId,
          securityId: body.securityId,
        })
        if (!grant.ok) return reply(401, { error: grant.message, code: grant.code, providerCalls: 0 })
      } else if (p4) {
        if (!P4_SECURITY_IDS.has(body.securityId) || body.confirmation !== P4_CONFIRMATION) {
          return reply(409, { error: "Exact Post-D P4 identity authorization is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
        }
        const token = request.headers.get("x-portfolioai-classification-token")
        if (!token) return reply(401, { error: "Internal authentication required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
        const verified = await admin.rpc("verify_trendlyne_classification_refresh_token_v1", { p_token: token })
        if (verified.error || verified.data !== true) return reply(401, { error: "Internal authentication failed.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
      } else {
        if (body.confirmation !== P4B_CONFIRMATION) return reply(409, { error: "Exact Post-D P4B identity confirmation is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
        const grant = await consumeP4ExecutionGrant(admin, {
          grantId: body.grantId,
          action: "P4B_EXECUTE",
          portfolioId: body.portfolioId,
          securityId: body.securityId,
        })
        if (!grant.ok) return reply(401, { error: grant.message, code: grant.code, providerCalls: 0 })
      }
      const p = await admin.from("portfolios").select("id,user_id").eq("id", body.portfolioId).single()
      if (p.error || !p.data) return reply(404, { error: "Portfolio not found.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
      requestedBy = p.data.user_id as string
    } else {
      const authorization = request.headers.get("Authorization")
      if (!authorization) return reply(401, { error: "Authentication required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
      if (!localUrl(supabaseUrl)) return reply(409, { error: "Program A A2 execution is local-only.", code: "UNEXPECTED_PRODUCTION_DB_TARGET", providerCalls: 0 })
      if (body.confirmation !== CONFIRMATION) return reply(409, { error: "Exact Program A A2 identity authorization is required.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
      const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } }), auth = await user.auth.getUser()
      if (auth.error || !auth.data.user) return reply(401, { error: "Invalid session.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
      requestedBy = auth.data.user.id
    }

    const [portfolio, holding, securityResult, source, control] = await Promise.all([
      admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", requestedBy).single(),
      admin.from("current_holdings").select("security_id").eq("portfolio_id", body.portfolioId).eq("security_id", body.securityId).maybeSingle(),
      admin.from("securities").select("id,name,symbol,isin,exchange,series,asset_class").eq("id", body.securityId).single(),
      admin.from("data_sources").select("is_active,entitlement_verified,retention_rights_verified").eq("code", SOURCE_CODE).single(),
      admin.from("provider_ingestion_controls").select("ingestion_enabled,daily_internal_attempt_limit,per_run_internal_attempt_limit,actual_provider_quota_status,policy_version").eq("source_code", SOURCE_CODE).single(),
    ])
    if (portfolio.error || holding.error || !holding.data) return reply(403, { error: "Identity discovery is limited to an owned open holding.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
    if (securityResult.error || securityResult.data.asset_class !== "EQUITY") return reply(409, { error: "Canonical equity identity is incomplete.", code: "CLASSIFICATION_IDENTITY_PREREQUISITE_MISSING", providerCalls: 0 })
    const canonicalIsin = typeof securityResult.data.isin === "string" && securityResult.data.isin.trim() ? securityResult.data.isin.trim() : null
    if (!canonicalIsin && !p4b) return reply(409, { error: "Canonical equity identity is incomplete.", code: "CLASSIFICATION_IDENTITY_PREREQUISITE_MISSING", providerCalls: 0 })
    if (!canonicalIsin && p4b) {
      const mapping = await admin.from("market_data_instrument_mappings")
        .select("mapping_status,match_basis,trading_symbol,exchange")
        .eq("security_id", body.securityId).eq("provider_code", "ANGEL_ONE").maybeSingle()
      if (mapping.error || !mapping.data || mapping.data.mapping_status !== "VERIFIED" || mapping.data.match_basis !== "EXCHANGE_SYMBOL_EXACT") {
        return reply(409, { error: "Missing-ISIN bootstrap requires a verified exact AngelOne symbol mapping.", code: "CANONICAL_ISIN_BOOTSTRAP_PREREQUISITE_MISSING", providerCalls: 0 })
      }
    }
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
    const run = await admin.from("data_ingestion_runs").insert({ source_code: SOURCE_CODE, portfolio_id: body.portfolioId, operation: "RESOLVE_PROVIDER_IDENTITY", orchestration_type: "PROGRAM_A_A2_IDENTITY_PREREQUISITE", trigger_source: "OWNER", requested_by: requestedBy, status: "RUNNING", requested_count: 1, estimated_call_count: RESERVED_UNITS, reserved_call_count: RESERVED_UNITS, policy_version: control.data.policy_version, metadata: { security: securityResult.data.symbol } }).select("id").single()
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
      let searchText = ""
      let overviewText: string
      let identity: ReturnType<typeof parseOverview>["identity"]
      let bootstrapMissingIsin = false
      if (p7Rhim) {
        if (
          securityResult.data.symbol !== P7_RHIM_SYMBOL ||
          canonicalIsin?.toUpperCase() !== P7_RHIM_ISIN
        ) throw new Error("RHIM_CANONICAL_IDENTITY_MISMATCH")
        overviewText = await tracked("GET_OVERVIEW_NEWS_CORP_EVENTS", () => client.getOverviewNewsCorpEvents(P7_RHIM_SYMBOL, "overview"))
        const overview = parseOverview(overviewText)
        if (
          overview.identity.stockId !== P7_RHIM_STOCK_ID ||
          overview.identity.symbol !== P7_RHIM_SYMBOL ||
          overview.identity.isin?.toUpperCase() !== P7_RHIM_ISIN
        ) throw new Error("RHIM_PROVIDER_IDENTITY_MISMATCH")
        identity = overview.identity
      } else if (p7Hal) {
        if (
          securityResult.data.symbol !== P7_HAL_SYMBOL ||
          canonicalIsin?.toUpperCase() !== P7_HAL_ISIN
        ) throw new Error("HAL_CANONICAL_IDENTITY_MISMATCH")
        overviewText = await tracked("GET_OVERVIEW_NEWS_CORP_EVENTS", () => client.getOverviewNewsCorpEvents(P7_HAL_SYMBOL, "overview"))
        const overview = parseOverview(overviewText)
        if (
          overview.identity.stockId !== P7_HAL_STOCK_ID ||
          overview.identity.symbol !== P7_HAL_SYMBOL ||
          overview.identity.isin?.toUpperCase() !== P7_HAL_ISIN
        ) throw new Error("HAL_PROVIDER_IDENTITY_MISMATCH")
        identity = overview.identity
      } else if (p7Cholafin) {
        if (
          securityResult.data.symbol !== P7_CHOLAFIN_SYMBOL ||
          canonicalIsin?.toUpperCase() !== P7_CHOLAFIN_ISIN
        ) throw new Error("CHOLAFIN_CANONICAL_IDENTITY_MISMATCH")
        overviewText = await tracked("GET_OVERVIEW_NEWS_CORP_EVENTS", () => client.getOverviewNewsCorpEvents(P7_CHOLAFIN_SYMBOL, "overview"))
        const overview = parseOverview(overviewText)
        if (
          overview.identity.stockId !== P7_CHOLAFIN_STOCK_ID ||
          overview.identity.symbol !== P7_CHOLAFIN_SYMBOL ||
          overview.identity.isin?.toUpperCase() !== P7_CHOLAFIN_ISIN
        ) throw new Error("CHOLAFIN_PROVIDER_IDENTITY_MISMATCH")
        identity = overview.identity
      } else if (p7Vedl) {
        if (
          securityResult.data.symbol !== P7_VEDL_SYMBOL ||
          canonicalIsin?.toUpperCase() !== P7_VEDL_ISIN
        ) throw new Error("VEDL_CANONICAL_IDENTITY_MISMATCH")
        overviewText = await tracked("GET_OVERVIEW_NEWS_CORP_EVENTS", () => client.getOverviewNewsCorpEvents(P7_VEDL_SYMBOL, "overview"))
        const overview = parseOverview(overviewText)
        if (
          overview.identity.stockId !== P7_VEDL_STOCK_ID ||
          overview.identity.symbol !== P7_VEDL_SYMBOL ||
          overview.identity.isin?.toUpperCase() !== P7_VEDL_ISIN
        ) throw new Error("VEDL_PROVIDER_IDENTITY_MISMATCH")
        identity = overview.identity
      } else if (p7Tmcv) {
        if (
          securityResult.data.symbol !== P7_TMCV_SYMBOL ||
          canonicalIsin?.toUpperCase() !== P7_TMCV_ISIN
        ) throw new Error("TMCV_CANONICAL_IDENTITY_MISMATCH")
        overviewText = await tracked("GET_OVERVIEW_NEWS_CORP_EVENTS", () => client.getOverviewNewsCorpEvents(P7_TMCV_SYMBOL, "overview"))
        const overview = parseOverview(overviewText)
        if (
          overview.identity.stockId !== P7_TMCV_STOCK_ID ||
          overview.identity.symbol !== P7_TMCV_SYMBOL ||
          overview.identity.isin?.toUpperCase() !== P7_TMCV_ISIN
        ) throw new Error("TMCV_PROVIDER_IDENTITY_MISMATCH")
        identity = overview.identity
      } else if (p7Maxhealth) {
        if (
          securityResult.data.symbol !== P7_MAXHEALTH_SYMBOL ||
          canonicalIsin?.toUpperCase() !== P7_MAXHEALTH_ISIN
        ) throw new Error("MAXHEALTH_CANONICAL_IDENTITY_MISMATCH")
        overviewText = await tracked("GET_OVERVIEW_NEWS_CORP_EVENTS", () => client.getOverviewNewsCorpEvents(P7_MAXHEALTH_SYMBOL, "overview"))
        const overview = parseOverview(overviewText)
        if (
          overview.identity.stockId !== P7_MAXHEALTH_STOCK_ID ||
          overview.identity.symbol !== P7_MAXHEALTH_SYMBOL ||
          overview.identity.isin?.toUpperCase() !== P7_MAXHEALTH_ISIN
        ) throw new Error("MAXHEALTH_PROVIDER_IDENTITY_MISMATCH")
        identity = overview.identity
      } else if (p7Ushamart) {
        if (
          securityResult.data.symbol !== P7_USHAMART_SYMBOL ||
          canonicalIsin?.toUpperCase() !== P7_USHAMART_ISIN
        ) throw new Error("USHAMART_CANONICAL_IDENTITY_MISMATCH")
        overviewText = await tracked("GET_OVERVIEW_NEWS_CORP_EVENTS", () => client.getOverviewNewsCorpEvents(P7_USHAMART_SYMBOL, "overview"))
        const overview = parseOverview(overviewText)
        if (
          overview.identity.stockId !== P7_USHAMART_STOCK_ID ||
          overview.identity.symbol !== P7_USHAMART_SYMBOL ||
          overview.identity.isin?.toUpperCase() !== P7_USHAMART_ISIN
        ) throw new Error("USHAMART_PROVIDER_IDENTITY_MISMATCH")
        identity = overview.identity
      } else if (!canonicalIsin) {
        bootstrapMissingIsin = true
        overviewText = await tracked("GET_OVERVIEW_NEWS_CORP_EVENTS", () => client.getOverviewNewsCorpEvents(securityResult.data.symbol, "overview"))
        const overview = parseOverview(overviewText)
        if (overview.identity.symbol !== securityResult.data.symbol || !overview.identity.isin || !overview.identity.stockId) throw new Error("NO_EXACT_PROVIDER_IDENTITY")
        const isinWrite = await admin.from("securities").update({ isin: overview.identity.isin }).eq("id", body.securityId).is("isin", null)
        if (isinWrite.error) throw new Error("CANONICAL_ISIN_BOOTSTRAP_WRITE_FAILED")
        identity = overview.identity
      } else {
        searchText = await tracked("SEARCH_ENTITIES", () => client.searchEntities(`${securityResult.data.name} ${securityResult.data.symbol} ${canonicalIsin}`, "stock", 10))
        overviewText = await tracked("GET_OVERVIEW_NEWS_CORP_EVENTS", () => client.getOverviewNewsCorpEvents(securityResult.data.symbol, "overview"))
        identity = reconcileTrendlyneIdentityDiscovery({ name: securityResult.data.name, symbol: securityResult.data.symbol, isin: canonicalIsin, bseCode: null }, parseTrendlyneClassificationCandidates(searchText), parseOverview(overviewText))
      }
      const payload = {
        security_id: body.securityId,
        canonical: { name: securityResult.data.name, symbol: securityResult.data.symbol, isin: canonicalIsin ?? identity.isin },
        matched_identity: identity,
        search_result: searchText,
        overview_result: overviewText,
        bootstrap_missing_isin: bootstrapMissingIsin,
        p7_ic2_rhim_remediation: p7Rhim ? {
          exact_expected_stock_id: P7_RHIM_STOCK_ID,
          exact_expected_symbol: P7_RHIM_SYMBOL,
          exact_expected_isin: P7_RHIM_ISIN,
          public_validation: {
            trendlyne_stock_url_identity: "989/RHIM",
            nse_official_isin: P7_RHIM_ISIN,
          },
        } : null,
        p7_ic2_hal_remediation: p7Hal ? {
          exact_expected_stock_id: P7_HAL_STOCK_ID,
          exact_expected_symbol: P7_HAL_SYMBOL,
          exact_expected_isin: P7_HAL_ISIN,
          public_validation: {
            trendlyne_stock_url_identity: "80502/HAL",
            nse_official_isin: P7_HAL_ISIN,
          },
        } : null,
        p7_ic2_cholafin_remediation: p7Cholafin ? {
          exact_expected_stock_id: P7_CHOLAFIN_STOCK_ID,
          exact_expected_symbol: P7_CHOLAFIN_SYMBOL,
          exact_expected_isin: P7_CHOLAFIN_ISIN,
          canonical_name_alias: securityResult.data.name,
          provider_public_name: "Cholamandalam Investment & Finance Company Ltd.",
        } : null,
        p7_ic2_vedl_remediation: p7Vedl ? {
          exact_expected_stock_id: P7_VEDL_STOCK_ID,
          exact_expected_symbol: P7_VEDL_SYMBOL,
          exact_expected_isin: P7_VEDL_ISIN,
          public_validation: {
            trendlyne_stock_url_identity: "1289/VEDL",
            official_isin: P7_VEDL_ISIN,
          },
        } : null,
        p7_ic2_tmcv_remediation: p7Tmcv ? {
          exact_expected_stock_id: P7_TMCV_STOCK_ID,
          exact_expected_symbol: P7_TMCV_SYMBOL,
          exact_expected_isin: P7_TMCV_ISIN,
          public_validation: {
            trendlyne_stock_url_identity: "3327757/TMCV",
            nse_official_isin: P7_TMCV_ISIN,
          },
        } : null,
        p7_ic2_maxhealth_remediation: p7Maxhealth ? {
          exact_expected_stock_id: P7_MAXHEALTH_STOCK_ID,
          exact_expected_symbol: P7_MAXHEALTH_SYMBOL,
          exact_expected_isin: P7_MAXHEALTH_ISIN,
          public_validation: {
            trendlyne_stock_url_identity: "276825/MAXHEALTH",
            company_official_isin: P7_MAXHEALTH_ISIN,
          },
        } : null,
        p7_ic2_ushamart_remediation: p7Ushamart ? {
          exact_expected_stock_id: P7_USHAMART_STOCK_ID,
          exact_expected_symbol: P7_USHAMART_SYMBOL,
          exact_expected_isin: P7_USHAMART_ISIN,
          public_validation: {
            trendlyne_stock_url_identity: "1456/USHAMART",
            company_official_isin: P7_USHAMART_ISIN,
          },
        } : null,
      }
      const payloadHash = await hash(payload)
      const record = await admin.from("data_source_records").upsert({ source_code: SOURCE_CODE, ingestion_run_id: run.data.id, record_kind: "SECURITY_IDENTITY", external_record_id: `${identity.stockId}:identity`, payload_hash: payloadHash, raw_payload: payload, retrieved_at: new Date().toISOString(), terms_snapshot: { mode: p7Rhim ? "P7_IC2_RHIM_EXACT_IDENTITY_REMEDIATION" : p7Hal ? "P7_IC2_HAL_EXACT_IDENTITY_REMEDIATION" : p7Cholafin ? "P7_IC2_CHOLAFIN_EXACT_IDENTITY_REMEDIATION" : p7Vedl ? "P7_IC2_VEDL_EXACT_IDENTITY_REMEDIATION" : p7Tmcv ? "P7_IC2_TMCV_EXACT_IDENTITY_REMEDIATION" : p7Maxhealth ? "P7_IC2_MAXHEALTH_EXACT_IDENTITY_REMEDIATION" : p7Ushamart ? "P7_IC2_USHAMART_EXACT_IDENTITY_REMEDIATION" : p4b ? "POST_D_P4B_IDENTITY_PREREQUISITE" : "PROGRAM_A_A2_IDENTITY_PREREQUISITE", exact_symbol_isin_required: !bootstrapMissingIsin, missing_isin_bootstrap_requires_angel_exact_symbol: bootstrapMissingIsin, public_exact_identity_crosscheck_required: p7Ushamart || p7Maxhealth || p7Tmcv || p7Vedl || p7Cholafin || p7Hal || p7Rhim } }, { onConflict: "source_code,record_kind,external_record_id,payload_hash", ignoreDuplicates: true }).select("id").maybeSingle()
      let sourceRecordId = record.data?.id
      if (!sourceRecordId) { const found = await admin.from("data_source_records").select("id").eq("source_code", SOURCE_CODE).eq("record_kind", "SECURITY_IDENTITY").eq("external_record_id", `${identity.stockId}:identity`).eq("payload_hash", payloadHash).single(); if (found.error) throw new Error("IDENTITY_PROVENANCE_FAILED"); sourceRecordId = found.data.id }
      const conflict = await admin.from("security_identity_observations").select("provider_instrument_id").eq("security_id", body.securityId).eq("source_code", SOURCE_CODE).eq("evidence_status", "MATCHED").neq("provider_instrument_id", identity.stockId)
      if (conflict.error || (conflict.data ?? []).length) throw new Error("BLOCKED_IDENTITY_CONFLICT")
      const same = await admin.from("security_identity_observations").select("id").eq("security_id", body.securityId).eq("source_code", SOURCE_CODE).eq("evidence_status", "MATCHED").eq("provider_instrument_id", identity.stockId).maybeSingle()
      let localWrites = record.data?.id ? 1 : 0
      if (!same.data) { const inserted = await admin.from("security_identity_observations").insert({ security_id: body.securityId, source_record_id: sourceRecordId, source_code: SOURCE_CODE, provider_instrument_id: identity.stockId, observed_name: identity.name, observed_isin: identity.isin, observed_exchange: securityResult.data.exchange, observed_symbol: identity.symbol, observed_series: securityResult.data.series, evidence_status: "MATCHED", confidence: "1.0000", observed_at: new Date().toISOString() }); if (inserted.error) throw new Error("IDENTITY_PERSISTENCE_FAILED"); localWrites += 1 }
      await admin.rpc("settle_provider_budget_v1", { p_reservation_id: reservation.data[0].reservation_id, p_consumed_units: attempted, p_failed_units: 0, p_released_units: RESERVED_UNITS - attempted })
      await admin.rpc("record_refresh_item_result_v1", { p_run_item_id: item.data.id, p_status: "ACCEPTED", p_safe_reason_code: null, p_attempted_call_count: attempted, p_accepted_record_count: 1, p_metadata: { provider_instrument_id: identity.stockId, exact_symbol_isin_match: !bootstrapMissingIsin, missing_isin_bootstrap: bootstrapMissingIsin } })
      await admin.from("data_ingestion_runs").update({ status: "SUCCEEDED", completed_at: new Date().toISOString(), attempted_call_count: attempted, accepted_count: 1, fetched_count: 1, metadata: { security: securityResult.data.symbol, provider_instrument_id: identity.stockId } }).eq("id", run.data.id)
      return reply(200, { state: bootstrapMissingIsin ? "VERIFIED_WITH_MISSING_ISIN_BOOTSTRAP" : "VERIFIED_DURING_PREREQUISITE_DISCOVERY", providerInstrumentId: identity.stockId, providerCalls: attempted, localWrites: localWrites + (bootstrapMissingIsin ? 1 : 0), bootstrappedIsin: bootstrapMissingIsin ? identity.isin : null, runId: run.data.id })
    } catch (error) {
      const code = error instanceof Error ? error.message : "PROVIDER_REQUEST_FAILED"
      await admin.rpc("settle_provider_budget_v1", { p_reservation_id: reservation.data[0].reservation_id, p_consumed_units: 0, p_failed_units: attempted, p_released_units: RESERVED_UNITS - attempted })
      await admin.rpc("record_refresh_item_result_v1", { p_run_item_id: item.data.id, p_status: "FAILED", p_safe_reason_code: code, p_attempted_call_count: attempted, p_accepted_record_count: 0, p_metadata: {} })
      await admin.from("data_ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), attempted_call_count: attempted, failed_count: 1, error_summary: code }).eq("id", run.data.id)
      return reply(409, { error: "Trendlyne identity discovery failed safely.", code, providerCalls: attempted, localWrites: 0, runId: run.data.id })
    }
  } catch (error) { return reply(500, { error: "Trendlyne identity discovery failed safely.", code: error instanceof Error ? error.message : "PROVIDER_REQUEST_FAILED", providerCalls: 0 }) }
})
