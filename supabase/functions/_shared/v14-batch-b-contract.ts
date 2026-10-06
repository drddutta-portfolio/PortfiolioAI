
export const V1_4_BATCH_B_CODES = [
  "NIFTY_CAPITAL_GOODS",
  "NIFTY_CHEMICALS",
  "NIFTY_CONSUMER_DURABLES",
  "NIFTY_CONSUMER_SERVICES",
  "NIFTY_FINANCIAL_SERVICES_EX_BANK",
  "NIFTY_HOSPITALS",
  "NIFTY_INDIA_DEFENCE",
  "NIFTY_OIL_GAS",
  "NIFTY_POWER",
  "NIFTY_SERVICES_SECTOR",
  "NIFTY_TELECOM",
  "NIFTY_TRANSPORTATION_LOGISTICS",
] as const
export type V14BatchBBenchmarkCode = typeof V1_4_BATCH_B_CODES[number]

export const V1_4_BATCH_B_MIN_DISTINCT_SESSIONS = 252
export const V1_4_BATCH_B_MAX_ROWS_PER_BENCHMARK = 400
export const V1_4_BATCH_B_MAX_TOTAL_ROWS = 4800
export const V1_4_BATCH_B_LOOKBACK_DAYS = 400
export const V1_4_BATCH_B_CONTRACT_VERSION = "V1_4_BATCH_B_RESUMPTION_CONTRACT_V2" as const

export type MasterRow = Readonly<Record<string, unknown>>
export type BenchmarkDefinition = Readonly<{
  code: string
  displayName: string
  acceptedAliases: readonly string[]
  exchange: string
  instrumentType: string
}>
export type ResolvedIdentity = Readonly<{
  code: string
  token: string
  exchange: "NSE"
  symbol: string
  name: string | null
  instrumentType: "AMXIDX"
  matchedAlias: string
  matchedField: "name" | "symbol"
  resolutionBasis: "EXACT_NORMALIZED_ALIAS"
}>
export type IdentityPreflight = Readonly<{
  code: string
  status: "EXACT_MATCH" | "AMBIGUOUS" | "UNAVAILABLE"
  identity: ResolvedIdentity | null
  exactMatches: readonly ResolvedIdentity[]
  investigationCandidates: readonly Readonly<Record<string, unknown>>[]
  reason: string
}>

export type BatchBCounters = {
  instrumentMasterRequests: number
  attemptedHistoryRequests: number
  successfulHistoryResponses: number
  acceptedRows: number
  persistedRows: number
}

export function emptyBatchBCounters(): BatchBCounters {
  return { instrumentMasterRequests: 0, attemptedHistoryRequests: 0, successfulHistoryResponses: 0, acceptedRows: 0, persistedRows: 0 }
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}
export function normalizeBenchmarkIdentity(value: unknown) {
  return text(value)?.toUpperCase().replace(/&/gu, " AND ").replace(/[^A-Z0-9]+/gu, " ").trim().replace(/\s+/gu, " ") ?? ""
}
function masterExchange(row: MasterRow) { return text(row.exch_seg)?.toUpperCase() ?? "" }
function masterType(row: MasterRow) { return text(row.instrumenttype)?.toUpperCase() ?? "" }
function masterName(row: MasterRow) { return text(row.name) }
function masterSymbol(row: MasterRow) { return text(row.symbol) }
function masterToken(row: MasterRow) { return text(row.token) }

function investigationScore(definition: BenchmarkDefinition, row: MasterRow) {
  const target = new Set(definition.acceptedAliases.flatMap(a => normalizeBenchmarkIdentity(a).split(" ")).filter(x => x.length >= 3))
  const candidate = normalizeBenchmarkIdentity((masterName(row) ?? "") + " " + (masterSymbol(row) ?? ""))
  let score = 0
  for (const token of target) if (candidate.includes(token)) score += 1
  return score
}

export function preflightBenchmarkIdentity(
  definition: BenchmarkDefinition,
  master: readonly MasterRow[],
): IdentityPreflight {
  const accepted = new Map(definition.acceptedAliases.map(alias => [normalizeBenchmarkIdentity(alias), alias]))
  const exact: ResolvedIdentity[] = []
  for (const row of master) {
    if (masterExchange(row) !== definition.exchange.toUpperCase()) continue
    if (masterType(row) !== definition.instrumentType.toUpperCase()) continue
    const token = masterToken(row), symbol = masterSymbol(row), name = masterName(row)
    if (!token || !symbol) continue
    const nameAlias = accepted.get(normalizeBenchmarkIdentity(name))
    const symbolAlias = accepted.get(normalizeBenchmarkIdentity(symbol))
    const matchedAlias = nameAlias ?? symbolAlias
    if (!matchedAlias) continue
    exact.push({
      code: definition.code,
      token,
      exchange: "NSE",
      symbol,
      name,
      instrumentType: "AMXIDX",
      matchedAlias,
      matchedField: nameAlias ? "name" : "symbol",
      resolutionBasis: "EXACT_NORMALIZED_ALIAS",
    })
  }
  const unique = [...new Map(exact.map(x => [x.token, x])).values()]
  const candidates = master
    .map(row => ({ row, score: investigationScore(definition, row) }))
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score || String(masterName(a.row) ?? "").localeCompare(String(masterName(b.row) ?? "")))
    .slice(0, 12)
    .map(({row,score}) => ({
      score,
      token: masterToken(row),
      exchange: masterExchange(row),
      instrumentType: masterType(row),
      name: masterName(row),
      symbol: masterSymbol(row),
      exactAliasAuthorized: false,
    }))
  if (unique.length === 1) return { code: definition.code, status: "EXACT_MATCH", identity: unique[0]!, exactMatches: unique, investigationCandidates: candidates, reason: "EXACT_ACCEPTED_ALIAS_NSE_AMXIDX" }
  if (unique.length > 1) return { code: definition.code, status: "AMBIGUOUS", identity: null, exactMatches: unique, investigationCandidates: candidates, reason: "MULTIPLE_EXACT_ACCEPTED_ALIAS_NSE_AMXIDX" }
  return { code: definition.code, status: "UNAVAILABLE", identity: null, exactMatches: [], investigationCandidates: candidates, reason: "NO_EXACT_ACCEPTED_ALIAS_NSE_AMXIDX" }
}

