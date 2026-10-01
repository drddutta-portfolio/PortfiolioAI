import Decimal from "decimal.js"

export const P8_B3_ARITHMETIC_POLICY_VERSION = "P8_B3_ARITHMETIC_V1" as const

export const P8_B3_ARITHMETIC_POLICY = Object.freeze({
  version: P8_B3_ARITHMETIC_POLICY_VERSION,
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
} as const)

/**
 * Isolated Decimal constructor for P8-B3.
 *
 * Do not use Decimal.set() for B3 calculations. A cloned constructor prevents
 * unrelated application code from changing B3 arithmetic semantics at runtime.
 */
export const P8Decimal = Decimal.clone({
  precision: P8_B3_ARITHMETIC_POLICY.internalPrecisionSignificantDigits,
  rounding: Decimal.ROUND_HALF_EVEN,
  toExpNeg: -1000,
  toExpPos: 1000,
})

export type P8DecimalValue = Decimal.Value

function finiteDecimal(value: P8DecimalValue, name: string): InstanceType<typeof P8Decimal> {
  const parsed = new P8Decimal(value)
  if (!parsed.isFinite()) {
    throw new Error(`${name} must be finite`)
  }
  return parsed
}

export function p8FinitePositive(
  value: P8DecimalValue,
  name: string,
): InstanceType<typeof P8Decimal> {
  const parsed = finiteDecimal(value, name)
  if (parsed.lte(0)) {
    throw new Error(`${name} must be finite and > 0`)
  }
  return parsed
}

export function p8FiniteNonNegative(
  value: P8DecimalValue,
  name: string,
): InstanceType<typeof P8Decimal> {
  const parsed = finiteDecimal(value, name)
  if (parsed.lt(0)) {
    throw new Error(`${name} must be finite and >= 0`)
  }
  return parsed
}

/**
 * Canonicalize an authoritative source decimal without applying B3 derived
 * rounding. The original raw source string remains preserved separately in
 * source evidence; this representation is only a normalized decimal spelling.
 */
export function canonicalSourceDecimal(value: P8DecimalValue): string {
  const parsed = finiteDecimal(value, "sourceDecimal")
  return parsed.toFixed(parsed.decimalPlaces())
}

/**
 * Canonicalize a derived financial value under the frozen candidate policy.
 * This is the only B3 rounding boundary for factors/returns/derived indexes.
 */
export function canonicalDerivedDecimal(value: P8DecimalValue): string {
  const parsed = finiteDecimal(value, "derivedDecimal")
  return parsed
    .toSignificantDigits(
      P8_B3_ARITHMETIC_POLICY.persistedDerivedSignificantDigits,
      Decimal.ROUND_HALF_EVEN,
    )
    .toString()
}
