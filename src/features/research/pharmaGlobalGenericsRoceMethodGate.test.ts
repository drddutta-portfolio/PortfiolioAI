import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE,
  assessGlobalGenericsRoceEvidence,
} from "./pharmaGlobalGenericsRoceMethodGate"

describe("PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE", () => {
  it("reuses only the parent evidence/methodology shape", () => {
    const gate = PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE

    expect(gate.history.minimumComparableAnnualPeriods).toBe(3)
    expect(gate.history.preferredComparableAnnualPeriods).toBe(5)
    expect(gate.reusableMethodologyShape.levelComponentRequired).toBe(true)
    expect(gate.reusableMethodologyShape.stabilityComponentRequired).toBe(true)
    expect(gate.reusableMethodologyShape.trendComponentRequired).toBe(true)
  })

  it("preserves the parent dimension-reconciliation blocker", () => {
    expect(PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE.parentDimensionReconciliationRequired).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE.parentDimensionAlignmentState)
      .toBe("REQUIRES_VERSIONED_PARENT_RECONCILIATION")
  })

  it("does not inherit universal or other-subprofile numeric bands", () => {
    const decisions = PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE.globalGenericsSpecificDecisions

    expect(decisions.universalBandsInherited).toBe(false)
    expect(decisions.domesticOrOtherSubprofileBandsInherited).toBe(false)
    expect(decisions.componentWeightsApproved).toBe(false)
    expect(decisions.levelBandsApproved).toBe(false)
    expect(decisions.stabilityBandsApproved).toBe(false)
    expect(decisions.trendBandsApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE.numericRoceCurveReady).toBe(false)
  })

  it("fails closed when annual history is insufficient", () => {
    expect(assessGlobalGenericsRoceEvidence({
      comparableAnnualPeriodCount: 2,
      latestPeriodPresent: true,
      consistentCalculationSemantics: true,
    })).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("requires latest period and consistent calculation semantics", () => {
    expect(assessGlobalGenericsRoceEvidence({
      comparableAnnualPeriodCount: 3,
      latestPeriodPresent: false,
      consistentCalculationSemantics: true,
    })).toBe("INSUFFICIENT_EVIDENCE")

    expect(assessGlobalGenericsRoceEvidence({
      comparableAnnualPeriodCount: 3,
      latestPeriodPresent: true,
      consistentCalculationSemantics: false,
    })).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("marks valid history ready only for method selection", () => {
    expect(assessGlobalGenericsRoceEvidence({
      comparableAnnualPeriodCount: 3,
      latestPeriodPresent: true,
      consistentCalculationSemantics: true,
    })).toBe("READY_FOR_METHOD_SELECTION")

    expect(PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE.ownerApprovalRequired).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE.scoreExecutionEnabled).toBe(false)
  })
})
