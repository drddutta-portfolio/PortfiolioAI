import { describe, expect, it } from "vitest"
import {
  PHARMA_G6_LAYERING_BOUNDARY,
  pharmaG6CurveContractForPrimary,
} from "./pharmaG6SubprofileCurveApplicability"
import { PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW } from "./pharmaGlobalGenericsG6CoverageReview"
import { PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION } from "./pharmaGlobalGenericsApplicabilityRegistryReconciliation"

describe("PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION", () => {
  it("represents all 10 Global Generics families with explicit validated outcomes", () => {
    expect(
      PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION.validatedNotActiveFamilies,
    ).toEqual([
      "SEGMENT_GROWTH",
      "US_GENERIC_PRICE_EROSION",
    ])

    expect(
      PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION.validatedFailClosedFamilies,
    ).toEqual([
      "OPERATING_MARGIN",
      "ROCE_CAPITAL_EFFICIENCY",
      "CASH_CONVERSION",
      "BALANCE_SHEET_LEVERAGE",
      "VALUATION",
      "OWNERSHIP_GOVERNANCE",
      "REGULATORY_MARKET_RISK",
      "MOMENTUM",
    ])

    expect(
      PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION.unresolvedThresholdFamilies,
    ).toEqual([])
    expect(
      PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION.unsupportedFamilies,
    ).toEqual([])
  })

  it("matches the validated G6.44 methodology outcomes without creating numeric curves for fail-closed families", () => {
    const global = pharmaG6CurveContractForPrimary("GLOBAL_GENERICS")

    for (const family of PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.families) {
      const registryEntry = global.entries.find((entry) => entry.family === family.family)
      expect(registryEntry).toBeDefined()

      if (family.outcome === "VALIDATED_NOT_ACTIVE") {
        expect(registryEntry?.state).toBe("VALIDATED_NOT_ACTIVE")
        expect(family.numericCurveReady).toBe(true)
      } else {
        expect(registryEntry?.state).toBe("VALIDATED_FAIL_CLOSED")
        expect(registryEntry?.curveVersion).toBeNull()
        expect(family.numericCurveReady).toBe(false)
      }
    }
  })

  it("preserves the existing unresolved-parent states for all other Pharma primaries", () => {
    const pendingFamilies = [
      "ROCE_CAPITAL_EFFICIENCY",
      "CASH_CONVERSION",
      "BALANCE_SHEET_LEVERAGE",
      "VALUATION",
      "OWNERSHIP_GOVERNANCE",
      "REGULATORY_MARKET_RISK",
      "MOMENTUM",
    ] as const

    for (const code of [
      "DOMESTIC_FORMULATIONS",
      "API_BULK_DRUGS",
      "CDMO_CRAMS",
      "BIOPHARMA_BIOSIMILARS",
    ] as const) {
      const contract = pharmaG6CurveContractForPrimary(code)
      for (const family of pendingFamilies) {
        expect(contract.entries.find((entry) => entry.family === family)?.state).toBe(
          "SUBPROFILE_THRESHOLDS_REQUIRED",
        )
      }
    }
  })

  it("keeps unsupported Operating Margin semantics unchanged outside Global Generics", () => {
    for (const code of ["API_BULK_DRUGS", "CDMO_CRAMS", "BIOPHARMA_BIOSIMILARS"] as const) {
      expect(
        pharmaG6CurveContractForPrimary(code).entries.find(
          (entry) => entry.family === "OPERATING_MARGIN",
        )?.state,
      ).toBe("UNSUPPORTED_FAIL_CLOSED")
    }
  })

  it("does not activate scoring or G7 merely by preparing the reconciliation", () => {
    expect(PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION.scoreExecutionEnabled).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION.ownerValidationRequired).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION.g7ReadOnlyAdapterEligibleNow).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION.g7MayBeReconsideredAfterValidation).toBe(true)
    expect(PHARMA_G6_LAYERING_BOUNDARY.scoreExecutionEnabled).toBe(false)
  })
})
