import { PHARMA_FCF_YIELD_METRIC_CONTRACT } from "./pharmaFcfYieldMetricContract"

export const PHARMA_FCF_YIELD_DERIVATION_VERSION =
  "PHARMA_FCF_YIELD_DERIVATION_V1_PROPOSAL" as const

export interface PharmaFcfYieldDerivationInput {
  readonly freeCashFlowAnnual: number
  readonly currentMarketCap: number
}

export interface PharmaFcfYieldDerivationResult {
  readonly version: typeof PHARMA_FCF_YIELD_DERIVATION_VERSION
  readonly metricCode: "FCF_YIELD_PERCENT"
  readonly unit: "PERCENT"
  readonly numericValue: number
  readonly formula: "(FREE_CASH_FLOW_ANNUAL / CURRENT_MARKET_CAP) * 100"
  readonly state: "PROPOSAL_ONLY"
}

export function derivePharmaFcfYieldPercent(
  input: PharmaFcfYieldDerivationInput,
): PharmaFcfYieldDerivationResult | null {
  if (!Number.isFinite(input.freeCashFlowAnnual)) return null
  if (!Number.isFinite(input.currentMarketCap) || input.currentMarketCap <= 0) return null

  const numericValue = (input.freeCashFlowAnnual / input.currentMarketCap) * 100
  if (!Number.isFinite(numericValue)) return null

  return {
    version: PHARMA_FCF_YIELD_DERIVATION_VERSION,
    metricCode: PHARMA_FCF_YIELD_METRIC_CONTRACT.canonicalMetricCode,
    unit: PHARMA_FCF_YIELD_METRIC_CONTRACT.canonicalUnit,
    numericValue,
    formula: PHARMA_FCF_YIELD_METRIC_CONTRACT.formula,
    state: "PROPOSAL_ONLY",
  }
}
