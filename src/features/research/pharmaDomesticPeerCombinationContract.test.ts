import { describe, expect, it } from "vitest"
import {
  assessDomesticPeerCombinationReadiness,
  PHARMA_DOMESTIC_PEER_COMBINATION,
} from "./pharmaDomesticPeerCombinationContract"

describe("Domestic Formulations peer cross-metric combination lock", () => {
  it("requires both normalized PE and EV/EBITDA inputs", () => {
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.requiredNormalizedInputs).toEqual([
      "PE_TTM",
      "EV_EBITDA",
    ])
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.inputRequirements.bothMetricFamiliesRequired).toBe(true)
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.inputRequirements.oneMetricMaySubstituteForOther).toBe(false)
  })

  it("fails closed when either metric family is missing or invalid", () => {
    expect(assessDomesticPeerCombinationReadiness({ peScore: 80, evEbitdaScore: null })).toEqual({
      state: "INSUFFICIENT_EVIDENCE",
      peScorePresent: true,
      evEbitdaScorePresent: false,
      combinedScore: null,
    })

    expect(assessDomesticPeerCombinationReadiness({ peScore: null, evEbitdaScore: 60 }).state)
      .toBe("INSUFFICIENT_EVIDENCE")

    expect(assessDomesticPeerCombinationReadiness({ peScore: 120, evEbitdaScore: 60 }).state)
      .toBe("INSUFFICIENT_EVIDENCE")
  })

  it("becomes ready only for an explicit weighting decision, not for score execution", () => {
    expect(assessDomesticPeerCombinationReadiness({ peScore: 80, evEbitdaScore: 60 })).toEqual({
      state: "READY_FOR_WEIGHTING_DECISION",
      peScorePresent: true,
      evEbitdaScorePresent: true,
      combinedScore: null,
    })
  })

  it("does not silently approve equal weighting or any fallback rule", () => {
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.combinationMethodState).toBe("UNAPPROVED")
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.equalWeightMeanApproved).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.weightedMeanApproved).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.bestOfApproved).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.worstOfApproved).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.fallbackToSingleMetricApproved).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.peWeight).toBeNull()
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.evEbitdaWeight).toBeNull()
  })

  it("keeps the combined peer component and whole Valuation dimension blocked", () => {
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.combinedPeerComponentScoreReady).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.wholeValuationDimensionReady).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.activationApproved).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_COMBINATION.scoreExecutionEnabled).toBe(false)
  })
})
