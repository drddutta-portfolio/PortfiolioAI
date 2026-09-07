import { describe, expect, it } from "vitest"
import { PRICE_STALE_AFTER_SECONDS, priceIsStale } from "./marketDataRepository"

describe("market-data freshness policy", () => {
  it("uses a visible fifteen-minute cache boundary", () => {
    expect(PRICE_STALE_AFTER_SECONDS).toBe(900)
    const now = Date.parse("2026-09-07T05:00:00.000Z")
    expect(priceIsStale("2026-09-07T04:45:01.000Z", now)).toBe(false)
    expect(priceIsStale("2026-09-07T04:45:00.000Z", now)).toBe(true)
    expect(priceIsStale("not-a-time", now)).toBe(true)
  })
})
