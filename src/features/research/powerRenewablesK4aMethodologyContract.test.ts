import { describe, expect, it } from "vitest"
import {
  POWER_RENEWABLES_K4A_CONTRACT,
  resolvePowerRenewablesK4aSubprofile,
} from "./powerRenewablesK4aMethodologyContract"

describe("POWER_RENEWABLES_V1 K4 Checkpoint A", () => {
  it("remains non-activating after Checkpoint A approval until Checkpoint B closes", () => {
    expect(POWER_RENEWABLES_K4A_CONTRACT.state).toBe("CHECKPOINT_A_OWNER_APPROVED_LOCKED")
    expect(POWER_RENEWABLES_K4A_CONTRACT.runtimeActivationAllowed).toBe(false)
    expect(POWER_RENEWABLES_K4A_CONTRACT.scorePersistenceEnabled).toBe(false)
    expect(POWER_RENEWABLES_K4A_CONTRACT.recommendationPersistenceEnabled).toBe(false)
  })

  it("keeps the three mandatory K1 economic curves", () => {
    expect(POWER_RENEWABLES_K4A_CONTRACT.subprofiles.map((item) => item.code)).toEqual([
      "REGULATED_NETWORK",
      "GENERATION_INTEGRATED_UTILITY",
      "RENEWABLE_IPP",
    ])
  })

  it("uses Industry rather than Sector-only routing", () => {
    expect(POWER_RENEWABLES_K4A_CONTRACT.sectorOnlyRoutingAllowed).toBe(false)
    expect(POWER_RENEWABLES_K4A_CONTRACT.unknownIndustryBehavior).toBe("METHOD_NOT_AVAILABLE")
  })

  it("routes representative Power industries deterministically", () => {
    expect(resolvePowerRenewablesK4aSubprofile("Power Transmission")).toBe("REGULATED_NETWORK")
    expect(resolvePowerRenewablesK4aSubprofile("Hydro Power")).toBe("GENERATION_INTEGRATED_UTILITY")
    expect(resolvePowerRenewablesK4aSubprofile("Renewable Energy")).toBe("RENEWABLE_IPP")
    expect(resolvePowerRenewablesK4aSubprofile(null)).toBeNull()
  })

  it("keeps leverage/offtaker/grid risk explicit", () => {
    const renewable = POWER_RENEWABLES_K4A_CONTRACT.subprofiles.find((x) => x.code === "RENEWABLE_IPP")
    expect(renewable?.majorRisks).toContain("DISCOM_OR_OFFTAKER_CREDIT")
    expect(renewable?.majorRisks).toContain("CURTAILMENT_AND_GRID_EVACUATION")
    expect(renewable?.majorRisks).toContain("INTEREST_RATES_AND_REFINANCING")
  })

  it("keeps numeric recommendation thresholds subprofile-owned and unset", () => {
    expect(POWER_RENEWABLES_K4A_CONTRACT.recommendationFramework.numericThresholdsUniversal).toBe(false)
    expect(JSON.stringify(POWER_RENEWABLES_K4A_CONTRACT)).not.toContain("coreMinScore")
    expect(JSON.stringify(POWER_RENEWABLES_K4A_CONTRACT)).not.toContain("watchMinScore")
  })
})
