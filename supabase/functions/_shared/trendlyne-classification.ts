export interface TrendlyneClassificationCandidate {
  readonly name: string
  readonly symbol: string
  readonly bseCode: string | null
  readonly isin: string | null
  readonly sector: string | null
  readonly industry: string | null
}

export type TrendlyneClassificationRejectionCode =
  | "AMBIGUOUS_PROVIDER_IDENTITY"
  | "NO_EXACT_PROVIDER_IDENTITY"
  | "CLASSIFICATION_MISSING"
  | "PROVIDER_SCHEMA_MISMATCH"

export type TrendlyneClassificationParseState = "PARSED_TABLE" | "EMPTY_RESULT" | "UNRECOGNIZED_RESPONSE"

export interface TrendlyneClassificationParseMetadata {
  readonly parseState: TrendlyneClassificationParseState
  readonly responseEnvelope: "PLAIN_TEXT" | "JSON_MARKDOWN_DATA" | "JSON_RESULT" | "JSON_DATA" | "JSON_DATA_ARRAY" | "UNSUPPORTED_JSON"
  readonly hasDataMarker: boolean
  readonly hasEndMarker: boolean
  readonly nonEmptyLineCount: number
  readonly pipeDelimitedLineCount: number
  readonly parsedCandidateRowCount: number
}

export interface TrendlyneClassificationMatchMetadata {
  readonly candidateCount: number
  readonly symbolMatchCount: number
  readonly isinMatchCount: number
  readonly exactIdentityMatchCount: number
  readonly exactIdentityWithClassificationCount: number
}

const nullable = (value: string | undefined) => !value || value === "None" || value === "null" ? null : value.trim()

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")
const splitPipeRow = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((value) => value.trim())
const separatorRow = (row: readonly string[]) => row.every((value) => /^:?-{3,}:?$/.test(value))

const candidateFromRecord = (record: Record<string, unknown>): TrendlyneClassificationCandidate => ({
  name: typeof record.name === "string" ? record.name.trim() : "",
  symbol: typeof record.nse_code === "string" ? record.nse_code.trim() : typeof record.symbol === "string" ? record.symbol.trim() : "",
  bseCode: typeof record.bse_code === "string" ? nullable(record.bse_code) : null,
  isin: typeof record.isin === "string" ? nullable(record.isin) : null,
  sector: typeof record.sector === "string" ? nullable(record.sector) : null,
  industry: typeof record.industry === "string" ? nullable(record.industry) : null,
})

const decodeEnvelope = (text: string): { readonly text: string; readonly envelope: TrendlyneClassificationParseMetadata["responseEnvelope"] } => {
  const trimmed = text.trim()
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return { text, envelope: "PLAIN_TEXT" }
  try {
    const value = JSON.parse(trimmed) as unknown
    if (!value || typeof value !== "object" || Array.isArray(value)) return { text, envelope: "UNSUPPORTED_JSON" }
    const record = value as Record<string, unknown>
    if (typeof record.markdown_data === "string") return { text: record.markdown_data, envelope: "JSON_MARKDOWN_DATA" }
    if (typeof record.result === "string") return { text: record.result, envelope: "JSON_RESULT" }
    if (typeof record.data === "string") return { text: record.data, envelope: "JSON_DATA" }
    return { text, envelope: "UNSUPPORTED_JSON" }
  } catch {
    return { text, envelope: "PLAIN_TEXT" }
  }
}

