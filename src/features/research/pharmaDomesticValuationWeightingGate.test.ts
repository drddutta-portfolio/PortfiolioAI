import { describe, expect, it } from "vitest"
import {
  PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE,
  reviewDomesticValuationWeightingDecision,
} from "./pharmaDomesticValuationWeightingGate"

describe("Domestic Formulations Valuation component weighting gate", () => {
  it("requires all three validated Valuation components", () => {
    expect(PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE.requiredComponents).toEqual([
      "SELF_HISTORY_RELATIVE_VALUATION",
      "PEER_RELATIVE_VALUATION",
      "CASH_FLOW_CORROBORATION",
    ])
    expect(PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE.dimensionWeightPercent).toBe(12)
  })

  it("keeps all component weights explicitly unapproved", () => {
    expect(PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE.approvedWeightingMethod).toBeNull()
    expect(PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE.selfHistoryWeight).toBeNull()
    expect(PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE.peerRelativeWeight).toBeNull()
    expect(PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE.cashFlowCorroborationWeight).toBeNull()
  })

  it("prohibits hidden equal-thirds defaults and missing-component renormalization", () => {
    expect(PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE.hiddenDefaultAllowed).toBe(false)
    expect(PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE.equalThirdsDefaultAllowed).toBe(false)
    expect(PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE.missingComponentRenormalizationAllowed).toBe(false)
  })

  it("recognizes structurally valid candidate weights without approving them", () => {
    expect(reviewDomesticValuationWeightingDecision({
      method: "WEIGHTED_MEAN",
      selfHistoryWeight: 0.4,
      peerRelativeWeight: 0.4,
      cashFlowCorroborationWeight: 0.2,
    })).toEqual({
      structurallyValid: true,
      reason: "READY_FOR_EXPLICIT_APPROVAL",
      approved: false,
    })
  })

  it("rejects invalid component weights", () => {
    expect(reviewDomesticValuationWeightingDecision({
      method: "WEIGHTED_MEAN",
      selfHistoryWeight: -0.1,
      peerRelativeWeight: 0.6,
      cashFlowCorroborationWeight: 0.5,
    }).reason).toBe("INVALID_WEIGHT")
  })

  it("rejects weights that do not sum to one", () => {
    expect(reviewDomesticValuationWeightingDecision({
      method: "WEIGHTED_MEAN",
      selfHistoryWeight: 0.4,
      peerRelativeWeight: 0.4,
      cashFlowCorroborationWeight: 0.1,
    })).toEqual({
      structurallyValid: false,
      reason: "WEIGHTS_MUST_SUM_TO_ONE",
      approved: false,
    })
  })

  it("keeps the whole Valuation dimension inactive", () => {
    expect(PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE.wholeValuationDimensionReady).toBe(false)
    expect(PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE.activationApproved).toBe(false)
    expect(PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE.scoreExecutionEnabled).toBe(false)
  })
})
