import { describe, expect, it } from "vitest"
import { PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE } from "./pharmaGlobalGenericsValuationMethodGate"

describe("PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE", () => {
  it("reuses only the parent valuation methodology shape", () => {
    const gate = PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE

    expect(gate.parentDimensionAlignmentState).toBe("ALIGNED")
    expect(gate.reusableMethodologyShape.selfHistoryRelativeRequired).toBe(true)
    expect(gate.reusableMethodologyShape.peerRelativeRequired).toBe(true)
    expect(gate.reusableMethodologyShape.cashFlowCorroborationRequired).toBe(true)
    expect(gate.reusableMethodologyShape.supportedEvidenceFamilies).toEqual([
      "PE",
      "EV_EBITDA",
      "FCF_YIELD",
    ])
  })

  it("does not inherit Domestic valuation weights or peer metric mix", () => {
    const decisions = PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE.globalGenericsSpecificDecisions

    expect(decisions.domesticFortyFortyTwentyInherited).toBe(false)
    expect(decisions.domesticPeerFiftyFiftyInherited).toBe(false)
    expect(decisions.domesticBandsInherited).toBe(false)
    expect(decisions.componentWeightsApproved).toBe(false)
    expect(decisions.peerRelativeMetricMixApproved).toBe(false)
  })

  it("keeps all Global Generics numeric valuation choices unapproved", () => {
    const decisions = PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE.globalGenericsSpecificDecisions

    expect(decisions.selfHistoryBandsApproved).toBe(false)
    expect(decisions.peerRelativeBandsApproved).toBe(false)
    expect(decisions.fcfCorroborationMethodApproved).toBe(false)
    expect(decisions.finalAggregationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE.numericValuationCurveReady).toBe(false)
  })

  it("prohibits missing-component renormalization and hidden reweighting", () => {
    expect(PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE.missingComponentRenormalizationAllowed).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE.hiddenReweightingAllowed).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE.ownerApprovalRequired).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE.scoreExecutionEnabled).toBe(false)
  })
})
