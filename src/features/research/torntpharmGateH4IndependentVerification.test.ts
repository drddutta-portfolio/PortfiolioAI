import { describe, expect, it } from "vitest"
import {
  TORNTPHARM_GATE_H4_INDEPENDENT_VERIFICATION,
  TORNTPHARM_GATE_H4_VALUATION_HAND_FIXTURE,
} from "./torntpharmGateH4IndependentVerification"

describe("Gate H H4 independent TORNTPHARM verification", () => {
  const result = TORNTPHARM_GATE_H4_INDEPENDENT_VERIFICATION

  it("independently reconstructs all ten H2-locked dimension scores from raw evidence and approved contracts", () => {
    const dimensions = result.handCalculation.dimensions
    expect(dimensions.QUALITY.finalScore).toBe(92)
    expect(dimensions.GROWTH.finalScore).toBe(78.25)
    expect(dimensions.CAPITAL_EFFICIENCY.finalScore).toBe(79)
    expect(dimensions.CASH_FLOW.finalScore).toBe(93.6)
    expect(dimensions.BALANCE_SHEET_CREDIT.finalScore).toBe(65)
    expect(dimensions.BUSINESS_DURABILITY.finalScore).toBe(75)
    expect(dimensions.VALUATION.finalScore).toBe(30)
    expect(dimensions.MOMENTUM.finalScore).toBe(95)
    expect(dimensions.OWNERSHIP_GOVERNANCE.finalScore).toBe(70)
    expect(dimensions.RISK.finalScore).toBe(80)
  })

  it("recomputes the hand-weighted contributions and exact overall score without denominator renormalization", () => {
    expect(result.handCalculation.fixedWeights).toEqual({
      QUALITY: 13,
      GROWTH: 15,
      CAPITAL_EFFICIENCY: 10,
      CASH_FLOW: 10,
      BALANCE_SHEET_CREDIT: 10,
      BUSINESS_DURABILITY: 10,
      VALUATION: 12,
      MOMENTUM: 8,
      OWNERSHIP_GOVERNANCE: 6,
      RISK: 6,
    })
    expect(result.handCalculation.weightedContributions).toEqual({
      QUALITY: 11.96,
      GROWTH: 11.7375,
      CAPITAL_EFFICIENCY: 7.9,
      CASH_FLOW: 9.36,
      BALANCE_SHEET_CREDIT: 6.5,
      BUSINESS_DURABILITY: 7.5,
      VALUATION: 3.6,
      MOMENTUM: 7.6,
      OWNERSHIP_GOVERNANCE: 4.2,
      RISK: 4.8,
    })
    expect(result.handCalculation.overallScore).toBe(75.1575)
    expect(result.adapterCrossCheck.exactMatch).toBe(true)
    expect(result.adapterCrossCheck.adapterOverallScore).toBe(75.1575)
  })

  it("verifies the key derived statistics and scoring bands independently", () => {
    const dimensions = result.handCalculation.dimensions

    expect(dimensions.QUALITY.rawObservationCount).toBe(8)
    expect(dimensions.QUALITY.componentScores).toEqual({
      level: 100,
      stability: 100,
      trend: 60,
    })

    expect(dimensions.GROWTH.derivedStatistics).toEqual({
      medianLatest4ComparableQuartersPercent: 13,
      positiveQuartersOutOfLatest4: 4,
      latestMinusMedianPrior3PercentagePoints: 3,
    })
    expect(dimensions.GROWTH.componentScores).toEqual({
      level: 70,
      consistency: 100,
      trend: 75,
    })

    expect(dimensions.CAPITAL_EFFICIENCY.derivedStatistics).toEqual({
      medianRocePercent: 28,
      roceIqrPercentagePoints: 2.5,
      latestMinusPriorMedianPercentagePoints: -3.5,
    })
    expect(dimensions.CAPITAL_EFFICIENCY.componentScores).toEqual({
      level: 85,
      stability: 100,
      trend: 40,
    })

    expect(dimensions.BALANCE_SHEET_CREDIT.derivedStatistics).toEqual({
      medianNetDebtEbitda: 0.9,
      medianInterestCoverage: 9.26,
      latestMinusPriorMedianNetDebtEbitda: 1.55,
    })
    expect(dimensions.BALANCE_SHEET_CREDIT.componentScores).toEqual({
      leverage: 80,
      interestCoverage: 70,
      trendResilience: 20,
    })
  })

  it("independently traces the M&A transition valuation to 30 without neutral FCF substitution", () => {
    const valuation = result.handCalculation.dimensions.VALUATION
    expect(TORNTPHARM_GATE_H4_VALUATION_HAND_FIXTURE.selfHistoryImpliedUpsidePercent).toBe(-15.9)
    expect(valuation.peerPeMedian).toBe(35.82)
    expect(valuation.peerEvEbitdaMedian).toBe(17.92)
    expect(valuation.componentScores).toEqual({
      selfHistory: 40,
      peerPe: 20,
      peerEvEbitda: 20,
      peerRelative: 20,
      fcfCorroborationWeight: 0,
    })
    expect(valuation.finalScore).toBe(30)
  })

  it("verifies Global Generics below-threshold treatment and CDMO Emerging exclusion", () => {
    expect(result.overlayVerification.reviewedBusinessMaterialityState).toBe("MATERIAL")
    expect(result.overlayVerification.economicMaterialityPercent).toBe(12.05)
    expect(result.overlayVerification.numericThresholdPercent).toBe(15)
    expect(result.overlayVerification.belowNumericThreshold).toBe(true)
    expect(result.overlayVerification.numericModifierApplied).toBe(false)
    expect(result.overlayVerification.numericModifier).toBeNull()
    expect(result.overlayVerification.secondIndependentStockScore).toBeNull()
    expect(result.overlayVerification.emergingWatchNumericParticipation).toBe(false)
  })

  it("independently resolves governance CLEAR while retaining the historical event and no second penalty", () => {
    expect(result.governanceVerification.independentlyResolvedState).toBe("CLEAR")
    expect(result.governanceVerification.historicalEventRetained).toBe(true)
    expect(result.governanceVerification.numericPenalty).toBeNull()
    expect(result.governanceVerification.overallScoreCap).toBeNull()
    expect(result.governanceVerification.hiddenDoubleCountingAllowed).toBe(false)
  })

  it("proves anti-leakage invariants", () => {
    expect(result.antiLeakage).toEqual({
      bankNbfcTokenAbsent: true,
      niftyBankTokenAbsent: true,
      niftyPharmaBenchmarkRetained: true,
      globalGenericsSecondScoreAbsent: true,
      cdmoEmergingNumericParticipationAbsent: true,
      governanceSecondPenaltyAbsent: true,
      missingEvidenceNeutralizationAbsent: true,
      hiddenRenormalizationAbsent: true,
    })
  })

  it("preserves explicit evidence and methodology lineage for every weighted dimension", () => {
    for (const lineage of Object.values(result.evidenceLineage)) {
      expect(lineage.length).toBeGreaterThan(0)
    }
    expect(result.methodologyLineage.overallWeights).toBe(
      "PHARMA_V1_GATE_G_SCORING_METHOD_PROPOSAL_V1",
    )
    expect(result.methodologyLineage.VALUATION).toContain(
      "PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_V1_OWNER_APPROVED",
    )
    expect(result.methodologyLineage.overlay).toBe(
      "PHARMA_V1_OVERLAY_MODIFIER_V1_PROPOSAL",
    )
  })

  it("proves deterministic repeated calculation and preservation of the read-only safety boundary", () => {
    expect(result.determinism.repeatedCalculationIdentical).toBe(true)
    expect(result.determinism.firstOverallScore).toBe(75.1575)
    expect(result.determinism.secondOverallScore).toBe(75.1575)
    expect(result.safety).toEqual({
      readOnly: true,
      nonPersisting: true,
      persistedScoreRunEnabled: false,
      recommendationEnabled: false,
      positionSizingEnabled: false,
    })
  })
})
