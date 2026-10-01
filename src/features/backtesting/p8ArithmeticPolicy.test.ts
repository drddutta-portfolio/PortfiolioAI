import Decimal from "decimal.js"
import { describe, expect, it } from "vitest"
import {
  P8_B3_ARITHMETIC_POLICY,
  P8_B3_ARITHMETIC_POLICY_VERSION,
  canonicalDerivedDecimal,
  canonicalSourceDecimal,
} from "./p8ArithmeticPolicy"
import { calculateSplitFromFaceValues } from "./p8CorporateActionAdjustment"

describe("P8-B3 arithmetic policy", () => {
  it("freezes the explicit arithmetic contract", () => {
    expect(P8_B3_ARITHMETIC_POLICY).toEqual({
      version: "P8_B3_ARITHMETIC_V1",
      internalPrecisionSignificantDigits: 50,
      persistedDerivedSignificantDigits: 30,
      roundingMode: "ROUND_HALF_EVEN",
      totalReturnIndexBase: "1000",
      sourceDecimalRule:
        "Parse authoritative source numerics as decimal strings and do not pre-round before calculation.",
      persistedDerivedRule:
        "Round derived factors, returns and derived index values to 30 significant digits using ROUND_HALF_EVEN.",
      storageRule:
        "Persist authoritative source values and derived values as PostgreSQL numeric / canonical decimal strings; never binary floating point.",
      presentationRule:
        "Presentation rounding is non-authoritative and must never feed back into stored facts or calculations.",
    })
    expect(P8_B3_ARITHMETIC_POLICY_VERSION).toBe("P8_B3_ARITHMETIC_V1")
  })

  it("preserves an authoritative source decimal without derived rounding", () => {
    expect(canonicalSourceDecimal("123.456789012345678901234567890123456789")).toBe(
      "123.456789012345678901234567890123456789",
    )
  })

  it("rounds derived values to 30 significant digits using half-even", () => {
    expect(
      canonicalDerivedDecimal("1.234567890123456789012345678925"),
    ).toBe("1.23456789012345678901234567892")

    expect(
      canonicalDerivedDecimal("1.234567890123456789012345678935"),
    ).toBe("1.23456789012345678901234567894")
  })

  it("stores a recurring split factor deterministically at 30 significant digits", () => {
    const result = calculateSplitFromFaceValues("3", "1")

    expect(result).toMatchObject({
      calculationVersion: "P8_B3_ADJUSTMENT_V2",
      arithmeticPolicyVersion: "P8_B3_ARITHMETIC_V1",
      shareFactor: "3",
      priceBackAdjustmentFactor: "0.333333333333333333333333333333",
    })
  })

  it("is isolated from application-wide Decimal defaults", () => {
    const original = {
      precision: Decimal.precision,
      rounding: Decimal.rounding,
      toExpNeg: Decimal.toExpNeg,
      toExpPos: Decimal.toExpPos,
    }

    try {
      Decimal.set({
        precision: 5,
        rounding: Decimal.ROUND_DOWN,
        toExpNeg: -7,
        toExpPos: 21,
      })

      expect(calculateSplitFromFaceValues("3", "1").priceBackAdjustmentFactor).toBe(
        "0.333333333333333333333333333333",
      )
    } finally {
      Decimal.set(original)
    }
  })

  it("never uses presentation rounding as a calculation input", () => {
    const exact = canonicalSourceDecimal("100.005")
    const roundedForDisplay = "100.01"

    expect(exact).toBe("100.005")
    expect(exact).not.toBe(roundedForDisplay)
  })
})
