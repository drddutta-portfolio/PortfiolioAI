import { describe, expect, it } from "vitest"
import {
  combineDomesticValuationMaTransitionScores,
  PHARMA_DOMESTIC_VALUATION_MA_TRANSITION,
} from "./pharmaDomesticValuationMaTransitionContract"

describe("Domestic Formulations M&A transition valuation contract", () => {
  it("preserves the base 40/40/20 contract and applies explicit 50/50/0 only to TORNTPHARM transition state", () => {
    expect(PHARMA_DOMESTIC_VALUATION_MA_TRANSITION.baseContractVersion)
      .toBe("PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_V1_OWNER_APPROVED")
    expect(PHARMA_DOMESTIC_VALUATION_MA_TRANSITION.weights).toEqual({
      selfHistory: 0.5,
      peerRelative: 0.5,
      cashFlowCorroboration: 0,
    })
    expect(PHARMA_DOMESTIC_VALUATION_MA_TRANSITION.safeguards.baseContractOverwritten).toBe(false)
    expect(PHARMA_DOMESTIC_VALUATION_MA_TRANSITION.safeguards.hiddenRenormalizationAllowed).toBe(false)
  })

  it("produces the approved H2 TORNTPHARM transition valuation score of 30", () => {
    expect(combineDomesticValuationMaTransitionScores({
      symbol: "TORNTPHARM",
      selfHistoryScore: 40,
      peerRelativeScore: 20,
      transitionState: "M_AND_A_SCOPE_MISMATCH",
    })).toEqual({
      state: "READY_TRANSITION",
      combinedScore: 30,
      selfHistoryWeight: 0.5,
      peerRelativeWeight: 0.5,
      cashFlowCorroborationWeight: 0,
      nextContract: "PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_V1_OWNER_APPROVED",
    })
  })

  it("fails closed when either primary valuation lens is missing or invalid", () => {
    expect(combineDomesticValuationMaTransitionScores({
      symbol: "TORNTPHARM",
      selfHistoryScore: null,
      peerRelativeScore: 20,
      transitionState: "M_AND_A_SCOPE_MISMATCH",
    }).state).toBe("INSUFFICIENT_EVIDENCE")

    expect(combineDomesticValuationMaTransitionScores({
      symbol: "TORNTPHARM",
      selfHistoryScore: 40,
      peerRelativeScore: 101,
      transitionState: "M_AND_A_SCOPE_MISMATCH",
    }).combinedScore).toBeNull()
  })

  it("cannot leak to another security", () => {
    expect(combineDomesticValuationMaTransitionScores({
      symbol: "AUROPHARMA",
      selfHistoryScore: 40,
      peerRelativeScore: 20,
      transitionState: "M_AND_A_SCOPE_MISMATCH",
    }).state).toBe("NOT_APPLICABLE")
  })

  it("expires as soon as comparable post-merger annual FCF exists", () => {
    expect(combineDomesticValuationMaTransitionScores({
      symbol: "TORNTPHARM",
      selfHistoryScore: 40,
      peerRelativeScore: 20,
      transitionState: "COMPARABLE_POST_MERGER_FCF_AVAILABLE",
    })).toEqual({
      state: "TRANSITION_EXPIRED",
      combinedScore: null,
      selfHistoryWeight: 0.5,
      peerRelativeWeight: 0.5,
      cashFlowCorroborationWeight: 0,
      nextContract: "PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_V1_OWNER_APPROVED",
    })
  })

  it("does not neutral-score or reuse stale FCF and keeps H3 execution disabled", () => {
    expect(PHARMA_DOMESTIC_VALUATION_MA_TRANSITION.cashFlowTreatment).toEqual({
      suspendedBecauseNotComparable: true,
      neutralScoreSubstitutionAllowed: false,
      stalePreMergerFcfReuseAllowed: false,
      currentMarketCapCallRequiredWhileSuspended: false,
    })
    expect(PHARMA_DOMESTIC_VALUATION_MA_TRANSITION.safeguards.h3ScoreExecutionEnabled).toBe(false)
    expect(PHARMA_DOMESTIC_VALUATION_MA_TRANSITION.safeguards.persistedScoreRunEnabled).toBe(false)
  })
})
