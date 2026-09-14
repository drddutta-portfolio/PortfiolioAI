import { describe, expect, it } from "vitest"
import { extractTrendlyneMarkdownData, parseTrendlyneMultiStockMarkdown } from "./pharmaStoredDiscoveryParser"

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
