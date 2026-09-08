import { describe,expect,it } from "vitest"
import {
  fundamentalSemanticKey,
  reconciliationMembers,
  researchDocumentIdentityKey,
  selectMetricLevelFallback,
  storedObservationAfterRefresh,
  toProviderNeutralStage8Input,
  validateStructuredFundamentalField,
  type CanonicalFundamentalCandidate,
} from "./fundamental-resilience"

const candidate = (overrides: Partial<CanonicalFundamentalCandidate>): CanonicalFundamentalCandidate => ({
  observationId:"observation-trendlyne-revenue",
  sourceCode:"TRENDLYNE_MCP",
  sourceRecordId:"raw-trendlyne",
  sourceFieldPath:"financials.consolidated.revenue",
  originalValue:"1,250 Cr",
  metricCode:"REVENUE",
  normalizedValue:"12500000000",
  unit:"INR",
  currency:"INR",
  periodStart:"2025-04-01",
  periodEnd:"2026-03-31",
  periodType:"YEAR",
  consolidationScope:"CONSOLIDATED",
  accountingStandard:"IND_AS",
  observedAt:"2026-05-01T09:00:00Z",
  publishedAt:"2026-05-01T08:30:00Z",
  retrievedAt:"2026-05-01T10:00:00Z",
  freshUntil:"2026-08-01T00:00:00Z",
  ...overrides,
})

describe("multi-source fundamental resilience", () => {
  it("preserves explicit Trendlyne and Screener source field paths", () => {
    const trendlyne=validateStructuredFundamentalField(candidate({}))
    const screener=validateStructuredFundamentalField(candidate({ observationId:"observation-screener-revenue",sourceCode:"SCREENER_IMPORT",sourceRecordId:"raw-screener",sourceFieldPath:"Profit & Loss.Sales",originalValue:"1250",normalizedValue:"12500000000" }))
    expect(trendlyne.sourceFieldPath).toBe("financials.consolidated.revenue")
    expect(screener.sourceFieldPath).toBe("Profit & Loss.Sales")
    expect(fundamentalSemanticKey(trendlyne)).toBe(fundamentalSemanticKey(screener))
  })

  it("uses fallback for one missing metric without switching unrelated primary metrics", () => {
    const revenue=candidate({})
    const profit=candidate({ observationId:"trendlyne-profit",metricCode:"NET_INCOME",sourceFieldPath:"financials.consolidated.pat",normalizedValue:"900000000" })
    const promoter=candidate({ observationId:"official-shareholding",sourceCode:"NSE_FILING",sourceRecordId:"raw-filing",sourceFieldPath:"shareholding.promoter_total",metricCode:"SHAREHOLDING_PROMOTER_PERCENT",normalizedValue:"51",unit:"PERCENT",currency:null,periodStart:null,periodEnd:"2026-03-31",periodType:"POINT_IN_TIME",accountingStandard:null })
    const selected=selectMetricLevelFallback([fundamentalSemanticKey(revenue),fundamentalSemanticKey(profit),fundamentalSemanticKey(promoter)],[revenue,profit],[promoter])
    expect(selected.map((item)=>item.sourceCode)).toEqual(["TRENDLYNE_MCP","TRENDLYNE_MCP","NSE_FILING"])
  })

  it("creates reconciliation membership only for semantically equivalent conflicting observations", () => {
    const trendlyne=candidate({ observationId:"trendlyne-roce",metricCode:"ROCE",sourceFieldPath:"ratios.roce",normalizedValue:"18.2",unit:"PERCENT",currency:null })
    const screener=candidate({ ...trendlyne,observationId:"screener-roce",sourceCode:"SCREENER_IMPORT",sourceRecordId:"raw-screener",sourceFieldPath:"Ratios.ROCE",normalizedValue:"20.1" })
    expect(reconciliationMembers(trendlyne,screener)).toEqual(["trendlyne-roce","screener-roce"])
    expect(reconciliationMembers(trendlyne,{ ...screener,periodType:"TTM" })).toBeNull()
  })

  it("preserves the last trusted observation when refresh fails and ages freshness independently", () => {
    const cached=candidate({ freshUntil:"2026-06-01T00:00:00Z" })
    expect(storedObservationAfterRefresh(cached,"FAILED",new Date("2026-05-02T00:00:00Z"))).toMatchObject({ observation:cached,freshness:"AVAILABLE",refreshStatus:"FAILED" })
    expect(storedObservationAfterRefresh(cached,"FAILED",new Date("2026-06-02T00:00:00Z"))).toMatchObject({ observation:cached,freshness:"STALE",refreshStatus:"FAILED" })
  })

  it("deduplicates official document appearances only with deterministic identity evidence", () => {
    const hash="d".repeat(64)
    expect(researchDocumentIdentityKey({ sourceRecordId:"ir",contentHash:hash,authoritativeScheme:null,authoritativeIdentifier:null,verifiedMetadataHash:null }))
      .toBe(researchDocumentIdentityKey({ sourceRecordId:"trendlyne",contentHash:hash,authoritativeScheme:null,authoritativeIdentifier:null,verifiedMetadataHash:null }))
    expect(researchDocumentIdentityKey({ sourceRecordId:"unknown-a",contentHash:null,authoritativeScheme:null,authoritativeIdentifier:null,verifiedMetadataHash:null }))
      .not.toBe(researchDocumentIdentityKey({ sourceRecordId:"unknown-b",contentHash:null,authoritativeScheme:null,authoritativeIdentifier:null,verifiedMetadataHash:null }))
  })

  it("emits provider-neutral Stage 8 input without provider response paths", () => {
    const input=toProviderNeutralStage8Input(candidate({}))
    expect(input).toMatchObject({ observationId:"observation-trendlyne-revenue",metricCode:"REVENUE" })
    expect(input).not.toHaveProperty("sourceCode")
    expect(input).not.toHaveProperty("sourceFieldPath")
  })
})
