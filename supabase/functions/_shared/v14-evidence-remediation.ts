/** Action B Phase 1: pure parsing/validation. No network, credentials or writes. */
import { unwrapTrendlyneMarkdown } from "./p7-ic-evidence-normalization.ts"
import { validDate, validateObservationSeries, type InputObservation, type MetricDefinition } from "./p7-ic-input-validation.ts"

export const V14_REMEDIATION_VERSION = "V1_4_ACTION_B_PHASE1_V1"
export interface SourceAnchor {
  securityId: string
  symbol: string
  instrumentId: string
  recordId: string
  payloadHash: string
  provider: string
  retrievedAt: string
  publishedAt: string | null
}
export interface ExactFieldMapping {
  metricCode: string
  providerLabel: string
  unit: string
  periodType: string
}
export interface MetadataProof {
  sourceRecordId: string
  payloadHash: string
  providerLabel: string
  quotedText: string
  reviewer: string
  reviewVersion: string
  periodStart: string | null
  periodEnd: string
  periodType: string
  unit: string
  currency: string | null
  scope: string
  publishedAt: string | null
}
const DECIMAL = /^-?\d+(?:\.\d+)?$/u
const instant = (value: string | null) => value == null ? NaN : Date.parse(value)
const assertAnchor = (source: SourceAnchor) => {
  if (!source.securityId || !source.symbol || !source.instrumentId || !source.recordId
    || !/^[a-f\d]{64}$/iu.test(source.payloadHash) || !source.provider
    || !Number.isFinite(instant(source.retrievedAt))) throw new Error("SOURCE_ANCHOR_INVALID")
}

/** Only the first entity may be primary. Exact labels, exact decimal tokens; no peer substitution. */
export function parseExactTrendlyneFields(result: string, source: SourceAnchor, mappings: readonly ExactFieldMapping[]) {
  assertAnchor(source)
  const markdown = unwrapTrendlyneMarkdown(result)
  const lines = markdown.split(/\r?\n/u).map(line => line.trim())
  const first = lines.find(Boolean)?.split("|").map(field => field.trim())
  if (first?.[0] !== source.instrumentId || first?.[2] !== source.symbol) throw new Error("PROVIDER_PRIMARY_ENTITY_MISMATCH")
  return mappings.map(mapping => {
    const indexes = lines.flatMap((line, index) => line === mapping.providerLabel ? [index] : [])
    if (indexes.length !== 1) return { mapping, value: null, reason: indexes.length ? "FIELD_AMBIGUOUS" : "FIELD_MISSING" }
    const tokens: string[] = []
    for (let index = indexes[0]! + 1; index < lines.length && lines[index] !== "---"; index++) {
      if (lines[index]!.startsWith(source.symbol + ":")) tokens.push(lines[index]!.slice(source.symbol.length + 1).trim())
    }
    const value = tokens.length === 1 && DECIMAL.test(tokens[0]!) ? tokens[0]! : null
    return { mapping, value, reason: value == null ? "FIELD_VALUE_MISSING_OR_AMBIGUOUS" : "METADATA_REVIEW_REQUIRED" }
  })
}

