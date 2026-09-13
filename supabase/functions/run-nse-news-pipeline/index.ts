import { createClient } from "npm:@supabase/supabase-js@2.57.4"
import { extractText, getDocumentProxy } from "npm:unpdf@1.8.1"
import {
  buildHeadline,
  importanceFromItem,
  normalizeCompanyName,
  parseNseCorporateAnnouncements,
  toneFromItem,
  type ParsedNseNewsItem,
} from "../_shared/nse-news-parser.ts"

const SOURCE_CODE = "COMPANY_EXCHANGE_FILING"
const DATA_DOMAIN = "NEWS"
const POLICY_MODE = "AUTOMATED_NSE_NEWS_PIPELINE"
const FEED_URL = "https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml"
const ALLOWED_HOST = "nsearchives.nseindia.com"
const STORAGE_BUCKET = "news-source-documents"
const FEED_RECORD_KIND = "NSE_NEWS_RSS_RESPONSE"
const DOCUMENT_RECORD_KIND = "NSE_NEWS_LINKED_DOCUMENT"
const PILOT_DOCUMENT_RECORD_KIND = "NSE_NEWS_LINKED_DOCUMENT_PILOT_RESPONSE"
const TEXT_RECORD_KIND = "NSE_NEWS_LINKED_DOCUMENT_TEXT_EXTRACTION"
const PILOT_TEXT_RECORD_KIND = "NSE_NEWS_LINKED_DOCUMENT_TEXT_EXTRACTION_PILOT"
const PARSER_VERSION = "nse-rss-v1"
const CLASSIFIER_VERSION = "nse-importance-tone-v1"
const EXTRACTION_VERSION = "unpdf@1.8.1"
const MAX_FEED_BYTES = 1024 * 1024
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024
const MAX_LINKED_DOCUMENT_FETCHES = 3
const MAX_MATCHED_ITEMS = 100
const MAX_PDF_PAGES = 12
const MAX_TEXT_CHARS = 20_000
const FETCH_TIMEOUT_MS = 15_000
const EXTRACTION_TIMEOUT_MS = 10_000
const MAX_IMAGE_SIZE = 16_777_216
const LEASE_SECONDS = 240
const LEASE_COOLDOWN_SECONDS = 30

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-portfolioai-scheduler-token",
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

type Action = "DRY_RUN" | "RUN" | "SCHEDULED_RUN"
type RequestBody = { readonly action?: unknown; readonly portfolioId?: unknown }
type Admin = ReturnType<typeof createClient>

type HeldSecurity = {
  readonly id: string
  readonly symbol: string
  readonly name: string
  readonly tradingSymbol: string
  readonly aliases: ReadonlySet<string>
}

type MatchedItem = {
  readonly security: HeldSecurity
  readonly item: ParsedNseNewsItem
}

type PolicyDefinition = {
  readonly mode?: unknown
  readonly dry_run_allowed?: unknown
  readonly manual_run_allowed?: unknown
  readonly scheduler_allowed?: unknown
  readonly external_fetches_allowed?: unknown
  readonly normalization_enabled?: unknown
  readonly linked_document_capture_enabled?: unknown
  readonly linked_document_parsing_enabled?: unknown
  readonly deterministic_classification_enabled?: unknown
  readonly max_linked_document_fetches_per_run?: unknown
  readonly max_matched_items_per_run?: unknown
  readonly max_feed_bytes?: unknown
  readonly max_document_bytes?: unknown
  readonly max_pdf_pages?: unknown
  readonly max_extracted_text_chars?: unknown
  readonly ai_enabled?: unknown
}

async function sha256Hex(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("")
}

function normalizeContentType(value: string | null): string | null {
  if (!value) return null
  return value.split(";", 1)[0].trim().toLowerCase() || null
}

function extensionForContentType(contentType: string): "pdf" | "xml" | null {
  if (contentType === "application/pdf") return "pdf"
  if (contentType === "application/xml" || contentType === "text/xml") return "xml"
  return null
}

function validateOfficialNseUrl(value: string): URL | null {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== "https:" || parsed.hostname !== ALLOWED_HOST || parsed.username || parsed.password) return null
    return parsed
  } catch {
    return null
  }
}

async function fetchBounded(url: string, accept: string, maxBytes: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { Accept: accept, "User-Agent": "PortfolioAI/1.0 (+personal portfolio research; official NSE automation)" },
      signal: controller.signal,
    })
    if (response.status >= 300 && response.status < 400) throw new Error("NSE_REDIRECT_REJECTED")
    if (!response.ok) throw new Error(`NSE_HTTP_${response.status}`)
    const contentLength = response.headers.get("content-length")
    if (contentLength && Number(contentLength) > maxBytes) throw new Error("NSE_RESPONSE_TOO_LARGE")
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (!bytes.byteLength) throw new Error("NSE_EMPTY_RESPONSE")
    if (bytes.byteLength > maxBytes) throw new Error("NSE_RESPONSE_TOO_LARGE")
    return { bytes, status: response.status, contentType: normalizeContentType(response.headers.get("content-type")) }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("NSE_FETCH_TIMEOUT")
    throw error
  } finally {
    clearTimeout(timeout)
  }
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
      new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error("TEXT_EXTRACTION_TIMEOUT")), timeoutMs) }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

function parseAction(value: unknown): Action | null {
  return value === "DRY_RUN" || value === "RUN" || value === "SCHEDULED_RUN" ? value : null
}

