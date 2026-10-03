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
