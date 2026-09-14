import { describe, expect, it } from "vitest"
import { PHARMA_V1_SOURCE_READINESS, pharmaSourceReadiness } from "./pharmaSourceReadiness"
import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"

describe("PHARMA_V1_SOURCE_READINESS", () => {
  it("covers every PHARMA_V1 metric exactly once", () => {
    const contractCodes = PHARMA_RESEARCH_PROFILE_V1.metrics.map((metric) => metric.metricCode).sort()
    const sourceCodes = PHARMA_V1_SOURCE_READINESS.map((item) => item.metricCode).sort()
    expect(sourceCodes).toEqual(contractCodes)
    expect(new Set(sourceCodes).size).toBe(sourceCodes.length)
  })

  it("does not promote provisional snapshot revenue evidence to source-ready history", () => {
    expect(pharmaSourceReadiness("PHARMA_REVENUE_GROWTH_HISTORY")).toMatchObject({
      state: "HISTORY_CONTRACT_PENDING",
      approvedSource: null,
      canUseExistingCacheWithoutProviderCall: true,
    })
  })

  it("recognizes reviewed OPM and ROCE provider capability while keeping history contracts pending", () => {
    expect(pharmaSourceReadiness("PHARMA_OPERATING_MARGIN_HISTORY")).toMatchObject({
      state: "HISTORY_CONTRACT_PENDING",
      approvedSource: "TRENDLYNE_MCP",
    })
    expect(pharmaSourceReadiness("PHARMA_ROCE_HISTORY")).toMatchObject({
      state: "HISTORY_CONTRACT_PENDING",
      approvedSource: "TRENDLYNE_MCP",
    })
  })

  it("keeps cash conversion pending because CFO alone is insufficient", () => {
    const item = pharmaSourceReadiness("PHARMA_CASH_CONVERSION_HISTORY")
    expect(item?.state).toBe("SOURCE_CONTRACT_PENDING")
    expect(item?.canonicalEvidenceCodes).toContain("CFO_ANNUAL")
    expect(item?.approvedSource).toBeNull()
  })

  it("requires a separate official source contract for regulatory site status", () => {
    expect(pharmaSourceReadiness("PHARMA_REGULATORY_SITE_STATUS")).toMatchObject({
      state: "OFFICIAL_SOURCE_CONTRACT_PENDING",
      approvedSource: null,
      canUseExistingCacheWithoutProviderCall: false,
    })
  })

  it("does not treat quarantined provider PBV as approved valuation evidence", () => {
    const valuation = pharmaSourceReadiness("PHARMA_VALUATION_CONTEXT")
    expect(valuation?.canonicalEvidenceCodes).toEqual(["PE_TTM"])
    expect(valuation?.state).toBe("CACHE_PARTIAL")
  })

  it("returns null for an unknown profile metric", () => {
    expect(pharmaSourceReadiness("NOT_A_PHARMA_METRIC")).toBeNull()
  })
})
