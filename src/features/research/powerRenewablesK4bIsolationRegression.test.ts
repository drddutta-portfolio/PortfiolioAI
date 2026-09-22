import { describe, expect, it } from "vitest"
import { AUROPHARMA_G10_2_FINAL_RESULT } from "./auropharmaG102FinalResult"
import { RESEARCH_WORKSPACE_EXTENSION_POLICY } from "./researchWorkspaceContract"
import { sectorEngineForProfileCode } from "./sectorEngineRegistry"
import { resolveScoringProfile } from "./scoringProfileResolution"
import { TORNTPHARM_GATE_H3_READ_ONLY_RESULT } from "./torntpharmGateH3ReadOnlyScore"

describe("POWER_RENEWABLES_V1 K4 Checkpoint B isolation and regression", () => {
  it("keeps Power/Renewables isolated from inherited and prior K4 engines", () => {
    expect(sectorEngineForProfileCode("REGULATED_NETWORK")?.engineCode).toBe("POWER_RENEWABLES_V1")
    expect(sectorEngineForProfileCode("GENERATION_INTEGRATED_UTILITY")?.engineCode).toBe("POWER_RENEWABLES_V1")
    expect(sectorEngineForProfileCode("RENEWABLE_IPP")?.engineCode).toBe("POWER_RENEWABLES_V1")
    expect(sectorEngineForProfileCode("PHARMA")?.engineCode).toBe("PHARMA_V1")
    expect(sectorEngineForProfileCode("BANK")?.engineCode).toBe("BANK_NBFC")
    expect(sectorEngineForProfileCode("UPSTREAM_E_AND_P")?.engineCode).toBe("OIL_GAS_V1")
  })

  it("remains valid before and after Power/Renewables promotion without stale lifecycle assertions", () => {
    const engine = sectorEngineForProfileCode("REGULATED_NETWORK")
    const resolved = resolveScoringProfile("Power", "Power Transmission", null)
    expect(engine).not.toBeNull()

    if (engine?.lifecycle === "K4_FROZEN_PENDING") {
      expect(resolved).toMatchObject({
        profileCode: null,
        ruleProfile: null,
        profileSource: "METHODOLOGY_UNAVAILABLE",
        methodologyState: "METHODOLOGY_NOT_AVAILABLE",
      })
    } else {
      expect(engine?.lifecycle).toBe("IMPLEMENTED")
      expect(resolved).toMatchObject({
        profileCode: "POWER_RENEWABLES_V1",
        ruleProfile: null,
        profileSource: "SECTOR_RULE",
        scoringExecutionState: "PENDING_ADAPTER",
      })
    }
  })

  it("preserves every previously completed K4 engine as IMPLEMENTED", () => {
    expect(sectorEngineForProfileCode("IT_SERVICES")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("PROJECT_EPC")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("AUTO_OEM")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("SPECIALTY_CHEMICALS")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("HOSPITAL")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("CAPITAL_MARKETS_AMC")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("STEEL_FERROUS")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("BRANDED_CONSUMER_FMCG")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("UPSTREAM_E_AND_P")?.lifecycle).toBe("IMPLEMENTED")
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
