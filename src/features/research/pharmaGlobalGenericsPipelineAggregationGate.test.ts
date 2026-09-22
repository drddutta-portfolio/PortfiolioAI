import { describe, expect, it } from "vitest"
import type { PharmaGlobalGenericsPipelineEvidenceItem } from "./pharmaGlobalGenericsPipelineEvidenceContract"
import {
  PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE,
  assessGlobalGenericsPipelineAggregationReadiness,
} from "./pharmaGlobalGenericsPipelineAggregationGate"

function event(
  stage: PharmaGlobalGenericsPipelineEvidenceItem["stage"],
  overrides: Partial<PharmaGlobalGenericsPipelineEvidenceItem> = {},
): PharmaGlobalGenericsPipelineEvidenceItem {
  return {
    productOrMolecule: "Material molecule",
    geography: "US",
    stage,
    eventDate: "2026-09-01",
    sourceType: "OFFICIAL_REGULATOR",
    materialityEstablished: true,
    economicRelevanceEstablished: true,
    evidenceReference: "official-reference",
    ...overrides,
  }
}

describe("PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE", () => {
  it("keeps every aggregation method unapproved and combined scoring blocked", () => {
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE.approvedAggregationMethod).toBeNull()
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE.safeguards.simpleAverageApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE.safeguards.medianApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE.safeguards.recencyWeightingApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE.safeguards.materialityWeightingApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE.combinedPipelineScoreReady).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE.scoreExecutionEnabled).toBe(false)
  })

  it("preserves adverse-event visibility without producing a combined score", () => {
    const result = assessGlobalGenericsPipelineAggregationReadiness([
      event("COMMERCIAL_TRACTION_CONFIRMED"),
      event("DELAYED_OR_BLOCKED"),
      event("WITHDRAWN_OR_DISCONTINUED"),
    ])

    expect(result.state).toBe("AWAITING_METHODOLOGY_APPROVAL")
    expect(result.eligibleEventCount).toBe(3)
    expect(result.adverseEventCount).toBe(2)
    expect(result.normalizedScores).toEqual([100, 20, 0])
    expect(result.combinedScore).toBeNull()
  })

  it("fails closed when any event is not eligible for G6.20 normalization", () => {
    const result = assessGlobalGenericsPipelineAggregationReadiness([
      event("FINAL_APPROVAL"),
      event("LAUNCHED", { materialityEstablished: false }),
    ])

    expect(result.state).toBe("REVIEW_REQUIRED")
    expect(result.eligibleEventCount).toBe(1)
    expect(result.combinedScore).toBeNull()
  })

  it("returns insufficient evidence for an empty event set", () => {
    expect(assessGlobalGenericsPipelineAggregationReadiness([])).toEqual({
      state: "INSUFFICIENT_EVIDENCE",
      eligibleEventCount: 0,
      adverseEventCount: 0,
      normalizedScores: [],
      combinedScore: null,
    })
  })
})
