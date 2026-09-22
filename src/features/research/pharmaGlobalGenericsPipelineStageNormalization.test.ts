import { describe, expect, it } from "vitest"
import {
  normalizeGlobalGenericsPipelineEvent,
  PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION,
} from "./pharmaGlobalGenericsPipelineStageNormalization"

describe("Global Generics pipeline stage normalization", () => {
  it("maps distinct pipeline stages to distinct proposal scores", () => {
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION.stageScores).toEqual([
      expect.objectContaining({ stage: "FILED_OR_SUBMITTED", score: 40 }),
      expect.objectContaining({ stage: "TENTATIVE_APPROVAL", score: 55 }),
      expect.objectContaining({ stage: "FINAL_APPROVAL", score: 70 }),
      expect.objectContaining({ stage: "LAUNCHED", score: 85 }),
      expect.objectContaining({ stage: "COMMERCIAL_TRACTION_CONFIRMED", score: 100 }),
      expect.objectContaining({ stage: "DELAYED_OR_BLOCKED", score: 20 }),
      expect.objectContaining({ stage: "WITHDRAWN_OR_DISCONTINUED", score: 0 }),
    ])
  })

  it("requires materiality, economic relevance and traceability before an event can normalize", () => {
    expect(
      normalizeGlobalGenericsPipelineEvent({
        productOrMolecule: "Product A",
        geography: "US",
        stage: "FINAL_APPROVAL",
        eventDate: "2026-01-01",
        sourceType: "OFFICIAL_REGULATOR",
        materialityEstablished: false,
        economicRelevanceEstablished: true,
        evidenceReference: "REF-1",
      }),
    ).toBeNull()
  })

  it("normalizes a fully identified event without aggregating it", () => {
    expect(
      normalizeGlobalGenericsPipelineEvent({
        productOrMolecule: "Product A",
        geography: "US",
        stage: "LAUNCHED",
        eventDate: "2026-01-01",
        sourceType: "ISSUER",
        materialityEstablished: true,
        economicRelevanceEstablished: true,
        evidenceReference: "REF-1",
      }),
    ).toEqual(expect.objectContaining({
      stage: "LAUNCHED",
      score: 85,
    }))
  })

  it("uses materiality as an eligibility gate rather than an invented numeric multiplier", () => {
    expect(
      PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION.materialityTreatment.actsAsEligibilityGateOnly,
    ).toBe(true)
    expect(
      PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION.materialityTreatment.numericMaterialityMultiplierApproved,
    ).toBe(false)
    expect(
      PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION.materialityTreatment.inferredMaterialityAllowed,
    ).toBe(false)
  })

  it("prohibits event-count bonuses and unapproved aggregation", () => {
    const boundary = PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION.aggregationBoundary
    expect(boundary.eventCountBonusAllowed).toBe(false)
    expect(boundary.simpleAverageAcrossEventsApproved).toBe(false)
    expect(boundary.medianAcrossEventsApproved).toBe(false)
    expect(boundary.recencyWeightingApproved).toBe(false)
    expect(boundary.combinedPipelineScoreReady).toBe(false)
  })

  it("prevents unrelated positive events from silently cancelling adverse events", () => {
    expect(
      PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION.aggregationBoundary
        .adverseEventOffsetByUnrelatedSuccessAllowed,
    ).toBe(false)
  })

  it("remains proposal-only and inactive", () => {
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION.scoreExecutionEnabled).toBe(false)
  })
})
