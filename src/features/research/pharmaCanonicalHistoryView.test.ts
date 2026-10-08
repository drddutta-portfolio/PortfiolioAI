import { describe, expect, it } from "vitest"
import { buildPharmaCanonicalHistoryView } from "./pharmaCanonicalHistoryView"
import type { ResearchMetric, SecurityResearch } from "./types"

function metric(
  code: string,
  periodEnd: string,
  value: string,
  overrides: Partial<ResearchMetric> = {},
): ResearchMetric {
  return {
    id: `${code}:${periodEnd}:${value}:${overrides.id ?? "default"}`,
    code,
    label: code,
    value,
    numericValue: value,
    provider: "TRENDLYNE_MCP",
    sourceField: null,
    periodStart: code.includes("QUARTER") ? "2026-04-01" : "2025-04-01",
    periodEnd,
    periodType: code.includes("QUARTER") ? "QUARTER" : "YEAR",
    scope: "CONSOLIDATED",
    unit: "Cr",
    currency: "INR",
    retrievedAt: "2026-09-14T09:08:57.330Z",
    freshUntil: "2026-12-13T09:08:57.330Z",
    status: "VERIFIED",
    selected: false,
    ...overrides,
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
  it("derives margin from semantically matched verified canonical evidence", () => {
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
      marginPercent: "33.81426539321276163381426539321276163381",
    }])
  })

  it("uses an explicit canonical observation decision rather than newest-capture heuristics", () => {
    const view = buildPharmaCanonicalHistoryView(research([
      metric("REVENUE_ANNUAL", "2025-03-31", "100", { id: "selected", selected: true, retrievedAt: "2026-01-01T00:00:00Z" }),
      metric("REVENUE_ANNUAL", "2025-03-31", "120", { id: "newer", status: "CONFLICTING", retrievedAt: "2026-02-01T00:00:00Z" }),
    ]))
    expect(view?.annualRevenue).toEqual([{ periodEnd: "2025-03-31", value: "100" }])
  })

  it("does not silently select the newest conflicting capture", () => {
    const view = buildPharmaCanonicalHistoryView(research([
      metric("REVENUE_ANNUAL", "2025-03-31", "100", { id: "older" }),
      metric("REVENUE_ANNUAL", "2025-03-31", "120", { id: "newer", retrievedAt: "2026-10-01T00:00:00Z" }),
    ]))
    expect(view?.annualRevenue).toEqual([])
    expect(view?.unresolvedPeriods.annualRevenue).toEqual(["2025-03-31"])
  })

  it("collapses only semantically identical duplicate captures", () => {
    const view = buildPharmaCanonicalHistoryView(research([
      metric("CFO_ANNUAL", "2025-03-31", "100", { id: "a" }),
      metric("CFO_ANNUAL", "2025-03-31", "100", { id: "b", retrievedAt: "2026-09-15T00:00:00Z" }),
    ]))
    expect(view?.annualCfo).toEqual([{ periodEnd: "2025-03-31", value: "100" }])
    expect(view?.unresolvedPeriods.annualCfo).toEqual([])
  })

  it.each([
    ["scope", { scope: "STANDALONE" }],
    ["unit", { unit: "Mn" }],
    ["currency", { currency: "USD" }],
    ["period start", { periodStart: "2026-01-01" }],
    ["period type", { periodType: "TTM" }],
    ["provider", { provider: "ISSUER_ANNUAL_REPORT" }],
  ] as const)("does not derive margin from incompatible %s semantics", (_label, profitOverrides) => {
    const view = buildPharmaCanonicalHistoryView(research([
      metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "100"),
      metric("OPERATING_PROFIT_QUARTER", "2026-06-30", "20", profitOverrides),
    ]))
    expect(view?.quarterlyOpm).toEqual([])
    expect(view?.unresolvedPeriods.quarterlyOpm).toEqual(["2026-06-30"])
  })

  it("preserves missing inputs as missing rather than deriving a margin", () => {
    const view = buildPharmaCanonicalHistoryView(research([
      metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "100"),
    ]))
    expect(view?.quarterlyOpm).toEqual([])
  })

  it("fails closed on zero revenue", () => {
    const view = buildPharmaCanonicalHistoryView(research([
      metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "0"),
      metric("OPERATING_PROFIT_QUARTER", "2026-06-30", "20"),
    ]))
    expect(view?.quarterlyOpm).toEqual([])
    expect(view?.unresolvedPeriods.quarterlyOpm).toEqual(["2026-06-30"])
  })

  it("excludes non-verified evidence from the visible canonical series", () => {
    const view = buildPharmaCanonicalHistoryView(research([
      metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "4921", { status: "PROVISIONAL" }),
      metric("OPERATING_PROFIT_QUARTER", "2026-06-30", "1664"),
    ]))
    expect(view?.quarterlyOperatingRevenue).toHaveLength(0)
    expect(view?.quarterlyOpm).toHaveLength(0)
  })
})
