import { describe, expect, it } from "vitest"
import {
  buildTorntpharmReadOnlyContentReviewDryRun,
  TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES,
  TORNTPHARM_REJECTED_CONTENT_CLAIMS,
} from "./torntpharmReadOnlyContentReviewDryRun"

describe("TORNTPHARM read-only content review dry-run", () => {
  it("reviews only the six approved public artifacts and performs no ingestion", () => {
    const result = buildTorntpharmReadOnlyContentReviewDryRun()
    expect(result.summary).toEqual({
      reviewedArtifacts: 6,
      proposedCandidates: 6,
      rejectedClaims: 1,
      requirementsPiloted: 2,
      ingestionWrites: 0,
    })
    expect(result.ingestionAuthorized).toBe(false)
  })

  it("proposes a four-quarter US revenue-growth history with a scope-compatible Q4 basis", () => {
    const rows = TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES.filter((item) => item.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH")
    expect(rows.map((item) => [item.observationDate, item.value])).toEqual([
      ["2025-06-30", "19"],
      ["2025-09-30", "26"],
      ["2025-12-31", "19"],
      ["2026-03-31", "16"],
    ])
    expect(rows[3]?.basis).toContain("base-business")
    const result = buildTorntpharmReadOnlyContentReviewDryRun()
    const summary = result.requirementResults.find((item) => item.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH")
    expect(summary?.proposedObservationCount).toBe(4)
    expect(summary?.proposedMinimumGap).toBe(0)
    expect(summary?.proposalState).toBe("MINIMUM_CANDIDATE_HISTORY_PRESENT")
  })

  it("rejects the Q4 reported 31% claim from the comparable four-quarter series", () => {
    expect(TORNTPHARM_REJECTED_CONTENT_CLAIMS).toHaveLength(1)
    expect(TORNTPHARM_REJECTED_CONTENT_CLAIMS[0]?.claim).toContain("31%")
    expect(TORNTPHARM_REJECTED_CONTENT_CLAIMS[0]?.reason).toContain("JB Pharma")
    expect(TORNTPHARM_REJECTED_CONTENT_CLAIMS[0]?.reason).toContain("16% US base-business")
  })

  it("keeps the Indrad regulator chain scoped to the reviewed site and does not assert company-wide clearance", () => {
    const result = buildTorntpharmReadOnlyContentReviewDryRun()
    const regulatory = result.requirementResults.find((item) => item.metricCode === "PHARMA_REGULATORY_SITE_STATUS")
    expect(regulatory?.proposalState).toBe("PARTIAL_SCOPE_REVIEW")
    expect(regulatory?.remainingGap).toContain("other material US-facing manufacturing sites")
    const events = result.proposedCandidates.filter((item) => item.metricCode === "PHARMA_REGULATORY_SITE_STATUS")
    expect(events.map((item) => item.value)).toEqual(["WARNING_LETTER_ACTIVE", "WARNING_LETTER_CLOSED_OUT"])
  })
})
