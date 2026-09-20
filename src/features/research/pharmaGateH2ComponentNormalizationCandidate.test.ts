import { describe, expect, it } from "vitest"
import {
  normalizeRegulatoryRuntimeContext,
  normalizeReviewedQualitativeComponent,
  PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE,
} from "./pharmaGateH2ComponentNormalizationCandidate"

describe("H2 component-normalization rubric", () => {
  it("provides a deterministic reviewed-evidence ordinal rubric", () => {
    expect(normalizeReviewedQualitativeComponent("VERY_STRONG")).toBe(90)
    expect(normalizeReviewedQualitativeComponent("STRONG")).toBe(75)
    expect(normalizeReviewedQualitativeComponent("NEUTRAL")).toBe(50)
    expect(normalizeReviewedQualitativeComponent("WEAK")).toBe(25)
    expect(normalizeReviewedQualitativeComponent("VERY_WEAK")).toBe(10)
    expect(normalizeReviewedQualitativeComponent("REVIEW_REQUIRED")).toBeNull()
  })

  it("requires reviewed evidence and forbids analyst freeform numeric scores", () => {
    const rules =
      PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE
        .qualitativeReviewRequirements
    expect(rules.officialOrApprovedEvidenceRequired).toBe(true)
    expect(rules.rationaleRequired).toBe(true)
    expect(rules.sourceLineageRequired).toBe(true)
    expect(rules.contradictionStateRequired).toBe(true)
    expect(rules.unresolvedMaterialContradictionReturnsReviewRequired).toBe(true)
    expect(rules.missingEvidenceReturnsReviewRequired).toBe(true)
    expect(rules.analystFreeformNumericScoreAllowed).toBe(false)
  })

  it("preserves High Risk as interpretation-only with no second numeric penalty", () => {
    expect(normalizeRegulatoryRuntimeContext("CLEAR")).toBe(100)
    expect(normalizeRegulatoryRuntimeContext("HIGH_RISK")).toBe(100)
    expect(normalizeRegulatoryRuntimeContext("REVIEW_REQUIRED")).toBeNull()
    expect(normalizeRegulatoryRuntimeContext("BLOCKED_REVIEW")).toBeNull()
  })

  it("is owner-approved but remains non-active and non-executing", () => {
    expect(PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE.state).toBe(
      "OWNER_APPROVED_NOT_ACTIVE",
    )
    expect(PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE.methodologyApproved)
      .toBe(true)
    expect(PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE.scoreExecutionEnabled)
      .toBe(false)
    expect(
      PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE.persistedScoreRunEnabled,
    ).toBe(false)
  })
})
