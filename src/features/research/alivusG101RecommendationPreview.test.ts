import { describe, expect, it } from "vitest"
import { ALIVUS_G10_1_READ_ONLY_RECOMMENDATION } from "./alivusG101RecommendationPreview"

describe("G10.1 ALIVUS Gate I recommendation preview", () => {
  it("applies the unchanged Gate I policy to the API score", () => {
    expect(ALIVUS_G10_1_READ_ONLY_RECOMMENDATION.overallScore).toBeCloseTo(76.6725, 10)
    expect(ALIVUS_G10_1_READ_ONLY_RECOMMENDATION.suggestedRole).toBe("SATELLITE_CANDIDATE")
    expect(ALIVUS_G10_1_READ_ONLY_RECOMMENDATION.evaluatedRoleThreshold).toBe("SATELLITE_CANDIDATE")
    expect(ALIVUS_G10_1_READ_ONLY_RECOMMENDATION.floorEvaluations.every((item) => item.state === "PASS")).toBe(true)
    expect(ALIVUS_G10_1_READ_ONLY_RECOMMENDATION.cautions).toContain("VALUATION_BELOW_NEUTRAL_ANCHOR")
  })

  it("keeps CDMO context-only and all mutation/sizing paths off", () => {
    expect(ALIVUS_G10_1_READ_ONLY_RECOMMENDATION.overlayTreatment).toEqual(expect.objectContaining({
      materialOverlayCode: null,
      emergingWatchCode: "CDMO_CRAMS",
      emergingWatchTreatment: "CONTEXT_ONLY_NUMERICALLY_EXCLUDED",
      numericModifierApplied: false,
      secondIndependentRecommendation: false,
    }))
    expect(ALIVUS_G10_1_READ_ONLY_RECOMMENDATION.recommendationPersistenceEnabled).toBe(false)
    expect(ALIVUS_G10_1_READ_ONLY_RECOMMENDATION.scorePersistenceEnabled).toBe(false)
    expect(ALIVUS_G10_1_READ_ONLY_RECOMMENDATION.weightGuidanceEnabled).toBe(false)
    expect(ALIVUS_G10_1_READ_ONLY_RECOMMENDATION.actionBiasEnabled).toBe(false)
    expect(ALIVUS_G10_1_READ_ONLY_RECOMMENDATION.positionSizingEnabled).toBe(false)
    expect(ALIVUS_G10_1_READ_ONLY_RECOMMENDATION.aiInterpretationEnabled).toBe(false)
  })
})
