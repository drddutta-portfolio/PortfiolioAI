import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { extractLogoCandidates, extractScreenerCompanyProfile, publicHttpUrl } from "../_shared/company-profile.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const SOURCE_CODE = "SCREENER_WEB"
const DATA_DOMAIN = "COMPANY_PROFILE"
const RESERVED_UNITS = 5
const MAX_PAGE_BYTES = 2 * 1024 * 1024
const MAX_LOGO_BYTES = 512 * 1024
const ACCOUNTING_WRITE_ATTEMPTS = 3
const USER_AGENT = "PortfolioAI/1.0 personal research profile cache"

type Admin = ReturnType<typeof createClient>
type RequestBody = { readonly portfolioId?: unknown; readonly securityId?: unknown; readonly force?: unknown }

type TrackedResponse = {
  readonly response: Response
  readonly bytes: Uint8Array
}

function budgetHttpStatus(reasonCode: string) {
  if (reasonCode === "INGESTION_DISABLED") return 409
  if (["DAILY_LIMIT", "ROLLING_LIMIT", "PER_RUN_LIMIT", "CONCURRENCY_LIMIT"].includes(reasonCode)) return 429
  return 503
}

async function sha256Hex(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("")
}

async function readLimitedBody(response: Response, limit: number) {
  const declared = Number(response.headers.get("content-length") ?? "0")
  if (declared > limit) throw new Error("RESPONSE_TOO_LARGE")
  if (!response.body) return new Uint8Array()
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > limit) {
      await reader.cancel()
      throw new Error("RESPONSE_TOO_LARGE")
    }
    chunks.push(value)
  }
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength }
  return merged
}

async function safeFetch(url: string, maxBytes: number, accept: string): Promise<TrackedResponse> {
  let current = publicHttpUrl(url)
  if (!current) throw new Error("UNSAFE_SOURCE_URL")
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": USER_AGENT, Accept: accept, "Accept-Language": "en-IN,en;q=0.9" },
      signal: AbortSignal.timeout(15_000),
    })
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get("location")
      if (!location) throw new Error("PROVIDER_REDIRECT_INVALID")
      const next = publicHttpUrl(new URL(location, current).toString())
      if (!next) throw new Error("UNSAFE_SOURCE_URL")
      current = next
      continue
    }
    const bytes = await readLimitedBody(response, maxBytes)
    return { response, bytes }
  }
  throw new Error("PROVIDER_REDIRECT_LIMIT")
}

async function recordUsage(
  admin: Admin,
  runId: string,
  runItemId: string,
  securityId: string,
  attemptNumber: number,
  operationClass: string,
  attemptedAt: string,
  outcome: "SUCCEEDED" | "FAILED",
  safeErrorCode: string | null,
) {
  const payload = {
    p_source_code: SOURCE_CODE,
    p_ingestion_run_id: runId,
    p_run_item_id: runItemId,
    p_security_id: securityId,
    p_data_domain: DATA_DOMAIN,
    p_operation_class: operationClass,
    p_accounting_class: "PROVIDER_TOOL_ATTEMPT",
    p_estimated_internal_units: 1,
    p_actual_internal_units: 1,
    p_attempted_at: attemptedAt,
    p_completed_at: new Date().toISOString(),
    p_outcome: outcome,
    p_safe_error_code: safeErrorCode,
    p_retry_attempt: 0,
    p_idempotency_key: `${runId}:${operationClass}:${attemptNumber}`,
  }
  for (let retry = 0; retry < ACCOUNTING_WRITE_ATTEMPTS; retry += 1) {
    const usage = await admin.rpc("record_provider_usage_event_v1", payload)
    if (!usage.error) return
  }
  throw new Error("USAGE_ACCOUNTING_FAILED")
}

