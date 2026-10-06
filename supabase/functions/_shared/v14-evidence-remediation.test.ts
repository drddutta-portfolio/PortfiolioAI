import { describe, expect, it } from "vitest"
import { deduplicateRequests, normalizeReviewedField, parseAngelDailyCandlesExact, parseExactTrendlyneFields, parseOwnershipQuarterCandidates, reviewDocumentExcerpt, validateAlignedHistory, type SourceAnchor } from "./v14-evidence-remediation.ts"
import { P7_IC_CANONICAL_REQUIREMENT_METRICS } from "./p7-ic-requirement-metrics.ts"

const source: SourceAnchor = { securityId: "s", symbol: "TEST", instrumentId: "12", recordId: "raw",
  payloadHash: "a".repeat(64), provider: "TRENDLYNE_MCP", retrievedAt: "2026-10-05T10:00:00Z", publishedAt: null }
const mapping = { metricCode: "ROCE_ANNUAL", providerLabel: "ROCE Ann. %", unit: "PERCENT", periodType: "YEAR" }
const wrap = (body: string) => JSON.stringify({ markdown_data: body })
const raw = "12|Test|TEST|1|2026-10-05\nROCE Ann. %\nTEST:12.1234567890123456789\nPEER:99\n---"
const quote = "ROCE Ann. % TEST:12.1234567890123456789 2025-04-01 2026-03-31 YEAR PERCENT CONSOLIDATED"
const proof = { sourceRecordId: "raw", payloadHash: source.payloadHash, providerLabel: mapping.providerLabel,
  quotedText: quote, reviewer: "owner", reviewVersion: "review-1", periodStart: "2025-04-01", periodEnd: "2026-03-31",
  periodType: "YEAR", unit: "PERCENT", currency: null, scope: "CONSOLIDATED", publishedAt: null }
const definition = { code: mapping.metricCode, canonical_unit: "PERCENT", value_kind: "NUMERIC", is_active: true,
  freshness_seconds: 86400, definition: { selection: "REVIEWED", period_type: "YEAR", provider: "TRENDLYNE_MCP", provider_label: mapping.providerLabel } }
const normalize = (patch = {}) => normalizeReviewedField({ source, rawText: raw + "\n" + quote, mapping,
  value: "12.1234567890123456789", proof, definition, evaluationAt: source.retrievedAt, cutoffAt: source.retrievedAt, ...patch })

describe("V1-4 metadata remediation", () => {
  it("retains exact decimal tokens and excludes peer values", () => {
    expect(parseExactTrendlyneFields(wrap(raw), source, [mapping])[0]?.value).toBe("12.1234567890123456789")
  })
  it("requires primary entity rather than a later matching peer", () => {
    expect(() => parseExactTrendlyneFields(wrap("9|Peer|PEER|1\n" + raw), source, [mapping])).toThrow("PROVIDER_PRIMARY_ENTITY_MISMATCH")
  })
  it.each([raw.replace("ROCE Ann. %", "ROCE Ann. 1Y ago %"), raw.replace("TEST:12.1234567890123456789", "TEST:None"), raw + "\nROCE Ann. %\nTEST:1\n---"])("rejects semantic substitutes, missing values or duplicate labels", body => {
    expect(parseExactTrendlyneFields(wrap(body), source, [mapping])[0]?.value).toBeNull()
  })
  it("requires quoted reporting metadata, never a query or header date", () => {
    expect(() => normalize({ proof: { ...proof, quotedText: "2026-10-05" } })).toThrow()
  })
  it("binds reviewer proof to the same immutable hash", () => {
    expect(() => normalize({ proof: { ...proof, payloadHash: "b".repeat(64) } })).toThrow("METADATA_PROOF_NOT_BOUND_TO_SOURCE")
  })
  it("rejects fabricated values and an unreviewed field label mapping", () => {
    expect(() => normalize({ value: "99" })).toThrow("NUMERIC_VALUE_NOT_BOUND_TO_SOURCE")
    expect(() => normalize({ definition: { ...definition, definition: { ...definition.definition, provider_label: "Other" } } })).toThrow("EXACT_METRIC_LABEL_MAPPING_NOT_REVIEWED")
  })
  it("produces canonical validated strings without claiming endpoint readiness", () => {
    const result = normalize()
    expect(result.row?.numeric_value).toBe("12.1234567890123456789")
    expect(result.validation.state).toBe("FRESH")
    expect(result.deterministicScoreReady).toBe(false)
  })
  it("retains stale facts for review without extending freshness", () => {
    const result = normalize({ evaluationAt: "2026-10-07T10:00:00Z" })
    expect(result.validation.state).toBe("STALE"); expect(result.row).toBeNull()
  })
  it.each(["UNKNOWN", "UNSPECIFIED"])("rejects unproven %s scope", scope => {
    expect(normalize({ rawText: raw + "\n" + quote.replace("CONSOLIDATED", scope), proof: { ...proof, scope, quotedText: quote.replace("CONSOLIDATED", scope) } }).row).toBeNull()
  })
  it("does not convert units or monetary currencies", () => {
    expect(() => normalize({ proof: { ...proof, unit: "INR_CRORE" } })).toThrow()
  })
  it("parses dated ownership zero with explicit unit and leaves basis review outstanding", () => {
    const rows = parseOwnershipQuarterCandidates('chartData:\n  Promoter:\n    ["Quarter","Promoter Holding (%)"], ["Jun 2026",0.0,"0.0 %"]', source)
    expect(rows[0]).toMatchObject({ value: "0.0", periodEnd: "2026-06-30", unit: "PERCENT", state: "REVIEW_REQUIRED", scope: null })
  })
  it("does not use undated ownership summary or unlabelled units", () => {
    expect(parseOwnershipQuarterCandidates('["Promoter",0,null]', source)).toEqual([])
  })
  it.each(['["Jun 2026",10,"10 %"], ["Jun 2026",11,"11 %"]', '["Dec 2026",10,"10 %"]', '["Jun 2026",101,"101 %"]'])("rejects duplicate/future/out-of-range ownership: %s", entries => {
    expect(() => parseOwnershipQuarterCandidates('chartData:\n  FII:\n    ["Quarter","Holding (%)"], ' + entries, source)).toThrow()
  })
  it("requires a bound document excerpt review, not a keyword hit", () => {
    const result = wrap("doc|Test|TEST|12|Annual Report|2026-09-01\nRevenue is consolidated.")
    expect(reviewDocumentExcerpt({ source, result, documentId: "doc", requirement: "BUSINESS_MODEL", quote: "Revenue is consolidated.", reviewer: "owner", decision: "SUPPORTS" })).toMatchObject({ state: "REVIEW_REQUIRED", archiveClaim: "PROVIDER_EXCERPT_ONLY" })
    expect(() => reviewDocumentExcerpt({ source, result, documentId: "doc", requirement: "BUSINESS_MODEL", quote: "Invented fact", reviewer: "owner", decision: "SUPPORTS" })).toThrow()
  })
})

