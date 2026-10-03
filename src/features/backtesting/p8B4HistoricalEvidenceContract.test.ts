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


describe("P8-B4 revision and append-only controls", () => {
  it("requires amendments/restatements to link prior immutable evidence", async () => {
    const mod = await import("./p8B4HistoricalEvidenceContract")
    const prior = {
      evidenceId: "e1",
      semanticSeriesKey: "hist-1|ROCE_ANNUAL|2024-03-31",
      revisionKind: "ORIGINAL" as const,
      supersedesEvidenceId: null,
      publishedAt: "2024-05-01T10:00:00Z",
      evidenceHash: "hash-1",
    }
    const current = {
      evidenceId: "e2",
      semanticSeriesKey: prior.semanticSeriesKey,
      revisionKind: "RESTATEMENT" as const,
      supersedesEvidenceId: "e1",
      publishedAt: "2024-06-01T10:00:00Z",
      evidenceHash: "hash-2",
    }
    const validated = mod.validateP8B4VersionedEvidence(current, new Map([["e1", prior]]))
    expect(validated).toEqual(current)
  })

  it("rejects a revision that crosses semantic evidence series", async () => {
    const mod = await import("./p8B4HistoricalEvidenceContract")
    const prior = {
      evidenceId: "e1",
      semanticSeriesKey: "hist-1|ROCE_ANNUAL|2024-03-31",
      revisionKind: "ORIGINAL" as const,
      supersedesEvidenceId: null,
      publishedAt: "2024-05-01T10:00:00Z",
      evidenceHash: "hash-1",
    }
    const current = {
      evidenceId: "e2",
      semanticSeriesKey: "hist-1|EPS_DILUTED|2024-03-31",
      revisionKind: "AMENDMENT" as const,
      supersedesEvidenceId: "e1",
      publishedAt: "2024-06-01T10:00:00Z",
      evidenceHash: "hash-2",
    }
    expect(() => mod.validateP8B4VersionedEvidence(current, new Map([["e1", prior]]))).toThrow(
      /cannot cross semantic evidence series/,
    )
  })

  it("rejects a revision published before the evidence it supersedes", async () => {
    const mod = await import("./p8B4HistoricalEvidenceContract")
    const prior = {
      evidenceId: "e1",
      semanticSeriesKey: "hist-1|ROCE_ANNUAL|2024-03-31",
      revisionKind: "ORIGINAL" as const,
      supersedesEvidenceId: null,
      publishedAt: "2024-06-01T10:00:00Z",
      evidenceHash: "hash-1",
    }
    const current = {
      evidenceId: "e2",
      semanticSeriesKey: prior.semanticSeriesKey,
      revisionKind: "RESTATEMENT" as const,
      supersedesEvidenceId: "e1",
      publishedAt: "2024-05-01T10:00:00Z",
      evidenceHash: "hash-2",
    }
    expect(() => mod.validateP8B4VersionedEvidence(current, new Map([["e1", prior]]))).toThrow(
      /cannot precede/,
    )
  })

  it("returns an idempotent decision for an existing evidence fingerprint", async () => {
    const mod = await import("./p8B4HistoricalEvidenceContract")
    const fp = mod.p8B4EvidenceFingerprint(base)
    expect(mod.decideP8B4Append(base, new Map([[fp, "existing-evidence-id"]]))).toEqual({
      disposition: "IDEMPOTENT_EXISTING",
      existingEvidenceId: "existing-evidence-id",
    })
  })

  it("returns append-new when the evidence fingerprint is new", async () => {
    const mod = await import("./p8B4HistoricalEvidenceContract")
    expect(mod.decideP8B4Append(base, new Map())).toEqual({
      disposition: "APPEND_NEW",
      existingEvidenceId: null,
    })
  })
})
