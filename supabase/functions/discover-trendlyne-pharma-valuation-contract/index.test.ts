import { describe, expect, it } from "vitest"
import {
  PHARMA_VALUATION_DISCOVERY_MAX_PROVIDER_CALLS,
  PHARMA_VALUATION_DISCOVERY_METRIC_QUERY,
  PHARMA_VALUATION_DISCOVERY_PEERS,
} from "../_shared/pharma-valuation-discovery"

describe("Pharma valuation discovery contract", () => {
  it("locks the approved three-peer identity set", () => {
    expect(PHARMA_VALUATION_DISCOVERY_PEERS.map((peer) => peer.symbol))
      .toEqual(["MANKIND", "ERIS", "EMCURE"])
  })

  it("uses one valuation contract query after three identity queries", () => {
    expect(PHARMA_VALUATION_DISCOVERY_MAX_PROVIDER_CALLS).toBe(4)
    expect(PHARMA_VALUATION_DISCOVERY_METRIC_QUERY).toContain("TORNTPHARM")
    expect(PHARMA_VALUATION_DISCOVERY_METRIC_QUERY).toContain("MANKIND")
    expect(PHARMA_VALUATION_DISCOVERY_METRIC_QUERY).toContain("ERIS")
    expect(PHARMA_VALUATION_DISCOVERY_METRIC_QUERY).toContain("EMCURE")
    expect(PHARMA_VALUATION_DISCOVERY_METRIC_QUERY).toContain("EV/EBITDA")
  })
})
