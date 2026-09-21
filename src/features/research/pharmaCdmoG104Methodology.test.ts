import { describe, expect, it } from "vitest"
import { PHARMA_CDMO_G10_4_METHODOLOGY } from "./pharmaCdmoG104Methodology"

describe("Gate J G10.4 CDMO/CRAMS methodology candidate", () => {
  it("preserves the ten-dimension PHARMA_V1 spine and unchanged Gate I policy", () => {
    expect(PHARMA_CDMO_G10_4_METHODOLOGY.dimensionContracts).toHaveLength(10)
    expect(PHARMA_CDMO_G10_4_METHODOLOGY.commonTenDimensionSpinePreserved).toBe(true)
    expect(PHARMA_CDMO_G10_4_METHODOLOGY.gateIRecommendationPolicyUnchanged).toBe(true)
  })

  it("fails closed and prohibits cross-subprofile band reuse", () => {
    expect(PHARMA_CDMO_G10_4_METHODOLOGY.missingMandatoryComponentTreatment).toBe("FAIL_CLOSED")
    expect(PHARMA_CDMO_G10_4_METHODOLOGY.noPartialScoreReconstruction).toBe(true)
    expect(PHARMA_CDMO_G10_4_METHODOLOGY.noHiddenRenormalization).toBe(true)
    expect(PHARMA_CDMO_G10_4_METHODOLOGY.noDomesticBandsReuse).toBe(true)
    expect(PHARMA_CDMO_G10_4_METHODOLOGY.noApiBandsReuse).toBe(true)
    expect(PHARMA_CDMO_G10_4_METHODOLOGY.noGlobalGenericsBandsReuse).toBe(true)
    expect(PHARMA_CDMO_G10_4_METHODOLOGY.noBiosimilarsBandsReuse).toBe(true)
  })

  it("keeps persistence and sizing off", () => {
    expect(PHARMA_CDMO_G10_4_METHODOLOGY.scorePersistenceEnabled).toBe(false)
    expect(PHARMA_CDMO_G10_4_METHODOLOGY.recommendationPersistenceEnabled).toBe(false)
    expect(PHARMA_CDMO_G10_4_METHODOLOGY.positionSizingEnabled).toBe(false)
    expect(PHARMA_CDMO_G10_4_METHODOLOGY.aiInterpretationEnabled).toBe(false)
  })
})
