import { describe, expect, it } from "vitest"
import { PHARMA_SUBPROFILE_CANDIDATE_REGISTRY } from "./pharmaSubprofileCandidateRegistry"
import {
  ALIVUS_G10_1_ANNUAL_BUSINESS_MIX,
  ALIVUS_G10_1_CLASSIFICATION_REVIEW,
  ALIVUS_G10_1_DISTORTION_CHECKS,
} from "./alivusG101ClassificationEvidence"

describe("Gate J G10.1 ALIVUS API classification candidate", () => {
  it("selects an existing provisional API/Bulk reference candidate", () => {
    expect(PHARMA_SUBPROFILE_CANDIDATE_REGISTRY).toContainEqual(
      expect.objectContaining({
        symbol: "ALIVUS",
        proposedPrimarySubprofileCode: "API_BULK_DRUGS",
        reviewState: "PROVISIONAL",
      }),
    )
  })

  it("locks two comparable annual periods before any score can exist", () => {
    expect(ALIVUS_G10_1_ANNUAL_BUSINESS_MIX).toEqual([
      expect.objectContaining({
        periodEnd: "2025-03-31",
        genericApiSharePercent: 94,
        cdmoSharePercent: 6,
      }),
      expect.objectContaining({
        periodEnd: "2026-03-31",
        genericApiSharePercent: 93,
        cdmoSharePercent: 7,
      }),
    ])
    expect(ALIVUS_G10_1_CLASSIFICATION_REVIEW).toEqual(
      expect.objectContaining({
        checkpointState: "READY_FOR_OWNER_LOCK",
        classificationState: "READY_FOR_REVIEW",
        primary: "API_BULK_DRUGS",
        materialOverlays: [],
        emergingWatches: ["CDMO_CRAMS"],
        scoreExecutionEnabled: false,
        recommendationExecutionEnabled: false,
        persistenceEnabled: false,
      }),
    )
  })

  it("records one-off, acquisition and structural-change distortion review explicitly", () => {
    expect(ALIVUS_G10_1_DISTORTION_CHECKS).toHaveLength(4)
    expect(ALIVUS_G10_1_DISTORTION_CHECKS.every((check) =>
      check.state === "PASS" || check.state === "PASS_WITH_FUTURE_REVIEW_TRIGGER",
    )).toBe(true)
    expect(
      ALIVUS_G10_1_DISTORTION_CHECKS.find((check) => check.code === "IQGENX_POST_EVIDENCE_DATE"),
    ).toEqual(expect.objectContaining({
      state: "PASS_WITH_FUTURE_REVIEW_TRIGGER",
      roleDetermining: true,
    }))
  })

  it("prevents score-driven reclassification", () => {
    expect(ALIVUS_G10_1_CLASSIFICATION_REVIEW.reclassificationRule).toContain(
      "a score or recommendation outcome is never a valid trigger",
    )
  })
})
