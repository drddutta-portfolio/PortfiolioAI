import { describe, expect, it } from "vitest"
import { PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL } from "./pharmaBalanceSheetLeverageCurveProposal"

describe("PHARMA Balance Sheet / Leverage curve proposal", () => {
  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.numericCurveReady).toBe(false)
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.activationApproved).toBe(false)
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.scoreExecutionEnabled).toBe(false)
  })

  it("targets canonical Balance Sheet / Credit and surfaces the legacy dimension", () => {
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.canonicalDimension).toBe("BALANCE_SHEET_CREDIT")
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.currentParentContractDimension).toBe("BALANCE_SHEET_CREDIT")
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.dimensionAlignmentState).toBe(
      "ALIGNED_VERSIONED_PARENT",
    )
  })

  it("preserves the parent history and matched-input requirements", () => {
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.history.minimumComparableAnnualPeriods).toBe(3)
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.history.preferredComparableAnnualPeriods).toBe(5)
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.history.latestBalanceSheetPeriodRequired).toBe(true)
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.history.matchedDebtCashAndOperatingEarningsRequired).toBe(true)
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.history.pointInTimeOnlySufficient).toBe(false)
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.history.singleSnapshotSufficient).toBe(false)
  })

  it("uses leverage, coverage and trend/resilience without inventing weights", () => {
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.methodologyShape.components).toEqual([
      "NET_DEBT_LEVERAGE",
      "INTEREST_COVERAGE",
      "BALANCE_SHEET_TREND_AND_RESILIENCE",
    ])
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.methodologyShape.componentWeightsState).toBe("UNAPPROVED")
  })

  it("does not create universal leverage or interest-cover bands", () => {
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.universalNumericBandsAllowed).toBe(false)
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.methodologyShape.leverageBandsState).toBe(
      "SUBPROFILE_SPECIFIC_UNAPPROVED",
    )
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.methodologyShape.interestCoverageBandsState).toBe(
      "SUBPROFILE_SPECIFIC_UNAPPROVED",
    )
    expect(Object.values(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.subprofileThresholds).every((value) => value === null)).toBe(true)
  })

  it("requires reviewed cash semantics and explicit net-cash treatment", () => {
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.cashOffsetRequiresReviewedCashDefinition).toBe(true)
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.netCashRequiresExplicitTreatment).toBe(true)
  })

  it("requires acquisition and expansion context for leverage interpretation", () => {
    expect(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.acquisitionAndExpansionContextRequired).toBe(true)
  })
})
