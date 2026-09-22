import { describe, expect, it } from "vitest"
import { AUROPHARMA_G10_2_FINAL_RESULT } from "./auropharmaG102FinalResult"

describe("AUROPHARMA G10.2 final result", () => {
  it("closes fail-closed without partial score reconstruction", () => {
    expect(AUROPHARMA_G10_2_FINAL_RESULT).toEqual(expect.objectContaining({
      state: "COMPLETE_FAIL_CLOSED",
      scoreState: "SCORE_NOT_COMPUTABLE",
      recommendationState: "RECOMMENDATION_NOT_COMPUTABLE",
      noPartialScoreReconstruction: true,
      noRenormalization: true,
    }))
  })

  it("retains explicit blocking evidence groups", () => {
    expect(AUROPHARMA_G10_2_FINAL_RESULT.blockerGroups.length).toBeGreaterThanOrEqual(4)
    expect(AUROPHARMA_G10_2_FINAL_RESULT.gateI.executed).toBe(false)
  })

  it("performs no persistence or production mutation", () => {
    expect(AUROPHARMA_G10_2_FINAL_RESULT.safety).toEqual(expect.objectContaining({
      scorePersistenceEnabled: false,
      recommendationPersistenceEnabled: false,
      productionMutationPerformed: false,
      deploymentPerformed: false,
      prMergePerformed: false,
    }))
  })
})
