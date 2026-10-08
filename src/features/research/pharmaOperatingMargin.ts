import Decimal from "decimal.js"

const OperatingMarginDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
})

export const PHARMA_OPERATING_MARGIN_CALCULATION_VERSION = "PHARMA_OPERATING_MARGIN_CALCULATION_V1" as const

function finiteDecimal(value: string | number): Decimal | null {
  try {
    const parsed = new OperatingMarginDecimal(value)
    return parsed.isFinite() ? parsed : null
  } catch {
    return null
  }
}

/**
 * Canonical deterministic owner for operating-margin derivation.
 *
 * Derived values retain calculation precision. UI/display rounding belongs to
 * presentation formatting and must not mutate the canonical derived value.
 */
export function deriveOperatingMarginPercent(
  operatingProfit: string | number,
  operatingRevenue: string | number,
): string | null {
  const profit = finiteDecimal(operatingProfit)
  const revenue = finiteDecimal(operatingRevenue)
  if (!profit || !revenue || revenue.lte(0)) return null
  return profit.div(revenue).mul(100).toString()
}

export const PHARMA_OPERATING_MARGIN_CALCULATION_CONTRACT = {
  version: PHARMA_OPERATING_MARGIN_CALCULATION_VERSION,
  arithmetic: "decimal.js precision 40 / ROUND_HALF_UP",
  formula: "operating profit / operating revenue × 100",
  invalidRevenue: "Zero, negative, missing, or non-finite operating revenue is invalid and never coerced to zero margin.",
  rounding: "Calculation output is retained at deterministic calculation precision. Display rounding is presentation-only.",
} as const
