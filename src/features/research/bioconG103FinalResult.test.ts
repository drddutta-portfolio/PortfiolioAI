import { describe, expect, it } from "vitest"
import { BIOCON_G10_3_FINAL_RESULT } from "./bioconG103FinalResult"

describe("BIOCON G10.3 final result", () => {
  it("fails closed without partial score reconstruction", () => {
    expect(BIOCON_G10_3_FINAL_RESULT.state).toBe("COMPLETE_FAIL_CLOSED")
    expect(BIOCON_G10_3_FINAL_RESULT.scoreState).toBe("SCORE_NOT_COMPUTABLE")
    expect(BIOCON_G10_3_FINAL_RESULT.recommendationState).toBe("RECOMMENDATION_NOT_COMPUTABLE")
    expect(BIOCON_G10_3_FINAL_RESULT.noPartialScoreReconstruction).toBe(true)
    expect(BIOCON_G10_3_FINAL_RESULT.noRenormalization).toBe(true)
  })

  it("preserves both overlays and AUROPHARMA isolation", () => {
    expect(BIOCON_G10_3_FINAL_RESULT.materialOverlays).toEqual(["GLOBAL_GENERICS", "CDMO_CRAMS"])
    expect(BIOCON_G10_3_FINAL_RESULT.materialOverlayNumericParticipation).toBe(false)
    expect(BIOCON_G10_3_FINAL_RESULT.isolation.auropharmaBiosimilarsExposureResolved).toBe(false)
  })

  it("does not execute Gate I or persistence without a complete score", () => {
    expect(BIOCON_G10_3_FINAL_RESULT.gateI.executed).toBe(false)
    expect(BIOCON_G10_3_FINAL_RESULT.safety.scorePersistenceEnabled).toBe(false)
    expect(BIOCON_G10_3_FINAL_RESULT.safety.recommendationPersistenceEnabled).toBe(false)
    expect(BIOCON_G10_3_FINAL_RESULT.safety.productionMutationPerformed).toBe(false)
  })
})
