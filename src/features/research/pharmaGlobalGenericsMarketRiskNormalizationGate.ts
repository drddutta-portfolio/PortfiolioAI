export const PHARMA_GLOBAL_GENERICS_MARKET_RISK_NORMALIZATION_GATE_VERSION =
  "PHARMA_GLOBAL_GENERICS_MARKET_RISK_NORMALIZATION_GATE_V1_PROPOSAL" as const

export interface PharmaGlobalGenericsMarketRiskNormalizationGateContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_MARKET_RISK_NORMALIZATION_GATE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "RISK"
  readonly metrics: {
    readonly maxDrawdown1Y: {
      readonly metricCode: "MAX_DRAWDOWN_1Y"
      readonly definition: "TRAILING_1Y_MAX_PEAK_TO_TROUGH_DAILY_CLOSE"
      readonly direction: "LOWER_ABSOLUTE_LOSS_BETTER"
      readonly rawAuthority: "MARKET_PRICE_HISTORY"
      readonly derivedStore: "MARKET_METRIC_OBSERVATIONS"
      readonly expectedUnit: "PERCENT"
      readonly numericBandsApproved: false
    }
    readonly volatility1Y: {
      readonly metricCode: "VOLATILITY_1Y"
      readonly definition: "ANNUALIZED_SAMPLE_STDDEV_DAILY_LOG_RETURNS_SQRT_252"
      readonly direction: "LOWER_BETTER_WITH_CONTEXT"
      readonly rawAuthority: "MARKET_PRICE_HISTORY"
      readonly derivedStore: "MARKET_METRIC_OBSERVATIONS"
      readonly expectedUnit: "PERCENT"
      readonly numericBandsApproved: false
      readonly peerOrBenchmarkContextRequired: true
      readonly peerOrBenchmarkContractApproved: false
    }
  }
  readonly methodologyBoundary: {
    readonly bankNbfcThresholdsInherited: false
    readonly absoluteDrawdownBandsApproved: false
    readonly absoluteVolatilityBandsApproved: false
    readonly relativeVolatilityBandsApproved: false
    readonly benchmarkApproved: false
    readonly componentWeightsApproved: false
    readonly missingEvidenceMayBecomeNeutral: false
    readonly wholeRiskDimensionReady: false
  }
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_MARKET_RISK_NORMALIZATION_GATE:
  PharmaGlobalGenericsMarketRiskNormalizationGateContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_MARKET_RISK_NORMALIZATION_GATE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "RISK",
    metrics: {
      maxDrawdown1Y: {
        metricCode: "MAX_DRAWDOWN_1Y",
        definition: "TRAILING_1Y_MAX_PEAK_TO_TROUGH_DAILY_CLOSE",
        direction: "LOWER_ABSOLUTE_LOSS_BETTER",
        rawAuthority: "MARKET_PRICE_HISTORY",
        derivedStore: "MARKET_METRIC_OBSERVATIONS",
        expectedUnit: "PERCENT",
        numericBandsApproved: false,
      },
      volatility1Y: {
        metricCode: "VOLATILITY_1Y",
        definition: "ANNUALIZED_SAMPLE_STDDEV_DAILY_LOG_RETURNS_SQRT_252",
        direction: "LOWER_BETTER_WITH_CONTEXT",
        rawAuthority: "MARKET_PRICE_HISTORY",
        derivedStore: "MARKET_METRIC_OBSERVATIONS",
        expectedUnit: "PERCENT",
        numericBandsApproved: false,
        peerOrBenchmarkContextRequired: true,
        peerOrBenchmarkContractApproved: false,
      },
    },
    methodologyBoundary: {
      bankNbfcThresholdsInherited: false,
      absoluteDrawdownBandsApproved: false,
      absoluteVolatilityBandsApproved: false,
      relativeVolatilityBandsApproved: false,
      benchmarkApproved: false,
      componentWeightsApproved: false,
      missingEvidenceMayBecomeNeutral: false,
      wholeRiskDimensionReady: false,
    },
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export type PharmaGlobalGenericsMarketRiskEvidenceState =
  | "READY_FOR_METHODOLOGY"
  | "INSUFFICIENT_EVIDENCE"
  | "REVIEW_REQUIRED"

export interface PharmaGlobalGenericsMarketRiskEvidenceInput {
  readonly maxDrawdown1YPercent: number | null
  readonly volatility1YPercent: number | null
}

export function assessGlobalGenericsMarketRiskEvidence(
  input: PharmaGlobalGenericsMarketRiskEvidenceInput,
): PharmaGlobalGenericsMarketRiskEvidenceState {
  if (input.maxDrawdown1YPercent === null || input.volatility1YPercent === null) {
    return "INSUFFICIENT_EVIDENCE"
  }

  if (
    !Number.isFinite(input.maxDrawdown1YPercent)
    || !Number.isFinite(input.volatility1YPercent)
    || input.maxDrawdown1YPercent > 0
    || input.maxDrawdown1YPercent < -100
    || input.volatility1YPercent < 0
  ) {
    return "REVIEW_REQUIRED"
  }

  return "READY_FOR_METHODOLOGY"
}
