import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE,
  assessGlobalGenericsCashConversionEvidence,
} from "./pharmaGlobalGenericsCashConversionMethodGate"

describe("PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE", () => {
  it("reuses only the parent evidence/methodology shape", () => {
    const gate = PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE

    expect(gate.history.minimumComparableAnnualPeriods).toBe(3)
    expect(gate.history.preferredComparableAnnualPeriods).toBe(5)
    expect(gate.history.cfoAloneSufficient).toBe(false)
    expect(gate.reusableMethodologyShape.cfoToPatConversionRequired).toBe(true)
    expect(gate.reusableMethodologyShape.fcfConversionRequired).toBe(true)
    expect(gate.reusableMethodologyShape.consistencyAndTrendRequired).toBe(true)
    expect(gate.reusableMethodologyShape.capexIntensityContextRequired).toBe(true)
  })

  it("preserves the parent dimension-reconciliation blocker", () => {
    expect(PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE.parentDimensionReconciliationRequired).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE.parentDimensionAlignmentState)
      .toBe("REQUIRES_VERSIONED_PARENT_RECONCILIATION")
  })

  it("does not inherit universal or other-subprofile bands", () => {
    const decisions = PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE.globalGenericsSpecificDecisions

    expect(decisions.universalBandsInherited).toBe(false)
    expect(decisions.otherSubprofileBandsInherited).toBe(false)
    expect(decisions.componentWeightsApproved).toBe(false)
    expect(decisions.cfoToPatBandsApproved).toBe(false)
    expect(decisions.fcfConversionBandsApproved).toBe(false)
    expect(decisions.consistencyTrendBandsApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE.numericCashConversionCurveReady).toBe(false)
  })

  it("fails closed when annual evidence is insufficient", () => {
    expect(assessGlobalGenericsCashConversionEvidence({
      comparableAnnualPeriodCount: 2,
      latestPeriodPresent: true,
      matchedCfoPatAndCapexFcfPeriods: true,
    })).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("requires latest period and matched CFO/PAT/capex-FCF periods", () => {
    expect(assessGlobalGenericsCashConversionEvidence({
      comparableAnnualPeriodCount: 3,
      latestPeriodPresent: false,
      matchedCfoPatAndCapexFcfPeriods: true,
    })).toBe("INSUFFICIENT_EVIDENCE")

    expect(assessGlobalGenericsCashConversionEvidence({
      comparableAnnualPeriodCount: 3,
      latestPeriodPresent: true,
      matchedCfoPatAndCapexFcfPeriods: false,
    })).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("marks structurally valid evidence ready only for method selection", () => {
    expect(assessGlobalGenericsCashConversionEvidence({
      comparableAnnualPeriodCount: 3,
      latestPeriodPresent: true,
      matchedCfoPatAndCapexFcfPeriods: true,
    })).toBe("READY_FOR_METHOD_SELECTION")

    expect(PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE.ownerApprovalRequired).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE.scoreExecutionEnabled).toBe(false)
  })
})
