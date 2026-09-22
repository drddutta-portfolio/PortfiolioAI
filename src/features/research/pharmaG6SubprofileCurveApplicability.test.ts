import { describe, expect, it } from "vitest"
import {
  PHARMA_G6_LAYERING_BOUNDARY,
  PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY,
  PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION,
  pharmaG6CurveContractForPrimary,
} from "./pharmaG6SubprofileCurveApplicability"

describe("PHARMA G6 subprofile curve applicability", () => {
  it("uses the versioned V2 proposal after the Global Generics reconciliation", () => {
    expect(PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION).toBe(
      "PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_V2_PROPOSAL",
    )
  })

  it("covers every canonical Pharma primary subprofile", () => {
    expect(Object.keys(PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY).sort()).toEqual([
      "API_BULK_DRUGS",
      "BIOPHARMA_BIOSIMILARS",
      "CDMO_CRAMS",
      "DOMESTIC_FORMULATIONS",
      "GLOBAL_GENERICS",
    ])
  })

  it("keeps the validated Operating Margin curve Domestic Formulations only while representing Global Generics as validated fail-closed", () => {
    expect(
      pharmaG6CurveContractForPrimary("DOMESTIC_FORMULATIONS").entries.find(
        (entry) => entry.family === "OPERATING_MARGIN",
      )?.state,
    ).toBe("VALIDATED_NOT_ACTIVE")

    expect(
      pharmaG6CurveContractForPrimary("GLOBAL_GENERICS").entries.find(
        (entry) => entry.family === "OPERATING_MARGIN",
      ),
    ).toMatchObject({
      state: "VALIDATED_FAIL_CLOSED",
      curveVersion: null,
    })

    for (const code of ["API_BULK_DRUGS", "CDMO_CRAMS", "BIOPHARMA_BIOSIMILARS"] as const) {
      expect(
        pharmaG6CurveContractForPrimary(code).entries.find(
          (entry) => entry.family === "OPERATING_MARGIN",
        )?.state,
      ).toBe("UNSUPPORTED_FAIL_CLOSED")
    }
  })

  it("permits the validated Segment Growth curve only where its metric contract explicitly applies", () => {
    expect(
      pharmaG6CurveContractForPrimary("DOMESTIC_FORMULATIONS").entries.find(
        (entry) => entry.family === "SEGMENT_GROWTH",
      )?.metricCodes,
    ).toEqual(["PHARMA_DOMESTIC_REVENUE_GROWTH"])

    expect(
      pharmaG6CurveContractForPrimary("GLOBAL_GENERICS").entries.find(
        (entry) => entry.family === "SEGMENT_GROWTH",
      )?.metricCodes,
    ).toEqual(["PHARMA_EXPORT_US_REVENUE_GROWTH"])

    for (const code of ["API_BULK_DRUGS", "CDMO_CRAMS", "BIOPHARMA_BIOSIMILARS"] as const) {
      expect(
        pharmaG6CurveContractForPrimary(code).entries.find(
          (entry) => entry.family === "SEGMENT_GROWTH",
        )?.state,
      ).toBe("UNSUPPORTED_FAIL_CLOSED")
    }
  })

  it("reconciles only the seven G5-derived Global Generics families to validated fail-closed", () => {
    const reconciledFamilies = [
      "ROCE_CAPITAL_EFFICIENCY",
      "CASH_CONVERSION",
      "BALANCE_SHEET_LEVERAGE",
      "VALUATION",
      "OWNERSHIP_GOVERNANCE",
      "REGULATORY_MARKET_RISK",
      "MOMENTUM",
    ] as const

    const global = pharmaG6CurveContractForPrimary("GLOBAL_GENERICS")

    for (const family of reconciledFamilies) {
      expect(global.entries.find((entry) => entry.family === family)).toMatchObject({
        state: "VALIDATED_FAIL_CLOSED",
        curveVersion: null,
      })
    }
  })

  it("leaves the shared pending-parent representation unchanged for the other four primaries", () => {
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

  it("keeps validated fail-closed distinct from both unresolved and unsupported states", () => {
    const global = pharmaG6CurveContractForPrimary("GLOBAL_GENERICS")
    const validatedFailClosed = global.entries.filter((entry) => entry.state === "VALIDATED_FAIL_CLOSED")
    const validatedNotActive = global.entries.filter((entry) => entry.state === "VALIDATED_NOT_ACTIVE")

    expect(validatedFailClosed.map((entry) => entry.family)).toEqual([
      "OPERATING_MARGIN",
      "ROCE_CAPITAL_EFFICIENCY",
      "CASH_CONVERSION",
      "BALANCE_SHEET_LEVERAGE",
      "VALUATION",
      "OWNERSHIP_GOVERNANCE",
      "REGULATORY_MARKET_RISK",
      "MOMENTUM",
    ])
    expect(validatedFailClosed.every((entry) => entry.curveVersion === null)).toBe(true)
    expect(validatedNotActive.map((entry) => entry.family)).toEqual([
      "SEGMENT_GROWTH",
      "US_GENERIC_PRICE_EROSION",
    ])
  })

  it("prevents Primary/Overlay/Emerging score-layer violations", () => {
    expect(PHARMA_G6_LAYERING_BOUNDARY.primaryUsesSubprofileCurveContract).toBe(true)
    expect(PHARMA_G6_LAYERING_BOUNDARY.materialOverlayCreatesIndependentStockScore).toBe(false)
    expect(PHARMA_G6_LAYERING_BOUNDARY.emergingWatchCreatesIndependentStockScore).toBe(false)
    expect(PHARMA_G6_LAYERING_BOUNDARY.emergingWatchExcludedFromNumericScoring).toBe(true)
    expect(PHARMA_G6_LAYERING_BOUNDARY.domesticThresholdsMayAutoApplyToOtherPrimaries).toBe(false)
    expect(PHARMA_G6_LAYERING_BOUNDARY.scoreExecutionEnabled).toBe(false)
  })
})
