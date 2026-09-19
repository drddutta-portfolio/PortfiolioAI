import { describe, expect, it } from "vitest"
import {
  calculatePharmaG7Dimension,
  calculatePharmaG7ReadOnlyPreview,
  PHARMA_G7_READ_ONLY_SCORING_ADAPTER,
  type PharmaG7DimensionAdapterInput,
  type PharmaG7DimensionCode,
} from "./pharmaG7ReadOnlyScoringAdapter"
import { PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION } from "./pharmaG7OverlayNumericModifierProposal"

const dimensions: readonly PharmaG7DimensionCode[] = [
  "QUALITY",
  "GROWTH",
  "CAPITAL_EFFICIENCY",
  "CASH_FLOW",
  "BALANCE_SHEET_CREDIT",
  "BUSINESS_DURABILITY",
  "VALUATION",
  "MOMENTUM",
  "OWNERSHIP_GOVERNANCE",
  "RISK",
]

function readyDimension(
  dimensionCode: PharmaG7DimensionCode,
  score = 70,
): PharmaG7DimensionAdapterInput {
  return {
    dimensionCode,
    methodologyState: "APPROVED_NUMERIC_CONTRACT",
    readiness: {
      applicable: true,
      profileResolved: true,
      scoreReadyCoverage: 1,
      mandatoryBlockingConditionsSatisfied: true,
      reviewBlocked: false,
      overlayReadiness: "NONE",
    },
    primaryScore: score,
    primaryScoreContractVersion: `TEST_${dimensionCode}_V1`,
    overlayParticipation: "NONE",
    overlayModifierPoints: null,
    overlayModifierContractVersion: null,
    methodologyLineage: [{
      decisionId: `TEST_${dimensionCode}`,
      contractVersion: `TEST_${dimensionCode}_V1`,
    }],
  }
}

const clearGovernance = {
  eventClass: "GOVERNANCE" as const,
  severity: "LOW" as const,
  governanceBlockedReview: false,
  affectedFacilityProductGeographyEstablished: true,
  regulatoryMateriality: "NOT_APPLICABLE" as const,
  remediationState: "NOT_APPLICABLE" as const,
  subsequentOutcomeEstablished: true,
}