export function preflightAllBenchmarkIdentities(
  definitions: readonly BenchmarkDefinition[],
  requestedCodes: readonly string[],
  master: readonly MasterRow[],
): readonly IdentityPreflight[] {
  return requestedCodes.map(code => {
    const definition = definitions.find(x => x.code === code)
    if (!definition) return {code,status:"UNAVAILABLE" as const,identity:null,exactMatches:[],investigationCandidates:[],reason:"BENCHMARK_DEFINITION_MISSING"}
    return preflightBenchmarkIdentity(definition, master)
  })
}

export function exactOriginalBatchBOrder(codes: readonly string[]) {
  return codes.length === V1_4_BATCH_B_CODES.length && codes.every((code,index) => code === V1_4_BATCH_B_CODES[index])
}

function isoDay(value: string) {
  const raw = value.slice(0,10)
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(raw) || !Number.isFinite(Date.parse(raw+"T00:00:00Z"))) throw new Error("P7_IC_BENCHMARK_CANDLE_DATE_INVALID")
  return raw
}
function positiveDecimal(value: unknown, field: string) {
  if (typeof value !== "string" && typeof value !== "number") throw new Error("P7_IC_BENCHMARK_"+field+"_INVALID")
  const s=String(value).trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(s) || Number(s)<=0) throw new Error("P7_IC_BENCHMARK_"+field+"_INVALID")
  return Number(s)
}
function nonnegativeDecimal(value: unknown, field: string) {
  if (value === null || value === undefined) return null
  if (typeof value !== "string" && typeof value !== "number") throw new Error("P7_IC_BENCHMARK_"+field+"_INVALID")
  const s=String(value).trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(s) || Number(s)<0) throw new Error("P7_IC_BENCHMARK_"+field+"_INVALID")
  return Number(s)
}

export type ValidatedCandle = Readonly<{
  periodStart:string; open:string; high:string; low:string; close:string; volume:string|null; retrievedAt:string
}>

export function validateBatchBHistoryResponse(input: {
  candles: readonly Readonly<Record<string, unknown>>[]
  requestFrom: string
  requestTo: string
  cutoffDate: string
  alreadyAcceptedTotal: number
}) {
  if (input.requestTo !== input.cutoffDate) throw new Error("P7_IC_BENCHMARK_REQUEST_CUTOFF_MISMATCH")
  if (input.candles.length > V1_4_BATCH_B_MAX_ROWS_PER_BENCHMARK) throw new Error("P7_IC_BENCHMARK_ROW_CEILING_EXCEEDED")
  const byDay = new Map<string, ValidatedCandle>()
  for (const raw of input.candles) {
    const periodStart = text(raw.periodStart)
    const retrievedAt = text(raw.retrievedAt)
    if (!periodStart || !retrievedAt || !Number.isFinite(Date.parse(retrievedAt))) throw new Error("P7_IC_BENCHMARK_CANDLE_METADATA_INVALID")
    const day = isoDay(periodStart)
    if (day < input.requestFrom || day > input.requestTo) throw new Error("P7_IC_BENCHMARK_CANDLE_OUTSIDE_REQUEST_WINDOW")
    const open=positiveDecimal(raw.open,"OPEN"),high=positiveDecimal(raw.high,"HIGH"),low=positiveDecimal(raw.low,"LOW"),close=positiveDecimal(raw.close,"CLOSE")
    nonnegativeDecimal(raw.volume,"VOLUME")
    if (high < Math.max(open,close,low) || low > Math.min(open,close,high)) throw new Error("P7_IC_BENCHMARK_OHLC_INCONSISTENT")
    if (byDay.has(day)) throw new Error("P7_IC_BENCHMARK_DUPLICATE_SESSION")
    byDay.set(day, raw as ValidatedCandle)
  }
  if (byDay.size < V1_4_BATCH_B_MIN_DISTINCT_SESSIONS) throw new Error("P7_IC_BENCHMARK_DISTINCT_SESSIONS_INSUFFICIENT")
  if (input.alreadyAcceptedTotal + byDay.size > V1_4_BATCH_B_MAX_TOTAL_ROWS) throw new Error("P7_IC_BENCHMARK_TOTAL_ROW_CEILING_EXCEEDED")
  const days=[...byDay.keys()].sort()
  return {
    rows:[...byDay.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([,row])=>row),
    distinctSessions:byDay.size,
    firstSession:days[0]!,
    lastSession:days.at(-1)!,
  }
}

export function batchBRequestWindow(cutoffDate:string) {
  const cutoff=Date.parse(cutoffDate+"T00:00:00Z")
  if (!Number.isFinite(cutoff)) throw new Error("P7_IC_BENCHMARK_CUTOFF_INVALID")
  return {
    requestFrom:new Date(cutoff - V1_4_BATCH_B_LOOKBACK_DAYS*86400000).toISOString().slice(0,10),
    requestTo:cutoffDate,
    cutoffDate,
  }
}
