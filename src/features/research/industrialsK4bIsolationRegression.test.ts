import { describe, expect, it } from "vitest"
import { AUROPHARMA_G10_2_FINAL_RESULT } from "./auropharmaG102FinalResult"
import { RESEARCH_WORKSPACE_EXTENSION_POLICY } from "./researchWorkspaceContract"
import { sectorEngineForProfileCode } from "./sectorEngineRegistry"
import { resolveScoringProfile } from "./scoringProfileResolution"
import { TORNTPHARM_GATE_H3_READ_ONLY_RESULT } from "./torntpharmGateH3ReadOnlyScore"

describe("INDUSTRIALS K4 Checkpoint B isolation and regression", () => {
  it("keeps industrial profiles isolated from PHARMA, BANK and IT_TECH", () => {
    expect(sectorEngineForProfileCode("PROJECT_EPC")?.engineCode).toBe("INDUSTRIALS_CAPITAL_GOODS")
    expect(sectorEngineForProfileCode("PHARMA")?.engineCode).toBe("PHARMA_V1")
    expect(sectorEngineForProfileCode("BANK")?.engineCode).toBe("BANK_NBFC")
    expect(sectorEngineForProfileCode("IT_SERVICES")?.engineCode).toBe("IT_TECH")
  })

  it("keeps industrial methodology active after Checkpoint B closure", () => {
    const resolved = resolveScoringProfile("Capital Goods", "Civil Construction", null)
    expect(resolved.profileCode).toBe("INDUSTRIALS_CAPITAL_GOODS")
    expect(resolved.ruleProfile).toBeNull()
    expect(resolved.scoringExecutionState).toBe("PENDING_ADAPTER")
    expect(resolved.profileSource).toBe("SECTOR_RULE")
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

  it("preserves IT_TECH implemented status while adding Industrials", () => {
    expect(sectorEngineForProfileCode("IT_SERVICES")?.lifecycle).toBe("IMPLEMENTED")
    expect(sectorEngineForProfileCode("PROJECT_EPC")?.lifecycle).toBe("IMPLEMENTED")
  })

  it("preserves the universal Research workspace shell", () => {
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.sharedPageTreeRequired).toBe(true)
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.symbolSpecificLayoutAllowed).toBe(false)
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.profileSpecificPageTreeAllowed).toBe(false)
  })
})
