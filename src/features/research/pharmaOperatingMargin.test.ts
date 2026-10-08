import { describe, expect, it } from "vitest"
import { deriveOperatingMarginPercent, PHARMA_OPERATING_MARGIN_CALCULATION_CONTRACT } from "./pharmaOperatingMargin"

describe("canonical Pharma operating-margin calculation", () => {
  it("uses exact Decimal arithmetic without calculation-stage display rounding", () => {
    expect(deriveOperatingMarginPercent("1664", "4921")).toBe("33.81426539321276163381426539321276163381")
  })

  it.each(["0", "-1", "not-a-number"])("fails closed for invalid revenue %s", (revenue) => {
    expect(deriveOperatingMarginPercent("10", revenue)).toBeNull()
  })

  it("documents display-only rounding", () => {
    expect(PHARMA_OPERATING_MARGIN_CALCULATION_CONTRACT.rounding).toContain("Display rounding")
  })
})
