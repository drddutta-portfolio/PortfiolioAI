import { describe, expect, it } from "vitest"
import { cachedEvidenceReadiness, inspectStoredHistory, validateObservationSeries, validDate, type InputObservation, type MetricDefinition } from "./p7-ic-input-validation"

const evaluationAsOfMs = Date.parse("2026-10-05T12:00:00Z")
const sourceCutoffAtMs = evaluationAsOfMs
const definition: MetricDefinition = { code: "ROCE_ANNUAL", canonical_unit: "PERCENT", value_kind: "NUMERIC", is_active: true, freshness_seconds: 150 * 86400,
  definition: { selection: "REVIEWED", period_type: "YEAR", provider: "TRENDLYNE_MCP" } }
const row: InputObservation = { id: "r1", metric_code: "ROCE_ANNUAL", numeric_value: "12.1234567890123456789", text_value: null, boolean_value: null, date_value: null,
  unit: "PERCENT", currency: null, consolidation_scope: "CONSOLIDATED", period_start: "2025-04-01", period_end: "2026-03-31", period_type: "YEAR",
  retrieved_at: "2026-09-01T12:00:00Z", fresh_until: "2027-01-01T00:00:00Z", published_at: "2026-08-01T00:00:00Z", evidence_status: "AVAILABLE", source_code: "TRENDLYNE_MCP", source_record_id: "source1" }
const validate = (rows: readonly InputObservation[], minimum = 1, definitions: readonly MetricDefinition[] = [definition]) => validateObservationSeries({ rows, minimum, definitions, evaluationAsOfMs, sourceCutoffAtMs })

describe("V1-4 canonical input contracts", () => {
  it("retains exact decimals and full metadata in a reviewed dated series", () => {
    const result = validate([Object.freeze(row)])
    expect(result.state).toBe("FRESH")
    expect(result.selected[0]).toBe(row)
    expect(result.selected[0]!.numeric_value).toBe("12.1234567890123456789")
  })
  it.each([
    [{ unit: "RATIO" }, "CANONICAL_UNIT_MISMATCH"],
    [{ currency: "INR" }, "CURRENCY_CONTRACT_MISMATCH"],
    [{ consolidation_scope: "UNKNOWN" }, "REPORTING_SCOPE_NOT_PROVEN"],
    [{ period_end: "2026-02-30" }, "REPORTING_PERIOD_INVALID"],
    [{ period_type: "TTM" }, "REPORTING_PERIOD_TYPE_NOT_PROVEN"],
    [{ source_record_id: "" }, "SOURCE_PROVENANCE_NOT_PROVEN"],
    [{ source_code: "UNAPPROVED" }, "SOURCE_AUTHORITY_MISMATCH"],
    [{ retrieved_at: "2027-01-01T00:00:00Z" }, "SOURCE_PROVENANCE_NOT_PROVEN"],
    [{ published_at: "2027-01-01T00:00:00Z" }, "SOURCE_PROVENANCE_NOT_PROVEN"],
    [{ fresh_until: null }, "FRESHNESS_BOUND_NOT_PROVEN"],
    [{ fresh_until: "2099-01-01T00:00:00Z" }, "METRIC_FRESHNESS_CONTRACT_MISMATCH"],
    [{ numeric_value: null }, "NUMERIC_INPUT_INVALID"],
    [{ numeric_value: "NaN" }, "NUMERIC_INPUT_INVALID"],
  ] as const)("blocks incompatible or missing metadata: %j", (patch, reason) => {
    expect(validate([{ ...row, ...patch }])).toMatchObject({ state: "REVIEW_REQUIRED", reason, selected: [] })
  })
  it("does not count duplicates as multiple periods", () => {
    expect(validate([row, { ...row, id: "r2" }], 2).reason).toBe("DISTINCT_REPORTING_PERIODS_INSUFFICIENT")
  })
  it("accepts three distinct comparable years in deterministic order", () => {
    const years = [2026, 2024, 2025].map(year => ({ ...row, id: String(year), period_start: `${year - 1}-04-01`, period_end: `${year}-03-31` }))
    expect(validate(years, 3).selected.map(x => x.id)).toEqual(["2024", "2025", "2026"])
  })
  it.each(["metric_code", "source_code", "consolidation_scope"] as const)("does not pool different %s series", field => {
    const different = { ...row, id: "r2", period_start: "2024-04-01", period_end: "2025-03-31", [field]: "OTHER" }
    const definitions = [definition, { ...definition, code: "OTHER", definition: { selection: "REVIEWED", period_type: "YEAR" } }]
    const unconstrained = definitions.map(d => ({ ...d, definition: { selection: "REVIEWED", period_type: "YEAR" } }))
    expect(validate([row, different], 2, unconstrained).reason).toBe("SERIES_BASIS_RECONCILIATION_REQUIRED")
  })
  it("exposes conflicting same-period latest observations", () => {
    expect(validate([row, { ...row, id: "r2", numeric_value: "15" }]).state).toBe("CONFLICTING")
  })
  it("uses a later compatible correction without modifying its original", () => {
    const corrected = { ...row, id: "r2", numeric_value: "15", retrieved_at: "2026-09-02T12:00:00Z" }
    expect(validate([Object.freeze(row), corrected]).selected).toEqual([corrected])
    expect(row.numeric_value).toBe("12.1234567890123456789")
  })
  it("does not count stale periods toward a current minimum", () => {
    expect(validate([{ ...row, fresh_until: "2026-10-01T00:00:00Z" }]).state).toBe("STALE")
  })
  it("does not accept an unreviewed definition", () => {
    expect(validate([row], 1, [{ ...definition, definition: { selection: "PROVISIONAL" } }]).reason).toBe("METRIC_CONTRACT_NOT_REVIEWED")
  })
  it("preserves factual false and zero but rejects absent typed values", () => {
    expect(validate([{ ...row, numeric_value: "0" }]).state).toBe("FRESH")
    expect(validate([{ ...row, numeric_value: null, boolean_value: false }], 1, [{ ...definition, value_kind: "BOOLEAN" }]).state).toBe("FRESH")
    expect(validate([{ ...row, numeric_value: null }], 1, [{ ...definition, value_kind: "BOOLEAN" }]).reason).toBe("CANONICAL_VALUE_KIND_INVALID")
  })
  it("checks currency for monetary observations without converting units", () => {
    const money = { ...row, unit: "INR_CRORE", currency: "INR" }
    const def = { ...definition, canonical_unit: "INR_CRORE" }
    expect(validate([money], 1, [def]).state).toBe("FRESH")
    expect(validate([{ ...money, currency: "USD" }], 1, [def]).reason).toBe("CURRENCY_CONTRACT_MISMATCH")
  })
  it("rejects invalid evaluation/cutoff rather than reading future evidence", () => {
    expect(validateObservationSeries({ rows: [row], definitions: [definition], minimum: 1, evaluationAsOfMs, sourceCutoffAtMs: evaluationAsOfMs + 4 * 60 * 60 * 1000 + 1 }).reason).toBe("INPUT_EVALUATION_CONTRACT_INVALID")
  })
  it("requires metadata review for legacy single-value and ownership caches", () => {
    expect(cachedEvidenceReadiness("AVAILABLE", { matchedSections: [{ numericValue: 0 }] }, 1).reason).toBe("NORMALIZED_INPUT_CONTRACT_NOT_PROVEN")
    expect(cachedEvidenceReadiness("AVAILABLE", { series: { Promoter: [] } }, 4).state).toBe("EVIDENCE_PRESENT_REVIEW_REQUIRED")
    expect(cachedEvidenceReadiness("CONFLICTING", null, 1).state).toBe("CONFLICTING")
  })
  it("validates calendar dates with no coercion", () => {
    expect(validDate("2024-02-29")).toBe(true)
    expect(validDate("2025-02-29")).toBe(false)
  })
})

