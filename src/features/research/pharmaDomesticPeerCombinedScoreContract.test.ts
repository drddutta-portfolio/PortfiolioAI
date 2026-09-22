import { describe, expect, it } from "vitest"
import {
  combineDomesticPeerRelativeScores,
  PHARMA_DOMESTIC_PEER_COMBINED_SCORE,
} from "./pharmaDomesticPeerCombinedScoreContract"

describe("Domestic Formulations peer combined score contract", () => {
  it("uses the explicitly owner-approved 50/50 weighting", () => {
    expect(PHARMA_DOMESTIC_PEER_COMBINED_SCORE.method).toBe("WEIGHTED_MEAN")
    expect(PHARMA_DOMESTIC_PEER_COMBINED_SCORE.weights).toEqual({
      pe: 0.5,
      evEbitda: 0.5,
    })
    expect(PHARMA_DOMESTIC_PEER_COMBINED_SCORE.state).toBe("OWNER_APPROVED_NOT_ACTIVE")
  })

  it("combines valid normalized inputs using 50/50", () => {
    expect(combineDomesticPeerRelativeScores({
      peScore: 80,
      evEbitdaScore: 60,
    })).toEqual({
      state: "READY",
      combinedScore: 70,
      peWeight: 0.5,
      evEbitdaWeight: 0.5,
    })
  })

  it("fails closed when either input is missing or invalid", () => {
    expect(combineDomesticPeerRelativeScores({
      peScore: 80,
      evEbitdaScore: null,
    }).combinedScore).toBeNull()

    expect(combineDomesticPeerRelativeScores({
      peScore: 101,
      evEbitdaScore: 60,
    }).state).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("prohibits single-metric fallback and hidden reweighting", () => {
    expect(PHARMA_DOMESTIC_PEER_COMBINED_SCORE.singleMetricFallbackAllowed).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_COMBINED_SCORE.hiddenReweightingAllowed).toBe(false)
  })

  it("records the evidence-first revisit triggers", () => {
    expect(PHARMA_DOMESTIC_PEER_COMBINED_SCORE.revisitTriggers).toEqual([
      {
        code: "MATERIAL_PE_EV_SCORE_DIVERGENCE_IN_BACKTEST",
        automaticNumericThresholdApproved: false,
        action: "METHODOLOGY_REVIEW_REQUIRED",
      },
      {
        code: "MEANINGFUL_PEER_LEVERAGE_HETEROGENEITY",
        examples: ["M_AND_A_FUNDED_ENTRANT", "MATERIALLY_DIFFERENT_NET_DEBT_PROFILE"],
        action: "METHODOLOGY_REVIEW_REQUIRED",
      },
    ])
  })

  it("does not invent a numeric divergence threshold", () => {
    const divergenceTrigger = PHARMA_DOMESTIC_PEER_COMBINED_SCORE.revisitTriggers[0]
    expect(divergenceTrigger.code).toBe("MATERIAL_PE_EV_SCORE_DIVERGENCE_IN_BACKTEST")
    expect(divergenceTrigger.automaticNumericThresholdApproved).toBe(false)
  })

  it("makes the peer component method-ready but does not activate whole Valuation", () => {
    expect(PHARMA_DOMESTIC_PEER_COMBINED_SCORE.combinedPeerComponentScoreReady).toBe(true)
    expect(PHARMA_DOMESTIC_PEER_COMBINED_SCORE.wholeValuationDimensionReady).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_COMBINED_SCORE.activationApproved).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_COMBINED_SCORE.scoreExecutionEnabled).toBe(false)
  })
})