async function completeRunItem(
  admin: Admin,
  runItemId: string,
  status: "ACCEPTED" | "FAILED" | "SKIPPED_BUDGET",
  safeReasonCode: string | null,
  attemptedCallCount: number,
  acceptedRecordCount: number,
  metadata: Record<string, unknown>,
) {
  const result = await admin.rpc("record_refresh_item_result_v1", {
    p_run_item_id: runItemId,
    p_status: status,
    p_safe_reason_code: safeReasonCode,
    p_attempted_call_count: attemptedCallCount,
    p_accepted_record_count: acceptedRecordCount,
    p_metadata: metadata,
  })
  if (result.error) throw new Error("RUN_ITEM_ACCOUNTING_FAILED")
}

function logoExtension(contentType: string) {
  if (contentType === "image/png") return "png"
  if (contentType === "image/jpeg") return "jpg"
  if (contentType === "image/webp") return "webp"
  if (contentType === "image/svg+xml") return "svg"
  return null
}

function sanitizeSvg(bytes: Uint8Array) {
  let svg = new TextDecoder().decode(bytes)
  if (!/<svg\b/i.test(svg)) throw new Error("LOGO_FORMAT_UNSUPPORTED")
  svg = svg
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject\b[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/(?:href|xlink:href)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, "")
  return new TextEncoder().encode(svg)
}