const candle = { period_start: "2026-09-28T03:45:00Z", retrieved_at: "2026-09-29T00:00:00Z", close: "100", adjusted_close: null, provenance: { endpoint: "ANGEL_ONE" } }
describe("V1-4 market history census", () => {
  it("counts distinct Indian trading dates, not candle rows", () => {
    const result = inspectStoredHistory([candle, { ...candle, period_start: "2026-09-28T09:45:00Z" }], 2, sourceCutoffAtMs)
    expect(result).toMatchObject({ distinctSessions: 1, state: "INSUFFICIENT" })
  })
  it("does not treat adjusted_close presence or sufficient rows as adjustment/calendar proof", () => {
    expect(inspectStoredHistory([{ ...candle, adjusted_close: "100" }], 1, sourceCutoffAtMs)).toMatchObject({ state: "REVIEW_REQUIRED", reason: "ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN" })
  })
  it("blocks inconsistent same-session closes", () => {
    expect(inspectStoredHistory([candle, { ...candle, close: "101" }], 1, sourceCutoffAtMs).state).toBe("CONFLICTING")
  })
  it("does not count future or invalid candles", () => {
    expect(inspectStoredHistory([{ ...candle, close: "0" }, { ...candle, retrieved_at: "2027-01-01T00:00:00Z" }], 1, sourceCutoffAtMs)).toMatchObject({ distinctSessions: 0, state: "REVIEW_REQUIRED", reason: "HISTORY_INPUT_INVALID" })
  })
  it("does not count synthetic fixtures as real holding history", () => {
    expect(inspectStoredHistory([{ ...candle, provenance: { fixture: true } }], 1, sourceCutoffAtMs)).toMatchObject({ distinctSessions: 0, state: "REVIEW_REQUIRED" })
  })
})
