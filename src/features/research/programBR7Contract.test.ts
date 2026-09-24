import { describe, expect, it } from "vitest"
import {
  PROGRAM_B_B3_SAFETY_BOUNDARY,
  PROGRAM_B_LEGACY_RECOMMENDATION_BOUNDARY,
  PROGRAM_B_LEGACY_SIZING_BOUNDARY,
  PROGRAM_B_MACHINE_OUTPUT_FIELDS,
  PROGRAM_B_OWNER_CONTROLLED_FIELDS,
  PROGRAM_B_R7_PORTABILITY_BOUNDARY,
  PROGRAM_B_RECOMMENDATION_LINEAGE_REQUIRED_FIELDS,
  PROGRAM_B_RECOMMENDATION_POLICY_REGISTRY,
  PROGRAM_B_SIZING_POLICY_REGISTRY,
  evaluateProgramBRecommendationReadiness,
  evaluateProgramBSizingReadiness,
  programBRecommendationLineageIdentity,
  resolveProgramBRecommendationPolicy,
  resolveProgramBSizingMethodology,
  type ProgramBRecommendationReadinessInput,
  type ProgramBSizingPolicyAuthority,
} from "./programBR7Contract"
import {
  evaluatePharmaV1RecommendationPolicyCandidate,
  PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE,
} from "./pharmaRecommendationPolicyCandidate"

function pharmaRecommendationInput(
  overrides: Partial<ProgramBRecommendationReadinessInput> = {},
): ProgramBRecommendationReadinessInput {
  return {
    assetClass: "EQUITY",
    securityId: "security-torntpharm",
    scoreState: "SCORED",
    scoreRunId: "r6-run-torntpharm-1",
    score: 75.1575,
    scoreLineageState: "COMPLETE",
    scoreProfileCode: "PHARMA_V1",
    methodologyRole: "DOMESTIC_FORMULATIONS",
    recommendationPolicy: resolveProgramBRecommendationPolicy("PHARMA_V1"),
    mandatoryFloorInputState: "COMPLETE",
    cautionRiskInputState: "COMPLETE",
    ...overrides,
  }
}

