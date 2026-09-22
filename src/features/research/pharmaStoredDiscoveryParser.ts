import Decimal from "decimal.js"

export const PHARMA_STORED_DISCOVERY_PARSER_VERSION = "PHARMA_STORED_DISCOVERY_PARSER_V2" as const

export interface ParsedTrendlyneValue {
  readonly label: string
  readonly symbol: string
  readonly value: string | null
}

export interface ParsedTrendlyneDiscovery {
  readonly values: readonly ParsedTrendlyneValue[]
  readonly conflicts: readonly string[]
}

export interface ParsedTrendlyneStoredResults extends ParsedTrendlyneDiscovery {
  readonly parsedResultKeys: readonly string[]
  readonly rejectedResultKeys: readonly string[]
}

function normalizeLabel(value: string) {
  return value.trim().replaceAll(/\s+/gu, " ").toLocaleLowerCase()
}

function normalizeSymbol(value: string) {
  return value.trim().toLocaleUpperCase()
}

function parseValue(raw: string): string | null {
  const value = raw.trim()
  if (!value || value.toLocaleLowerCase() === "none" || value.toLocaleLowerCase() === "null") return null
  try {
    const decimal = new Decimal(value)
    return decimal.isFinite() ? decimal.toString() : null
  } catch {
    return null
  }
}

/**
 * Parses one Trendlyne markdown_data response. The provider may return many
 * securities in the same result, so only rows matching targetSymbol are kept.
 * Repeated labels with different target-symbol values are conflicts and are
 * excluded from the usable result rather than silently picking one.
 */
export function parseTrendlyneMultiStockMarkdown(markdown: string, targetSymbol: string): ParsedTrendlyneDiscovery {
  const wanted = normalizeSymbol(targetSymbol)
  const sections = markdown.replaceAll("\\n", "\n").split(/\n\s*---\s*\n/gu)
  const candidates = new Map<string, ParsedTrendlyneValue[]>()

  for (const section of sections) {
    const lines = section.split(/\r?\n/gu).map((line) => line.trim()).filter(Boolean)
    if (!lines.length) continue

    let label: string | null = null
    for (const line of lines) {
      if (/^\d+\|/u.test(line)) continue
      if (!line.includes(":")) {
        label = line
        continue
      }
      if (!label) continue
      const separator = line.indexOf(":")
      const symbol = normalizeSymbol(line.slice(0, separator))
      if (symbol !== wanted) continue
      const parsed: ParsedTrendlyneValue = {
        label,
        symbol,
        value: parseValue(line.slice(separator + 1)),
      }
      const key = normalizeLabel(label)
      candidates.set(key, [...(candidates.get(key) ?? []), parsed])
    }
  }

  const values: ParsedTrendlyneValue[] = []
  const conflicts: string[] = []
  for (const items of candidates.values()) {
    const distinctValues = new Set(items.map((item) => item.value ?? "<NULL>"))
    if (distinctValues.size > 1) {
      conflicts.push(items[0]!.label)
      continue
    }
    values.push(items[0]!)
  }

  return {
    values: values.sort((a, b) => a.label.localeCompare(b.label)),
    conflicts: conflicts.sort(),
  }
}

/** Accepts either a decoded provider object or the JSON string captured by R4E/F. */
export function extractTrendlyneMarkdownData(value: unknown): string | null {
  let current: unknown = value
  for (let depth = 0; depth < 3; depth += 1) {
    if (current && typeof current === "object" && "markdown_data" in current) {
      const markdown = (current as { readonly markdown_data?: unknown }).markdown_data
      return typeof markdown === "string" ? markdown : null
    }
    if (typeof current !== "string") return null
    try {
      current = JSON.parse(current) as unknown
    } catch {
      return null
    }
  }
  return null
}

/**
 * Parses an R4H-style stored source record where `results` is an object of
 * named provider responses (for example EARNINGS_ROCE_HISTORY). Values may be
 * JSON strings wrapped one or more times. Cross-query disagreement for the same
 * provider label fails closed as a conflict.
 */
export function parseTrendlyneStoredResults(payload: unknown, targetSymbol: string): ParsedTrendlyneStoredResults {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { values: [], conflicts: [], parsedResultKeys: [], rejectedResultKeys: [] }
  }
  const results = (payload as { readonly results?: unknown }).results
  if (!results || typeof results !== "object" || Array.isArray(results)) {
    return { values: [], conflicts: [], parsedResultKeys: [], rejectedResultKeys: [] }
  }

  const candidates = new Map<string, ParsedTrendlyneValue[]>()
  const conflicts = new Set<string>()
  const parsedResultKeys: string[] = []
  const rejectedResultKeys: string[] = []

  for (const [resultKey, raw] of Object.entries(results)) {
    const markdown = extractTrendlyneMarkdownData(raw)
    if (!markdown) {
      rejectedResultKeys.push(resultKey)
      continue
    }
    parsedResultKeys.push(resultKey)
    const parsed = parseTrendlyneMultiStockMarkdown(markdown, targetSymbol)
    parsed.conflicts.forEach((label) => conflicts.add(normalizeLabel(label)))
    for (const value of parsed.values) {
      const key = normalizeLabel(value.label)
      candidates.set(key, [...(candidates.get(key) ?? []), value])
    }
  }

  const values: ParsedTrendlyneValue[] = []
  for (const [key, items] of candidates) {
    const distinctValues = new Set(items.map((item) => item.value ?? "<NULL>"))
    if (distinctValues.size > 1) {
      conflicts.add(key)
      continue
    }
    if (!conflicts.has(key)) values.push(items[0]!)
  }

  const conflictLabels = [...conflicts].map((key) => candidates.get(key)?.[0]?.label ?? key)
  return {
    values: values.sort((a, b) => a.label.localeCompare(b.label)),
    conflicts: conflictLabels.sort(),
    parsedResultKeys: parsedResultKeys.sort(),
    rejectedResultKeys: rejectedResultKeys.sort(),
  }
}
