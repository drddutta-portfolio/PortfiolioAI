import Decimal from "decimal.js"

export const PHARMA_STORED_DISCOVERY_PARSER_VERSION = "PHARMA_STORED_DISCOVERY_PARSER_V1" as const

export interface ParsedTrendlyneValue {
  readonly label: string
  readonly symbol: string
  readonly value: string | null
}

export interface ParsedTrendlyneDiscovery {
  readonly values: readonly ParsedTrendlyneValue[]
  readonly conflicts: readonly string[]
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