describe("G7.1 read-only scoring adapter", () => {
  it("is non-persisting and cannot activate recommendations or sizing", () => {
    expect(PHARMA_G7_READ_ONLY_SCORING_ADAPTER.readOnly).toBe(true)
    expect(PHARMA_G7_READ_ONLY_SCORING_ADAPTER.nonPersisting).toBe(true)
    expect(PHARMA_G7_READ_ONLY_SCORING_ADAPTER.hiddenReweightingAllowed).toBe(false)
    expect(PHARMA_G7_READ_ONLY_SCORING_ADAPTER.scoreExecutionEnabled).toBe(false)
    expect(PHARMA_G7_READ_ONLY_SCORING_ADAPTER.persistedScoreRunEnabled).toBe(false)
    expect(PHARMA_G7_READ_ONLY_SCORING_ADAPTER.recommendationEnabled).toBe(false)
    expect(PHARMA_G7_READ_ONLY_SCORING_ADAPTER.positionSizingEnabled).toBe(false)
  })

  it("calculates a ready dimension only with an approved numeric contract", () => {
    const result = calculatePharmaG7Dimension(readyDimension("QUALITY", 73))
    expect(result.calculationState).toBe("CALCULATED")
    expect(result.finalScore).toBe(73)
    expect(result.methodologyLineage.length).toBeGreaterThan(0)
  })

  it("fails closed for VALIDATED_FAIL_CLOSED methodology even when readiness is READY", () => {
    const result = calculatePharmaG7Dimension({
      ...readyDimension("CAPITAL_EFFICIENCY"),
      methodologyState: "VALIDATED_FAIL_CLOSED",
      primaryScore: null,
      primaryScoreContractVersion: null,
    })
    expect(result.calculationState).toBe("UNAVAILABLE_METHODOLOGY")
    expect(result.finalScore).toBeNull()
    expect(result.readinessState).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("does not invent a numeric result at 60% readiness without a dimension score contract", () => {
    const result = calculatePharmaG7Dimension({
      ...readyDimension("CASH_FLOW"),
      readiness: {
        ...readyDimension("CASH_FLOW").readiness,
        scoreReadyCoverage: 0.6,
      },
      primaryScore: null,
      primaryScoreContractVersion: null,
    })
    expect(result.finalScore).toBeNull()
    expect(result.reasonCodes).toContain("APPROVED_DIMENSION_SCORE_CONTRACT_OR_RESULT_MISSING")
  })

  it("applies an eligible validated overlay modifier without creating a second score", () => {
    const result = calculatePharmaG7Dimension({
      ...readyDimension("GROWTH", 70),
      readiness: {
        ...readyDimension("GROWTH").readiness,
        overlayReadiness: "READY",
      },
      overlayParticipation: "ELIGIBLE",
      overlayModifierPoints: 2.5,
      overlayModifierContractVersion: PHARMA_G7_OVERLAY_NUMERIC_MODIFIER_VERSION,
    })
    expect(result.primaryScore).toBe(70)
    expect(result.overlayModifierPoints).toBe(2.5)
    expect(result.finalScore).toBe(72.5)
  })

  it("keeps Emerging Watch excluded from the numeric result", () => {
    const result = calculatePharmaG7Dimension({
      ...readyDimension("BUSINESS_DURABILITY", 68),
      readiness: {
        ...readyDimension("BUSINESS_DURABILITY").readiness,
        overlayReadiness: "EMERGING_WATCH",
      },
      overlayParticipation: "EMERGING_WATCH_EXCLUDED",
    })
    expect(result.calculationState).toBe("EXCLUDED_EMERGING_WATCH")
    expect(result.finalScore).toBe(68)
    expect(result.overlayModifierPoints).toBe(0)
  })

  it("blocks the overall preview when governance is blocked even if every dimension is ready", () => {
    const result = calculatePharmaG7ReadOnlyPreview({
      profileResolved: true,
      commonCoreState: "READY",
      primaryState: "READY",
      overallScoreReadyCoverage: 1,
      governanceInput: {
        ...clearGovernance,
        governanceBlockedReview: true,
      },
      dimensions: dimensions.map((code) => readyDimension(code)),
    })
    expect(result.overallPreviewState).toBe("BLOCKED_REVIEW")
    expect(result.overallScore).toBeNull()
  })

  it("does not reweight around an unavailable weighted dimension", () => {
    const inputs = dimensions.map((code) => readyDimension(code))
    const momentumIndex = inputs.findIndex((item) => item.dimensionCode === "MOMENTUM")
    inputs[momentumIndex] = {
      ...inputs[momentumIndex]!,
      methodologyState: "SUBPROFILE_THRESHOLDS_REQUIRED",
      primaryScore: null,
      primaryScoreContractVersion: null,
    }
    const result = calculatePharmaG7ReadOnlyPreview({
      profileResolved: true,
      commonCoreState: "READY",
      primaryState: "READY",
      overallScoreReadyCoverage: 0.92,
      governanceInput: clearGovernance,
      dimensions: inputs,
    })
    expect(result.overallScore).toBeNull()
    expect(result.reasonCodes).toContain("ONE_OR_MORE_WEIGHTED_DIMENSIONS_HAVE_NO_NUMERIC_RESULT")
  })

  it("calculates the overall preview with the fixed 100% dimension weights only when all ten dimensions are numeric", () => {
    const result = calculatePharmaG7ReadOnlyPreview({
      profileResolved: true,
      commonCoreState: "READY",
      primaryState: "READY",
      overallScoreReadyCoverage: 1,
      governanceInput: clearGovernance,
      dimensions: dimensions.map((code) => readyDimension(code, 70)),
    })
    expect(result.overallPreviewState).toBe("READY")
    expect(result.overallScore).toBe(70)
    expect(result.scoreExecutionEnabled).toBe(false)
    expect(result.persistedScoreRunEnabled).toBe(false)
  })

  it("fails closed when the weighted dimension set is incomplete", () => {
    const result = calculatePharmaG7ReadOnlyPreview({
      profileResolved: true,
      commonCoreState: "READY",
      primaryState: "READY",
      overallScoreReadyCoverage: 1,
      governanceInput: clearGovernance,
      dimensions: dimensions.slice(0, 9).map((code) => readyDimension(code)),
    })
    expect(result.overallScore).toBeNull()
    expect(result.reasonCodes).toContain("WEIGHTED_DIMENSION_SET_INCOMPLETE")
  })
})
