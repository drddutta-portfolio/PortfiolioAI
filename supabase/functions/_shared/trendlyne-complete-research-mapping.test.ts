import { describe, expect, it } from "vitest"
import { mapApprovedCompleteResearchMetrics } from "./trendlyne-complete-research-mapping.ts"

const response = JSON.stringify({ markdown_data: [
  "807|Mahindra & Mahindra|M&M",
  "ROCE Ann. %",
  "M&M: 16.42",
  "---",
  "OPM TTM %",
  "M&M: 18.60",
  "---",
  "Promoter holding pledge percentage % Qtr",
  "M&M: 0.02",
  "---",
  "Fair Price 5YrPE Upside%",
  "M&M: 24.50",
  "---",
].join("\\n") })

describe("Complete Research Refresh exact metric mapping", () => {
  it("maps only approved fields for the exact primary entity", () => {
    const metrics = mapApprovedCompleteResearchMetrics(response, "M&M", "807")
    expect(metrics.map(metric => metric.canonicalCode)).toEqual([
      "ROCE_ANNUAL",
      "OPM_TTM",
      "SHAREHOLDING_PROMOTER_PLEDGE_PERCENT",
      "PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT",
    ])
    expect(metrics.map(metric => metric.numericValue)).toEqual([16.42, 18.6, 0.02, 24.5])
    expect(metrics.at(-1)?.periodType).toBe("POINT_IN_TIME")
  })

  it("rejects a substituted primary entity", () => {
    expect(() => mapApprovedCompleteResearchMetrics(response, "M&MFIN", "808")).toThrow("PROVIDER_PRIMARY_ENTITY_MISMATCH")
  })
})
