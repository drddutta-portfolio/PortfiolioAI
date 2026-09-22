import { describe, expect, it } from "vitest"
import {
  K_FINAL_SAFETY_BOUNDARY,
  buildKFinalPortfolioCoverageMatrix,
} from "./kFinalPortfolioCoverage"
import {
  K5_FUTURE_STOCK_ROUTING_FIXTURES,
  k5PairwiseEngineIsolationMatrix,
  resolveK5PortfolioMethodState,
} from "./k5CrossSectorValidation"
import { K5_CURRENT_PORTFOLIO_ROUTING_ROWS } from "./k5CurrentPortfolioRoutingSnapshot"
import {
  RESEARCH_WORKSPACE_EXTENSION_POLICY,
  RESEARCH_WORKSPACE_SECTION_ORDER,
} from "./researchWorkspaceContract"
import { SECTOR_ENGINE_REGISTRY, UNIVERSAL_SECTOR_ENGINE_SEMANTICS } from "./sectorEngineRegistry"
import { TORNTPHARM_GATE_H3_READ_ONLY_RESULT } from "./torntpharmGateH3ReadOnlyScore"
import { AUROPHARMA_G10_2_FINAL_RESULT } from "./auropharmaG102FinalResult"

describe("Gate K-FINAL portfolio sector-coverage closure", () => {
  it("produces one explicit architecture row for every frozen current holding", () => {
    const matrix = buildKFinalPortfolioCoverageMatrix()
    expect(matrix).toHaveLength(K5_CURRENT_PORTFOLIO_ROUTING_ROWS.length)
    expect(matrix).toHaveLength(238)

    for (const row of matrix) {
      expect([
        "ARCHITECTURE_READY",
        "METHODOLOGY_NOT_AVAILABLE",
        "REVIEW_REQUIRED",
        "NOT_APPLICABLE",
      ]).toContain(row.methodStatus)

      if (row.methodStatus === "ARCHITECTURE_READY") {
        expect(row.engineCode).not.toBeNull()
        expect(row.profileCode).not.toBeNull()
        expect(row.scoreState).toBe("EVIDENCE_DEPENDENT")
        expect(row.recommendationState).toBe("POLICY_AND_EVIDENCE_DEPENDENT")
      }

      if (row.methodStatus === "METHODOLOGY_NOT_AVAILABLE") {
        expect(row.scoreState).toBe("SCORE_NOT_COMPUTABLE")
        expect(row.recommendationState).toBe("RECOMMENDATION_NOT_COMPUTABLE")
      }

      if (row.methodStatus === "REVIEW_REQUIRED") {
        expect(row.scoreState).toBe("REVIEW_REQUIRED")
        expect(row.recommendationState).toBe("REVIEW_REQUIRED")
      }
    }
  })

  it("keeps supported future stocks portable without ticker-specific methodology", () => {
    for (const fixture of K5_FUTURE_STOCK_ROUTING_FIXTURES) {
      expect(resolveK5PortfolioMethodState({
        assetClass: "EQUITY",
        sector: fixture.sector,
        industry: fixture.industry,
      })).toMatchObject({
        state: "SUPPORTED_ENGINE",
        engineCode: fixture.engineCode,
        profileCode: fixture.profileCode,
      })
    }

    expect(SECTOR_ENGINE_REGISTRY.every((entry) => entry.runtimeSymbolSpecific === false)).toBe(true)
  })

  it("preserves complete cross-sector isolation and fail-closed fallback", () => {
    const matrix = k5PairwiseEngineIsolationMatrix()
    expect(matrix).toHaveLength(SECTOR_ENGINE_REGISTRY.length * (SECTOR_ENGINE_REGISTRY.length - 1))

    for (const pair of matrix) {
      expect(pair.foreignProfilesResolvableBySource).toEqual([])
      expect(pair.sourceFallbackPolicy).toBe("NONE_FAIL_CLOSED")
    }
  })

  it("preserves universal Research workspace continuity", () => {
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.sharedPageTreeRequired).toBe(true)
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.symbolSpecificLayoutAllowed).toBe(false)
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.profileSpecificPageTreeAllowed).toBe(false)
    expect(RESEARCH_WORKSPACE_SECTION_ORDER).toContain("RESEARCH_READINESS")
    expect(RESEARCH_WORKSPACE_SECTION_ORDER).toContain("DETAILED_RESEARCH")
  })

  it("preserves missing vs N/A and recommendation safety semantics", () => {
    expect(UNIVERSAL_SECTOR_ENGINE_SEMANTICS.missingMandatoryEvidence).toBe("SCORE_NOT_COMPUTABLE")
    expect(UNIVERSAL_SECTOR_ENGINE_SEMANTICS.missingRecommendationFloorData).toBe("INSUFFICIENT")
    expect(UNIVERSAL_SECTOR_ENGINE_SEMANTICS.scoreReconstructionFromIncompleteMandatoryInputs).toBe(false)
    expect(UNIVERSAL_SECTOR_ENGINE_SEMANTICS.recommendationComputationWrites).toBe(false)

    const bank = SECTOR_ENGINE_REGISTRY.find((entry) => entry.engineCode === "BANK_NBFC")
    expect(bank?.notApplicableDimensions).toContain("CASH_FLOW")
    expect(bank?.allowedDimensions).not.toContain("CASH_FLOW")
  })

  it("preserves golden control outputs", () => {
    expect(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.overallScore).toBe(75.1575)
    expect(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.profileCode).toBe("PHARMA_V1")
    expect(AUROPHARMA_G10_2_FINAL_RESULT.scoreState).toBe("SCORE_NOT_COMPUTABLE")
    expect(AUROPHARMA_G10_2_FINAL_RESULT.recommendationState).toBe("RECOMMENDATION_NOT_COMPUTABLE")
    expect(AUROPHARMA_G10_2_FINAL_RESULT.noRenormalization).toBe(true)
  })

  it("keeps every Gate K downstream safety boundary disabled", () => {
    expect(K_FINAL_SAFETY_BOUNDARY).toEqual({
      providerCalls: 0,
      productionMutation: false,
      productionMigration: false,
      scorePersistence: false,
      recommendationPersistence: false,
      positionSizing: false,
      schedulerMutation: false,
      deployment: false,
      prMerge: false,
      automaticTrading: false,
      aiInterpretationActivation: false,
      portfolioMutation: false,
    })
  })
})
