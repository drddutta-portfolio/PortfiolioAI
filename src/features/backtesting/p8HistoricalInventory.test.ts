import { describe, expect, it } from "vitest"
import { P8_HISTORICAL_INVENTORY, summarizeP8HistoricalInventory } from "./p8HistoricalInventory"

describe("P8-A historical inventory", () => {
  it("covers every required historical data domain", () => {
    expect(P8_HISTORICAL_INVENTORY.domains.map((domain) => domain.code)).toEqual([
      "DAILY_PRICES", "CORPORATE_ACTIONS", "BENCHMARKS", "FUNDAMENTALS", "DOCUMENTS",
      "CANONICAL_SNAPSHOTS", "UNIVERSE", "CLASSIFICATION", "DECISION_RUNS",
    ])
  })

  it("keeps the experiment gate closed while required domains are blocked", () => {
    expect(summarizeP8HistoricalInventory()).toEqual({ usable: 0, partial: 2, blocked: 7 })
    expect(P8_HISTORICAL_INVENTORY.p8BReady).toBe(false)
    expect(P8_HISTORICAL_INVENTORY.performanceBacktestAuthorized).toBe(false)
  })

  it("does not describe the current portfolio as a historical universe", () => {
    const universe = P8_HISTORICAL_INVENTORY.domains.find((domain) => domain.code === "UNIVERSE")
    expect(universe?.state).toBe("BLOCKED")
    expect(universe?.finding).toContain("inactive/delisted")
  })
})
