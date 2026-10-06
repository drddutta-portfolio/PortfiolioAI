import { validateObservationSeries, type InputObservation, type MetricDefinition } from "./p7-ic-input-validation.ts"

type Json = Readonly<Record<string, unknown>>

export interface RequirementReview {
  readonly id: string
  readonly portfolio_id: string
  readonly security_id: string
  readonly requirement_code: string
  readonly review_kind: string
  readonly decision: string
  readonly source_record_id: string | null
  readonly research_document_id: string | null
  readonly provider_document_id: string | null
  readonly source_payload_hash: string | null
  readonly supporting_quote: string | null
  readonly period_start: string | null
  readonly period_end: string | null
  readonly period_type: string | null
  readonly unit: string | null
  readonly currency: string | null
  readonly consolidation_scope: string | null
  readonly published_at: string | null
  readonly retrieved_at: string | null
  readonly fresh_through: string | null
  readonly review_version: string
  readonly reviewed_by: string | null
  readonly reviewed_at: string
  readonly review_hash: string
  readonly supersedes_review_id: string | null
  readonly metadata: Json
}

export interface ReviewedSourceRecord {
  readonly id: string
  readonly source_code: string
  readonly retrieved_at: string
  readonly published_at: string | null
  readonly payload_hash: string
  readonly raw_payload: Json
}

export interface ReviewedResearchDocument {
  readonly id: string
  readonly security_id: string
  readonly reporting_period_start: string | null
  readonly reporting_period_end: string | null
  readonly reporting_period_type: string | null
  readonly published_at: string | null
  readonly canonical_content_hash: string | null
  readonly identity_status: string
}

export interface ReviewedEvidenceResult {
  readonly state: "FRESH" | "REVIEW_REQUIRED" | "CONFLICTING" | "INSUFFICIENT"
  readonly reason: string
  readonly observations: readonly InputObservation[]
  readonly selectedReviewIds: readonly string[]
  readonly sourceRecordId: string | null
  readonly sourceCode: string | null
  readonly retrievedAt: string | null
  readonly evidenceAsOfDate: string | null
  readonly freshThrough: string | null
  readonly lineage: Json
}

const time = (value: string | null) => value ? Date.parse(value) : NaN
const str = (value: unknown) => typeof value === "string" ? value : null
const DECIMAL = /^-?\d+(?:\.\d+)?$/u
const HASH = /^[0-9a-f]{64}$/u
const validDate = (value: string | null) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/u.test(value)
  && new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value)

function payloadStrings(value: unknown, into: string[] = []): string[] {
  if (typeof value === "string") into.push(value)
  else if (Array.isArray(value)) value.forEach(item => payloadStrings(item, into))
  else if (value && typeof value === "object") Object.values(value as Record<string, unknown>).forEach(item => payloadStrings(item, into))
  return into
}
const payloadContains = (payload: Json, needle: string) => needle.length > 0 && payloadStrings(payload).some(text => text.includes(needle))

function fail(state: ReviewedEvidenceResult["state"], reason: string, ids: readonly string[] = []): ReviewedEvidenceResult {
  return { state, reason, observations: [], selectedReviewIds: ids, sourceRecordId: null, sourceCode: null,
    retrievedAt: null, evidenceAsOfDate: null, freshThrough: null, lineage: { version: "V1_4_REVIEW_LEDGER_ADAPTER_V1", reason } }
}

function humanReviewRequired(review: RequirementReview) {
  return review.review_kind.toUpperCase().includes("HUMAN")
    || review.review_kind.toUpperCase().includes("DOCUMENT")
    || str(review.metadata.review_authority)?.toUpperCase() === "HUMAN"
}

