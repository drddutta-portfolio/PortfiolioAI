import { describe, expect, it } from "vitest"
import { planIncrementalHistoryWindow } from "./programAMarketHistoryPlanner"

describe("planIncrementalHistoryWindow", () => {
  it("plans a full backfill when no history exists", () => {
    expect(planIncrementalHistoryWindow({ requiredLookbackDays: 365, asOfDate: "2026-09-23", earliestStoredCandle: null, latestStoredCandle: null, overlapDays: 5 })).toMatchObject({
      mode: "FULL_BACKFILL", requestStartDate: "2025-09-23", requestEndDate: "2026-09-23", estimatedProviderCalls: 1,
    })
  })

  it("plans only the incremental interval plus reconciliation overlap", () => {
    expect(planIncrementalHistoryWindow({ requiredLookbackDays: 365, asOfDate: "2026-09-23", earliestStoredCandle: "2025-09-01", latestStoredCandle: "2026-09-18", overlapDays: 5 })).toMatchObject({
      mode: "INCREMENTAL", requestStartDate: "2026-09-13", requestEndDate: "2026-09-23", lookbackSatisfied: true,
    })
  })

  it("does not schedule a fixed refetch when the stored range is current", () => {
    expect(planIncrementalHistoryWindow({ requiredLookbackDays: 365, asOfDate: "2026-09-23", earliestStoredCandle: "2025-09-01", latestStoredCandle: "2026-09-23", overlapDays: 5 })).toMatchObject({
      mode: "NONE", requestStartDate: null, requestEndDate: null, estimatedProviderCalls: 0,
    })
  })

  it("requests the full target range when existing history lacks the required lookback", () => {
    expect(planIncrementalHistoryWindow({ requiredLookbackDays: 365, asOfDate: "2026-09-23", earliestStoredCandle: "2026-04-01", latestStoredCandle: "2026-09-20", overlapDays: 5 })).toMatchObject({
      mode: "FULL_BACKFILL", reasonCode: "LOOKBACK_GAP", requestStartDate: "2025-09-23",
    })
  })
})
