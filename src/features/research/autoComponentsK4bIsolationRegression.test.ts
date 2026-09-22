import { describe, expect, it } from "vitest"
import { AUROPHARMA_G10_2_FINAL_RESULT } from "./auropharmaG102FinalResult"
import { RESEARCH_WORKSPACE_EXTENSION_POLICY } from "./researchWorkspaceContract"
import { sectorEngineForProfileCode } from "./sectorEngineRegistry"
import { resolveScoringProfile } from "./scoringProfileResolution"
import { TORNTPHARM_GATE_H3_READ_ONLY_RESULT } from "./torntpharmGateH3ReadOnlyScore"

describe("AUTO_COMPONENTS K4 Checkpoint B isolation and regression", () => {
  it("keeps AUTO isolated from PHARMA, BANK, IT_TECH and INDUSTRIALS", () => {
    expect(sectorEngineForProfileCode("AUTO_OEM")?.engineCode).toBe("AUTO_COMPONENTS")
    expect(sectorEngineForProfileCode("AUTO_COMPONENTS")?.engineCode).toBe("AUTO_COMPONENTS")
    expect(sectorEngineForProfileCode("PHARMA")?.engineCode).toBe("PHARMA_V1")
    expect(sectorEngineForProfileCode("BANK")?.engineCode).toBe("BANK_NBFC")
    expect(sectorEngineForProfileCode("IT_SERVICES")?.engineCode).toBe("IT_TECH")
    expect(sectorEngineForProfileCode("PROJECT_EPC")?.engineCode).toBe("INDUSTRIALS_CAPITAL_GOODS")
  })

  it("keeps AUTO runtime scoring blocked until Checkpoint B closure", () => {
    const resolved = resolveScoringProfile(
      "Automobile and Auto Components",
      "Cars & Utility Vehicles",
      null,
    )
    expect(resolved.profileCode).toBe("GENERAL")
    expect(resolved.ruleProfile).toBe("GENERAL")
    expect(resolved.profileSource).toBe("GENERAL_FALLBACK")
  })

  it("preserves the TORNTPHARM golden score", () => {
    expect(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.overallScore).toBe(75.1575)
    expect(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.profileCode).toBe("PHARMA_V1")
  })

  it("preserves AUROPHARMA fail-closed semantics", () => {
    expect(AUROPHARMA_G10_2_FINAL_RESULT.scoreState).toBe("SCORE_NOT_COMPUTABLE")
    expect(AUROPHARMA_G10_2_FINAL_RESULT.recommendationState).toBe("RECOMMENDATION_NOT_COMPUTABLE")
    expect(AUROPHARMA_G10_2_FINAL_RESULT.noRenormalization).toBe(true)
  })

  it("preserves completed K4 engines while adding AUTO", () => {
    expect(sectorEngineForProfileCode("IT_SERVICES")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("PROJECT_EPC")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("AUTO_OEM")?.lifecycle).toBe("K4_FROZEN_PENDING")
  })

  it("preserves the universal Research workspace shell", () => {
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.sharedPageTreeRequired).toBe(true)
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.symbolSpecificLayoutAllowed).toBe(false)
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.profileSpecificPageTreeAllowed).toBe(false)
  })
})
