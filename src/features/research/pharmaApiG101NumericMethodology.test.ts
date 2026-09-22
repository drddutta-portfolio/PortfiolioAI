import { describe, expect, it } from "vitest"
import {
  evaluateApiCapitalEfficiency,
  evaluateApiCashFlow,
  evaluateApiGrowth,
  evaluateApiMomentum,
  evaluateApiQuality,
  evaluateApiValuation,
  PHARMA_API_G10_1_NUMERIC_METHODOLOGY,
} from "./pharmaApiG101NumericMethodology"

describe("G10.1 API/Bulk numeric methodology candidate", () => {
  it("preserves the common PHARMA_V1 spine and Gate I policy boundary", () => {
    expect(PHARMA_API_G10_1_NUMERIC_METHODOLOGY).toEqual(expect.objectContaining({
      supportedPrimarySubprofile: "API_BULK_DRUGS",
      commonTenDimensionSpinePreserved: true,
      gateIRecommendationPolicyUnchanged: true,
      materialOverlayCreatesIndependentScore: false,
      emergingWatchNumericParticipation: false,
      scorePersistenceEnabled: false,
      recommendationPersistenceEnabled: false,
    }))
  })

  it("evaluates the locked reference evidence deterministically", () => {
    expect(evaluateApiQuality([28, 28.2, 31.3, 32.1, 30.1, 33, 36.4, 34.4]).score).toBe(94)
    expect(evaluateApiGrowth([2.2, 16, 4.8, 6.1]).score).toBe(69.25)
    expect(evaluateApiCapitalEfficiency([40, 34, 32, 27, 30]).score).toBe(84)
    expect(evaluateApiCashFlow({
      pat: [4709, 4857, 5645],
      fcf: [2845, 2328, 2590],
      capex: [1290, 1662, 3062],
    }).score).toBe(70.75)
  })

  it("does not let strong momentum neutralize expensive valuation", () => {
    const valuation = evaluateApiValuation({
      price: 1430.8,
      eps: 45.99,
      marketCapMn: 1430.8 * 122.537052,
      cashMn: 7824,
      ebitdaMn: 8577,
      fcfMn: 2590,
    })
    const momentum = evaluateApiMomentum({
      priceNow: 1430.8,
      price12mAgo: 946.85,
      price6mAgo: 972.7,
      niftyPharma12mReturnPercent: 21.4,
    })
    expect(valuation.score).toBe(35)
    expect(momentum.score).toBe(100)
  })
})
