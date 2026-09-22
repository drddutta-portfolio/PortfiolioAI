import type { EvidenceIngestionCandidate, EvidenceValidationIssueCode } from "./researchEvidenceIngestionValidator"
import { validateEvidenceIngestionCandidates } from "./researchEvidenceIngestionValidator"
import { buildTorntpharmReadOnlyContentReviewDryRun } from "./torntpharmReadOnlyContentReviewDryRun"
import { validatePharmaRegulatoryEventEvidenceCandidates, type PharmaRegulatoryEventValidationIssueCode } from "./pharmaRegulatoryEventEvidenceContract"

export type CandidateIngestionDisposition =
  | "VALIDATOR_CONTRACT_EXTENSION_REQUIRED"
  | "EVENT_EVIDENCE_SCHEMA_REQUIRED"
  | "EVENT_STORAGE_IMPLEMENTATION_REQUIRED"
  | "SEPARATE_INGESTION_APPROVAL_REQUIRED"

export interface CandidateIngestionProposalItem {
  readonly metricCode: string
  readonly artifactCode: string
  readonly observationDate: string
  readonly value: string
  readonly unit: string
  readonly disposition: CandidateIngestionDisposition
  readonly validatorIssueCodes: readonly (EvidenceValidationIssueCode | PharmaRegulatoryEventValidationIssueCode)[]
  readonly rationale: string
}

export interface TorntpharmCandidateToIngestionProposal {
  readonly contractVersion: "TORNTPHARM_CANDIDATE_TO_INGESTION_PROPOSAL_V1"
  readonly numericProjection: readonly EvidenceIngestionCandidate[]
  readonly items: readonly CandidateIngestionProposalItem[]
  readonly excludedRejectedClaims: readonly {
    readonly artifactCode: string
    readonly claim: string
    readonly reason: string
  }[]
  readonly summary: {
    readonly reviewedCandidates: number
    readonly numericCandidates: number
    readonly eventCandidates: number
    readonly validatorAccepted: number
    readonly validatorQuarantined: number
    readonly eventContractAccepted: number
    readonly eventContractQuarantined: number
    readonly eventStorageBlocked: number
    readonly rejectedClaimsExcluded: number
    readonly proposedWrites: 0
  }
  readonly ingestionAuthorized: false
}

export function buildTorntpharmCandidateToIngestionProposal(
  securityId: string,
  assignmentVersion: number,
): TorntpharmCandidateToIngestionProposal {
  const review = buildTorntpharmReadOnlyContentReviewDryRun()
  const numeric = review.proposedCandidates.filter((item) => item.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH")
  const events = review.proposedCandidates.filter((item) => item.metricCode === "PHARMA_REGULATORY_SITE_STATUS")

  const numericProjection: EvidenceIngestionCandidate[] = numeric.map((item, index) => ({
    id: `TORNTPHARM_US_GROWTH_${index + 1}`,
    metricCode: item.metricCode,
    periodEnd: item.observationDate,
    value: item.value,
    unit: "PERCENT",
    lineage: "DIRECT_OFFICIAL",
    securityId,
    profileVersion: `PHARMA_V1+DOMESTIC_FORMULATIONS_V${assignmentVersion}`,
    sourceArtifactCode: item.artifactCode,
    derivedFormulaCode: null,
    directInputKeys: [],
  }))

  const validation = validateEvidenceIngestionCandidates(numericProjection)

  const numericItems: CandidateIngestionProposalItem[] = validation.quarantined.map(({ row, issueCodes }) => ({
    metricCode: row.metricCode,
    artifactCode: row.sourceArtifactCode,
    observationDate: row.periodEnd,
    value: row.value,
    unit: row.unit,
    disposition: "VALIDATOR_CONTRACT_EXTENSION_REQUIRED",
    validatorIssueCodes: issueCodes,
    rationale: "The reviewed numeric candidate is not eligible for ingestion under the current canonical validator contract. Extend the approved metric/unit registry and re-run validation before any write is proposed.",
  }))

  const acceptedItems: CandidateIngestionProposalItem[] = validation.accepted.map((row) => ({
    metricCode: row.metricCode,
    artifactCode: row.sourceArtifactCode,
    observationDate: row.periodEnd,
    value: row.value,
    unit: row.unit,
    disposition: "SEPARATE_INGESTION_APPROVAL_REQUIRED",
    validatorIssueCodes: [],
    rationale: "The row is structurally accepted by the validator, but this proposal contract still does not authorize a write. A separately approved ingestion gate is required.",
  }))

  const artifactsByCode = new Map(review.reviewedArtifacts.map((item) => [item.code, item]))
  const eventValidation = validatePharmaRegulatoryEventEvidenceCandidates(events.map((item) => ({
    securityId,
    metricCode: "PHARMA_REGULATORY_SITE_STATUS" as const,
    eventDate: item.observationDate,
    eventState: item.value as "WARNING_LETTER_ACTIVE" | "WARNING_LETTER_CLOSED_OUT",
    regulatorCode: "US_FDA" as const,
    facilityKey: "FEI_3005029956",
    facilityName: "Indrad finished-dosage facility",
    regulatoryChainId: "FDA_WL_320_20_03",
    sourceArtifactCode: item.artifactCode,
    sourceReference: artifactsByCode.get(item.artifactCode)?.locator ?? "",
    scope: "SITE_SPECIFIC" as const,
  })))

  const eventItems: CandidateIngestionProposalItem[] = [
    ...eventValidation.accepted.map((item) => ({
      metricCode: item.metricCode,
      artifactCode: item.sourceArtifactCode,
      observationDate: item.eventDate,
      value: item.eventState,
      unit: "EVENT_STATE",
      disposition: "EVENT_STORAGE_IMPLEMENTATION_REQUIRED" as const,
      validatorIssueCodes: [],
      rationale: "The event is valid under the versioned Pharma regulatory event-evidence contract, but no canonical event-evidence storage/write path is implemented or authorized yet.",
    })),
    ...eventValidation.quarantined.map(({ row, issueCodes }) => ({
      metricCode: row.metricCode,
      artifactCode: row.sourceArtifactCode,
      observationDate: row.eventDate,
      value: row.eventState,
      unit: "EVENT_STATE",
      disposition: "EVENT_EVIDENCE_SCHEMA_REQUIRED" as const,
      validatorIssueCodes: issueCodes,
      rationale: "The regulatory event fails the current event-evidence contract and must remain quarantined.",
    })),
  ]

  return {
    contractVersion: "TORNTPHARM_CANDIDATE_TO_INGESTION_PROPOSAL_V1",
    numericProjection,
    items: [...numericItems, ...acceptedItems, ...eventItems],
    excludedRejectedClaims: review.rejectedClaims.map((item) => ({
      artifactCode: item.artifactCode,
      claim: item.claim,
      reason: item.reason,
    })),
    summary: {
      reviewedCandidates: review.proposedCandidates.length,
      numericCandidates: numeric.length,
      eventCandidates: events.length,
      validatorAccepted: validation.accepted.length,
      validatorQuarantined: validation.quarantined.length,
      eventContractAccepted: eventValidation.accepted.length,
      eventContractQuarantined: eventValidation.quarantined.length,
      eventStorageBlocked: eventValidation.accepted.length,
      rejectedClaimsExcluded: review.rejectedClaims.length,
      proposedWrites: 0,
    },
    ingestionAuthorized: false,
  }
}
