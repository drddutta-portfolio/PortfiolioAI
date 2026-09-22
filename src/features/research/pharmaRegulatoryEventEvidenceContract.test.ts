import { describe, expect, it } from "vitest"
import {
  PHARMA_REGULATORY_EVENT_EVIDENCE_CONTRACT_VERSION,
  validatePharmaRegulatoryEventEvidenceCandidates,
  type PharmaRegulatoryEventEvidenceCandidate,
} from "./pharmaRegulatoryEventEvidenceContract"

const SECURITY_ID = "11111111-1111-4111-8111-111111111111"

const warning: PharmaRegulatoryEventEvidenceCandidate = {
  securityId: SECURITY_ID,
  metricCode: "PHARMA_REGULATORY_SITE_STATUS",
  eventDate: "2019-10-08",
  eventState: "WARNING_LETTER_ACTIVE",
  regulatorCode: "US_FDA",
  facilityKey: "FEI_3005029956",
  facilityName: "Indrad finished-dosage facility",
  regulatoryChainId: "FDA_WL_320_20_03",
  sourceArtifactCode: "FDA_INDRA_WARNING_2019",
  sourceReference: "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/torrent-pharmaceuticals-limited-585255-10082019",
  scope: "SITE_SPECIFIC",
}

const closeout: PharmaRegulatoryEventEvidenceCandidate = {
  ...warning,
  eventDate: "2024-09-04",
  eventState: "WARNING_LETTER_CLOSED_OUT",
  sourceArtifactCode: "FDA_INDRA_CLOSEOUT_2024",
  sourceReference: "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/torrent-pharmaceuticals-limited-585255-09042024",
}

describe("Pharma regulatory event evidence contract", () => {
  it("uses an explicit versioned non-writing contract", () => {
    expect(PHARMA_REGULATORY_EVENT_EVIDENCE_CONTRACT_VERSION).toBe("PHARMA_REGULATORY_EVENT_EVIDENCE_V1")
  })

  it("accepts the site-scoped warning-to-closeout chain", () => {
    const result = validatePharmaRegulatoryEventEvidenceCandidates([warning, closeout])
    expect(result.accepted).toHaveLength(2)
    expect(result.quarantined).toHaveLength(0)
    expect(result.idempotencyKeys).toHaveLength(2)
  })

  it("fails closed when a closeout is supplied without the opening event", () => {
    const result = validatePharmaRegulatoryEventEvidenceCandidates([closeout])
    expect(result.accepted).toHaveLength(0)
    expect(result.quarantined[0]?.issueCodes).toContain("INVALID_CHAIN_TRANSITION")
  })

  it("fails closed on duplicate events", () => {
    const result = validatePharmaRegulatoryEventEvidenceCandidates([warning, warning])
    expect(result.quarantined.some((item) => item.issueCodes.includes("DUPLICATE_EVENT"))).toBe(true)
  })

  it("requires site-specific scope rather than company-wide regulatory claims", () => {
    const invalid = { ...warning, scope: "COMPANY_WIDE" as never }
    const result = validatePharmaRegulatoryEventEvidenceCandidates([invalid])
    expect(result.quarantined[0]?.issueCodes).toContain("INVALID_SCOPE")
  })
})
