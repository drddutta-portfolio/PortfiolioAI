import { describe, expect, it } from "vitest"
import {
  PHARMA_G7_RESEARCH_GAP_REGISTER,
  PHARMA_G7_VALIDATION_INVARIANTS,
} from "./pharmaG7ValidationAndResearchGapRegister"
import {
  calculatePharmaG7ReadOnlyPreview,
  type PharmaG7DimensionAdapterInput,
  type PharmaG7DimensionCode,
} from "./pharmaG7ReadOnlyScoringAdapter"
import { combinePharmaG7OverlayModifiers } from "./pharmaG7OverlayNumericModifierProposal"

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

describe("G7.3 validation invariants and research-gap register", () => {
  it("keeps all core leakage and persistence boundaries closed", () => {
    expect(PHARMA_G7_VALIDATION_INVARIANTS.hiddenReweightingAllowed).toBe(false)
    expect(PHARMA_G7_VALIDATION_INVARIANTS.overlayIndependentCapStackingAllowed).toBe(false)
    expect(PHARMA_G7_VALIDATION_INVARIANTS.governanceHiddenDoubleCountingAllowed).toBe(false)
    expect(PHARMA_G7_VALIDATION_INVARIANTS.bankNbfcFallbackAllowed).toBe(false)
    expect(PHARMA_G7_VALIDATION_INVARIANTS.domesticThresholdTransferAllowed).toBe(false)
    expect(PHARMA_G7_VALIDATION_INVARIANTS.emergingWatchMayEnterOverlayEvidencePool).toBe(false)
    expect(PHARMA_G7_VALIDATION_INVARIANTS.emergingWatchMayEnterScore).toBe(false)
    expect(PHARMA_G7_VALIDATION_INVARIANTS.secondOverlayStockScoreAllowed).toBe(false)
    expect(PHARMA_G7_VALIDATION_INVARIANTS.scorePersistenceAllowed).toBe(false)
  })

  it("enforces the one combined overlay cap", () => {
    expect(combinePharmaG7OverlayModifiers([8, 7])).toBe(10)
    expect(combinePharmaG7OverlayModifiers([-8, -7])).toBe(-10)
  })

  it("proves changing an unavailable weighted input cannot trigger denominator renormalization", () => {
    const base = dimensions.map((code) => readyDimension(code, 70))
    const blocked = base.map((item) =>
      item.dimensionCode === "MOMENTUM"
        ? {
            ...item,
            methodologyState: "SUBPROFILE_THRESHOLDS_REQUIRED" as const,
            primaryScore: null,
            primaryScoreContractVersion: null,
          }
        : item,
    )

    const result = calculatePharmaG7ReadOnlyPreview({
      profileResolved: true,
      commonCoreState: "READY",
      primaryState: "READY",
      overallScoreReadyCoverage: 0.92,
      governanceInput: clearGovernance,
      dimensions: blocked,
    })

    expect(result.overallScore).toBeNull()
    expect(result.reasonCodes).toContain("ONE_OR_MORE_WEIGHTED_DIMENSIONS_HAVE_NO_NUMERIC_RESULT")
  })

  it("registers the known TORNTPHARM scoring blockers explicitly", () => {
    const ids = PHARMA_G7_RESEARCH_GAP_REGISTER.torntpharmGaps.map((gap) => gap.gapId)
    expect(ids).toContain("G7-GAP-TORN-GOVERNANCE-RUNTIME")
    expect(ids).toContain("G7-GAP-DOMESTIC-BUSINESS-DURABILITY")
    expect(ids).toContain("G7-GAP-DOMESTIC-ROCE")
    expect(ids).toContain("G7-GAP-DOMESTIC-CASH-CONVERSION")
    expect(ids).toContain("G7-GAP-DOMESTIC-BALANCE-SHEET")
    expect(ids).toContain("G7-GAP-DOMESTIC-OWNERSHIP-GOVERNANCE")
    expect(ids).toContain("G7-GAP-PHARMA-RISK-BANDS")
    expect(ids).toContain("G7-GAP-PHARMA-MOMENTUM")
    expect(PHARMA_G7_RESEARCH_GAP_REGISTER.torntpharmGaps.every(
      (gap) => gap.blocksTorntpharmOverallPreview,
    )).toBe(true)
  })

  it("moves remaining non-reference Primary methodology into controlled expansion instead of borrowing thresholds", () => {
    const gaps = PHARMA_G7_RESEARCH_GAP_REGISTER.controlledExpansionGaps
    expect(gaps.length).toBeGreaterThan(0)
    expect(new Set(gaps.map((gap) => gap.subprofile))).toEqual(new Set([
      "API_BULK_DRUGS",
      "CDMO_CRAMS",
      "BIOPHARMA_BIOSIMILARS",
    ]))
    expect(gaps.every((gap) => gap.futureStage === "CONTROLLED_EXPANSION")).toBe(true)
    expect(gaps.every((gap) => gap.blocksSubprofileAsPrimary)).toBe(true)
    expect(gaps.every((gap) => !gap.blocksTorntpharmOverallPreview)).toBe(true)
  })

  it("keeps the gap register non-executing and non-persisting", () => {
    expect(PHARMA_G7_RESEARCH_GAP_REGISTER.scoreExecutionEnabled).toBe(false)
    expect(PHARMA_G7_RESEARCH_GAP_REGISTER.persistedScoreRunEnabled).toBe(false)
  })
})
