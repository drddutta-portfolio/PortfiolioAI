import { describe, expect, it } from "vitest"
import type { RecommendationPolicy } from "../../data/recommendationPolicyRepository"
import { buildRecommendationPreview } from "./sectorRecommendation"
import type { SecurityScoringSnapshot } from "./scoringTypes"

const policy: RecommendationPolicy = {
  profileCode: "PHARMA_V1",
  policyVersion: 0,
  status: "DRAFT",
  minScoreReadyCoverage: 1,
  coreMinScore: 80,
  satelliteMinScore: 65,
  watchMinScore: 50,
  mandatoryDimensionFloors: {},
  cautionRules: {},
  sectorFocus: {},
  persistenceRules: {
    upgradeConfirmations: 2,
    downgradeConfirmations: 2,
  },
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
  notes: "Gate I1 test-only policy; thresholds are not Gate I2 methodology.",
}

function snapshot(profileCode: string): SecurityScoringSnapshot {
  return {
    profileCode,
    profileName: "Pharmaceuticals",
    profileSource: "REVIEWED_ASSIGNMENT",
    modelName: "Gate I1 fallback regression",
    modelStatus: "TEST",
    runState: "READ_ONLY",
    overallScore: null,
    evidenceCoverage: 1,
    scoreReadyCoverage: 1,
    evidenceConfidence: 100,
    asOfDate: "2026-09-21",
    dimensions: [
      {
        dimensionCode: "QUALITY",
        dimensionWeight: 50,
        rawScore: 100,
        weightedContribution: 50,
        evidenceCoverage: 1,
        scoreReadyCoverage: 1,
        confidence: 100,
        heatState: "STRONG",
      },
      {
        dimensionCode: "GROWTH",
        dimensionWeight: 50,
        rawScore: 100,
        weightedContribution: 50,
        evidenceCoverage: 1,
        scoreReadyCoverage: 1,
        confidence: 100,
        heatState: "STRONG",
      },
    ],
    ratings: [],
    previewMode: true,
  }
}

describe("PHARMA_V1 strict recommendation score authority", () => {
  it("does not reconstruct or renormalize a missing PHARMA_V1 overall score", () => {
    const result = buildRecommendationPreview(snapshot("PHARMA_V1"), policy)
    expect(result.suggestedRole).toBe("INSUFFICIENT")
    expect(result.overallScore).toBeNull()
    expect(result.reason).toBe("Sector-specific evidence gate is not yet complete.")
  })

  it("preserves the legacy generic fallback outside PHARMA_V1", () => {
    const result = buildRecommendationPreview(snapshot("LEGACY_TEST"), policy)
    expect(result.overallScore).toBe(100)
    expect(result.suggestedRole).toBe("CORE_CANDIDATE")
  })
})
