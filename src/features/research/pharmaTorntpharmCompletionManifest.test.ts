import { describe, expect, it } from "vitest"
import { buildTorntpharmRetainedCompletionManifest, TORNTPHARM_V3_SOURCE_RECORD_ID } from "./pharmaTorntpharmCompletionManifest"

const block = (label: string, value: string) => `${label}\\nTORNTPHARM:${value}`
const payload = {
  results: {
    EARNINGS_ROCE_HISTORY: JSON.stringify({ markdown_data: [
      block("Net Profit Ann. 2Y ago", "1656.38"),
      block("Net Profit Ann. 3Y Ago", "1245.23"),
      block("Net Profit Ann. 4Y Ago", "777.18"),
      block("Net Profit Ann. 5Y Ago", "1251.88"),
      block("ROCE Ann. %", "9.30"),
      block("ROCE Ann. 1Y Ago %", "28.71"),
      block("Cash EPS Ann. 1Y Ago", "79.96"),
    ].join("\\n\\n---\\n\\n") }),
    CASH_LEVERAGE_HISTORY: JSON.stringify({ markdown_data: [
      block("ROCE Ann. 1Y Ago %", "28.710"),
      block("Interest Coverage Ratio Ann. 1Y Ago", "14.84"),
      block("Short Term Debt Ann. 1Y ago", "1834.34"),
      block("Cash from Investing Act. Ann. 1Y Ago", "-540.05"),
    ].join("\\n\\n---\\n\\n") }),
  },
}

describe("buildTorntpharmRetainedCompletionManifest", () => {
  it("emits only exact retained mappings with explicit periods and V3 lineage", () => {
    const manifest = buildTorntpharmRetainedCompletionManifest(payload)
    const eligible = manifest.filter((item) => item.state === "ELIGIBLE_RETAINED")
    expect(eligible).toHaveLength(8)
    expect(eligible).toContainEqual(expect.objectContaining({
      metricCode: "NET_PROFIT_ANNUAL", periodEnd: "2024-03-31", value: "1656.38", sourceRecordId: TORNTPHARM_V3_SOURCE_RECORD_ID,
    }))
    expect(eligible).toContainEqual(expect.objectContaining({ metricCode: "ROCE_ANNUAL", periodEnd: "2026-03-31", value: "9.3" }))
    expect(eligible).toContainEqual(expect.objectContaining({ metricCode: "INTEREST_COVERAGE_ANNUAL", periodEnd: "2025-03-31", value: "14.84" }))
  })

  it("never promotes Cash EPS to diluted EPS or investing cash flow to capex", () => {
    const manifest = buildTorntpharmRetainedCompletionManifest(payload)
    const eligible = manifest.filter((item) => item.state === "ELIGIBLE_RETAINED")
    expect(eligible.some((item) => item.metricCode === "EPS_DILUTED_ANNUAL")).toBe(false)
    expect(eligible.some((item) => item.metricCode === "CAPEX_ANNUAL")).toBe(false)
    expect(manifest).toContainEqual(expect.objectContaining({ state: "BLOCKED_SEMANTIC", metricCode: "EPS_DILUTED_ANNUAL" }))
    expect(manifest).toContainEqual(expect.objectContaining({ state: "BLOCKED_SEMANTIC", metricCode: "CAPEX_ANNUAL" }))
  })

  it("does not treat short-term debt as total debt", () => {
    const manifest = buildTorntpharmRetainedCompletionManifest(payload)
    const eligible = manifest.filter((item) => item.state === "ELIGIBLE_RETAINED")
    expect(eligible).toContainEqual(expect.objectContaining({ metricCode: "SHORT_TERM_DEBT_ANNUAL", value: "1834.34" }))
    expect(eligible.some((item) => item.metricCode === "TOTAL_DEBT_ANNUAL")).toBe(false)
  })

  it("fails closed when a cross-query exact-label value conflicts", () => {
    const conflicting = {
      results: {
        A: JSON.stringify({ markdown_data: block("ROCE Ann. 1Y Ago %", "28.71") }),
        B: JSON.stringify({ markdown_data: block("ROCE Ann. 1Y Ago %", "27.10") }),
      },
    }
    const eligible = buildTorntpharmRetainedCompletionManifest(conflicting).filter((item) => item.state === "ELIGIBLE_RETAINED")
    expect(eligible.some((item) => item.providerLabel === "ROCE Ann. 1Y Ago %")).toBe(false)
  })

  it("keeps official and Angel One gaps explicit instead of manufacturing completeness", () => {
    const manifest = buildTorntpharmRetainedCompletionManifest(payload)
    expect(manifest.some((item) => item.state === "OFFICIAL_SOURCE_REQUIRED" && item.domain === "Business durability")).toBe(true)
    expect(manifest.some((item) => item.state === "OFFICIAL_SOURCE_REQUIRED" && item.domain === "Regulatory & manufacturing-site risk")).toBe(true)
    expect(manifest.some((item) => item.state === "MARKET_SOURCE_REQUIRED" && item.domain === "Momentum / market risk")).toBe(true)
  })
})
