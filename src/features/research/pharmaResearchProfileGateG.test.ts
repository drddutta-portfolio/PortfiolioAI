import { describe, expect, it } from "vitest"
import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"
import {
  PHARMA_GATE_G_RECONCILED_METRIC_CODES,
  PHARMA_RESEARCH_PROFILE_GATE_G,
} from "./pharmaResearchProfileGateG"

describe("versioned Gate G Pharma parent profile", () => {
  it("preserves the historical PHARMA_V1 profile while publishing a new version", () => {
    expect(PHARMA_RESEARCH_PROFILE_V1.profileVersion).toBe("PHARMA_V1")
    expect(PHARMA_RESEARCH_PROFILE_GATE_G.profileVersion).toBe(
      "PHARMA_V1_GATE_G_DIMENSIONS_V1",
    )
    expect(PHARMA_RESEARCH_PROFILE_GATE_G.metrics).toHaveLength(
      PHARMA_RESEARCH_PROFILE_V1.metrics.length,
    )
  })

  it("reconciles exactly the four approved canonical dimensions", () => {
    const byCode = new Map(
      PHARMA_RESEARCH_PROFILE_GATE_G.metrics.map((metric) => [
        metric.metricCode,
        metric.dimension,
      ]),
    )

    expect(PHARMA_GATE_G_RECONCILED_METRIC_CODES).toEqual([
      "PHARMA_ROCE_HISTORY",
      "PHARMA_CASH_CONVERSION_HISTORY",
      "PHARMA_BALANCE_SHEET_LEVERAGE",
      "PHARMA_OWNERSHIP_GOVERNANCE",
    ])
    expect(byCode.get("PHARMA_ROCE_HISTORY")).toBe("CAPITAL_EFFICIENCY")
    expect(byCode.get("PHARMA_CASH_CONVERSION_HISTORY")).toBe("CASH_FLOW")
    expect(byCode.get("PHARMA_BALANCE_SHEET_LEVERAGE")).toBe("BALANCE_SHEET_CREDIT")
    expect(byCode.get("PHARMA_OWNERSHIP_GOVERNANCE")).toBe("OWNERSHIP_GOVERNANCE")
  })

  it("does not alter metric identity, requirement level, evidence semantics or scoring activation", () => {
    for (const legacy of PHARMA_RESEARCH_PROFILE_V1.metrics) {
      const reconciled = PHARMA_RESEARCH_PROFILE_GATE_G.metrics.find(
        (metric) => metric.metricCode === legacy.metricCode,
      )
      expect(reconciled).toBeDefined()
      expect(reconciled?.metricCode).toBe(legacy.metricCode)
      expect(reconciled?.requirementLevel).toBe(legacy.requirementLevel)
      expect(reconciled?.sourceContract).toBe(legacy.sourceContract)
      expect(reconciled?.calculationOwner).toBe(legacy.calculationOwner)
      expect(reconciled?.scoreCurveVersion).toBeNull()
    }
  })
})
