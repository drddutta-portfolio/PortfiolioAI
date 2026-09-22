import { describe, expect, it } from "vitest"
import { AUROPHARMA_G10_2_FINAL_RESULT } from "./auropharmaG102FinalResult"
import { RESEARCH_WORKSPACE_EXTENSION_POLICY } from "./researchWorkspaceContract"
import { sectorEngineForProfileCode } from "./sectorEngineRegistry"
import { resolveScoringProfile } from "./scoringProfileResolution"
import { TORNTPHARM_GATE_H3_READ_ONLY_RESULT } from "./torntpharmGateH3ReadOnlyScore"

describe("METALS_COMMODITIES K4 Checkpoint B isolation and regression", () => {
  it("keeps Metals isolated from inherited and completed K4 engines", () => {
    expect(sectorEngineForProfileCode("STEEL_FERROUS")?.engineCode).toBe("METALS_COMMODITIES")
    expect(sectorEngineForProfileCode("NON_FERROUS_DIVERSIFIED_METALS")?.engineCode).toBe("METALS_COMMODITIES")
    expect(sectorEngineForProfileCode("PHARMA")?.engineCode).toBe("PHARMA_V1")
    expect(sectorEngineForProfileCode("BANK")?.engineCode).toBe("BANK_NBFC")
    expect(sectorEngineForProfileCode("FINTECH_PLATFORM")?.engineCode).toBe("FIN_SERVICES_NON_LENDER")
  })

  it("remains valid before and after Metals promotion without stale lifecycle assertions", () => {
    const engine = sectorEngineForProfileCode("STEEL_FERROUS")
    const resolved = resolveScoringProfile("Metals & Mining", "Iron & Steel", null)
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
        profileCode: "METALS_COMMODITIES",
        ruleProfile: "GENERAL",
        profileSource: "SECTOR_RULE",
      })
    }
  })

  it("preserves all previously completed K4 engines as IMPLEMENTED", () => {
    expect(sectorEngineForProfileCode("IT_SERVICES")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("PROJECT_EPC")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("AUTO_OEM")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("SPECIALTY_CHEMICALS")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("HOSPITAL")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("CAPITAL_MARKETS_AMC")?.lifecycle).toBe("IMPLEMENTED")
  })

  it("preserves TORNTPHARM and AUROPHARMA golden controls", () => {
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
