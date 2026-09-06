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
