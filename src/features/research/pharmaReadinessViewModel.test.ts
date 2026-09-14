import { describe, expect, it } from "vitest"
import { buildPharmaReadinessView } from "./pharmaReadinessViewModel"
import type { ResearchMetric, SecurityResearch } from "./types"

function metric(code: string, periodEnd = "2026-03-31"): ResearchMetric {
  return {
    id: `${code}-${periodEnd}`,
    code,
    label: code,
    value: "1",
    numericValue: "1",
    provider: "TRENDLYNE_MCP",
    sourceField: code,
    periodStart: null,
    periodEnd,
    periodType: "YEAR",
    scope: null,
    unit: null,
    currency: null,
    retrievedAt: "2026-09-14T00:00:00Z",
    freshUntil: "2026-12-14T00:00:00Z",
    status: "VERIFIED",
    selected: true,
  }
}

function research(sector: string | null, metrics: readonly ResearchMetric[] = []): SecurityResearch {
  return {
    securityId: "security-1",
    companyName: "Example Pharma",
    sector,
    industry: "Pharmaceuticals",
    marketCapCategory: "LARGE_CAP",
    freshUntil: null,
    state: "VERIFIED",
    metrics,
    documents: [],
  }
}

describe("buildPharmaReadinessView", () => {
  it("does not create a PHARMA view for another canonical application sector", () => {
    expect(buildPharmaReadinessView(research("Healthcare"))).toBeNull()
  })

  it("represents all 13 PHARMA_V1 parent research contracts", () => {
    const view = buildPharmaReadinessView(research("Pharma"))
    expect(view?.totalDomainCount).toBe(13)
    expect(view?.domains.map((domain) => domain.metricCode)).toEqual([
      "PHARMA_REVENUE_GROWTH_HISTORY",
      "PHARMA_OPERATING_MARGIN_HISTORY",
      "PHARMA_ROCE_HISTORY",
      "PHARMA_PAT_EPS_HISTORY",
      "PHARMA_CASH_CONVERSION_HISTORY",
      "PHARMA_BALANCE_SHEET_LEVERAGE",
      "PHARMA_REGULATORY_SITE_STATUS",
      "PHARMA_DOMESTIC_REVENUE_GROWTH",
      "PHARMA_EXPORT_US_REVENUE_GROWTH",
      "PHARMA_RND_INTENSITY",
      "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE",
      "PHARMA_OWNERSHIP_GOVERNANCE",
      "PHARMA_VALUATION_CONTEXT",
    ])
  })

  it("keeps PHARMA_V1 fail-closed after the partial/conflicting history review", () => {
    const view = buildPharmaReadinessView(research("Pharma"))
    expect(view?.profileVersion).toBe("PHARMA_V1")
    expect(view?.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(view?.validatedSourceDomains).toBe(0)
    expect(view?.normalizationReadyDomains).toBe(0)
    expect(view?.domains.find((domain) => domain.metricCode === "PHARMA_REVENUE_GROWTH_HISTORY")?.state).toBe("PENDING")
    expect(view?.domains.find((domain) => domain.metricCode === "PHARMA_OPERATING_MARGIN_HISTORY")?.state).toBe("PENDING")
    expect(view?.blockers).toContain("Revenue history")
    expect(view?.blockers).toContain("Operating margin history")
    expect(view?.blockers).toContain("Regulatory site evidence")
  })

  it("counts matched evaluable OPM periods rather than raw revenue and profit rows", () => {
    const view = buildPharmaReadinessView(research("Pharma", [
      metric("REVENUE_TTM"),
      metric("OPM_TTM"),
      metric("REVENUE_ANNUAL"),
      { ...metric("OPERATING_REVENUE_QUARTER", "2026-06-30"), periodType: "QUARTER", numericValue: "100", value: "100" },
      { ...metric("OPERATING_PROFIT_QUARTER", "2026-06-30"), periodType: "QUARTER", numericValue: "20", value: "20" },
      { ...metric("ROCE_ANNUAL"), selected: false },
    ]))
    const revenue = view?.domains.find((domain) => domain.metricCode === "PHARMA_REVENUE_GROWTH_HISTORY")
    const margin = view?.domains.find((domain) => domain.metricCode === "PHARMA_OPERATING_MARGIN_HISTORY")
    const roce = view?.domains.find((domain) => domain.metricCode === "PHARMA_ROCE_HISTORY")
    expect(revenue?.canonicalObservationCount).toBe(1)
    expect(margin?.canonicalObservationCount).toBe(1)
    expect(margin?.observationCountLabel).toBe("Matched evaluable periods")
    expect(roce?.canonicalObservationCount).toBe(0)
    expect(view?.state).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("reports five matched OPM periods for eight revenue plus six profit rows when only five periods overlap", () => {
    const revenuePeriods = ["2026-06-30", "2026-03-31", "2025-12-31", "2025-09-30", "2025-06-30", "2025-03-31", "2024-12-31", "2024-09-30"]
    const profitPeriods = ["2026-06-30", "2025-12-31", "2025-09-30", "2025-06-30", "2024-09-30", "2024-06-30"]
    const metrics: ResearchMetric[] = [
      ...revenuePeriods.map((periodEnd) => ({ ...metric("OPERATING_REVENUE_QUARTER", periodEnd), periodType: "QUARTER" as const, value: "100", numericValue: "100" })),
      ...profitPeriods.map((periodEnd) => ({ ...metric("OPERATING_PROFIT_QUARTER", periodEnd), periodType: "QUARTER" as const, value: "20", numericValue: "20" })),
    ]
    const view = buildPharmaReadinessView(research("Pharma", metrics))
    const margin = view?.domains.find((domain) => domain.metricCode === "PHARMA_OPERATING_MARGIN_HISTORY")
    expect(metrics).toHaveLength(14)
    expect(margin?.canonicalObservationCount).toBe(5)
    expect(margin?.minimumObservations).toBe(8)
  })

  it("shows the PHARMA mandatory history thresholds without turning snapshots into readiness", () => {
    const view = buildPharmaReadinessView(research("Pharma", [metric("REVENUE_TTM"), metric("OPM_TTM")]))
    expect(view?.domains.find((domain) => domain.metricCode === "PHARMA_REVENUE_GROWTH_HISTORY")?.minimumObservations).toBe(3)
    expect(view?.domains.find((domain) => domain.metricCode === "PHARMA_OPERATING_MARGIN_HISTORY")?.minimumObservations).toBe(8)
    expect(view?.domains.find((domain) => domain.metricCode === "PHARMA_REVENUE_GROWTH_HISTORY")?.canonicalObservationCount).toBe(0)
    expect(view?.domains.find((domain) => domain.metricCode === "PHARMA_OPERATING_MARGIN_HISTORY")?.canonicalObservationCount).toBe(0)
  })
})
