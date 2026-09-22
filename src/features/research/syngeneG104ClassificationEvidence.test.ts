import { describe, expect, it } from "vitest"
import { PHARMA_SUBPROFILE_CANDIDATE_REGISTRY } from "./pharmaSubprofileCandidateRegistry"
import {
  SYNGENE_G10_4_ANNUAL_BUSINESS_MODEL,
  SYNGENE_G10_4_CLASSIFICATION_REVIEW,
  SYNGENE_G10_4_DISTORTION_CHECKS,
} from "./syngeneG104ClassificationEvidence"

describe("Gate J G10.4 SYNGENE CDMO/CRAMS classification candidate", () => {
  it("selects an existing provisional CDMO/CRAMS candidate", () => {
    expect(PHARMA_SUBPROFILE_CANDIDATE_REGISTRY).toContainEqual(
      expect.objectContaining({
        symbol: "SYNGENE",
        proposedPrimarySubprofileCode: "CDMO_CRAMS",
        reviewState: "PROVISIONAL",
      }),
    )
  })

  it("uses two consecutive annual operating-model periods", () => {
    expect(SYNGENE_G10_4_ANNUAL_BUSINESS_MODEL.map((row) => ({
      periodEnd: row.periodEnd,
      share: row.cdmoCramsTaxonomySharePercent,
    }))).toEqual([
      { periodEnd: "2025-03-31", share: 100 },
      { periodEnd: "2026-03-31", share: 100 },
    ])
  })

  it("resolves CDMO_CRAMS primary without a second Pharma exposure", () => {
    expect(SYNGENE_G10_4_CLASSIFICATION_REVIEW).toEqual(
      expect.objectContaining({
        checkpointState: "READY_FOR_OWNER_LOCK",
        classificationState: "READY_FOR_REVIEW",
        primary: "CDMO_CRAMS",
        materialOverlays: [],
        emergingWatches: [],
        scoreExecutionEnabled: false,
        recommendationExecutionEnabled: false,
        persistenceEnabled: false,
      }),
    )
  })

  it("records taxonomy consolidation and no-product-exposure checks explicitly", () => {
    expect(SYNGENE_G10_4_DISTORTION_CHECKS).toHaveLength(4)
    expect(SYNGENE_G10_4_DISTORTION_CHECKS.every((check) =>
      check.state === "PASS" || check.state === "PASS_WITH_CONTEXT",
    )).toBe(true)
  })

  it("prevents score-driven reclassification", () => {
    expect(SYNGENE_G10_4_CLASSIFICATION_REVIEW.reclassificationRule).toContain(
      "a score or recommendation outcome is never a valid trigger",
    )
  })
})
