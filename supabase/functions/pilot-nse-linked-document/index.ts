import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SOURCE_CODE = "COMPANY_EXCHANGE_FILING"
const DATA_DOMAIN = "NEWS"
const RECORD_KIND = "NSE_NEWS_LINKED_DOCUMENT_PILOT_RESPONSE"
const STORAGE_BUCKET = "news-source-documents"
const ALLOWED_HOST = "nsearchives.nseindia.com"
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 15_000

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

type RequestBody = {
  readonly portfolioId?: unknown
  readonly newsItemId?: unknown
}

async function sha256Hex(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("")
}

function normalizeContentType(value: string | null): string | null {
  if (!value) return null
  return value.split(";", 1)[0].trim().toLowerCase() || null
}

function extensionForContentType(contentType: string): string | null {
  if (contentType === "application/pdf") return "pdf"
  if (contentType === "application/xml" || contentType === "text/xml") return "xml"
  return null
}

function validateOfficialNseUrl(value: string): URL | null {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== "https:") return null
    if (parsed.hostname !== ALLOWED_HOST) return null
    if (parsed.username || parsed.password) return null
    return parsed
  } catch {
    return null
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
  if (!supabaseUrl || !anonKey || !serviceKey) return reply(500, { error: "Server configuration is incomplete." })

  try {
    const body = await request.json() as RequestBody
    if (typeof body.portfolioId !== "string" || typeof body.newsItemId !== "string") {
      return reply(400, { error: "portfolioId and newsItemId are required." })
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

    const news = await admin.from("news_items")
      .select("id,security_id,headline,primary_source_url,is_active")
      .eq("id", body.newsItemId)
      .eq("is_active", true)
      .single()
    if (news.error || !news.data.primary_source_url) {
      return reply(404, { error: "Active news item with an official source URL was not found.", externalFetches: 0 })
    }

    const holding = await admin.from("current_holdings")
      .select("security_id,current_quantity")
      .eq("portfolio_id", body.portfolioId)
      .eq("security_id", news.data.security_id)
      .gt("current_quantity", 0)
      .maybeSingle()
    if (holding.error || !holding.data) return reply(403, { error: "News item security must be a current open holding.", externalFetches: 0 })

    const security = await admin.from("securities")
      .select("id,symbol,name,asset_class")
      .eq("id", news.data.security_id)
      .single()
    if (security.error || security.data.asset_class !== "EQUITY") {
      return reply(400, { error: "N4C is limited to held equities.", externalFetches: 0 })
    }

    const sourceUrl = validateOfficialNseUrl(news.data.primary_source_url)
    if (!sourceUrl) return reply(409, { error: "News source URL is outside the reviewed NSE archive allow-list.", externalFetches: 0 })

    const policy = await admin.from("refresh_domain_policies")
      .select("policy_version,is_enabled,definition")
      .eq("source_code", SOURCE_CODE)
      .eq("data_domain", DATA_DOMAIN)
      .is("effective_to", null)
      .single()
    const definition = policy.data?.definition as Record<string, unknown> | undefined
    if (
      policy.error ||
      !policy.data?.is_enabled ||
      definition?.mode !== "OWNER_CONTROLLED_NSE_LINKED_DOCUMENT_CAPTURE_PILOT_ONLY" ||
      definition?.scheduler_allowed !== false ||
      definition?.external_fetches_allowed !== true ||
      definition?.max_external_fetches_per_pilot !== 1 ||
      definition?.normalization_enabled !== false ||
      definition?.linked_document_capture_enabled !== true ||
      definition?.linked_document_parsing_enabled !== false ||
      definition?.ai_enabled !== false ||
      definition?.allowed_host !== ALLOWED_HOST ||
      definition?.redirects_allowed !== false ||
      definition?.max_document_bytes !== MAX_DOCUMENT_BYTES
    ) {
      return reply(409, { error: "Reviewed N4C linked-document capture policy is not active.", externalFetches: 0 })
    }

    const run = await admin.from("data_ingestion_runs").insert({
      source_code: SOURCE_CODE,
      portfolio_id: body.portfolioId,
      operation: "NEWS_LINKED_DOCUMENT_PILOT",
      orchestration_type: "NEWS_LINKED_DOCUMENT_PILOT",
      trigger_source: "PILOT",
      requested_by: auth.data.user.id,
      status: "RUNNING",
      requested_count: 1,
      estimated_call_count: 1,
      reserved_call_count: 0,
      attempted_call_count: 0,
      policy_version: policy.data.policy_version,
      metadata: {
        stage: "N4C",
        mode: "NSE_LINKED_DOCUMENT_CAPTURE_PILOT_ONLY",
        news_item_id: news.data.id,
        target_symbol: security.data.symbol,
        source_url: sourceUrl.toString(),
        external_fetch_limit: 1,
        linked_document_parsing_enabled: false,
        scheduler_enabled: false,
        ai_enabled: false,
      },
    }).select("id").single()
    if (run.error) throw new Error("RUN_ACCOUNTING_FAILED")
    const runId = run.data.id as string

    const runItem = await admin.from("data_ingestion_run_items").insert({
      ingestion_run_id: runId,
      security_id: news.data.security_id,
      data_domain: DATA_DOMAIN,
      status: "PLANNED",
      metadata: {
        stage: "N4C",
        mode: "NSE_LINKED_DOCUMENT_CAPTURE_PILOT_ONLY",
        news_item_id: news.data.id,
        target_symbol: security.data.symbol,
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

    let responseStatus: number | null = null
    let responseContentType: string | null = null
    let documentBytes: Uint8Array | null = null
    let documentHash: string | null = null
    let storageObjectPath: string | null = null
    let captureRecordId: string | null = null
    let safeErrorCode: string | null = null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const response = await fetch(sourceUrl.toString(), {
        method: "GET",
        redirect: "manual",
        headers: {
          "Accept": "application/pdf, application/xml, text/xml;q=0.9, */*;q=0.1",
          "User-Agent": "PortfolioAI/1.0 (+personal portfolio research; official NSE linked-document pilot)",
        },
        signal: controller.signal,
      })
      responseStatus = response.status
      responseContentType = normalizeContentType(response.headers.get("content-type"))

      if (response.status >= 300 && response.status < 400) {
        safeErrorCode = "NSE_LINKED_DOCUMENT_REDIRECT_REJECTED"
      } else if (!response.ok) {
        safeErrorCode = `NSE_LINKED_DOCUMENT_HTTP_${response.status}`
      } else if (!responseContentType || !extensionForContentType(responseContentType)) {
        safeErrorCode = "NSE_LINKED_DOCUMENT_CONTENT_TYPE_REJECTED"
      } else {
        const contentLength = response.headers.get("content-length")
        if (contentLength && Number(contentLength) > MAX_DOCUMENT_BYTES) {
          safeErrorCode = "NSE_LINKED_DOCUMENT_TOO_LARGE"
        } else {
          const bytes = new Uint8Array(await response.arrayBuffer())
          if (bytes.byteLength === 0) safeErrorCode = "NSE_LINKED_DOCUMENT_EMPTY_RESPONSE"
          else if (bytes.byteLength > MAX_DOCUMENT_BYTES) safeErrorCode = "NSE_LINKED_DOCUMENT_TOO_LARGE"
          else documentBytes = bytes
        }
      }
    } catch (error) {
      safeErrorCode = error instanceof DOMException && error.name === "AbortError"
        ? "NSE_LINKED_DOCUMENT_TIMEOUT"
        : "NSE_LINKED_DOCUMENT_NETWORK_ERROR"
    } finally {
      clearTimeout(timeout)
    }

    if (!safeErrorCode && documentBytes && responseContentType) {
      documentHash = await sha256Hex(documentBytes)
      const extension = extensionForContentType(responseContentType)
      if (!extension) safeErrorCode = "NSE_LINKED_DOCUMENT_CONTENT_TYPE_REJECTED"
      else {
        storageObjectPath = `${news.data.id}/${runId}.${extension}`
        const upload = await admin.storage.from(STORAGE_BUCKET).upload(storageObjectPath, documentBytes, {
          contentType: responseContentType,
          upsert: false,
        })
        if (upload.error) safeErrorCode = "NSE_LINKED_DOCUMENT_STORAGE_FAILED"
      }
    }

    if (!safeErrorCode && documentBytes && documentHash && storageObjectPath && responseContentType) {
      const rawPayload = {
        stage: "N4C",
        mode: "NSE_LINKED_DOCUMENT_CAPTURE_PILOT_ONLY",
        run_id: runId,
        news_item_id: news.data.id,
        security_id: news.data.security_id,
        symbol: security.data.symbol,
        source_url: sourceUrl.toString(),
        storage_bucket: STORAGE_BUCKET,
        storage_object_path: storageObjectPath,
        http_status: responseStatus,
        content_type: responseContentType,
        byte_length: documentBytes.byteLength,
        document_sha256: documentHash,
      }
      const capture = await admin.from("data_source_records").insert({
        source_code: SOURCE_CODE,
        ingestion_run_id: runId,
        record_kind: RECORD_KIND,
        external_record_id: `NSE:LINKED_DOCUMENT:${news.data.id}:${runId}`,
        source_url: sourceUrl.toString(),
        retrieved_at: new Date().toISOString(),
        payload_hash: documentHash,
        raw_payload: rawPayload,
        terms_snapshot: {
          stage: "N4C",
          mode: "NSE_LINKED_DOCUMENT_CAPTURE_PILOT_ONLY",
          capture_only: true,
          linked_document_fetches: 1,
          linked_document_parsing_enabled: false,
          normalized_news_writes: 0,
          tone_classification_enabled: false,
          importance_classification_enabled: false,
          ai_enabled: false,
          scheduler_enabled: false,
        },
      }).select("id").single()
      if (capture.error) safeErrorCode = "CAPTURE_PERSISTENCE_FAILED"
      else captureRecordId = capture.data.id as string
    }

    const itemResult = await admin.rpc("record_refresh_item_result_v1", {
      p_run_item_id: runItemId,
      p_status: safeErrorCode ? "FAILED" : "ACCEPTED",
      p_safe_reason_code: safeErrorCode,
      p_attempted_call_count: 1,
      p_accepted_record_count: safeErrorCode ? 0 : 1,
      p_metadata: {
        stage: "N4C",
        mode: "NSE_LINKED_DOCUMENT_CAPTURE_PILOT_ONLY",
        news_item_id: news.data.id,
        target_symbol: security.data.symbol,
        external_fetches: 1,
        linked_document_fetches: 1,
        linked_document_parsing_enabled: false,
        normalized_news_writes: 0,
        storage_object_path: storageObjectPath,
        document_sha256: documentHash,
      },
    })
    if (itemResult.error && !safeErrorCode) safeErrorCode = "RUN_ITEM_ACCOUNTING_FAILED"

    const completed = await admin.from("data_ingestion_runs").update({
      status: safeErrorCode ? "FAILED" : "SUCCEEDED",
      completed_at: new Date().toISOString(),
      attempted_call_count: 1,
      fetched_count: documentBytes !== null && !safeErrorCode ? 1 : 0,
      accepted_count: captureRecordId && !safeErrorCode ? 1 : 0,
      failed_count: safeErrorCode ? 1 : 0,
      skipped_count: 0,
      error_summary: safeErrorCode,
      metadata: {
        stage: "N4C",
        mode: "NSE_LINKED_DOCUMENT_CAPTURE_PILOT_ONLY",
        news_item_id: news.data.id,
        target_symbol: security.data.symbol,
        source_url: sourceUrl.toString(),
        external_fetches: 1,
        linked_document_fetches: 1,
        http_status: responseStatus,
        content_type: responseContentType,
        byte_length: documentBytes?.byteLength ?? null,
        document_sha256: documentHash,
        storage_bucket: storageObjectPath ? STORAGE_BUCKET : null,
        storage_object_path: storageObjectPath,
        capture_record_id: captureRecordId,
        linked_document_parsing_enabled: false,
        normalized_news_writes: 0,
        ai_enabled: false,
        scheduler_enabled: false,
      },
    }).eq("id", runId)
    if (completed.error && !safeErrorCode) safeErrorCode = "RUN_ACCOUNTING_FAILED"

    if (safeErrorCode) {
      return reply(502, {
        error: "NSE linked-document pilot failed safely.",
        code: safeErrorCode,
        runId,
        newsItemId: news.data.id,
        security: security.data.symbol,
        externalFetches: 1,
        linkedDocumentFetches: 1,
        normalizedNewsWrites: 0,
      })
    }

    return reply(200, {
      mode: "NSE_LINKED_DOCUMENT_CAPTURE_PILOT_ONLY",
      runId,
      newsItemId: news.data.id,
      security: security.data.symbol,
      sourceUrl: sourceUrl.toString(),
      httpStatus: responseStatus,
      contentType: responseContentType,
      byteLength: documentBytes?.byteLength ?? null,
      documentSha256: documentHash,
      storageBucket: STORAGE_BUCKET,
      storageObjectPath,
      captureRecordId,
      externalFetches: 1,
      linkedDocumentFetches: 1,
      linkedDocumentParsingEnabled: false,
      normalizedNewsWrites: 0,
      toneClassificationEnabled: false,
      importanceClassificationEnabled: false,
      aiEnabled: false,
      schedulerEnabled: false,
      note: "N4C capture-only pilot. Review the stored official document before introducing any parser or news mutation.",
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : "NSE_LINKED_DOCUMENT_PILOT_FAILED"
    return reply(502, { error: "NSE linked-document pilot failed safely.", code, externalFetches: 0 })
  }
})
