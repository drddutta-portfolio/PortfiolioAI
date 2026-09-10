import { describe, expect, it } from "vitest"
import { mapObservedTrendlyneReviewCandidates } from "./trendlyne-observed-mapping"

const providerResult = JSON.stringify({
  markdown_data: '"533|HDFC Bank|HDFCBANK|500180|2026-09-10\\n\\nROCE Ann. %\\nHDFCBANK:6.75\\nAXISBANK:6.56\\n\\n---\\n\\nROCE Ann. 3Y Avg %\\nHDFCBANK:6.79\\n\\n---\\n\\nDiluted EPS Qtr\\nHDFCBANK:12.47\\n\\n---\\n\\nEBITDA TTM\\nHDFCBANK:293893.13\\n\\n---\\n\\nOPM TTM %\\nHDFCBANK:35.14\\n\\n---\\n\\nEBITDA Ann. margin %\\nHDFCBANK:26.84\\n"',
})

describe("observed Trendlyne exact-label mapping", () => {
  it("extracts only the four reviewed provider labels for the requested symbol", () => {
    expect(mapObservedTrendlyneReviewCandidates(providerResult, "HDFCBANK")).toEqual([
      { canonicalCode: "ROCE_ANNUAL", providerLabel: "ROCE Ann. %", numericValue: 6.75, canonicalUnit: "PERCENT", periodType: "YEAR", mappingState: "REVIEW_CANDIDATE" },
      { canonicalCode: "EPS_DILUTED", providerLabel: "Diluted EPS Qtr", numericValue: 12.47, canonicalUnit: "INR_PER_SHARE", periodType: "QUARTER", mappingState: "REVIEW_CANDIDATE" },
      { canonicalCode: "EBITDA_TTM", providerLabel: "EBITDA TTM", numericValue: 293893.13, canonicalUnit: "INR_CRORE", periodType: "TTM", mappingState: "REVIEW_CANDIDATE" },
      { canonicalCode: "OPM_TTM", providerLabel: "OPM TTM %", numericValue: 35.14, canonicalUnit: "PERCENT", periodType: "TTM", mappingState: "REVIEW_CANDIDATE" },
    ])
  })

  it("does not confuse near-match labels with the reviewed labels", () => {
    const nearMatches = JSON.stringify({ markdown_data: '"ROCE Ann. 3Y Avg %\\nHDFCBANK:6.79\\n---\\nEBITDA Ann. margin %\\nHDFCBANK:26.84\\n---\\nOPM Qtr 4Qtr ago %\\nHDFCBANK:41.39\\n"' })
    expect(mapObservedTrendlyneReviewCandidates(nearMatches, "HDFCBANK")).toEqual([])
  })

  it("fails closed for None, malformed values or duplicate exact sections", () => {
    const invalid = JSON.stringify({ markdown_data: '"ROCE Ann. %\\nHDFCBANK:None\\n---\\nDiluted EPS Qtr\\nHDFCBANK:not-a-number\\n---\\nEBITDA TTM\\nHDFCBANK:1\\n---\\nEBITDA TTM\\nHDFCBANK:2\\n"' })
    expect(mapObservedTrendlyneReviewCandidates(invalid, "HDFCBANK")).toEqual([])
  })

  it("rejects provider results without JSON markdown_data", () => {
    expect(() => mapObservedTrendlyneReviewCandidates("not-json", "HDFCBANK")).toThrow("PROVIDER_RESULT_JSON_INVALID")
    expect(() => mapObservedTrendlyneReviewCandidates("{}", "HDFCBANK")).toThrow("PROVIDER_MARKDOWN_MISSING")
  })
})
