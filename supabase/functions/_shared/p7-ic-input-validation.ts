/** Validation only: no ingestion, source substitution, financial calculation or writes. */
export const P7_IC_INPUT_VALIDATION_VERSION = "P7_IC_V1_4_INPUT_VALIDATION_V1"
type Json = Readonly<Record<string, unknown>>
export interface MetricDefinition {
  readonly code: string
  readonly canonical_unit: string
  readonly value_kind: string
  readonly is_active: boolean
  readonly freshness_seconds: number
  readonly definition: Json
}
export interface InputObservation {
  readonly id: string
  readonly metric_code: string
  readonly numeric_value: number | string | null
  readonly text_value: string | null
  readonly boolean_value: boolean | null
  readonly date_value: string | null
  readonly unit: string | null
  readonly currency: string | null
  readonly consolidation_scope: string | null
  readonly period_start: string | null
  readonly period_end: string | null
  readonly period_type: string | null
  readonly retrieved_at: string
  readonly fresh_until: string | null
  readonly published_at: string | null
  readonly evidence_status: string
  readonly source_code: string
  readonly source_record_id: string
}
export type InputState = "FRESH" | "STALE" | "REVIEW_REQUIRED" | "CONFLICTING" | "INSUFFICIENT"
export interface InputValidation {
  readonly state: InputState
  readonly reason: string
  readonly selected: readonly InputObservation[]
}
export function validDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false
  const parsed = Date.parse(value + "T00:00:00Z")
  if (!Number.isFinite(parsed)) return false
  try { return new Date(parsed).toISOString().slice(0, 10) === value } catch { return false }
}
const timestamp = (value: string | null) => value ? Date.parse(value) : NaN
const fail = (state: InputState, reason: string): InputValidation => ({ state, reason, selected: [] })
const semantic = (row: InputObservation) => JSON.stringify([
  row.numeric_value == null ? null : String(row.numeric_value), row.text_value,
  row.boolean_value, row.date_value, row.period_start, row.period_end, row.period_type,
  row.unit, row.currency, row.consolidation_scope, row.source_code,
])

