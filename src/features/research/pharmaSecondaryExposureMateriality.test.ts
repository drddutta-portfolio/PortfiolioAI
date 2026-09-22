import { describe, expect, it } from "vitest"
import { resolvePharmaSecondaryExposureMateriality } from "./pharmaSecondaryExposureMateriality"

function resolve(exposureRevenue: number | null, comparableCompanyRevenue: number | null) {
  return resolvePharmaSecondaryExposureMateriality({ exposureRevenue, comparableCompanyRevenue })
}

describe("resolvePharmaSecondaryExposureMateriality", () => {
  it("uses the approved 5%, 10% and 50% V1 boundaries", () => {
    expect(resolve(4.99, 100).materiality).toBe("IMMATERIAL")
    expect(resolve(5, 100).materiality).toBe("EMERGING")
    expect(resolve(9.99, 100).materiality).toBe("EMERGING")
    expect(resolve(10, 100).materiality).toBe("MATERIAL")
    expect(resolve(49.99, 100).materiality).toBe("MATERIAL")
    expect(resolve(50, 100).materiality).toBe("DOMINANT")
  })

  it("fails closed to UNKNOWN when comparable business-model revenue is unavailable", () => {
    const result = resolve(null, 100)
    expect(result.materiality).toBe("UNKNOWN")
    expect(result.reasonCode).toBe("INSUFFICIENT_COMPARABLE_REVENUE")
    expect(result.revenueShare).toBeNull()
  })

  it("fails closed when the exposure revenue exceeds the comparable company revenue", () => {
    const result = resolve(120, 100)
    expect(result.materiality).toBe("UNKNOWN")
    expect(result.reasonCode).toBe("INCOMPARABLE_REVENUE")
  })

  it("allows only a provenance-complete MEDIUM/HIGH confidence qualitative override", () => {
    const valid = resolvePharmaSecondaryExposureMateriality({
      exposureRevenue: 3,
      comparableCompanyRevenue: 100,
      qualitativeOverride: {
        targetMateriality: "MATERIAL",
        sourceReference: "issuer-regulatory-site-disclosure",
        reasonCode: "DISPROPORTIONATE_REGULATORY_DEPENDENCY",
        reviewerProvenance: "owner-reviewed-gate-e",
        confidence: "MEDIUM",
        effectiveFrom: "2026-03-31",
      },
    })

    expect(valid.materiality).toBe("MATERIAL")
    expect(valid.qualitativeOverrideApplied).toBe(true)
    expect(valid.reasonCode).toBe("QUALITATIVE_OVERRIDE_MATERIAL")

    const invalid = resolvePharmaSecondaryExposureMateriality({
      exposureRevenue: 3,
      comparableCompanyRevenue: 100,
      qualitativeOverride: {
        targetMateriality: "MATERIAL",
        sourceReference: "issuer-regulatory-site-disclosure",
        reasonCode: "DISPROPORTIONATE_REGULATORY_DEPENDENCY",
        reviewerProvenance: "owner-reviewed-gate-e",
        confidence: "LOW",
        effectiveFrom: "2026-03-31",
      },
    })

    expect(invalid.materiality).toBe("UNKNOWN")
    expect(invalid.reasonCode).toBe("INVALID_QUALITATIVE_OVERRIDE")
  })

  it("never lets a qualitative override downgrade a stronger quantitative state", () => {
    const result = resolvePharmaSecondaryExposureMateriality({
      exposureRevenue: 25,
      comparableCompanyRevenue: 100,
      qualitativeOverride: {
        targetMateriality: "EMERGING",
        sourceReference: "issuer-business-review",
        reasonCode: "STRATEGIC_BUSINESS",
        reviewerProvenance: "owner-reviewed-gate-e",
        confidence: "HIGH",
        effectiveFrom: "2026-03-31",
      },
    })

    expect(result.materiality).toBe("MATERIAL")
    expect(result.qualitativeOverrideApplied).toBe(false)
  })

  it("flags DOMINANT exposure for primary-subprofile reclassification review", () => {
    const result = resolve(50, 100)
    expect(result.materiality).toBe("DOMINANT")
    expect(result.requiresPrimaryReclassificationReview).toBe(true)
  })
})
