import { describe, expect, it } from "vitest"
import { PHARMA_FCF_YIELD_METRIC_CONTRACT } from "./pharmaFcfYieldMetricContract"

describe("PHARMA FCF yield metric contract", () => {
  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.productionMigrationApproved).toBe(false)
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.scoreExecutionEnabled).toBe(false)
  })

  it("selects one canonical percent metric identity", () => {
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.canonicalMetricCode).toBe("FCF_YIELD_PERCENT")
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.legacyAliases).toEqual(["FCF_YIELD"])
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.canonicalUnit).toBe("PERCENT")
  })

  it("uses the reviewed PortfolioAI annual free-cash-flow numerator", () => {
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.numerator.metricCode).toBe("FREE_CASH_FLOW_ANNUAL")
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.numerator.formulaAuthority).toBe(
      "CFO_ANNUAL_MINUS_CAPEX_ANNUAL",
    )
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.numerator.latestCompletedAnnualPeriodRequired).toBe(true)
  })

  it("requires current market authority and refuses stale/provider override semantics", () => {
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.denominator.currentAuthoritativeMarketPriceRequired).toBe(true)
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.denominator.providerMarketCapMayOverridePriceAuthority).toBe(false)
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.denominator.staleMarketCapAllowed).toBe(false)
  })

  it("preserves negative FCF yield rather than manufacturing neutrality", () => {
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.numerator.negativeFcfAllowedAsEvidence).toBe(true)
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.negativeFcfTreatment).toBe(
      "PRESERVE_NEGATIVE_YIELD_DO_NOT_CLAMP_TO_ZERO",
    )
  })

  it("reconciles the legacy alias without permitting double counting", () => {
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.aliasReconciliation.fcfYieldMapsToCanonicalPercentCode).toBe(true)
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.aliasReconciliation.duplicateObservationsMayBeDoubleCounted).toBe(false)
  })

  it("does not approve numeric score bands or the whole Valuation dimension", () => {
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.numericScoreBandsApproved).toBe(false)
    expect(PHARMA_FCF_YIELD_METRIC_CONTRACT.wholeValuationDimensionReady).toBe(false)
  })
})
