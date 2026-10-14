import { describe, expect, it } from "vitest"
import type { ResultsSourceObservation } from "./resultsSourceRepository"
import { displayQuarterEvidence } from "./quarterlyPresentation"

function fact(code: string, scope: string, selected: boolean, value: string): ResultsSourceObservation {
  return { id: code + scope, securityId: "a", code, scope, selected, value,
    periodEnd: "2026-06-30", unit: "INR_CRORE", source: "COMPANY_EXCHANGE_FILING",
    publishedAt: null, retrievedAt: "2026-10-14T00:00:00Z" }
}
describe("R4 same-scope quarterly presentation", () => {
  it("does not mix selected Consolidated values with Standalone", () => {
    const rows = [fact("OPERATING_REVENUE_QUARTER","STANDALONE",true,"99"),
      fact("NET_PROFIT_QUARTER","CONSOLIDATED",true,"4"),
      fact("OPERATING_REVENUE_QUARTER","CONSOLIDATED",true,"10")]
    const displayed = displayQuarterEvidence(rows)
    expect(displayed).toHaveLength(2)
    expect(displayed.every((r) => r.scope === "CONSOLIDATED")).toBe(true)
    expect(displayed.find((r) => r.code === "OPERATING_REVENUE_QUARTER")?.value).toBe("10")
  })
  it("does not duplicate unselected source versions", () => {
    expect(displayQuarterEvidence([fact("EPS_DILUTED","STANDALONE",false,"1"),
      fact("EPS_DILUTED","STANDALONE",false,"1")])).toHaveLength(1)
  })
})
