import { describe, expect, it } from "vitest"
import { PHARMA_SUBPROFILE_CANDIDATE_REGISTRY } from "./pharmaSubprofileCandidateRegistry"
import {
  BIOCON_G10_3_ANNUAL_BUSINESS_MIX,
  BIOCON_G10_3_CLASSIFICATION_REVIEW,
  BIOCON_G10_3_DISTORTION_CHECKS,
} from "./bioconG103ClassificationEvidence"

describe("Gate J G10.3 BIOCON Biosimilars classification candidate", () => {
  it("selects the existing sole provisional Biosimilars reference candidate", () => {
    expect(PHARMA_SUBPROFILE_CANDIDATE_REGISTRY).toContainEqual(
      expect.objectContaining({
        symbol: "BIOCON",
        proposedPrimarySubprofileCode: "BIOPHARMA_BIOSIMILARS",
        reviewState: "PROVISIONAL",
      }),
    )
  })

  it("uses two comparable annual business-mix periods", () => {
    expect(BIOCON_G10_3_ANNUAL_BUSINESS_MIX).toEqual([
      expect.objectContaining({
        periodEnd: "2025-03-31",
        biosimilarsSharePercent: 58,
        genericsSharePercent: 19,
        crdmoSharePercent: 23,
      }),
      expect.objectContaining({
        periodEnd: "2026-03-31",
        biosimilarsSharePercent: 60,
        genericsSharePercent: 18,
        crdmoSharePercent: 22,
      }),
    ])
  })

  it("resolves Biosimilars primary with both secondary businesses retained as Material Overlays", () => {
    expect(BIOCON_G10_3_CLASSIFICATION_REVIEW).toEqual(
      expect.objectContaining({
        checkpointState: "READY_FOR_OWNER_LOCK",
        classificationState: "READY_FOR_REVIEW",
        primary: "BIOPHARMA_BIOSIMILARS",
        emergingWatches: [],
        scoreExecutionEnabled: false,
        recommendationExecutionEnabled: false,
        persistenceEnabled: false,
      }),
    )
    expect(BIOCON_G10_3_CLASSIFICATION_REVIEW.materialOverlays).toEqual(["CDMO_CRAMS", "GLOBAL_GENERICS"])
  })

  it("records denominator, one-off and secondary-business distortion review explicitly", () => {
    expect(BIOCON_G10_3_DISTORTION_CHECKS).toHaveLength(4)
    expect(BIOCON_G10_3_DISTORTION_CHECKS.every((check) =>
      check.state === "PASS" || check.state === "PASS_WITH_CONTEXT",
    )).toBe(true)
  })

  it("prevents score-driven reclassification", () => {
    expect(BIOCON_G10_3_CLASSIFICATION_REVIEW.reclassificationRule).toContain(
      "a score or recommendation outcome is never a valid trigger",
    )
  })
})
