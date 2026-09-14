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

  it("keeps PHARMA_V1 fail-closed while exposing the reviewed normalization-ready domains", () => {
    const view = buildPharmaReadinessView(research("Pharma"))
    expect(view?.profileVersion).toBe("PHARMA_V1")
    expect(view?.normalizationVersion).toBe("PHARMA_HISTORY_NORMALIZATION_V1")
    expect(view?.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(view?.validatedSourceDomains).toBe(2)
    expect(view?.normalizationReadyDomains).toBe(2)
    expect(view?.domains.find((domain) => domain.metricCode === "PHARMA_REVENUE_GROWTH_HISTORY")?.state).toBe("NORMALIZATION_READY")
    expect(view?.domains.find((domain) => domain.metricCode === "PHARMA_OPERATING_MARGIN_HISTORY")?.state).toBe("NORMALIZATION_READY")
    expect(view?.blockers).toContain("ROCE history")
    expect(view?.blockers).toContain("Regulatory site evidence")
  })

  it("counts only canonical selected research observations, never raw provider discovery", () => {
    const view = buildPharmaReadinessView(research("Pharma", [
      metric("REVENUE_TTM"),
      metric("OPM_TTM"),
      { ...metric("ROCE_ANNUAL"), selected: false },
    ]))
    const revenue = view?.domains.find((domain) => domain.metricCode === "PHARMA_REVENUE_GROWTH_HISTORY")
    const margin = view?.domains.find((domain) => domain.metricCode === "PHARMA_OPERATING_MARGIN_HISTORY")
    const roce = view?.domains.find((domain) => domain.metricCode === "PHARMA_ROCE_HISTORY")
    expect(revenue?.canonicalObservationCount).toBe(1)
    expect(margin?.canonicalObservationCount).toBe(1)
    expect(roce?.canonicalObservationCount).toBe(0)
    expect(view?.state).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("shows the PHARMA mandatory history thresholds without turning snapshots into readiness", () => {
    const view = buildPharmaReadinessView(research("Pharma", [metric("REVENUE_TTM"), metric("OPM_TTM")]))
    expect(view?.domains.find((domain) => domain.metricCode === "PHARMA_REVENUE_GROWTH_HISTORY")?.minimumObservations).toBe(3)
    expect(view?.domains.find((domain) => domain.metricCode === "PHARMA_OPERATING_MARGIN_HISTORY")?.minimumObservations).toBe(8)
    expect(view?.state).toBe("INSUFFICIENT_EVIDENCE")
  })
})
