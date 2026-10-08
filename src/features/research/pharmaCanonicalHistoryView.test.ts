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
    sourceField: code,
    periodStart: null,
    periodEnd,
    periodType: code.includes("QUARTER") ? "QUARTER" : "YEAR",
    scope: "CONSOLIDATED",
    unit: "INR_CRORE",
    currency: "INR",
    retrievedAt: "2026-09-14T09:08:57.330Z",
    freshUntil: "2099-12-13T09:08:57.330Z",
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
  it("derives OPM from one compatible canonical series and preserves source lineage", () => {
    const revenue = metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "4921", { id: "revenue" })
    const profit = metric("OPERATING_PROFIT_QUARTER", "2026-06-30", "1664", { id: "profit" })
    const view = buildPharmaCanonicalHistoryView(research([
      metric("CFO_ANNUAL", "2025-03-31", "2585.11"),
      revenue,
      profit,
    ]))

    expect(view?.annualCfo).toHaveLength(1)
    expect(view?.quarterlyOpm).toEqual([{
      periodEnd: "2026-06-30",
      operatingRevenue: "4921",
      operatingProfit: "1664",
      marginPercent: "33.814265",
      revenueObservationId: revenue.id,
      profitObservationId: profit.id,
    }])
    expect(view?.unresolvedIssues).toEqual([])
    expect(view?.incompatibleOpmPeriods).toEqual([])
  })

  it("does not silently choose the newest conflicting capture", () => {
    const older = metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "100", { id: "older", retrievedAt: "2026-09-14T00:00:00Z" })
    const newer = metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "110", { id: "newer", retrievedAt: "2026-09-15T00:00:00Z" })
    const view = buildPharmaCanonicalHistoryView(research([older, newer]))

    expect(view?.quarterlyOperatingRevenue).toEqual([])
    expect(view?.unresolvedIssues).toContainEqual({
      code: "OPERATING_REVENUE_QUARTER",
      periodEnd: "2026-06-30",
      reason: "CONFLICTING_VALUES",
      observationIds: [newer.id, older.id].sort(),
    })
  })

  it("honours an explicit canonical observation decision instead of retrieval recency", () => {
    const selected = metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "100", { id: "selected", selected: true, retrievedAt: "2026-09-14T00:00:00Z" })
    const newer = metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "110", { id: "newer", retrievedAt: "2026-09-15T00:00:00Z" })
    const view = buildPharmaCanonicalHistoryView(research([selected, newer]))

    expect(view?.quarterlyOperatingRevenue.map((point) => point.value)).toEqual(["100"])
    expect(view?.unresolvedIssues).toEqual([])
  })

  it("keeps standalone and consolidated observations separate", () => {
    const view = buildPharmaCanonicalHistoryView(research([
      metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "100", { scope: "CONSOLIDATED" }),
      metric("OPERATING_PROFIT_QUARTER", "2026-06-30", "20", { scope: "STANDALONE" }),
    ]))

    expect(view?.quarterlyOpm).toEqual([])
    expect(view?.incompatibleOpmPeriods).toEqual(["2026-06-30"])
  })

  it("does not derive a margin from incompatible unit or currency semantics", () => {
    const unitMismatch = buildPharmaCanonicalHistoryView(research([
      metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "100", { unit: "INR_CRORE", currency: "INR" }),
      metric("OPERATING_PROFIT_QUARTER", "2026-06-30", "20", { unit: "INR_MILLION", currency: "INR" }),
    ]))
    const currencyMismatch = buildPharmaCanonicalHistoryView(research([
      metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "100", { currency: "INR" }),
      metric("OPERATING_PROFIT_QUARTER", "2026-06-30", "20", { currency: "USD" }),
    ]))

    expect(unitMismatch?.quarterlyOpm).toEqual([])
    expect(unitMismatch?.incompatibleOpmPeriods).toEqual(["2026-06-30"])
    expect(currencyMismatch?.quarterlyOpm).toEqual([])
    expect(currencyMismatch?.incompatibleOpmPeriods).toEqual(["2026-06-30"])
  })

  it("requires an exact matched reporting period", () => {
    const view = buildPharmaCanonicalHistoryView(research([
      metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "100"),
      metric("OPERATING_PROFIT_QUARTER", "2026-03-31", "20"),
    ]))
    expect(view?.quarterlyOpm).toEqual([])
  })

  it("keeps missing inputs and zero revenue non-evaluable", () => {
    const missing = buildPharmaCanonicalHistoryView(research([
      metric("OPERATING_PROFIT_QUARTER", "2026-06-30", "20"),
    ]))
    const zero = buildPharmaCanonicalHistoryView(research([
      metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "0"),
      metric("OPERATING_PROFIT_QUARTER", "2026-06-30", "20"),
    ]))

    expect(missing?.quarterlyOpm).toEqual([])
    expect(zero?.quarterlyOpm).toEqual([])
    expect(zero?.incompatibleOpmPeriods).toEqual(["2026-06-30"])
  })

  it("excludes non-reviewed evidence from the visible canonical series", () => {
    const view = buildPharmaCanonicalHistoryView(research([
      metric("OPERATING_REVENUE_QUARTER", "2026-06-30", "4921", { status: "PROVISIONAL" }),
      metric("OPERATING_PROFIT_QUARTER", "2026-06-30", "1664"),
    ]))
    expect(view?.quarterlyOperatingRevenue).toHaveLength(0)
    expect(view?.quarterlyOpm).toHaveLength(0)
  })
})
