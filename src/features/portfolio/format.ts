import Decimal from "decimal.js"

export function formatQuantity(value: string) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 8 }).format(new Decimal(value).toNumber())
}

export function formatMoney(value: string | null, currency = "INR") {
  if (value === null) return "Unavailable"
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 })
    .format(new Decimal(value).toNumber())
}

export function formatPercent(value: string | null) {
  return value === null ? "Unavailable" : `${new Decimal(value).toDecimalPlaces(2).toFixed(2)}%`
}

/** Presentation only: classify the canonical value before display rounding. */
export function financialTone(value: string | Decimal | null | undefined): "gain" | "loss" | "neutral" | "unavailable" {
  if (value === null || value === undefined) return "unavailable"
  try {
    const decimal = new Decimal(value)
    if (!decimal.isFinite()) return "unavailable"
    return decimal.gt(0) ? "gain" : decimal.lt(0) ? "loss" : "neutral"
  } catch {
    return "unavailable"
  }
}

export function financialClass(value: string | Decimal | null | undefined) {
  return `financial-${financialTone(value)}`
}
