import { describe, expect, it } from "vitest"
import {
  PHARMA_G6_LAYERING_BOUNDARY,
  PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY,
  pharmaG6CurveContractForPrimary,
} from "./pharmaG6SubprofileCurveApplicability"

describe("PHARMA G6 subprofile curve applicability", () => {
  it("covers every canonical Pharma primary subprofile", () => {
    expect(Object.keys(PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY).sort()).toEqual([
      "API_BULK_DRUGS",
      "BIOPHARMA_BIOSIMILARS",
      "CDMO_CRAMS",
      "DOMESTIC_FORMULATIONS",
      "GLOBAL_GENERICS",
    ])
  })

  it("keeps the validated Operating Margin curve Domestic Formulations only", () => {
    expect(
      pharmaG6CurveContractForPrimary("DOMESTIC_FORMULATIONS").entries.find(
        (entry) => entry.family === "OPERATING_MARGIN",
      )?.state,
    ).toBe("VALIDATED_NOT_ACTIVE")

    for (const code of ["GLOBAL_GENERICS", "API_BULK_DRUGS", "CDMO_CRAMS", "BIOPHARMA_BIOSIMILARS"] as const) {
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

  it("keeps all G5 parent families pending subprofile-specific thresholds", () => {
    for (const contract of Object.values(PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY)) {
      for (const family of [
        "ROCE_CAPITAL_EFFICIENCY",
        "CASH_CONVERSION",
        "BALANCE_SHEET_LEVERAGE",
        "VALUATION",
        "OWNERSHIP_GOVERNANCE",
        "REGULATORY_MARKET_RISK",
        "MOMENTUM",
      ] as const) {
        expect(contract.entries.find((entry) => entry.family === family)?.state).toBe(
          "SUBPROFILE_THRESHOLDS_REQUIRED",
        )
      }
    }
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
