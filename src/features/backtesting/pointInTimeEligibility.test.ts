import { describe, expect, it } from "vitest"
import { evaluateP8PointInTimeEligibility } from "./pointInTimeEligibility"

describe("P8 point-in-time eligibility", () => {
  const valid = {
    decisionAsOf: "2025-03-31T23:59:59Z",
    observedAt: "2024-12-31T00:00:00Z",
    publishedAt: "2025-02-10T10:00:00Z",
    capturedAt: "2026-09-30T00:00:00Z",
    availabilityProof: "IMMUTABLE_PUBLICATION_ARCHIVE" as const,
    sourceIdentity: "exchange-filing-2025-02-10",
    universeMemberAsOfDecision: true,
    outcomeWindowStartsAt: "2025-04-01T00:00:00Z",
  }

  it("admits an immutable publication archive that proves historical availability", () => {
    expect(evaluateP8PointInTimeEligibility(valid)).toEqual({
      version: "P8_POINT_IN_TIME_ELIGIBILITY_V1", eligible: true, blockers: [],
    })
  })

  it("rejects look-ahead publication and overlapping outcomes", () => {
    const result = evaluateP8PointInTimeEligibility({
      ...valid,
      publishedAt: "2025-04-02T10:00:00Z",
      outcomeWindowStartsAt: "2025-03-31T00:00:00Z",
    })
    expect(result.eligible).toBe(false)
    expect(result.blockers).toEqual(expect.arrayContaining(["PUBLISHED_AFTER_DECISION", "OUTCOME_WINDOW_OVERLAPS_DECISION"]))
  })

  it("rejects later capture without immutable publication proof", () => {
    const result = evaluateP8PointInTimeEligibility({ ...valid, availabilityProof: "CONTEMPORANEOUS_CAPTURE" })
    expect(result.blockers).toContain("CAPTURED_AFTER_DECISION")
  })

  it("rejects a current-only survivor universe", () => {
    const result = evaluateP8PointInTimeEligibility({ ...valid, universeMemberAsOfDecision: null })
    expect(result.blockers).toContain("UNIVERSE_MEMBERSHIP_NOT_PROVEN")
  })

  it("preserves every missing provenance field as an explicit blocker", () => {
    const result = evaluateP8PointInTimeEligibility({
      decisionAsOf: null, observedAt: null, publishedAt: null, capturedAt: null,
      availabilityProof: null, sourceIdentity: null, universeMemberAsOfDecision: null,
      outcomeWindowStartsAt: null,
    })
    expect(result.eligible).toBe(false)
    expect(result.blockers).toEqual([
      "DECISION_TIME_MISSING", "OBSERVATION_TIME_MISSING", "PUBLICATION_TIME_MISSING",
      "AVAILABILITY_PROOF_MISSING", "SOURCE_IDENTITY_MISSING", "UNIVERSE_MEMBERSHIP_NOT_PROVEN",
    ])
  })
})
