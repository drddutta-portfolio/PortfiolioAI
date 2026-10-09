import { sameQualifiedHistoryNumeric } from "../_shared/v14-history-numeric-equality.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { AngelOneProvider, loadAngelOneConfig, type AngelDailyCandle } from "../_shared/angel-one.ts"
import { MARKET_DATA_PROVIDER, type ProviderInstrument } from "../_shared/market-data.ts"
import { SafeOperationalError, safeError } from "../_shared/security.ts"
import { assertP4MarketHistoryRequest, P4_MARKET_HISTORY_CONFIRMATION } from "../_shared/p4-market-history-guard.ts"
import { consumeP4ExecutionGrant } from "../_shared/p4-execution-grant.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-portfolioai-classification-token",
}
const LEASE_SECONDS = 300
const COOLDOWN_SECONDS = 60
const HISTORY_DAYS = 400
const CONFIRMATION = "OWNER_CONFIRMED_MARKET_HISTORY_REFRESH"
const DAY = 86_400_000

type RequestBody = {
  readonly action?: unknown
  readonly portfolioId?: unknown
  readonly securityId?: unknown
  readonly confirmation?: unknown
  readonly requestFrom?: unknown
  readonly requestTo?: unknown
  readonly grantId?: unknown
}
type AdminClient = ReturnType<typeof createClient>
type MetricRow = {
  readonly metric_code: "PRICE_MOMENTUM_12M" | "PRICE_MOMENTUM_6M" | "MAX_DRAWDOWN_1Y" | "VOLATILITY_1Y"
  readonly numeric_value: number
  readonly unit: "PERCENT" | "PERCENT_ABSOLUTE_DRAWDOWN"
  readonly lookback_start: string | null
  readonly lookback_end: string
  readonly derivation: Record<string, unknown>
}

function json(status: number, body: Readonly<Record<string, unknown>>) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } })
}

function isLocalSupabaseUrl(value: string) {
  try {
    const url = new URL(value)
    return ["localhost", "127.0.0.1"].includes(url.hostname) || (url.hostname === "kong" && url.port === "8000")
  } catch { return false }
}

function kolkataDateTime(date: Date) {
  const local = new Date(date.getTime() + 5.5 * 60 * 60_000)
  return `${local.toISOString().slice(0, 10)} ${local.toISOString().slice(11, 16)}`
}

function candleDate(candle: AngelDailyCandle) {
  return candle.periodStart.slice(0, 10)
}

function firstAtOrAfter(candles: readonly AngelDailyCandle[], targetMs: number) {
  return candles.find((candle) => Date.parse(candle.periodStart) >= targetMs) ?? null
}

