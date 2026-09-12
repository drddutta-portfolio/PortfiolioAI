import { createClient } from "npm:@supabase/supabase-js@2.57.4"
import { extractText, getDocumentProxy } from "npm:unpdf@1.8.1"

const SOURCE_CODE = "COMPANY_EXCHANGE_FILING"
const DATA_DOMAIN = "NEWS"
const PARENT_RECORD_KIND = "NSE_NEWS_LINKED_DOCUMENT_PILOT_RESPONSE"
const OUTPUT_RECORD_KIND = "NSE_NEWS_LINKED_DOCUMENT_TEXT_EXTRACTION_PILOT"
const STORAGE_BUCKET = "news-source-documents"
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024
const MAX_PDF_PAGES = 12
const MAX_TEXT_CHARS = 20_000
const EXTRACTION_TIMEOUT_MS = 10_000
const MAX_IMAGE_SIZE = 16_777_216

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

type RequestBody = {
  readonly portfolioId?: unknown
  readonly newsItemId?: unknown
  readonly captureRecordId?: unknown
}

async function sha256Hex(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("")
}

function normalizeExtractedText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: number | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("TEXT_EXTRACTION_TIMEOUT")), timeoutMs)
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
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
    if (typeof body.portfolioId !== "string" || typeof body.newsItemId !== "string" || typeof body.captureRecordId !== "string") {
      return reply(400, { error: "portfolioId, newsItemId and captureRecordId are required." })
    }

    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session." })

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    const portfolio = await admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", auth.data.user.id).single()
    if (portfolio.error) return reply(404, { error: "Portfolio not found." })

    const news = await admin.from("news_items")
      .select("id,security_id,headline,is_active")
      .eq("id", body.newsItemId)
      .eq("is_active", true)
      .single()
    if (news.error) return reply(404, { error: "Active news item was not found." })

    const holding = await admin.from("current_holdings")
      .select("security_id,current_quantity")
      .eq("portfolio_id", body.portfolioId)
      .eq("security_id", news.data.security_id)
      .gt("current_quantity", 0)
      .maybeSingle()
    if (holding.error || !holding.data) return reply(403, { error: "News item security must be a current open holding." })

    const security = await admin.from("securities")
      .select("id,symbol,name,asset_class")
      .eq("id", news.data.security_id)
      .single()
    if (security.error || security.data.asset_class !== "EQUITY") return reply(400, { error: "N4C.2 is limited to held equities." })

    const policy = await admin.from("refresh_domain_policies")
      .select("policy_version,is_enabled,definition")
      .eq("source_code", SOURCE_CODE)
      .eq("data_domain", DATA_DOMAIN)
      .is("effective_to", null)
      .single()
    const definition = policy.data?.definition as Record<string, unknown> | undefined
    if (
      policy.error || !policy.data?.is_enabled ||
      definition?.mode !== "OWNER_CONTROLLED_STORED_NSE_DOCUMENT_TEXT_EXTRACTION_PILOT_ONLY" ||
      definition?.scheduler_allowed !== false ||
      definition?.external_fetches_allowed !== false ||
      definition?.normalization_enabled !== false ||
      definition?.linked_document_capture_enabled !== false ||
      definition?.linked_document_parsing_enabled !== true ||
      definition?.supported_content_type !== "application/pdf" ||
      definition?.max_document_bytes !== MAX_DOCUMENT_BYTES ||
      definition?.max_pdf_pages !== MAX_PDF_PAGES ||
      definition?.max_extracted_text_chars !== MAX_TEXT_CHARS ||
      definition?.text_extraction_timeout_ms !== EXTRACTION_TIMEOUT_MS ||
      definition?.ocr_enabled !== false ||
      definition?.ai_enabled !== false
    ) {
      return reply(409, { error: "Reviewed N4C.2 extraction policy is not active.", externalFetches: 0 })
    }

    const capture = await admin.from("data_source_records")
      .select("id,source_code,record_kind,source_url,payload_hash,raw_payload")
      .eq("id", body.captureRecordId)
      .eq("source_code", SOURCE_CODE)
      .eq("record_kind", PARENT_RECORD_KIND)
      .single()
    if (capture.error) return reply(404, { error: "Reviewed N4C.1 linked-document capture was not found.", externalFetches: 0 })

    const raw = capture.data.raw_payload as Record<string, unknown>
    if (raw.news_item_id !== body.newsItemId || raw.storage_bucket !== STORAGE_BUCKET) {
      return reply(409, { error: "Stored-document lineage does not match the requested news item.", externalFetches: 0 })
    }
    if (raw.content_type !== "application/pdf") return reply(409, { error: "N4C.2 pilot supports PDF captures only.", externalFetches: 0 })
    if (typeof raw.storage_object_path !== "string" || typeof raw.document_sha256 !== "string") {
      return reply(409, { error: "Stored-document capture metadata is incomplete.", externalFetches: 0 })
    }
    if (raw.document_sha256 !== capture.data.payload_hash) {
      return reply(409, { error: "Stored-document capture hash lineage is inconsistent.", externalFetches: 0 })
    }

    const run = await admin.from("data_ingestion_runs").insert({
      source_code: SOURCE_CODE,
      portfolio_id: body.portfolioId,
      operation: "NEWS_LINKED_DOCUMENT_TEXT_EXTRACTION_PILOT",
      orchestration_type: "NEWS_LINKED_DOCUMENT_TEXT_EXTRACTION_PILOT",
      trigger_source: "PILOT",
      requested_by: auth.data.user.id,
      status: "RUNNING",
      requested_count: 1,
      estimated_call_count: 0,
      reserved_call_count: 0,
      attempted_call_count: 0,
      policy_version: policy.data.policy_version,
      metadata: {
        stage: "N4C2",
        mode: "STORED_NSE_DOCUMENT_TEXT_EXTRACTION_PILOT_ONLY",
        news_item_id: news.data.id,
        parent_capture_record_id: capture.data.id,
        target_symbol: security.data.symbol,
        external_fetches: 0,
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
        stage: "N4C2",
        mode: "STORED_NSE_DOCUMENT_TEXT_EXTRACTION_PILOT_ONLY",
        news_item_id: news.data.id,
        parent_capture_record_id: capture.data.id,
      },
    }).select("id").single()
    if (runItem.error) throw new Error("RUN_ITEM_ACCOUNTING_FAILED")
    const runItemId = runItem.data.id as string

    let safeErrorCode: string | null = null
    let pageCount: number | null = null
    let persistedText = ""
    let extractedCharCount = 0
    let truncated = false
    let outputRecordId: string | null = null
    let outputHash: string | null = null

    try {
      const stored = await admin.storage.from(STORAGE_BUCKET).download(raw.storage_object_path)
      if (stored.error || !stored.data) throw new Error("STORED_DOCUMENT_DOWNLOAD_FAILED")
      const bytes = new Uint8Array(await stored.data.arrayBuffer())
      if (bytes.byteLength === 0 || bytes.byteLength > MAX_DOCUMENT_BYTES) throw new Error("STORED_DOCUMENT_SIZE_REJECTED")

      const verifiedHash = await sha256Hex(bytes)
      if (verifiedHash !== raw.document_sha256) throw new Error("STORED_DOCUMENT_HASH_MISMATCH")

      const pdf = await getDocumentProxy(bytes, { maxImageSize: MAX_IMAGE_SIZE })
      pageCount = pdf.numPages
      if (pageCount < 1 || pageCount > MAX_PDF_PAGES) throw new Error("PDF_PAGE_LIMIT_REJECTED")

      const extracted = await withTimeout(extractText(pdf, { mergePages: true }), EXTRACTION_TIMEOUT_MS)
      const normalized = normalizeExtractedText(typeof extracted.text === "string" ? extracted.text : extracted.text.join("\n\n"))
      if (!normalized) throw new Error("PDF_TEXT_EMPTY")
      extractedCharCount = normalized.length
      truncated = extractedCharCount > MAX_TEXT_CHARS
      persistedText = normalized.slice(0, MAX_TEXT_CHARS)
      outputHash = await sha256Hex(new TextEncoder().encode(persistedText))

      const derived = await admin.from("data_source_records").insert({
        source_code: SOURCE_CODE,
        ingestion_run_id: runId,
        record_kind: OUTPUT_RECORD_KIND,
        external_record_id: `NSE:LINKED_DOCUMENT_TEXT:${news.data.id}:${capture.data.id}:${runId}`,
        source_url: capture.data.source_url,
        retrieved_at: new Date().toISOString(),
        payload_hash: outputHash,
        raw_payload: {
          stage: "N4C2",
          mode: "STORED_NSE_DOCUMENT_TEXT_EXTRACTION_PILOT_ONLY",
          news_item_id: news.data.id,
          security_id: news.data.security_id,
          symbol: security.data.symbol,
          parent_capture_record_id: capture.data.id,
          storage_bucket: STORAGE_BUCKET,
          storage_object_path: raw.storage_object_path,
          verified_document_sha256: raw.document_sha256,
          content_type: raw.content_type,
          page_count: pageCount,
          extracted_char_count: extractedCharCount,
          persisted_char_count: persistedText.length,
          text_truncated: truncated,
          extraction_method: "unpdf-serverless",
          extraction_package: "unpdf@1.8.1",
          extracted_text: persistedText,
        },
        terms_snapshot: {
          stage: "N4C2",
          source_fetches: 0,
          storage_reads: 1,
          normalized_news_writes: 0,
          ocr_enabled: false,
          ai_enabled: false,
          scheduler_enabled: false,
        },
      }).select("id").single()
      if (derived.error) throw new Error("TEXT_CAPTURE_PERSISTENCE_FAILED")
      outputRecordId = derived.data.id as string
    } catch (error) {
      safeErrorCode = error instanceof Error ? error.message : "TEXT_EXTRACTION_FAILED"
    }

    const itemResult = await admin.rpc("record_refresh_item_result_v1", {
      p_run_item_id: runItemId,
      p_status: safeErrorCode ? "FAILED" : "ACCEPTED",
      p_safe_reason_code: safeErrorCode,
      p_attempted_call_count: 0,
      p_accepted_record_count: safeErrorCode ? 0 : 1,
      p_metadata: {
        stage: "N4C2",
        mode: "STORED_NSE_DOCUMENT_TEXT_EXTRACTION_PILOT_ONLY",
        news_item_id: news.data.id,
        parent_capture_record_id: capture.data.id,
        external_fetches: 0,
        linked_document_fetches: 0,
        storage_reads: 1,
        page_count: pageCount,
        extracted_char_count: extractedCharCount,
        text_truncated: truncated,
        output_record_id: outputRecordId,
        normalized_news_writes: 0,
      },
    })
    if (itemResult.error && !safeErrorCode) safeErrorCode = "RUN_ITEM_ACCOUNTING_FAILED"

    const completed = await admin.from("data_ingestion_runs").update({
      status: safeErrorCode ? "FAILED" : "SUCCEEDED",
      completed_at: new Date().toISOString(),
      attempted_call_count: 0,
      fetched_count: 0,
      accepted_count: outputRecordId && !safeErrorCode ? 1 : 0,
      failed_count: safeErrorCode ? 1 : 0,
      skipped_count: 0,
      error_summary: safeErrorCode,
      metadata: {
        stage: "N4C2",
        mode: "STORED_NSE_DOCUMENT_TEXT_EXTRACTION_PILOT_ONLY",
        news_item_id: news.data.id,
        parent_capture_record_id: capture.data.id,
        target_symbol: security.data.symbol,
        external_fetches: 0,
        linked_document_fetches: 0,
        storage_reads: 1,
        page_count: pageCount,
        extracted_char_count: extractedCharCount,
        persisted_char_count: persistedText.length,
        text_truncated: truncated,
        output_record_id: outputRecordId,
        output_payload_hash: outputHash,
        normalized_news_writes: 0,
        ai_enabled: false,
        scheduler_enabled: false,
      },
    }).eq("id", runId)
    if (completed.error && !safeErrorCode) safeErrorCode = "RUN_ACCOUNTING_FAILED"

    if (safeErrorCode) {
      return reply(502, {
        error: "Stored NSE document text extraction failed safely.",
        code: safeErrorCode,
        runId,
        newsItemId: news.data.id,
        security: security.data.symbol,
        externalFetches: 0,
        normalizedNewsWrites: 0,
      })
    }

    return reply(200, {
      mode: "STORED_NSE_DOCUMENT_TEXT_EXTRACTION_PILOT_ONLY",
      runId,
      newsItemId: news.data.id,
      security: security.data.symbol,
      parentCaptureRecordId: capture.data.id,
      outputRecordId,
      pageCount,
      extractedCharCount,
      persistedCharCount: persistedText.length,
      textTruncated: truncated,
      textPreview: persistedText.slice(0, 1800),
      extractionMethod: "unpdf-serverless",
      extractionPackage: "unpdf@1.8.1",
      externalFetches: 0,
      linkedDocumentFetches: 0,
      normalizedNewsWrites: 0,
      aiEnabled: false,
      schedulerEnabled: false,
      note: "N4C.2 extracted text from the already stored official NSE PDF only. No news mutation was performed.",
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : "STORED_NSE_DOCUMENT_TEXT_EXTRACTION_PILOT_FAILED"
    return reply(502, { error: "Stored NSE document text extraction failed safely.", code, externalFetches: 0 })
  }
})