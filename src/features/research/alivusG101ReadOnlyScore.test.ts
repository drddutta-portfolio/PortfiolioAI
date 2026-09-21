import { describe, expect, it } from "vitest"
import { PHARMA_V1_DIMENSION_WEIGHTS } from "./pharmaGateGScoringMethodProposal"
import { ALIVUS_G10_1_READ_ONLY_SCORE_RESULT } from "./alivusG101ReadOnlyScore"

describe("G10.1 ALIVUS API read-only deterministic score", () => {
  it("computes all ten PHARMA_V1 dimensions with no hidden renormalization", () => {
    expect(ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.dimensions).toHaveLength(10)
    expect(ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.dimensions.map((item) => item.dimensionCode)).toEqual(
      PHARMA_V1_DIMENSION_WEIGHTS.map((item) => item.dimensionCode),
    )
    expect(ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.dimensions.every((item) => item.readinessCoverage === 1)).toBe(true)
  })

  it("keeps CDMO Emerging Watch numerically excluded and has no material overlay", () => {
    expect(ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.materialOverlay).toEqual({
      code: null,
      numericModifierApplied: false,
      secondIndependentStockScore: null,
    })
    expect(ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.emergingWatch).toEqual({
      code: "CDMO_CRAMS",
      numericParticipation: false,
    })
  })

  it("locks the deterministic score candidate and safety boundary", () => {
    expect(ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.overallScore).toBeCloseTo(76.7225, 10)
    expect(ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.readOnly).toBe(true)
    expect(ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.nonPersisting).toBe(true)
    expect(ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.persistedScoreRunEnabled).toBe(false)
  })

  it("keeps valuation below the neutral anchor without altering strong momentum", () => {
    const map = new Map(ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.dimensions.map((item) => [item.dimensionCode, item.finalScore]))
    expect(map.get("VALUATION")).toBe(35)
    expect(map.get("MOMENTUM")).toBe(100)
  })
})
