import { describe, expect, it } from "vitest"
import { PHARMA_BUSINESS_MODEL_PROFILES, pharmaBusinessModelProfile, pharmaCommonCoreMetricCodes } from "./pharmaBusinessModelProfiles"
import { resolvePharmaBusinessModel } from "./pharmaBusinessModelRouting"

const requirements = (code: Parameters<typeof pharmaBusinessModelProfile>[0]) => new Map(
  pharmaBusinessModelProfile(code).contract.metrics.map((metric) => [metric.metricCode, metric.requirementLevel]),
)

describe("Pharma business-model subprofiles", () => {
  it("defines exactly the five reviewed Pharma business-model contracts", () => {
    expect(PHARMA_BUSINESS_MODEL_PROFILES.map((profile) => profile.code)).toEqual([
      "API_BULK_DRUGS",
      "DOMESTIC_FORMULATIONS",
      "GLOBAL_GENERICS_EXPORT",
      "BIOPHARMA_BIOSIMILARS",
      "CDMO_CRAMS",
    ])
  })

  it("preserves the PHARMA_V1 common core in every subtype", () => {
    for (const profile of PHARMA_BUSINESS_MODEL_PROFILES) {
      const codes = new Set(profile.contract.metrics.map((metric) => metric.metricCode))
      for (const coreCode of pharmaCommonCoreMetricCodes()) expect(codes.has(coreCode)).toBe(true)
    }
  })

  it("makes domestic revenue and therapy mix central to Domestic Formulations", () => {
    const domestic = requirements("DOMESTIC_FORMULATIONS")
    expect(domestic.get("PHARMA_DOMESTIC_REVENUE_GROWTH")).toBe("MANDATORY")
    expect(domestic.get("PHARMA_DOMESTIC_THERAPY_MIX")).toBe("MANDATORY")
    expect(domestic.get("PHARMA_EXPORT_US_REVENUE_GROWTH")).toBe("SUPPLEMENTARY")
  })

  it("makes export growth, regulatory evidence and product pipeline mandatory for Global Generics", () => {
    const global = requirements("GLOBAL_GENERICS_EXPORT")
    expect(global.get("PHARMA_EXPORT_US_REVENUE_GROWTH")).toBe("MANDATORY")
    expect(global.get("PHARMA_REGULATORY_SITE_STATUS")).toBe("MANDATORY")
    expect(global.get("PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE")).toBe("MANDATORY")
    expect(global.get("PHARMA_GLOBAL_PRICE_EROSION")).toBe("MANDATORY")
  })

  it("makes R&D, pipeline and clinical/regulatory milestones mandatory for Biopharma", () => {
    const bio = requirements("BIOPHARMA_BIOSIMILARS")
    expect(bio.get("PHARMA_RND_INTENSITY")).toBe("MANDATORY")
    expect(bio.get("PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE")).toBe("MANDATORY")
    expect(bio.get("PHARMA_BIO_CLINICAL_REGULATORY_MILESTONES")).toBe("MANDATORY")
  })

  it("makes customer concentration, order visibility and utilization mandatory for CDMO/CRAMS", () => {
    const cdmo = requirements("CDMO_CRAMS")
    expect(cdmo.get("PHARMA_CDMO_CUSTOMER_CONCENTRATION")).toBe("MANDATORY")
    expect(cdmo.get("PHARMA_CDMO_ORDER_VISIBILITY")).toBe("MANDATORY")
    expect(cdmo.get("PHARMA_CDMO_CAPACITY_UTILIZATION")).toBe("MANDATORY")
  })

  it("fails closed when no reviewed subtype is supplied and never infers from a company name", () => {
    const result = resolvePharmaBusinessModel({ canonicalSector: "Pharma", reviewedBusinessModelCode: null })
    expect(result.state).toBe("REVIEW_REQUIRED")
    expect(result.profile).toBeNull()
  })

  it("returns a reviewed profile only from an explicit recognized assignment", () => {
    const result = resolvePharmaBusinessModel({ canonicalSector: "Pharma", reviewedBusinessModelCode: "DOMESTIC_FORMULATIONS" })
    expect(result.state).toBe("REVIEWED")
    expect(result.profile?.code).toBe("DOMESTIC_FORMULATIONS")
  })
})
