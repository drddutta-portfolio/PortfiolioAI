import { describe, expect, it } from "vitest"
import { matchTrendlyneClassificationCandidate, parseTrendlyneClassificationCandidates, parseTrendlyneClassificationResponse } from "./trendlyne-classification"

const candidate = (overrides: Partial<ReturnType<typeof parseTrendlyneClassificationCandidates>[number]> = {}) => ({
  name: "Alivus Life Sciences Limited", symbol: "ALIVUS", bseCode: "543473", isin: "INE03Q201024", sector: "Healthcare", industry: "Pharmaceuticals", ...overrides,
})

describe("Trendlyne classification identity matching", () => {
  it("accepts only one exact canonical ISIN and symbol match with classification", () => {
    const result = matchTrendlyneClassificationCandidate([candidate(), candidate({ symbol: "OTHER" })], { symbol: "ALIVUS", isin: "INE03Q201024" })
    expect(result).toMatchObject({ reason: null, candidate: { symbol: "ALIVUS", isin: "INE03Q201024" }, metadata: { candidateCount: 2, exactIdentityMatchCount: 1, exactIdentityWithClassificationCount: 1 } })
  })

  it("keeps no exact identity distinct from ambiguous identity", () => {
    const none = matchTrendlyneClassificationCandidate([candidate({ isin: "INE000000000" })], { symbol: "ALIVUS", isin: "INE03Q201024" })
    expect(none).toMatchObject({ candidate: null, reason: "NO_EXACT_PROVIDER_IDENTITY", metadata: { candidateCount: 1, symbolMatchCount: 1, isinMatchCount: 0, exactIdentityMatchCount: 0 } })
    const ambiguous = matchTrendlyneClassificationCandidate([candidate(), candidate()], { symbol: "ALIVUS", isin: "INE03Q201024" })
    expect(ambiguous).toMatchObject({ candidate: null, reason: "AMBIGUOUS_PROVIDER_IDENTITY", metadata: { exactIdentityMatchCount: 2 } })
  })

  it("rejects an exact identity that lacks sector or industry", () => {
    const result = matchTrendlyneClassificationCandidate([candidate({ industry: null })], { symbol: "ALIVUS", isin: "INE03Q201024" })
    expect(result).toMatchObject({ candidate: null, reason: "CLASSIFICATION_MISSING", metadata: { exactIdentityMatchCount: 1, exactIdentityWithClassificationCount: 0 } })
  })

  it("parses the reviewed provider table without relaxing identity fields", () => {
    const parsed = parseTrendlyneClassificationCandidates("prefix data:\nName | Symbol | BSE | ISIN | Type | Sector | Industry\nAlivus Life Sciences Limited | ALIVUS | 543473 | INE03Q201024 | stock | Healthcare | Pharmaceuticals\n__END__ suffix")
    expect(parsed).toEqual([candidate()])
  })

  it("parses compact markdown tables and JSON markdown envelopes", () => {
    const table = "| Name | Symbol | BSE | ISIN | Type | Sector | Industry |\n| --- | --- | --- | --- | --- | --- | --- |\n| Alivus Life Sciences Limited | ALIVUS | 543473 | INE03Q201024 | stock | Healthcare | Pharmaceuticals |"
    const plain = parseTrendlyneClassificationResponse(table)
    const wrapped = parseTrendlyneClassificationResponse(JSON.stringify({ markdown_data: table }))
    expect(plain).toMatchObject({ candidates: [candidate()], metadata: { parseState: "PARSED_TABLE", responseEnvelope: "PLAIN_TEXT", parsedCandidateRowCount: 1 } })
    expect(wrapped).toMatchObject({ candidates: [candidate()], metadata: { parseState: "PARSED_TABLE", responseEnvelope: "JSON_MARKDOWN_DATA", parsedCandidateRowCount: 1 } })
  })

  it("distinguishes an empty result from an unrecognized provider schema", () => {
    expect(parseTrendlyneClassificationResponse("")).toMatchObject({ candidates: [], metadata: { parseState: "EMPTY_RESULT", nonEmptyLineCount: 0 } })
    expect(parseTrendlyneClassificationResponse(JSON.stringify({ unexpected: [] }))).toMatchObject({ candidates: [], metadata: { parseState: "UNRECOGNIZED_RESPONSE", responseEnvelope: "UNSUPPORTED_JSON" } })
    expect(parseTrendlyneClassificationResponse("provider response without a table")).toMatchObject({ candidates: [], metadata: { parseState: "UNRECOGNIZED_RESPONSE", responseEnvelope: "PLAIN_TEXT", nonEmptyLineCount: 1, pipeDelimitedLineCount: 0 } })
  })

  it("treats a recognized header-only table as a valid empty candidate set", () => {
    const parsed = parseTrendlyneClassificationResponse("Name | Symbol | BSE | ISIN | Type | Sector | Industry")
    expect(parsed).toMatchObject({ candidates: [], metadata: { parseState: "PARSED_TABLE", parsedCandidateRowCount: 0 } })
  })
})
