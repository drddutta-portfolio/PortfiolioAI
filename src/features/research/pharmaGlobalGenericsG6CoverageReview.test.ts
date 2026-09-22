import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW,
  globalGenericsG6CoverageSummary,
} from "./pharmaGlobalGenericsG6CoverageReview"

describe("PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW", () => {
  it("covers all 10 canonical Global Generics G6 families", () => {
    expect(PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.canonicalFamilyCount).toBe(10)
    expect(PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.explicitOutcomeCount).toBe(10)
    expect(PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.families).toHaveLength(10)
    expect(PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.allCanonicalFamiliesHaveExplicitOutcome).toBe(true)
  })

  it("keeps only Segment Growth and US Generic Price Erosion numeric-curve ready", () => {
    const ready = PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.families
      .filter((family) => family.numericCurveReady)
      .map((family) => family.family)

    expect(ready).toEqual([
      "SEGMENT_GROWTH",
      "US_GENERIC_PRICE_EROSION",
    ])
  })

  it("records the seven stale registry families explicitly", () => {
    expect(PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.staleRegistryFamilies).toEqual([
      "ROCE_CAPITAL_EFFICIENCY",
      "CASH_CONVERSION",
      "BALANCE_SHEET_LEVERAGE",
      "VALUATION",
      "OWNERSHIP_GOVERNANCE",
      "REGULATORY_MARKET_RISK",
      "MOMENTUM",
    ])
    expect(PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.registryRepresentationCurrent).toBe(false)
  })

  it("marks G6 methodology coverage complete but blocks G7 until registry reconciliation", () => {
    expect(PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.g6MethodologyCoverageComplete).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.registryReconciliationRequiredBeforeG7).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.g7ReadOnlyAdapterEligible).toBe(false)
  })

  it("keeps activation and score execution disabled", () => {
    expect(PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.scoreExecutionEnabled).toBe(false)
  })

  it("returns the expected coverage summary", () => {
    expect(globalGenericsG6CoverageSummary()).toEqual({
      canonicalFamilyCount: 10,
      explicitOutcomeCount: 10,
      staleRegistryFamilyCount: 7,
      g6MethodologyCoverageComplete: true,
      g7ReadOnlyAdapterEligible: false,
    })
  })
})
