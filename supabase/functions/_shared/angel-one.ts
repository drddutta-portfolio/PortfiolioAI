import {
  chunk,
  exactDecimal,
  MARKET_DATA_PROVIDER,
  parseAngelTimestamp,
  QUOTE_BATCH_SIZE,
  type LatestPriceObservation,
  type MarketDataProvider,
  type ProviderInstrument,
} from "./market-data.ts"
import { SAFE_PROVIDER_FAILURE, SafeOperationalError } from "./security.ts"

export interface AngelTransportObserver {
  onAttempt?(kind:"AUTHENTICATE"|"HISTORY"|"QUOTE"):void
  onResponse?(kind:"AUTHENTICATE"|"HISTORY"|"QUOTE",ok:boolean):void
}

interface AngelOneConfig {
  readonly apiKey: string
  readonly clientCode: string
  readonly pin: string
  readonly totpSecret: string
  readonly clientLocalIp: string
  readonly clientPublicIp: string
  readonly macAddress: string
}

interface AngelQuote {
  readonly exchange?: unknown
  readonly tradingSymbol?: unknown
  readonly symbolToken?: unknown
  readonly ltp?: unknown
  readonly open?: unknown
  readonly high?: unknown
  readonly low?: unknown
  readonly close?: unknown
  readonly exchFeedTime?: unknown
  readonly exchTradeTime?: unknown
}

interface AngelResponse<T> {
  readonly status?: boolean
  readonly message?: string
  readonly errorcode?: string
  readonly data?: T
}

export interface AngelDailyCandle {
  readonly periodStart: string
  readonly open: string
  readonly high: string
  readonly low: string
  readonly close: string
  readonly volume: string | null
  readonly retrievedAt: string
}

const SESSION_TTL_MS = 20 * 60_000
const SESSION_SAFETY_MS = 60_000
const SESSION_ERROR_CODES = new Set(["AG8001", "AG8002", "AG8003", "AG8004", "AG8005"])
const TRANSIENT_HISTORY_ERROR_CODES = new Set(["AB1004"])

let cachedJwt: { readonly token: string; readonly expiresAt: number } | null = null