/** A history belongs to one metric/source/unit/currency/scope/period basis. */
export function validateObservationSeries(input: {
  readonly rows: readonly InputObservation[]
  readonly definitions: readonly MetricDefinition[]
  readonly minimum: number
  readonly evaluationAsOfMs: number
  readonly sourceCutoffAtMs: number
}): InputValidation {
  const { rows, minimum, evaluationAsOfMs, sourceCutoffAtMs } = input
  const postCloseRetrievalWindowMs=6*60*60*1000
  if (!Number.isInteger(minimum) || minimum < 1 || !Number.isFinite(evaluationAsOfMs)
    || !Number.isFinite(sourceCutoffAtMs) || sourceCutoffAtMs < evaluationAsOfMs
    || sourceCutoffAtMs > evaluationAsOfMs + postCloseRetrievalWindowMs) {
    return fail("REVIEW_REQUIRED", "INPUT_EVALUATION_CONTRACT_INVALID")
  }
  if (!rows.length) return fail("INSUFFICIENT", "REQUIRED_EVIDENCE_MISSING")
  if (rows.some(row => row.evidence_status === "CONFLICTING")) return fail("CONFLICTING", "CANONICAL_OBSERVATION_CONFLICT")
  const definitions = new Map(input.definitions.map(row => [row.code, row]))
  const groups = new Map<string, InputObservation[]>()
  for (const row of rows) {
    const definition = definitions.get(row.metric_code)
    const contract = definition?.definition
    const historyReviewed = contract?.trendlyne_history_selection === "REVIEWED"
      && contract.trendlyne_history_period_type === row.period_type
    const reviewed = contract?.selection === "REVIEWED"
      || (contract?.trendlyne_selection === "REVIEWED" && contract.trendlyne_period_type === row.period_type)
      || historyReviewed
    if (!definition?.is_active || !reviewed) return fail("REVIEW_REQUIRED", "METRIC_CONTRACT_NOT_REVIEWED")
    const expectedPeriod = historyReviewed ? contract?.trendlyne_history_period_type
      : contract?.period_type ?? contract?.trendlyne_period_type
    if (typeof expectedPeriod !== "string" || row.period_type !== expectedPeriod) return fail("REVIEW_REQUIRED", "REPORTING_PERIOD_TYPE_NOT_PROVEN")
    if (!validDate(row.period_end) || (row.period_start != null && (!validDate(row.period_start) || row.period_start > row.period_end))
      || timestamp(row.period_end) > evaluationAsOfMs) return fail("REVIEW_REQUIRED", "REPORTING_PERIOD_INVALID")
    if (row.unit !== definition.canonical_unit) return fail("REVIEW_REQUIRED", "CANONICAL_UNIT_MISMATCH")
    const monetary = /^(INR|USD|EUR|GBP)(?:_|$)/u.exec(definition.canonical_unit)
    if ((monetary && row.currency !== monetary[1]) || (!monetary && row.currency !== null)) return fail("REVIEW_REQUIRED", "CURRENCY_CONTRACT_MISMATCH")
    if (!row.consolidation_scope || row.consolidation_scope === "UNKNOWN" || row.consolidation_scope === "UNSPECIFIED") return fail("REVIEW_REQUIRED", "REPORTING_SCOPE_NOT_PROVEN")
    if (contract?.scope_guard === "CONSOLIDATED_ATTRIBUTABLE_TO_OWNERS" && row.consolidation_scope !== "CONSOLIDATED") return fail("REVIEW_REQUIRED", "REPORTING_SCOPE_MISMATCH")
    if (!row.source_record_id || !row.source_code || !Number.isFinite(timestamp(row.retrieved_at))
      || timestamp(row.retrieved_at) > sourceCutoffAtMs
      || (row.published_at != null && (!Number.isFinite(timestamp(row.published_at)) || timestamp(row.published_at) > evaluationAsOfMs))) return fail("REVIEW_REQUIRED", "SOURCE_PROVENANCE_NOT_PROVEN")
    if (typeof contract?.provider === "string" && contract.provider !== row.source_code) return fail("REVIEW_REQUIRED", "SOURCE_AUTHORITY_MISMATCH")
    if (Array.isArray(contract?.source_priority) && !contract.source_priority.includes(row.source_code)) return fail("REVIEW_REQUIRED", "SOURCE_AUTHORITY_MISMATCH")
    const valueValid = definition.value_kind === "NUMERIC" ? row.numeric_value != null && /^-?\d+(?:\.\d+)?$/u.test(String(row.numeric_value))
      : definition.value_kind === "TEXT" ? typeof row.text_value === "string" && row.text_value.trim().length > 0
      : definition.value_kind === "BOOLEAN" ? typeof row.boolean_value === "boolean"
      : definition.value_kind === "DATE" ? validDate(row.date_value) : false
    if (!valueValid) return fail("REVIEW_REQUIRED", definition.value_kind === "NUMERIC" ? "NUMERIC_INPUT_INVALID" : "CANONICAL_VALUE_KIND_INVALID")
    if (row.evidence_status !== "AVAILABLE") return fail(row.evidence_status === "STALE" ? "STALE" : "REVIEW_REQUIRED", "OBSERVATION_NOT_AVAILABLE")
    if (!Number.isFinite(timestamp(row.fresh_until))) return fail("REVIEW_REQUIRED", "FRESHNESS_BOUND_NOT_PROVEN")
    if (!Number.isInteger(definition.freshness_seconds) || definition.freshness_seconds <= 0
      || timestamp(row.fresh_until) > timestamp(row.retrieved_at) + definition.freshness_seconds * 1000) return fail("REVIEW_REQUIRED", "METRIC_FRESHNESS_CONTRACT_MISMATCH")
    // Retain older observations, but they cannot satisfy current readiness.
    if (timestamp(row.fresh_until) < evaluationAsOfMs) continue
    const basis = JSON.stringify([row.metric_code, row.source_code, row.unit, row.currency, row.consolidation_scope, row.period_type])
    const group = groups.get(basis) ?? []
    group.push(row); groups.set(basis, group)
  }
  if (!groups.size) return fail("STALE", "ONLY_STALE_REQUIRED_EVIDENCE")
  if (groups.size > 1) return fail("REVIEW_REQUIRED", "SERIES_BASIS_RECONCILIATION_REQUIRED")
  const byPeriod = new Map<string, InputObservation[]>()
  for (const row of [...groups.values()][0]!) {
    const group = byPeriod.get(row.period_end!) ?? []
    group.push(row); byPeriod.set(row.period_end!, group)
  }
  const selected: InputObservation[] = []
  for (const group of byPeriod.values()) {
    group.sort((a, b) => b.retrieved_at.localeCompare(a.retrieved_at) || b.id.localeCompare(a.id))
    const latest = group.filter(row => timestamp(row.retrieved_at) === timestamp(group[0]!.retrieved_at))
    if (new Set(latest.map(semantic)).size > 1) return fail("CONFLICTING", "MULTIPLE_FRESH_CANONICAL_CANDIDATES")
    selected.push(latest[0]!)
  }
  selected.sort((a, b) => a.period_end!.localeCompare(b.period_end!))
  if (selected.length < minimum) return fail("INSUFFICIENT", "DISTINCT_REPORTING_PERIODS_INSUFFICIENT")
  return { state: "FRESH", reason: "CANONICAL_OBSERVATION_READY", selected }
}