async function loadHeldEquities(admin: Admin, portfolioId: string): Promise<HeldSecurity[]> {
  const holdings = await admin.from("current_holdings")
    .select("security_id,current_quantity")
    .eq("portfolio_id", portfolioId)
    .gt("current_quantity", 0)
  if (holdings.error) throw new Error("HOLDINGS_LOAD_FAILED")
  const securityIds = [...new Set((holdings.data ?? []).map(row => row.security_id as string))]
  if (!securityIds.length) return []

  const [securities, listings, observations] = await Promise.all([
    admin.from("securities").select("id,symbol,name,asset_class").in("id", securityIds).eq("asset_class", "EQUITY").eq("is_active", true),
    admin.from("security_listings").select("security_id,trading_symbol,exchange,is_active").in("security_id", securityIds).eq("exchange", "NSE").eq("is_active", true),
    admin.from("security_identity_observations").select("security_id,observed_name,evidence_status,confidence").in("security_id", securityIds).eq("evidence_status", "MATCHED").eq("confidence", 1).not("observed_name", "is", null),
  ])
  if (securities.error || listings.error || observations.error) throw new Error("IDENTITY_EVIDENCE_LOAD_FAILED")

  const listingBySecurity = new Map((listings.data ?? []).map(row => [row.security_id as string, row.trading_symbol as string]))
  const observedBySecurity = new Map<string, string[]>()
  for (const row of observations.data ?? []) {
    const securityId = row.security_id as string
    const observedName = typeof row.observed_name === "string" ? row.observed_name : ""
    if (!observedName.trim()) continue
    const values = observedBySecurity.get(securityId) ?? []
    values.push(observedName)
    observedBySecurity.set(securityId, values)
  }

  return (securities.data ?? []).flatMap(row => {
    const tradingSymbol = listingBySecurity.get(row.id as string)
    if (!tradingSymbol) return []
    const aliases = new Set<string>([normalizeCompanyName(row.name as string)])
    for (const observedName of observedBySecurity.get(row.id as string) ?? []) aliases.add(normalizeCompanyName(observedName))
    aliases.delete("")
    if (!aliases.size) return []
    return [{
      id: row.id as string,
      symbol: row.symbol as string,
      name: row.name as string,
      tradingSymbol,
      aliases,
    }]
  })
}

function matchItems(parsed: readonly ParsedNseNewsItem[], securities: readonly HeldSecurity[]) {
  const aliasOwners = new Map<string, HeldSecurity[]>()
  for (const security of securities) {
    for (const alias of security.aliases) {
      const owners = aliasOwners.get(alias) ?? []
      owners.push(security)
      aliasOwners.set(alias, owners)
    }
  }

  const matched: MatchedItem[] = []
  let unmatched = 0
  let ambiguous = 0
  for (const item of parsed) {
    const owners = aliasOwners.get(normalizeCompanyName(item.companyName)) ?? []
    if (owners.length === 0) { unmatched += 1; continue }
    if (owners.length !== 1) { ambiguous += 1; continue }
    matched.push({ security: owners[0], item })
  }
  matched.sort((a, b) => b.item.publishedAt.localeCompare(a.item.publishedAt))
  return { matched, unmatched, ambiguous }
}

