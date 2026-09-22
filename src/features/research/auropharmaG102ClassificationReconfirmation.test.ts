import { describe, expect, it } from "vitest"
import { AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION } from "./auropharmaG102ClassificationReconfirmation"

describe("G10.2 AUROPHARMA classification re-confirmation", () => {
  it("re-confirms the existing reviewed Global Generics primary without rebuilding it", () => {
    expect(AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION).toEqual(
      expect.objectContaining({
        stage: "G10.2",
        checkpoint: "A",
        state: "READY_FOR_OWNER_RECONFIRMATION",
        primary: "GLOBAL_GENERICS",
        materialOverlays: [],
        emergingWatches: ["API_BULK_DRUGS"],
        unresolvedExposures: ["BIOPHARMA_BIOSIMILARS"],
        reReviewRequiredBecauseOfNewEvidence: false,
        classificationRebuiltFromScratch: false,
      }),
    )
  })

  it("preserves the two-period conservative Global Generics leadership proof", () => {
    expect(AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.annualMix).toEqual([
      {
        periodEnd: "2025-03-31",
        globalGenericsLowerBoundPercent: 73.04,
        apiSharePercent: 13.63,
      },
      {
        periodEnd: "2026-03-31",
        globalGenericsLowerBoundPercent: 73.46,
        apiSharePercent: 12.03,
      },
    ])
  })

  it("keeps Biosimilars unresolved and scoring fail-closed before Checkpoint B", () => {
    expect(AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.unresolvedExposures).toEqual([
      "BIOPHARMA_BIOSIMILARS",
    ])
    expect(AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.scoreStateBeforeCheckpointB).toBe(
      "SCORE_NOT_COMPUTABLE",
    )
    expect(AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.scoreBlocker).toBe(
      "GLOBAL_GENERICS_PRIMARY_METHODOLOGY_INCOMPLETE",
    )
    expect(AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.scoreExecutionEnabled).toBe(false)
    expect(AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.recommendationExecutionEnabled).toBe(false)
    expect(AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.persistenceEnabled).toBe(false)
  })
})
