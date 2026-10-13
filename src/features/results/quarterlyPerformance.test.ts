import { describe, expect, it } from "vitest"
import { assessQuarterlyPerformance } from "./quarterlyPerformance"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

const fact = (code: string, value: string, selected = true): ResultsSourceObservation => ({
  id: code, securityId: "a", code, value, selected,
  periodEnd: "2026-06-30", unit: "PERCENT", scope: "STANDALONE",
  publishedAt: "2026-07-04T00:00:00Z", retrievedAt: "2026-07-10T00:00:00Z", source: "COMPANY_EXCHANGE_FILING",
})

describe("quarterly operating performance independent of V1-4", () => {
  const advances = fact("ADVANCES_GROWTH_YOY", "15.4")
  const deposits = fact("DEPOSITS_GROWTH_YOY", "14.7")
  it("requires selected observations, not provider availability", () => {
    expect(assessQuarterlyPerformance([advances, { ...deposits, selected: false }], "Private Banks").status).toBe("INSUFFICIENT_DATA")
  })
  it("provides limited positive directional banking signal with scope and period", () => {
    expect(assessQuarterlyPerformance([advances, deposits], "Private Banks").status).toBe("IMPROVING")
  })
  it("does not grade unproven non-bank quarterly growth", () => {
    expect(assessQuarterlyPerformance([advances, deposits], "IT Services").status).toBe("INSUFFICIENT_DATA")
  })
  it("blocks unknown accounting scope", () => {
    expect(assessQuarterlyPerformance([advances, { ...deposits, scope: "UNKNOWN" }], "Banks").status).toBe("INSUFFICIENT_DATA")
  })
  it("classifies conflicting signs as mixed activity, not a recommendation", () => {
    expect(assessQuarterlyPerformance([advances, { ...deposits, value: "-2" }], "Banks").status).toBe("MIXED")
  })
})
