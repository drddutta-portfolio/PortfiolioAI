import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE,
  assessGlobalGenericsBalanceSheetEvidence,
} from "./pharmaGlobalGenericsBalanceSheetMethodGate"

describe("PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE", () => {
  it("reuses only the parent evidence/methodology shape", () => {
    const gate = PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE

    expect(gate.history.minimumComparableAnnualPeriods).toBe(3)
    expect(gate.history.preferredComparableAnnualPeriods).toBe(5)
    expect(gate.reusableMethodologyShape.netDebtLeverageRequired).toBe(true)
    expect(gate.reusableMethodologyShape.interestCoverageRequired).toBe(true)
    expect(gate.reusableMethodologyShape.trendAndResilienceRequired).toBe(true)
    expect(gate.reusableMethodologyShape.reviewedCashDefinitionRequired).toBe(true)
    expect(gate.reusableMethodologyShape.explicitNetCashTreatmentRequired).toBe(true)
    expect(gate.reusableMethodologyShape.acquisitionAndExpansionContextRequired).toBe(true)
  })

  it("preserves the parent dimension-reconciliation blocker", () => {
    expect(PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE.parentDimensionReconciliationRequired).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE.parentDimensionAlignmentState)
      .toBe("REQUIRES_VERSIONED_PARENT_RECONCILIATION")
  })

  it("does not inherit universal or other-subprofile bands", () => {
    const decisions = PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE.globalGenericsSpecificDecisions

    expect(decisions.universalBandsInherited).toBe(false)
    expect(decisions.otherSubprofileBandsInherited).toBe(false)
    expect(decisions.componentWeightsApproved).toBe(false)
    expect(decisions.leverageBandsApproved).toBe(false)
    expect(decisions.interestCoverageBandsApproved).toBe(false)
    expect(decisions.trendResilienceBandsApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE.numericBalanceSheetCurveReady).toBe(false)
  })

  it("fails closed when annual evidence is insufficient", () => {
    expect(assessGlobalGenericsBalanceSheetEvidence({
      comparableAnnualPeriodCount: 2,
      latestBalanceSheetPeriodPresent: true,
      matchedDebtCashAndOperatingEarnings: true,
    })).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("requires latest balance sheet and matched debt/cash/earnings evidence", () => {
    expect(assessGlobalGenericsBalanceSheetEvidence({
      comparableAnnualPeriodCount: 3,
      latestBalanceSheetPeriodPresent: false,
      matchedDebtCashAndOperatingEarnings: true,
    })).toBe("INSUFFICIENT_EVIDENCE")

    expect(assessGlobalGenericsBalanceSheetEvidence({
      comparableAnnualPeriodCount: 3,
      latestBalanceSheetPeriodPresent: true,
      matchedDebtCashAndOperatingEarnings: false,
    })).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("marks structurally valid evidence ready only for method selection", () => {
    expect(assessGlobalGenericsBalanceSheetEvidence({
      comparableAnnualPeriodCount: 3,
      latestBalanceSheetPeriodPresent: true,
      matchedDebtCashAndOperatingEarnings: true,
    })).toBe("READY_FOR_METHOD_SELECTION")

    expect(PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE.ownerApprovalRequired).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE.scoreExecutionEnabled).toBe(false)
  })
})
