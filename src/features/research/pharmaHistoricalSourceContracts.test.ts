import { describe, expect, it } from "vitest"
import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"
import {
  PHARMA_HISTORICAL_SOURCE_CONTRACT_CANDIDATES,
  pharmaHistoricalSourceCandidate,
} from "./pharmaHistoricalSourceContracts"

describe("PHARMA historical source contract candidates", () => {
  it("keeps every candidate non-ready until raw period lineage is separately proven", () => {
    for (const candidate of PHARMA_HISTORICAL_SOURCE_CONTRACT_CANDIDATES) {
      expect(candidate.canSatisfyPharmaV1HistoryRequirement).toBe(false)
      expect(candidate.requiresNewProviderCallToProveContract).toBe(true)
    }
  })

  it("has unique profile metric candidates", () => {
    const codes = PHARMA_HISTORICAL_SOURCE_CONTRACT_CANDIDATES.map((item) => item.profileMetricCode)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it("covers every unconditional mandatory longitudinal PHARMA_V1 metric", () => {
    const requiredHistoricalMetrics = PHARMA_RESEARCH_PROFILE_V1.metrics
      .filter((metric) => metric.requirementLevel === "MANDATORY")
      .filter((metric) => metric.applicability === "APPLICABLE")
      .filter((metric) => metric.history.minimumObservations > 1)
      .map((metric) => metric.metricCode)

    for (const metricCode of requiredHistoricalMetrics) {
      expect(pharmaHistoricalSourceCandidate(metricCode), metricCode).not.toBeNull()
    }
  })

  it("distinguishes exact observed aggregates from unproven source capability", () => {
    expect(pharmaHistoricalSourceCandidate("PHARMA_PAT_EPS_HISTORY")?.state).toBe("OBSERVED_EXACT_AGGREGATE")
    expect(pharmaHistoricalSourceCandidate("PHARMA_CASH_CONVERSION_HISTORY")?.state).toBe("OBSERVED_EXACT_AGGREGATE")
    expect(pharmaHistoricalSourceCandidate("PHARMA_BALANCE_SHEET_LEVERAGE")?.state).toBe("UNPROVEN_IN_STORED_DISCOVERY")
  })

  it("does not mistake current/aggregate capability for the raw history contract", () => {
    expect(pharmaHistoricalSourceCandidate("PHARMA_OPERATING_MARGIN_HISTORY")?.state).toBe("OBSERVED_CURRENT_POINT_ONLY")
    expect(pharmaHistoricalSourceCandidate("PHARMA_ROCE_HISTORY")?.state).toBe("OBSERVED_CURRENT_POINT_ONLY")
    expect(pharmaHistoricalSourceCandidate("PHARMA_REVENUE_GROWTH_HISTORY")?.state).toBe("OBSERVED_RELATED_FIELD_ONLY")
  })

  it("returns null for a metric outside this historical contract slice", () => {
    expect(pharmaHistoricalSourceCandidate("PHARMA_REGULATORY_SITE_STATUS")).toBeNull()
  })
})
