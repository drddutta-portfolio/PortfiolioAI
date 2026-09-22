import { describe, expect, it } from "vitest"
import {
  buildPharmaRegulatoryEventPersistenceProposal,
  PHARMA_REGULATORY_EVENT_PERSISTENCE_PROPOSAL_VERSION,
} from "./pharmaRegulatoryEventPersistenceProposal"

const SECURITY_ID = "11111111-1111-4111-8111-111111111111"

describe("Pharma regulatory event persistence proposal", () => {
  it("remains a non-applied proposal outside the Supabase migration directory", () => {
    const result = buildPharmaRegulatoryEventPersistenceProposal(SECURITY_ID, 1)
    expect(result.proposalVersion).toBe(PHARMA_REGULATORY_EVENT_PERSISTENCE_PROPOSAL_VERSION)
    expect(result.migrationLocatedUnderSupabaseMigrations).toBe(false)
    expect(result.schemaApplyAuthorized).toBe(false)
    expect(result.eventWriteAuthorized).toBe(false)
    expect(result.canonicalStorageImplemented).toBe(false)
  })

  it("preserves append-only, site-specific and service-role-only mutation posture", () => {
    const result = buildPharmaRegulatoryEventPersistenceProposal(SECURITY_ID, 1)
    expect(result.appendOnlyProposed).toBe(true)
    expect(result.siteSpecificOnly).toBe(true)
    expect(result.authenticatedMutationAllowed).toBe(false)
    expect(result.serviceRoleMutationProposed).toBe(true)
  })

  it("requires the two validated pilot events before persistence can be proposed", () => {
    const result = buildPharmaRegulatoryEventPersistenceProposal(SECURITY_ID, 1)
    expect(result.eventContractAccepted).toBe(2)
    expect(result.eventContractQuarantined).toBe(0)
  })

  it("keeps the FDA source registry proposed but inactive and rights-unverified", () => {
    const result = buildPharmaRegulatoryEventPersistenceProposal(SECURITY_ID, 1)
    expect(result.proposedSourceCode).toBe("US_FDA_OFFICIAL")
    expect(result.sourceRegistryState).toBe("PROPOSED_INACTIVE_RIGHTS_UNVERIFIED")
  })
})
