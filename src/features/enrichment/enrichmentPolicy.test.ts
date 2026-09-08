import { describe, expect, it } from "vitest"
import { aggregateEnrichmentState, classifyFullMarketCapRank, compareMarketCaps } from "./enrichmentPolicy"

describe("SEBI/AMFI full market-cap rank policy", () => {
  it.each([[1,"LARGE_CAP"],[100,"LARGE_CAP"],[101,"MID_CAP"],[250,"MID_CAP"],[251,"SMALL_CAP"]] as const)("classifies rank %s", (rank, expected) => {
    expect(classifyFullMarketCapRank(rank, 500)).toBe(expected)
  })
  it("does not invent a category without a complete minimum universe", () => {
    expect(classifyFullMarketCapRank(12, 250)).toBe("INSUFFICIENT_EVIDENCE")
    expect(classifyFullMarketCapRank(null, 500)).toBe("INSUFFICIENT_EVIDENCE")
  })
})

describe("enrichment coverage state", () => {
  it("distinguishes all-unavailable data from partial coverage", () => {
    expect(aggregateEnrichmentState(["UNAVAILABLE","UNAVAILABLE"],true)).toBe("UNAVAILABLE")
    expect(aggregateEnrichmentState(["AVAILABLE","UNAVAILABLE"],true)).toBe("PARTIAL")
    expect(aggregateEnrichmentState(["AVAILABLE"],false)).toBe("PARTIAL")
  })
})

describe("market-cap conflict routing", () => {
  const base = { value: "100000000", currency: "INR", basis: "FULL" as const, asOf: "2026-09-08T10:00:00Z" }
  it("accepts a small explainable same-date difference", () => expect(compareMarketCaps(base, { ...base, value: "100900000" })).toBe("EQUIVALENT"))
  it("routes a material same-date difference to conflict", () => expect(compareMarketCaps(base, { ...base, value: "102000000" })).toBe("CONFLICT"))
  it("allows wider adjacent-date movement", () => expect(compareMarketCaps(base, { ...base, value: "104000000", asOf: "2026-09-09T10:00:00Z" })).toBe("EQUIVALENT"))
  it("does not compare mismatched bases or distant dates", () => {
    expect(compareMarketCaps(base, { ...base, basis: "FREE_FLOAT" })).toBe("NOT_COMPARABLE")
    expect(compareMarketCaps(base, { ...base, asOf: "2026-09-11T10:00:00Z" })).toBe("NOT_COMPARABLE")
  })
})
