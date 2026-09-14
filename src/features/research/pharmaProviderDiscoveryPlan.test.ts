import { describe, expect, it } from "vitest"
import {
  PHARMA_HISTORY_DISCOVERY_MAX_PROVIDER_CALLS,
  PHARMA_HISTORY_DISCOVERY_REFERENCE,
  PHARMA_HISTORY_DISCOVERY_TERMS,
  PHARMA_HISTORY_DISCOVERY_VERSION,
} from "../../../supabase/functions/_shared/pharma-history-discovery"

describe("PHARMA history provider discovery plan", () => {
  it("is versioned and bounded to the reviewed pharma reference", () => {
    expect(PHARMA_HISTORY_DISCOVERY_VERSION).toBe("PHARMA_HISTORY_DISCOVERY_V1")
    expect(PHARMA_HISTORY_DISCOVERY_REFERENCE).toEqual({
      symbol: "TORNTPHARM",
      applicationSector: "Pharma",
      providerInstrumentId: "1409",
    })
  })

  it("uses a fixed maximum provider-call budget equal to the number of discovery terms", () => {
    expect(PHARMA_HISTORY_DISCOVERY_TERMS).toHaveLength(6)
    expect(PHARMA_HISTORY_DISCOVERY_MAX_PROVIDER_CALLS).toBe(PHARMA_HISTORY_DISCOVERY_TERMS.length)
    expect(PHARMA_HISTORY_DISCOVERY_MAX_PROVIDER_CALLS).toBeLessThanOrEqual(6)
  })

  it("discovers parameters only for the unresolved mandatory longitudinal domains", () => {
    expect(PHARMA_HISTORY_DISCOVERY_TERMS.map((term) => term.code)).toEqual([
      "REVENUE_HISTORY",
      "OPERATING_MARGIN_HISTORY",
      "ROCE_HISTORY",
      "PAT_EPS_HISTORY",
      "CASH_CONVERSION_HISTORY",
      "BALANCE_SHEET_LEVERAGE",
    ])
  })

  it("requires period-specific history language rather than generic growth aggregates", () => {
    for (const term of PHARMA_HISTORY_DISCOVERY_TERMS) {
      expect(term.query.length).toBeGreaterThan(20)
      expect(term.purpose.length).toBeGreaterThan(20)
    }
    expect(PHARMA_HISTORY_DISCOVERY_TERMS.find((term) => term.code === "REVENUE_HISTORY")?.query).toContain("1 year ago")
    expect(PHARMA_HISTORY_DISCOVERY_TERMS.find((term) => term.code === "OPERATING_MARGIN_HISTORY")?.query).toContain("1 quarter ago")
  })
})
