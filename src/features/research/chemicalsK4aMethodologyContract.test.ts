import { describe, expect, it } from "vitest"
import {
  CHEMICALS_K4A_CONTRACT,
  resolveChemicalsK4aSubprofile,
} from "./chemicalsK4aMethodologyContract"

describe("CHEMICALS_V1 K4 Checkpoint A", () => {
  it("remains non-activating after Checkpoint A approval until Checkpoint B closes", () => {
    expect(CHEMICALS_K4A_CONTRACT.state).toBe("CHECKPOINT_A_OWNER_APPROVED_LOCKED")
    expect(CHEMICALS_K4A_CONTRACT.runtimeActivationAllowed).toBe(false)
    expect(CHEMICALS_K4A_CONTRACT.scorePersistenceEnabled).toBe(false)
    expect(CHEMICALS_K4A_CONTRACT.recommendationPersistenceEnabled).toBe(false)
  })

  it("uses Industry rather than Sector-only routing", () => {
    expect(CHEMICALS_K4A_CONTRACT.sectorOnlyRoutingAllowed).toBe(false)
    expect(CHEMICALS_K4A_CONTRACT.unknownIndustryBehavior).toBe("METHOD_NOT_AVAILABLE")
  })

  it("separates specialty, agro/fertiliser and commodity/process economics", () => {
    expect(CHEMICALS_K4A_CONTRACT.subprofiles.map((item) => item.code)).toEqual([
      "SPECIALTY_CHEMICALS",
      "AGRO_FERTILISER",
      "COMMODITY_PROCESS_CHEMICALS",
    ])
  })

  it("routes representative industry labels deterministically", () => {
    expect(resolveChemicalsK4aSubprofile("Specialty Chemicals")).toBe("SPECIALTY_CHEMICALS")
    expect(resolveChemicalsK4aSubprofile("Pesticides & Agrochemicals")).toBe("AGRO_FERTILISER")
    expect(resolveChemicalsK4aSubprofile("Commodity Chemicals")).toBe("COMMODITY_PROCESS_CHEMICALS")
    expect(resolveChemicalsK4aSubprofile(null)).toBeNull()
  })

  it("requires cycle-aware cash/return evidence", () => {
    for (const subprofile of CHEMICALS_K4A_CONTRACT.subprofiles) {
      expect(subprofile.mandatoryEvidenceFamilies.some((item) => item.includes("CFO_OR_FCF_CONVERSION"))).toBe(true)
      expect(subprofile.mandatoryEvidenceFamilies.some((item) => item.includes("ROCE_OR_ROIC"))).toBe(true)
    }
  })

  it("keeps numeric recommendation thresholds subprofile-owned and unset", () => {
    expect(CHEMICALS_K4A_CONTRACT.recommendationFramework.numericThresholdsUniversal).toBe(false)
    expect(JSON.stringify(CHEMICALS_K4A_CONTRACT)).not.toContain("coreMinScore")
    expect(JSON.stringify(CHEMICALS_K4A_CONTRACT)).not.toContain("watchMinScore")
  })
})
