import { describe, expect, it } from "vitest"
import {
  blockUnsupportedCorporateAction,
  calculateBonusFromRatio,
  calculateCashDividendReturnLink,
  calculateSplitFromFaceValues,
} from "./p8CorporateActionAdjustment"

describe("P8-B3 deterministic corporate-action adjustment", () => {
  it("computes a 10-to-2 face-value split exactly", () => {
    expect(calculateSplitFromFaceValues(10, 2)).toEqual({
      state: "READY",
      calculationVersion: "P8_B3_ADJUSTMENT_V1",
      shareFactor: "5",
      priceBackAdjustmentFactor: "0.2",
    })
  })

  it("computes a 1:1 bonus exactly", () => {
    expect(calculateBonusFromRatio(1, 1)).toEqual({
      state: "READY",
      calculationVersion: "P8_B3_ADJUSTMENT_V1",
      shareFactor: "2",
      priceBackAdjustmentFactor: "0.5",
    })
  })

  it("computes price and total-return links from an explicit cash dividend", () => {
    expect(calculateCashDividendReturnLink({
      previousClose: 100,
      exDateClose: 96,
      cashDistributionPerShare: 5,
    })).toEqual({
      state: "READY",
      calculationVersion: "P8_B3_ADJUSTMENT_V1",
      cashDistributionPerShare: "5",
      referencePrice: "100",
      priceReturnLinkFactor: "0.96",
      totalReturnLinkFactor: "1.01",
    })
  })

  it("rejects invalid split terms rather than repairing them", () => {
    expect(() => calculateSplitFromFaceValues(10, 0)).toThrow(
      "newFaceValue must be finite and > 0",
    )
  })

  it("rejects invalid dividend inputs rather than inferring values", () => {
    expect(() => calculateCashDividendReturnLink({
      previousClose: 0,
      exDateClose: 96,
      cashDistributionPerShare: 5,
    })).toThrow("previousClose must be finite and > 0")
  })

  it("blocks rights issues until an approved exact treatment exists", () => {
    expect(blockUnsupportedCorporateAction(
      "RIGHTS",
      "subscription terms require a separately approved deterministic treatment",
    )).toEqual({
      state: "BLOCKED",
      calculationVersion: "P8_B3_ADJUSTMENT_V1",
      blockerReason:
        "RIGHTS: subscription terms require a separately approved deterministic treatment",
    })
  })

  it("blocks merger/demerger adjustments rather than inferring from price jumps", () => {
    expect(blockUnsupportedCorporateAction(
      "DEMERGER",
      "successor entitlement and valuation lineage not proven",
    ).state).toBe("BLOCKED")
  })
})
