import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SOURCE_CODE = "COMPANY_EXCHANGE_FILING"
const DATA_DOMAIN = "NEWS"
const RECORD_KIND = "NSE_NEWS_RSS_PILOT_RESPONSE"
const FEED_URL = "https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml"
const MAX_CAPTURE_BYTES = 1024 * 1024
const FETCH_TIMEOUT_MS = 15_000

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

type RequestBody = { readonly portfolioId?: unknown; readonly securityId?: unknown }

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("")
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." })

  const authorization = request.headers.get("Authorization")
  if (!authorization) return reply(401, { error: "Authentication required." })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return reply(500, { error: "Server configuration is incomplete." })
  }

  try {
    const body = await request.json() as RequestBody
    if (typeof body.portfolioId !== "string" || typeof body.securityId !== "string") {
      return reply(400, { error: "portfolioId and securityId are required." })
    }

    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session." })

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    const portfolio = await admin.from("portfolios")
      .select("id")
      .eq("id", body.portfolioId)
      .eq("user_id", auth.data.user.id)
      .single()
    if (portfolio.error) return reply(404, { error: "Portfolio not found." })

    const holding = await admin.from("current_holdings")
      .select("security_id,current_quantity")
      .eq("portfolio_id", body.portfolioId)
      .eq("security_id", body.securityId)
      .gt("current_quantity", 0)
      .maybeSingle()
    if (holding.error || !holding.data) return reply(403, { error: "Security must be a current open holding." })

    const security = await admin.from("securities")
      .select("id,symbol,name,asset_class")
      .eq("id", body.securityId)
      .single()
    if (security.error || security.data.asset_class !== "EQUITY") {
      return reply(400, { error: "The N3C exchange-news pilot is limited to held equities." })
    }

    const source = await admin.from("data_sources")
      .select("is_active,entitlement_verified,retention_rights_verified,capabilities")
      .eq("code", SOURCE_CODE)
      .single()
    if (source.error || !source.data.is_active || !source.data.entitlement_verified || !source.data.retention_rights_verified) {
      return reply(409, { error: "Primary filing source configuration is incomplete.", externalFetches: 0 })
    }

    const newsPolicy = await admin.from("refresh_domain_policies")
      .select("policy_version,is_enabled,definition")
      .eq("source_code", SOURCE_CODE)
      .eq("data_domain", DATA_DOMAIN)
      .is("effective_to", null)
      .single()
    if (newsPolicy.error || !newsPolicy.data.is_enabled) {
      return reply(409, { error: "Reviewed official-exchange NEWS pilot policy is not active.", externalFetches: 0 })
    }

    const definition = newsPolicy.data.definition as Record<string, unknown> | null
    if (definition?.mode !== "OWNER_CONTROLLED_NSE_RSS_PILOT_ONLY" || definition?.scheduler_allowed !== false || definition?.normalization_enabled !== false) {
      return reply(409, { error: "N3C policy is not in capture-only pilot mode.", externalFetches: 0 })
    }

    const run = await admin.from("data_ingestion_runs").insert({
      source_code: SOURCE_CODE,
      portfolio_id: body.portfolioId,
      operation: "NEWS_RSS_PILOT",
      orchestration_type: "NEWS_RSS_PILOT",
      trigger_source: "PILOT",
      requested_by: auth.data.user.id,
      status: "RUNNING",
      requested_count: 1,
      estimated_call_count: 1,
      reserved_call_count: 0,
      attempted_call_count: 0,
      policy_version: newsPolicy.data.policy_version,
      metadata: {
        stage: "N3C",
        mode: "NSE_RSS_CONTRACT_PILOT_ONLY",
        transport: "NSE_RSS",
        feed: "CORPORATE_ANNOUNCEMENTS",
        feed_url: FEED_URL,
        normalization_enabled: false,
        tone_classification_enabled: false,
        scheduler_enabled: false,
      },
    }).select("id").single()
    if (run.error) throw new Error("RUN_ACCOUNTING_FAILED")
    const runId = run.data.id as string

    const runItem = await admin.from("data_ingestion_run_items").insert({
      ingestion_run_id: runId,
      security_id: body.securityId,
      data_domain: DATA_DOMAIN,
      status: "PLANNED",
      metadata: {
        stage: "N3C",
        mode: "NSE_RSS_CONTRACT_PILOT_ONLY",
        target_symbol: security.data.symbol,
        feed: "CORPORATE_ANNOUNCEMENTS",
      },
    }).select("id").single()
    if (runItem.error) {
      await admin.from("data_ingestion_runs").update({
        status: "FAILED",
        completed_at: new Date().toISOString(),
        error_summary: "RUN_ITEM_ACCOUNTING_FAILED",
      }).eq("id", runId)
      throw new Error("RUN_ITEM_ACCOUNTING_FAILED")
    }
    const runItemId = runItem.data.id as string

    const attemptedAt = new Date().toISOString()
    let responseStatus: number | null = null
    let responseContentType: string | null = null
    let rawXml: string | null = null
    let safeErrorCode: string | null = null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const response = await fetch(FEED_URL, {
        method: "GET",
        headers: {
          "Accept": "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
          "User-Agent": "PortfolioAI/1.0 (+personal portfolio research; official NSE RSS pilot)",
        },
        signal: controller.signal,
      })
      responseStatus = response.status
      responseContentType = response.headers.get("content-type")
      if (!response.ok) {
        safeErrorCode = `NSE_RSS_HTTP_${response.status}`
      } else {
        const text = await response.text()
        const size = new TextEncoder().encode(text).byteLength
        if (size > MAX_CAPTURE_BYTES) safeErrorCode = "NSE_RSS_CAPTURE_TOO_LARGE"
        else if (!text.trim()) safeErrorCode = "NSE_RSS_EMPTY_RESPONSE"
        else rawXml = text
      }
    } catch (error) {
      safeErrorCode = error instanceof DOMException && error.name === "AbortError" ? "NSE_RSS_TIMEOUT" : "NSE_RSS_NETWORK_ERROR"
    } finally {
      clearTimeout(timeout)
    }

    let capturePayloadHash: string | null = null
    if (!safeErrorCode && rawXml !== null) {
      const rawPayload = {
        stage: "N3C",
        mode: "NSE_RSS_CONTRACT_PILOT_ONLY",
        run_id: runId,
        target_security_id: body.securityId,
        target_symbol: security.data.symbol,
        target_company: security.data.name,
        exchange: "NSE",
        transport: "NSE_RSS",
        feed: "CORPORATE_ANNOUNCEMENTS",
        feed_url: FEED_URL,
        http_status: responseStatus,
        content_type: responseContentType,
        xml: rawXml,
      }
      const serialized = JSON.stringify(rawPayload)
      capturePayloadHash = await sha256Hex(serialized)
      const capture = await admin.from("data_source_records").insert({
        source_code: SOURCE_CODE,
        ingestion_run_id: runId,
        record_kind: RECORD_KIND,
        external_record_id: `NSE:CORPORATE_ANNOUNCEMENTS:${runId}`,
        source_url: FEED_URL,
        retrieved_at: new Date().toISOString(),
        payload_hash: capturePayloadHash,
        raw_payload: rawPayload,
        terms_snapshot: {
          stage: "N3C",
          mode: "NSE_RSS_CONTRACT_PILOT_ONLY",
          exchange: "NSE",
          transport: "NSE_RSS",
          feed: "CORPORATE_ANNOUNCEMENTS",
          normalization_enabled: false,
          normalized_news_writes: 0,
          tone_classification_enabled: false,
          parser_contract_promoted: false,
          linked_document_fetches: 0,
        },
      })
      if (capture.error) safeErrorCode = "CAPTURE_PERSISTENCE_FAILED"
    }

    const itemResult = await admin.rpc("record_refresh_item_result_v1", {
      p_run_item_id: runItemId,
      p_status: safeErrorCode ? "FAILED" : "ACCEPTED",
      p_safe_reason_code: safeErrorCode,
      p_attempted_call_count: 1,
      p_accepted_record_count: 0,
      p_metadata: {
        stage: "N3C",
        mode: "NSE_RSS_CONTRACT_PILOT_ONLY",
        target_symbol: security.data.symbol,
        external_fetches: 1,
        normalization_enabled: false,
        normalized_news_writes: 0,
        tone_classification_enabled: false,
        parser_contract_promoted: false,
        linked_document_fetches: 0,
      },
    })
    if (itemResult.error && !safeErrorCode) safeErrorCode = "RUN_ITEM_ACCOUNTING_FAILED"

    const completed = await admin.from("data_ingestion_runs").update({
      status: safeErrorCode ? "FAILED" : "SUCCEEDED",
      completed_at: new Date().toISOString(),
      attempted_call_count: 1,
      fetched_count: rawXml !== null && !safeErrorCode ? 1 : 0,
      accepted_count: 0,
      failed_count: safeErrorCode ? 1 : 0,
      skipped_count: 0,
      error_summary: safeErrorCode,
      metadata: {
        stage: "N3C",
        mode: "NSE_RSS_CONTRACT_PILOT_ONLY",
        transport: "NSE_RSS",
        feed: "CORPORATE_ANNOUNCEMENTS",
        feed_url: FEED_URL,
        external_fetches: 1,
        http_status: responseStatus,
        content_type: responseContentType,
        normalized_news_writes: 0,
        tone_classification_enabled: false,
        parser_contract_promoted: false,
        linked_document_fetches: 0,
        capture_record_kind: capturePayloadHash ? RECORD_KIND : null,
        capture_payload_hash: capturePayloadHash,
      },
    }).eq("id", runId)
    if (completed.error && !safeErrorCode) safeErrorCode = "RUN_ACCOUNTING_FAILED"

    if (safeErrorCode) {
      return reply(502, {
        error: "NSE RSS pilot failed safely.",
        code: safeErrorCode,
        runId,
        targetSymbol: security.data.symbol,
        externalFetches: 1,
        normalizedNewsWrites: 0,
        parserContractPromoted: false,
      })
    }

    return reply(200, {
      mode: "NSE_RSS_CONTRACT_PILOT_ONLY",
      targetSecurity: security.data.symbol,
      sourceCode: SOURCE_CODE,
      exchange: "NSE",
      transport: "NSE_RSS",
      feed: "CORPORATE_ANNOUNCEMENTS",
      feedUrl: FEED_URL,
      externalFetches: 1,
      httpStatus: responseStatus,
      contentType: responseContentType,
      captureRecorded: true,
      capturePayloadHash,
      normalizedNewsWrites: 0,
      toneClassificationEnabled: false,
      parserContractPromoted: false,
      linkedDocumentFetches: 0,
      schedulerEnabled: false,
      runId,
      note: "N3C raw exchange-feed evidence only. Review the captured XML before promoting a parser or normalized news writes.",
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : "NSE_RSS_PILOT_FAILED"
    return reply(502, { error: "NSE RSS pilot failed safely.", code })
  }
})