describe("history authority and request budgets", () => {
  it("never substitutes an upside percentage for a PE ratio", () => {
    expect(P7_IC_CANONICAL_REQUIREMENT_METRICS.PE).toEqual(["PE_TTM"])
  })
  const candleInput = { exchange: "NSE" as const, instrumentId: "12", from: "2026-10-01", to: "2026-10-05", retrievedAt: source.retrievedAt, maximumRows: 5 }
  const candle = '["2026-10-01T09:15:00+05:30",12.1234567890123456789,13,11,12.5,100]'
  it("retains Angel candle decimal tokens and never manufactures adjusted close", () => {
    expect(parseAngelDailyCandlesExact('{"status":true,"data":[' + candle + ']}', candleInput)[0]).toMatchObject({ open: "12.1234567890123456789", adjusted_close: null, state: "RAW_HISTORY_ONLY" })
  })
  it.each([candle.replace(",13,", ",10,"), candle.replace("+05:30", "Z"), candle.replace(",100]", ",null]"), candle + "," + candle])("rejects invalid OHLC, timezone, nulls and duplicates", row => {
    expect(() => parseAngelDailyCandlesExact('{"status":true,"data":[' + row + ']}', candleInput)).toThrow()
  })
  it("rejects candle response exceeding the append ceiling", () => {
    expect(() => parseAngelDailyCandlesExact('{"status":true,"data":[' + candle + ']}', { ...candleInput, maximumRows: 0 })).toThrow()
  })
  const input = { securityId: "s", exchange: "NSE", sessions: ["2026-10-01", "2026-10-05"], benchmarkSessions: ["2026-10-01", "2026-10-05"],
    minimum: 2, from: "2026-10-01", to: "2026-10-05", requiredBenchmark: "NIFTY_500",
    calendar: { exchange: "NSE" as const, version: "official-1", sourceRecordId: "cal", payloadHash: source.payloadHash, reviewed: true,
      from: "2026-10-01", to: "2026-10-05", sessions: ["2026-10-01", "2026-10-05"] },
    adjustment: { securityId: "s", version: "ca-1", sourceRecordId: "ca", payloadHash: source.payloadHash, reviewed: true,
      from: "2026-10-01", to: "2026-10-05", basis: "SPLIT_BONUS_ADJUSTED" as const, eventCoverageComplete: true },
    benchmark: { code: "NIFTY_500", instrumentId: "token", mappingStatus: "VERIFIED" } }
  it("accepts aligned reviewed sessions including explicit holiday exclusion", () => {
    expect(validateAlignedHistory(input).state).toBe("VALIDATED_CONTRACT")
  })
  it.each([
    [{ calendar: null }, "SESSION_AUTHORITY_NOT_PROVEN"],
    [{ adjustment: null }, "ADJUSTMENT_COVERAGE_NOT_PROVEN"],
    [{ benchmark: { ...input.benchmark, code: "NIFTY_AUTO" } }, "EXACT_BENCHMARK_MAPPING_NOT_PROVEN"],
    [{ sessions: [...input.sessions, "2026-10-02"] }, "CALENDAR_ALIGNMENT_NOT_PROVEN"],
    [{ benchmarkSessions: ["2026-10-01"] }, "CALENDAR_ALIGNMENT_NOT_PROVEN"],
  ])("fails closed for missing authority or misalignment", (patch, reason) => {
    expect(validateAlignedHistory({ ...input, ...patch }).reason).toBe(reason)
  })
  it("deduplicates shared benchmark requests irrespective of object key order", () => {
    const request = { provider: "ANGEL_ONE" as const, tool: "getCandleData", args: { token: "x", interval: "ONE_DAY" }, parser: "daily", target: "benchmark_price_history", maxWrites: 402 }
    expect(deduplicateRequests([request, { ...request, args: { interval: "ONE_DAY", token: "x" } }])).toHaveLength(1)
    expect(() => deduplicateRequests([request, { ...request, maxWrites: 800 }])).toThrow("SHARED_REQUEST_CONTRACT_CONFLICT")
  })
})
