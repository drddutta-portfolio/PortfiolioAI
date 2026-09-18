import { describe, expect, it } from "vitest"
import { PHARMA_ROCE_CURVE_PROPOSAL } from "./pharmaRoceCurveProposal"

describe("PHARMA ROCE / Capital Efficiency curve proposal", () => {
  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_ROCE_CURVE_PROPOSAL.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_ROCE_CURVE_PROPOSAL.numericCurveReady).toBe(false)
    expect(PHARMA_ROCE_CURVE_PROPOSAL.activationApproved).toBe(false)
    expect(PHARMA_ROCE_CURVE_PROPOSAL.scoreExecutionEnabled).toBe(false)
  })

  it("targets the canonical Capital Efficiency dimension explicitly", () => {
    expect(PHARMA_ROCE_CURVE_PROPOSAL.canonicalDimension).toBe("CAPITAL_EFFICIENCY")
    expect(PHARMA_ROCE_CURVE_PROPOSAL.currentParentContractDimension).toBe("QUALITY")
    expect(PHARMA_ROCE_CURVE_PROPOSAL.dimensionAlignmentState).toBe(
      "REQUIRES_VERSIONED_PARENT_RECONCILIATION",
    )
  })

  it("preserves the parent ROCE history requirement", () => {
    expect(PHARMA_ROCE_CURVE_PROPOSAL.history.minimumComparableAnnualPeriods).toBe(3)
    expect(PHARMA_ROCE_CURVE_PROPOSAL.history.preferredComparableAnnualPeriods).toBe(5)
    expect(PHARMA_ROCE_CURVE_PROPOSAL.history.latestPeriodRequired).toBe(true)
    expect(PHARMA_ROCE_CURVE_PROPOSAL.history.consistentCalculationSemanticsRequired).toBe(true)
    expect(PHARMA_ROCE_CURVE_PROPOSAL.history.singleSnapshotSufficient).toBe(false)
  })

  it("uses the canonical Level + Stability + Trend shape without inventing weights", () => {
    expect(PHARMA_ROCE_CURVE_PROPOSAL.methodologyShape.components).toEqual([
      "LEVEL",
      "STABILITY",
      "TREND",
    ])
    expect(PHARMA_ROCE_CURVE_PROPOSAL.methodologyShape.componentWeightsState).toBe("UNAPPROVED")
  })

  it("does not create universal numeric ROCE bands", () => {
    expect(PHARMA_ROCE_CURVE_PROPOSAL.universalNumericBandsAllowed).toBe(false)
    expect(PHARMA_ROCE_CURVE_PROPOSAL.methodologyShape.levelBandsState).toBe(
      "SUBPROFILE_SPECIFIC_UNAPPROVED",
    )
    expect(Object.values(PHARMA_ROCE_CURVE_PROPOSAL.subprofileThresholds).every((value) => value === null)).toBe(true)
  })

  it("requires explicit threshold contracts for every canonical Pharma subprofile", () => {
    expect(Object.keys(PHARMA_ROCE_CURVE_PROPOSAL.subprofileThresholds).sort()).toEqual([
      "API_BULK_DRUGS",
      "BIOPHARMA_BIOSIMILARS",
      "CDMO_CRAMS",
      "DOMESTIC_FORMULATIONS",
      "GLOBAL_GENERICS",
    ])
  })
})
