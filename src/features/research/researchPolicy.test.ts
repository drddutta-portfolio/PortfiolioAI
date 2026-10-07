import { describe, expect, it, vi } from "vitest"
import { evidenceStatus, latestByCode, metricLabel, formatSourceResearchMetric } from "./researchPolicy"
import type { ResearchMetric } from "./types"
import { loadSecurityResearch } from "../../data/researchRepository"

// The repository boundary assertion inspects code; it never executes a query.
vi.mock("../../lib/supabase", () => ({ supabase: {} }))

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
    expect(evidenceStatus("CONFLICTING", "2099-01-01T00:00:00Z", false, true)).toBe("CONFLICTING")
  })
  it("shows fresh available evidence as verified when its metric contract is reviewed", () => {
    expect(evidenceStatus("AVAILABLE", "2099-01-01T00:00:00Z", false, true)).toBe("VERIFIED")
  })
  it("keeps fresh available evidence provisional while its metric contract is not reviewed", () => {
    expect(evidenceStatus("AVAILABLE", "2099-01-01T00:00:00Z", false, false)).toBe("PROVISIONAL")
  })
  it("keeps stale precedence even for a reviewed metric contract", () => {
    expect(evidenceStatus("AVAILABLE", "2000-01-01T00:00:00Z", false, true)).toBe("STALE")
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
  it("rejects contradictory currency and nonnumeric source values without formatting NaN", () => {
    expect(formatSourceResearchMetric(metric({ value: "1000", unit: "INR_CRORE", currency: "USD" }))).toBe("Unit / currency conflict")
    expect(formatSourceResearchMetric(metric({ value: "pending", unit: "INR" }))).toBe("Value unavailable")
    expect(formatSourceResearchMetric(metric({ value: "Infinity", unit: "PERCENT" }))).toBe("Value unavailable")
  })
  it("does not guess currency for provider crore magnitudes", () => {
    expect(formatSourceResearchMetric(metric({ value: "1111989.2", unit: "Cr.", currency: null }))).toBe("Unit / currency unproven")
    expect(formatSourceResearchMetric(metric({ value: "13.8", unit: null }))).toBe("Unit unavailable")
    expect(formatSourceResearchMetric(metric({ value: "0", unit: "PERCENT" }))).toBe("0%")
    expect(formatSourceResearchMetric(metric({ value: "1000", unit: "INR_CRORE", currency: "INR" }))).toBe("₹1,000 Cr")
  })

})
