import { describe, expect, it } from "vitest"
import { buildPharmaCanonicalHistoryView } from "./pharmaCanonicalHistoryView"
import type { ResearchMetric, SecurityResearch } from "./types"

function metric(code: string, periodEnd: string, value: string, status: ResearchMetric["status"] = "VERIFIED"): ResearchMetric {
  return {
    id: `${code}:${periodEnd}:${value}`,
    code,
    label: code,
    value,
    numericValue: value,
    provider: "TRENDLYNE_MCP",
    sourceField: null,
    periodStart: null,
    periodEnd,
    periodType: code.includes("QUARTER") ? "QUARTER" : "YEAR",
    scope: "UNKNOWN",
    unit: "Cr",
    currency: "INR",
    retrievedAt: "2026-09-14T09:08:57.330Z",
    freshUntil: "2026-12-13T09:08:57.330Z",
    status,
    selected: false,
  }
}

function research(metrics: readonly ResearchMetric[]): SecurityResearch {
  return {
    securityId: "security",
    companyName: "TORNTPHARM",
    sector: "Pharma",
    industry: "Pharmaceuticals",
    marketCapCategory: "LARGE_CAP",
    freshUntil: null,
    state: "VERIFIED",
    metrics,
    documents: [],
  }
}

describe("buildPharmaCanonicalHistoryView", () => {
  it("shows reviewed canonical history even when no decision row selected it", () => {
    const view = buildPharmaCanonicalHistoryView(research([
      metric("CFO_ANNUAL", "2025-03-31", "2585.11"),
      metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "4921"),
      metric("OPERATING_PROFIT_QUARTER", "2026-06-30", "1664"),
    ]))

    expect(view?.annualCfo).toHaveLength(1)
    expect(view?.quarterlyOpm).toEqual([{
      periodEnd: "2026-06-30",
      operatingRevenue: "4921",
      operatingProfit: "1664",
      marginPercent: "33.81",
    }])
  })

  it("excludes non-verified evidence from the visible canonical series", () => {
    const view = buildPharmaCanonicalHistoryView(research([
      metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "4921", "PROVISIONAL"),
      metric("OPERATING_PROFIT_QUARTER", "2026-06-30", "1664"),
    ]))
    expect(view?.quarterlyOperatingRevenue).toHaveLength(0)
    expect(view?.quarterlyOpm).toHaveLength(0)
  })
})
