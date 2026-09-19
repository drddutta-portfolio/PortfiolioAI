import { describe, expect, it } from "vitest"
import { buildTorntpharmG7ExplainablePreview } from "./pharmaTorntpharmG7ExplainablePreview"
import type { PharmaResearchWorkspaceModel } from "./pharmaResearchWorkspaceModel"

const model: PharmaResearchWorkspaceModel = {
  primary: {
    subprofileCode: "DOMESTIC_FORMULATIONS",
    displayName: "Domestic Formulations",
    confidence: "HIGH",
    effectiveFrom: "2026-03-31",
    requirements: [
      {
        metricCode: "PHARMA_DOMESTIC_REVENUE_GROWTH",
        label: "Domestic Revenue Growth",
        requirementLevel: "MANDATORY",
        dimension: "GROWTH",
        status: "VERIFIED",
      },
      {
        metricCode: "PHARMA_OPERATING_MARGIN_HISTORY",
        label: "Operating Margin History",
        requirementLevel: "MANDATORY",
        dimension: "QUALITY",
        status: "VERIFIED",
      },
    ],
    verified: 2,
    unavailable: 0,
    reviewAttention: 0,
  },
  secondaries: [
    {
      exposureCode: "GLOBAL_GENERICS",
      displayName: "Global Generics",
      materiality: "MATERIAL",
      confidence: "HIGH",
      mode: "EVIDENCE_OVERLAY",
      note: "Material exposure",
      requirements: [
        {
          metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH",
          label: "Export / US Revenue Growth",
          requirementLevel: "MANDATORY",
          dimension: "GROWTH",
          status: "VERIFIED",
        },
        {
          metricCode: "PHARMA_REGULATORY_SITE_STATUS",
          label: "Regulatory Site Status",
          requirementLevel: "MANDATORY",
          dimension: "RISK",
          status: "VERIFIED",
        },
      ],
    },
    {
      exposureCode: "CDMO_CRAMS",
      displayName: "CDMO / CRAMS",
      materiality: "EMERGING",
      confidence: "MEDIUM",
      mode: "EMERGING_WATCH",
      note: "Emerging watch",
      requirements: [],
    },
  ],
  scoringState: "UNAPPROVED",
}

describe("G7.2 TORNTPHARM explainable preview", () => {
  it("preserves the reviewed Primary / Material / Emerging architecture", () => {
    const result = buildTorntpharmG7ExplainablePreview(model, [])
    expect(result.primarySubprofile).toBe("DOMESTIC_FORMULATIONS")
    expect(result.materialOverlay).toBe("GLOBAL_GENERICS")
    expect(result.emergingWatch).toBe("CDMO_CRAMS")
  })

  it("runs all ten weighted dimensions through the G7.1 dimension adapter", () => {
    const result = buildTorntpharmG7ExplainablePreview(model, [])
    expect(result.rows).toHaveLength(10)
    expect(result.rows.map((row) => row.dimensionCode)).toEqual([
      "QUALITY",
      "GROWTH",
      "CAPITAL_EFFICIENCY",
      "CASH_FLOW",
      "BALANCE_SHEET_CREDIT",
      "BUSINESS_DURABILITY",
      "VALUATION",
      "MOMENTUM",
      "OWNERSHIP_GOVERNANCE",
      "RISK",
    ])
  })

  it("does not manufacture a Primary dimension score from evidence coverage alone", () => {
    const result = buildTorntpharmG7ExplainablePreview(model, [])
    const growth = result.rows.find((row) => row.dimensionCode === "GROWTH")
    expect(growth?.primaryEvidenceVerified).toBe(1)
    expect(growth?.primaryEvidenceTotal).toBe(1)
    expect(growth?.primaryScore).toBeNull()
    expect(growth?.finalScore).toBeNull()
  })

  it("does not treat complete material-overlay evidence as a neutral or invented modifier", () => {
    const result = buildTorntpharmG7ExplainablePreview(model, [])
    const growth = result.rows.find((row) => row.dimensionCode === "GROWTH")
    expect(growth?.overlayState).toBe("READY")
    expect(growth?.overlayModifierPoints).toBeNull()
    expect(growth?.reasonCodes).toContain("ELIGIBLE_OVERLAY_MODIFIER_NOT_AVAILABLE")
  })

  it("keeps the overall score unavailable while governance runtime input is unresolved", () => {
    const result = buildTorntpharmG7ExplainablePreview(model, [])
    expect(result.governanceRuntimeInputResolved).toBe(false)
    expect(result.overallPreviewState).toBe("NOT_CURRENTLY_COMPUTABLE")
    expect(result.overallScore).toBeNull()
    expect(result.reasonCodes).toContain("GOVERNANCE_RUNTIME_INPUT_NOT_CANONICALLY_RESOLVED")
  })

  it("does not silently transfer pending Domestic methodology into a numeric result", () => {
    const result = buildTorntpharmG7ExplainablePreview(model, [])
    const momentum = result.rows.find((row) => row.dimensionCode === "MOMENTUM")
    expect(momentum?.methodologyState).toBe("SUBPROFILE_THRESHOLDS_REQUIRED")
    expect(momentum?.finalScore).toBeNull()
  })

  it("keeps Business Durability fail-closed without an approved dimension aggregation", () => {
    const result = buildTorntpharmG7ExplainablePreview(model, [])
    const durability = result.rows.find((row) => row.dimensionCode === "BUSINESS_DURABILITY")
    expect(durability?.methodologyState).toBe("NO_APPROVED_DIMENSION_AGGREGATION")
    expect(durability?.finalScore).toBeNull()
  })

  it("records no score execution or persistence", () => {
    const result = buildTorntpharmG7ExplainablePreview(model, [])
    expect(result.scoreExecutionEnabled).toBe(false)
    expect(result.persistedScoreRunEnabled).toBe(false)
  })
})
