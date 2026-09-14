import { describe, expect, it } from "vitest"
import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"
import { evaluateResearchProfileContract, type ResearchMetricEvidence } from "./researchProfileContract"

function evidence(metricCode: string, observationCount: number, state: ResearchMetricEvidence["state"] = "FRESH"): ResearchMetricEvidence {
  return { metricCode, observationCount, state }
}

const mandatoryReady: ResearchMetricEvidence[] = [
  evidence("PHARMA_REVENUE_GROWTH_HISTORY", 3),
  evidence("PHARMA_OPERATING_MARGIN_HISTORY", 8),
  evidence("PHARMA_ROCE_HISTORY", 3),
  evidence("PHARMA_PAT_EPS_HISTORY", 3),
  evidence("PHARMA_CASH_CONVERSION_HISTORY", 3),
  evidence("PHARMA_BALANCE_SHEET_LEVERAGE", 3),
]

const importantReady: ResearchMetricEvidence[] = [
  evidence("PHARMA_RND_INTENSITY", 3),
  evidence("PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE", 1),
  evidence("PHARMA_OWNERSHIP_GOVERNANCE", 4),
  evidence("PHARMA_VALUATION_CONTEXT", 1),
]

describe("PHARMA_RESEARCH_PROFILE_V1", () => {
  it("is explicitly versioned and contains no score curve before scoring review", () => {
    expect(PHARMA_RESEARCH_PROFILE_V1.profileCode).toBe("PHARMA")
    expect(PHARMA_RESEARCH_PROFILE_V1.profileVersion).toBe("PHARMA_V1")
    expect(PHARMA_RESEARCH_PROFILE_V1.metrics.every((metric) => metric.scoreCurveVersion === null)).toBe(true)
  })

  it("fails closed when only single-period snapshot evidence exists", () => {
    const result = evaluateResearchProfileContract(PHARMA_RESEARCH_PROFILE_V1, {
      evidence: [
        evidence("PHARMA_REVENUE_GROWTH_HISTORY", 1),
        evidence("PHARMA_OPERATING_MARGIN_HISTORY", 1),
        evidence("PHARMA_ROCE_HISTORY", 1),
        evidence("PHARMA_PAT_EPS_HISTORY", 1),
        evidence("PHARMA_CASH_CONVERSION_HISTORY", 1),
        evidence("PHARMA_BALANCE_SHEET_LEVERAGE", 1),
      ],
    })
    expect(result.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(result.insufficientHistory).toEqual(expect.arrayContaining([
      "PHARMA_REVENUE_GROWTH_HISTORY",
      "PHARMA_OPERATING_MARGIN_HISTORY",
      "PHARMA_ROCE_HISTORY",
      "PHARMA_PAT_EPS_HISTORY",
      "PHARMA_CASH_CONVERSION_HISTORY",
      "PHARMA_BALANCE_SHEET_LEVERAGE",
    ]))
  })

  it("keeps the profile partial when mandatory evidence is ready but important evidence is missing", () => {
    const result = evaluateResearchProfileContract(PHARMA_RESEARCH_PROFILE_V1, { evidence: mandatoryReady })
    expect(result.state).toBe("PARTIAL")
    expect(result.missingMandatory).toHaveLength(0)
    expect(result.missingImportant).toEqual(expect.arrayContaining([
      "PHARMA_RND_INTENSITY",
      "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE",
      "PHARMA_OWNERSHIP_GOVERNANCE",
      "PHARMA_VALUATION_CONTEXT",
    ]))
  })

  it("can become READY when mandatory and important non-conditional evidence is satisfied", () => {
    const result = evaluateResearchProfileContract(PHARMA_RESEARCH_PROFILE_V1, {
      evidence: [...mandatoryReady, ...importantReady],
    })
    expect(result.state).toBe("READY")
  })

  it("activates regulatory evidence only for material regulated-export exposure", () => {
    const withoutExposure = evaluateResearchProfileContract(PHARMA_RESEARCH_PROFILE_V1, {
      evidence: [...mandatoryReady, ...importantReady],
    })
    expect(withoutExposure.state).toBe("READY")

    const withExposureMissing = evaluateResearchProfileContract(PHARMA_RESEARCH_PROFILE_V1, {
      evidence: [...mandatoryReady, ...importantReady],
      activeConditions: ["REGULATED_EXPORT_EXPOSURE"],
    })
    expect(withExposureMissing.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(withExposureMissing.missingMandatory).toContain("PHARMA_REGULATORY_SITE_STATUS")
  })

  it("requires current regulatory evidence and blocks review conflicts", () => {
    const result = evaluateResearchProfileContract(PHARMA_RESEARCH_PROFILE_V1, {
      evidence: [
        ...mandatoryReady,
        ...importantReady,
        evidence("PHARMA_REGULATORY_SITE_STATUS", 1, "CONFLICTING"),
      ],
      activeConditions: ["REGULATED_EXPORT_EXPOSURE"],
    })
    expect(result.state).toBe("BLOCKED_REVIEW")
    expect(result.reviewBlocked).toContain("PHARMA_REGULATORY_SITE_STATUS")
  })

  it("treats stale mandatory evidence as insufficient rather than silently usable", () => {
    const result = evaluateResearchProfileContract(PHARMA_RESEARCH_PROFILE_V1, {
      evidence: [
        ...mandatoryReady.filter((item) => item.metricCode !== "PHARMA_ROCE_HISTORY"),
        evidence("PHARMA_ROCE_HISTORY", 3, "STALE"),
        ...importantReady,
      ],
    })
    expect(result.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(result.staleMandatory).toContain("PHARMA_ROCE_HISTORY")
  })
})
