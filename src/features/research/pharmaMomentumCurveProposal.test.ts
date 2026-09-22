import { describe, expect, it } from "vitest"
import { PHARMA_MOMENTUM_CURVE_PROPOSAL } from "./pharmaMomentumCurveProposal"

describe("PHARMA Momentum curve proposal", () => {
  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.numericCurveReady).toBe(false)
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.activationApproved).toBe(false)
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.scoreExecutionEnabled).toBe(false)
  })

  it("targets canonical Momentum but fails closed on the missing Pharma parent metric contract", () => {
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.canonicalDimension).toBe("MOMENTUM")
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.parentMetricContractState).toBe(
      "MISSING_DEDICATED_PHARMA_PARENT_CONTRACT",
    )
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.parentContractRequiredBeforeActivation).toBe(true)
  })

  it("uses the existing deterministic market-momentum evidence lanes", () => {
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.marketEvidence.candidateMetrics).toEqual([
      "PRICE_MOMENTUM_12M",
      "PRICE_MOMENTUM_6M",
      "RELATIVE_STRENGTH_12M",
    ])
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.marketEvidence.rawAuthority).toBe("MARKET_PRICE_HISTORY")
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.marketEvidence.derivedEvidenceStore).toBe("MARKET_METRIC_OBSERVATIONS")
  })

  it("does not inherit BANK_NBFC weights or benchmark assumptions", () => {
    const separation = PHARMA_MOMENTUM_CURVE_PROPOSAL.bankPilotSeparation
    expect(separation.bankTwelveMonthWeightInherited).toBe(false)
    expect(separation.bankSixMonthWeightInherited).toBe(false)
    expect(separation.niftyBankBenchmarkInherited).toBe(false)
    expect(separation.trendlyneTechnicalScoreAllowed).toBe(false)
  })

  it("requires an approved Pharma benchmark before relative-strength scoring", () => {
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.benchmarkContractState).toBe("PHARMA_BENCHMARK_UNAPPROVED")
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.benchmarkRequiredBeforeRelativeStrengthScoring).toBe(true)
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.missingRelativeStrengthMayBecomeNeutral).toBe(false)
  })

  it("does not invent component weights or numeric bands", () => {
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.methodologyShape.componentWeightsState).toBe("UNAPPROVED")
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.methodologyShape.absoluteMomentumBandsState).toBe("UNAPPROVED")
    expect(PHARMA_MOMENTUM_CURVE_PROPOSAL.methodologyShape.relativeStrengthBandsState).toBe("UNAPPROVED")
  })
})
