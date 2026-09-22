import { describe, expect, it } from "vitest"
import {
  AUTO_COMPONENTS_K4A_CONTRACT,
  resolveAutoK4aSubprofile,
} from "./autoComponentsK4aMethodologyContract"

describe("AUTO_COMPONENTS K4 Checkpoint A", () => {
  it("remains non-activating until owner approval", () => {
    expect(AUTO_COMPONENTS_K4A_CONTRACT.state).toBe("CHECKPOINT_A_OWNER_APPROVAL_REQUIRED")
    expect(AUTO_COMPONENTS_K4A_CONTRACT.runtimeActivationAllowed).toBe(false)
    expect(AUTO_COMPONENTS_K4A_CONTRACT.scorePersistenceEnabled).toBe(false)
    expect(AUTO_COMPONENTS_K4A_CONTRACT.recommendationPersistenceEnabled).toBe(false)
  })

  it("uses Industry rather than Sector-only routing", () => {
    expect(AUTO_COMPONENTS_K4A_CONTRACT.sectorOnlyRoutingAllowed).toBe(false)
    expect(AUTO_COMPONENTS_K4A_CONTRACT.unknownIndustryBehavior).toBe("METHOD_NOT_AVAILABLE")
  })

  it("separates OEM and component economics without creating an EV-only scoring engine", () => {
    expect(AUTO_COMPONENTS_K4A_CONTRACT.subprofiles.map((item) => item.code)).toEqual([
      "AUTO_OEM",
      "AUTO_COMPONENTS",
    ])
    expect(AUTO_COMPONENTS_K4A_CONTRACT.evTransitionTreatment)
      .toBe("EXPOSURE_AND_RISK_METADATA_NOT_SEPARATE_SCORE")
  })

  it("routes representative industry labels deterministically", () => {
    expect(resolveAutoK4aSubprofile("Cars & Utility Vehicles")).toBe("AUTO_OEM")
    expect(resolveAutoK4aSubprofile("2/3 Wheelers")).toBe("AUTO_OEM")
    expect(resolveAutoK4aSubprofile("Auto Parts & Equipment")).toBe("AUTO_COMPONENTS")
    expect(resolveAutoK4aSubprofile(null)).toBeNull()
  })

  it("requires cash conversion and cycle-aware capital efficiency", () => {
    for (const subprofile of AUTO_COMPONENTS_K4A_CONTRACT.subprofiles) {
      expect(subprofile.mandatoryEvidenceFamilies).toContain("CFO_OR_FCF_CONVERSION")
      expect(subprofile.mandatoryEvidenceFamilies).toContain("ROCE_OR_ROIC")
    }
  })

  it("keeps numeric recommendation thresholds subprofile-owned and unset", () => {
    expect(AUTO_COMPONENTS_K4A_CONTRACT.recommendationFramework.numericThresholdsUniversal).toBe(false)
    expect(JSON.stringify(AUTO_COMPONENTS_K4A_CONTRACT)).not.toContain("coreMinScore")
    expect(JSON.stringify(AUTO_COMPONENTS_K4A_CONTRACT)).not.toContain("watchMinScore")
  })
})
