import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_MARKET_RISK_NORMALIZATION_GATE,
  assessGlobalGenericsMarketRiskEvidence,
} from "./pharmaGlobalGenericsMarketRiskNormalizationGate"

describe("PHARMA_GLOBAL_GENERICS_MARKET_RISK_NORMALIZATION_GATE", () => {
  it("freezes drawdown and volatility identities without approving numeric bands", () => {
    const gate = PHARMA_GLOBAL_GENERICS_MARKET_RISK_NORMALIZATION_GATE

    expect(gate.metrics.maxDrawdown1Y.metricCode).toBe("MAX_DRAWDOWN_1Y")
    expect(gate.metrics.maxDrawdown1Y.definition).toBe("TRAILING_1Y_MAX_PEAK_TO_TROUGH_DAILY_CLOSE")
    expect(gate.metrics.maxDrawdown1Y.numericBandsApproved).toBe(false)

    expect(gate.metrics.volatility1Y.metricCode).toBe("VOLATILITY_1Y")
    expect(gate.metrics.volatility1Y.definition).toBe("ANNUALIZED_SAMPLE_STDDEV_DAILY_LOG_RETURNS_SQRT_252")
    expect(gate.metrics.volatility1Y.numericBandsApproved).toBe(false)
  })

  it("does not inherit BANK_NBFC thresholds or silently choose a benchmark", () => {
    const boundary = PHARMA_GLOBAL_GENERICS_MARKET_RISK_NORMALIZATION_GATE.methodologyBoundary

    expect(boundary.bankNbfcThresholdsInherited).toBe(false)
    expect(boundary.absoluteDrawdownBandsApproved).toBe(false)
    expect(boundary.absoluteVolatilityBandsApproved).toBe(false)
    expect(boundary.relativeVolatilityBandsApproved).toBe(false)
    expect(boundary.benchmarkApproved).toBe(false)
    expect(boundary.componentWeightsApproved).toBe(false)
    expect(boundary.wholeRiskDimensionReady).toBe(false)
  })

  it("fails closed when either market-risk input is missing", () => {
    expect(assessGlobalGenericsMarketRiskEvidence({
      maxDrawdown1YPercent: null,
      volatility1YPercent: 31,
    })).toBe("INSUFFICIENT_EVIDENCE")

    expect(assessGlobalGenericsMarketRiskEvidence({
      maxDrawdown1YPercent: -24,
      volatility1YPercent: null,
    })).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("requires review for invalid drawdown or volatility semantics", () => {
    expect(assessGlobalGenericsMarketRiskEvidence({
      maxDrawdown1YPercent: 4,
      volatility1YPercent: 25,
    })).toBe("REVIEW_REQUIRED")

    expect(assessGlobalGenericsMarketRiskEvidence({
      maxDrawdown1YPercent: -120,
      volatility1YPercent: 25,
    })).toBe("REVIEW_REQUIRED")

    expect(assessGlobalGenericsMarketRiskEvidence({
      maxDrawdown1YPercent: -30,
      volatility1YPercent: -1,
    })).toBe("REVIEW_REQUIRED")
  })

  it("marks structurally valid evidence ready only for later methodology", () => {
    expect(assessGlobalGenericsMarketRiskEvidence({
      maxDrawdown1YPercent: -32.5,
      volatility1YPercent: 28.4,
    })).toBe("READY_FOR_METHODOLOGY")
  })
})
