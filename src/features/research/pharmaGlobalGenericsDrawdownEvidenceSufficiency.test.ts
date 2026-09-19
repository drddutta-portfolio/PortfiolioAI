import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_DRAWDOWN_EVIDENCE_SUFFICIENCY,
  listGlobalGenericsDrawdownMethodBlockers,
} from "./pharmaGlobalGenericsDrawdownEvidenceSufficiency"

describe("PHARMA_GLOBAL_GENERICS_DRAWDOWN_EVIDENCE_SUFFICIENCY", () => {
  it("defers numeric drawdown normalization because no candidate method is currently eligible", () => {
    const contract = PHARMA_GLOBAL_GENERICS_DRAWDOWN_EVIDENCE_SUFFICIENCY

    expect(contract.deferralRequired).toBe(true)
    expect(contract.approvedMethod).toBeNull()
    expect(contract.numericDrawdownCurveReady).toBe(false)
    expect(contract.wholeRiskDimensionReady).toBe(false)
  })

  it("records an explicit blocker for every G6.26 candidate method", () => {
    expect(listGlobalGenericsDrawdownMethodBlockers()).toEqual([
      {
        method: "ABSOLUTE_BANDS",
        blocker: "EMPIRICAL_PHARMA_BANDS_NOT_ESTABLISHED",
      },
      {
        method: "SAME_SUBPROFILE_PEER_RELATIVE",
        blocker: "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED",
      },
      {
        method: "BENCHMARK_RELATIVE",
        blocker: "APPROVED_PHARMA_BENCHMARK_NOT_ESTABLISHED",
      },
      {
        method: "SELF_HISTORY_RELATIVE",
        blocker: "SUFFICIENT_COMPARABLE_SELF_HISTORY_NOT_ESTABLISHED",
      },
      {
        method: "HYBRID_EXPLICITLY_VERSIONED",
        blocker: "HYBRID_REQUIRES_TWO_ELIGIBLE_METHODS",
      },
    ])
  })

  it("keeps score execution disabled", () => {
    expect(PHARMA_GLOBAL_GENERICS_DRAWDOWN_EVIDENCE_SUFFICIENCY.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_DRAWDOWN_EVIDENCE_SUFFICIENCY.scoreExecutionEnabled).toBe(false)
  })
})
