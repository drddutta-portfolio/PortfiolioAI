import { describe, expect, it } from "vitest"
import { PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION } from "./pharmaG7ReadOnlyScoringAdapter"
import { buildAuropharmaG82SameEnginePreview } from "./auropharmaG8SameEnginePreview"

describe("G8.2 AUROPHARMA same-engine read-only preview", () => {
  const preview = buildAuropharmaG82SameEnginePreview(
    "AUROPHARMA_TEST",
    [],
    "2026-09-19",
  )

  it("instantiates the permanent three-layer Pharma research architecture", () => {
    expect(preview.threeLayerArchitecture.commonCore.profileCode).toBe("PHARMA_V1")
    expect(preview.primarySubprofile).toBe("GLOBAL_GENERICS")
    expect(preview.materialOverlays).toEqual([])
    expect(preview.emergingWatches).toEqual(["API_BULK_DRUGS"])
    expect(preview.unresolvedExposures).toEqual(["BIOPHARMA_BIOSIMILARS"])
  })

  it("uses the unchanged G7.1 read-only adapter contract", () => {
    expect(preview.adapterVersion).toBe(PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION)
    expect(preview.rows).toHaveLength(10)
  })

  it("uses Global Generics methodology instead of Domestic Formulations fallback", () => {
    const growth = preview.rows.find((row) => row.dimensionCode === "GROWTH")
    const quality = preview.rows.find((row) => row.dimensionCode === "QUALITY")
    const valuation = preview.rows.find((row) => row.dimensionCode === "VALUATION")

    expect(growth?.methodologyState).toBe("VALIDATED_NOT_ACTIVE")
    expect(quality?.methodologyState).toBe("VALIDATED_FAIL_CLOSED")
    expect(valuation?.methodologyState).toBe("VALIDATED_FAIL_CLOSED")
    expect(JSON.stringify(preview.rows)).not.toContain("DOMESTIC_FORMULATIONS")
  })

  it("keeps API Emerging visible but excluded from material-overlay scoring", () => {
    expect(preview.rows.every((row) => row.materialOverlay === "NONE")).toBe(true)
    expect(preview.rows.every((row) => row.emergingWatchExcluded.includes("API_BULK_DRUGS"))).toBe(true)
  })

  it("fails closed rather than manufacturing an overall score", () => {
    expect(preview.overallPreviewState).toBe("NOT_CURRENTLY_COMPUTABLE")
    expect(preview.overallScore).toBeNull()
    expect(preview.rows.every((row) => row.finalScore === null)).toBe(true)
  })

  it("does not persist, mutate shared state, recommend, or size positions", () => {
    expect(preview.scoreExecutionEnabled).toBe(false)
    expect(preview.persistedScoreRunEnabled).toBe(false)
    expect(preview.recommendationEnabled).toBe(false)
    expect(preview.positionSizingEnabled).toBe(false)
    expect(preview.sharedStateMutationEnabled).toBe(false)
  })

  it("keeps Biosimilars unresolved rather than silently converting it into Emerging Watch", () => {
    expect(preview.threeLayerArchitecture.unresolvedExposures).toEqual([
      expect.objectContaining({
        exposureCode: "BIOPHARMA_BIOSIMILARS",
        reasonCode: "NO_REVENUE_OR_PROFIT_SHARE",
      }),
    ])
  })
})
