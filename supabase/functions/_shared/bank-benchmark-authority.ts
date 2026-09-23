function key(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return ""
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "")
}

const BANK_BENCHMARK_INDUSTRIES = new Set([
  "BANKS",
  "PRIVATE_SECTOR_BANK",
])

export function isBankBenchmarkEligibleClassification(sector: unknown, industry: unknown): boolean {
  return key(sector) === "BANKING" && BANK_BENCHMARK_INDUSTRIES.has(key(industry))
}
