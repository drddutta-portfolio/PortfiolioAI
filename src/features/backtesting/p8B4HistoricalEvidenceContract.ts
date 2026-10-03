import { createHash } from "node:crypto"

export const P8_B4_CONTRACT_VERSION = "P8_B4_POINT_IN_TIME_EVIDENCE_V1" as const
export const P8_B4_EXPERIMENT_ID = "P8_EXP_NSE_MONTHLY_6M_V1" as const

export type P8B4EvidenceDomain = "FUNDAMENTAL" | "DOCUMENT"

export type P8B4AvailabilityState =
  | "ELIGIBLE"
  | "INELIGIBLE_UNKNOWN_PUBLICATION_TIME"
  | "INELIGIBLE_UNKNOWN_SOURCE_AVAILABILITY_TIME"
  | "INELIGIBLE_NOT_STRICTLY_BEFORE_DECISION"
  | "INELIGIBLE_IDENTITY_MISMATCH"

export interface P8B4HistoricalEvidenceIdentity {
  readonly historicalIdentityId: string
  readonly historicalIsin: string
  readonly sourceCode: string
  readonly providerEntityId: string | null
  readonly sourceRecordId: string | null
}

export interface P8B4EvidenceTiming {
  /**
   * Time the evidence was publicly published by the authoritative source.
   * Must never be inferred from provider updated_at or PortfolioAI retrieval time.
   */
  readonly publishedAt: string | null
  /**
   * Earliest independently provable time the source evidence was available to a market participant.
   * For an official exchange filing this may equal publishedAt when the filing timestamp is the availability authority.
   */
  readonly sourceAvailableAt: string | null
  /**
   * Time PortfolioAI/provider observed the evidence. Audit-only; not a publication-time substitute.
   */
  readonly observedAt: string | null
  /**
   * Time PortfolioAI retrieved the evidence. Audit-only; retrospective retrieval does not by itself
   * prove or disprove historical market availability.
   */
  readonly retrievedAt: string
}

export interface P8B4EvidenceCandidate {
  readonly domain: P8B4EvidenceDomain
  readonly identity: P8B4HistoricalEvidenceIdentity
  readonly timing: P8B4EvidenceTiming
  readonly evidenceId: string
  readonly evidenceHash: string
  readonly transformationVersion: string | null
}

export interface P8B4EligibilityInput {
  readonly expectedHistoricalIdentityId: string
  readonly expectedHistoricalIsin: string
  readonly decisionAt: string
  readonly candidate: P8B4EvidenceCandidate
}

export interface P8B4EligibilityResult {
  readonly state: P8B4AvailabilityState
  readonly eligible: boolean
  readonly effectiveAvailabilityAt: string | null
}

