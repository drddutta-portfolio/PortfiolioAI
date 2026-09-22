import { describe, expect, it } from "vitest"
import {
  evaluatePharmaV1RecommendationPolicyCandidate,
  PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE,
} from "./pharmaRecommendationPolicyCandidate"
import type { PharmaG7DimensionCode } from "./pharmaG7ReadOnlyScoringAdapter"

function dimensions(
  overrides: Partial<Record<PharmaG7DimensionCode, number | null>> = {},
) {
  return {
    QUALITY: 80,
    GROWTH: 70,
    CAPITAL_EFFICIENCY: 70,
    CASH_FLOW: 75,
    BALANCE_SHEET_CREDIT: 70,
    BUSINESS_DURABILITY: 80,
    VALUATION: 60,
    MOMENTUM: 60,
    OWNERSHIP_GOVERNANCE: 70,
    RISK: 70,
    ...overrides,
  }
}

function evaluate(input: {
  overallScore: number | null
  scoreState?: "SCORE_READY" | "SCORE_NOT_COMPUTABLE"
  dimensionOverrides?: Partial<Record<PharmaG7DimensionCode, number | null>>
  governanceState?:
    | "CLEAR"
    | "INTERPRETATION_ONLY_HIGH_RISK"
    | "REVIEW_REQUIRED"
    | "BLOCKED_REVIEW"
  materialOverlayPresent?: boolean
  emergingWatchPresent?: boolean
}) {
  return evaluatePharmaV1RecommendationPolicyCandidate({
    scoreState:
      input.scoreState
      ?? (input.overallScore === null ? "SCORE_NOT_COMPUTABLE" : "SCORE_READY"),
    overallScore: input.overallScore,
    dimensionScores: dimensions(input.dimensionOverrides),
    governanceState: input.governanceState ?? "CLEAR",
    overlayContext: {
      materialOverlayPresent: input.materialOverlayPresent ?? false,
      emergingWatchPresent: input.emergingWatchPresent ?? false,
    },
  })
}

