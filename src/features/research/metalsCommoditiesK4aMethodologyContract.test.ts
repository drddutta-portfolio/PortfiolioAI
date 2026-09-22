import { describe, expect, it } from "vitest"
import {
  METALS_COMMODITIES_K4A_CONTRACT,
  resolveMetalsCommoditiesK4aSubprofile,
} from "./metalsCommoditiesK4aMethodologyContract"

describe("METALS_COMMODITIES K4 Checkpoint A", () => {
  it("remains non-activating until owner approval", () => {
    expect(METALS_COMMODITIES_K4A_CONTRACT.state).toBe("CHECKPOINT_A_OWNER_APPROVAL_REQUIRED")
    expect(METALS_COMMODITIES_K4A_CONTRACT.runtimeActivationAllowed).toBe(false)
    expect(METALS_COMMODITIES_K4A_CONTRACT.scorePersistenceEnabled).toBe(false)
    expect(METALS_COMMODITIES_K4A_CONTRACT.recommendationPersistenceEnabled).toBe(false)
  })

  it("proves steel and non-ferrous require separate curves", () => {
    expect(METALS_COMMODITIES_K4A_CONTRACT.subprofiles.map((item) => item.code)).toEqual([
      "STEEL_FERROUS",
      "NON_FERROUS_DIVERSIFIED_METALS",
    ])
  })

  it("requires Industry and commodity exposure metadata", () => {
    expect(METALS_COMMODITIES_K4A_CONTRACT.sectorOnlyRoutingAllowed).toBe(false)
    expect(METALS_COMMODITIES_K4A_CONTRACT.commodityExposureMetadataRequired).toBe(true)
  })

  it("routes representative metal industries deterministically", () => {
    expect(resolveMetalsCommoditiesK4aSubprofile("Iron & Steel")).toBe("STEEL_FERROUS")
    expect(resolveMetalsCommoditiesK4aSubprofile("Diversified Metals")).toBe("NON_FERROUS_DIVERSIFIED_METALS")
    expect(resolveMetalsCommoditiesK4aSubprofile("Minerals & Mining")).toBe("NON_FERROUS_DIVERSIFIED_METALS")
    expect(resolveMetalsCommoditiesK4aSubprofile(null)).toBeNull()
  })

  it("prohibits spot P/E as the sole valuation anchor", () => {
    expect(METALS_COMMODITIES_K4A_CONTRACT.spotPeSoleAnchorAllowed).toBe(false)
    for (const subprofile of METALS_COMMODITIES_K4A_CONTRACT.subprofiles) {
      expect(subprofile.valuationMethods).toContain("EV_EBITDA_NORMALIZED")
      expect(subprofile.valuationMethods).toContain("ROCE_THROUGH_CYCLE")
    }
  })

  it("keeps numeric recommendation thresholds subprofile-owned and unset", () => {
    expect(METALS_COMMODITIES_K4A_CONTRACT.recommendationFramework.numericThresholdsUniversal)
      .toBe(false)
    expect(JSON.stringify(METALS_COMMODITIES_K4A_CONTRACT)).not.toContain("coreMinScore")
    expect(JSON.stringify(METALS_COMMODITIES_K4A_CONTRACT)).not.toContain("watchMinScore")
  })
})