function deriveMetrics(candles: readonly AngelDailyCandle[]): MetricRow[] {
  if (candles.length < 120) return []
  const sorted = [...candles].sort((a, b) => a.periodStart.localeCompare(b.periodStart))
  const latest = sorted.at(-1)!
  const latestMs = Date.parse(latest.periodStart)
  const latestClose = Number(latest.close)
  if (!Number.isFinite(latestClose) || latestClose <= 0) return []
  const result: MetricRow[] = []

  const momentum = (days: number, code: "PRICE_MOMENTUM_12M" | "PRICE_MOMENTUM_6M") => {
    const target = latestMs - days * DAY
    const anchor = firstAtOrAfter(sorted, target)
    if (!anchor || Date.parse(anchor.periodStart) - target > 14 * DAY) return
    const anchorClose = Number(anchor.close)
    if (!Number.isFinite(anchorClose) || anchorClose <= 0) return
    result.push({
      metric_code: code,
      numeric_value: ((latestClose / anchorClose) - 1) * 100,
      unit: "PERCENT",
      lookback_start: candleDate(anchor),
      lookback_end: candleDate(latest),
      derivation: {
        method: "CLOSE_TO_CLOSE_TOTAL_RETURN",
        requested_lookback_days: days,
        anchor_policy: "FIRST_TRADING_DAY_ON_OR_AFTER_CALENDAR_TARGET_WITH_14_DAY_TOLERANCE",
        start_close: anchor.close,
        end_close: latest.close,
      },
    })
  }
  momentum(365, "PRICE_MOMENTUM_12M")
  momentum(182, "PRICE_MOMENTUM_6M")

  const oneYear = sorted.filter((candle) => Date.parse(candle.periodStart) >= latestMs - 365 * DAY)
  if (oneYear.length >= 120) {
    let peak = Number(oneYear[0].close)
    let maxDrawdown = 0
    for (const candle of oneYear) {
      const close = Number(candle.close)
      if (!Number.isFinite(close) || close <= 0) continue
      if (close > peak) peak = close
      const drawdown = peak > 0 ? ((peak - close) / peak) * 100 : 0
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
    }
    result.push({
      metric_code: "MAX_DRAWDOWN_1Y",
      numeric_value: maxDrawdown,
      unit: "PERCENT_ABSOLUTE_DRAWDOWN",
      lookback_start: candleDate(oneYear[0]),
      lookback_end: candleDate(latest),
      derivation: { method: "MAX_CLOSE_TO_CLOSE_DRAWDOWN", trading_observations: oneYear.length },
    })

    const logReturns: number[] = []
    for (let index = 1; index < oneYear.length; index += 1) {
      const prior = Number(oneYear[index - 1].close)
      const current = Number(oneYear[index].close)
      if (prior > 0 && current > 0 && Number.isFinite(prior) && Number.isFinite(current)) logReturns.push(Math.log(current / prior))
    }
    if (logReturns.length >= 60) {
      const mean = logReturns.reduce((sum, value) => sum + value, 0) / logReturns.length
      const variance = logReturns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, logReturns.length - 1)
      result.push({
        metric_code: "VOLATILITY_1Y",
        numeric_value: Math.sqrt(variance) * Math.sqrt(252) * 100,
        unit: "PERCENT",
        lookback_start: candleDate(oneYear[0]),
        lookback_end: candleDate(latest),
        derivation: { method: "ANNUALIZED_STDDEV_DAILY_LOG_RETURNS", annualization_factor: 252, daily_returns: logReturns.length },
      })
    }
  }
  return result
}

async function acquireLease(admin: AdminClient, portfolioId: string, holder: string) {
  const { data, error } = await admin.rpc("acquire_market_data_operation_lease", {
    p_portfolio_id: portfolioId,
    p_provider_code: MARKET_DATA_PROVIDER,
    p_operation: "REFRESH_HISTORY",
    p_lease_holder: holder,
    p_lease_seconds: LEASE_SECONDS,
  })
  if (error) throw new SafeOperationalError("LEASE_ACQUIRE_FAILED", "Historical market-data refresh could not be started.")
  const row = Array.isArray(data) ? data[0] as { acquired?: unknown } | undefined : undefined
  if (row?.acquired !== true) throw new SafeOperationalError("MARKET_DATA_RATE_LIMITED", "Another historical market-data operation is running or cooling down.", 429)
}

