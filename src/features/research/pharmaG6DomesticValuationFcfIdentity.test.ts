import { describe, expect, it } from "vitest"
import { PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY } from "./pharmaG6DomesticValuationFcfIdentity"

describe("G6 Domestic Valuation FCF identity lock", () => {
  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY.activationApproved).toBe(false)
    expect(PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY.scoreExecutionEnabled).toBe(false)
  })

  it("records the concrete identifier ambiguity explicitly", () => {
    expect(PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY.currentMetricIdentityState).toBe("AMBIGUOUS")
    expect(PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY.observedIdentifiers).toEqual([
      "FCF_YIELD",
      "FCF_YIELD_PERCENT",
    ])
  })

  it("fails closed until a canonical definition, formula, unit and alias reconciliation exist", () => {
    expect(PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY.canonicalMetricDefinitionPresent).toBe(false)
    expect(PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY.canonicalFormulaApproved).toBe(false)
    expect(PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY.canonicalUnitApproved).toBe(false)
    expect(PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY.aliasReconciliationApproved).toBe(false)
    expect(PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY.numericThresholdsAllowed).toBe(false)
  })

  it("does not claim the whole Valuation dimension is ready", () => {
    expect(PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY.wholeValuationDimensionReady).toBe(false)
  })
})