function validateSourceBinding(review: RequirementReview, securityId: string,
  sourceById: ReadonlyMap<string, ReviewedSourceRecord>, documentById: ReadonlyMap<string, ReviewedResearchDocument>,
  sourceCutoffAtMs: number) {
  const source = review.source_record_id ? sourceById.get(review.source_record_id) ?? null : null
  const document = review.research_document_id ? documentById.get(review.research_document_id) ?? null : null
  if (!source) return { ok: false as const, reason: "REVIEW_SOURCE_RECORD_REQUIRED", source, document }
  if (source) {
    if (!review.source_payload_hash || !HASH.test(review.source_payload_hash) || review.source_payload_hash !== source.payload_hash)
      return { ok: false as const, reason: "REVIEW_SOURCE_HASH_MISMATCH", source, document }
    if (!Number.isFinite(time(source.retrieved_at)) || time(source.retrieved_at) > sourceCutoffAtMs)
      return { ok: false as const, reason: "REVIEW_SOURCE_POST_CUTOFF", source, document }
    const payloadSecurityId = str(source.raw_payload.security_id)
    if (payloadSecurityId && payloadSecurityId !== securityId)
      return { ok: false as const, reason: "REVIEW_SOURCE_SECURITY_MISMATCH", source, document }
    if (!payloadSecurityId && !document)
      return { ok: false as const, reason: "REVIEW_SOURCE_SECURITY_NOT_PROVEN", source, document }
  }
  if (document) {
    if (document.security_id !== securityId || document.identity_status !== "VERIFIED")
      return { ok: false as const, reason: "REVIEW_DOCUMENT_SECURITY_OR_IDENTITY_MISMATCH", source, document }
    const expectedHash = str(review.metadata.document_content_hash)
    if (expectedHash && (!HASH.test(expectedHash) || expectedHash !== document.canonical_content_hash))
      return { ok: false as const, reason: "REVIEW_DOCUMENT_HASH_MISMATCH", source, document }
  }
  if (review.supporting_quote) {
    const inSource = payloadContains(source.raw_payload, review.supporting_quote)
    if (!inSource)
      return { ok: false as const, reason: "REVIEW_QUOTE_NOT_BOUND_TO_SOURCE", source, document }
  }
  return { ok: true as const, source, document }
}