async function releaseLease(admin: AdminClient, portfolioId: string, holder: string, cooldownSeconds = COOLDOWN_SECONDS) {
  const { error } = await admin.rpc("release_market_data_operation_lease", {
    p_portfolio_id: portfolioId,
    p_provider_code: MARKET_DATA_PROVIDER,
    p_operation: "REFRESH_HISTORY",
    p_lease_holder: holder,
    p_cooldown_seconds: cooldownSeconds,
  })
  if (error) throw new SafeOperationalError("LEASE_RELEASE_FAILED", "Historical refresh completed but its cooldown could not be recorded.")
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (request.method !== "POST") return json(405, { error: "Method not allowed." })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json(500, { error: "Supabase server configuration is incomplete." })

  try {
    const body = await request.json() as RequestBody
    const p4Internal = body.action === "P4_PLAN" || body.action === "P4_EXECUTE"
    const p4bInternal = body.action === "P4B_PLAN" || body.action === "P4B_EXECUTE"
    const boundedInternal = p4Internal || p4bInternal
    if (body.action !== "PLAN" && body.action !== "EXECUTE" && !boundedInternal) return json(400, { error: "Unsupported history action." })
    if (typeof body.portfolioId !== "string" || typeof body.securityId !== "string") return json(400, { error: "portfolioId and securityId are required." })

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    let requestedBy: string

    if (boundedInternal) {
      if (p4Internal) {
        const guard = assertP4MarketHistoryRequest({
          supabaseUrl,
          portfolioId: body.portfolioId,
          securityId: body.securityId,
          confirmation: body.confirmation,
        })
        if (!guard.ok) return json(409, { error: guard.message, code: guard.code, providerCalls: 0 })
      } else {
        const ref = (() => { try { return new URL(supabaseUrl).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1] ?? null } catch { return null } })()
        if (ref !== "lrgpjimipfkyoqbpsqzz" || body.portfolioId !== "6193a4aa-3235-4057-bddc-209fcf443fc2") {
          return json(409, { error: "P4B history scope mismatch.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 })
        }
      }
      const token = request.headers.get("x-portfolioai-classification-token")
      if (token) {
        const verified = await admin.rpc("verify_trendlyne_classification_refresh_token_v1", { p_token: token })
        if (verified.error || verified.data !== true) return json(401, { error: "Internal authentication failed.", providerCalls: 0 })
      } else {
        const grant = await consumeP4ExecutionGrant(admin, {
          grantId: body.grantId,
          action: String(body.action),
          portfolioId: body.portfolioId as string,
          securityId: body.securityId as string,
        })
        if (!grant.ok) return json(401, { error: grant.message, code: grant.code, providerCalls: 0 })
      }
      const { data: portfolio, error: portfolioError } = await admin.from("portfolios").select("id,user_id").eq("id", body.portfolioId).single()
      if (portfolioError || !portfolio) return json(404, { error: "Portfolio not found.", providerCalls: 0 })
      requestedBy = portfolio.user_id as string
    } else {
      const authorization = request.headers.get("Authorization")
      if (!authorization) return json(401, { error: "Authentication required." })
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
      const { data: userData, error: userError } = await userClient.auth.getUser()
      if (userError || !userData.user) return json(401, { error: "Invalid authenticated session." })
      const { data: portfolio, error: portfolioError } = await admin.from("portfolios").select("id,user_id").eq("id", body.portfolioId).eq("user_id", userData.user.id).single()
      if (portfolioError || !portfolio) return json(404, { error: "Portfolio not found." })
      requestedBy = userData.user.id
    }

    const portfolio = { id: body.portfolioId as string }
    const { data: holding, error: holdingError } = await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id", portfolio.id).eq("security_id", body.securityId).maybeSingle()
    if (holdingError || !holding || /^[-+]?0(?:\.0+)?$/u.test(String(holding.current_quantity))) return json(403, { error: "Historical refresh is limited to open holdings." })
    const { data: security, error: securityError } = await admin.from("securities").select("id,symbol,name,asset_class").eq("id", body.securityId).single()
    if (securityError || !security || security.asset_class !== "EQUITY") return json(400, { error: "Historical refresh currently supports held equities only." })
    const { data: mapping, error: mappingError } = await admin.from("market_data_instrument_mappings")
      .select("id,security_id,provider_instrument_id,exchange,trading_symbol,mapping_status")
      .eq("security_id", body.securityId).eq("provider_code", MARKET_DATA_PROVIDER).maybeSingle()
    if (mappingError || !mapping || mapping.mapping_status !== "VERIFIED" || !mapping.provider_instrument_id || !mapping.exchange || !mapping.trading_symbol) {
      return json(409, { error: "A verified Angel One instrument mapping is required." })
    }

    const instrument: ProviderInstrument = {
      mappingId: mapping.id,
      securityId: mapping.security_id,
      providerInstrumentId: mapping.provider_instrument_id,
      exchange: mapping.exchange,
      tradingSymbol: mapping.trading_symbol,
    }
    const a2Window = typeof body.requestFrom === "string" && typeof body.requestTo === "string"
    if ((body.requestFrom === undefined) !== (body.requestTo === undefined)) return json(400, { error: "requestFrom and requestTo must be supplied together.", code: "PROVIDER_SCHEMA_MISMATCH" })
    if (a2Window) {
      if (!/^\d{4}-\d{2}-\d{2}$/u.test(body.requestFrom as string) || !/^\d{4}-\d{2}-\d{2}$/u.test(body.requestTo as string)) return json(400, { error: "History window must use ISO dates.", code: "PROVIDER_SCHEMA_MISMATCH" })
      if (!boundedInternal) {
        const local = isLocalSupabaseUrl(supabaseUrl)
        if (!local) return json(409, { error: "Explicit history windows are restricted to bounded internal execution in hosted Development.", code: "UNEXPECTED_PRODUCTION_DB_TARGET", providerCalls: 0 })
      }
    }
    const to = a2Window ? new Date(`${body.requestTo as string}T00:00:00.000Z`) : new Date()
    const from = a2Window ? new Date(`${body.requestFrom as string}T00:00:00.000Z`) : new Date(to.getTime() - HISTORY_DAYS * DAY)
    if (!Number.isFinite(from.valueOf()) || !Number.isFinite(to.valueOf()) || from > to || to.getTime() - from.getTime() > HISTORY_DAYS * DAY) return json(400, { error: "A2 history window is invalid or exceeds the reviewed adapter maximum.", code: "CALL_BUDGET_EXCEEDED" })
    const latestExisting = await admin.from("market_price_history").select("period_start").eq("security_id", body.securityId).eq("provider_code", MARKET_DATA_PROVIDER).eq("interval", "ONE_DAY").order("period_start", { ascending: false }).limit(1).maybeSingle()
    if (latestExisting.error) throw latestExisting.error

    if (body.action === "PLAN" || body.action === "P4_PLAN" || body.action === "P4B_PLAN") {
      if (boundedInternal) {
        try { loadAngelOneConfig() } catch { return json(409, { error: "Angel One runtime configuration is incomplete.", code: "AUTH_OR_CONFIG_ERROR", providerCalls: 0 }) }
      }
      return json(200, {
      mode: "MARKET_HISTORY_REFRESH_PLAN",
      providerCalls: 0,
      security: security.symbol,
      company: security.name,
      provider: MARKET_DATA_PROVIDER,
      interval: "ONE_DAY",
      historyDays: Math.ceil((to.getTime() - from.getTime()) / DAY),
      estimatedProviderCalls: 1,
      latestExistingCandle: latestExisting.data?.period_start ?? null,
      metricsAfterRefresh: ["PRICE_MOMENTUM_12M", "PRICE_MOMENTUM_6M", "MAX_DRAWDOWN_1Y", "VOLATILITY_1Y"],
      note: "Planning consumes zero provider calls. Relative strength remains unavailable until benchmark history is implemented.",
    })
    }

    const requiredConfirmation = p4Internal ? P4_MARKET_HISTORY_CONFIRMATION : p4bInternal ? "OWNER_CONFIRMED_POST_D_P4B_MARKET_HISTORY" : CONFIRMATION
    if (body.confirmation !== requiredConfirmation) return json(409, { error: "Explicit owner confirmation is required.", providerCalls: 0 })
    const leaseHolder = crypto.randomUUID()
    await acquireLease(admin, portfolio.id, leaseHolder)
    const { data: run, error: runError } = await admin.from("market_data_refresh_runs").insert({
      portfolio_id: portfolio.id,
      provider_code: MARKET_DATA_PROVIDER,
      requested_by: requestedBy,
      status: "RUNNING",
      requested_security_count: 1,
      metadata: { operation: "REFRESH_HISTORY", security_id: security.id, symbol: security.symbol, interval: "ONE_DAY", requested_from: body.requestFrom ?? null, requested_to: body.requestTo ?? null, history_days: Math.ceil((to.getTime() - from.getTime()) / DAY) },
    }).select("id").single()
    if (runError) throw runError

    const transport={authenticationRequests:0,historyRequests:0,successfulResponses:0}
    const observer={
      onAttempt:(kind:"AUTHENTICATE"|"HISTORY"|"QUOTE")=>{if(kind==="AUTHENTICATE")transport.authenticationRequests+=1;else if(kind==="HISTORY")transport.historyRequests+=1},
      onResponse:(kind:"AUTHENTICATE"|"HISTORY"|"QUOTE",ok:boolean)=>{if(ok&&(kind==="AUTHENTICATE"||kind==="HISTORY"))transport.successfulResponses+=1},
    }
    try {
      const provider=new AngelOneProvider(loadAngelOneConfig(),observer)
      const candles = p4bInternal
        ? await provider.getDailyHistoryNoRetry(instrument, kolkataDateTime(from), kolkataDateTime(to))
        : await provider.getDailyHistory(instrument, kolkataDateTime(from), kolkataDateTime(to))
      if (!candles.length) throw new SafeOperationalError("ANGEL_HISTORY_EMPTY", "Angel One returned no daily history for the verified instrument.", 502)
      const historyRows = candles.map((candle) => ({
        security_id: security.id,
        provider_code: MARKET_DATA_PROVIDER,
        mapping_id: instrument.mappingId,
        interval: "ONE_DAY",
        period_start: candle.periodStart,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        adjusted_close: null,
        volume: candle.volume,
        retrieved_at: candle.retrievedAt,
        provenance: {
          endpoint: "/rest/secure/angelbroking/historical/v1/getCandleData",
          interval: "ONE_DAY",
          exchange: instrument.exchange,
          trading_symbol: instrument.tradingSymbol,
          symbol_token: instrument.providerInstrumentId,
          requested_from: kolkataDateTime(from),
          requested_to: kolkataDateTime(to),
        },
      }))
      // Fail closed on corrections: an existing OHLCV row is immutable in this legacy
      // control plane. Corrections require a source-bound supersession path.
      const sessionStarts = historyRows.map(row => row.period_start)
      const { data: retainedRows, error: retainedError } = await admin
        .from("market_price_history")
        .select("period_start,open,high,low,close,volume")
        .eq("security_id", security.id)
        .eq("provider_code", MARKET_DATA_PROVIDER)
        .eq("interval", "ONE_DAY")
        .in("period_start", sessionStarts)
      if (retainedError) throw retainedError
      const retainedByDate = new Map((retainedRows ?? []).map(row => [new Date(row.period_start).toISOString(), row]))
      for (const incoming of historyRows) {
        const previous = retainedByDate.get(new Date(incoming.period_start).toISOString())
        if (!previous) continue
        for (const field of ["open", "high", "low", "close", "volume"] as const) {
          if (!sameQualifiedHistoryNumeric(previous[field], incoming[field])) {
            throw new SafeOperationalError("HISTORY_CORRECTION_REQUIRES_REVIEW",
              "An existing history session conflicts with provider data; source-bound correction review is required.", 409)
          }
        }
      }
      const { error: historyError } = await admin.from("market_price_history").upsert(historyRows, { onConflict: "security_id,provider_code,interval,period_start", ignoreDuplicates: true })
      if (historyError) throw historyError
      // Re-read after ON CONFLICT DO NOTHING: a concurrent writer may have
      // inserted a different bar after our pre-check. Never silently accept it.
      const { data: finalBars, error: finalError } = await admin
        .from("market_price_history")
        .select("period_start,open,high,low,close,volume")
        .eq("security_id", security.id)
        .eq("provider_code", MARKET_DATA_PROVIDER)
        .eq("interval", "ONE_DAY")
        .in("period_start", sessionStarts)
      if (finalError) throw finalError
      const finalByDate = new Map((finalBars ?? []).map(row => [new Date(row.period_start).toISOString(), row]))
      for (const incoming of historyRows) {
        const persisted = finalByDate.get(new Date(incoming.period_start).toISOString())
        if (!persisted || (["open", "high", "low", "close", "volume"] as const).some(field =>
          !sameQualifiedHistoryNumeric(persisted[field], incoming[field]))) {
          throw new SafeOperationalError("HISTORY_CONCURRENT_CORRECTION_REQUIRES_REVIEW",
            "Concurrent price revision or missing persisted session requires a source-bound review.", 409)
        }
      }

      const metrics = deriveMetrics(candles)
      if (metrics.length) {
        const retrievedAt = candles.at(-1)!.retrievedAt
        const freshUntil = new Date(Date.parse(retrievedAt) + 48 * 60 * 60_000).toISOString()
        const asOfDate = candleDate(candles.at(-1)!)
        const { error: metricError } = await admin.from("market_metric_observations").upsert(metrics.map((metric) => ({
          security_id: security.id,
          provider_code: MARKET_DATA_PROVIDER,
          metric_code: metric.metric_code,
          numeric_value: metric.numeric_value,
          unit: metric.unit,
          as_of_date: asOfDate,
          lookback_start: metric.lookback_start,
          lookback_end: metric.lookback_end,
          retrieved_at: retrievedAt,
          fresh_until: freshUntil,
          evidence_status: "AVAILABLE",
          derivation: { ...metric.derivation, source_interval: "ONE_DAY", source_provider: MARKET_DATA_PROVIDER, source_candles: candles.length },
        })), { onConflict: "security_id,provider_code,metric_code,as_of_date" })
        if (metricError) throw metricError
      }

      await admin.from("market_data_refresh_runs").update({
        status: "SUCCEEDED",
        completed_at: new Date().toISOString(),
        fetched_security_count: 1,
        metadata: { operation: "REFRESH_HISTORY", security_id: security.id, symbol: security.symbol, interval: "ONE_DAY", candles: candles.length, derived_metrics: metrics.map((metric) => metric.metric_code), transport },
      }).eq("id", run.id)
      return json(200, {
        mode: "MARKET_HISTORY_REFRESH",
        runId: run.id,
        security: security.symbol,
        providerCalls: transport.historyRequests,
        providerAuthenticationRequests: transport.authenticationRequests,
        attemptedHistoryRequests: transport.historyRequests,
        successfulTransportResponses: transport.successfulResponses,
        candlesStored: candles.length,
        historyStart: candles[0].periodStart,
        historyEnd: candles.at(-1)!.periodStart,
        derivedMetrics: metrics.map((metric) => ({ code: metric.metric_code, value: metric.numeric_value, unit: metric.unit })),
        note: "Angel One remains market-data authority. No official score run or portfolio mutation was performed.",
      })
    } catch (error) {
      const operational = safeError(error)
      await admin.from("market_data_refresh_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), failed_security_count: 1, error_summary: operational.code, metadata: { operation: "REFRESH_HISTORY", security_id: security.id, symbol: security.symbol, interval: "ONE_DAY", requested_from: body.requestFrom ?? null, requested_to: body.requestTo ?? null, transport } }).eq("id", run.id)
      return json(operational.status,{error:operational.message,code:operational.code,providerCalls:transport.historyRequests,providerAuthenticationRequests:transport.authenticationRequests,attemptedHistoryRequests:transport.historyRequests,successfulTransportResponses:transport.successfulResponses})
    } finally {
      await releaseLease(admin, portfolio.id, leaseHolder, boundedInternal ? 1 : COOLDOWN_SECONDS)
    }
  } catch (error) {
    const operational = safeError(error)
    return json(operational.status, { error: operational.message, code: operational.code })
  }
})
