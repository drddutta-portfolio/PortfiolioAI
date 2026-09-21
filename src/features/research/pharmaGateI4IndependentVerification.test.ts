import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { PHARMA_GATE_I4_INDEPENDENT_VERIFICATION } from "./pharmaGateI4IndependentVerification"

describe("Gate I4 independent PHARMA_V1 recommendation verification", () => {
  const result = PHARMA_GATE_I4_INDEPENDENT_VERIFICATION

  it("independently reproduces the TORNTPHARM role threshold, floors, cautions and final role", () => {
    expect(result.handVerification).toEqual({
      overallScore: 75.1575,
      coreThresholdPassed: false,
      satelliteThresholdPassed: true,
      watchThresholdPassed: true,
      satelliteFloors: [
        { dimensionCode: "QUALITY", minimum: 50, observed: 92, state: "PASS" },
        { dimensionCode: "GROWTH", minimum: 50, observed: 78.25, state: "PASS" },
        { dimensionCode: "CASH_FLOW", minimum: 50, observed: 93.6, state: "PASS" },
        { dimensionCode: "BALANCE_SHEET_CREDIT", minimum: 50, observed: 65, state: "PASS" },
        { dimensionCode: "BUSINESS_DURABILITY", minimum: 50, observed: 75, state: "PASS" },
        { dimensionCode: "OWNERSHIP_GOVERNANCE", minimum: 50, observed: 70, state: "PASS" },
        { dimensionCode: "RISK", minimum: 50, observed: 80, state: "PASS" },
      ],
      satelliteFloorsPassed: true,
      globalHardBlockerPresent: false,
      governanceState: "CLEAR",
      governanceSecondPenaltyApplied: false,
      materialOverlaySecondRecommendation: false,
      emergingWatchNumericRoleInput: false,
      cautions: ["VALUATION_BELOW_NEUTRAL_ANCHOR"],
      finalRole: "SATELLITE_CANDIDATE",
    })

    expect(result.adapterCrossCheck).toEqual({
      roleMatches: true,
      overallScoreMatches: true,
      floorCountMatches: true,
      allSatelliteFloorsMatch: true,
      cautionsMatch: true,
      governanceMatches: true,
    })
  })

  it("proves the Gate H score and all ten dimensions are preserved exactly", () => {
    expect(result.scorePreservation.gateHOverallScore).toBe(75.1575)
    expect(result.scorePreservation.recommendationOverallScore).toBe(75.1575)
    expect(result.scorePreservation.exactOverallMatch).toBe(true)
    expect(result.scorePreservation.recommendationDimensionCount).toBe(10)
    expect(result.scorePreservation.dimensionsExactMatch).toBe(true)
    expect(result.scorePreservation.gateHDimensions).toEqual({
      QUALITY: 92,
      GROWTH: 78.25,
      CAPITAL_EFFICIENCY: 79,
      CASH_FLOW: 93.6,
      BALANCE_SHEET_CREDIT: 65,
      BUSINESS_DURABILITY: 75,
      VALUATION: 30,
      MOMENTUM: 95,
      OWNERSHIP_GOVERNANCE: 70,
      RISK: 80,
    })
    expect(result.scorePreservation.hiddenRenormalizationAllowed).toBe(false)
    expect(result.scorePreservation.missingOverallReconstructionAllowed).toBe(false)
  })

  it("proves anti-leakage and no overlay or governance double-counting", () => {
    expect(result.antiLeakage).toEqual({
      bankNbfcThresholdsUsed: false,
      bankNbfcFloorsUsed: false,
      niftyBankLogicUsed: false,
      hdfcBankAssumptionsUsed: false,
      globalGenericsSecondRecommendation: false,
      cdmoEmergingNumericRoleInput: false,
      governanceDoubleCounting: false,
    })
  })

  it("proves deterministic repeated recommendation output", () => {
    expect(result.determinism.repeatedCalculationIdentical).toBe(true)
    expect(result.determinism.first).toEqual(result.determinism.second)
    expect(result.determinism.first.suggestedRole).toBe("SATELLITE_CANDIDATE")
    expect(result.determinism.first.overallScore).toBe(75.1575)
  })

  it("proves AUROPHARMA remains the fail-closed no-reconstruction control", () => {
    expect(result.auropharmaFailClosedControl).toEqual({
      suggestedRole: "INSUFFICIENT",
      sourceAuthorityState: "SCORE_NOT_COMPUTABLE",
      overallScore: null,
      dimensionCount: 0,
      thresholdState: "NOT_EVALUATED",
      noScoreReconstruction: true,
    })
  })

  it("proves every Gate I downstream action and mutation capability remains disabled", () => {
    expect(result.safety).toEqual({
      readOnly: true,
      nonPersisting: true,
      recommendationPersistenceEnabled: false,
      scorePersistenceEnabled: false,
      weightGuidanceEnabled: false,
      actionBiasEnabled: false,
      positionSizingEnabled: false,
      aiInterpretationEnabled: false,
      providerRefreshInvoked: false,
      productionMutationInvoked: false,
    })
  })

  it("keeps the I3 recommendation adapter free of mutation, sizing, AI and provider dependencies", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/features/research/pharmaGateI3ReadOnlyRecommendation.ts"),
      "utf8",
    )
    for (const forbidden of [
      "recommendationPolicyRepository",
      "recordRecommendationPreview(",
      "record_recommendation_preview_v2",
      "stock_recommendation_runs",
      'from "./weightRecommendation"',
      'from "./actionRecommendation"',
      "RecommendationInterpretationPanel",
      'from "./positionSizing',
      "D35B",
      "providerRefresh",
      'from "../../lib/supabase',
    ]) {
      expect(source).not.toContain(forbidden)
    }
  })
})
