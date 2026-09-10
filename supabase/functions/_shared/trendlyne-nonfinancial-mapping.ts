export type NonfinancialCanonicalCode =
  | "ROCE_ANNUAL"
  | "OPM_TTM"
  | "SHAREHOLDING_PROMOTER_PLEDGE_PERCENT"

export type NonfinancialMappingCandidate = {
  readonly canonicalCode: NonfinancialCanonicalCode
  readonly providerLabel: string
  readonly numericValue: number
  readonly canonicalUnit: "PERCENT" | "PERCENT_OF_PROMOTER_HOLDING"
  readonly periodType: "YEAR" | "TTM" | "QUARTER"
}

type MappingSpec = Omit<NonfinancialMappingCandidate, "numericValue">

const MAPPINGS: readonly MappingSpec[] = [
  {
    canonicalCode: "ROCE_ANNUAL",
    providerLabel: "ROCE Ann. %",
    canonicalUnit: "PERCENT",
    periodType: "YEAR",
  },
  {
    canonicalCode: "OPM_TTM",
    providerLabel: "OPM TTM %",
    canonicalUnit: "PERCENT",
    periodType: "TTM",
  },
  {
    canonicalCode: "SHAREHOLDING_PROMOTER_PLEDGE_PERCENT",
    providerLabel: "Promoter holding pledge percentage % Qtr",
    canonicalUnit: "PERCENT_OF_PROMOTER_HOLDING",
    periodType: "QUARTER",
  },
]

const unwrapMarkdown = (providerResult: string): string => {
  let parsed: unknown
  try {
    parsed = JSON.parse(providerResult)
  } catch {
    throw new Error("PROVIDER_RESULT_JSON_INVALID")
  }
  if (!parsed || typeof parsed !== "object" || typeof (parsed as { markdown_data?: unknown }).markdown_data !== "string") {
    throw new Error("PROVIDER_MARKDOWN_MISSING")
  }
  let markdown = (parsed as { markdown_data: string }).markdown_data.trim()
  if (markdown.startsWith('"') && markdown.endsWith('"')) markdown = markdown.slice(1, -1)
  return markdown.replace(/\\n/g, "\n")
}

const exactPrimaryIdentity = (
  markdown: string,
  expectedSymbol: string,
  expectedInstrumentId: string,
): boolean => {
  const first = markdown.split(/\r?\n/).map(x => x.trim()).find(Boolean)
  if (!first) return false
  const fields = first.split("|").map(x => x.trim())
  return fields.length >= 3 && fields[0] === expectedInstrumentId && fields[2].toUpperCase() === expectedSymbol.toUpperCase()
}

const exactSectionValue = (markdown: string, providerLabel: string, symbol: string): number | null => {
  const lines = markdown.split(/\r?\n/).map(line => line.trim())
  const labelIndexes = lines.flatMap((line, index) => line === providerLabel ? [index] : [])
  if (labelIndexes.length !== 1) return null

  const values: string[] = []
  for (let index = labelIndexes[0] + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line === "---") break
    if (line.startsWith(`${symbol}:`)) values.push(line.slice(symbol.length + 1).trim())
  }
  if (values.length !== 1 || values[0] === "None" || values[0] === "") return null
  const value = Number(values[0])
  return Number.isFinite(value) ? value : null
}

export function mapExactNonfinancialTrendlyneMetrics(
  providerResult: string,
  expectedSymbol: string,
  expectedInstrumentId: string,
): NonfinancialMappingCandidate[] {
  const markdown = unwrapMarkdown(providerResult)
  if (!exactPrimaryIdentity(markdown, expectedSymbol, expectedInstrumentId)) {
    throw new Error("PROVIDER_PRIMARY_ENTITY_MISMATCH")
  }

  return MAPPINGS.map(mapping => {
    const numericValue = exactSectionValue(markdown, mapping.providerLabel, expectedSymbol)
    if (numericValue === null) throw new Error(`APPROVED_METRIC_MISSING:${mapping.canonicalCode}`)
    return { ...mapping, numericValue }
  })
}
