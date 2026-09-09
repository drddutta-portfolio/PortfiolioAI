import { describe, expect, it } from "vitest"
import { evidenceStatus, latestByCode, metricLabel } from "./researchPolicy"
import type { ResearchMetric } from "./types"
import { loadSecurityResearch } from "../../data/researchRepository"

const metric = (overrides: Partial<ResearchMetric> = {}): ResearchMetric => ({
  id: "m1", code: "REVENUE_TTM", label: "Revenue (TTM)", value: null, numericValue: null,
  provider: "TRENDLYNE_MCP", sourceField: "REVENUE_TTM", periodStart: null, periodEnd: "2026-06-30",
  periodType: "TTM", scope: "CONSOLIDATED", unit: "INR", currency: "INR", retrievedAt: "2026-09-09T00:00:00Z",
  freshUntil: "2099-09-09T00:00:00Z", status: "PROVISIONAL", selected: false, ...overrides,
})

describe("research evidence policy", () => {
  it("keeps unavailable values null instead of converting them to zero", () => {
    expect(metric().value).toBeNull()
    expect(metric().numericValue).toBeNull()
  })
  it("keeps provider adjusted P/B distinct and conflicting", () => {
    expect(metricLabel("PBV_ADJUSTED_PROVIDER")).toBe("Provider Adjusted P/B")
    expect(evidenceStatus("CONFLICTING", "2099-01-01T00:00:00Z")).toBe("CONFLICTING")
  })
  it("retains the latest stored reporting period without synthesizing history", () => {
    const older = metric({ id: "old", periodEnd: "2026-03-31" })
    const latest = metric({ id: "new", periodEnd: "2026-06-30" })
    expect(latestByCode([older, latest]).get("REVENUE_TTM")?.periodEnd).toBe("2026-06-30")
  })
  it("keeps the cache repository free of provider, refresh, run, and budget operations", () => {
    const implementation = loadSecurityResearch.toString()
    expect(implementation).not.toMatch(/functions\.invoke|refresh-security-enrichment|provider_usage|reserve_provider|data_ingestion_run/iu)
  })
})