export function validateReviewedRequirementEvidence(input: {
  readonly portfolioId: string
  readonly securityId: string
  readonly requirementCode: string
  readonly metricCodes: readonly string[]
  readonly minimum: number
  readonly reviews: readonly RequirementReview[]
  readonly sources: readonly ReviewedSourceRecord[]
  readonly documents: readonly ReviewedResearchDocument[]
  readonly definitions: readonly MetricDefinition[]
  readonly evaluationAsOfMs: number
  readonly sourceCutoffAtMs: number
}): ReviewedEvidenceResult | null {
  const { portfolioId, securityId, requirementCode, sourceCutoffAtMs, evaluationAsOfMs } = input
  const scoped = input.reviews.filter(review => review.portfolio_id === portfolioId
    && review.security_id === securityId && review.requirement_code === requirementCode)
  if (!scoped.length) return null
  if (!Number.isFinite(evaluationAsOfMs) || !Number.isFinite(sourceCutoffAtMs) || sourceCutoffAtMs > evaluationAsOfMs)
    return fail("REVIEW_REQUIRED", "REVIEW_EVALUATION_CONTRACT_INVALID")

  const preCutoff = scoped.filter(review => Number.isFinite(time(review.reviewed_at)) && time(review.reviewed_at) <= sourceCutoffAtMs)
  if (!preCutoff.length) return fail("REVIEW_REQUIRED", "REVIEW_CREATED_AFTER_SOURCE_CUTOFF", scoped.map(r => r.id))

  const byId = new Map(preCutoff.map(review => [review.id, review]))
  for (const review of preCutoff) {
    if (review.supersedes_review_id) {
      const prior = byId.get(review.supersedes_review_id)
      if (!prior || prior.portfolio_id !== portfolioId || prior.security_id !== securityId || prior.requirement_code !== requirementCode)
        return fail("REVIEW_REQUIRED", "REVIEW_SUPERSESSION_CONTEXT_INVALID", [review.id])
    }
  }
  const superseded = new Set(preCutoff.map(review => review.supersedes_review_id).filter((id): id is string => Boolean(id)))
  const active = preCutoff.filter(review => !superseded.has(review.id))
    .sort((a,b) => b.reviewed_at.localeCompare(a.reviewed_at) || b.id.localeCompare(a.id))
  if (!active.length) return fail("REVIEW_REQUIRED", "REVIEW_SUPERSESSION_CHAIN_INVALID")

  const sourceById = new Map(input.sources.map(source => [source.id, source]))
  const documentById = new Map(input.documents.map(document => [document.id, document]))
  const observations: InputObservation[] = []
  const supportIds: string[] = []
  const insufficientIds: string[] = []
  const contradictIds: string[] = []
  let latestSource: ReviewedSourceRecord | null = null
  let latestReview: RequirementReview | null = null

  for (const review of active) {
    if (!review.review_version || !HASH.test(review.review_hash))
      return fail("REVIEW_REQUIRED", "REVIEW_LEDGER_INTEGRITY_INVALID", [review.id])
    if (humanReviewRequired(review) && !review.reviewed_by)
      return fail("REVIEW_REQUIRED", "HUMAN_REVIEW_AUTHORITY_MISSING", [review.id])
    const decision = review.decision.toUpperCase()
    if (decision === "INSUFFICIENT") { insufficientIds.push(review.id); continue }
    if (decision === "CONTRADICTS" || decision === "REJECTED") { contradictIds.push(review.id); continue }
    if (decision !== "SUPPORTS" && decision !== "ACCEPTED")
      return fail("REVIEW_REQUIRED", "REVIEW_DECISION_NOT_APPROVED", [review.id])

    const bound = validateSourceBinding(review, securityId, sourceById, documentById, sourceCutoffAtMs)
    if (!bound.ok) return fail("REVIEW_REQUIRED", bound.reason, [review.id])
    if (!review.supporting_quote?.trim())
      return fail("REVIEW_REQUIRED", "REVIEW_SUPPORTING_QUOTE_MISSING", [review.id])
    if (review.retrieved_at && (!Number.isFinite(time(review.retrieved_at)) || time(review.retrieved_at) > sourceCutoffAtMs))
      return fail("REVIEW_REQUIRED", "REVIEW_RETRIEVAL_POST_CUTOFF", [review.id])
    if (review.published_at && (!Number.isFinite(time(review.published_at)) || time(review.published_at) > sourceCutoffAtMs))
      return fail("REVIEW_REQUIRED", "REVIEW_PUBLICATION_POST_CUTOFF", [review.id])

    const metricCode = str(review.metadata.metric_code)
    const numericValue = str(review.metadata.numeric_value)
    if (metricCode && numericValue != null) {
      if (!input.metricCodes.includes(metricCode) || !DECIMAL.test(numericValue))
        return fail("REVIEW_REQUIRED", "REVIEW_METRIC_OR_VALUE_INVALID", [review.id])
      const definition = input.definitions.find(row => row.code === metricCode)
      if (!definition) return fail("REVIEW_REQUIRED", "REVIEW_METRIC_DEFINITION_MISSING", [review.id])
      if (!review.period_end || !validDate(review.period_end) || !review.period_type || !review.unit
        || !review.consolidation_scope || !review.fresh_through || !Number.isFinite(time(review.fresh_through)))
        return fail("REVIEW_REQUIRED", "REVIEW_NUMERIC_METADATA_INCOMPLETE", [review.id])

      const periodAnchor = str(review.metadata.period_anchor)
      const scopeAnchor = str(review.metadata.scope_anchor)
      const publicationAnchor = str(review.metadata.publication_anchor)
      const unitAnchor = str(review.metadata.unit_anchor)
      if (!periodAnchor || !review.supporting_quote.includes(periodAnchor))
        return fail("REVIEW_REQUIRED", "REVIEW_PERIOD_ANCHOR_NOT_IN_QUOTE", [review.id])
      if (!scopeAnchor || !review.supporting_quote.includes(scopeAnchor))
        return fail("REVIEW_REQUIRED", "REVIEW_SCOPE_ANCHOR_NOT_IN_QUOTE", [review.id])
      const unitProven = review.unit === "PERCENT"
        ? review.supporting_quote.includes("%") || (unitAnchor ? review.supporting_quote.includes(unitAnchor) : false)
        : Boolean(unitAnchor && review.supporting_quote.includes(unitAnchor))
      if (!unitProven) return fail("REVIEW_REQUIRED", "REVIEW_UNIT_ANCHOR_NOT_IN_QUOTE", [review.id])
      if (review.published_at && (!publicationAnchor || !review.supporting_quote.includes(publicationAnchor)))
        return fail("REVIEW_REQUIRED", "REVIEW_PUBLICATION_ANCHOR_NOT_IN_QUOTE", [review.id])
      if (!review.supporting_quote.includes(numericValue))
        return fail("REVIEW_REQUIRED", "REVIEW_VALUE_NOT_IN_QUOTE", [review.id])

      const source = bound.source
      if (!source) return fail("REVIEW_REQUIRED", "NUMERIC_REVIEW_REQUIRES_SOURCE_RECORD", [review.id])
      if (review.retrieved_at && review.retrieved_at !== source.retrieved_at)
        return fail("REVIEW_REQUIRED", "REVIEW_RETRIEVAL_MISMATCH", [review.id])
      if (source.published_at && review.published_at !== source.published_at)
        return fail("REVIEW_REQUIRED", "REVIEW_PUBLICATION_MISMATCH", [review.id])

      observations.push({
        id: review.id, metric_code: metricCode, numeric_value: numericValue, text_value: null,
        boolean_value: null, date_value: null, unit: review.unit, currency: review.currency,
        consolidation_scope: review.consolidation_scope, period_start: review.period_start,
        period_end: review.period_end, period_type: review.period_type, retrieved_at: source.retrieved_at,
        fresh_until: review.fresh_through, published_at: review.published_at ?? source.published_at,
        evidence_status: "AVAILABLE", source_code: source.source_code, source_record_id: source.id,
      })
      supportIds.push(review.id); latestSource = source; latestReview = review
      continue
    }

    const document = bound.document
    if (!document) return fail("REVIEW_REQUIRED", "DOCUMENTARY_REVIEW_REQUIRES_DOCUMENT", [review.id])
    if (!review.fresh_through || !Number.isFinite(time(review.fresh_through)) || time(review.fresh_through) < evaluationAsOfMs)
      return fail("REVIEW_REQUIRED", "DOCUMENT_REVIEW_FRESHNESS_NOT_PROVEN", [review.id])
    if (review.period_end && document.reporting_period_end && review.period_end !== document.reporting_period_end)
      return fail("REVIEW_REQUIRED", "DOCUMENT_REVIEW_PERIOD_MISMATCH", [review.id])
    if (review.period_type && document.reporting_period_type && review.period_type !== document.reporting_period_type)
      return fail("REVIEW_REQUIRED", "DOCUMENT_REVIEW_PERIOD_TYPE_MISMATCH", [review.id])
    supportIds.push(review.id); latestReview = review; latestSource = bound.source
  }

  if (contradictIds.length && supportIds.length)
    return fail("CONFLICTING", "ACTIVE_REVIEWS_CONFLICT", [...supportIds, ...contradictIds])
  if (contradictIds.length)
    return fail("CONFLICTING", "ACTIVE_REVIEW_CONTRADICTS_REQUIREMENT", contradictIds)
  if (!supportIds.length && insufficientIds.length)
    return fail("INSUFFICIENT", "REVIEWED_SOURCE_INSUFFICIENT", insufficientIds)
  if (!supportIds.length) return fail("REVIEW_REQUIRED", "NO_APPROVED_ACTIVE_REVIEW", active.map(r => r.id))

  if (observations.length) {
    const validation = validateObservationSeries({
      rows: observations, definitions: input.definitions, minimum: input.minimum,
      evaluationAsOfMs, sourceCutoffAtMs,
    })
    if (validation.state !== "FRESH") return {
      ...fail(validation.state, validation.reason, supportIds), observations,
      lineage: { version: "V1_4_REVIEW_LEDGER_ADAPTER_V1", reviewIds: supportIds,
        sourceRecordIds: [...new Set(observations.map(row => row.source_record_id))] },
    }
    const selected = validation.selected
    const newest = [...selected].sort((a,b) => b.retrieved_at.localeCompare(a.retrieved_at) || b.id.localeCompare(a.id))[0]!
    return {
      state: "FRESH", reason: "REVIEWED_CANONICAL_OBSERVATION_READY", observations: selected,
      selectedReviewIds: selected.map(row => row.id), sourceRecordId: newest.source_record_id,
      sourceCode: newest.source_code, retrievedAt: newest.retrieved_at,
      evidenceAsOfDate: selected.at(-1)?.period_end ?? null,
      freshThrough: selected.map(row => row.fresh_until!).sort()[0] ?? null,
      lineage: { version: "V1_4_REVIEW_LEDGER_ADAPTER_V1", reviewIds: selected.map(row=>row.id),
        sourceRecordIds: [...new Set(selected.map(row=>row.source_record_id))] },
    }
  }

  return {
    state: "FRESH", reason: "REVIEWED_DOCUMENTARY_SUPPORT_READY", observations: [],
    selectedReviewIds: supportIds, sourceRecordId: latestSource?.id ?? null,
    sourceCode: latestSource?.source_code ?? "COMPANY_EXCHANGE_FILING",
    retrievedAt: latestSource?.retrieved_at ?? latestReview?.retrieved_at ?? null,
    evidenceAsOfDate: latestReview?.period_end ?? null,
    freshThrough: latestReview?.fresh_through ?? null,
    lineage: { version: "V1_4_REVIEW_LEDGER_ADAPTER_V1", reviewIds: supportIds,
      researchDocumentId: latestReview?.research_document_id ?? null },
  }
}
