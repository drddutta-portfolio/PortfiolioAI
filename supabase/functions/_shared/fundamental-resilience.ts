export type FundamentalPeriodType = "POINT_IN_TIME" | "QUARTER" | "HALF_YEAR" | "YEAR" | "TTM"
export type ConsolidationScope = "STANDALONE" | "CONSOLIDATED" | "UNKNOWN"

export interface StructuredFundamentalField {
  readonly sourceCode: string
  readonly sourceRecordId: string
  readonly sourceFieldPath: string
  readonly originalValue: string
  readonly metricCode: string
  readonly normalizedValue: string
  readonly unit: string | null
  readonly currency: string | null
  readonly periodStart: string | null
  readonly periodEnd: string | null
  readonly periodType: FundamentalPeriodType | null
  readonly consolidationScope: ConsolidationScope | null
  readonly accountingStandard: string | null
  readonly observedAt: string | null
  readonly publishedAt: string | null
  readonly retrievedAt: string
  readonly freshUntil: string
}

export interface CanonicalFundamentalCandidate extends StructuredFundamentalField {
  readonly observationId: string
}

export interface ProviderNeutralStage8Input {
  readonly observationId: string
  readonly metricCode: string
  readonly normalizedValue: string
  readonly unit: string | null
  readonly currency: string | null
  readonly periodEnd: string | null
  readonly periodType: FundamentalPeriodType | null
  readonly consolidationScope: ConsolidationScope | null
  readonly publishedAt: string | null
}

export function validateStructuredFundamentalField(field: StructuredFundamentalField): StructuredFundamentalField {
  if (!field.sourceCode || !field.sourceRecordId || !field.sourceFieldPath || !field.metricCode || !field.originalValue || !field.normalizedValue) {
    throw new Error("Structured fundamental evidence is missing required source or canonical fields.")
  }
  if (!Number.isFinite(Date.parse(field.retrievedAt)) || !Number.isFinite(Date.parse(field.freshUntil))) {
    throw new Error("Structured fundamental evidence has an invalid retrieval or freshness timestamp.")
  }
  if (field.publishedAt !== null && !Number.isFinite(Date.parse(field.publishedAt))) {
    throw new Error("Structured fundamental evidence has an invalid publication timestamp.")
  }
  return field
}

export function fundamentalSemanticKey(field: StructuredFundamentalField): string {
  return JSON.stringify([
    field.metricCode,
    field.periodStart,
    field.periodEnd,
    field.periodType,
    field.consolidationScope,
    field.unit,
    field.currency,
    field.accountingStandard,
  ])
}

export function selectMetricLevelFallback(
  requiredSemanticKeys: readonly string[],
  primary: readonly CanonicalFundamentalCandidate[],
  fallbacks: readonly CanonicalFundamentalCandidate[],
): readonly CanonicalFundamentalCandidate[] {
  const primaryByKey = new Map(primary.map((candidate) => [fundamentalSemanticKey(candidate),candidate]))
  const fallbackByKey = new Map<string,CanonicalFundamentalCandidate>()
  for (const candidate of fallbacks) {
    const key = fundamentalSemanticKey(candidate)
    if (!fallbackByKey.has(key)) fallbackByKey.set(key,candidate)
  }
  return requiredSemanticKeys.flatMap((key) => {
    const candidate = primaryByKey.get(key) ?? fallbackByKey.get(key)
    return candidate ? [candidate] : []
  })
}

export function reconciliationMembers(
  left: CanonicalFundamentalCandidate,
  right: CanonicalFundamentalCandidate,
): readonly [string,string] | null {
  if (fundamentalSemanticKey(left)!==fundamentalSemanticKey(right) || left.normalizedValue===right.normalizedValue) return null
  return [left.observationId,right.observationId]
}

export function storedObservationAfterRefresh(
  cached: CanonicalFundamentalCandidate,
  refreshStatus: "SUCCEEDED" | "FAILED",
  now: Date,
): { readonly observation: CanonicalFundamentalCandidate; readonly freshness: "AVAILABLE" | "STALE"; readonly refreshStatus: "SUCCEEDED" | "FAILED" } {
  return {
    observation: cached,
    freshness: Date.parse(cached.freshUntil)>now.getTime() ? "AVAILABLE" : "STALE",
    refreshStatus,
  }
}

export function toProviderNeutralStage8Input(candidate: CanonicalFundamentalCandidate): ProviderNeutralStage8Input {
  return {
    observationId:candidate.observationId,
    metricCode:candidate.metricCode,
    normalizedValue:candidate.normalizedValue,
    unit:candidate.unit,
    currency:candidate.currency,
    periodEnd:candidate.periodEnd,
    periodType:candidate.periodType,
    consolidationScope:candidate.consolidationScope,
    publishedAt:candidate.publishedAt,
  }
}

export interface ResearchDocumentIdentityEvidence {
  readonly sourceRecordId: string
  readonly contentHash: string | null
  readonly authoritativeScheme: string | null
  readonly authoritativeIdentifier: string | null
  readonly verifiedMetadataHash: string | null
}

export function researchDocumentIdentityKey(evidence: ResearchDocumentIdentityEvidence): string {
  if (evidence.contentHash) return `CONTENT_SHA256:${evidence.contentHash}`
  if (evidence.authoritativeScheme && evidence.authoritativeIdentifier) return `AUTHORITY:${evidence.authoritativeScheme}:${evidence.authoritativeIdentifier}`
  if (evidence.verifiedMetadataHash) return `VERIFIED_METADATA:${evidence.verifiedMetadataHash}`
  return `REVIEW_REQUIRED:${evidence.sourceRecordId}`
}
