import Decimal from "decimal.js"
import { describe, expect, it } from "vitest"
import { financialClass, financialTone } from "./format"

describe("canonical financial value presentation", () => {
  it.each([
    ["100.25", "gain"], ["-100.25", "loss"], ["0", "neutral"], ["-0", "neutral"],
    ["0.0000000000000000000001", "gain"], ["-0.0000000000000000000001", "loss"],
    ["99999999999999999999999999999999", "gain"], [null, "unavailable"],
    [undefined, "unavailable"], ["", "unavailable"], ["garbage", "unavailable"],
    ["NaN", "unavailable"], ["Infinity", "unavailable"], ["-Infinity", "unavailable"],
  ])("classifies %s before display rounding as %s", (value, expected) => {
    expect(financialTone(value)).toBe(expected)
    expect(financialClass(value)).toBe(`financial-${expected}`)
  })
  it("accepts existing Decimal view-model values without changing them", () => {
    const value = new Decimal("-0.000000000000000000001")
    expect(financialTone(value)).toBe("loss")
    expect(value.toFixed()).toBe("-0.000000000000000000001")
  })
})
