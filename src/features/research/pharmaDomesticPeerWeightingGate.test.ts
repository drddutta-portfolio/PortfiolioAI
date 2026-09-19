import { describe, expect, it } from "vitest"
import {
  PHARMA_DOMESTIC_PEER_WEIGHTING_GATE,
  reviewDomesticPeerWeightingDecision,
} from "./pharmaDomesticPeerWeightingGate"

describe("Domestic Formulations peer weighting approval gate", () => {
  it("keeps all weights explicitly unapproved", () => {
    expect(PHARMA_DOMESTIC_PEER_WEIGHTING_GATE.approvedWeightingMethod).toBeNull()
    expect(PHARMA_DOMESTIC_PEER_WEIGHTING_GATE.peWeight).toBeNull()
    expect(PHARMA_DOMESTIC_PEER_WEIGHTING_GATE.evEbitdaWeight).toBeNull()
    expect(PHARMA_DOMESTIC_PEER_WEIGHTING_GATE.explicitOwnerApprovalRequired).toBe(true)
    expect(PHARMA_DOMESTIC_PEER_WEIGHTING_GATE.weightingContractVersionRequired).toBe(true)
  })

  it("prohibits hidden defaults and single-metric fallback", () => {
    expect(PHARMA_DOMESTIC_PEER_WEIGHTING_GATE.hiddenDefaultAllowed).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_WEIGHTING_GATE.equalWeightDefaultAllowed).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_WEIGHTING_GATE.singleMetricFallbackAllowed).toBe(false)
  })

  it("accepts only structurally valid candidate weights for later explicit approval", () => {
    expect(reviewDomesticPeerWeightingDecision({
      method: "WEIGHTED_MEAN",
      peWeight: 0.5,
      evEbitdaWeight: 0.5,
    })).toEqual({
      structurallyValid: true,
      reason: "READY_FOR_EXPLICIT_APPROVAL",
      approved: false,
    })
  })

  it("rejects invalid weights", () => {
    expect(reviewDomesticPeerWeightingDecision({
      method: "WEIGHTED_MEAN",
      peWeight: -0.1,
      evEbitdaWeight: 1.1,
    }).reason).toBe("INVALID_WEIGHT")
  })

  it("rejects candidate weights that do not sum to one", () => {
    expect(reviewDomesticPeerWeightingDecision({
      method: "WEIGHTED_MEAN",
      peWeight: 0.6,
      evEbitdaWeight: 0.3,
    })).toEqual({
      structurallyValid: false,
      reason: "WEIGHTS_MUST_SUM_TO_ONE",
      approved: false,
    })
  })

  it("keeps peer score and whole Valuation dimension blocked", () => {
    expect(PHARMA_DOMESTIC_PEER_WEIGHTING_GATE.combinedPeerScoreReady).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_WEIGHTING_GATE.wholeValuationDimensionReady).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_WEIGHTING_GATE.activationApproved).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_WEIGHTING_GATE.scoreExecutionEnabled).toBe(false)
  })
})
