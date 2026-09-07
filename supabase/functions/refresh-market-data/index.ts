import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { AngelOneProvider, loadAngelOneConfig } from "../_shared/angel-one.ts"
import { DEFAULT_CACHE_TTL_SECONDS, isFresh, MARKET_DATA_PROVIDER, type ProviderInstrument } from "../_shared/market-data.ts"
import { mapAngelInstruments } from "../_shared/instrument-mapping.ts"
import { verifiedIdentityChanged, type StoredMappingIdentity } from "../_shared/mapping-transition.ts"
import { safeError, SafeOperationalError } from "../_shared/security.ts"
import { parseSampleSecurityIds } from "../_shared/sample-request.ts"

interface RefreshRequest {
  readonly action?: unknown
  readonly portfolioId?: unknown
  readonly securityIds?: unknown
  readonly force?: unknown
}

function requestedSecuritySample(value: unknown): readonly string[] | null {
  const parsed = parseSampleSecurityIds(value)
  if (!parsed.specified) return null
  if (!parsed.valid) {
    throw new SafeOperationalError("INVALID_SECURITY_SAMPLE", "securityIds must contain between one and five UUIDs.", 400)
  }
  return parsed.ids
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const LEASE_SECONDS = 300
const PRICE_REFRESH_COOLDOWN_SECONDS = 60
const MAPPING_SYNC_COOLDOWN_SECONDS = 3600

interface AdminClient {
  rpc(name: string, parameters: Readonly<Record<string, unknown>>): PromiseLike<{ data: unknown; error: { message: string } | null }>
}

async function acquireLease(admin: AdminClient, portfolioId: string, operation: "REFRESH_PRICES" | "SYNC_MAPPINGS", holder: string) {
  const { data, error } = await admin.rpc("acquire_market_data_operation_lease", {
    p_portfolio_id: portfolioId, p_provider_code: MARKET_DATA_PROVIDER, p_operation: operation,
    p_lease_holder: holder, p_lease_seconds: LEASE_SECONDS,
  })
  if (error) throw new SafeOperationalError("LEASE_ACQUIRE_FAILED", "Market-data operation could not be started.")
  const result = Array.isArray(data) ? data[0] as { acquired?: unknown; retry_after?: unknown } | undefined : undefined
  if (result?.acquired !== true) throw new SafeOperationalError("MARKET_DATA_RATE_LIMITED", "A market-data operation is already running or is in its safety cooldown.", 429)
}

async function releaseLease(admin: AdminClient, portfolioId: string, operation: "REFRESH_PRICES" | "SYNC_MAPPINGS", holder: string, cooldown: number) {
  const { error } = await admin.rpc("release_market_data_operation_lease", {
    p_portfolio_id: portfolioId, p_provider_code: MARKET_DATA_PROVIDER, p_operation: operation,
    p_lease_holder: holder, p_cooldown_seconds: cooldown,
  })
  if (error) throw new SafeOperationalError("LEASE_RELEASE_FAILED", "Market-data operation completed but its cooldown could not be recorded.")
}

function json(status: number, body: Readonly<Record<string, unknown>>) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } })
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (request.method !== "POST") return json(405, { error: "Method not allowed." })
  const authorization = request.headers.get("Authorization")
  if (!authorization) return json(401, { error: "Authentication required." })
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json(500, { error: "Supabase server configuration is incomplete." })

  try {
    const body = await request.json() as RefreshRequest
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return json(401, { error: "Invalid authenticated session." })
    if (body.action === "READ_CACHE") {
      if (!Array.isArray(body.securityIds) || body.securityIds.some((value) => typeof value !== "string")) {
        return json(400, { error: "securityIds must be an array of UUID strings." })
      }
      const securityIds = [...new Set(body.securityIds as string[])].slice(0, 1000)
      if (!securityIds.length) return json(200, { prices: [], unresolvedSecurityIds: [] })
      const [{ data: prices, error: priceError }, { data: mappings, error: mappingError }] = await Promise.all([
        userClient.from("market_price_latest").select("security_id,price,currency,price_timestamp,retrieved_at,provider_code,market_session_status").eq("provider_code", MARKET_DATA_PROVIDER).in("security_id", securityIds),
        userClient.from("market_data_instrument_mappings").select("security_id,mapping_status").eq("provider_code", MARKET_DATA_PROVIDER).in("security_id", securityIds),
      ])
      if (priceError) throw priceError
      if (mappingError) throw mappingError
      const verifiedIds = new Set((mappings ?? []).filter((mapping) => mapping.mapping_status === "VERIFIED").map((mapping) => mapping.security_id))
      return json(200, {
        prices: (prices ?? []).map((price) => ({
          securityId: price.security_id,
          price: String(price.price),
          currency: price.currency,
          priceTimestamp: price.price_timestamp,
          retrievedAt: price.retrieved_at,
          provider: price.provider_code,
          marketSessionStatus: price.market_session_status,
        })),
        unresolvedSecurityIds: securityIds.filter((id) => !verifiedIds.has(id)),
      })
    }
    if (body.action === "SYNC_MAPPINGS") {
      if (typeof body.portfolioId !== "string") return json(400, { error: "portfolioId must be a UUID string." })
      const sampleSecurityIds = requestedSecuritySample(body.securityIds)
      const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
      const { data: portfolio, error: portfolioError } = await admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", userData.user.id).single()
      if (portfolioError || !portfolio) return json(404, { error: "Portfolio not found." })
      const leaseHolder = crypto.randomUUID()
      await acquireLease(admin, portfolio.id, "SYNC_MAPPINGS", leaseHolder)
      try {
      const { data: holdings, error: holdingsError } = await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id", portfolio.id)
      if (holdingsError) throw holdingsError
      const openSecurityIds = (holdings ?? []).filter((holding) => !/^[-+]?0(?:\.0+)?$/u.test(String(holding.current_quantity))).map((holding) => holding.security_id)
      const openSecurityIdSet = new Set(openSecurityIds)
      if (sampleSecurityIds?.some((securityId) => !openSecurityIdSet.has(securityId))) {
        throw new SafeOperationalError("INVALID_MAPPING_SAMPLE", "Every sampled security must be an open holding in this portfolio.", 400)
      }
      const securityIds = sampleSecurityIds ?? openSecurityIds
      const { data: securities, error: securitiesError } = securityIds.length
        ? await admin.from("securities").select("id,symbol,exchange,asset_class").in("id", securityIds)
        : { data: [], error: null }
      if (securitiesError) throw securitiesError
      const masterRetrievedAt = new Date().toISOString()
      const masterResponse = await fetch("https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json")
      if (!masterResponse.ok) throw new Error(`Angel One instrument master failed (${masterResponse.status}).`)
      const master = await masterResponse.json() as readonly Readonly<Record<string, unknown>>[]
      const resolved = mapAngelInstruments((securities ?? []).map((security) => ({ id: security.id, symbol: security.symbol, exchange: security.exchange, assetClass: security.asset_class })), master, masterRetrievedAt)
      const { data: existingRows, error: existingError } = securityIds.length
        ? await admin.from("market_data_instrument_mappings").select("id,security_id,mapping_status,provider_instrument_id,exchange,trading_symbol").eq("provider_code", MARKET_DATA_PROVIDER).in("security_id", securityIds)
        : { data: [], error: null }
      if (existingError) throw existingError
      const existingBySecurity = new Map((existingRows ?? []).map((row) => [row.security_id, row as StoredMappingIdentity & { security_id: string }]))
      const quarantined = resolved.filter((candidate) => verifiedIdentityChanged(existingBySecurity.get(candidate.securityId), candidate))
      const accepted = resolved.filter((candidate) => !quarantined.includes(candidate))
      if (quarantined.length) {
        const { error: reviewError } = await admin.from("market_data_mapping_reviews").upsert(quarantined.map((candidate) => {
          const existing = existingBySecurity.get(candidate.securityId)!
          return {
            mapping_id: existing.id, security_id: candidate.securityId, provider_code: MARKET_DATA_PROVIDER,
            proposed_provider_instrument_id: candidate.providerInstrumentId, proposed_exchange: candidate.exchange,
            proposed_trading_symbol: candidate.tradingSymbol, proposed_provider_instrument_type: candidate.providerInstrumentType,
            proposed_mapping_status: candidate.mappingStatus, proposed_match_basis: candidate.matchBasis,
            evidence: candidate.evidence, detected_at: masterRetrievedAt, review_status: "PENDING",
          }
        }), { onConflict: "mapping_id,review_status", ignoreDuplicates: true })
        if (reviewError) throw reviewError
      }
      if (accepted.length) {
        const { error: upsertError } = await admin.from("market_data_instrument_mappings").upsert(accepted.map((mapping) => ({
          security_id: mapping.securityId,
          provider_code: MARKET_DATA_PROVIDER,
          provider_instrument_id: mapping.providerInstrumentId,
          exchange: mapping.exchange,
          trading_symbol: mapping.tradingSymbol,
          provider_instrument_type: mapping.providerInstrumentType,
          mapping_status: mapping.mappingStatus,
          match_basis: mapping.matchBasis,
          evidence: mapping.evidence,
          instrument_master_as_of: masterRetrievedAt.slice(0, 10),
          verified_at: mapping.mappingStatus === "VERIFIED" ? masterRetrievedAt : null,
        })), { onConflict: "security_id,provider_code" })
        if (upsertError) throw upsertError
      }
      return json(200, {
        mapped: accepted.filter((mapping) => mapping.mappingStatus === "VERIFIED").length,
        ambiguous: accepted.filter((mapping) => mapping.mappingStatus === "AMBIGUOUS").length,
        unresolved: accepted.filter((mapping) => mapping.mappingStatus === "UNRESOLVED").length,
        quarantined: quarantined.length,
        unsupported: securityIds.length - resolved.length,
      })
      } finally {
        await releaseLease(admin, portfolio.id, "SYNC_MAPPINGS", leaseHolder, MAPPING_SYNC_COOLDOWN_SECONDS)
      }
    }
    if (body.action !== "REFRESH") return json(400, { error: "action must be READ_CACHE, SYNC_MAPPINGS, or REFRESH." })
    if (typeof body.portfolioId !== "string") return json(400, { error: "portfolioId must be a UUID string." })
    const sampleSecurityIds = requestedSecuritySample(body.securityIds)
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    const { data: portfolio, error: portfolioError } = await admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", userData.user.id).single()
    if (portfolioError || !portfolio) return json(404, { error: "Portfolio not found." })
    const leaseHolder = crypto.randomUUID()
    await acquireLease(admin, portfolio.id, "REFRESH_PRICES", leaseHolder)
    try {

    const { data: holdings, error: holdingsError } = await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id", portfolio.id)
    if (holdingsError) throw holdingsError
    const openSecurityIds = (holdings ?? []).filter((holding) => !/^[-+]?0(?:\.0+)?$/u.test(String(holding.current_quantity))).map((holding) => holding.security_id)
    const openSecurityIdSet = new Set(openSecurityIds)
    if (sampleSecurityIds?.some((securityId) => !openSecurityIdSet.has(securityId))) {
      throw new SafeOperationalError("INVALID_SECURITY_SAMPLE", "Every sampled security must be an open holding in this portfolio.", 400)
    }
    const targetSecurityIds = sampleSecurityIds ?? openSecurityIds
    const { data: mappings, error: mappingError } = targetSecurityIds.length
      ? await admin.from("market_data_instrument_mappings").select("id,security_id,provider_instrument_id,exchange,trading_symbol,mapping_status").eq("provider_code", MARKET_DATA_PROVIDER).in("security_id", targetSecurityIds)
      : { data: [], error: null }
    if (mappingError) throw mappingError
    const verified: ProviderInstrument[] = (mappings ?? []).flatMap((mapping) =>
      mapping.mapping_status === "VERIFIED" && mapping.provider_instrument_id && mapping.exchange && mapping.trading_symbol
        ? [{ mappingId: mapping.id, securityId: mapping.security_id, providerInstrumentId: mapping.provider_instrument_id, exchange: mapping.exchange, tradingSymbol: mapping.trading_symbol }]
        : [])
    const unresolved = targetSecurityIds.length - verified.length
    const { data: cached, error: cachedError } = verified.length
      ? await admin.from("market_price_latest").select("security_id,retrieved_at").eq("provider_code", MARKET_DATA_PROVIDER).in("security_id", verified.map((item) => item.securityId))
      : { data: [], error: null }
    if (cachedError) throw cachedError
    const freshIds = new Set((cached ?? []).filter((item) => isFresh(item.retrieved_at, new Date(), DEFAULT_CACHE_TTL_SECONDS)).map((item) => item.security_id))
    // `force` is intentionally ignored: browser input cannot bypass cache or provider cooldown safety.
    const toFetch = verified.filter((instrument) => !freshIds.has(instrument.securityId))

    const { data: run, error: runError } = await admin.from("market_data_refresh_runs").insert({
      portfolio_id: portfolio.id,
      provider_code: MARKET_DATA_PROVIDER,
      requested_by: userData.user.id,
      status: toFetch.length ? "RUNNING" : "SKIPPED_FRESH",
      requested_security_count: targetSecurityIds.length,
      cached_security_count: verified.length - toFetch.length,
      unresolved_security_count: unresolved,
      completed_at: toFetch.length ? null : new Date().toISOString(),
    }).select("id").single()
    if (runError) throw runError
    if (!toFetch.length) return json(200, { runId: run.id, fetched: 0, cached: verified.length, unresolved })

    try {
      const observations = await new AngelOneProvider(loadAngelOneConfig()).getLatestPrices(toFetch)
      if (observations.length) {
        const { error: priceError } = await admin.from("market_price_latest").upsert(observations.map((item) => ({
          security_id: item.securityId,
          provider_code: item.providerCode,
          mapping_id: item.mappingId,
          price: item.price,
          currency: "INR",
          price_timestamp: item.priceTimestamp,
          retrieved_at: item.retrievedAt,
          market_session_status: item.marketSessionStatus,
          previous_close: item.previousClose,
          day_open: item.dayOpen,
          day_high: item.dayHigh,
          day_low: item.dayLow,
          provenance: item.provenance,
        })), { onConflict: "security_id,provider_code" })
        if (priceError) throw priceError
      }
      const failed = toFetch.length - observations.length
      await admin.from("market_data_refresh_runs").update({
        status: failed ? "PARTIAL" : "SUCCEEDED",
        completed_at: new Date().toISOString(),
        fetched_security_count: observations.length,
        failed_security_count: failed,
      }).eq("id", run.id)
      return json(200, { runId: run.id, fetched: observations.length, cached: verified.length - toFetch.length, unresolved, failed })
    } catch (error) {
      const safe = safeError(error)
      await admin.from("market_data_refresh_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), error_summary: safe.code }).eq("id", run.id)
      throw safe
    }
    } finally {
      await releaseLease(admin, portfolio.id, "REFRESH_PRICES", leaseHolder, PRICE_REFRESH_COOLDOWN_SECONDS)
    }
  } catch (error) {
    const safe = safeError(error)
    return json(safe.status, { error: safe.publicMessage, code: safe.code })
  }
})
