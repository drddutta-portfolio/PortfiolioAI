import { describe, expect, it } from "vitest"
import { needsRefresh, parseEnrichmentAction, prioritizeSecurityIds } from "./enrichment"

describe("provider-neutral enrichment orchestration", () => {
  it("prioritizes open, historical, then remaining canonical securities without duplicates", () => {
    expect(prioritizeSecurityIds(["open-a","open-b"],["open-b","sold-c"],["sold-c","other-d"])).toEqual(["open-a","open-b","sold-c","other-d"])
  })
  it("refreshes only absent, invalid, or expired cache entries", () => {
    const now = new Date("2026-09-08T10:00:00Z")
    expect(needsRefresh("2026-09-08T10:00:01Z",now)).toBe(false)
    expect(needsRefresh("2026-09-08T10:00:00Z",now)).toBe(true)
    expect(needsRefresh(null,now)).toBe(true)
  })
  it("accepts only the versioned contract actions", () => {
    expect(parseEnrichmentAction("REFRESH_FUNDAMENTALS")).toBe("REFRESH_FUNDAMENTALS")
    expect(parseEnrichmentAction("REFRESH_COHORT")).toBe("REFRESH_COHORT")
    expect(parseEnrichmentAction("REFRESH_ALL")).toBeNull()
  })
})
