export type TrendlyneReviewPeriodType = "QUARTER" | "YEAR" | "TTM"

export type TrendlyneReviewCandidate = {
  readonly canonicalCode: "ROCE_ANNUAL" | "EPS_DILUTED" | "EBITDA_TTM" | "OPM_TTM"
  readonly providerLabel: string
  readonly numericValue: number
  readonly canonicalUnit: "PERCENT" | "INR_PER_SHARE" | "INR_CRORE"
  readonly periodType: TrendlyneReviewPeriodType
  readonly mappingState: "REVIEW_CANDIDATE"
}

type MappingSpec = Omit<TrendlyneReviewCandidate, "numericValue" | "mappingState">

const MAPPINGS: readonly MappingSpec[] = [
  { canonicalCode: "ROCE_ANNUAL", providerLabel: "ROCE Ann. %", canonicalUnit: "PERCENT", periodType: "YEAR" },
  { canonicalCode: "EPS_DILUTED", providerLabel: "Diluted EPS Qtr", canonicalUnit: "INR_PER_SHARE", periodType: "QUARTER" },
  { canonicalCode: "EBITDA_TTM", providerLabel: "EBITDA TTM", canonicalUnit: "INR_CRORE", periodType: "TTM" },
  { canonicalCode: "OPM_TTM", providerLabel: "OPM TTM %", canonicalUnit: "PERCENT", periodType: "TTM" },
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

const exactSectionValue = (markdown: string, providerLabel: string, symbol: string): number | null => {
  const lines = markdown.split(/\r?\n/).map(line => line.trim())
  const labelIndexes = lines.flatMap((line, index) => line === providerLabel ? [index] : [])
  if (labelIndexes.length !== 1) return null

  const start = labelIndexes[0] + 1
  const values: string[] = []
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index]
    if (line === "---") break
    if (line.startsWith(`${symbol}:`)) values.push(line.slice(symbol.length + 1).trim())
  }
  if (values.length !== 1 || values[0] === "None" || values[0] === "") return null
  const numericValue = Number(values[0])
  return Number.isFinite(numericValue) ? numericValue : null
}

export function mapObservedTrendlyneReviewCandidates(providerResult: string, symbol: string): TrendlyneReviewCandidate[] {
  const markdown = unwrapMarkdown(providerResult)
  const normalizedSymbol = symbol.trim().toUpperCase()
  if (!normalizedSymbol) return []

  return MAPPINGS.flatMap(mapping => {
    const numericValue = exactSectionValue(markdown, mapping.providerLabel, normalizedSymbol)
    if (numericValue === null) return []
    return [{ ...mapping, numericValue, mappingState: "REVIEW_CANDIDATE" as const }]
  })
}
