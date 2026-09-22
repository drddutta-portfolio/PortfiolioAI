import { describe, expect, it } from "vitest"
import { extractTrendlyneMarkdownData, parseTrendlyneMultiStockMarkdown, parseTrendlyneStoredResults } from "./pharmaStoredDiscoveryParser"

const SAMPLE = `1409|Torrent Pharma|TORNTPHARM|500420|2026-09-11
1410|Torrent Power|TORNTPOWER|532779|2026-09-11

Operating Rev. Ann.
TORNTPHARM:13979.73
TORNTPOWER:28966.31

---

Rev. Ann. 3Y ago
TORNTPHARM:9665.29
TORNTPOWER:26075.97

---

Operating Rev. 4Q ago
TORNTPHARM:3178.00
TORNTPOWER:7906.37

---

Not Available Metric
TORNTPHARM:None
TORNTPOWER:10.00`

describe("parseTrendlyneMultiStockMarkdown", () => {
  it("retains only the exact target security from a multi-stock response", () => {
    const parsed = parseTrendlyneMultiStockMarkdown(SAMPLE, "TORNTPHARM")
    expect(parsed.conflicts).toEqual([])
    expect(parsed.values).toContainEqual({ label: "Operating Rev. Ann.", symbol: "TORNTPHARM", value: "13979.73" })
    expect(parsed.values.some((item) => item.value === "28966.31")).toBe(false)
  })

  it("preserves provider nulls as null rather than zero", () => {
    const parsed = parseTrendlyneMultiStockMarkdown(SAMPLE, "TORNTPHARM")
    expect(parsed.values.find((item) => item.label === "Not Available Metric")?.value).toBeNull()
  })

  it("fails closed on a duplicated label with conflicting values", () => {
    const parsed = parseTrendlyneMultiStockMarkdown(`Metric A\nTORNTPHARM:10\n\n---\n\nMetric A\nTORNTPHARM:11`, "TORNTPHARM")
    expect(parsed.values).toEqual([])
    expect(parsed.conflicts).toEqual(["Metric A"])
  })

  it("deduplicates an identical repeated provider value", () => {
    const parsed = parseTrendlyneMultiStockMarkdown(`Metric A\nTORNTPHARM:10.00\n\n---\n\nMetric A\nTORNTPHARM:10`, "TORNTPHARM")
    expect(parsed.conflicts).toEqual([])
    expect(parsed.values).toEqual([{ label: "Metric A", symbol: "TORNTPHARM", value: "10" }])
  })
})

describe("extractTrendlyneMarkdownData", () => {
  it("extracts markdown_data from stored JSON-string captures", () => {
    const raw = JSON.stringify({ markdown_data: SAMPLE })
    expect(extractTrendlyneMarkdownData(raw)).toBe(SAMPLE)
  })

  it("returns null for malformed captures", () => {
    expect(extractTrendlyneMarkdownData("not-json")).toBeNull()
  })
})

describe("parseTrendlyneStoredResults", () => {
  it("parses all named retained result blocks and deduplicates agreeing labels", () => {
    const payload = {
      results: {
        EARNINGS_ROCE_HISTORY: JSON.stringify({ markdown_data: `ROCE Ann. 1Y Ago %\\nTORNTPHARM:28.71\\n\\n---\\n\\nNet Profit Ann. 2Y ago\\nTORNTPHARM:1656.38` }),
        CASH_LEVERAGE_HISTORY: JSON.stringify({ markdown_data: `ROCE Ann. 1Y Ago %\\nTORNTPHARM:28.710\\n\\n---\\n\\nInterest Coverage Ratio Ann. 1Y Ago\\nTORNTPHARM:14.84` }),
      },
    }
    const parsed = parseTrendlyneStoredResults(payload, "TORNTPHARM")
    expect(parsed.parsedResultKeys).toEqual(["CASH_LEVERAGE_HISTORY", "EARNINGS_ROCE_HISTORY"])
    expect(parsed.rejectedResultKeys).toEqual([])
    expect(parsed.conflicts).toEqual([])
    expect(parsed.values).toContainEqual({ label: "ROCE Ann. 1Y Ago %", symbol: "TORNTPHARM", value: "28.71" })
    expect(parsed.values).toContainEqual({ label: "Net Profit Ann. 2Y ago", symbol: "TORNTPHARM", value: "1656.38" })
  })

  it("fails closed when two retained queries disagree on the same label", () => {
    const payload = {
      results: {
        A: JSON.stringify({ markdown_data: `Operating Profit 6Qtr Ago\\nTORNTPHARM:964` }),
        B: JSON.stringify({ markdown_data: `Operating Profit 6Qtr Ago\\nTORNTPHARM:914` }),
      },
    }
    const parsed = parseTrendlyneStoredResults(payload, "TORNTPHARM")
    expect(parsed.values.some((item) => item.label === "Operating Profit 6Qtr Ago")).toBe(false)
    expect(parsed.conflicts).toEqual(["Operating Profit 6Qtr Ago"])
  })

  it("reports malformed result blocks without making them evidence", () => {
    const parsed = parseTrendlyneStoredResults({ results: { GOOD: JSON.stringify({ markdown_data: `Metric A\\nTORNTPHARM:10` }), BAD: "not-json" } }, "TORNTPHARM")
    expect(parsed.parsedResultKeys).toEqual(["GOOD"])
    expect(parsed.rejectedResultKeys).toEqual(["BAD"])
    expect(parsed.values).toHaveLength(1)
  })
})
