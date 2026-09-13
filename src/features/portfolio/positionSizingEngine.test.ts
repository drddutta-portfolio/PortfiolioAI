import { describe, expect, it } from "vitest"
import {
  assessPositionSizingV1,
  POSITION_SIZING_ENGINE_VERSION,
  type PositionSizingInput,
} from "./positionSizingEngine"

function baseInput(overrides: Partial<PositionSizingInput> = {}): PositionSizingInput {
  const input: PositionSizingInput = {
    portfolioId: "portfolio-1",
    securityId: "security-1",
    assetClass: "EQUITY",
    currentWeight: "2.75",
    minimumScoreReadyCoverage: "0.70",
    researchProfile: {
      profileCode: "BANK",
      profileVersion: "BANK_V1",
      readiness: "READY",
    },
    owner: {
      portfolioRole: "CORE",
      targetWeight: null,
      minimumWeight: null,
      maximumWeight: null,
      isFrozen: false,
    },
    recommendation: {
      recommendationRunId: "recommendation-1",
      scoreRunId: "score-1",
      suggestedRole: "CORE_CANDIDATE",
      actionBias: "ACCUMULATE",
      suggestedWeightMinimum: "3",
      suggestedWeightMaximum: "4",
      scoreReadyCoverage: "0.88",
      evidenceConfidence: "82",
      transitionStatus: "STABLE",
    },
  }
  return {
    ...input,
    ...overrides,
    researchProfile: { ...input.researchProfile, ...(overrides.researchProfile ?? {}) },
    owner: { ...input.owner, ...(overrides.owner ?? {}) },
    recommendation: { ...input.recommendation, ...(overrides.recommendation ?? {}) },
  }
}

