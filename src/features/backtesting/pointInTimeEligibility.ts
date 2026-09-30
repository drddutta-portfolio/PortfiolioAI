export const P8_POINT_IN_TIME_CONTRACT_VERSION = "P8_POINT_IN_TIME_ELIGIBILITY_V1" as const

export type P8AvailabilityProof = "CONTEMPORANEOUS_CAPTURE" | "IMMUTABLE_PUBLICATION_ARCHIVE"

export const P8_BLOCKER_CODES = [
  "DECISION_TIME_MISSING",
  "OBSERVATION_TIME_MISSING",
  "PUBLICATION_TIME_MISSING",
  "AVAILABILITY_PROOF_MISSING",
  "SOURCE_IDENTITY_MISSING",
  "OBSERVED_AFTER_DECISION",
  "PUBLISHED_AFTER_DECISION",
  "CAPTURED_AFTER_DECISION",
  "UNIVERSE_MEMBERSHIP_NOT_PROVEN",
  "OUTCOME_WINDOW_OVERLAPS_DECISION",
] as const

export type P8BlockerCode = typeof P8_BLOCKER_CODES[number]

export interface P8PointInTimeCandidate {
  readonly decisionAsOf: string | null
  readonly observedAt: string | null
  readonly publishedAt: string | null
  readonly capturedAt: string | null
  readonly availabilityProof: P8AvailabilityProof | null
  readonly sourceIdentity: string | null
  readonly universeMemberAsOfDecision: boolean | null
  readonly outcomeWindowStartsAt: string | null
}

export interface P8PointInTimeEligibility {
  readonly version: typeof P8_POINT_IN_TIME_CONTRACT_VERSION
  readonly eligible: boolean
  readonly blockers: readonly P8BlockerCode[]
}

function time(value: string | null) {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function evaluateP8PointInTimeEligibility(candidate: P8PointInTimeCandidate): P8PointInTimeEligibility {
  const blockers: P8BlockerCode[] = []
  const decision = time(candidate.decisionAsOf)
  const observed = time(candidate.observedAt)
  const published = time(candidate.publishedAt)
  const captured = time(candidate.capturedAt)
  const outcomeStart = time(candidate.outcomeWindowStartsAt)

  if (decision === null) blockers.push("DECISION_TIME_MISSING")
  if (observed === null) blockers.push("OBSERVATION_TIME_MISSING")
  if (published === null) blockers.push("PUBLICATION_TIME_MISSING")
  if (!candidate.availabilityProof) blockers.push("AVAILABILITY_PROOF_MISSING")
  if (!candidate.sourceIdentity?.trim()) blockers.push("SOURCE_IDENTITY_MISSING")
  if (decision !== null && observed !== null && observed > decision) blockers.push("OBSERVED_AFTER_DECISION")
  if (decision !== null && published !== null && published > decision) blockers.push("PUBLISHED_AFTER_DECISION")
  if (
    decision !== null
    && captured !== null
    && captured > decision
    && candidate.availabilityProof !== "IMMUTABLE_PUBLICATION_ARCHIVE"
  ) blockers.push("CAPTURED_AFTER_DECISION")
  if (candidate.universeMemberAsOfDecision !== true) blockers.push("UNIVERSE_MEMBERSHIP_NOT_PROVEN")
  if (decision !== null && outcomeStart !== null && outcomeStart <= decision) blockers.push("OUTCOME_WINDOW_OVERLAPS_DECISION")

  return { version: P8_POINT_IN_TIME_CONTRACT_VERSION, eligible: blockers.length === 0, blockers }
}