async function existingDocumentCapture(admin: Admin, newsItemId: string, sourceUrl: string) {
  const result = await admin.from("data_source_records")
    .select("id,record_kind,payload_hash,raw_payload,retrieved_at")
    .eq("source_code", SOURCE_CODE)
    .in("record_kind", [DOCUMENT_RECORD_KIND, PILOT_DOCUMENT_RECORD_KIND])
    .eq("source_url", sourceUrl)
    .contains("raw_payload", { news_item_id: newsItemId })
    .order("retrieved_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (result.error) throw new Error("DOCUMENT_CAPTURE_LOOKUP_FAILED")
  return result.data
}

async function existingTextExtraction(admin: Admin, newsItemId: string, captureRecordId: string) {
  const result = await admin.from("data_source_records")
    .select("id,record_kind,payload_hash,raw_payload,retrieved_at")
    .eq("source_code", SOURCE_CODE)
    .in("record_kind", [TEXT_RECORD_KIND, PILOT_TEXT_RECORD_KIND])
    .contains("raw_payload", { news_item_id: newsItemId, parent_capture_record_id: captureRecordId })
    .order("retrieved_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (result.error) throw new Error("TEXT_EXTRACTION_LOOKUP_FAILED")
  return result.data
}

async function extractAndPersistPdf(admin: Admin, params: {
  runId: string
  newsItemId: string
  securityId: string
  symbol: string
  captureRecordId: string
  sourceUrl: string
  storagePath: string
  expectedDocumentHash: string
  bytes?: Uint8Array
}) {
  const existing = await existingTextExtraction(admin, params.newsItemId, params.captureRecordId)
  if (existing) return { status: "UNCHANGED" as const, outputRecordId: existing.id as string, pageCount: null, extractedCharCount: null }

  let bytes = params.bytes
  if (!bytes) {
    const stored = await admin.storage.from(STORAGE_BUCKET).download(params.storagePath)
    if (stored.error || !stored.data) throw new Error("STORED_DOCUMENT_DOWNLOAD_FAILED")
    bytes = new Uint8Array(await stored.data.arrayBuffer())
  }
  if (!bytes.byteLength || bytes.byteLength > MAX_DOCUMENT_BYTES) throw new Error("STORED_DOCUMENT_SIZE_REJECTED")
  if (await sha256Hex(bytes) !== params.expectedDocumentHash) throw new Error("STORED_DOCUMENT_HASH_MISMATCH")

  const pdf = await getDocumentProxy(bytes, { maxImageSize: MAX_IMAGE_SIZE })
  const pageCount = pdf.numPages
  if (pageCount < 1 || pageCount > MAX_PDF_PAGES) throw new Error("PDF_PAGE_LIMIT_REJECTED")
  const extracted = await withTimeout(extractText(pdf, { mergePages: true }), EXTRACTION_TIMEOUT_MS)
  const normalized = normalizeExtractedText(typeof extracted.text === "string" ? extracted.text : extracted.text.join("\n\n"))
  if (!normalized) throw new Error("PDF_TEXT_EMPTY")
  const persistedText = normalized.slice(0, MAX_TEXT_CHARS)
  const textHash = await sha256Hex(persistedText)
  const externalRecordId = `NSE:LINKED_DOCUMENT_TEXT:${params.captureRecordId}:${EXTRACTION_VERSION}:${params.expectedDocumentHash}`

  const derived = await admin.from("data_source_records").insert({
    source_code: SOURCE_CODE,
    ingestion_run_id: params.runId,
    record_kind: TEXT_RECORD_KIND,
    external_record_id: externalRecordId,
    source_url: params.sourceUrl,
    retrieved_at: new Date().toISOString(),
    payload_hash: textHash,
    raw_payload: {
      stage: "N5",
      mode: POLICY_MODE,
      news_item_id: params.newsItemId,
      security_id: params.securityId,
      symbol: params.symbol,
      parent_capture_record_id: params.captureRecordId,
      storage_bucket: STORAGE_BUCKET,
      storage_object_path: params.storagePath,
      verified_document_sha256: params.expectedDocumentHash,
      content_type: "application/pdf",
      page_count: pageCount,
      extracted_char_count: normalized.length,
      persisted_char_count: persistedText.length,
      text_truncated: normalized.length > MAX_TEXT_CHARS,
      extraction_method: "unpdf-serverless",
      extraction_package: EXTRACTION_VERSION,
      extracted_text: persistedText,
    },
    terms_snapshot: {
      stage: "N5",
      source_fetches: 0,
      storage_reads: params.bytes ? 0 : 1,
      normalized_news_writes: 0,
      ocr_enabled: false,
      ai_enabled: false,
      scheduler_mutation: false,
    },
  }).select("id").single()
  if (derived.error) {
    const raced = await existingTextExtraction(admin, params.newsItemId, params.captureRecordId)
    if (raced) return { status: "UNCHANGED" as const, outputRecordId: raced.id as string, pageCount, extractedCharCount: normalized.length }
    throw new Error("TEXT_CAPTURE_PERSISTENCE_FAILED")
  }
  return { status: "INSERTED" as const, outputRecordId: derived.data.id as string, pageCount, extractedCharCount: normalized.length }
}

async function captureAndExtractDocument(admin: Admin, params: {
  runId: string
  newsItemId: string
  securityId: string
  symbol: string
  sourceUrl: string
  onExternalFetchAttempt?: () => void
  onExternalFetchSuccess?: () => void
}) {
  const prior = await existingDocumentCapture(admin, params.newsItemId, params.sourceUrl)
  if (prior) {
    const raw = prior.raw_payload as Record<string, unknown>
    if (
      raw.storage_bucket === STORAGE_BUCKET &&
      typeof raw.storage_object_path === "string" &&
      typeof raw.document_sha256 === "string" &&
      raw.content_type === "application/pdf"
    ) {
      const extraction = await extractAndPersistPdf(admin, {
        ...params,
        captureRecordId: prior.id as string,
        storagePath: raw.storage_object_path,
        expectedDocumentHash: raw.document_sha256,
      })
      return { externalFetches: 0, captureStatus: "UNCHANGED", captureRecordId: prior.id as string, extraction }
    }
    return { externalFetches: 0, captureStatus: "UNCHANGED", captureRecordId: prior.id as string, extraction: null }
  }

  const officialUrl = validateOfficialNseUrl(params.sourceUrl)
  if (!officialUrl) throw new Error("NSE_DOCUMENT_URL_REJECTED")
  params.onExternalFetchAttempt?.()
  const fetched = await fetchBounded(officialUrl.toString(), "application/pdf, application/xml, text/xml;q=0.9, */*;q=0.1", MAX_DOCUMENT_BYTES)
  params.onExternalFetchSuccess?.()
  if (!fetched.contentType) throw new Error("NSE_DOCUMENT_CONTENT_TYPE_REJECTED")
  const extension = extensionForContentType(fetched.contentType)
  if (!extension) throw new Error("NSE_DOCUMENT_CONTENT_TYPE_REJECTED")
  const documentHash = await sha256Hex(fetched.bytes)
  const storagePath = `${params.newsItemId}/${documentHash}.${extension}`

  const upload = await admin.storage.from(STORAGE_BUCKET).upload(storagePath, fetched.bytes, {
    contentType: fetched.contentType,
    upsert: false,
  })
  if (upload.error) {
    const existingObject = await admin.storage.from(STORAGE_BUCKET).download(storagePath)
    if (existingObject.error || !existingObject.data) throw new Error("NSE_DOCUMENT_STORAGE_FAILED")
    const existingBytes = new Uint8Array(await existingObject.data.arrayBuffer())
    if (await sha256Hex(existingBytes) !== documentHash) throw new Error("NSE_DOCUMENT_STORAGE_HASH_CONFLICT")
  }

  const externalRecordId = `NSE:LINKED_DOCUMENT:${params.newsItemId}:${documentHash}`
  const capture = await admin.from("data_source_records").insert({
    source_code: SOURCE_CODE,
    ingestion_run_id: params.runId,
    record_kind: DOCUMENT_RECORD_KIND,
    external_record_id: externalRecordId,
    source_url: officialUrl.toString(),
    retrieved_at: new Date().toISOString(),
    payload_hash: documentHash,
    raw_payload: {
      stage: "N5",
      mode: POLICY_MODE,
      run_id: params.runId,
      news_item_id: params.newsItemId,
      security_id: params.securityId,
      symbol: params.symbol,
      source_url: officialUrl.toString(),
      storage_bucket: STORAGE_BUCKET,
      storage_object_path: storagePath,
      http_status: fetched.status,
      content_type: fetched.contentType,
      byte_length: fetched.bytes.byteLength,
      document_sha256: documentHash,
    },
    terms_snapshot: {
      stage: "N5",
      mode: POLICY_MODE,
      capture_only: true,
      linked_document_fetches: 1,
      normalized_news_writes: 0,
      ai_enabled: false,
    },
  }).select("id").single()

  let captureRecordId: string
  if (capture.error) {
    const raced = await existingDocumentCapture(admin, params.newsItemId, params.sourceUrl)
    if (!raced) throw new Error("DOCUMENT_CAPTURE_PERSISTENCE_FAILED")
    captureRecordId = raced.id as string
  } else captureRecordId = capture.data.id as string

  const extraction = extension === "pdf"
    ? await extractAndPersistPdf(admin, {
      ...params,
      captureRecordId,
      storagePath,
      expectedDocumentHash: documentHash,
      bytes: fetched.bytes,
    })
    : null

  return { externalFetches: 1, captureStatus: capture.error ? "UNCHANGED" : "INSERTED", captureRecordId, extraction }
}

async function acquireLease(admin: Admin, portfolioId: string, holder: string) {
  const result = await admin.rpc("acquire_news_pipeline_lease_v1", {
    p_source_code: SOURCE_CODE,
    p_portfolio_id: portfolioId,
    p_lease_holder: holder,
    p_lease_seconds: LEASE_SECONDS,
  })
  if (result.error) throw new Error("NEWS_PIPELINE_LEASE_ACQUIRE_FAILED")
  const row = Array.isArray(result.data) ? result.data[0] as { acquired?: unknown } | undefined : undefined
  if (row?.acquired !== true) throw new Error("NEWS_PIPELINE_ALREADY_RUNNING")
}

async function releaseLease(admin: Admin, portfolioId: string, holder: string) {
  const result = await admin.rpc("release_news_pipeline_lease_v1", {
    p_source_code: SOURCE_CODE,
    p_portfolio_id: portfolioId,
    p_lease_holder: holder,
    p_cooldown_seconds: LEASE_COOLDOWN_SECONDS,
  })
  if (result.error) throw new Error("NEWS_PIPELINE_LEASE_RELEASE_FAILED")
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceKey) return reply(500, { error: "Server configuration is incomplete." })

  const authorization = request.headers.get("Authorization")
  if (!authorization) return reply(401, { error: "Authentication required." })

  let body: RequestBody
  try { body = await request.json() as RequestBody } catch { return reply(400, { error: "Invalid JSON body." }) }
  const action = parseAction(body.action)
  if (!action || typeof body.portfolioId !== "string") return reply(400, { error: "action and portfolioId are required." })

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  let requestedBy: string | null = null
  if (action === "SCHEDULED_RUN") {
    const schedulerToken = Deno.env.get("NEWS_PIPELINE_SCHEDULER_TOKEN")
    const supplied = request.headers.get("x-portfolioai-scheduler-token")
    if (!schedulerToken || !supplied || supplied !== schedulerToken) return reply(401, { error: "Scheduler authentication failed." })
  } else {
    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session." })
    requestedBy = auth.data.user.id
    const portfolio = await admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", requestedBy).single()
    if (portfolio.error) return reply(404, { error: "Portfolio not found." })
  }

  const source = await admin.from("data_sources")
    .select("is_active,entitlement_verified,retention_rights_verified")
    .eq("code", SOURCE_CODE)
    .single()
  if (source.error || !source.data.is_active || !source.data.entitlement_verified || !source.data.retention_rights_verified) {
    return reply(409, { error: "Official filing source configuration is incomplete.", externalFetches: 0 })
  }

  const policy = await admin.from("refresh_domain_policies")
    .select("policy_version,is_enabled,freshness_seconds,definition")
    .eq("source_code", SOURCE_CODE)
    .eq("data_domain", DATA_DOMAIN)
    .is("effective_to", null)
    .single()
  const definition = policy.data?.definition as PolicyDefinition | undefined
  if (
    policy.error || !policy.data?.is_enabled || definition?.mode !== POLICY_MODE ||
    definition?.external_fetches_allowed !== true || definition?.normalization_enabled !== true ||
    definition?.linked_document_capture_enabled !== true || definition?.linked_document_parsing_enabled !== true ||
    definition?.deterministic_classification_enabled !== true || definition?.max_linked_document_fetches_per_run !== MAX_LINKED_DOCUMENT_FETCHES ||
    definition?.max_matched_items_per_run !== MAX_MATCHED_ITEMS ||
    definition?.max_feed_bytes !== MAX_FEED_BYTES || definition?.max_document_bytes !== MAX_DOCUMENT_BYTES ||
    definition?.max_pdf_pages !== MAX_PDF_PAGES || definition?.max_extracted_text_chars !== MAX_TEXT_CHARS || definition?.ai_enabled !== false
  ) return reply(409, { error: "Reviewed N5 NSE automation policy is not active.", externalFetches: 0 })
  if (action === "DRY_RUN" && definition.dry_run_allowed !== true) return reply(409, { error: "N5 dry run is not allowed by policy.", externalFetches: 0 })
  if (action === "RUN" && definition.manual_run_allowed !== true) return reply(409, { error: "N5 live manual run is not allowed by policy.", externalFetches: 0 })
  if (action === "SCHEDULED_RUN" && definition.scheduler_allowed !== true) return reply(409, { error: "N5 scheduler is not enabled by policy.", externalFetches: 0 })

  if (action === "SCHEDULED_RUN") {
    const ownedPortfolio = await admin.from("portfolios").select("id").eq("id", body.portfolioId).maybeSingle()
    if (ownedPortfolio.error || !ownedPortfolio.data) return reply(404, { error: "Portfolio not found." })
  }

  const leaseHolder = crypto.randomUUID()
  try { await acquireLease(admin, body.portfolioId, leaseHolder) } catch (error) {
    const code = error instanceof Error ? error.message : "NEWS_PIPELINE_LEASE_FAILED"
    return reply(code === "NEWS_PIPELINE_ALREADY_RUNNING" ? 429 : 502, { error: "NSE news pipeline could not start safely.", code, externalFetches: 0 })
  }

  let runId: string | null = null
  let externalFetchAttempts = 0
  let successfulExternalFetches = 0
  try {
    const securities = await loadHeldEquities(admin, body.portfolioId)
    const run = await admin.from("data_ingestion_runs").insert({
      source_code: SOURCE_CODE,
      portfolio_id: body.portfolioId,
      operation: "NSE_NEWS_PIPELINE",
      orchestration_type: "NSE_NEWS_PIPELINE",
      trigger_source: action === "SCHEDULED_RUN" ? "SCHEDULED" : "OWNER",
      requested_by: requestedBy,
      status: "RUNNING",
      requested_count: securities.length,
      estimated_call_count: action === "DRY_RUN" ? 1 : 1 + MAX_LINKED_DOCUMENT_FETCHES,
      reserved_call_count: 0,
      attempted_call_count: 0,
      policy_version: policy.data.policy_version,
      metadata: {
        stage: "N5",
        mode: POLICY_MODE,
        action,
        feed_url: FEED_URL,
        parser_version: PARSER_VERSION,
        classifier_version: CLASSIFIER_VERSION,
        extraction_version: EXTRACTION_VERSION,
        shared_feed_fetch_budget: 1,
        linked_document_fetch_budget: action === "DRY_RUN" ? 0 : MAX_LINKED_DOCUMENT_FETCHES,
        provider_budget_reservations: 0,
        ai_enabled: false,
      },
    }).select("id").single()
    if (run.error) throw new Error("RUN_ACCOUNTING_FAILED")
    runId = run.data.id as string

    const runItemsBySecurity = new Map<string, string>()
    if (securities.length) {
      const insertedItems = await admin.from("data_ingestion_run_items").insert(securities.map(security => ({
        ingestion_run_id: runId,
        security_id: security.id,
        data_domain: DATA_DOMAIN,
        status: "PLANNED",
        metadata: { stage: "N5", action, symbol: security.symbol, shared_feed_fetch: true },
      }))).select("id,security_id")
      if (insertedItems.error) throw new Error("RUN_ITEM_ACCOUNTING_FAILED")
      for (const row of insertedItems.data ?? []) runItemsBySecurity.set(row.security_id as string, row.id as string)
    }

    if (!securities.length) {
      await admin.from("data_ingestion_runs").update({
        status: "SUCCEEDED", completed_at: new Date().toISOString(), attempted_call_count: 0,
        fetched_count: 0, accepted_count: 0, failed_count: 0, skipped_count: 0,
        metadata: { stage: "N5", mode: POLICY_MODE, action, reason: "NO_ELIGIBLE_HELD_EQUITIES", external_fetches: 0 },
      }).eq("id", runId)
      return reply(200, { runId, action, eligibleHeldEquities: 0, externalFetches: 0, schedulerEnabled: definition.scheduler_allowed === true })
    }

    if (action !== "DRY_RUN") {
      const states = await admin.from("security_refresh_states")
        .select("security_id,fresh_until")
        .eq("source_code", SOURCE_CODE)
        .eq("data_domain", DATA_DOMAIN)
        .in("security_id", securities.map(security => security.id))
      if (states.error) throw new Error("REFRESH_STATE_LOAD_FAILED")
      const now = Date.now()
      const freshIds = new Set((states.data ?? []).filter(row => row.fresh_until && new Date(row.fresh_until as string).getTime() > now).map(row => row.security_id as string))
      if (freshIds.size === securities.length) {
        const completedAt = new Date().toISOString()
        for (const security of securities) {
          const itemId = runItemsBySecurity.get(security.id)!
          await admin.from("data_ingestion_run_items").update({
            status: "SKIPPED_FRESH", safe_reason_code: "CACHE_FRESH", completed_at: completedAt,
            metadata: { stage: "N5", action, symbol: security.symbol, external_fetches: 0 },
          }).eq("id", itemId)
        }
        await admin.from("data_ingestion_runs").update({
          status: "SUCCEEDED", completed_at: completedAt, attempted_call_count: 0,
          fetched_count: 0, accepted_count: 0, failed_count: 0, skipped_count: securities.length,
          metadata: { stage: "N5", mode: POLICY_MODE, action, reason: "ALL_ELIGIBLE_SECURITIES_FRESH", external_fetches: 0 },
        }).eq("id", runId)
        return reply(200, { runId, action, skippedFresh: securities.length, externalFetches: 0, schedulerEnabled: definition.scheduler_allowed === true })
      }
    }

    externalFetchAttempts += 1
    const feed = await fetchBounded(FEED_URL, "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1", MAX_FEED_BYTES)
    successfulExternalFetches += 1
    const xml = new TextDecoder().decode(feed.bytes)
    const parsed = parseNseCorporateAnnouncements(xml)
    const matching = matchItems(parsed, securities)
    const selectedMatches = matching.matched.slice(0, MAX_MATCHED_ITEMS)
    const matchedItemsTruncated = matching.matched.length > selectedMatches.length
    const feedHash = await sha256Hex(feed.bytes)
    const matchedBySecurity = new Map<string, MatchedItem[]>()
    for (const row of selectedMatches) {
      const values = matchedBySecurity.get(row.security.id) ?? []
      values.push(row)
      matchedBySecurity.set(row.security.id, values)
    }

    if (action === "DRY_RUN") {
      let existingCanonicalItems = 0
      let newCanonicalItems = 0
      let missingDocumentCaptures = 0
      for (const match of selectedMatches) {
        const canonicalKey = await sha256Hex(`NSE|${match.item.sourceUrl}`)
        const existingNews = await admin.from("news_items").select("id").eq("canonical_key", canonicalKey).maybeSingle()
        if (existingNews.error) throw new Error("NEWS_LOOKUP_FAILED")
        if (existingNews.data) {
          existingCanonicalItems += 1
          const capture = await existingDocumentCapture(admin, existingNews.data.id as string, match.item.sourceUrl)
          if (!capture) missingDocumentCaptures += 1
        } else {
          newCanonicalItems += 1
          missingDocumentCaptures += 1
        }
      }
      const completedAt = new Date().toISOString()
      for (const security of securities) {
        await admin.from("data_ingestion_run_items").update({
          status: "UNCHANGED",
          safe_reason_code: "DRY_RUN_NO_MUTATION",
          attempted_call_count: 0,
          accepted_record_count: 0,
          completed_at: completedAt,
          metadata: {
            stage: "N5", action, symbol: security.symbol, matched_items: matchedBySecurity.get(security.id)?.length ?? 0,
            shared_feed_fetches: 1, normalized_news_writes: 0, linked_document_fetches: 0, refresh_state_mutation: false,
          },
        }).eq("id", runItemsBySecurity.get(security.id)!)
      }
      await admin.from("data_ingestion_runs").update({
        status: "SUCCEEDED", completed_at: completedAt, attempted_call_count: 1,
        fetched_count: 1, accepted_count: 0, failed_count: 0, skipped_count: 0,
        metadata: {
          stage: "N5", mode: POLICY_MODE, action, feed_payload_hash: feedHash,
          external_fetches: 1, shared_feed_fetches: 1, linked_document_fetches: 0,
          parsed_items: parsed.length, matched_items: selectedMatches.length, total_matched_items: matching.matched.length, matched_items_truncated: matchedItemsTruncated, unmatched_items: matching.unmatched,
          ambiguous_items: matching.ambiguous, existing_canonical_items: existingCanonicalItems,
          planned_new_canonical_items: newCanonicalItems, planned_missing_document_captures: missingDocumentCaptures,
          normalized_news_writes: 0, source_record_writes: 0, storage_writes: 0, refresh_state_mutation: false,
          scheduler_enabled: false,
        },
      }).eq("id", runId)
      return reply(200, {
        mode: POLICY_MODE, action, runId, eligibleHeldEquities: securities.length, parsedItems: parsed.length,
        matchedItems: selectedMatches.length, totalMatchedItems: matching.matched.length, matchedItemsTruncated, unmatchedItems: matching.unmatched, ambiguousItems: matching.ambiguous,
        existingCanonicalItems, plannedNewCanonicalItems: newCanonicalItems,
        plannedMissingDocumentCaptures: missingDocumentCaptures,
        externalFetches: 1, linkedDocumentFetches: 0, normalizedNewsWrites: 0, sourceRecordWrites: 0,
        storageWrites: 0, refreshStateMutation: false, schedulerEnabled: false,
        note: "Dry run fetched and parsed the official NSE feed, matched held equities and planned idempotent writes. It did not mutate news/source/storage or freshness state.",
      })
    }

    let feedRecordId: string
    const priorFeed = await admin.from("data_source_records")
      .select("id")
      .eq("source_code", SOURCE_CODE)
      .eq("record_kind", FEED_RECORD_KIND)
      .eq("payload_hash", feedHash)
      .limit(1)
      .maybeSingle()
    if (priorFeed.error) throw new Error("FEED_CAPTURE_LOOKUP_FAILED")
    if (priorFeed.data) feedRecordId = priorFeed.data.id as string
    else {
      const capture = await admin.from("data_source_records").insert({
        source_code: SOURCE_CODE,
        ingestion_run_id: runId,
        record_kind: FEED_RECORD_KIND,
        external_record_id: `NSE:CORPORATE_ANNOUNCEMENTS:SHA256:${feedHash}`,
        source_url: FEED_URL,
        retrieved_at: new Date().toISOString(),
        payload_hash: feedHash,
        raw_payload: {
          stage: "N5", mode: POLICY_MODE, run_id: runId, exchange: "NSE", transport: "NSE_RSS",
          feed: "CORPORATE_ANNOUNCEMENTS", feed_url: FEED_URL, http_status: feed.status,
          content_type: feed.contentType, xml,
        },
        terms_snapshot: {
          stage: "N5", parser_version: PARSER_VERSION, normalized_news_writes_deferred_from_raw_capture: true,
          linked_document_fetches: 0, ai_enabled: false,
        },
      }).select("id").single()
      if (capture.error) {
        const raced = await admin.from("data_source_records").select("id").eq("source_code", SOURCE_CODE).eq("record_kind", FEED_RECORD_KIND).eq("payload_hash", feedHash).limit(1).maybeSingle()
        if (raced.error || !raced.data) throw new Error("FEED_CAPTURE_PERSISTENCE_FAILED")
        feedRecordId = raced.data.id as string
      } else feedRecordId = capture.data.id as string
    }

    let insertedNewsItems = 0
    let duplicateNewsItems = 0
    let insertedAppearances = 0
    let duplicateAppearances = 0
    const documentCandidates: Array<{ newsItemId: string; security: HeldSecurity; sourceUrl: string }> = []

    for (const match of selectedMatches) {
      const canonicalKey = await sha256Hex(`NSE|${match.item.sourceUrl}`)
      const dedupeKey = `URL:${match.item.sourceUrl.toLowerCase()}`
      const headline = buildHeadline(match.item)
      const importance = importanceFromItem(match.item)
      const tone = toneFromItem(match.item)
      const contentHash = await sha256Hex(JSON.stringify({
        companyName: match.item.companyName, sourceUrl: match.item.sourceUrl, description: match.item.description,
        subject: match.item.subject, publishedAt: match.item.publishedAt, category: match.item.category,
      }))

      const existingNews = await admin.from("news_items").select("id,security_id").eq("canonical_key", canonicalKey).maybeSingle()
      if (existingNews.error) throw new Error("NEWS_LOOKUP_FAILED")
      let newsItemId: string
      if (existingNews.data) {
        if (existingNews.data.security_id !== match.security.id) throw new Error("CANONICAL_KEY_SECURITY_CONFLICT")
        newsItemId = existingNews.data.id as string
        const seen = await admin.from("news_items").update({ last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", newsItemId)
        if (seen.error) throw new Error("NEWS_LAST_SEEN_UPDATE_FAILED")
        duplicateNewsItems += 1
      } else {
        const inserted = await admin.from("news_items").insert({
          security_id: match.security.id,
          canonical_key: canonicalKey,
          headline,
          summary: match.item.description.slice(0, 4000),
          category: match.item.category,
          importance_state: importance,
          published_at: match.item.publishedAt,
          publication_precision: match.item.publicationPrecision,
          primary_source_name: "NSE",
          primary_source_url: match.item.sourceUrl,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          tone_state: tone.state,
          tone_method: tone.method,
          tone_confidence: tone.confidence,
          tone_reason: tone.reason,
        }).select("id").single()
        if (inserted.error) throw new Error("NEWS_INSERT_FAILED")
        newsItemId = inserted.data.id as string
        insertedNewsItems += 1
      }

      const appearance = await admin.from("news_source_appearances")
        .select("id,news_item_id")
        .eq("source_code", SOURCE_CODE)
        .eq("dedupe_key", dedupeKey)
        .maybeSingle()
      if (appearance.error) throw new Error("APPEARANCE_LOOKUP_FAILED")
      if (appearance.data) {
        if (appearance.data.news_item_id !== newsItemId) throw new Error("APPEARANCE_NEWS_ITEM_CONFLICT")
        duplicateAppearances += 1
      } else {
        const inserted = await admin.from("news_source_appearances").insert({
          news_item_id: newsItemId,
          source_code: SOURCE_CODE,
          data_source_record_id: feedRecordId,
          provider_record_id: match.item.sourceUrl,
          provider_security_identity: match.security.tradingSymbol,
          publisher_name: "NSE",
          source_url: match.item.sourceUrl,
          headline_as_received: headline,
          summary_as_received: match.item.description.slice(0, 4000),
          published_at: match.item.publishedAt,
          retrieved_at: new Date().toISOString(),
          content_hash: contentHash,
          dedupe_key: dedupeKey,
        })
        if (inserted.error) throw new Error("APPEARANCE_INSERT_FAILED")
        insertedAppearances += 1
      }
      documentCandidates.push({ newsItemId, security: match.security, sourceUrl: match.item.sourceUrl })
    }

    let linkedDocumentFetches = 0
    let insertedDocumentCaptures = 0
    let insertedTextExtractions = 0
    let unchangedDocumentCaptures = 0
    let unchangedTextExtractions = 0
    const documentErrors: Array<{ newsItemId: string; code: string }> = []

    for (const candidate of documentCandidates.slice(0, MAX_LINKED_DOCUMENT_FETCHES)) {
      try {
        const prior = await existingDocumentCapture(admin, candidate.newsItemId, candidate.sourceUrl)
        if (prior) {
          unchangedDocumentCaptures += 1
          const raw = prior.raw_payload as Record<string, unknown>
          if (raw.content_type === "application/pdf" && typeof raw.storage_object_path === "string" && typeof raw.document_sha256 === "string") {
            const existingExtraction = await existingTextExtraction(admin, candidate.newsItemId, prior.id as string)
            if (existingExtraction) unchangedTextExtractions += 1
            else {
              const extraction = await extractAndPersistPdf(admin, {
                runId, newsItemId: candidate.newsItemId, securityId: candidate.security.id, symbol: candidate.security.symbol,
                captureRecordId: prior.id as string, sourceUrl: candidate.sourceUrl,
                storagePath: raw.storage_object_path, expectedDocumentHash: raw.document_sha256,
              })
              if (extraction.status === "INSERTED") insertedTextExtractions += 1
              else unchangedTextExtractions += 1
            }
          }
          continue
        }
        const result = await captureAndExtractDocument(admin, {
          runId, newsItemId: candidate.newsItemId, securityId: candidate.security.id,
          symbol: candidate.security.symbol, sourceUrl: candidate.sourceUrl,
          onExternalFetchAttempt: () => { linkedDocumentFetches += 1; externalFetchAttempts += 1 },
          onExternalFetchSuccess: () => { successfulExternalFetches += 1 },
        })
        if (result.captureStatus === "INSERTED") insertedDocumentCaptures += 1
        else unchangedDocumentCaptures += 1
        if (result.extraction?.status === "INSERTED") insertedTextExtractions += 1
        else if (result.extraction) unchangedTextExtractions += 1
      } catch (error) {
        const code = error instanceof Error ? error.message : "LINKED_DOCUMENT_PROCESSING_FAILED"
        documentErrors.push({ newsItemId: candidate.newsItemId, code })
      }
    }

    const changedBySecurity = new Map<string, number>()
    for (const match of selectedMatches) changedBySecurity.set(match.security.id, (changedBySecurity.get(match.security.id) ?? 0) + 1)
    let itemAccountingFailures = 0
    for (const security of securities) {
      const itemId = runItemsBySecurity.get(security.id)!
      const matchedCount = changedBySecurity.get(security.id) ?? 0
      const result = await admin.rpc("record_refresh_item_result_v1", {
        p_run_item_id: itemId,
        p_status: matchedCount > 0 ? "ACCEPTED" : "UNCHANGED",
        p_safe_reason_code: null,
        p_attempted_call_count: 0,
        p_accepted_record_count: matchedCount,
        p_metadata: {
          stage: "N5", action, symbol: security.symbol, shared_feed_fetches: 1,
          matched_items: matchedCount, parser_version: PARSER_VERSION, classifier_version: CLASSIFIER_VERSION,
          linked_document_fetches_are_run_scoped: true,
        },
      })
      if (result.error) itemAccountingFailures += 1
    }
    if (itemAccountingFailures) throw new Error("RUN_ITEM_ACCOUNTING_FAILED")

    const attemptedCalls = externalFetchAttempts
    const completedAt = new Date().toISOString()
    const completed = await admin.from("data_ingestion_runs").update({
      status: documentErrors.length ? "PARTIAL" : "SUCCEEDED",
      completed_at: completedAt,
      attempted_call_count: attemptedCalls,
      fetched_count: successfulExternalFetches,
      accepted_count: insertedNewsItems + insertedAppearances + insertedDocumentCaptures + insertedTextExtractions,
      failed_count: documentErrors.length,
      skipped_count: 0,
      error_summary: documentErrors.length ? "LINKED_DOCUMENT_PARTIAL_FAILURE" : null,
      metadata: {
        stage: "N5", mode: POLICY_MODE, action, feed_record_id: feedRecordId, feed_payload_hash: feedHash,
        external_fetches: attemptedCalls, shared_feed_fetches: 1, linked_document_fetches: linkedDocumentFetches,
        parsed_items: parsed.length, matched_items: selectedMatches.length, total_matched_items: matching.matched.length, matched_items_truncated: matchedItemsTruncated, unmatched_items: matching.unmatched,
        ambiguous_items: matching.ambiguous, inserted_news_items: insertedNewsItems, duplicate_news_items: duplicateNewsItems,
        inserted_source_appearances: insertedAppearances, duplicate_source_appearances: duplicateAppearances,
        inserted_document_captures: insertedDocumentCaptures, unchanged_document_captures: unchangedDocumentCaptures,
        inserted_text_extractions: insertedTextExtractions, unchanged_text_extractions: unchangedTextExtractions,
        document_errors: documentErrors, parser_version: PARSER_VERSION, classifier_version: CLASSIFIER_VERSION,
        extraction_version: EXTRACTION_VERSION, provider_budget_reservations: 0, ai_enabled: false,
        scheduler_enabled: definition.scheduler_allowed === true,
      },
    }).eq("id", runId)
    if (completed.error) throw new Error("RUN_ACCOUNTING_FAILED")

    return reply(documentErrors.length ? 207 : 200, {
      mode: POLICY_MODE, action, runId, eligibleHeldEquities: securities.length,
      parsedItems: parsed.length, matchedItems: selectedMatches.length, totalMatchedItems: matching.matched.length, matchedItemsTruncated, unmatchedItems: matching.unmatched,
      ambiguousItems: matching.ambiguous, insertedNewsItems, duplicateNewsItems,
      insertedSourceAppearances: insertedAppearances, duplicateSourceAppearances: duplicateAppearances,
      linkedDocumentFetches, insertedDocumentCaptures, unchangedDocumentCaptures,
      insertedTextExtractions, unchangedTextExtractions, documentErrors,
      externalFetches: attemptedCalls, providerBudgetReservations: 0,
      aiEnabled: false, schedulerEnabled: definition.scheduler_allowed === true,
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : "NSE_NEWS_PIPELINE_FAILED"
    if (runId) {
      const failedAt = new Date().toISOString()
      await admin.from("data_ingestion_run_items").update({
        status: "FAILED", safe_reason_code: code.match(/^[A-Z0-9_]+$/) ? code : "NSE_NEWS_PIPELINE_FAILED",
        completed_at: failedAt, metadata: { stage: "N5", action, fatal_pipeline_failure: true },
      }).eq("ingestion_run_id", runId).eq("status", "PLANNED")
      await admin.from("data_ingestion_runs").update({
        status: "FAILED", completed_at: failedAt, error_summary: code,
        attempted_call_count: externalFetchAttempts, fetched_count: successfulExternalFetches, failed_count: 1,
        metadata: { stage: "N5", mode: POLICY_MODE, action, safe_error_code: code, external_fetch_attempts: externalFetchAttempts, successful_external_fetches: successfulExternalFetches },
      }).eq("id", runId)
    }
    return reply(502, { error: "NSE news pipeline failed safely.", code, runId, schedulerEnabled: false })
  } finally {
    try { await releaseLease(admin, body.portfolioId, leaseHolder) } catch { /* lease expires safely */ }
  }
})
