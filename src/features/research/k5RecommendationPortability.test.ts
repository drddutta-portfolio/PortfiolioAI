import { describe, expect, it } from "vitest"
import { AUROPHARMA_G10_2_FINAL_RESULT } from "./auropharmaG102FinalResult"
import {
  K5_RECOMMENDATION_PORTABILITY_STUDY,
  K5_UNIVERSAL_RESEARCH_SHELL,
} from "./k5CrossSectorValidation"
import {
  RESEARCH_WORKSPACE_EXTENSION_POLICY,
  RESEARCH_WORKSPACE_SECTION_ORDER,
} from "./researchWorkspaceContract"
import { SECTOR_ENGINE_REGISTRY, UNIVERSAL_SECTOR_ENGINE_SEMANTICS } from "./sectorEngineRegistry"
import { TORNTPHARM_GATE_H3_READ_ONLY_RESULT } from "./torntpharmGateH3ReadOnlyScore"

describe("Gate K5 universal shell and recommendation portability study", () => {
  it("preserves one universal Research workspace for every engine", () => {
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.sharedPageTreeRequired).toBe(true)
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.symbolSpecificLayoutAllowed).toBe(false)
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.profileSpecificPageTreeAllowed).toBe(false)
    expect(RESEARCH_WORKSPACE_SECTION_ORDER).toContain("RESEARCH_READINESS")
    expect(RESEARCH_WORKSPACE_SECTION_ORDER).toContain("RESEARCH_NAVIGATION")
    expect(K5_UNIVERSAL_RESEARCH_SHELL).toEqual([
      "Overview",
      "Financials",
      "Quality & Growth",
      "Ownership",
      "Valuation",
      "Documents",
      "Evidence",
      "Readiness",
      "Recommendation",
      "Research Health",
    ])
  })

  it("confirms portable recommendation semantics without assuming portable numeric thresholds", () => {
    expect(K5_RECOMMENDATION_PORTABILITY_STUDY.numericThresholdPortability).toBe("NOT_ESTABLISHED")
    expect(K5_RECOMMENDATION_PORTABILITY_STUDY.decision)
      .toBe("DO_NOT_INTRODUCE_UNIVERSAL_NUMERIC_THRESHOLDS")
    expect(K5_RECOMMENDATION_PORTABILITY_STUDY.ownerApprovalRequiredForNumericPolicy).toBe(true)

    expect(UNIVERSAL_SECTOR_ENGINE_SEMANTICS.missingMandatoryEvidence)
      .toBe("SCORE_NOT_COMPUTABLE")
    expect(UNIVERSAL_SECTOR_ENGINE_SEMANTICS.missingRecommendationFloorData)
      .toBe("INSUFFICIENT")
    expect(UNIVERSAL_SECTOR_ENGINE_SEMANTICS.scoreReconstructionFromIncompleteMandatoryInputs)
      .toBe(false)
    expect(UNIVERSAL_SECTOR_ENGINE_SEMANTICS.recommendationComputationWrites).toBe(false)
  })

  it("keeps numeric thresholds out of the universal engine registry", () => {
    const serialized = JSON.stringify(SECTOR_ENGINE_REGISTRY)
    expect(serialized).not.toContain("coreMinScore")
    expect(serialized).not.toContain("satelliteMinScore")
    expect(serialized).not.toContain("watchMinScore")
  })

  it("pre-declares the required falsification tests before any numeric portability claim", () => {
    expect(K5_RECOMMENDATION_PORTABILITY_STUDY.falsificationTests).toEqual([
      "MATERIALLY_DIFFERENT_SCORE_DISTRIBUTIONS_BY_SECTOR",
      "NA_DIMENSIONS_INVALIDATE_SHARED_FLOOR",
      "SAME_NUMERIC_FLOOR_YIELDS_ECONOMICALLY_INCONSISTENT_OUTCOMES",
      "SECTOR_SPECIFIC_RISKS_REQUIRE_DIFFERENT_BLOCKERS",
      "VALUATION_SCORE_DISTRIBUTIONS_DIFFER_BY_BUSINESS_MODEL",
    ])
  })

  it("preserves the established Pharma golden controls", () => {
    expect(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.overallScore).toBe(75.1575)
    expect(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.profileCode).toBe("PHARMA_V1")
    expect(AUROPHARMA_G10_2_FINAL_RESULT.scoreState).toBe("SCORE_NOT_COMPUTABLE")
    expect(AUROPHARMA_G10_2_FINAL_RESULT.recommendationState)
      .toBe("RECOMMENDATION_NOT_COMPUTABLE")
    expect(AUROPHARMA_G10_2_FINAL_RESULT.noRenormalization).toBe(true)
  })
})