describe("Program B B3 R7 contract and architecture", () => {
  it("inherits only the owner-approved PHARMA_V1 numeric recommendation authority", () => {
    expect(PROGRAM_B_RECOMMENDATION_POLICY_REGISTRY).toHaveLength(1)
    expect(PROGRAM_B_RECOMMENDATION_POLICY_REGISTRY[0]).toMatchObject({
      profileCode: "PHARMA_V1",
      policyVersion: "PHARMA_V1_RECOMMENDATION_POLICY_V1_OWNER_APPROVED",
      numericThresholdScope: "PROFILE_SPECIFIC_ONLY",
      weightGuidanceAuthority: "NOT_APPROVED",
      sizingAuthority: "NOT_APPROVED",
    })
    expect(resolveProgramBRecommendationPolicy("PHARMA_V1").state).toBe("RESOLVED")
    expect(resolveProgramBRecommendationPolicy("BANK_NBFC")).toMatchObject({
      state: "METHODOLOGY_NOT_AVAILABLE",
      reasonCode: "PROFILE_RECOMMENDATION_POLICY_NOT_APPROVED",
    })
  })

  it("preserves Gate K's prohibition on universal recommendation thresholds", () => {
    expect(PROGRAM_B_R7_PORTABILITY_BOUNDARY).toEqual({
      k5NumericThresholdPortability: "NOT_ESTABLISHED",
      k5Decision: "DO_NOT_INTRODUCE_UNIVERSAL_NUMERIC_THRESHOLDS",
      universalNumericRecommendationThresholdsAllowed: false,
      crossSectorSizingHeuristicBorrowingAllowed: false,
    })

    const serialized = JSON.stringify(PROGRAM_B_RECOMMENDATION_POLICY_REGISTRY)
    expect(serialized).not.toContain("BANK_NBFC")
    expect(serialized).not.toContain("IT_TECH")
  })

  it("requires a valid score, exact score lineage, approved policy and resolved policy inputs", () => {
    const ready = evaluateProgramBRecommendationReadiness(pharmaRecommendationInput())
    expect(ready).toMatchObject({
      state: "READY",
      canRecommend: true,
      scoreRunId: "r6-run-torntpharm-1",
      policyVersion: "PHARMA_V1_RECOMMENDATION_POLICY_V1_OWNER_APPROVED",
    })

    expect(evaluateProgramBRecommendationReadiness(
      pharmaRecommendationInput({ scoreRunId: null }),
    ).state).toBe("BLOCKED_PREREQUISITE")

    expect(evaluateProgramBRecommendationReadiness(
      pharmaRecommendationInput({
        recommendationPolicy: resolveProgramBRecommendationPolicy("BANK_NBFC"),
      }),
    ).state).toBe("METHODOLOGY_NOT_AVAILABLE")
  })

  it("fails closed for blocked score states instead of reconstructing a recommendation", () => {
    expect(evaluateProgramBRecommendationReadiness(
      pharmaRecommendationInput({
        scoreState: "INSUFFICIENT_EVIDENCE",
        scoreRunId: null,
        score: null,
      }),
    )).toMatchObject({
      state: "INSUFFICIENT_EVIDENCE",
      canRecommend: false,
    })

    expect(evaluateProgramBRecommendationReadiness(
      pharmaRecommendationInput({
        scoreState: "CONFLICTING_EVIDENCE",
        scoreRunId: null,
        score: null,
      }),
    ).state).toBe("REVIEW_REQUIRED")

    expect(evaluateProgramBRecommendationReadiness(
      pharmaRecommendationInput({
        scoreState: "METHODOLOGY_NOT_AVAILABLE",
        scoreRunId: null,
        score: null,
      }),
    ).state).toBe("METHODOLOGY_NOT_AVAILABLE")
  })

  it("carries the Gate I missing-floor versus failed-floor distinction", () => {
    const missingFloor = evaluateProgramBRecommendationReadiness(
      pharmaRecommendationInput({ mandatoryFloorInputState: "MISSING" }),
    )
    expect(missingFloor.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(missingFloor.canRecommend).toBe(false)

    const failedCoreFloor = evaluatePharmaV1RecommendationPolicyCandidate({
      scoreState: "SCORE_READY",
      overallScore: 85,
      dimensionScores: {
        QUALITY: 70,
        GROWTH: 70,
        CAPITAL_EFFICIENCY: 70,
        CASH_FLOW: 75,
        BALANCE_SHEET_CREDIT: 70,
        BUSINESS_DURABILITY: 80,
        VALUATION: 60,
        MOMENTUM: 60,
        OWNERSHIP_GOVERNANCE: 70,
        RISK: 70,
      },
      governanceState: "CLEAR",
      overlayContext: {
        materialOverlayPresent: false,
        emergingWatchPresent: false,
      },
    })
    expect(failedCoreFloor.suggestedRole).toBe("SATELLITE_CANDIDATE")
    expect(failedCoreFloor.suggestedRole).not.toBe("INSUFFICIENT")
  })

  it("keeps overlays contextual and unable to create a second recommendation role", () => {
    expect(PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.overlayRules).toEqual({
      materialOverlay: "CONTEXT_ONLY_NO_INDEPENDENT_ROLE",
      emergingWatch: "CONTEXT_ONLY_NUMERICALLY_EXCLUDED",
      secondRecommendationAllowed: false,
      roleOverrideAllowed: false,
      roleBlendAllowed: false,
    })
    expect(PROGRAM_B_RECOMMENDATION_POLICY_REGISTRY[0]?.overlayIndependentRoleAllowed).toBe(false)
  })

  it("requires recommendation lineage to point to one exact score run", () => {
    expect(PROGRAM_B_RECOMMENDATION_LINEAGE_REQUIRED_FIELDS).toContain("scoreRunId")
    const first = programBRecommendationLineageIdentity({
      recommendationRunId: "recommendation-1",
      securityId: "security-x",
      scoreRunId: "score-run-1",
      recommendationMethodologyId: "policy-x",
      recommendationMethodologyVersion: "v1",
    })
    const second = programBRecommendationLineageIdentity({
      recommendationRunId: "recommendation-1",
      securityId: "security-x",
      scoreRunId: "score-run-2",
      recommendationMethodologyId: "policy-x",
      recommendationMethodologyVersion: "v1",
    })
    expect(first).not.toBe(second)
  })

  it("does not promote legacy draft BANK thresholds or D35B pilot weight guidance into Program B authority", () => {
    expect(PROGRAM_B_LEGACY_RECOMMENDATION_BOUNDARY).toEqual({
      databaseDraftPoliciesAreProgramBAuthority: false,
      legacyBankNbfcDraftThresholdsInherited: false,
      recordRecommendationPreviewAllowedInB3: false,
    })
    expect(PROGRAM_B_LEGACY_SIZING_BOUNDARY).toMatchObject({
      contractStatus: "RECEIVING_ENGINE_SHELL_ONLY",
      programBNumericSizingAuthority: false,
      legacyHdfcBankPilotWeightGuidanceInherited: false,
      persistenceAuthorizedInB3: false,
    })
  })

  it("starts Program B sizing with no numeric policy authority rather than borrowing another sector's heuristics", () => {
    expect(PROGRAM_B_SIZING_POLICY_REGISTRY).toEqual([])
    const result = resolveProgramBSizingMethodology({
      assetClass: "EQUITY",
      profileCode: "PHARMA_V1",
      methodologyRole: "DOMESTIC_FORMULATIONS",
    })
    expect(result).toMatchObject({
      state: "METHODOLOGY_NOT_AVAILABLE",
      reasonCode: "PROFILE_ROLE_SIZING_POLICY_NOT_APPROVED",
    })
  })

  it("requires exact profile-and-role sizing authority and rejects cross-role borrowing", () => {
    const registry: readonly ProgramBSizingPolicyAuthority[] = [{
      policyId: "SYNTHETIC_TEST_POLICY",
      policyVersion: "V1",
      state: "APPROVED",
      profileCode: "PROFILE_X",
      methodologyRole: "ROLE_PRIMARY",
      factors: ["CONVICTION", "CONCENTRATION", "PORTFOLIO_FIT"],
      actions: ["ADD", "HOLD", "REDUCE"],
      sourceAuthority: "B3_CONTRACT_TEST_ONLY",
    }]

    expect(resolveProgramBSizingMethodology({
      assetClass: "EQUITY",
      profileCode: "PROFILE_X",
      methodologyRole: "ROLE_PRIMARY",
    }, registry).state).toBe("RESOLVED")

    expect(resolveProgramBSizingMethodology({
      assetClass: "EQUITY",
      profileCode: "PROFILE_X",
      methodologyRole: "ROLE_OVERLAY",
    }, registry).state).toBe("METHODOLOGY_NOT_AVAILABLE")

    expect(resolveProgramBSizingMethodology({
      assetClass: "EQUITY",
      profileCode: "PROFILE_Y",
      methodologyRole: "ROLE_PRIMARY",
    }, registry).state).toBe("METHODOLOGY_NOT_AVAILABLE")
  })

  it("keeps sizing fail-closed until both recommendation lineage and a sizing authority exist", () => {
    const unavailable = resolveProgramBSizingMethodology({
      assetClass: "EQUITY",
      profileCode: "PHARMA_V1",
      methodologyRole: "DOMESTIC_FORMULATIONS",
    })
    expect(evaluateProgramBSizingReadiness({
      assetClass: "EQUITY",
      securityId: "security-torntpharm",
      recommendationState: "READY",
      recommendationRunId: "recommendation-1",
      recommendationScoreRunId: "score-run-1",
      sizingMethodology: unavailable,
      sizingInputState: "COMPLETE",
      currentPortfolioContextState: "COMPLETE",
    })).toMatchObject({
      state: "METHODOLOGY_NOT_AVAILABLE",
      canSize: false,
    })
  })

  it("keeps machine assessment fields disjoint from owner-controlled settings", () => {
    const ownerFields = new Set<string>(PROGRAM_B_OWNER_CONTROLLED_FIELDS)
    for (const field of PROGRAM_B_MACHINE_OUTPUT_FIELDS) {
      expect(ownerFields.has(field), field).toBe(false)
    }
    expect(PROGRAM_B_OWNER_CONTROLLED_FIELDS).toEqual([
      "targetPrice",
      "stopLossPrice",
      "targetWeight",
      "portfolioRole",
    ])
  })

  it("keeps B3 architecture inert", () => {
    expect(PROGRAM_B_B3_SAFETY_BOUNDARY).toEqual({
      recommendationComputationExecuted: false,
      recommendationPersistence: false,
      sizingComputationExecuted: false,
      sizingPersistence: false,
      ownerSettingsMutation: false,
      providerCalls: 0,
      angelOneCalls: 0,
      trendlyneCalls: 0,
      openAiDecisionCalls: 0,
      productionMutation: false,
      migration: false,
      deployment: false,
      merge: false,
      schedulerMutation: false,
      trading: false,
    })
  })
})
