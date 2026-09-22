export const PHARMA_REGULATORY_EVENT_EVIDENCE_CONTRACT_VERSION = "PHARMA_REGULATORY_EVENT_EVIDENCE_V1" as const

export type PharmaRegulatoryEventState =
  | "WARNING_LETTER_ACTIVE"
  | "WARNING_LETTER_CLOSED_OUT"

export interface PharmaRegulatoryEventEvidenceCandidate {
  readonly securityId: string
  readonly metricCode: "PHARMA_REGULATORY_SITE_STATUS"
  readonly eventDate: string
  readonly eventState: PharmaRegulatoryEventState
  readonly regulatorCode: "US_FDA"
  readonly facilityKey: string
  readonly facilityName: string
  readonly regulatoryChainId: string
  readonly sourceArtifactCode: string
  readonly sourceReference: string
  readonly scope: "SITE_SPECIFIC"
}

export type PharmaRegulatoryEventValidationIssueCode =
  | "INVALID_SECURITY_ID"
  | "INVALID_EVENT_DATE"
  | "INVALID_METRIC"
  | "INVALID_REGULATOR"
  | "MISSING_FACILITY_KEY"
  | "MISSING_FACILITY_NAME"
  | "MISSING_REGULATORY_CHAIN_ID"
  | "MISSING_SOURCE_ARTIFACT"
  | "MISSING_SOURCE_REFERENCE"
  | "INVALID_SCOPE"
  | "DUPLICATE_EVENT"
  | "INVALID_CHAIN_TRANSITION"

export interface PharmaRegulatoryEventEvidenceValidationResult {
  readonly accepted: readonly PharmaRegulatoryEventEvidenceCandidate[]
  readonly quarantined: readonly {
    readonly row: PharmaRegulatoryEventEvidenceCandidate
    readonly issueCodes: readonly PharmaRegulatoryEventValidationIssueCode[]
  }[]
  readonly idempotencyKeys: readonly string[]
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u

function isIsoDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}

const eventIdentity = (row: PharmaRegulatoryEventEvidenceCandidate) =>
  `${row.securityId}:${row.metricCode}:${row.regulatorCode}:${row.facilityKey}:${row.regulatoryChainId}:${row.eventDate}:${row.eventState}`

function transitionIsValid(
  previous: PharmaRegulatoryEventEvidenceCandidate | undefined,
  current: PharmaRegulatoryEventEvidenceCandidate,
): boolean {
  if (!previous) return current.eventState === "WARNING_LETTER_ACTIVE"
  if (previous.regulatoryChainId !== current.regulatoryChainId) return true
  if (previous.facilityKey !== current.facilityKey) return true
  if (previous.eventDate >= current.eventDate) return false
  if (previous.eventState === "WARNING_LETTER_ACTIVE") return current.eventState === "WARNING_LETTER_CLOSED_OUT"
  return false
}

/**
 * Pure event-evidence validation only.
 * No storage table, repository, provider, database or network dependency is introduced by this contract.
 */
export function validatePharmaRegulatoryEventEvidenceCandidates(
  candidates: readonly PharmaRegulatoryEventEvidenceCandidate[],
): PharmaRegulatoryEventEvidenceValidationResult {
  const accepted: PharmaRegulatoryEventEvidenceCandidate[] = []
  const quarantined: PharmaRegulatoryEventEvidenceValidationResult["quarantined"][number][] = []
  const seen = new Set<string>()
  const byChain = new Map<string, PharmaRegulatoryEventEvidenceCandidate>()

  const ordered = [...candidates].sort((left, right) =>
    `${left.regulatoryChainId}:${left.facilityKey}:${left.eventDate}`.localeCompare(
      `${right.regulatoryChainId}:${right.facilityKey}:${right.eventDate}`,
    ),
  )

  for (const row of ordered) {
    const issues: PharmaRegulatoryEventValidationIssueCode[] = []
    if (!UUID_PATTERN.test(row.securityId)) issues.push("INVALID_SECURITY_ID")
    if (!isIsoDate(row.eventDate)) issues.push("INVALID_EVENT_DATE")
    if (row.metricCode !== "PHARMA_REGULATORY_SITE_STATUS") issues.push("INVALID_METRIC")
    if (row.regulatorCode !== "US_FDA") issues.push("INVALID_REGULATOR")
    if (!row.facilityKey.trim()) issues.push("MISSING_FACILITY_KEY")
    if (!row.facilityName.trim()) issues.push("MISSING_FACILITY_NAME")
    if (!row.regulatoryChainId.trim()) issues.push("MISSING_REGULATORY_CHAIN_ID")
    if (!row.sourceArtifactCode.trim()) issues.push("MISSING_SOURCE_ARTIFACT")
    if (!row.sourceReference.trim()) issues.push("MISSING_SOURCE_REFERENCE")
    if (row.scope !== "SITE_SPECIFIC") issues.push("INVALID_SCOPE")

    const identity = eventIdentity(row)
    if (seen.has(identity)) issues.push("DUPLICATE_EVENT")
    seen.add(identity)

    const chainKey = `${row.securityId}:${row.regulatorCode}:${row.facilityKey}:${row.regulatoryChainId}`
    const previous = byChain.get(chainKey)
    if (!transitionIsValid(previous, row)) issues.push("INVALID_CHAIN_TRANSITION")

    if (issues.length) quarantined.push({ row, issueCodes: issues })
    else {
      accepted.push(row)
      byChain.set(chainKey, row)
    }
  }

  return {
    accepted,
    quarantined,
    idempotencyKeys: accepted.map((row) => `R4N_EVENT:${eventIdentity(row)}:${row.sourceArtifactCode}`),
  }
}
