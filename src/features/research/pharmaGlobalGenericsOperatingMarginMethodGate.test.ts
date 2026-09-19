import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE,
  assessGlobalGenericsOperatingMarginEvidence,
} from "./pharmaGlobalGenericsOperatingMarginMethodGate"

describe("PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE", () => {
  it("reuses only the parent methodology shape, not Domestic weights or bands", () => {
    const gate = PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE

    expect(gate.history.minimumComparableQuarters).toBe(8)
    expect(gate.history.preferredComparableQuarters).toBe(12)
    expect(gate.reusableMethodologyShape.levelComponentRequired).toBe(true)
    expect(gate.reusableMethodologyShape.stabilityComponentRequired).toBe(true)
    expect(gate.reusableMethodologyShape.trendComponentRequired).toBe(true)

    expect(gate.globalGenericsSpecificDecisions.domesticWeightsInherited).toBe(false)
    expect(gate.globalGenericsSpecificDecisions.domesticBandsInherited).toBe(false)
    expect(gate.globalGenericsSpecificDecisions.componentWeightsApproved).toBe(false)
    expect(gate.globalGenericsSpecificDecisions.levelBandsApproved).toBe(false)
    expect(gate.numericOperatingMarginCurveReady).toBe(false)
  })

  it("fails closed below the parent minimum history requirement", () => {
    expect(assessGlobalGenericsOperatingMarginEvidence({
      comparableQuarterCount: 7,
      latestPeriodPresent: true,
      matchedRevenueAndOperatingProfitPeriods: true,
    })).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("requires latest period and matched revenue/operating-profit periods", () => {
    expect(assessGlobalGenericsOperatingMarginEvidence({
      comparableQuarterCount: 8,
      latestPeriodPresent: false,
      matchedRevenueAndOperatingProfitPeriods: true,
    })).toBe("INSUFFICIENT_EVIDENCE")

    expect(assessGlobalGenericsOperatingMarginEvidence({
      comparableQuarterCount: 8,
      latestPeriodPresent: true,
      matchedRevenueAndOperatingProfitPeriods: false,
    })).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("marks structurally valid history ready only for method selection, not scoring", () => {
    expect(assessGlobalGenericsOperatingMarginEvidence({
      comparableQuarterCount: 8,
      latestPeriodPresent: true,
      matchedRevenueAndOperatingProfitPeriods: true,
    })).toBe("READY_FOR_METHOD_SELECTION")

    expect(PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE.ownerApprovalRequired).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE.scoreExecutionEnabled).toBe(false)
  })

  it("requires review for invalid history counts", () => {
    expect(assessGlobalGenericsOperatingMarginEvidence({
      comparableQuarterCount: -1,
      latestPeriodPresent: true,
      matchedRevenueAndOperatingProfitPeriods: true,
    })).toBe("REVIEW_REQUIRED")

    expect(assessGlobalGenericsOperatingMarginEvidence({
      comparableQuarterCount: 8.5,
      latestPeriodPresent: true,
      matchedRevenueAndOperatingProfitPeriods: true,
    })).toBe("REVIEW_REQUIRED")
  })
})
