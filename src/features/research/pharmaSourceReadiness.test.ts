import { describe, expect, it } from "vitest"
import { PHARMA_SOURCE_READINESS_VERSION, PHARMA_V1_SOURCE_READINESS, pharmaSourceReadiness } from "./pharmaSourceReadiness"
import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"

describe("PHARMA_V1_SOURCE_READINESS", () => {
  it("is versioned after the R4L parent-contract alignment", () => {
    expect(PHARMA_SOURCE_READINESS_VERSION).toBe("PHARMA_SOURCE_READINESS_V5")
  })

  it("covers every PHARMA_V1 metric exactly once", () => {
    const contractCodes = PHARMA_RESEARCH_PROFILE_V1.metrics.map((metric) => metric.metricCode).sort()
    const sourceCodes = PHARMA_V1_SOURCE_READINESS.map((item) => item.metricCode).sort()
    expect(sourceCodes).toEqual(contractCodes)
    expect(new Set(sourceCodes).size).toBe(sourceCodes.length)
    expect(sourceCodes).toHaveLength(13)
  })

  it("keeps annual revenue history pending after detecting operating-vs-total revenue semantic mismatch", () => {
    expect(pharmaSourceReadiness("PHARMA_REVENUE_GROWTH_HISTORY")).toMatchObject({
      state: "HISTORY_CONTRACT_PENDING",
      approvedSource: "ISSUER_ANNUAL_REPORT / COMPANY_EXCHANGE_FILING",
      canonicalEvidenceCodes: ["REVENUE_ANNUAL"],
      canUseExistingCacheWithoutProviderCall: true,
    })
  })

  it("keeps operating-margin history pending until the matched canonical series is complete", () => {
    const item = pharmaSourceReadiness("PHARMA_OPERATING_MARGIN_HISTORY")
    expect(item).toMatchObject({
      state: "HISTORY_CONTRACT_PENDING",
      approvedSource: "REVIEWED CANONICAL EVIDENCE + PORTFOLIOAI",
      canonicalEvidenceCodes: ["OPERATING_REVENUE_QUARTER", "OPERATING_PROFIT_QUARTER"],
    })
    expect(item?.observedProviderLabels).toContain("Operating Profit 6Qtr Ago")
    expect(item?.reason).toContain("incomplete/conflicted")
  })

  it("keeps ROCE history pending until a consistent issuer-reported series exists", () => {
    expect(pharmaSourceReadiness("PHARMA_ROCE_HISTORY")).toMatchObject({
      state: "HISTORY_CONTRACT_PENDING",
      approvedSource: "ISSUER_ANNUAL_REPORT",
      canonicalEvidenceCodes: ["ROCE_MANAGEMENT_ANNUAL"],
    })
  })

  it("keeps cash conversion pending until matched CFO, PAT and capex/FCF history exists", () => {
    const item = pharmaSourceReadiness("PHARMA_CASH_CONVERSION_HISTORY")
    expect(item?.state).toBe("HISTORY_CONTRACT_PENDING")
    expect(item?.canonicalEvidenceCodes).toEqual([
      "CFO_ANNUAL",
      "PAT_ATTRIBUTABLE_ANNUAL",
      "CAPEX_ANNUAL",
      "FREE_CASH_FLOW_ANNUAL",
    ])
    expect(item?.approvedSource).toBe("ISSUER_ANNUAL_REPORT + PORTFOLIOAI_DERIVED")
    expect(item?.reason).toContain("CFO alone")
  })

  it("keeps leverage pending and forbids short-term debt as a total-debt substitute", () => {
    const item = pharmaSourceReadiness("PHARMA_BALANCE_SHEET_LEVERAGE")
    expect(item?.state).toBe("HISTORY_CONTRACT_PENDING")
    expect(item?.observedProviderLabels).toContain("Interest Coverage Ratio Ann. 1Y Ago")
    expect(item?.approvedSource).toBe("ISSUER_ANNUAL_REPORT")
    expect(item?.reason).toContain("Short-term debt must never substitute for total debt")
  })

  it("requires official regulator or issuer evidence for regulatory site status", () => {
    expect(pharmaSourceReadiness("PHARMA_REGULATORY_SITE_STATUS")).toMatchObject({
      state: "OFFICIAL_SOURCE_CONTRACT_PENDING",
      approvedSource: "OFFICIAL REGULATOR / ISSUER EVIDENCE",
      canUseExistingCacheWithoutProviderCall: false,
    })
  })

  it("keeps ownership and valuation partial without treating them as score-ready", () => {
    expect(pharmaSourceReadiness("PHARMA_OWNERSHIP_GOVERNANCE")?.state).toBe("CACHE_PARTIAL")
    const valuation = pharmaSourceReadiness("PHARMA_VALUATION_CONTEXT")
    expect(valuation?.canonicalEvidenceCodes).toEqual(["PE_TTM"])
    expect(valuation?.state).toBe("CACHE_PARTIAL")
    expect(valuation?.approvedSource).toBe("ANGEL_ONE + REVIEWED PORTFOLIOAI RESEARCH EVIDENCE")
  })

  it("defines source contracts for the conditional and specialist PHARMA domains", () => {
    expect(pharmaSourceReadiness("PHARMA_DOMESTIC_REVENUE_GROWTH")?.canonicalEvidenceCodes).toEqual(["INDIA_REVENUE_ANNUAL"])
    expect(pharmaSourceReadiness("PHARMA_EXPORT_US_REVENUE_GROWTH")?.canonicalEvidenceCodes).toEqual(["USA_REVENUE_ANNUAL"])
    expect(pharmaSourceReadiness("PHARMA_RND_INTENSITY")?.canonicalEvidenceCodes).toEqual(["RND_EXPENSE_ANNUAL", "RND_INTENSITY_PERCENT"])
    expect(pharmaSourceReadiness("PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE")?.state).toBe("SOURCE_CONTRACT_PENDING")
  })

  it("returns null for an unknown profile metric", () => {
    expect(pharmaSourceReadiness("NOT_A_PHARMA_METRIC")).toBeNull()
  })
})