describe("PHARMA_V1 Gate I2 recommendation policy candidate", () => {
  it("locks the owner-approved I2 policy identity before I3", () => {
    expect(PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.version).toBe(
      "PHARMA_V1_RECOMMENDATION_POLICY_V1_OWNER_APPROVED",
    )
    expect(PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.state).toBe(
      "OWNER_APPROVED_LOCKED",
    )
  })

  it("derives thresholds from PHARMA_V1 semantic anchors rather than a reference-company score", () => {
    expect(PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.methodologyBasis).toEqual({
      neutralAnchor: 50,
      strongComponentAnchor: 75,
      coreAggregateMinimum: 80,
      satelliteAggregateMinimum: 65,
      rationale: [
        "WATCH_MIN_EQUALS_APPROVED_NEUTRAL_ANCHOR_50",
        "CORE_MIN_80_IS_ABOVE_STRONG_COMPONENT_ANCHOR_75",
        "SATELLITE_MIN_65_IS_MIDPOINT_BETWEEN_WATCH_50_AND_CORE_80",
        "THRESHOLDS_DEFINED_WITHOUT_REFERENCE_COMPANY_SCORE_INPUT",
      ],
    })
    expect(PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.overallThresholds).toEqual({
      coreMinimum: 80,
      satelliteMinimum: 65,
      watchMinimum: 50,
      avoidBelow: 50,
    })

    const serialized = JSON.stringify(PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE)
    expect(serialized).not.toContain("TORNTPHARM")
    expect(serialized).not.toContain("AUROPHARMA")
    expect(serialized).not.toContain("BANK_NBFC")
    expect(serialized).not.toContain("PHARMA_HEALTHCARE")
    expect(serialized).not.toContain("HDFCBANK")
  })

  it("classifies all ten dimensions explicitly without silently ignoring one", () => {
    expect(PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.dimensionTreatment).toEqual({
      QUALITY: "ROLE_BLOCKING_FLOOR",
      GROWTH: "ROLE_BLOCKING_FLOOR",
      CAPITAL_EFFICIENCY: "NO_SEPARATE_ROLE_GATE",
      CASH_FLOW: "ROLE_BLOCKING_FLOOR",
      BALANCE_SHEET_CREDIT: "ROLE_BLOCKING_FLOOR",
      BUSINESS_DURABILITY: "ROLE_BLOCKING_FLOOR",
      VALUATION: "CAUTION_ONLY",
      MOMENTUM: "CAUTION_ONLY",
      OWNERSHIP_GOVERNANCE: "ROLE_BLOCKING_FLOOR",
      RISK: "ROLE_BLOCKING_FLOOR",
    })
  })

  it("uses a monotonic role ladder at exact threshold boundaries", () => {
    expect(evaluate({ overallScore: 80 }).suggestedRole).toBe("CORE_CANDIDATE")
    expect(evaluate({ overallScore: 79.9999 }).suggestedRole).toBe(
      "SATELLITE_CANDIDATE",
    )
    expect(evaluate({ overallScore: 65 }).suggestedRole).toBe(
      "SATELLITE_CANDIDATE",
    )
    expect(evaluate({ overallScore: 64.9999 }).suggestedRole).toBe("WATCH")
    expect(evaluate({ overallScore: 50 }).suggestedRole).toBe("WATCH")
    expect(evaluate({ overallScore: 49.9999 }).suggestedRole).toBe("AVOID")
  })

  it("makes a failed Core floor fall through rather than forcing Avoid", () => {
    const result = evaluate({
      overallScore: 85,
      dimensionOverrides: { QUALITY: 70 },
    })
    expect(result.suggestedRole).toBe("SATELLITE_CANDIDATE")
    expect(result.reasonCodes).toContain("SATELLITE_ROLE_FLOORS_PASSED")
  })

  it("makes a failed Satellite floor fall through to Watch when score remains evaluable", () => {
    const result = evaluate({
      overallScore: 75,
      dimensionOverrides: { RISK: 40 },
    })
    expect(result.suggestedRole).toBe("WATCH")
    expect(result.reasonCodes).toContain("HIGHER_ROLE_GATE_NOT_SATISFIED")
  })

  it("treats missing mandatory floor data as INSUFFICIENT rather than a negative role", () => {
    const result = evaluate({
      overallScore: 85,
      dimensionOverrides: { CASH_FLOW: null },
    })
    expect(result.suggestedRole).toBe("INSUFFICIENT")
    expect(result.reasonCodes).toContain("MANDATORY_ROLE_FLOOR_DATA_MISSING")
    expect(result.floorEvaluations.find(
      (item) => item.dimensionCode === "CASH_FLOW",
    )?.state).toBe("MISSING")
  })

  it("keeps valuation and momentum as cautions that do not independently change the role", () => {
    const baseline = evaluate({ overallScore: 82 })
    const cautioned = evaluate({
      overallScore: 82,
      dimensionOverrides: { VALUATION: 30, MOMENTUM: 30 },
    })
    expect(baseline.suggestedRole).toBe("CORE_CANDIDATE")
    expect(cautioned.suggestedRole).toBe("CORE_CANDIDATE")
    expect(cautioned.cautions).toEqual([
      "VALUATION_BELOW_NEUTRAL_ANCHOR",
      "MOMENTUM_BELOW_NEUTRAL_ANCHOR",
    ])
  })

  it("preserves G7 governance semantics without a second numeric penalty", () => {
    const highRisk = evaluate({
      overallScore: 82,
      governanceState: "INTERPRETATION_ONLY_HIGH_RISK",
    })
    expect(highRisk.suggestedRole).toBe("CORE_CANDIDATE")
    expect(highRisk.cautions).toContain(
      "REGULATORY_HIGH_RISK_INTERPRETATION_ONLY",
    )

    expect(evaluate({
      overallScore: 82,
      governanceState: "REVIEW_REQUIRED",
    }).suggestedRole).toBe("INSUFFICIENT")

    expect(evaluate({
      overallScore: 82,
      governanceState: "BLOCKED_REVIEW",
    }).suggestedRole).toBe("INSUFFICIENT")
  })

  it("keeps overlays context-only and unable to create an independent role", () => {
    const noOverlay = evaluate({ overallScore: 70 })
    const withOverlay = evaluate({
      overallScore: 70,
      materialOverlayPresent: true,
      emergingWatchPresent: true,
    })
    expect(withOverlay.suggestedRole).toBe(noOverlay.suggestedRole)
    expect(withOverlay.context).toEqual([
      "MATERIAL_OVERLAY_CONTEXT_ONLY",
      "EMERGING_WATCH_CONTEXT_ONLY",
    ])
    expect(PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.overlayRules).toEqual({
      materialOverlay: "CONTEXT_ONLY_NO_INDEPENDENT_ROLE",
      emergingWatch: "CONTEXT_ONLY_NUMERICALLY_EXCLUDED",
      secondRecommendationAllowed: false,
      roleOverrideAllowed: false,
      roleBlendAllowed: false,
    })
  })

  it("fails closed for a non-computable authoritative score without reconstructing from dimensions", () => {
    const result = evaluate({
      overallScore: null,
      scoreState: "SCORE_NOT_COMPUTABLE",
    })
    expect(result.suggestedRole).toBe("INSUFFICIENT")
    expect(result.overallScore).toBeNull()
    expect(result.reasonCodes).toEqual([
      "AUTHORITATIVE_SCORE_NOT_COMPUTABLE",
    ])
  })

  it("contains no extra numeric global hard blocker or downstream action behavior", () => {
    expect(
      PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.globalNumericHardBlockers,
    ).toEqual([])
    expect(
      PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.recommendationPersistenceEnabled,
    ).toBe(false)
    expect(
      PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.scorePersistenceEnabled,
    ).toBe(false)
    expect(
      PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.weightGuidanceEnabled,
    ).toBe(false)
    expect(
      PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.actionBiasEnabled,
    ).toBe(false)
    expect(
      PHARMA_V1_RECOMMENDATION_POLICY_CANDIDATE.positionSizingEnabled,
    ).toBe(false)
  })
})
