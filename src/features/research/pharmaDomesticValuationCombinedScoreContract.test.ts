import { describe, expect, it } from "vitest"
import {
  combineDomesticValuationScores,
  PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE,
} from "./pharmaDomesticValuationCombinedScoreContract"

describe("Domestic Formulations Valuation combined score contract", () => {
  it("uses the explicitly owner-approved 40/40/20 component weighting", () => {
    expect(PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.weights).toEqual({
      selfHistory: 0.4,
      peerRelative: 0.4,
      cashFlowCorroboration: 0.2,
    })
    expect(PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.state).toBe("OWNER_APPROVED_NOT_ACTIVE")
  })

  it("cross-references the upstream G6.15 PE/EV 50/50 peer assumption", () => {
    expect(PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.upstreamAssumptions).toEqual({
      peerRelativeContract: "PHARMA_DOMESTIC_PEER_COMBINED_SCORE_V1_OWNER_APPROVED",
      peerRelativePeWeight: 0.5,
      peerRelativeEvEbitdaWeight: 0.5,
      crossReference: "G6.15_TO_G6.17",
    })
  })

  it("combines valid component scores using 40/40/20", () => {
    expect(combineDomesticValuationScores({
      selfHistoryScore: 80,
      peerRelativeScore: 60,
      cashFlowCorroborationScore: 40,
    })).toEqual({
      state: "READY",
      combinedScore: 64,
      selfHistoryWeight: 0.4,
      peerRelativeWeight: 0.4,
      cashFlowCorroborationWeight: 0.2,
    })
  })

  it("fails closed when any component score is missing or invalid", () => {
    expect(combineDomesticValuationScores({
      selfHistoryScore: 80,
      peerRelativeScore: 60,
      cashFlowCorroborationScore: null,
    }).combinedScore).toBeNull()

    expect(combineDomesticValuationScores({
      selfHistoryScore: 101,
      peerRelativeScore: 60,
      cashFlowCorroborationScore: 40,
    }).state).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("records the three owner-approved revisit triggers", () => {
    expect(PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.revisitTriggers).toEqual([
      {
        code: "PERSISTENT_THREE_COMPONENT_DISAGREEMENT",
        automaticNumericThresholdApproved: false,
        action: "METHODOLOGY_REVIEW_REQUIRED",
      },
      {
        code: "FCF_STRUCTURAL_DISTORTION_CAPEX_OR_M_AND_A_CYCLE",
        action: "METHODOLOGY_REVIEW_REQUIRED",
      },
      {
        code: "PEER_COMPARABILITY_MATERIALLY_CHANGES",
        direction: "WEAKER_OR_STRONGER",
        action: "METHODOLOGY_REVIEW_REQUIRED",
      },
    ])
  })

  it("keeps FCF as corroboration rather than an equal primary lens", () => {
    expect(PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.rationale.fcfIsCorroborationNotStandaloneVerdict).toBe(true)
    expect(PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.weights.cashFlowCorroboration).toBe(0.2)
  })

  it("prohibits hidden renormalization and hidden reweighting", () => {
    expect(PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.missingComponentRenormalizationAllowed).toBe(false)
    expect(PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.hiddenReweightingAllowed).toBe(false)
  })

  it("makes the Domestic Valuation methodology calculation-ready but not active", () => {
    expect(PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.combinedValuationScoreReady).toBe(true)
    expect(PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.activationApproved).toBe(false)
    expect(PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.scoreExecutionEnabled).toBe(false)
    expect(PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.persistedScoreRunEnabled).toBe(false)
  })
})
