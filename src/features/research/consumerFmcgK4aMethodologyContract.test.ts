import { describe, expect, it } from "vitest"
import {
  CONSUMER_FMCG_K4A_CONTRACT,
  resolveConsumerFmcgK4aSubprofile,
} from "./consumerFmcgK4aMethodologyContract"

describe("CONSUMER_FMCG K4 Checkpoint A", () => {
  it("remains non-activating after Checkpoint A approval until Checkpoint B closes", () => {
    expect(CONSUMER_FMCG_K4A_CONTRACT.state).toBe("CHECKPOINT_A_OWNER_APPROVED_LOCKED")
    expect(CONSUMER_FMCG_K4A_CONTRACT.runtimeActivationAllowed).toBe(false)
    expect(CONSUMER_FMCG_K4A_CONTRACT.scorePersistenceEnabled).toBe(false)
    expect(CONSUMER_FMCG_K4A_CONTRACT.recommendationPersistenceEnabled).toBe(false)
  })

  it("keeps one initial branded-consumer curve per K1 rather than inventing category subprofiles", () => {
    expect(CONSUMER_FMCG_K4A_CONTRACT.subprofiles.map((item) => item.code)).toEqual([
      "BRANDED_CONSUMER_FMCG",
    ])
  })

  it("requires Industry and product-category metadata", () => {
    expect(CONSUMER_FMCG_K4A_CONTRACT.sectorOnlyRoutingAllowed).toBe(false)
    expect(CONSUMER_FMCG_K4A_CONTRACT.productCategoryMetadataRequired).toBe(true)
  })

  it("treats alcohol as explicit risk metadata rather than a separate universal score curve", () => {
    expect(CONSUMER_FMCG_K4A_CONTRACT.alcoholVariantIsSeparateScoreCurve).toBe(false)
    expect(resolveConsumerFmcgK4aSubprofile("Distilleries & Breweries")).toBe("BRANDED_CONSUMER_FMCG")
  })

  it("routes representative consumer industries deterministically", () => {
    expect(resolveConsumerFmcgK4aSubprofile("Personal Care / Household Products")).toBe("BRANDED_CONSUMER_FMCG")
    expect(resolveConsumerFmcgK4aSubprofile("Packaged Foods")).toBe("BRANDED_CONSUMER_FMCG")
    expect(resolveConsumerFmcgK4aSubprofile("Tea & Coffee")).toBe("BRANDED_CONSUMER_FMCG")
    expect(resolveConsumerFmcgK4aSubprofile(null)).toBeNull()
  })

  it("keeps numeric recommendation thresholds profile-owned and unset", () => {
    expect(CONSUMER_FMCG_K4A_CONTRACT.recommendationFramework.numericThresholdsUniversal).toBe(false)
    expect(JSON.stringify(CONSUMER_FMCG_K4A_CONTRACT)).not.toContain("coreMinScore")
    expect(JSON.stringify(CONSUMER_FMCG_K4A_CONTRACT)).not.toContain("watchMinScore")
  })
})
