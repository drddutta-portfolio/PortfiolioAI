import { describe, expect, it } from "vitest"
import { SYNGENE_G10_4_FINAL_RESULT } from "./syngeneG104FinalResult"

describe("Gate J G10.4 SYNGENE deterministic result", () => {
  it("fails closed without reconstructing a partial score", () => {
    expect(SYNGENE_G10_4_FINAL_RESULT.state).toBe("COMPLETE_FAIL_CLOSED")
    expect(SYNGENE_G10_4_FINAL_RESULT.scoreState).toBe("SCORE_NOT_COMPUTABLE")
    expect(SYNGENE_G10_4_FINAL_RESULT.recommendationState).toBe("RECOMMENDATION_NOT_COMPUTABLE")
    expect(SYNGENE_G10_4_FINAL_RESULT.noPartialScoreReconstruction).toBe(true)
    expect(SYNGENE_G10_4_FINAL_RESULT.noRenormalization).toBe(true)
  })

  it("does not execute Gate I without a complete ten-dimension score", () => {
    expect(SYNGENE_G10_4_FINAL_RESULT.gateI.executed).toBe(false)
    expect(SYNGENE_G10_4_FINAL_RESULT.gateI.reason).toBe("NO_COMPLETE_TEN_DIMENSION_SCORE")
    expect(SYNGENE_G10_4_FINAL_RESULT.gateI.policyUnchanged).toBe(true)
  })

  it("keeps all persistence and production actions off", () => {
    expect(SYNGENE_G10_4_FINAL_RESULT.safety.scorePersistenceEnabled).toBe(false)
    expect(SYNGENE_G10_4_FINAL_RESULT.safety.recommendationPersistenceEnabled).toBe(false)
    expect(SYNGENE_G10_4_FINAL_RESULT.safety.productionMutationPerformed).toBe(false)
    expect(SYNGENE_G10_4_FINAL_RESULT.safety.deploymentPerformed).toBe(false)
    expect(SYNGENE_G10_4_FINAL_RESULT.safety.prMergePerformed).toBe(false)
  })
})