export function parseTrendlyneClassificationResponse(text: string): { readonly candidates: readonly TrendlyneClassificationCandidate[]; readonly metadata: TrendlyneClassificationParseMetadata } {
  const trimmed = text.trim()
  try {
    const json = JSON.parse(trimmed) as unknown
    if (json && typeof json === "object" && !Array.isArray(json)) {
      const data = (json as Record<string, unknown>).data
      if (Array.isArray(data) && data.every((row) => row && typeof row === "object" && !Array.isArray(row))) {
        const candidates = data.map((row) => candidateFromRecord(row as Record<string, unknown>))
        return { candidates, metadata: { parseState: candidates.length ? "PARSED_TABLE" : "EMPTY_RESULT", responseEnvelope: "JSON_DATA_ARRAY", hasDataMarker: true, hasEndMarker: false, nonEmptyLineCount: 1, pipeDelimitedLineCount: 0, parsedCandidateRowCount: candidates.length } }
      }
    }
  } catch { /* Provider currently also returns a status/data text table. */ }
  const decoded = decodeEnvelope(text)
  const hasDataMarker = /(?:^|\s)data:/u.test(decoded.text)
  const hasEndMarker = decoded.text.includes("__END__")
  const afterData = hasDataMarker ? decoded.text.split(/(?:^|\s)data:/u).slice(1).join("data:") : decoded.text
  const block = hasEndMarker ? afterData.split("__END__")[0] : afterData
  const lines = block.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean)
  const pipeLines = lines.filter((line) => line.includes("|"))
  const rows = pipeLines.map(splitPipeRow)
  const headerIndex = rows.findIndex((row) => {
    const headers = row.map(normalizeHeader)
    return (headers.includes("symbol") || headers.includes("nsecode")) && headers.includes("isin") && headers.includes("sector") && headers.includes("industry")
  })
  const baseMetadata = {
    responseEnvelope: decoded.envelope,
    hasDataMarker,
    hasEndMarker,
    nonEmptyLineCount: lines.length,
    pipeDelimitedLineCount: pipeLines.length,
  }
  if (!decoded.text.trim() || (hasDataMarker && lines.length === 1 && lines[0] === "[]")) return { candidates: [], metadata: { ...baseMetadata, parseState: "EMPTY_RESULT", parsedCandidateRowCount: 0 } }
  if (headerIndex < 0 || decoded.envelope === "UNSUPPORTED_JSON") return { candidates: [], metadata: { ...baseMetadata, parseState: "UNRECOGNIZED_RESPONSE", parsedCandidateRowCount: 0 } }

  const headers = rows[headerIndex].map(normalizeHeader)
  const index = (name: string) => headers.indexOf(name)
  const candidates = rows.slice(headerIndex + 1)
    .filter((row) => !separatorRow(row))
    .filter((row) => row.length >= headers.length)
    .map((row) => ({
      name: nullable(row[index("name")]) ?? nullable(row[index("company")]) ?? nullable(row[index("companyname")]) ?? "",
      symbol: nullable(row[index("symbol")]) ?? nullable(row[index("nsecode")]) ?? "",
      bseCode: nullable(row[index("bse")]) ?? nullable(row[index("bsecode")]),
      isin: nullable(row[index("isin")]),
      sector: nullable(row[index("sector")]),
      industry: nullable(row[index("industry")]),
    }))
  return { candidates, metadata: { ...baseMetadata, parseState: "PARSED_TABLE", parsedCandidateRowCount: candidates.length } }
}

export function parseTrendlyneClassificationCandidates(text: string): readonly TrendlyneClassificationCandidate[] {
  return parseTrendlyneClassificationResponse(text).candidates
}

export function matchTrendlyneClassificationCandidate(
  candidates: readonly TrendlyneClassificationCandidate[],
  target: { readonly symbol: string; readonly isin: string },
): { readonly candidate: TrendlyneClassificationCandidate | null; readonly reason: TrendlyneClassificationRejectionCode | null; readonly metadata: TrendlyneClassificationMatchMetadata } {
  const symbolMatches = candidates.filter((candidate) => candidate.symbol === target.symbol)
  const isinMatches = candidates.filter((candidate) => candidate.isin?.toUpperCase() === target.isin)
  const exactMatches = candidates.filter((candidate) => candidate.symbol === target.symbol && candidate.isin?.toUpperCase() === target.isin)
  const classifiedExactMatches = exactMatches.filter((candidate) => candidate.sector && candidate.industry)
  const metadata = {
    candidateCount: candidates.length,
    symbolMatchCount: symbolMatches.length,
    isinMatchCount: isinMatches.length,
    exactIdentityMatchCount: exactMatches.length,
    exactIdentityWithClassificationCount: classifiedExactMatches.length,
  }
  if (exactMatches.length === 0) return { candidate: null, reason: "NO_EXACT_PROVIDER_IDENTITY", metadata }
  if (exactMatches.length > 1) return { candidate: null, reason: "AMBIGUOUS_PROVIDER_IDENTITY", metadata }
  if (classifiedExactMatches.length === 0) return { candidate: null, reason: "CLASSIFICATION_MISSING", metadata }
  return { candidate: classifiedExactMatches[0], reason: null, metadata }
}
