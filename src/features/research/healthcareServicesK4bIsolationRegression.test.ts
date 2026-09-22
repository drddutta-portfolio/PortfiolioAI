import { describe, expect, it } from "vitest"
import { AUROPHARMA_G10_2_FINAL_RESULT } from "./auropharmaG102FinalResult"
import { RESEARCH_WORKSPACE_EXTENSION_POLICY } from "./researchWorkspaceContract"
import { sectorEngineForProfileCode } from "./sectorEngineRegistry"
import { resolveScoringProfile } from "./scoringProfileResolution"
import { TORNTPHARM_GATE_H3_READ_ONLY_RESULT } from "./torntpharmGateH3ReadOnlyScore"

describe("HEALTHCARE_SERVICES_V1 K4 Checkpoint B isolation and regression", () => {
  it("keeps hospital methodology isolated from inherited and completed K4 engines", () => {
    expect(sectorEngineForProfileCode("HOSPITAL")?.engineCode).toBe("HEALTHCARE_SERVICES_V1")
    expect(sectorEngineForProfileCode("PHARMA")?.engineCode).toBe("PHARMA_V1")
    expect(sectorEngineForProfileCode("BANK")?.engineCode).toBe("BANK_NBFC")
    expect(sectorEngineForProfileCode("IT_SERVICES")?.engineCode).toBe("IT_TECH")
    expect(sectorEngineForProfileCode("PROJECT_EPC")?.engineCode).toBe("INDUSTRIALS_CAPITAL_GOODS")
    expect(sectorEngineForProfileCode("AUTO_OEM")?.engineCode).toBe("AUTO_COMPONENTS")
    expect(sectorEngineForProfileCode("SPECIALTY_CHEMICALS")?.engineCode).toBe("CHEMICALS_V1")
  })

  it("keeps diagnostics outside the hospital engine", () => {
    expect(sectorEngineForProfileCode("DIAGNOSTICS")).toBeNull()
  })

  it("remains valid before and after Healthcare package promotion without stale lifecycle assumptions", () => {
    const engine = sectorEngineForProfileCode("HOSPITAL")
    const resolved = resolveScoringProfile("Healthcare", "Hospitals", null)
    expect(engine).not.toBeNull()

    if (engine?.lifecycle === "K4_FROZEN_PENDING") {
      expect(resolved).toMatchObject({
        profileCode: "GENERAL",
        ruleProfile: "GENERAL",
        profileSource: "GENERAL_FALLBACK",
      })
    } else {
      expect(engine?.lifecycle).toBe("IMPLEMENTED")
      expect(resolved).toMatchObject({
        profileCode: "HEALTHCARE_SERVICES_V1",
        ruleProfile: "GENERAL",
        profileSource: "SECTOR_RULE",
      })
    }
  })

  it("preserves completed K4 package lifecycle states", () => {
    expect(sectorEngineForProfileCode("IT_SERVICES")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("PROJECT_EPC")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("AUTO_OEM")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("SPECIALTY_CHEMICALS")?.lifecycle).toBe("IMPLEMENTED")
  })

  it("preserves the TORNTPHARM and AUROPHARMA golden controls", () => {
    expect(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.overallScore).toBe(75.1575)
    expect(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.profileCode).toBe("PHARMA_V1")
    expect(AUROPHARMA_G10_2_FINAL_RESULT.scoreState).toBe("SCORE_NOT_COMPUTABLE")
    expect(AUROPHARMA_G10_2_FINAL_RESULT.recommendationState).toBe("RECOMMENDATION_NOT_COMPUTABLE")
    expect(AUROPHARMA_G10_2_FINAL_RESULT.noRenormalization).toBe(true)
  })

  it("preserves the universal Research workspace shell", () => {
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.sharedPageTreeRequired).toBe(true)
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.symbolSpecificLayoutAllowed).toBe(false)
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.profileSpecificPageTreeAllowed).toBe(false)
  })
})
