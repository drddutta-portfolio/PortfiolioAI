import { describe, expect, it } from "vitest"
import { PHARMA_SOURCE_READINESS_VERSION, PHARMA_V1_SOURCE_READINESS, pharmaSourceReadiness } from "./pharmaSourceReadiness"
import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"

describe("PHARMA_V1_SOURCE_READINESS", () => {
  it("is versioned after the R4H conflict-aware source review", () => {
    expect(PHARMA_SOURCE_READINESS_VERSION).toBe("PHARMA_SOURCE_READINESS_V4")
  })

  it("covers every PHARMA_V1 metric exactly once", () => {
    const contractCodes = PHARMA_RESEARCH_PROFILE_V1.metrics.map((metric) => metric.metricCode).sort()
    const sourceCodes = PHARMA_V1_SOURCE_READINESS.map((item) => item.metricCode).sort()
    expect(sourceCodes).toEqual(contractCodes)
    expect(new Set(sourceCodes).size).toBe(sourceCodes.length)
  })

  it("keeps annual revenue history pending after detecting operating-vs-total revenue semantic mismatch", () => {
    expect(pharmaSourceReadiness("PHARMA_REVENUE_GROWTH_HISTORY")).toMatchObject({
      state: "HISTORY_CONTRACT_PENDING",
      approvedSource: null,
      canonicalEvidenceCodes: ["REVENUE_ANNUAL"],
      canUseExistingCacheWithoutProviderCall: true,
    })
  })

  it("keeps operating-margin history pending because the retained raw series is incomplete and conflicted", () => {
    const item = pharmaSourceReadiness("PHARMA_OPERATING_MARGIN_HISTORY")
    expect(item).toMatchObject({
      state: "HISTORY_CONTRACT_PENDING",
      approvedSource: "TRENDLYNE_MCP + PORTFOLIOAI",
      canonicalEvidenceCodes: ["OPERATING_REVENUE_QUARTER", "OPERATING_PROFIT_QUARTER"],
    })
    expect(item?.observedProviderLabels).toContain("Operating Profit 6Qtr Ago")
    expect(item?.reason).toContain("duplicate-value conflict")
  })

  it("keeps ROCE history pending because only current and 1Y annual points were validated", () => {
    expect(pharmaSourceReadiness("PHARMA_ROCE_HISTORY")).toMatchObject({
      state: "HISTORY_CONTRACT_PENDING",
      approvedSource: "TRENDLYNE_MCP",
    })
  })

  it("keeps cash conversion pending even though five historical CFO points are usable", () => {
    const item = pharmaSourceReadiness("PHARMA_CASH_CONVERSION_HISTORY")
    expect(item?.state).toBe("SOURCE_CONTRACT_PENDING")
    expect(item?.canonicalEvidenceCodes).toContain("CFO_ANNUAL")
    expect(item?.approvedSource).toBe("TRENDLYNE_MCP")
    expect(item?.reason).toContain("CFO alone")
  })

  it("keeps leverage partial despite observed interest-coverage evidence", () => {
    const item = pharmaSourceReadiness("PHARMA_BALANCE_SHEET_LEVERAGE")
    expect(item?.state).toBe("SOURCE_CONTRACT_PENDING")
    expect(item?.observedProviderLabels).toContain("Interest Coverage Ratio Ann. 1Y Ago")
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
