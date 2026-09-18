export const PHARMA_FCF_YIELD_METRIC_CONTRACT_VERSION =
  "PHARMA_FCF_YIELD_PERCENT_V1_PROPOSAL" as const

export interface PharmaFcfYieldMetricContract {
  readonly contractVersion: typeof PHARMA_FCF_YIELD_METRIC_CONTRACT_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly canonicalMetricCode: "FCF_YIELD_PERCENT"
  readonly legacyAliases: readonly ["FCF_YIELD"]
  readonly canonicalUnit: "PERCENT"
  readonly calculationOwner: "PORTFOLIOAI"
  readonly numerator: {
    readonly metricCode: "FREE_CASH_FLOW_ANNUAL"
    readonly formulaAuthority: "CFO_ANNUAL_MINUS_CAPEX_ANNUAL"
    readonly latestCompletedAnnualPeriodRequired: true
    readonly negativeFcfAllowedAsEvidence: true
  }
  readonly denominator: {
    readonly concept: "CURRENT_MARKET_CAP"
    readonly currentAuthoritativeMarketPriceRequired: true
    readonly providerMarketCapMayOverridePriceAuthority: false
    readonly staleMarketCapAllowed: false
  }
  readonly formula: "(FREE_CASH_FLOW_ANNUAL / CURRENT_MARKET_CAP) * 100"
  readonly negativeFcfTreatment: "PRESERVE_NEGATIVE_YIELD_DO_NOT_CLAMP_TO_ZERO"
  readonly aliasReconciliation: {
    readonly fcfYieldMapsToCanonicalPercentCode: true
    readonly duplicateObservationsMayBeDoubleCounted: false
  }
  readonly numericScoreBandsApproved: false
  readonly wholeValuationDimensionReady: false
  readonly productionMigrationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_FCF_YIELD_METRIC_CONTRACT: PharmaFcfYieldMetricContract = {
  contractVersion: PHARMA_FCF_YIELD_METRIC_CONTRACT_VERSION,
  state: "PROPOSAL_ONLY",
  canonicalMetricCode: "FCF_YIELD_PERCENT",
  legacyAliases: ["FCF_YIELD"],
  canonicalUnit: "PERCENT",
  calculationOwner: "PORTFOLIOAI",
  numerator: {
    metricCode: "FREE_CASH_FLOW_ANNUAL",
    formulaAuthority: "CFO_ANNUAL_MINUS_CAPEX_ANNUAL",
    latestCompletedAnnualPeriodRequired: true,
    negativeFcfAllowedAsEvidence: true,
  },
  denominator: {
    concept: "CURRENT_MARKET_CAP",
    currentAuthoritativeMarketPriceRequired: true,
    providerMarketCapMayOverridePriceAuthority: false,
    staleMarketCapAllowed: false,
  },
  formula: "(FREE_CASH_FLOW_ANNUAL / CURRENT_MARKET_CAP) * 100",
  negativeFcfTreatment: "PRESERVE_NEGATIVE_YIELD_DO_NOT_CLAMP_TO_ZERO",
  aliasReconciliation: {
    fcfYieldMapsToCanonicalPercentCode: true,
    duplicateObservationsMayBeDoubleCounted: false,
  },
  numericScoreBandsApproved: false,
  wholeValuationDimensionReady: false,
  productionMigrationApproved: false,
  scoreExecutionEnabled: false,
}