describe("assessPositionSizingV1", () => {
  it("reproduces the bounded HDFCBANK 3–4% reference range only with READY BANK profile lineage", () => {
    const result = assessPositionSizingV1(baseInput({
      securityId: "hdfcbank-security",
      currentWeight: "2.75",
      owner: { portfolioRole: "CORE", targetWeight: "3.5", minimumWeight: "3", maximumWeight: "4", isFrozen: false },
    }))

    expect(result).toMatchObject({
      engineVersion: POSITION_SIZING_ENGINE_VERSION,
      securityId: "hdfcbank-security",
      researchProfileCode: "BANK",
      researchProfileVersion: "BANK_V1",
      assessmentState: "READY",
      currentWeight: "2.75",
      suggestedMinimumWeight: "3",
      suggestedTargetWeight: "3.5",
      suggestedMaximumWeight: "4",
      recommendedAction: "ADD",
      evidenceCoverage: "0.88",
      evidenceConfidence: "82",
      sourceScoreRunId: "score-1",
      sourceRecommendationRunId: "recommendation-1",
    })
    expect(result.reasonCodes).toContain("UPSTREAM_ACCUMULATE")
    expect(result.reasonCodes).toContain("OWNER_TARGET_WITHIN_ENGINE_RANGE")
  })

  it("blocks an equity when its sector research profile is not yet READY even if a range is supplied", () => {
    const result = assessPositionSizingV1(baseInput({
      securityId: "unready-it-security",
      researchProfile: {
        profileCode: "IT_SERVICES",
        profileVersion: "IT_SERVICES_V1",
        readiness: "PROFILE_PENDING",
      },
      recommendation: {
        ...baseInput().recommendation,
        suggestedWeightMinimum: "2",
        suggestedWeightMaximum: "3",
      },
    }))

    expect(result.assessmentState).toBe("BLOCKED_PREREQUISITE")
    expect(result.recommendedAction).toBeNull()
    expect(result.suggestedMinimumWeight).toBeNull()
    expect(result.suggestedMaximumWeight).toBeNull()
    expect(result.reasonCodes).toEqual(["RESEARCH_PROFILE_NOT_READY"])
  })

  it("blocks an equity when the upstream research profile code/version is missing", () => {
    const result = assessPositionSizingV1(baseInput({
      researchProfile: {
        profileCode: null,
        profileVersion: null,
        readiness: "READY",
      },
    }))

    expect(result.assessmentState).toBe("BLOCKED_PREREQUISITE")
    expect(result.reasonCodes).toEqual(["MISSING_RESEARCH_PROFILE"])
  })

  it("remains profile-agnostic only after a non-financial profile contract is explicitly READY", () => {
    const result = assessPositionSizingV1(baseInput({
      securityId: "nonfinancial-contract-fixture",
      currentWeight: "2.4",
      researchProfile: {
        profileCode: "IT_SERVICES",
        profileVersion: "IT_SERVICES_V1_TEST_FIXTURE",
        readiness: "READY",
      },
      owner: { portfolioRole: "SATELLITE", targetWeight: "2.5", minimumWeight: null, maximumWeight: null, isFrozen: false },
      recommendation: {
        recommendationRunId: "recommendation-nonfinancial",
        scoreRunId: "score-nonfinancial",
        suggestedRole: "SATELLITE_CANDIDATE",
        actionBias: "HOLD",
        suggestedWeightMinimum: "2",
        suggestedWeightMaximum: "3",
        scoreReadyCoverage: "0.92",
        evidenceConfidence: "78",
        transitionStatus: "STABLE",
      },
    }))

    expect(result.assessmentState).toBe("READY")
    expect(result.researchProfileCode).toBe("IT_SERVICES")
    expect(result.suggestedMinimumWeight).toBe("2")
    expect(result.suggestedTargetWeight).toBe("2.5")
    expect(result.suggestedMaximumWeight).toBe("3")
    expect(result.recommendedAction).toBe("HOLD")
  })

  it("fails closed with INSUFFICIENT_EVIDENCE when score coverage is below policy", () => {
    const result = assessPositionSizingV1(baseInput({
      securityId: "incomplete-security",
      recommendation: {
        recommendationRunId: "recommendation-incomplete",
        scoreRunId: "score-incomplete",
        suggestedRole: "WATCH",
        actionBias: "WAIT",
        suggestedWeightMinimum: "0",
        suggestedWeightMaximum: "1",
        scoreReadyCoverage: "0.42",
        evidenceConfidence: "55",
        transitionStatus: "STABLE",
      },
    }))

    expect(result.assessmentState).toBe("INSUFFICIENT_EVIDENCE")
    expect(result.recommendedAction).toBeNull()
    expect(result.suggestedMinimumWeight).toBeNull()
    expect(result.suggestedTargetWeight).toBeNull()
    expect(result.suggestedMaximumWeight).toBeNull()
    expect(result.reasonCodes).toEqual(["SCORE_COVERAGE_BELOW_POLICY"])
  })

  it("marks ETFs NOT_APPLICABLE before applying equity research-profile logic", () => {
    const result = assessPositionSizingV1(baseInput({ assetClass: "ETF", securityId: "etf-security" }))

    expect(result.assessmentState).toBe("NOT_APPLICABLE")
    expect(result.recommendedAction).toBeNull()
    expect(result.reasonCodes).toEqual(["ASSET_CLASS_NOT_EQUITY"])
  })

  it("does not invent a range when upstream weight guidance is missing", () => {
    const result = assessPositionSizingV1(baseInput({
      recommendation: {
        ...baseInput().recommendation,
        suggestedWeightMinimum: null,
        suggestedWeightMaximum: null,
      },
    }))

    expect(result.assessmentState).toBe("INSUFFICIENT_EVIDENCE")
    expect(result.suggestedTargetWeight).toBeNull()
    expect(result.reasonCodes).toEqual(["MISSING_WEIGHT_GUIDANCE"])
  })

  it("preserves a human freeze instead of producing a trading action", () => {
    const result = assessPositionSizingV1(baseInput({
      currentWeight: "2.5",
      owner: { portfolioRole: "CORE", targetWeight: null, minimumWeight: null, maximumWeight: null, isFrozen: true },
    }))

    expect(result.assessmentState).toBe("READY")
    expect(result.recommendedAction).toBe("FREEZE")
    expect(result.reasonCodes).toContain("OWNER_POSITION_FROZEN")
  })

  it("turns an upstream exit candidate into EXIT_REVIEW, never automatic EXIT", () => {
    const result = assessPositionSizingV1(baseInput({
      currentWeight: "4.5",
      recommendation: {
        ...baseInput().recommendation,
        actionBias: "EXIT_CANDIDATE",
        suggestedWeightMinimum: "0",
        suggestedWeightMaximum: "1",
      },
    }))

    expect(result.assessmentState).toBe("READY")
    expect(result.recommendedAction).toBe("EXIT_REVIEW")
    expect(result.reasonCodes).toContain("EXIT_REQUIRES_THESIS_REVIEW")
  })

  it("uses exact decimal midpoint rounding to six places", () => {
    const result = assessPositionSizingV1(baseInput({
      currentWeight: "1",
      recommendation: {
        ...baseInput().recommendation,
        suggestedWeightMinimum: "1.000001",
        suggestedWeightMaximum: "1.000002",
      },
    }))

    expect(result.suggestedTargetWeight).toBe("1.000002")
  })
})
