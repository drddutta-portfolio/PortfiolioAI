import { describe, expect, it } from "vitest"
import { PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE } from "./pharmaGlobalGenericPriceErosionCurveProposal"

describe("Global Generics US price-erosion curve proposal", () => {
  it("is Global-Generics-only and proposal-only", () => {
    expect(PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.supportedPrimarySubprofile).toBe("GLOBAL_GENERICS")
    expect(PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.metricCode).toBe("PHARMA_US_GENERIC_PRICE_EROSION")
    expect(PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.scoreExecutionEnabled).toBe(false)
  })

  it("requires disclosed price evidence and prohibits residual inference", () => {
    expect(PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.evidenceBoundary.disclosedAspOrPriceEvidenceRequired).toBe(true)
    expect(PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.evidenceBoundary.residualDerivationFromRevenueAndVolumeAllowed).toBe(false)
    expect(PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.evidenceBoundary.minimumComparableQuarters).toBe(4)
    expect(PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.evidenceBoundary.preferredComparableQuarters).toBe(8)
  })

  it("uses a 70/30 level and trend methodology", () => {
    expect(PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.components.level.weight).toBe(70)
    expect(PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.components.trend.weight).toBe(30)
  })

  it("scores lower erosion levels better", () => {
    expect(PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.components.level.bands).toEqual([
      { maximumExclusive: 0, score: 100 },
      { minimumInclusive: 0, maximumExclusive: 3, score: 85 },
      { minimumInclusive: 3, maximumExclusive: 5, score: 70 },
      { minimumInclusive: 5, maximumExclusive: 8, score: 55 },
      { minimumInclusive: 8, maximumExclusive: 12, score: 35 },
      { minimumInclusive: 12, score: 15 },
    ])
  })

  it("treats improving erosion trend as better", () => {
    expect(PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.components.trend.bands).toEqual([
      { maximumExclusive: -3, score: 100 },
      { minimumInclusive: -3, maximumExclusive: 0, score: 80 },
      { minimumInclusive: 0, maximumExclusive: 3, score: 60 },
      { minimumInclusive: 3, maximumExclusive: 6, score: 40 },
      { minimumInclusive: 6, score: 20 },
    ])
  })

  it("fails closed for unsupported primaries", () => {
    expect(PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.unsupportedPrimarySubprofilesFailClosed).toBe(true)
  })
})
