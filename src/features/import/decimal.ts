import Decimal from "decimal.js"

Decimal.set({ precision: 80, rounding: Decimal.ROUND_HALF_UP })

export interface DecimalValidationResult {
  readonly value: string | null
  readonly error: string | null
}

const POSTGRES_NUMERIC_PRECISION = 38
const POSTGRES_NUMERIC_SCALE = 18

function normalizedInput(value: string | number) {
  return typeof value === "number" ? value.toString() : value.trim().replace(/,/g, "")
}

export function parseNumeric38x18(
  value: string | number | null,
  options: { readonly allowZero: boolean },
): DecimalValidationResult {
  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return { value: null, error: null }
  }

  const input = normalizedInput(value)

  try {
    const decimal = new Decimal(input)

    if (!decimal.isFinite()) return { value: null, error: "Value must be finite." }
    if (decimal.isNegative() || (!options.allowZero && decimal.isZero())) {
      return {
        value: null,
        error: options.allowZero ? "Value cannot be negative." : "Value must be greater than zero.",
      }
    }

    const canonical = decimal.toFixed()
    const unsigned = canonical.startsWith("-") ? canonical.slice(1) : canonical
    const [integerPart = "0", fractionalPart = ""] = unsigned.split(".")
    const significantIntegerDigits = integerPart.replace(/^0+/, "").length

    if (
      significantIntegerDigits > POSTGRES_NUMERIC_PRECISION - POSTGRES_NUMERIC_SCALE
      || fractionalPart.length > POSTGRES_NUMERIC_SCALE
    ) {
      return {
        value: null,
        error: "Value exceeds PostgreSQL numeric(38,18) precision.",
      }
    }

    return { value: canonical, error: null }
  } catch {
    return { value: null, error: "Value is not a valid decimal number." }
  }
}

export function addExact(left: string, right: string) {
  return new Decimal(left).plus(right).toFixed()
}

export function subtractExact(left: string, right: string) {
  return new Decimal(left).minus(right).toFixed()
}

export function negateExact(value: string) {
  return new Decimal(value).negated().toFixed()
}

export function decimalsEqual(left: string, right: string) {
  return new Decimal(left).equals(right)
}
