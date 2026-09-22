import { describe, expect, it } from "vitest"
import {
  INDUSTRIALS_K4A_CONTRACT,
  resolveIndustrialsK4aSubprofile,
} from "./industrialsK4aMethodologyContract"

describe("INDUSTRIALS_CAPITAL_GOODS K4 Checkpoint A", () => {
  it("remains non-activating after Checkpoint A approval until Checkpoint B closes", () => {
    expect(INDUSTRIALS_K4A_CONTRACT.state).toBe("CHECKPOINT_A_OWNER_APPROVED_LOCKED")
    expect(INDUSTRIALS_K4A_CONTRACT.runtimeActivationAllowed).toBe(false)
    expect(INDUSTRIALS_K4A_CONTRACT.scorePersistenceEnabled).toBe(false)
    expect(INDUSTRIALS_K4A_CONTRACT.recommendationPersistenceEnabled).toBe(false)
  })

  it("uses Industry rather than Sector-only routing", () => {
    expect(INDUSTRIALS_K4A_CONTRACT.sectorOnlyRoutingAllowed).toBe(false)
    expect(INDUSTRIALS_K4A_CONTRACT.unknownIndustryBehavior).toBe("METHOD_NOT_AVAILABLE")
  })

  it("separates EPC, capital equipment and defence economics", () => {
    expect(INDUSTRIALS_K4A_CONTRACT.subprofiles.map((item) => item.code)).toEqual([
      "PROJECT_EPC",
      "CAPITAL_EQUIPMENT_ELECTRICAL",
      "DEFENCE_AEROSPACE",
    ])
  })

  it("routes representative industry labels deterministically", () => {
    expect(resolveIndustrialsK4aSubprofile("Civil Construction")).toBe("PROJECT_EPC")
    expect(resolveIndustrialsK4aSubprofile("Heavy Electrical Equipment")).toBe("CAPITAL_EQUIPMENT_ELECTRICAL")
    expect(resolveIndustrialsK4aSubprofile("Aerospace & Defence")).toBe("DEFENCE_AEROSPACE")
    expect(resolveIndustrialsK4aSubprofile(null)).toBeNull()
  })

  it("makes working-capital/cash-conversion evidence mandatory where appropriate", () => {
    const epc = INDUSTRIALS_K4A_CONTRACT.subprofiles.find((item) => item.code === "PROJECT_EPC")!
    const equipment = INDUSTRIALS_K4A_CONTRACT.subprofiles.find((item) => item.code === "CAPITAL_EQUIPMENT_ELECTRICAL")!
    expect(epc.mandatoryEvidenceFamilies).toContain("WORKING_CAPITAL_DAYS")
    expect(equipment.mandatoryEvidenceFamilies).toContain("WORKING_CAPITAL_DAYS")
  })

  it("does not define universal numeric recommendation thresholds", () => {
    expect(INDUSTRIALS_K4A_CONTRACT.recommendationFramework.numericThresholdsUniversal).toBe(false)
    expect(JSON.stringify(INDUSTRIALS_K4A_CONTRACT)).not.toContain("coreMinScore")
    expect(JSON.stringify(INDUSTRIALS_K4A_CONTRACT)).not.toContain("watchMinScore")
  })
})