function required(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing required Supabase secret: ${name}.`)
  return value
}

export function loadAngelOneConfig(): AngelOneConfig {
  return {
    apiKey: required("ANGEL_ONE_API_KEY"),
    clientCode: required("ANGEL_ONE_CLIENT_CODE"),
    pin: required("ANGEL_ONE_PIN"),
    totpSecret: required("ANGEL_ONE_TOTP_SECRET"),
    clientLocalIp: required("ANGEL_ONE_CLIENT_LOCAL_IP"),
    clientPublicIp: required("ANGEL_ONE_CLIENT_PUBLIC_IP"),
    macAddress: required("ANGEL_ONE_MAC_ADDRESS"),
  }
}

function decodeBase32(value: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const normalized = value.toUpperCase().replace(/=+$/u, "").replace(/\s+/gu, "")
  let bits = ""
  for (const character of normalized) {
    const index = alphabet.indexOf(character)
    if (index < 0) throw new Error("ANGEL_ONE_TOTP_SECRET is not valid Base32.")
    bits += index.toString(2).padStart(5, "0")
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8))
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2)
  return bytes
}

async function totp(secret: string, at = Date.now()) {
  const counter = Math.floor(at / 30_000)
  const message = new Uint8Array(8)
  new DataView(message.buffer).setBigUint64(0, BigInt(counter))
  const key = await crypto.subtle.importKey("raw", decodeBase32(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"])
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, message))
  const offset = signature[signature.length - 1]! & 0x0f
  const code = ((signature[offset]! & 0x7f) << 24)
    | (signature[offset + 1]! << 16)
    | (signature[offset + 2]! << 8)
    | signature[offset + 3]!
  return String(code % 1_000_000).padStart(6, "0")
}

function headers(config: AngelOneConfig, jwt?: string) {
  const result: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-UserType": "USER",
    "X-SourceID": "WEB",
    "X-ClientLocalIP": config.clientLocalIp,
    "X-ClientPublicIP": config.clientPublicIp,
    "X-MACAddress": config.macAddress,
    "X-PrivateKey": config.apiKey,
  }
  if (jwt) result.Authorization = `Bearer ${jwt}`
  return result
}

function safeProviderCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9_]/gu, "_").slice(0, 40)
}

export class AngelProviderError extends SafeOperationalError {
  constructor(readonly providerCode: string, readonly sessionExpired: boolean) {
    const providerSuffix = safeProviderCode(providerCode)
    super(
      sessionExpired ? `ANGEL_SESSION_EXPIRED_${providerSuffix}` : `ANGEL_PROVIDER_ERROR_${providerSuffix}`,
      sessionExpired
        ? `Angel One rejected the market-data session (${providerSuffix}).`
        : `Angel One market-data request failed (${providerSuffix}).`,
      sessionExpired ? 401 : 502,
    )
  }
}

async function responseJson<T>(response: Response): Promise<AngelResponse<T>> {
  let body: AngelResponse<T>
  try {
    body = await response.json() as AngelResponse<T>
  } catch {
    throw new AngelProviderError(`HTTP_${response.status}`, response.status === 401 || response.status === 403)
  }
  if (!response.ok || body.status !== true) {
    const code = typeof body.errorcode === "string" && body.errorcode.trim() ? body.errorcode.trim() : `HTTP_${response.status}`
    throw new AngelProviderError(code, response.status === 401 || response.status === 403 || SESSION_ERROR_CODES.has(code))
  }
  return body
}

function jwtExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const normalized = payload.replace(/-/gu, "+").replace(/_/gu, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=")
    const decoded = JSON.parse(atob(normalized)) as { readonly exp?: unknown }
    return typeof decoded.exp === "number" && Number.isFinite(decoded.exp) ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

export function nextKolkataMidnight(nowMs: number): number {
  const offsetMs = 5.5 * 60 * 60_000
  const kolkataMs = nowMs + offsetMs
  return (Math.floor(kolkataMs / 86_400_000) + 1) * 86_400_000 - offsetMs
}

export function sessionExpiresAt(token: string, nowMs: number): number {
  return Math.min(nowMs + SESSION_TTL_MS, nextKolkataMidnight(nowMs), jwtExpiry(token) ?? Number.POSITIVE_INFINITY)
}

export function clearAngelSession() {
  cachedJwt = null
}

async function authenticate(config: AngelOneConfig, now = Date.now(), observer?:AngelTransportObserver) {
  if (cachedJwt && cachedJwt.expiresAt > now + SESSION_SAFETY_MS) return cachedJwt.token
  observer?.onAttempt?.("AUTHENTICATE")
  const response = await fetch("https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword", {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify({ clientcode: config.clientCode, password: config.pin, totp: await totp(config.totpSecret) }),
  })
  const body = await responseJson<{ readonly jwtToken?: string }>(response)
  observer?.onResponse?.("AUTHENTICATE",true)
  const token = body.data?.jwtToken
  if (!token) throw new AngelProviderError("MISSING_JWT", true)
  cachedJwt = { token, expiresAt: sessionExpiresAt(token, now) }
  return token
}

function parseDailyCandles(data: readonly unknown[][] | undefined, retrievedAt: string): AngelDailyCandle[] {
  const result: AngelDailyCandle[] = []
  for (const row of data ?? []) {
    if (!Array.isArray(row) || row.length < 5) continue
    const timestamp = new Date(String(row[0]))
    if (Number.isNaN(timestamp.getTime())) continue
    const open = exactDecimal(row[1], "historical open")
    const high = exactDecimal(row[2], "historical high")
    const low = exactDecimal(row[3], "historical low")
    const close = exactDecimal(row[4], "historical close")
    if (open === null || high === null || low === null || close === null) continue
    result.push({
      periodStart: timestamp.toISOString(),
      open,
      high,
      low,
      close,
      volume: row.length > 5 ? exactDecimal(row[5], "historical volume") : null,
      retrievedAt,
    })
  }
  return result.sort((a, b) => a.periodStart.localeCompare(b.periodStart))
}

export class AngelOneProvider implements MarketDataProvider {
  readonly code = MARKET_DATA_PROVIDER
  constructor(private readonly config: AngelOneConfig, private readonly observer?:AngelTransportObserver) {}

  async getLatestPrices(instruments: readonly ProviderInstrument[]) {
    return this.getLatestPricesAttempt(instruments, false)
  }

  async getDailyHistory(instrument: ProviderInstrument, fromDate: string, toDate: string) {
    return this.getDailyHistoryAttempt(instrument, fromDate, toDate, false, false)
  }

  async getDailyHistoryNoRetry(instrument: ProviderInstrument, fromDate: string, toDate: string) {
    return this.getDailyHistoryAttempt(instrument, fromDate, toDate, true, true)
  }

  private async getDailyHistoryAttempt(
    instrument: ProviderInstrument,
    fromDate: string,
    toDate: string,
    reauthenticated: boolean,
    transientRetried: boolean,
  ): Promise<AngelDailyCandle[]> {
    const jwt = await authenticate(this.config, Date.now(), this.observer)
    const retrievedAt = new Date().toISOString()
    try {
      this.observer?.onAttempt?.("HISTORY")
      const response = await fetch("https://apiconnect.angelone.in/rest/secure/angelbroking/historical/v1/getCandleData", {
        method: "POST",
        headers: headers(this.config, jwt),
        body: JSON.stringify({
          exchange: instrument.exchange,
          symboltoken: instrument.providerInstrumentId,
          interval: "ONE_DAY",
          fromdate: fromDate,
          todate: toDate,
        }),
      })
      const body = await responseJson<readonly unknown[][]>(response)
      this.observer?.onResponse?.("HISTORY",true)
      return parseDailyCandles(body.data, retrievedAt)
    } catch (error) {
      if (error instanceof AngelProviderError && error.sessionExpired && !reauthenticated) {
        clearAngelSession()
        return this.getDailyHistoryAttempt(instrument, fromDate, toDate, true, transientRetried)
      }
      if (error instanceof AngelProviderError && TRANSIENT_HISTORY_ERROR_CODES.has(error.providerCode) && !transientRetried) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        return this.getDailyHistoryAttempt(instrument, fromDate, toDate, reauthenticated, true)
      }
      throw error
    }
  }

  private async getLatestPricesAttempt(instruments: readonly ProviderInstrument[], reauthenticated: boolean): Promise<LatestPriceObservation[]> {
    const jwt = await authenticate(this.config, Date.now(), this.observer)
    const observations: LatestPriceObservation[] = []
    try {
      for (const batch of chunk(instruments, QUOTE_BATCH_SIZE)) {
        const exchangeTokens: Record<string, string[]> = {}
        batch.forEach((instrument) => {
          ;(exchangeTokens[instrument.exchange] ??= []).push(instrument.providerInstrumentId)
        })
        const requestedAt = new Date().toISOString()
        this.observer?.onAttempt?.("QUOTE")
        const response = await fetch("https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/", {
          method: "POST",
          headers: headers(this.config, jwt),
          body: JSON.stringify({ mode: "FULL", exchangeTokens }),
        })
        const body = await responseJson<{ readonly fetched?: readonly AngelQuote[]; readonly unfetched?: readonly unknown[] }>(response)
        this.observer?.onResponse?.("QUOTE",true)
        const byIdentity = new Map(batch.map((instrument) => [`${instrument.exchange}:${instrument.providerInstrumentId}`, instrument]))
        for (const quote of body.data?.fetched ?? []) {
          const instrument = byIdentity.get(`${String(quote.exchange)}:${String(quote.symbolToken)}`)
          if (!instrument) continue
          const price = exactDecimal(quote.ltp, "LTP")
          if (price === null) continue
          observations.push({
            mappingId: instrument.mappingId,
            securityId: instrument.securityId,
            providerCode: MARKET_DATA_PROVIDER,
            price,
            priceTimestamp: parseAngelTimestamp(quote.exchTradeTime ?? quote.exchFeedTime),
            retrievedAt: requestedAt,
            marketSessionStatus: "UNKNOWN",
            previousClose: exactDecimal(quote.close, "previous close"),
            dayOpen: exactDecimal(quote.open, "open"),
            dayHigh: exactDecimal(quote.high, "high"),
            dayLow: exactDecimal(quote.low, "low"),
            provenance: {
              endpoint: "/rest/secure/angelbroking/market/v1/quote/",
              mode: "FULL",
              exchange: instrument.exchange,
              trading_symbol: instrument.tradingSymbol,
              symbol_token: instrument.providerInstrumentId,
              requested_at: requestedAt,
            },
          })
        }
        if (batch.length === QUOTE_BATCH_SIZE) await new Promise((resolve) => setTimeout(resolve, 1100))
      }
    } catch (error) {
      if (error instanceof AngelProviderError && error.sessionExpired && !reauthenticated) {
        clearAngelSession()
        return this.getLatestPricesAttempt(instruments, true)
      }
      throw error
    }
    return observations
  }
}
