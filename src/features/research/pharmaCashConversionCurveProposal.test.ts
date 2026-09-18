import { describe, expect, it } from "vitest"
import { PHARMA_CASH_CONVERSION_CURVE_PROPOSAL } from "./pharmaCashConversionCurveProposal"

describe("PHARMA Cash Conversion curve proposal", () => {
  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.numericCurveReady).toBe(false)
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.activationApproved).toBe(false)
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.scoreExecutionEnabled).toBe(false)
  })

  it("targets the canonical Cash Flow dimension explicitly", () => {
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.canonicalDimension).toBe("CASH_FLOW")
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.currentParentContractDimension).toBe(
      "EARNINGS_CASH_QUALITY",
    )
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.dimensionAlignmentState).toBe(
      "REQUIRES_VERSIONED_PARENT_RECONCILIATION",
    )
  })

  it("preserves the parent cash-conversion history and matched-input requirements", () => {
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.history.minimumComparableAnnualPeriods).toBe(3)
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.history.preferredComparableAnnualPeriods).toBe(5)
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.history.latestPeriodRequired).toBe(true)
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.history.matchedCfoPatAndCapexFcfPeriodsRequired).toBe(true)
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.history.cfoAloneSufficient).toBe(false)
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.history.singleSnapshotSufficient).toBe(false)
  })

  it("uses CFO/PAT, FCF conversion and consistency/trend as the framework without inventing weights", () => {
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.methodologyShape.components).toEqual([
      "CFO_TO_PAT_CONVERSION",
      "FCF_CONVERSION",
      "CONSISTENCY_AND_TREND",
    ])
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.methodologyShape.componentWeightsState).toBe("UNAPPROVED")
  })

  it("does not create universal numeric cash-conversion bands", () => {
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.universalNumericBandsAllowed).toBe(false)
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.methodologyShape.cfoToPatBandsState).toBe(
      "SUBPROFILE_SPECIFIC_UNAPPROVED",
    )
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.methodologyShape.fcfConversionBandsState).toBe(
      "SUBPROFILE_SPECIFIC_UNAPPROVED",
    )
    expect(Object.values(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.subprofileThresholds).every((value) => value === null)).toBe(true)
  })

  it("requires capex-intensity context before FCF conversion is normalized", () => {
    expect(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.capexIntensityContextRequired).toBe(true)
  })

  it("requires explicit threshold contracts for every canonical Pharma subprofile", () => {
    expect(Object.keys(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.subprofileThresholds).sort()).toEqual([
      "API_BULK_DRUGS",
      "BIOPHARMA_BIOSIMILARS",
      "CDMO_CRAMS",
      "DOMESTIC_FORMULATIONS",
      "GLOBAL_GENERICS",
    ])
  })
})
