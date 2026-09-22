import { describe, expect, it } from "vitest"
import {
  HEALTHCARE_SERVICES_K4A_CONTRACT,
  resolveHealthcareServicesK4aSubprofile,
} from "./healthcareServicesK4aMethodologyContract"

describe("HEALTHCARE_SERVICES_V1 K4 Checkpoint A", () => {
  it("remains non-activating after Checkpoint A approval until Checkpoint B closes", () => {
    expect(HEALTHCARE_SERVICES_K4A_CONTRACT.state).toBe("CHECKPOINT_A_OWNER_APPROVED_LOCKED")
    expect(HEALTHCARE_SERVICES_K4A_CONTRACT.runtimeActivationAllowed).toBe(false)
    expect(HEALTHCARE_SERVICES_K4A_CONTRACT.scorePersistenceEnabled).toBe(false)
    expect(HEALTHCARE_SERVICES_K4A_CONTRACT.recommendationPersistenceEnabled).toBe(false)
  })

  it("uses Industry rather than Sector-only routing", () => {
    expect(HEALTHCARE_SERVICES_K4A_CONTRACT.sectorOnlyRoutingAllowed).toBe(false)
    expect(HEALTHCARE_SERVICES_K4A_CONTRACT.unknownIndustryBehavior).toBe("METHOD_NOT_AVAILABLE")
  })

  it("starts with hospital operators only and explicitly excludes diagnostics", () => {
    expect(HEALTHCARE_SERVICES_K4A_CONTRACT.subprofiles.map((item) => item.code)).toEqual([
      "HOSPITAL_OPERATORS",
    ])
    expect(HEALTHCARE_SERVICES_K4A_CONTRACT.diagnosticsIncluded).toBe(false)
    expect(HEALTHCARE_SERVICES_K4A_CONTRACT.diagnosticsBehavior)
      .toBe("REVIEW_REQUIRED_SEPARATE_METHODOLOGY")
  })

  it("routes hospital industry labels deterministically", () => {
    expect(resolveHealthcareServicesK4aSubprofile("Hospitals")).toBe("HOSPITAL_OPERATORS")
    expect(resolveHealthcareServicesK4aSubprofile("Hospital & Healthcare Services")).toBe("HOSPITAL_OPERATORS")
    expect(resolveHealthcareServicesK4aSubprofile("Diagnostics")).toBeNull()
    expect(resolveHealthcareServicesK4aSubprofile(null)).toBeNull()
  })

  it("requires hospital operating metrics and bed-ramp evidence", () => {
    const hospital = HEALTHCARE_SERVICES_K4A_CONTRACT.subprofiles[0]
    expect(hospital.mandatoryEvidenceFamilies).toContain("OCCUPANCY_WHEN_DISCLOSED")
    expect(hospital.mandatoryEvidenceFamilies).toContain("ARPOB_OR_EQUIVALENT_WHEN_DISCLOSED")
    expect(hospital.mandatoryEvidenceFamilies).toContain("BED_CAPACITY_AND_RAMP")
  })

  it("keeps numeric recommendation thresholds subprofile-owned and unset", () => {
    expect(HEALTHCARE_SERVICES_K4A_CONTRACT.recommendationFramework.numericThresholdsUniversal).toBe(false)
    expect(JSON.stringify(HEALTHCARE_SERVICES_K4A_CONTRACT)).not.toContain("coreMinScore")
    expect(JSON.stringify(HEALTHCARE_SERVICES_K4A_CONTRACT)).not.toContain("watchMinScore")
  })
})