/** Reviewed facts must be verbatim in the same immutable payload, never copied from request hints. */
export function normalizeReviewedField(input: {
  source: SourceAnchor; rawText: string; mapping: ExactFieldMapping; value: string
  proof: MetadataProof; definition: MetricDefinition; evaluationAt: string; cutoffAt: string
}) {
  const { source, proof, mapping, definition } = input
  assertAnchor(source)
  const parsed = parseExactTrendlyneFields(JSON.stringify({ markdown_data: input.rawText }), source, [mapping])[0]
  if (parsed?.value !== input.value) throw new Error("NUMERIC_VALUE_NOT_BOUND_TO_SOURCE")
  if (definition.definition.provider_label !== mapping.providerLabel) throw new Error("EXACT_METRIC_LABEL_MAPPING_NOT_REVIEWED")
  if (proof.sourceRecordId !== source.recordId || proof.payloadHash !== source.payloadHash
    || proof.providerLabel !== mapping.providerLabel || !proof.reviewer || !proof.reviewVersion
    || !proof.quotedText || !input.rawText.includes(proof.quotedText)
    || !proof.quotedText.includes(mapping.providerLabel) || !proof.quotedText.includes(input.value)) throw new Error("METADATA_PROOF_NOT_BOUND_TO_SOURCE")
  const facts = [proof.periodEnd, proof.periodType, proof.unit, proof.scope,
    ...(proof.periodStart ? [proof.periodStart] : []), ...(proof.currency ? [proof.currency] : [])]
  if (facts.some(fact => !proof.quotedText.includes(fact))) throw new Error("METADATA_FACT_NOT_IN_QUOTE")
  if (!DECIMAL.test(input.value) || mapping.metricCode !== definition.code
    || proof.periodType !== mapping.periodType || proof.unit !== mapping.unit
    || (proof.publishedAt != null && (!proof.quotedText.includes(proof.publishedAt)
      || !Number.isFinite(instant(proof.publishedAt))))) throw new Error("EXACT_FIELD_CONTRACT_MISMATCH")
  if (!validDate(proof.periodEnd)) throw new Error("REPORTING_PERIOD_INVALID")
  const row: InputObservation = {
    id: `${source.recordId}:${mapping.metricCode}:${proof.periodEnd}`, metric_code: mapping.metricCode,
    numeric_value: input.value, text_value: null, boolean_value: null, date_value: null,
    unit: proof.unit, currency: proof.currency, consolidation_scope: proof.scope,
    period_start: proof.periodStart, period_end: proof.periodEnd, period_type: proof.periodType,
    source_record_id: source.recordId, source_code: source.provider, retrieved_at: source.retrievedAt,
    published_at: proof.publishedAt ?? source.publishedAt,
    fresh_until: new Date(instant(source.retrievedAt) + definition.freshness_seconds * 1000).toISOString(),
    evidence_status: "AVAILABLE",
  }
  const validation = validateObservationSeries({ rows: [row], definitions: [definition], minimum: 1,
    evaluationAsOfMs: instant(input.evaluationAt), sourceCutoffAtMs: instant(input.cutoffAt) })
  return { row: validation.state === "FRESH" ? row : null, validation,
    lineage: { version: V14_REMEDIATION_VERSION, source, proof }, deterministicScoreReady: false }
}