async function persistCapture(admin: Admin, runId: string, symbol: string, sourceUrl: string, about: string | null, websiteUrl: string | null, logoSourceUrl: string | null) {
  const aboutHash = about ? await sha256Hex(about) : null
  const rawPayload = {
    mode: "NORMALIZED_PROFILE_CACHE_ONLY",
    symbol,
    source_url: sourceUrl,
    about_sha256: aboutHash,
    official_website_url: websiteUrl,
    logo_source_url: logoSourceUrl,
    raw_html_retained: false,
  }
  const serialized = JSON.stringify(rawPayload)
  const payloadHash = await sha256Hex(serialized)
  const record = await admin.from("data_source_records").upsert({
    source_code: SOURCE_CODE,
    ingestion_run_id: runId,
    record_kind: "COMPANY_PROFILE_DISCOVERY",
    external_record_id: `${symbol}:company-profile:${runId}`,
    retrieved_at: new Date().toISOString(),
    payload_hash: payloadHash,
    raw_payload: rawPayload,
    source_url: sourceUrl,
    terms_snapshot: {
      raw_html_retained: false,
      normalized_about_cached: Boolean(about),
      logo_cached: Boolean(logoSourceUrl),
      financial_evidence_authority: false,
    },
  }, { onConflict: "source_code,record_kind,external_record_id,payload_hash" }).select("id").single()
  if (record.error) throw new Error("CAPTURE_PERSISTENCE_FAILED")
  return { sourceRecordId: record.data.id as string, aboutHash }
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
    if (typeof body.portfolioId !== "string" || typeof body.securityId !== "string") return reply(400, { error: "portfolioId and securityId are required." })
    const force = body.force === true

    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session." })
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    const portfolio = await admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", auth.data.user.id).single()
    if (portfolio.error) return reply(404, { error: "Portfolio not found." })
    const holding = await admin.from("current_holdings").select("security_id").eq("portfolio_id", body.portfolioId).eq("security_id", body.securityId).maybeSingle()
    if (holding.error || !holding.data) return reply(403, { error: "Security must be an open holding." })
    const security = await admin.from("securities").select("id,symbol,asset_class,company_name").eq("id", body.securityId).single()
    if (security.error || security.data.asset_class !== "EQUITY") return reply(400, { error: "Company profile discovery is limited to held equities." })

    const cached = await admin.from("security_company_profiles").select("profile_status,about_summary,company_website_url,logo_storage_path,last_checked_at").eq("security_id", body.securityId).maybeSingle()
    if (!cached.error && cached.data && !force && (cached.data.profile_status === "READY" || cached.data.profile_status === "PARTIAL")) {
      return reply(200, { cached: true, providerCalls: 0, profile: cached.data })
    }

    const source = await admin.from("data_sources").select("is_active,entitlement_verified,configuration").eq("code", SOURCE_CODE).single()
    if (source.error || !source.data.is_active || !source.data.entitlement_verified) return reply(409, { error: "Company profile source is not enabled.", providerCalls: 0 })
    const control = await admin.from("provider_ingestion_controls").select("ingestion_enabled,policy_version").eq("source_code", SOURCE_CODE).single()
    if (control.error) return reply(503, { error: "Provider safety controls are unavailable.", providerCalls: 0 })
    if (!control.data.ingestion_enabled) return reply(409, { error: "Company profile discovery is disabled.", code: "INGESTION_DISABLED", providerCalls: 0 })

    const run = await admin.from("data_ingestion_runs").insert({
      source_code: SOURCE_CODE,
      portfolio_id: body.portfolioId,
      operation: DATA_DOMAIN,
      orchestration_type: "OWNER_PROFILE_DISCOVERY",
      trigger_source: "OWNER",
      requested_by: auth.data.user.id,
      status: "RUNNING",
      requested_count: 1,
      estimated_call_count: RESERVED_UNITS,
      reserved_call_count: RESERVED_UNITS,
      attempted_call_count: 0,
      policy_version: control.data.policy_version,
      metadata: { force, symbol: security.data.symbol, raw_html_retained: false },
    }).select("id").single()
    if (run.error) throw new Error("RUN_ACCOUNTING_FAILED")
    const runId = run.data.id as string

    const runItem = await admin.from("data_ingestion_run_items").insert({
      ingestion_run_id: runId,
      security_id: body.securityId,
      data_domain: DATA_DOMAIN,
      status: "PLANNED",
      metadata: { symbol: security.data.symbol },
    }).select("id").single()
    if (runItem.error) throw new Error("RUN_ITEM_ACCOUNTING_FAILED")
    const runItemId = runItem.data.id as string

    const reservation = await admin.rpc("reserve_provider_budget_v1", {
      p_source_code: SOURCE_CODE,
      p_ingestion_run_id: runId,
      p_reservation_key: `${runId}:${DATA_DOMAIN}`,
      p_estimated_units: RESERVED_UNITS,
      p_reservation_seconds: 900,
    })
    const reservationRow = reservation.data?.[0]
    if (reservation.error || !reservationRow?.reserved || !reservationRow.reservation_id) {
      const reasonCode = reservationRow?.reason_code ?? "BUDGET_RESERVATION_FAILED"
      await completeRunItem(admin, runItemId, "SKIPPED_BUDGET", reasonCode, 0, 0, { symbol: security.data.symbol })
      await admin.from("data_ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), reserved_call_count: 0, skipped_count: 1, error_summary: reasonCode }).eq("id", runId)
      return reply(budgetHttpStatus(reasonCode), { error: "Provider budget reservation was not granted.", code: reasonCode, providerCalls: 0, runId })
    }

    const reservationId = reservationRow.reservation_id as string
    let attempted = 0
    let failed = 0
    const call = async (operationClass: string, url: string, maxBytes: number, accept: string) => {
      attempted += 1
      const attemptedAt = new Date().toISOString()
      try {
        const result = await safeFetch(url, maxBytes, accept)
        if (!result.response.ok) throw new Error(`HTTP_${result.response.status}`)
        await recordUsage(admin, runId, runItemId, body.securityId as string, attempted, operationClass, attemptedAt, "SUCCEEDED", null)
        return result
      } catch (error) {
        failed += 1
        const safeCode = error instanceof Error && /^HTTP_\d{3}$/.test(error.message) ? "PROVIDER_HTTP_ERROR" : "PROVIDER_REQUEST_FAILED"
        await recordUsage(admin, runId, runItemId, body.securityId as string, attempted, operationClass, attemptedAt, "FAILED", safeCode)
        throw error
      }
    }

    let terminalError: Error | null = null
    let screenerUrl: string | null = null
    let about: string | null = null
    let websiteUrl: string | null = null
    let logoStoragePath: string | null = null
    let logoSourceUrl: string | null = null
    let logoContentType: string | null = null
    let sourceRecordId: string | null = null
    let aboutHash: string | null = null

    try {
      const searchUrl = `https://www.screener.in/api/company/search/?q=${encodeURIComponent(security.data.symbol)}`
      const search = await call("SCREENER_COMPANY_SEARCH", searchUrl, 256 * 1024, "application/json,text/plain;q=0.9,*/*;q=0.1")
      const searchRows = JSON.parse(new TextDecoder().decode(search.bytes)) as Array<{ url?: unknown; name?: unknown; id?: unknown }>
      const first = Array.isArray(searchRows) ? searchRows[0] : null
      if (!first || typeof first.url !== "string" || !first.url.startsWith("/company/")) throw new Error("SCREENER_MATCH_NOT_FOUND")
      screenerUrl = new URL(first.url, "https://www.screener.in").toString()

      const page = await call("SCREENER_PROFILE_FETCH", screenerUrl, MAX_PAGE_BYTES, "text/html,application/xhtml+xml;q=0.9")
      const profile = extractScreenerCompanyProfile(new TextDecoder().decode(page.bytes), screenerUrl)
      about = profile.about
      websiteUrl = profile.websiteUrl
      if (!about) throw new Error("ABOUT_NOT_FOUND")

      if (websiteUrl && attempted < RESERVED_UNITS) {
        try {
          const site = await call("OFFICIAL_SITE_FETCH", websiteUrl, MAX_PAGE_BYTES, "text/html,application/xhtml+xml;q=0.9")
          const candidates = extractLogoCandidates(new TextDecoder().decode(site.bytes), websiteUrl)
          for (const candidate of candidates.slice(0, 2)) {
            if (attempted >= RESERVED_UNITS) break
            try {
              const logo = await call("OFFICIAL_LOGO_FETCH", candidate, MAX_LOGO_BYTES, "image/png,image/jpeg,image/webp,image/svg+xml;q=0.9,*/*;q=0.1")
              let contentType = (logo.response.headers.get("content-type") ?? "").split(";")[0]!.trim().toLocaleLowerCase()
              if (contentType === "image/jpg") contentType = "image/jpeg"
              const ext = logoExtension(contentType)
              if (!ext) continue
              const safeBytes = contentType === "image/svg+xml" ? sanitizeSvg(logo.bytes) : logo.bytes
              if (!safeBytes.byteLength) continue
              const path = `${body.securityId}/logo.${ext}`
              const uploaded = await admin.storage.from("company-assets").upload(path, safeBytes, { contentType, cacheControl: "31536000", upsert: true })
              if (uploaded.error) throw new Error("LOGO_CACHE_WRITE_FAILED")
              logoStoragePath = uploaded.data.path
              logoSourceUrl = candidate
              logoContentType = contentType
              break
            } catch {
              // The attempt is already accounted. Try at most one alternate candidate within the reservation.
            }
          }
        } catch {
          // About text is still useful; logo remains a ticker-initial fallback.
        }
      }

      const capture = await persistCapture(admin, runId, security.data.symbol, screenerUrl, about, websiteUrl, logoSourceUrl)
      sourceRecordId = capture.sourceRecordId
      aboutHash = capture.aboutHash
      const now = new Date().toISOString()
      const profileStatus = about && logoStoragePath ? "READY" : about ? "PARTIAL" : "FAILED"
      const stored = await admin.from("security_company_profiles").upsert({
        security_id: body.securityId,
        profile_status: profileStatus,
        about_summary: about,
        company_website_url: websiteUrl,
        source_code: SOURCE_CODE,
        source_url: screenerUrl,
        source_record_id: sourceRecordId,
        source_about_hash: aboutHash,
        logo_storage_path: logoStoragePath,
        logo_source_url: logoSourceUrl,
        logo_content_type: logoContentType,
        about_retrieved_at: about ? now : null,
        logo_retrieved_at: logoStoragePath ? now : null,
        last_checked_at: now,
        last_safe_error_code: null,
        metadata: { raw_html_retained: false, discovery_mode: "OWNER_ONCE_UNLESS_FORCED" },
      }, { onConflict: "security_id" }).select("profile_status,about_summary,company_website_url,logo_storage_path,last_checked_at").single()
      if (stored.error) throw new Error("PROFILE_CACHE_WRITE_FAILED")
    } catch (error) {
      terminalError = error instanceof Error ? error : new Error("COMPANY_PROFILE_DISCOVERY_FAILED")
      await admin.from("security_company_profiles").upsert({
        security_id: body.securityId,
        profile_status: "FAILED",
        source_code: SOURCE_CODE,
        source_url: screenerUrl,
        last_checked_at: new Date().toISOString(),
        last_safe_error_code: terminalError.message.replace(/[^A-Z0-9_]/gi, "_").toLocaleUpperCase().slice(0, 64) || "COMPANY_PROFILE_DISCOVERY_FAILED",
        metadata: { raw_html_retained: false },
      }, { onConflict: "security_id" })
    }

    const consumedUnits = attempted - failed
    const releasedUnits = RESERVED_UNITS - attempted
    const settlement = await admin.rpc("settle_provider_budget_v1", {
      p_reservation_id: reservationId,
      p_consumed_units: consumedUnits,
      p_failed_units: failed,
      p_released_units: releasedUnits,
    })
    if (settlement.error && !terminalError) terminalError = new Error("BUDGET_SETTLEMENT_FAILED")

    try {
      await completeRunItem(admin, runItemId, terminalError ? "FAILED" : "ACCEPTED", terminalError ? "COMPANY_PROFILE_DISCOVERY_FAILED" : null, attempted, terminalError ? 0 : 1, {
        symbol: security.data.symbol,
        about_cached: Boolean(about),
        logo_cached: Boolean(logoStoragePath),
        raw_html_retained: false,
      })
    } catch (error) {
      if (!terminalError) terminalError = error instanceof Error ? error : new Error("RUN_ITEM_ACCOUNTING_FAILED")
    }

    await admin.from("data_ingestion_runs").update({
      status: terminalError ? "FAILED" : "SUCCEEDED",
      completed_at: new Date().toISOString(),
      attempted_call_count: attempted,
      fetched_count: terminalError ? 0 : 1,
      accepted_count: terminalError ? 0 : 1,
      failed_count: terminalError ? 1 : 0,
      error_summary: terminalError ? "COMPANY_PROFILE_DISCOVERY_FAILED" : null,
      metadata: {
        symbol: security.data.symbol,
        provider_attempts: attempted,
        consumed_units: consumedUnits,
        failed_units: failed,
        released_units: releasedUnits,
        about_cached: Boolean(about),
        logo_cached: Boolean(logoStoragePath),
        source_record_id: sourceRecordId,
        raw_html_retained: false,
      },
    }).eq("id", runId)

    if (terminalError) return reply(502, { error: "Company profile discovery failed.", code: terminalError.message, providerCalls: attempted, runId })

    const profile = await admin.from("security_company_profiles").select("profile_status,about_summary,company_website_url,logo_storage_path,last_checked_at").eq("security_id", body.securityId).single()
    return reply(200, {
      cached: false,
      providerCalls: attempted,
      budgetConsumed: consumedUnits,
      budgetFailed: failed,
      budgetReleased: releasedUnits,
      runId,
      profile: profile.data,
    })
  } catch (error) {
    console.error("discover-company-profile failed", error)
    return reply(500, { error: "Company profile discovery could not be completed.", code: error instanceof Error ? error.message : "UNKNOWN_ERROR" })
  }
})
