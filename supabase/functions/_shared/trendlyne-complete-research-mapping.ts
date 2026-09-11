export type CompleteResearchMetric = {
  readonly canonicalCode: string
  readonly providerLabel: string
  readonly numericValue: number
  readonly canonicalUnit: string
  readonly periodType: "YEAR" | "TTM" | "QUARTER" | "POINT_IN_TIME"
}

type MappingSpec = Omit<CompleteResearchMetric, "numericValue">

const APPROVED_MAPPINGS: readonly MappingSpec[] = [
  { canonicalCode: "ROCE_ANNUAL", providerLabel: "ROCE Ann. %", canonicalUnit: "PERCENT", periodType: "YEAR" },
  { canonicalCode: "OPM_TTM", providerLabel: "OPM TTM %", canonicalUnit: "PERCENT", periodType: "TTM" },
  { canonicalCode: "SHAREHOLDING_PROMOTER_PLEDGE_PERCENT", providerLabel: "Promoter holding pledge percentage % Qtr", canonicalUnit: "PERCENT_OF_PROMOTER_HOLDING", periodType: "QUARTER" },
  { canonicalCode: "GROSS_NPA_PERCENT", providerLabel: "Gross NPA ratio Qtr %", canonicalUnit: "PERCENT", periodType: "QUARTER" },
  { canonicalCode: "NET_NPA_PERCENT", providerLabel: "Net NPA ratio % Qtr", canonicalUnit: "PERCENT", periodType: "QUARTER" },
  { canonicalCode: "EPS_GROWTH_YOY", providerLabel: "EPS Qtr YoY Growth %", canonicalUnit: "PERCENT", periodType: "QUARTER" },
  { canonicalCode: "PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT", providerLabel: "Fair Price 5YrPE Upside%", canonicalUnit: "PERCENT", periodType: "POINT_IN_TIME" },
]

const unwrapMarkdown = (providerResult: string): string => {
  let parsed: unknown
  try { parsed = JSON.parse(providerResult) } catch { throw new Error("PROVIDER_RESULT_JSON_INVALID") }
  if (!parsed || typeof parsed !== "object" || typeof (parsed as { markdown_data?: unknown }).markdown_data !== "string") {
    throw new Error("PROVIDER_MARKDOWN_MISSING")
  }
  let markdown = (parsed as { markdown_data: string }).markdown_data.trim()
  if (markdown.startsWith('"') && markdown.endsWith('"')) markdown = markdown.slice(1, -1)
  return markdown.replace(/\\n/g, "\n")
}

const assertPrimaryIdentity = (markdown: string, expectedSymbol: string, expectedInstrumentId: string) => {
  const first = markdown.split(/\r?\n/).map(x => x.trim()).find(Boolean)
  if (!first) throw new Error("PROVIDER_PRIMARY_ENTITY_MISMATCH")
  const fields = first.split("|").map(x => x.trim())
  if (fields.length < 3 || fields[0] !== expectedInstrumentId || fields[2].toUpperCase() !== expectedSymbol.toUpperCase()) {
    throw new Error("PROVIDER_PRIMARY_ENTITY_MISMATCH")
  }
}

const exactSectionValue = (markdown: string, providerLabel: string, symbol: string): number | null => {
  const lines = markdown.split(/\r?\n/).map(line => line.trim())
  const indexes = lines.flatMap((line, index) => line === providerLabel ? [index] : [])
  if (indexes.length !== 1) return null
  const values: string[] = []
  for (let index = indexes[0] + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line === "---") break
    if (line.startsWith(`${symbol}:`)) values.push(line.slice(symbol.length + 1).trim())
  }
  if (values.length !== 1 || !values[0] || values[0] === "None") return null
  const numeric = Number(values[0])
  return Number.isFinite(numeric) ? numeric : null
}

export function mapApprovedCompleteResearchMetrics(providerResult: string, expectedSymbol: string, expectedInstrumentId: string): CompleteResearchMetric[] {
  const markdown = unwrapMarkdown(providerResult)
  assertPrimaryIdentity(markdown, expectedSymbol, expectedInstrumentId)
  return APPROVED_MAPPINGS.flatMap(mapping => {
    const numericValue = exactSectionValue(markdown, mapping.providerLabel, expectedSymbol)
    return numericValue === null ? [] : [{ ...mapping, numericValue }]
  })
}
