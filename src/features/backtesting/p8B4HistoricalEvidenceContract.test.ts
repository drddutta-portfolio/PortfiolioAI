import { describe, expect, it } from "vitest"
import {
  evaluateP8B4PointInTimeEligibility,
  p8B4EvidenceFingerprint,
  type P8B4EvidenceCandidate,
} from "./p8B4HistoricalEvidenceContract"

const base: P8B4EvidenceCandidate = {
  domain: "FUNDAMENTAL",
  identity: {
    historicalIdentityId: "hist-1",
    historicalIsin: "INE000000001",
    sourceCode: "TRENDLYNE_MCP",
    providerEntityId: "provider-1",
    sourceRecordId: "record-1",
  },
  timing: {
    publishedAt: "2025-01-15T10:00:00+05:30",
    sourceAvailableAt: "2025-01-15T10:00:00+05:30",
    observedAt: "2026-10-03T10:00:00Z",
    retrievedAt: "2026-10-03T10:01:00Z",
  },
  evidenceId: "evidence-1",
  evidenceHash: "abc",
  transformationVersion: "v1",
}

describe("P8-B4 point-in-time eligibility", () => {
  it("accepts evidence strictly before the decision instant", () => {
    expect(
      evaluateP8B4PointInTimeEligibility({
        expectedHistoricalIdentityId: "hist-1",
        expectedHistoricalIsin: "INE000000001",
        decisionAt: "2025-01-31T15:30:00+05:30",
        candidate: base,
      }),
    ).toMatchObject({ eligible: true, state: "ELIGIBLE" })
  })

  it("rejects equality at the decision instant", () => {
    const candidate = {
      ...base,
      timing: {
        ...base.timing,
        publishedAt: "2025-01-31T15:30:00+05:30",
        sourceAvailableAt: "2025-01-31T15:30:00+05:30",
      },
    }
    expect(
      evaluateP8B4PointInTimeEligibility({
        expectedHistoricalIdentityId: "hist-1",
        expectedHistoricalIsin: "INE000000001",
        decisionAt: "2025-01-31T15:30:00+05:30",
        candidate,
      }),
    ).toMatchObject({
      eligible: false,
      state: "INELIGIBLE_NOT_STRICTLY_BEFORE_DECISION",
    })
  })

  it("rejects unknown publication time even when retrieval time exists", () => {
    const candidate = {
      ...base,
      timing: { ...base.timing, publishedAt: null },
    }
    expect(
      evaluateP8B4PointInTimeEligibility({
        expectedHistoricalIdentityId: "hist-1",
        expectedHistoricalIsin: "INE000000001",
        decisionAt: "2025-01-31T15:30:00+05:30",
        candidate,
      }),
    ).toMatchObject({
      eligible: false,
      state: "INELIGIBLE_UNKNOWN_PUBLICATION_TIME",
    })
  })

  it("rejects unknown source availability time", () => {
    const candidate = {
      ...base,
      timing: { ...base.timing, sourceAvailableAt: null },
    }
    expect(
      evaluateP8B4PointInTimeEligibility({
        expectedHistoricalIdentityId: "hist-1",
        expectedHistoricalIsin: "INE000000001",
        decisionAt: "2025-01-31T15:30:00+05:30",
        candidate,
      }),
    ).toMatchObject({
      eligible: false,
      state: "INELIGIBLE_UNKNOWN_SOURCE_AVAILABILITY_TIME",
    })
  })

  it("rejects historical identity mismatch", () => {
    expect(
      evaluateP8B4PointInTimeEligibility({
        expectedHistoricalIdentityId: "hist-2",
        expectedHistoricalIsin: "INE000000002",
        decisionAt: "2025-01-31T15:30:00+05:30",
        candidate: base,
      }),
    ).toMatchObject({
      eligible: false,
      state: "INELIGIBLE_IDENTITY_MISMATCH",
    })
  })

  it("has deterministic evidence fingerprints", () => {
    expect(p8B4EvidenceFingerprint(base)).toBe(p8B4EvidenceFingerprint(base))
  })
})
