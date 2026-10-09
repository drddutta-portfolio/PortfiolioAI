/**
 * Exact, conservative comparison of SQL numeric OHLCV values with provider
 * normalized decimal payloads. Never round through IEEE-754 after retrieval.
 * Unexpected formats fail closed pending source-bound review.
 */
function normalizedDecimal(input: unknown): string | null {
  if (typeof input !== "string" && typeof input !== "number") return null
  if (typeof input === "number" && !Number.isFinite(input)) return null
  const raw = String(input)
  if (!/^-?\d+(?:\.\d+)?$/.test(raw)) return null
  const negative = raw.startsWith("-")
  const value = negative ? raw.slice(1) : raw
  const [whole = "", fraction = ""] = value.split(".")
  const integer = whole.replace(/^0+/, "") || "0"
  const fractional = fraction.replace(/0+$/, "")
  const result = fractional ? `${integer}.${fractional}` : integer
  return negative && result !== "0" ? `-${result}` : result
}

/** false includes unparseable values; they must never be admitted as equivalent. */
export function sameQualifiedHistoryNumeric(existing: unknown, incoming: unknown): boolean {
  const a = normalizedDecimal(existing)
  const b = normalizedDecimal(incoming)
  return a !== null && b !== null && a === b
}
