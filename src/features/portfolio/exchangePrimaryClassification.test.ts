import { describe, expect, it } from "vitest"
import {
  buildNewStockClassificationIntake,
  resolveExchangePrimaryClassification,
  type ExchangeClassificationObservation,
} from "./exchangePrimaryClassification"

function observation(
  exchange: "NSE" | "BSE",
  overrides: Partial<ExchangeClassificationObservation> = {},
): ExchangeClassificationObservation {
  return {
    exchange,
    symbol: "TEST",
    isin: "INE000000001",
    macroEconomicSector: "Financial Services",
    sector: "Financial Services",
    industry: "Finance",
    basicIndustry: "Non Banking Financial Company (NBFC)",
    observedAt: "2026-09-20T00:00:00Z",
    retrievedAt: "2026-09-21T00:00:00Z",
    sourceUrl: exchange === "NSE" ? "https://www.nseindia.com/" : "https://www.bseindia.com/",
    evidenceState: "AVAILABLE",
    ...overrides,
  }
}

describe("resolveExchangePrimaryClassification", () => {
  it("keeps pooled/non-company instruments outside operating-company sector routing", () => {
    const result = resolveExchangePrimaryClassification({
      assetClass: "ETF",
      instrumentType: "ETF",
      symbol: "NIFTYBEES",
      observations: [],
    })

    expect(result.state).toBe("NOT_APPLICABLE")
    expect(result.primarySector).toBeNull()
  })

  it("fails closed for a new operating-company equity with no official exchange evidence", () => {
    const result = resolveExchangePrimaryClassification({
      assetClass: "EQUITY",
      instrumentType: "EQ",
      symbol: "NEWCO",
      observations: [],
    })

    expect(result.state).toBe("MISSING")
    expect(result.reasonCode).toBe("OFFICIAL_EXCHANGE_PRIMARY_SECTOR_MISSING")
  })

  it("accepts one current official exchange classification when only one exchange supplies evidence", () => {
    const result = resolveExchangePrimaryClassification({
      assetClass: "EQUITY",
      instrumentType: "EQ",
      symbol: "TEST",
      observations: [observation("NSE", { sector: "Banking", industry: "Banks", basicIndustry: "Private Sector Bank" })],
    })

    expect(result.state).toBe("RESOLVED")
    expect(result.basis).toBe("SINGLE_OFFICIAL_EXCHANGE")
    expect(result.primarySector).toBe("Banking")
    expect(result.primaryIndustry).toBe("Banks")
  })

  it("resolves when NSE and BSE agree on the primary sector", () => {
    const result = resolveExchangePrimaryClassification({
      assetClass: "EQUITY",
      instrumentType: "EQ",
      symbol: "TEST",
      observations: [
        observation("NSE", { sector: "Information Technology", industry: "IT Consulting & Software", basicIndustry: "IT Services" }),
        observation("BSE", { sector: "Information Technology", industry: "IT Consulting & Software", basicIndustry: "IT Services" }),
      ],
    })

    expect(result.state).toBe("RESOLVED")
    expect(result.detailState).toBe("RESOLVED")
    expect(result.basis).toBe("NSE_BSE_AGREE")
    expect(result.primarySector).toBe("Information Technology")
  })

  it("blocks routing when NSE and BSE disagree on primary sector", () => {
    const result = resolveExchangePrimaryClassification({
      assetClass: "EQUITY",
      instrumentType: "EQ",
      symbol: "TEST",
      observations: [
        observation("NSE", { sector: "Information Technology", industry: "IT Consulting & Software" }),
        observation("BSE", { sector: "Capital Goods", industry: "Electronic Equipment" }),
      ],
    })

    expect(result.state).toBe("REVIEW_REQUIRED")
    expect(result.basis).toBe("NSE_BSE_SECTOR_CONFLICT")
    expect(result.primarySector).toBeNull()
    expect(result.reviewObservations).toHaveLength(2)
  })

  it("keeps the agreed primary sector but blocks methodology routing when deeper exchange classifications disagree", () => {
    const result = resolveExchangePrimaryClassification({
      assetClass: "EQUITY",
      instrumentType: "EQ",
      symbol: "TEST",
      observations: [
        observation("NSE", { sector: "Financial Services", industry: "Finance", basicIndustry: "NBFC" }),
        observation("BSE", { sector: "Financial Services", industry: "Insurance", basicIndustry: "General Insurance" }),
      ],
    })

    expect(result.state).toBe("RESOLVED")
    expect(result.detailState).toBe("REVIEW_REQUIRED")
    expect(result.primarySector).toBe("Financial Services")
    expect(result.reasonCode).toBe("PRIMARY_SECTOR_RESOLVED_DETAIL_REVIEW_REQUIRED")
  })

  it("does not allow an explicitly conflicting official observation to become canonical", () => {
    const result = resolveExchangePrimaryClassification({
      assetClass: "EQUITY",
      instrumentType: "EQ",
      symbol: "TEST",
      observations: [
        observation("NSE", { evidenceState: "CONFLICTING", sector: "Banking" }),
      ],
    })

    expect(result.state).toBe("REVIEW_REQUIRED")
    expect(result.primarySector).toBeNull()
  })

  it("uses the newest official observation for each exchange", () => {
    const result = resolveExchangePrimaryClassification({
      assetClass: "EQUITY",
      instrumentType: "EQ",
      symbol: "TEST",
      observations: [
        observation("NSE", {
          sector: "Information Technology",
          observedAt: "2026-01-01T00:00:00Z",
          retrievedAt: "2026-01-02T00:00:00Z",
        }),
        observation("NSE", {
          sector: "Capital Goods",
          industry: "Electrical Equipment",
          basicIndustry: "Heavy Electrical Equipment",
          observedAt: "2026-09-01T00:00:00Z",
          retrievedAt: "2026-09-02T00:00:00Z",
        }),
      ],
    })

    expect(result.state).toBe("RESOLVED")
    expect(result.primarySector).toBe("Capital Goods")
  })
})

describe("buildNewStockClassificationIntake", () => {
  it("holds a newly added equity in classification-pending state until official evidence exists", () => {
    const result = buildNewStockClassificationIntake({
      assetClass: "EQUITY",
      instrumentType: "EQ",
      symbol: "NEWCO",
      observations: [],
    })

    expect(result.state).toBe("AWAITING_OFFICIAL_EXCHANGE_CLASSIFICATION")
    expect(result.researchRoutingAllowed).toBe(false)
  })

  it("allows routing only after official primary and detail classification are usable", () => {
    const result = buildNewStockClassificationIntake({
      assetClass: "EQUITY",
      instrumentType: "EQ",
      symbol: "TEST",
      observations: [
        observation("NSE", { sector: "Banking", industry: "Banks", basicIndustry: "Private Sector Bank" }),
        observation("BSE", { sector: "Banking", industry: "Banks", basicIndustry: "Private Sector Bank" }),
      ],
    })

    expect(result.state).toBe("CLASSIFICATION_READY")
    expect(result.primarySector).toBe("Banking")
    expect(result.researchRoutingAllowed).toBe(true)
  })

  it("does not make a company-research sector for a newly added ETF", () => {
    const result = buildNewStockClassificationIntake({
      assetClass: "ETF",
      instrumentType: "ETF",
      symbol: "GOLDBEES",
      observations: [],
    })

    expect(result.state).toBe("COMPANY_SECTOR_NOT_APPLICABLE")
    expect(result.researchRoutingAllowed).toBe(false)
  })
})
