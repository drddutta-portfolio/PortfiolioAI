import { describe, expect, it } from "vitest"
import { buildTorntpharmCandidateToIngestionProposal } from "./torntpharmCandidateToIngestionProposal"

const SECURITY_ID = "11111111-1111-4111-8111-111111111111"

describe("TORNTPHARM candidate-to-ingestion proposal", () => {
  it("keeps every reviewed candidate non-writing and exposes the real ingestion blockers", () => {
    const result = buildTorntpharmCandidateToIngestionProposal(SECURITY_ID, 1)
    expect(result.summary).toEqual({
      reviewedCandidates: 6,
      numericCandidates: 4,
      eventCandidates: 2,
      validatorAccepted: 4,
      validatorQuarantined: 0,
      eventContractAccepted: 2,
      eventContractQuarantined: 0,
      eventStorageBlocked: 2,
      rejectedClaimsExcluded: 1,
      proposedWrites: 0,
    })
    expect(result.ingestionAuthorized).toBe(false)
  })

  it("projects the four US-growth observations into the canonical numeric shape without approving them", () => {
    const result = buildTorntpharmCandidateToIngestionProposal(SECURITY_ID, 1)
    expect(result.numericProjection).toHaveLength(4)
    expect(result.numericProjection.map((item) => [item.periodEnd, item.value, item.unit])).toEqual([
      ["2025-06-30", "19", "PERCENT"],
      ["2025-09-30", "26", "PERCENT"],
      ["2025-12-31", "19", "PERCENT"],
      ["2026-03-31", "16", "PERCENT"],
    ])
    expect(result.numericProjection.every((item) => item.lineage === "DIRECT_OFFICIAL")).toBe(true)
    expect(result.items.filter((item) => item.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH")).toHaveLength(4)
    expect(result.items.filter((item) => item.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH").every((item) => item.disposition === "SEPARATE_INGESTION_APPROVAL_REQUIRED")).toBe(true)
  })

  it("accepts the US-growth metric structurally but keeps ingestion separately approval-gated", () => {
    const result = buildTorntpharmCandidateToIngestionProposal(SECURITY_ID, 1)
    const rows = result.items.filter((item) => item.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH")
    expect(rows).toHaveLength(4)
    expect(rows.every((item) => item.validatorIssueCodes.length === 0)).toBe(true)
    expect(rows.every((item) => item.disposition === "SEPARATE_INGESTION_APPROVAL_REQUIRED")).toBe(true)
  })

  it("keeps FDA event-state evidence outside the numeric ingestion manifest", () => {
    const result = buildTorntpharmCandidateToIngestionProposal(SECURITY_ID, 1)
    const events = result.items.filter((item) => item.metricCode === "PHARMA_REGULATORY_SITE_STATUS")
    expect(events).toHaveLength(2)
    expect(events.every((item) => item.disposition === "EVENT_STORAGE_IMPLEMENTATION_REQUIRED")).toBe(true)
    expect(result.numericProjection.some((item) => item.metricCode === "PHARMA_REGULATORY_SITE_STATUS")).toBe(false)
  })

  it("never carries the rejected Q4 31% claim into the ingestion proposal", () => {
    const result = buildTorntpharmCandidateToIngestionProposal(SECURITY_ID, 1)
    expect(result.excludedRejectedClaims).toHaveLength(1)
    expect(result.excludedRejectedClaims[0]?.claim).toContain("31%")
    expect(result.numericProjection.some((item) => item.value === "31")).toBe(false)
  })
})
