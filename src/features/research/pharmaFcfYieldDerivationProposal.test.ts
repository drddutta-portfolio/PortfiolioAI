import { describe, expect, it } from "vitest"
import { derivePharmaFcfYieldPercent } from "./pharmaFcfYieldDerivationProposal"

describe("PHARMA FCF yield derivation proposal", () => {
  it("derives canonical percent yield from annual FCF and current market cap", () => {
    expect(derivePharmaFcfYieldPercent({
      freeCashFlowAnnual: 500,
      currentMarketCap: 10000,
    })).toMatchObject({
      metricCode: "FCF_YIELD_PERCENT",
      unit: "PERCENT",
      numericValue: 5,
      state: "PROPOSAL_ONLY",
    })
  })

  it("preserves negative free cash flow as negative yield", () => {
    expect(derivePharmaFcfYieldPercent({
      freeCashFlowAnnual: -250,
      currentMarketCap: 10000,
    })?.numericValue).toBe(-2.5)
  })

  it("fails closed on zero, negative or non-finite market cap", () => {
    expect(derivePharmaFcfYieldPercent({ freeCashFlowAnnual: 500, currentMarketCap: 0 })).toBeNull()
    expect(derivePharmaFcfYieldPercent({ freeCashFlowAnnual: 500, currentMarketCap: -1 })).toBeNull()
    expect(derivePharmaFcfYieldPercent({ freeCashFlowAnnual: 500, currentMarketCap: Number.NaN })).toBeNull()
  })

  it("fails closed on non-finite free cash flow", () => {
    expect(derivePharmaFcfYieldPercent({
      freeCashFlowAnnual: Number.POSITIVE_INFINITY,
      currentMarketCap: 10000,
    })).toBeNull()
  })
})
