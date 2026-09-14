import { describe, expect, it } from "vitest"
import {
  PHARMA_HISTORY_DISCOVERY_MAX_PROVIDER_CALLS,
  PHARMA_HISTORY_DISCOVERY_REFERENCE,
  PHARMA_HISTORY_DISCOVERY_TERMS,
  PHARMA_HISTORY_DISCOVERY_VERSION,
} from "../../../supabase/functions/_shared/pharma-history-discovery"

describe("PHARMA history provider discovery plan", () => {
  it("is versioned and bounded to the reviewed pharma reference", () => {
    expect(PHARMA_HISTORY_DISCOVERY_VERSION).toBe("PHARMA_HISTORY_DISCOVERY_V2")
    expect(PHARMA_HISTORY_DISCOVERY_REFERENCE).toEqual({
      symbol: "TORNTPHARM",
      applicationSector: "Pharma",
      providerInstrumentId: "1409",
    })
  })

  it("uses the validated three-call Trendlyne value-discovery contract", () => {
    expect(PHARMA_HISTORY_DISCOVERY_TERMS).toHaveLength(3)
    expect(PHARMA_HISTORY_DISCOVERY_MAX_PROVIDER_CALLS).toBe(PHARMA_HISTORY_DISCOVERY_TERMS.length)
    expect(PHARMA_HISTORY_DISCOVERY_MAX_PROVIDER_CALLS).toBe(3)
  })

  it("covers earnings/ROCE, quarter margin inputs, and cash/leverage gaps", () => {
    expect(PHARMA_HISTORY_DISCOVERY_TERMS.map((term) => term.code)).toEqual([
      "EARNINGS_ROCE_HISTORY",
      "OPM_QUARTER_HISTORY",
      "CASH_LEVERAGE_HISTORY",
    ])
  })

  it("uses exact stock identity language and asks for raw period-specific inputs", () => {
    for (const term of PHARMA_HISTORY_DISCOVERY_TERMS) {
      expect(term.query).toContain("TORNTPHARM")
      expect(term.query).toContain("1409")
      expect(term.query.length).toBeGreaterThan(100)
      expect(term.purpose.length).toBeGreaterThan(40)
    }
    expect(PHARMA_HISTORY_DISCOVERY_TERMS.find((term) => term.code === "OPM_QUARTER_HISTORY")?.query).toContain("operating profit")
    expect(PHARMA_HISTORY_DISCOVERY_TERMS.find((term) => term.code === "OPM_QUARTER_HISTORY")?.query).toContain("operating revenue")
    expect(PHARMA_HISTORY_DISCOVERY_TERMS.find((term) => term.code === "CASH_LEVERAGE_HISTORY")?.query).toContain("interest coverage")
  })
})
