import { describe, expect, it } from "vitest"
import {
  OIL_GAS_K4A_CONTRACT,
  resolveOilGasK4aSubprofile,
} from "./oilGasK4aMethodologyContract"

describe("OIL_GAS_V1 K4 Checkpoint A", () => {
  it("remains non-activating after Checkpoint A approval until Checkpoint B closes", () => {
    expect(OIL_GAS_K4A_CONTRACT.state).toBe("CHECKPOINT_A_OWNER_APPROVED_LOCKED")
    expect(OIL_GAS_K4A_CONTRACT.runtimeActivationAllowed).toBe(false)
    expect(OIL_GAS_K4A_CONTRACT.scorePersistenceEnabled).toBe(false)
    expect(OIL_GAS_K4A_CONTRACT.recommendationPersistenceEnabled).toBe(false)
  })

  it("keeps the three mandatory K1 economic curves", () => {
    expect(OIL_GAS_K4A_CONTRACT.subprofiles.map((item) => item.code)).toEqual([
      "UPSTREAM_E_AND_P",
      "MIDSTREAM_CITY_GAS",
      "INTEGRATED_REFINING_PETCHEM",
    ])
  })

  it("uses Industry rather than Sector-only routing", () => {
    expect(OIL_GAS_K4A_CONTRACT.sectorOnlyRoutingAllowed).toBe(false)
    expect(OIL_GAS_K4A_CONTRACT.unknownIndustryBehavior).toBe("METHOD_NOT_AVAILABLE")
  })

  it("routes representative Oil/Gas industries deterministically", () => {
    expect(resolveOilGasK4aSubprofile("Oil Exploration & Production")).toBe("UPSTREAM_E_AND_P")
    expect(resolveOilGasK4aSubprofile("City Gas Distribution")).toBe("MIDSTREAM_CITY_GAS")
    expect(resolveOilGasK4aSubprofile("Refineries")).toBe("INTEGRATED_REFINING_PETCHEM")
    expect(resolveOilGasK4aSubprofile(null)).toBeNull()
  })

  it("keeps RELIANCE as a mixed-business control rather than sole authority", () => {
    expect(OIL_GAS_K4A_CONTRACT.mixedBusinessControlRule)
      .toBe("RELIANCE_IS_CONTROL_NOT_SOLE_ANCHOR")
  })

  it("keeps numeric recommendation thresholds subprofile-owned and unset", () => {
    expect(OIL_GAS_K4A_CONTRACT.recommendationFramework.numericThresholdsUniversal).toBe(false)
    expect(JSON.stringify(OIL_GAS_K4A_CONTRACT)).not.toContain("coreMinScore")
    expect(JSON.stringify(OIL_GAS_K4A_CONTRACT)).not.toContain("watchMinScore")
  })
})
