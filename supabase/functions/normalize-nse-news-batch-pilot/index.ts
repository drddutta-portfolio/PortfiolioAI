import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { buildHeadline, importanceFromItem, normalizeCompanyName, parseNseCorporateAnnouncements, toneFromItem } from "../_shared/nse-news-parser.ts"

const SOURCE_CODE = "COMPANY_EXCHANGE_FILING"
const DATA_DOMAIN = "NEWS"
const CAPTURE_KIND = "NSE_NEWS_RSS_PILOT_RESPONSE"
const MAX_ITEMS = 20

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

type RequestBody = {
  readonly portfolioId?: unknown
  readonly securityId?: unknown
  readonly captureRecordId?: unknown
}

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
  if (!supabaseUrl || !anonKey || !serviceKey) return reply(500, { error: "Server configuration is incomplete." })

  try {
    const body = await request.json() as RequestBody
    if (typeof body.portfolioId !== "string" || typeof body.securityId !== "string" || typeof body.captureRecordId !== "string") {
      return reply(400, { error: "portfolioId, securityId and captureRecordId are required." })
    }

    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session." })

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    const portfolio = await admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", auth.data.user.id).single()
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
    if (security.error || security.data.asset_class !== "EQUITY") return reply(400, { error: "N4B is limited to held equities." })

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
      definition?.mode !== "OWNER_CONTROLLED_NSE_BATCH_NORMALIZATION_PILOT_ONLY" ||
      definition?.scheduler_allowed !== false ||
      definition?.external_fetches_allowed !== false ||
      definition?.normalization_enabled !== true ||
      definition?.tone_classification_enabled !== true ||
      definition?.tone_method !== "DETERMINISTIC_ONLY" ||
      definition?.importance_classification_enabled !== true ||
      definition?.max_matched_items_per_pilot !== MAX_ITEMS
    ) {
      return reply(409, { error: "Reviewed N4B batch normalization pilot policy is not active.", externalFetches: 0 })
    }

    const capture = await admin.from("data_source_records")
      .select("id,source_code,record_kind,retrieved_at,raw_payload,payload_hash")
      .eq("id", body.captureRecordId)
      .eq("source_code", SOURCE_CODE)
      .eq("record_kind", CAPTURE_KIND)
      .single()
    if (capture.error) return reply(404, { error: "Reviewed NSE RSS capture not found.", externalFetches: 0 })

    const rawPayload = capture.data.raw_payload as Record<string, unknown>
    const xml = rawPayload?.xml
    if (typeof xml !== "string" || !xml.trim()) return reply(409, { error: "Capture does not contain usable XML.", externalFetches: 0 })

    const listing = await admin.from("security_listings")
      .select("exchange,trading_symbol,is_active")
      .eq("security_id", body.securityId)
      .eq("exchange", "NSE")
      .eq("is_active", true)
      .maybeSingle()
    if (listing.error || !listing.data) return reply(409, { error: "Active NSE listing is required.", externalFetches: 0 })

    const observations = await admin.from("security_identity_observations")
      .select("observed_name,evidence_status,confidence")
      .eq("security_id", body.securityId)
      .eq("evidence_status", "MATCHED")
      .eq("confidence", 1)
      .not("observed_name", "is", null)
    if (observations.error) return reply(502, { error: "Identity evidence could not be loaded.", externalFetches: 0 })

    const aliases = new Set<string>()
    aliases.add(normalizeCompanyName(security.data.name))
    for (const row of observations.data ?? []) {
      if (typeof row.observed_name === "string" && row.observed_name.trim()) aliases.add(normalizeCompanyName(row.observed_name))
    }
    aliases.delete("")

    const parsed = parseNseCorporateAnnouncements(xml)
    const matching = parsed
      .filter(item => aliases.has(normalizeCompanyName(item.companyName)))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

    if (matching.length === 0) {
      return reply(409, {
        error: "No deterministically matched NSE item exists for the selected holding in this capture.",
        security: security.data.symbol,
        parsedItems: parsed.length,
        externalFetches: 0,
        normalizedNewsWrites: 0,
      })
    }

    const selected = matching.slice(0, MAX_ITEMS)
    const now = new Date().toISOString()
    let insertedNewsItems = 0
    let updatedNewsItems = 0
    let insertedSourceAppearances = 0
    let duplicateSourceAppearances = 0
    const processed: Array<Record<string, unknown>> = []

    for (const item of selected) {
      const canonicalKey = await sha256Hex(`NSE|${item.sourceUrl}`)
      const dedupeKey = `URL:${item.sourceUrl.toLowerCase()}`
      const contentHash = await sha256Hex(JSON.stringify({
        companyName: item.companyName,
        sourceUrl: item.sourceUrl,
        description: item.description,
        subject: item.subject,
        publishedAt: item.publishedAt,
        category: item.category,
      }))
      const headline = buildHeadline(item)
      const importanceState = importanceFromItem(item)
      const tone = toneFromItem(item)

      const existing = await admin.from("news_items").select("id,security_id").eq("canonical_key", canonicalKey).maybeSingle()
      if (existing.error) throw new Error("NEWS_LOOKUP_FAILED")

      let newsItemId: string
      let insertedNewsItem = false
      if (existing.data) {
        if (existing.data.security_id !== body.securityId) throw new Error("CANONICAL_KEY_SECURITY_CONFLICT")
        newsItemId = existing.data.id
        const updated = await admin.from("news_items").update({
          headline,
          summary: item.description.slice(0, 4000),
          category: item.category,
          importance_state: importanceState,
          published_at: item.publishedAt,
          publication_precision: item.publicationPrecision,
          primary_source_name: "NSE",
          primary_source_url: item.sourceUrl,
          last_seen_at: now,
          updated_at: now,
          tone_state: tone.state,
          tone_method: tone.method,
          tone_confidence: tone.confidence,
          tone_reason: tone.reason,
        }).eq("id", newsItemId)
        if (updated.error) throw new Error("NEWS_UPDATE_FAILED")
        updatedNewsItems += 1
      } else {
        const inserted = await admin.from("news_items").insert({
          security_id: body.securityId,
          canonical_key: canonicalKey,
          headline,
          summary: item.description.slice(0, 4000),
          category: item.category,
          importance_state: importanceState,
          published_at: item.publishedAt,
          publication_precision: item.publicationPrecision,
          primary_source_name: "NSE",
          primary_source_url: item.sourceUrl,
          first_seen_at: now,
          last_seen_at: now,
          tone_state: tone.state,
          tone_method: tone.method,
          tone_confidence: tone.confidence,
          tone_reason: tone.reason,
        }).select("id").single()
        if (inserted.error) throw new Error("NEWS_INSERT_FAILED")
        newsItemId = inserted.data.id as string
        insertedNewsItem = true
        insertedNewsItems += 1
      }

      const existingAppearance = await admin.from("news_source_appearances")
        .select("id")
        .eq("source_code", SOURCE_CODE)
        .eq("dedupe_key", dedupeKey)
        .maybeSingle()
      if (existingAppearance.error) throw new Error("APPEARANCE_LOOKUP_FAILED")

      let insertedAppearance = false
      if (!existingAppearance.data) {
        const appearance = await admin.from("news_source_appearances").insert({
          news_item_id: newsItemId,
          source_code: SOURCE_CODE,
          data_source_record_id: capture.data.id,
          provider_record_id: item.sourceUrl,
          provider_security_identity: listing.data.trading_symbol,
          publisher_name: "NSE",
          source_url: item.sourceUrl,
          headline_as_received: headline,
          summary_as_received: item.description.slice(0, 4000),
          published_at: item.publishedAt,
          retrieved_at: capture.data.retrieved_at,
          content_hash: contentHash,
          dedupe_key: dedupeKey,
        })
        if (appearance.error) throw new Error("APPEARANCE_INSERT_FAILED")
        insertedAppearance = true
        insertedSourceAppearances += 1
      } else {
        duplicateSourceAppearances += 1
      }

      processed.push({
        newsItemId,
        insertedNewsItem,
        insertedSourceAppearance: insertedAppearance,
        category: item.category,
        importanceState,
        toneState: tone.state,
        toneMethod: tone.method,
        publishedAt: item.publishedAt,
        sourceUrl: item.sourceUrl,
      })
    }

    return reply(200, {
      mode: "NSE_BATCH_NORMALIZATION_PILOT_ONLY",
      security: security.data.symbol,
      captureRecordId: capture.data.id,
      capturePayloadHash: capture.data.payload_hash,
      parsedItems: parsed.length,
      matchedItems: matching.length,
      batchLimit: MAX_ITEMS,
      normalizedItemsProcessed: selected.length,
      insertedNewsItems,
      updatedNewsItems,
      insertedSourceAppearances,
      duplicateSourceAppearances,
      processed,
      toneClassificationEnabled: true,
      toneMethod: "DETERMINISTIC_ONLY",
      importanceClassificationEnabled: true,
      externalFetches: 0,
      linkedDocumentFetches: 0,
      schedulerEnabled: false,
      note: "N4B bounded deterministic batch normalization from previously captured NSE RSS evidence only.",
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : "NSE_BATCH_NORMALIZATION_PILOT_FAILED"
    return reply(502, { error: "NSE batch normalization pilot failed safely.", code, externalFetches: 0 })
  }
})
