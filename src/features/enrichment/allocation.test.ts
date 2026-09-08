import { describe, expect, it } from "vitest"
import type { PortfolioPosition } from "../portfolio/types"
import type { SecurityEnrichment } from "./types"
import { enrichmentAllocation } from "./allocation"

const position = (securityId: string, assetClass: string, value: string | null) => ({ securityId, assetClass, currentValue: value }) as PortfolioPosition
const enrichment = (securityId: string, sector: string | null, category: SecurityEnrichment["marketCapCategory"]) => ({ securityId, sector, marketCapCategory: category }) as SecurityEnrichment

describe("trusted enrichment allocation", () => {
  it("uses the full priced denominator and explicit unavailable buckets", () => {
    const map = new Map([["a",enrichment("a","Financial Services","LARGE_CAP")]])
    const rows = enrichmentAllocation([position("a","EQUITY","60"),position("b","EQUITY","30"),position("c","ETF","10"),position("d","EQUITY",null)],map,"sector")
    expect(rows).toEqual([
      { label: "Financial Services", value: "60", percentage: "60" },
      { label: "Unclassified", value: "30", percentage: "30" },
      { label: "ETF / non-equity", value: "10", percentage: "10" },
    ])
  })
  it("keeps cap category separate from current market-cap amount", () => {
    const map = new Map([["a",enrichment("a",null,"MID_CAP")]])
    expect(enrichmentAllocation([position("a","EQUITY","75"),position("b","EQUITY","25")],map,"marketCap")).toEqual([
      { label: "Mid cap", value: "75", percentage: "75" },
      { label: "Unavailable", value: "25", percentage: "25" },
    ])
  })
})
