import { describe, expect, it } from "vitest"
import {
  FIN_SERVICES_NON_LENDER_K4A_CONTRACT,
  resolveFinServicesNonLenderK4aSubprofile,
} from "./finServicesNonLenderK4aMethodologyContract"

describe("FIN_SERVICES_NON_LENDER K4 Checkpoint A", () => {
  it("remains non-activating until owner approval", () => {
    expect(FIN_SERVICES_NON_LENDER_K4A_CONTRACT.state)
      .toBe("CHECKPOINT_A_OWNER_APPROVAL_REQUIRED")
    expect(FIN_SERVICES_NON_LENDER_K4A_CONTRACT.runtimeActivationAllowed).toBe(false)
    expect(FIN_SERVICES_NON_LENDER_K4A_CONTRACT.scorePersistenceEnabled).toBe(false)
    expect(FIN_SERVICES_NON_LENDER_K4A_CONTRACT.recommendationPersistenceEnabled).toBe(false)
  })

  it("prohibits lender-method inheritance and sector-only routing", () => {
    expect(FIN_SERVICES_NON_LENDER_K4A_CONTRACT.lenderInheritanceAllowed).toBe(false)
    expect(FIN_SERVICES_NON_LENDER_K4A_CONTRACT.sectorOnlyRoutingAllowed).toBe(false)
  })

  it("separates capital-markets/AMC, insurance and fintech/platform economics", () => {
    expect(FIN_SERVICES_NON_LENDER_K4A_CONTRACT.subprofiles.map((item) => item.code)).toEqual([
      "CAPITAL_MARKETS_AMC",
      "INSURANCE",
      "FINTECH_PLATFORM",
    ])
  })

  it("routes representative industry labels deterministically", () => {
    expect(resolveFinServicesNonLenderK4aSubprofile("Asset Management Company"))
      .toBe("CAPITAL_MARKETS_AMC")
    expect(resolveFinServicesNonLenderK4aSubprofile("Health Insurance"))
      .toBe("INSURANCE")
    expect(resolveFinServicesNonLenderK4aSubprofile("Fintech / Insurance Brokerage & Platform"))
      .toBe("FINTECH_PLATFORM")
    expect(resolveFinServicesNonLenderK4aSubprofile(null)).toBeNull()
  })

  it("keeps lender metrics out of the non-lender contract", () => {
    const serialized = JSON.stringify(FIN_SERVICES_NON_LENDER_K4A_CONTRACT)
    expect(serialized).not.toContain("NPA")
    expect(serialized).not.toContain("CET1")
    expect(serialized).not.toContain("DEPOSIT_GROWTH")
  })

  it("keeps numeric recommendation thresholds subprofile-owned and unset", () => {
    expect(FIN_SERVICES_NON_LENDER_K4A_CONTRACT.recommendationFramework.numericThresholdsUniversal)
      .toBe(false)
    expect(JSON.stringify(FIN_SERVICES_NON_LENDER_K4A_CONTRACT)).not.toContain("coreMinScore")
    expect(JSON.stringify(FIN_SERVICES_NON_LENDER_K4A_CONTRACT)).not.toContain("watchMinScore")
  })
})