function parseIso(value: string, field: string): number {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${field}: ${value}`)
  return parsed
}

export function evaluateP8B4PointInTimeEligibility(
  input: P8B4EligibilityInput,
): P8B4EligibilityResult {
  const { candidate } = input

  if (
    candidate.identity.historicalIdentityId !== input.expectedHistoricalIdentityId ||
    candidate.identity.historicalIsin !== input.expectedHistoricalIsin
  ) {
    return {
      state: "INELIGIBLE_IDENTITY_MISMATCH",
      eligible: false,
      effectiveAvailabilityAt: null,
    }
  }

  if (candidate.timing.publishedAt === null) {
    return {
      state: "INELIGIBLE_UNKNOWN_PUBLICATION_TIME",
      eligible: false,
      effectiveAvailabilityAt: null,
    }
  }

  if (candidate.timing.sourceAvailableAt === null) {
    return {
      state: "INELIGIBLE_UNKNOWN_SOURCE_AVAILABILITY_TIME",
      eligible: false,
      effectiveAvailabilityAt: null,
    }
  }

  const publication = parseIso(candidate.timing.publishedAt, "publishedAt")
  const availability = parseIso(candidate.timing.sourceAvailableAt, "sourceAvailableAt")
  const decision = parseIso(input.decisionAt, "decisionAt")

  const effective = Math.max(publication, availability)

  // Frozen P8 signal-lag contract: equality is ineligible.
  if (effective >= decision) {
    return {
      state: "INELIGIBLE_NOT_STRICTLY_BEFORE_DECISION",
      eligible: false,
      effectiveAvailabilityAt: new Date(effective).toISOString(),
    }
  }

  return {
    state: "ELIGIBLE",
    eligible: true,
    effectiveAvailabilityAt: new Date(effective).toISOString(),
  }
}

export function p8B4EvidenceSemanticKey(candidate: P8B4EvidenceCandidate): string {
  return JSON.stringify([
    P8_B4_CONTRACT_VERSION,
    P8_B4_EXPERIMENT_ID,
    candidate.domain,
    candidate.identity.historicalIdentityId,
    candidate.identity.historicalIsin,
    candidate.identity.sourceCode,
    candidate.identity.providerEntityId,
    candidate.identity.sourceRecordId,
    candidate.evidenceId,
    candidate.evidenceHash,
    candidate.transformationVersion,
    candidate.timing.publishedAt,
    candidate.timing.sourceAvailableAt,
    candidate.timing.observedAt,
    candidate.timing.retrievedAt,
  ])
}

export function p8B4EvidenceFingerprint(candidate: P8B4EvidenceCandidate): string {
  return createHash("sha256").update(p8B4EvidenceSemanticKey(candidate)).digest("hex")
}


export type P8B4RevisionKind = "ORIGINAL" | "AMENDMENT" | "RESTATEMENT"

export interface P8B4VersionedEvidence {
  readonly evidenceId: string
  readonly semanticSeriesKey: string
  readonly revisionKind: P8B4RevisionKind
  readonly supersedesEvidenceId: string | null
  readonly publishedAt: string | null
  readonly evidenceHash: string
}

export function validateP8B4VersionedEvidence(
  candidate: P8B4VersionedEvidence,
  priorById: ReadonlyMap<string, P8B4VersionedEvidence>,
): P8B4VersionedEvidence {
  if (!candidate.evidenceId || !candidate.semanticSeriesKey || !candidate.evidenceHash) {
    throw new Error("P8-B4 versioned evidence is missing a stable identity, semantic series key, or hash.")
  }

  if (candidate.revisionKind === "ORIGINAL") {
    if (candidate.supersedesEvidenceId !== null) {
      throw new Error("P8-B4 ORIGINAL evidence cannot supersede another evidence item.")
    }
    return candidate
  }

  if (candidate.supersedesEvidenceId === null) {
    throw new Error("P8-B4 amendment/restatement must explicitly link the superseded evidence item.")
  }
  if (candidate.supersedesEvidenceId === candidate.evidenceId) {
    throw new Error("P8-B4 evidence cannot supersede itself.")
  }

  const prior = priorById.get(candidate.supersedesEvidenceId)
  if (!prior) {
    throw new Error("P8-B4 superseded evidence item is not present in the immutable history.")
  }
  if (prior.semanticSeriesKey !== candidate.semanticSeriesKey) {
    throw new Error("P8-B4 revision cannot cross semantic evidence series.")
  }

  if (candidate.publishedAt !== null && prior.publishedAt !== null) {
    const currentPublished = parseIso(candidate.publishedAt, "publishedAt")
    const priorPublished = parseIso(prior.publishedAt, "prior publishedAt")
    if (currentPublished < priorPublished) {
      throw new Error("P8-B4 revision publication time cannot precede the evidence it supersedes.")
    }
  }

  return candidate
}

export interface P8B4AppendDecision {
  readonly disposition: "APPEND_NEW" | "IDEMPOTENT_EXISTING"
  readonly existingEvidenceId: string | null
}

export function decideP8B4Append(
  candidate: P8B4EvidenceCandidate,
  existingByFingerprint: ReadonlyMap<string, string>,
): P8B4AppendDecision {
  const fingerprint = p8B4EvidenceFingerprint(candidate)
  const existingEvidenceId = existingByFingerprint.get(fingerprint) ?? null
  return existingEvidenceId
    ? { disposition: "IDEMPOTENT_EXISTING", existingEvidenceId }
    : { disposition: "APPEND_NEW", existingEvidenceId: null }
}
