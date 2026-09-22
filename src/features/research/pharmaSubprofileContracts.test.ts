import { describe, expect, it } from "vitest"
import type { ResearchMetricEvidence } from "./researchProfileContract"
import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"
import { PHARMA_SUBPROFILE_CODES } from "./pharmaSubprofileAssignment"
import { composePharmaSubprofileContract, PHARMA_SUBPROFILE_CONTRACTS, summarizeEffectivePharmaReadiness } from "./pharmaSubprofileContracts"

describe("PHARMA_V1 effective subprofile contracts", () => {
  it("registers all five subprofiles and composes the parent exactly once", () => {
    expect(Object.keys(PHARMA_SUBPROFILE_CONTRACTS)).toEqual(PHARMA_SUBPROFILE_CODES)
    for (const code of PHARMA_SUBPROFILE_CODES) {
      const contract = composePharmaSubprofileContract(code)
      expect(new Set(contract.metrics.map((metric) => metric.metricCode)).size).toBe(contract.metrics.length)
      expect(contract.metrics.length).toBe(PHARMA_RESEARCH_PROFILE_V1.metrics.length + PHARMA_SUBPROFILE_CONTRACTS[code].additions.length)
      expect(contract.metrics.every((metric) => metric.scoreCurveVersion === null)).toBe(true)
    }
  })

  it("makes the Domestic Formulations franchise and materiality requirements mandatory", () => {
    const contract = composePharmaSubprofileContract("DOMESTIC_FORMULATIONS")
    const mandatory = contract.metrics.filter((metric) => metric.requirementLevel === "MANDATORY").map((metric) => metric.metricCode)
    expect(mandatory).toEqual(expect.arrayContaining([
      "PHARMA_DOMESTIC_REVENUE_GROWTH",
      "PHARMA_FIELD_FORCE_PRODUCTIVITY",
      "PHARMA_BRAND_THERAPY_LEADERSHIP",
      "PHARMA_DOMESTIC_EXPOSURE_MATERIALITY_REVIEW",
    ]))
    expect(contract.metrics.find((metric) => metric.metricCode === "PHARMA_REGULATORY_SITE_STATUS")?.applicability).toBe("CONDITIONAL")
  })

  it("captures the differentiating mandatory requirement for every other subprofile", () => {
    const api = composePharmaSubprofileContract("API_BULK_DRUGS")
    const generics = composePharmaSubprofileContract("GLOBAL_GENERICS")
    const biosimilars = composePharmaSubprofileContract("BIOPHARMA_BIOSIMILARS")
    const cdmo = composePharmaSubprofileContract("CDMO_CRAMS")
    expect(api.metrics.find((metric) => metric.metricCode === "PHARMA_API_CUSTOMER_CONCENTRATION")?.requirementLevel).toBe("MANDATORY")
    expect(generics.metrics.find((metric) => metric.metricCode === "PHARMA_US_GENERIC_PRICE_EROSION")?.requirementLevel).toBe("MANDATORY")
    expect(biosimilars.metrics.find((metric) => metric.metricCode === "PHARMA_BIOSIMILAR_PATENT_LITIGATION_TIMELINE")?.requirementLevel).toBe("MANDATORY")
    expect(cdmo.metrics.find((metric) => metric.metricCode === "PHARMA_CDMO_REVENUE_VISIBILITY")?.requirementLevel).toBe("MANDATORY")
  })

  it("keeps the top-line denominator mandatory-only and reports other coverage separately", () => {
    const contract = composePharmaSubprofileContract("DOMESTIC_FORMULATIONS")
    const evidence: ResearchMetricEvidence[] = contract.metrics.map((metric) => ({ metricCode: metric.metricCode, state: "FRESH", observationCount: metric.history.minimumObservations }))
    const summary = summarizeEffectivePharmaReadiness(contract, evidence)
    expect(summary.mandatory.total).toBe(10)
    expect(summary.mandatory.ratio).toBe(1)
    expect(summary.important.ratio).toBe(1)
    expect(summary.supplementary.ratio).toBe(1)
    expect(summary.mandatory.total).not.toBe(contract.metrics.length)
  })

  it("activates conditional regulatory evidence only through a reviewed condition input", () => {
    const contract = composePharmaSubprofileContract("DOMESTIC_FORMULATIONS")
    const withoutCondition = summarizeEffectivePharmaReadiness(contract, [])
    const withCondition = summarizeEffectivePharmaReadiness(contract, [], ["REGULATED_EXPORT_EXPOSURE"])
    expect(withoutCondition.mandatory.total).toBe(10)
    expect(withCondition.mandatory.total).toBe(11)
    expect(withCondition.mandatory.total).toBe(withoutCondition.mandatory.total + 1)
  })

  it("treats conflicts as blockers and never as ready evidence", () => {
    const contract = composePharmaSubprofileContract("DOMESTIC_FORMULATIONS")
    const summary = summarizeEffectivePharmaReadiness(contract, [{ metricCode: "PHARMA_FIELD_FORCE_PRODUCTIVITY", state: "CONFLICTING", observationCount: 3 }])
    expect(summary.reviewBlocked).toContain("PHARMA_FIELD_FORCE_PRODUCTIVITY")
    expect(summary.mandatory.ready).toBe(0)
  })
})
