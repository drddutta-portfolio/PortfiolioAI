import { describe, expect, it } from "vitest"
import {
  evaluateDomesticBalanceSheetCredit,
  evaluateDomesticBusinessDurability,
  evaluateDomesticCapitalEfficiency,
  evaluateDomesticCashFlow,
  evaluateDomesticMomentum,
  evaluateDomesticOwnershipGovernance,
  evaluateDomesticRisk,
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY,
} from "./pharmaDomesticGateGFinal2NumericMethodology"

describe("Domestic G-FINAL-2 numeric methodology candidate", () => {
  it("remains owner-reviewable and non-executing", () => {
    const contract = PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY
    expect(contract.state).toBe("READY_FOR_OWNER_METHODOLOGY_REVIEW")
    expect(contract.ownerApprovalRequired).toBe(true)
    expect(contract.activationApproved).toBe(false)
    expect(contract.scoreExecutionEnabled).toBe(false)
    expect(contract.persistedScoreRunEnabled).toBe(false)
    expect(contract.recommendationEnabled).toBe(false)
    expect(contract.positionSizingEnabled).toBe(false)
  })

  it("uses NIFTY Pharma only for sector-relative momentum and volatility context", () => {
    expect(PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.benchmark).toEqual({
      code: "NIFTY_PHARMA",
      use: "SECTOR_RELATIVE_MOMENTUM_AND_VOLATILITY_CONTEXT",
    })
  })

  it("evaluates Capital Efficiency deterministically", () => {
    expect(evaluateDomesticCapitalEfficiency({
      medianRocePercent: 28,
      roceIqrPercentagePoints: 3.5,
      latestMinusPriorMedianPercentagePoints: -3,
    })).toEqual({
      levelScore: 85,
      stabilityScore: 80,
      trendScore: 40,
      combinedScore: 75,
    })
  })

  it("evaluates Cash Flow deterministically", () => {
    expect(evaluateDomesticCashFlow({
      medianCfoToPat: 0.95,
      medianFcfToPat: 0.85,
      positiveFcfYearsOutOf3: 3,
      latestCfoToPatMinusPriorMedian: 0.08,
    })).toEqual({
      cfoToPatScore: 85,
      fcfToPatScore: 85,
      consistencyTrendScore: 92,
      combinedScore: 86.4,
    })
  })

  it("evaluates Balance Sheet / Credit deterministically", () => {
    expect(evaluateDomesticBalanceSheetCredit({
      medianNetDebtEbitda: 0.9,
      medianInterestCoverage: 10.5,
      latestMinusPriorMedianNetDebtEbitda: 1,
    })).toEqual({
      leverageScore: 80,
      interestCoverageScore: 85,
      trendResilienceScore: 20,
      combinedScore: 69.5,
    })
  })

  it("aggregates Business Durability only from reviewed normalized components", () => {
    expect(evaluateDomesticBusinessDurability({
      brandTherapyLeadershipScore: 90,
      fieldForceProductivityScore: 80,
      rndProductivityScore: 70,
      pipelineCorporateExecutionScore: 60,
    })).toEqual({ combinedScore: 77.5 })
  })

  it("evaluates Momentum with absolute and NIFTY Pharma-relative components", () => {
    expect(evaluateDomesticMomentum({
      absolute12mPercent: 18,
      absolute6mPercent: 12,
      relativeStrength12mPercent: 8,
    })).toEqual({
      absolute12mScore: 80,
      absolute6mScore: 80,
      relativeStrength12mScore: 80,
      combinedScore: 80,
    })
  })

  it("aggregates Ownership / Governance without re-penalizing G4 events", () => {
    expect(
      PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.ownershipGovernance
        .g4ConsumedEventsMayReduceDimensionScore,
    ).toBe(false)

    expect(evaluateDomesticOwnershipGovernance({
      ownershipStabilityScore: 80,
      pledgeControlRiskScore: 90,
      nonG4GovernanceContextScore: 70,
    })).toEqual({ combinedScore: 81.5 })
  })

  it("evaluates Risk with governance-runtime regulatory context and sector-relative volatility", () => {
    expect(
      PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.risk
        .g4ConsumedEventsMayReceiveSecondPenalty,
    ).toBe(false)

    expect(evaluateDomesticRisk({
      regulatoryContextScore: 80,
      maxDrawdown1YPercent: -22,
      relativeVolatilityRatio: 0.95,
    })).toEqual({
      regulatoryContextScore: 80,
      maxDrawdownScore: 80,
      relativeVolatilityScore: 80,
      combinedScore: 80,
    })
  })

  it("fails invalid risk and normalized component inputs closed", () => {
    expect(() => evaluateDomesticRisk({
      regulatoryContextScore: 80,
      maxDrawdown1YPercent: 4,
      relativeVolatilityRatio: 1,
    })).toThrow("maxDrawdown1YPercent")

    expect(() => evaluateDomesticBusinessDurability({
      brandTherapyLeadershipScore: 101,
      fieldForceProductivityScore: 80,
      rndProductivityScore: 70,
      pipelineCorporateExecutionScore: 60,
    })).toThrow("between 0 and 100")
  })
})
