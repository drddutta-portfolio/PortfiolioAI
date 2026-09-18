import { buildTorntpharmCandidateToIngestionProposal } from "./torntpharmCandidateToIngestionProposal"

export const PHARMA_REGULATORY_EVENT_PERSISTENCE_PROPOSAL_VERSION = "PHARMA_REGULATORY_EVENT_PERSISTENCE_PROPOSAL_V1" as const

export interface PharmaRegulatoryEventPersistenceProposal {
  readonly proposalVersion: typeof PHARMA_REGULATORY_EVENT_PERSISTENCE_PROPOSAL_VERSION
  readonly proposedTable: "research_regulatory_event_observations"
  readonly proposedCurrentView: "current_research_regulatory_site_state_v1"
  readonly proposedSourceCode: "US_FDA_OFFICIAL"
  readonly sourceRegistryState: "PROPOSED_INACTIVE_RIGHTS_UNVERIFIED"
  readonly eventContractAccepted: 2
  readonly eventContractQuarantined: 0
  readonly canonicalStorageImplemented: false
  readonly migrationLocatedUnderSupabaseMigrations: false
  readonly migrationProposalPath: "docs/sql/R4N_PHARMA_REGULATORY_EVENT_EVIDENCE_V1_MIGRATION_PROPOSAL.sql"
  readonly authenticatedMutationAllowed: false
  readonly serviceRoleMutationProposed: true
  readonly appendOnlyProposed: true
  readonly siteSpecificOnly: true
  readonly schemaApplyAuthorized: false
  readonly eventWriteAuthorized: false
}

export function buildPharmaRegulatoryEventPersistenceProposal(
  securityId: string,
  assignmentVersion: number,
): PharmaRegulatoryEventPersistenceProposal {
  const proposal = buildTorntpharmCandidateToIngestionProposal(securityId, assignmentVersion)
  if (proposal.summary.eventContractAccepted !== 2 || proposal.summary.eventContractQuarantined !== 0) {
    throw new Error("Regulatory persistence proposal requires exactly two contract-accepted, zero-quarantined pilot events")
  }

  return {
    proposalVersion: PHARMA_REGULATORY_EVENT_PERSISTENCE_PROPOSAL_VERSION,
    proposedTable: "research_regulatory_event_observations",
    proposedCurrentView: "current_research_regulatory_site_state_v1",
    proposedSourceCode: "US_FDA_OFFICIAL",
    sourceRegistryState: "PROPOSED_INACTIVE_RIGHTS_UNVERIFIED",
    eventContractAccepted: 2,
    eventContractQuarantined: 0,
    canonicalStorageImplemented: false,
    migrationLocatedUnderSupabaseMigrations: false,
    migrationProposalPath: "docs/sql/R4N_PHARMA_REGULATORY_EVENT_EVIDENCE_V1_MIGRATION_PROPOSAL.sql",
    authenticatedMutationAllowed: false,
    serviceRoleMutationProposed: true,
    appendOnlyProposed: true,
    siteSpecificOnly: true,
    schemaApplyAuthorized: false,
    eventWriteAuthorized: false,
  }
}