/** Legacy aggregates have no reviewed metadata contract. Preserve for review. */
export function cachedEvidenceReadiness(state: string, value: unknown, minimum: number) {
  if (state !== "AVAILABLE") return { state, reason: null }
  const row = value && typeof value === "object" ? value as Json : null
  return {
    state: "EVIDENCE_PRESENT_REVIEW_REQUIRED",
    reason: minimum > 1 && Array.isArray(row?.matchedSections)
      ? "DATED_REPORTING_PERIODS_NOT_PROVEN" : "NORMALIZED_INPUT_CONTRACT_NOT_PROVEN",
  }
}

export interface HistoryRow {
  readonly period_start: string
  readonly retrieved_at: string
  readonly close: number | string | null
  readonly adjusted_close?: number | string | null
  readonly provenance: Json | null
}
export interface HistoryValidation {
  readonly state: InputState
  readonly reason: string
  readonly distinctSessions: number
  readonly latestSession: string | null
  readonly retrievedAt: string | null
}
/** A storage-row census is not an adjusted/aligned trading-calendar contract. */
export function inspectStoredHistory(rows: readonly HistoryRow[], minimum: number, cutoffMs: number): HistoryValidation {
  if (!Number.isInteger(minimum) || minimum < 1 || !Number.isFinite(cutoffMs)) return {
    state: "REVIEW_REQUIRED", reason: "HISTORY_EVALUATION_CONTRACT_INVALID", distinctSessions: 0, latestSession: null, retrievedAt: null,
  }
  const sessions = new Map<string, HistoryRow>()
  let conflict = false, invalid = false
  for (const row of rows) {
    const instant = timestamp(row.period_start)
    if (!Number.isFinite(instant) || !Number.isFinite(timestamp(row.retrieved_at))
      || timestamp(row.retrieved_at) > cutoffMs || instant > cutoffMs
      || !row.provenance || row.provenance.fixture === true
      || row.close == null || !/^\d+(?:\.\d+)?$/u.test(String(row.close))
      || /^0(?:\.0+)?$/u.test(String(row.close))) { invalid = true; continue }
    const session = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(instant))
    const previous = sessions.get(session)
    if (previous && JSON.stringify([String(previous.close), previous.adjusted_close ?? null]) !== JSON.stringify([String(row.close), row.adjusted_close ?? null])) conflict = true
    else if (!previous || timestamp(row.retrieved_at) > timestamp(previous.retrieved_at)) sessions.set(session, row)
  }
  const dates = [...sessions.keys()].sort()
  const retrieved = [...sessions.values()].map(row => row.retrieved_at).sort()
  return {
    state: conflict ? "CONFLICTING" : invalid ? "REVIEW_REQUIRED" : dates.length < minimum ? "INSUFFICIENT" : "REVIEW_REQUIRED",
    reason: conflict ? "DUPLICATE_SESSION_CONFLICT" : invalid ? "HISTORY_INPUT_INVALID" : dates.length < minimum ? "DISTINCT_SESSIONS_INSUFFICIENT" : "ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN",
    distinctSessions: dates.length, latestSession: dates.at(-1) ?? null, retrievedAt: retrieved.at(-1) ?? null,
  }
}
