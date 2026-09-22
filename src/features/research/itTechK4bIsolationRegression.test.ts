import { describe, expect, it } from "vitest"
import { AUROPHARMA_G10_2_FINAL_RESULT } from "./auropharmaG102FinalResult"
import { RESEARCH_WORKSPACE_EXTENSION_POLICY, RESEARCH_WORKSPACE_SECTION_ORDER } from "./researchWorkspaceContract"
import { sectorEngineForProfileCode } from "./sectorEngineRegistry"
import { resolveScoringProfile } from "./scoringProfileResolution"
import { TORNTPHARM_GATE_H3_READ_ONLY_RESULT } from "./torntpharmGateH3ReadOnlyScore"

describe("IT_TECH K4 Checkpoint B isolation and regression", () => {
  it("keeps IT_TECH isolated from PHARMA_V1 and BANK_NBFC", () => {
    expect(sectorEngineForProfileCode("IT_SERVICES")?.engineCode).toBe("IT_TECH")
    expect(sectorEngineForProfileCode("PHARMA")?.engineCode).toBe("PHARMA_V1")
    expect(sectorEngineForProfileCode("BANK")?.engineCode).toBe("BANK_NBFC")
  })

  it("keeps IT_TECH runtime activation blocked until Checkpoint B closure", () => {
    const resolved = resolveScoringProfile(
      "Information Technology",
      "Computers - Software & Consulting",
      null,
    )
    expect(resolved.profileCode).toBe("GENERAL")
    expect(resolved.ruleProfile).toBe("GENERAL")
    expect(resolved.profileSource).toBe("GENERAL_FALLBACK")
  })

  it("preserves the TORNTPHARM golden score", () => {
    expect(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.overallScore).toBe(75.1575)
    expect(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.profileCode).toBe("PHARMA_V1")
    expect(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.primarySubprofile).toBe("DOMESTIC_FORMULATIONS")
  })

  it("preserves AUROPHARMA fail-closed semantics", () => {
    expect(AUROPHARMA_G10_2_FINAL_RESULT.primarySubprofile).toBe("GLOBAL_GENERICS")
    expect(AUROPHARMA_G10_2_FINAL_RESULT.scoreState).toBe("SCORE_NOT_COMPUTABLE")
    expect(AUROPHARMA_G10_2_FINAL_RESULT.recommendationState).toBe("RECOMMENDATION_NOT_COMPUTABLE")
    expect(AUROPHARMA_G10_2_FINAL_RESULT.noRenormalization).toBe(true)
  })

  it("preserves the universal Research workspace shell", () => {
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.sharedPageTreeRequired).toBe(true)
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.symbolSpecificLayoutAllowed).toBe(false)
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.profileSpecificPageTreeAllowed).toBe(false)
    expect(RESEARCH_WORKSPACE_SECTION_ORDER).toContain("RESEARCH_READINESS")
    expect(RESEARCH_WORKSPACE_SECTION_ORDER).toContain("DETAILED_RESEARCH")
  })
})
