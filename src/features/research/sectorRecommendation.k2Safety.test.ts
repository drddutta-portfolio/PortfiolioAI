import { describe, expect, it } from "vitest"
import type { RecommendationPolicy } from "../../data/recommendationPolicyRepository"
import type { SecurityScoringSnapshot } from "./scoringTypes"
import { buildRecommendationPreview } from "./sectorRecommendation"

function snapshot(input: { overallScore: number | null; quality: number | null }): SecurityScoringSnapshot {
  return {
    profileCode: "K2_TEST",
    profileName: "K2 Test",
    profileSource: "SECTOR_RULE",
    modelName: "K2_TEST_MODEL",
    modelStatus: "TEST",
    runState: "READ_ONLY",
    overallScore: input.overallScore,
    evidenceCoverage: 1,
    scoreReadyCoverage: 1,
    evidenceConfidence: 100,
    asOfDate: "2026-09-22",
    dimensions: [
      {
        dimensionCode: "QUALITY",
        dimensionWeight: 100,
        rawScore: input.quality,
        weightedContribution: input.quality,
        evidenceCoverage: input.quality === null ? 0 : 1,
        scoreReadyCoverage: input.quality === null ? 0 : 1,
        confidence: input.quality === null ? 0 : 100,
        heatState: input.quality === null ? "INSUFFICIENT" : "NEUTRAL",
      },
    ],
    ratings: [],
    previewMode: true,
  }
}

function policy(overrides: Partial<RecommendationPolicy> = {}): RecommendationPolicy {
  return {
    profileCode: "K2_TEST",
    policyVersion: 1,
    status: "DRAFT",
    minScoreReadyCoverage: 1,
    coreMinScore: 80,
    satelliteMinScore: 65,
    watchMinScore: 50,
    mandatoryDimensionFloors: {
      CORE_CANDIDATE: { QUALITY: 70 },
      SATELLITE_CANDIDATE: { QUALITY: 50 },
    },
    cautionRules: {},
    sectorFocus: {},
    persistenceRules: { upgradeConfirmations: 2, downgradeConfirmations: 2 },
    weightPolicy: {
      singleStockMax: null,
      highConvictionScore: null,
      cautionScore: null,
      momentumCautionBelow: null,
      riskCautionBelow: null,
      momentumCap: null,
      riskCap: null,
      profileConcentrationSoftCap: null,
      profileConcentrationHardCap: null,
      minProfileCoverageForConcentration: 70,
    },
    notes: "K2 safety test",
    ...overrides,
  }
}

describe("K2 universal recommendation safety", () => {
  it("fails closed when an authoritative overall score is missing", () => {
    const result = buildRecommendationPreview(snapshot({ overallScore: null, quality: 100 }), policy())
    expect(result.suggestedRole).toBe("INSUFFICIENT")
    expect(result.overallScore).toBeNull()
  })

  it("fails closed when mandatory role-floor evidence is missing", () => {
    const result = buildRecommendationPreview(snapshot({ overallScore: 75, quality: null }), policy())
    expect(result.suggestedRole).toBe("INSUFFICIENT")
    expect(result.reason).toContain("Mandatory recommendation-floor data is missing")
  })

  it("does not manufacture AVOID when no sector watch floor is approved", () => {
    const result = buildRecommendationPreview(
      snapshot({ overallScore: 40, quality: 40 }),
      policy({
        watchMinScore: null,
        mandatoryDimensionFloors: {},
      }),
    )
    expect(result.suggestedRole).toBe("INSUFFICIENT")
    expect(result.reason).toBe("A sector-specific Avoid boundary has not been approved.")
  })

  it("permits AVOID only below an explicitly approved watch floor", () => {
    const result = buildRecommendationPreview(
      snapshot({ overallScore: 40, quality: 40 }),
      policy({ mandatoryDimensionFloors: {} }),
    )
    expect(result.suggestedRole).toBe("AVOID")
  })
})
