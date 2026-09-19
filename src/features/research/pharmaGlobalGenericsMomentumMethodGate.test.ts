import { describe, expect, it } from "vitest"
import { PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE } from "./pharmaGlobalGenericsMomentumMethodGate"

describe("PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE", () => {
  it("preserves the missing dedicated Pharma parent momentum contract blocker", () => {
    const gate = PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE

    expect(gate.parentMetricContractState).toBe("MISSING_DEDICATED_PHARMA_PARENT_CONTRACT")
    expect(gate.parentContractRequiredBeforeActivation).toBe(true)
  })

  it("requires an approved Pharma benchmark before relative-strength scoring", () => {
    const gate = PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE

    expect(gate.benchmarkContractState).toBe("PHARMA_BENCHMARK_UNAPPROVED")
    expect(gate.benchmarkRequiredBeforeRelativeStrengthScoring).toBe(true)
    expect(gate.globalGenericsSpecificDecisions.approvedBenchmark).toBeNull()
  })

  it("reuses only the evidence identity and definitions", () => {
    const shape = PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE.reusableEvidenceShape

    expect(shape.absoluteMomentum12mRequired).toBe(true)
    expect(shape.absoluteMomentum6mRequired).toBe(true)
    expect(shape.benchmarkRelativeStrength12mRequired).toBe(true)
    expect(shape.rawAuthority).toBe("MARKET_PRICE_HISTORY")
    expect(shape.derivedEvidenceStore).toBe("MARKET_METRIC_OBSERVATIONS")
    expect(shape.absoluteMomentumDefinition).toBe("CLOSE_TO_CLOSE_RETURN_WITH_14_DAY_LOOKBACK_TOLERANCE")
    expect(shape.relativeStrengthDefinition).toBe("STOCK_RETURN_MINUS_APPROVED_BENCHMARK_RETURN")
  })

  it("does not inherit BANK_NBFC pilot weights, benchmark, or provider technical score", () => {
    const boundary = PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE.bankPilotSeparation

    expect(boundary.bankTwelveMonthWeightInherited).toBe(false)
    expect(boundary.bankSixMonthWeightInherited).toBe(false)
    expect(boundary.niftyBankBenchmarkInherited).toBe(false)
    expect(boundary.trendlyneTechnicalScoreAllowed).toBe(false)
  })

  it("keeps Global Generics numeric momentum choices unapproved", () => {
    const decisions = PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE.globalGenericsSpecificDecisions

    expect(decisions.componentWeightsApproved).toBe(false)
    expect(decisions.absoluteMomentumBandsApproved).toBe(false)
    expect(decisions.relativeStrengthBandsApproved).toBe(false)
    expect(decisions.finalAggregationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE.missingRelativeStrengthMayBecomeNeutral).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE.numericMomentumCurveReady).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE.scoreExecutionEnabled).toBe(false)
  })
})
