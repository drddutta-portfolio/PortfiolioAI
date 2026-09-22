import { describe, expect, it } from "vitest"
import { IT_TECH_K4A_CONTRACT, resolveItTechK4aSubprofile } from "./itTechK4aMethodologyContract"

describe("IT_TECH K4 Checkpoint A methodology contract", () => {
  it("remains non-activating after Checkpoint A approval until Checkpoint B closes", () => {
    expect(IT_TECH_K4A_CONTRACT.state).toBe("CHECKPOINT_A_OWNER_APPROVED_LOCKED")
    expect(IT_TECH_K4A_CONTRACT.runtimeActivationAllowed).toBe(false)
    expect(IT_TECH_K4A_CONTRACT.scorePersistenceEnabled).toBe(false)
    expect(IT_TECH_K4A_CONTRACT.recommendationPersistenceEnabled).toBe(false)
  })

  it("uses Industry rather than Sector-only routing", () => {
    expect(IT_TECH_K4A_CONTRACT.sectorOnlyRoutingAllowed).toBe(false)
    expect(IT_TECH_K4A_CONTRACT.unknownIndustryBehavior).toBe("METHOD_NOT_AVAILABLE")
  })

  it("separates services, products/platforms and digital infrastructure economics", () => {
    expect(IT_TECH_K4A_CONTRACT.subprofiles.map((item) => item.code)).toEqual([
      "IT_SERVICES",
      "SOFTWARE_PRODUCTS_PLATFORMS",
      "DIGITAL_INFRA_HARDWARE",
    ])
  })

  it("routes known classification labels deterministically", () => {
    expect(resolveItTechK4aSubprofile("Computers - Software & Consulting")).toBe("IT_SERVICES")
    expect(resolveItTechK4aSubprofile("IT Software Products")).toBe("SOFTWARE_PRODUCTS_PLATFORMS")
    expect(resolveItTechK4aSubprofile("Computer Hardware")).toBe("DIGITAL_INFRA_HARDWARE")
    expect(resolveItTechK4aSubprofile(null)).toBeNull()
  })

  it("does not share one valuation family across incompatible subprofiles", () => {
    const services = IT_TECH_K4A_CONTRACT.subprofiles.find((item) => item.code === "IT_SERVICES")!
    const products = IT_TECH_K4A_CONTRACT.subprofiles.find((item) => item.code === "SOFTWARE_PRODUCTS_PLATFORMS")!
    const infra = IT_TECH_K4A_CONTRACT.subprofiles.find((item) => item.code === "DIGITAL_INFRA_HARDWARE")!
    expect(services.valuationMethods).toContain("PE_SELF_HISTORY")
    expect(products.valuationMethods).toContain("EV_SALES_WHEN_PROFITABILITY_IMMATURE")
    expect(infra.valuationMethods).toContain("EV_EBITDA")
  })

  it("keeps recommendation numeric thresholds subprofile-owned and unset at Checkpoint A", () => {
    expect(IT_TECH_K4A_CONTRACT.recommendationFramework.numericThresholdsUniversal).toBe(false)
    expect(JSON.stringify(IT_TECH_K4A_CONTRACT)).not.toContain("coreMinScore")
    expect(JSON.stringify(IT_TECH_K4A_CONTRACT)).not.toContain("watchMinScore")
  })
})