/** Quarter labels are explicit calendar quarters, not inferred issuer fiscal periods. */
export function parseOwnershipQuarterCandidates(result: string, source: SourceAnchor) {
  assertAnchor(source)
  const series = ["Promoter", "Institutional", "FII", "MF", "DII", "Public"] as const
  const ends: Record<string, string> = { Mar: "03-31", Jun: "06-30", Sep: "09-30", Dec: "12-31" }
  return series.flatMap(name => {
    const body = result.match(new RegExp(`(?:^|\n)  ${name}:\\s*\n([\\s\\S]*?)(?=\n  [A-Za-z]+:|\ninsights:|$)`, "u"))?.[1]
    if (!body || !/\["Quarter","(?:Promoter )?Holding \(%\)"/u.test(body)) return []
    const seen = new Set<string>()
    return [...body.matchAll(/\["(Mar|Jun|Sep|Dec) (\d{4})",\s*(-?\d+(?:\.\d+)?),/gu)].map(match => {
      const periodEnd = `${match[2]}-${ends[match[1]!]}`
      if (seen.has(periodEnd)) throw new Error("OWNERSHIP_DUPLICATE_QUARTER")
      seen.add(periodEnd)
      if (!validDate(periodEnd) || instant(periodEnd) > instant(source.retrievedAt)) throw new Error("OWNERSHIP_QUARTER_INVALID")
      const value = match[3]!
      const whole = BigInt(value.split(".")[0]!)
      if (value.startsWith("-") || whole > 100n || (whole === 100n && /[1-9]/u.test(value.split(".")[1] ?? ""))) throw new Error("OWNERSHIP_PERCENT_INVALID")
      return { source, series: name, quarterLabel: `${match[1]} ${match[2]}`, periodEnd,
        periodType: "QUARTER", value, unit: "PERCENT", quotedText: match[0],
        scope: null, publishedAt: source.publishedAt, state: "REVIEW_REQUIRED",
        blockers: ["OWNERSHIP_SERIES_DEFINITION_REVIEW", "OWNERSHIP_BASIS_REVIEW"], deterministicScoreReady: false }
    })
  })
}

export function reviewDocumentExcerpt(input: {
  source: SourceAnchor; result: string; documentId: string; requirement: string
  quote: string; reviewer: string; decision: "SUPPORTS" | "CONTRADICTS" | "INSUFFICIENT"
}) {
  assertAnchor(input.source)
  const body = unwrapTrendlyneMarkdown(input.result)
  const lines = body.split(/\r?\n/u)
  const headers = lines.filter(line => {
    const fields = line.trim().split("|")
    return fields[0] === input.documentId && fields[2] === input.source.symbol && fields[3] === input.source.instrumentId
  })
  const start = headers.length === 1 ? lines.indexOf(headers[0]!) + 1 : -1
  const nextHeader = start < 0 ? -1 : lines.findIndex((line, index) => index >= start && line.split("|").length >= 6 && /^\d+\|/u.test(line))
  const documentBody = start < 0 ? "" : lines.slice(start, nextHeader < 0 ? undefined : nextHeader).join("\n")
  if (headers.length !== 1 || !input.reviewer || !input.requirement || !input.quote.trim()
    || !documentBody.includes(input.quote)) throw new Error("DOCUMENT_REVIEW_PROOF_INVALID")
  // A citation is a review record, not a numeric assessment or full-body archive claim.
  return { ...input, version: V14_REMEDIATION_VERSION, state: "REVIEW_REQUIRED",
    archiveClaim: "PROVIDER_EXCERPT_ONLY", deterministicScoreReady: false }
}

export interface SessionAuthority {
  exchange: "NSE" | "BSE"; version: string; sourceRecordId: string; payloadHash: string
  reviewed: boolean; from: string; to: string; sessions: readonly string[]
}
export interface AdjustmentAuthority {
  securityId: string; version: string; sourceRecordId: string; payloadHash: string
  reviewed: boolean; from: string; to: string; basis: "TOTAL_RETURN" | "SPLIT_BONUS_ADJUSTED"
  eventCoverageComplete: boolean
}
export function validateAlignedHistory(input: {
  securityId: string; exchange: string; sessions: readonly string[]; benchmarkSessions: readonly string[]
  minimum: number; from: string; to: string; calendar: SessionAuthority | null; adjustment: AdjustmentAuthority | null
  benchmark: { code: string; instrumentId: string; mappingStatus: string } | null; requiredBenchmark: string
}) {
  const fail = (reason: string) => ({ state: "REVIEW_REQUIRED", reason, deterministicScoreReady: false })
  const { calendar, adjustment, benchmark } = input
  if (!validDate(input.from) || !validDate(input.to) || input.from > input.to || !Number.isInteger(input.minimum) || input.minimum < 1) return fail("HISTORY_WINDOW_INVALID")
  if (!calendar?.reviewed || calendar.exchange !== input.exchange || !calendar.version || !calendar.sourceRecordId
    || !/^[a-f\d]{64}$/iu.test(calendar.payloadHash) || !validDate(calendar.from) || !validDate(calendar.to)
    || calendar.from > input.from || calendar.to < input.to) return fail("SESSION_AUTHORITY_NOT_PROVEN")
  if (!adjustment?.reviewed || adjustment.securityId !== input.securityId || !adjustment.version || !adjustment.sourceRecordId
    || !/^[a-f\d]{64}$/iu.test(adjustment.payloadHash) || !adjustment.eventCoverageComplete
    || !validDate(adjustment.from) || !validDate(adjustment.to)
    || !["TOTAL_RETURN", "SPLIT_BONUS_ADJUSTED"].includes(adjustment.basis)
    || adjustment.from > input.from || adjustment.to < input.to) return fail("ADJUSTMENT_COVERAGE_NOT_PROVEN")
  if (benchmark?.mappingStatus !== "VERIFIED" || benchmark.code !== input.requiredBenchmark || !benchmark.instrumentId) return fail("EXACT_BENCHMARK_MAPPING_NOT_PROVEN")
  const expected = calendar.sessions.filter(day => day >= input.from && day <= input.to)
  if (expected.some(day => !validDate(day)) || new Set(expected).size !== expected.length
    || expected.length < input.minimum) return fail("SESSION_AUTHORITY_INVALID_OR_INSUFFICIENT")
  for (const actual of [input.sessions, input.benchmarkSessions]) {
    if (new Set(actual).size !== actual.length || actual.length !== expected.length
      || actual.some(day => !expected.includes(day))) return fail("CALENDAR_ALIGNMENT_NOT_PROVEN")
  }
  return { state: "VALIDATED_CONTRACT", reason: "ADJUSTED_HISTORY_SESSIONS_ALIGNED",
    deterministicScoreReady: false, lineage: { calendar, adjustment, benchmark } }
}

export interface AcquisitionRequest {
  provider: "TRENDLYNE" | "ANGEL_ONE"; tool: string; args: Readonly<Record<string, unknown>>
  parser: string; target: string; maxWrites: number
}

/** Tokenize JSON numbers as strings before parsing; never round provider candle decimals. */
export function parseAngelDailyCandlesExact(raw: string, input: {
  exchange: "NSE" | "BSE"; instrumentId: string; from: string; to: string; retrievedAt: string; maximumRows: number
}) {
  JSON.parse(raw) // Validate original JSON syntax; values below come exclusively from exact tokens.
  if (!input.instrumentId || !validDate(input.from) || !validDate(input.to) || input.from > input.to
    || !Number.isFinite(instant(input.retrievedAt)) || !Number.isInteger(input.maximumRows) || input.maximumRows < 1) throw new Error("CANDLE_REQUEST_CONTRACT_INVALID")
  let encoded = "", index = 0, quoted = false, escaped = false
  while (index < raw.length) {
    const char = raw[index]!
    if (quoted) {
      encoded += char
      if (!escaped && char === '"') quoted = false
      escaped = !escaped && char === "\\"
      index++; continue
    }
    if (char === '"') { quoted = true; encoded += char; index++; continue }
    if (char === "-" || /\d/u.test(char)) {
      const token = raw.slice(index).match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/u)?.[0]
      if (!token) throw new Error("CANDLE_NUMBER_INVALID")
      encoded += JSON.stringify(token); index += token.length; continue
    }
    encoded += char; index++
  }
  const body = JSON.parse(encoded) as { status?: boolean; data?: unknown }
  if (body.status !== true || !Array.isArray(body.data) || body.data.length > input.maximumRows) throw new Error("CANDLE_RESPONSE_SCHEMA_OR_BUDGET_INVALID")
  const sessions = new Set<string>()
  return body.data.map((row: unknown) => {
    if (!Array.isArray(row) || row.length !== 6 || typeof row[0] !== "string"
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+05:30$/u.test(row[0])
      || !Number.isFinite(instant(row[0]))) throw new Error("CANDLE_ROW_SCHEMA_INVALID")
    const day = row[0].slice(0, 10)
    if (!validDate(day) || day < input.from || day > input.to || instant(row[0]) > instant(input.retrievedAt)
      || sessions.has(day)) throw new Error("CANDLE_SESSION_INVALID_OR_DUPLICATE")
    sessions.add(day)
    const values = row.slice(1) as unknown[]
    if (values.some(value => typeof value !== "string" || !/^\d+(?:\.\d+)?$/u.test(value))
      || values.slice(0, 4).some(value => /^0(?:\.0+)?$/u.test(String(value)))
      || !/^\d+$/u.test(String(values[4]))) throw new Error("CANDLE_VALUE_INVALID")
    const compare = (a: string, b: string) => {
      const scale = Math.max(a.split(".")[1]?.length ?? 0, b.split(".")[1]?.length ?? 0)
      const exact = (value: string) => BigInt(value.split(".")[0]! + (value.split(".")[1] ?? "").padEnd(scale, "0"))
      return exact(a) <= exact(b)
    }
    const [open, high, low, close, volume] = values as string[]
    if (![open!, close!, low!].every(value => compare(value, high!))
      || ![open!, close!].every(value => compare(low!, value))) throw new Error("CANDLE_OHLC_INVALID")
    return { period_start: row[0], open, high, low, close, volume, adjusted_close: null,
      retrieved_at: input.retrievedAt, provenance: { provider: "ANGEL_ONE", exchange: input.exchange,
        instrument_id: input.instrumentId, interval: "ONE_DAY", adjustment_methodology: null,
        request_from: input.from, request_to: input.to, parser_version: V14_REMEDIATION_VERSION },
      state: "RAW_HISTORY_ONLY", deterministicScoreReady: false }
  })
}
/** Stable serialization makes shared requests one call, regardless of member/requirement count. */
export function deduplicateRequests(requests: readonly AcquisitionRequest[]) {
  const stable = (value: unknown): string => Array.isArray(value) ? `[${value.map(stable).join(",")}]`
    : value !== null && typeof value === "object" ? `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`
    : JSON.stringify(value) ?? "null"
  const byKey = new Map<string, AcquisitionRequest>()
  for (const request of requests) {
    if (!Number.isInteger(request.maxWrites) || request.maxWrites < 0) throw new Error("WRITE_CEILING_INVALID")
    const key = stable([request.provider, request.tool, request.args])
    const previous = byKey.get(key)
    if (previous && (previous.parser !== request.parser || previous.target !== request.target || previous.maxWrites !== request.maxWrites)) throw new Error("SHARED_REQUEST_CONTRACT_CONFLICT")
    byKey.set(key, request)
  }
  return [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([requestKey, request]) => ({ requestKey, ...request }))
}
