import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_EVIDENCE_SUFFICIENCY,
  listGlobalGenericsVolatilityContextBlockers,
} from "./pharmaGlobalGenericsVolatilityContextEvidenceSufficiency"

describe("PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_EVIDENCE_SUFFICIENCY", () => {
  it("defers numeric volatility normalization because no context method is currently eligible", () => {
    const contract = PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_EVIDENCE_SUFFICIENCY

    expect(contract.deferralRequired).toBe(true)
    expect(contract.approvedMethod).toBeNull()
    expect(contract.numericVolatilityCurveReady).toBe(false)
    expect(contract.wholeRiskDimensionReady).toBe(false)
  })

  it("records an explicit blocker for every G6.28 context method", () => {
    expect(listGlobalGenericsVolatilityContextBlockers()).toEqual([
      {
        method: "SAME_SUBPROFILE_PEER_RELATIVE",
        blocker: "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED",
      },
      {
        method: "BENCHMARK_RELATIVE",
        blocker: "APPROVED_PHARMA_BENCHMARK_NOT_ESTABLISHED",
      },
      {
        method: "SELF_HISTORY_WITH_EXTERNAL_CONTEXT",
        blocker: "SELF_HISTORY_WITH_EXTERNAL_CONTEXT_NOT_ESTABLISHED",
      },
      {
        method: "HYBRID_EXPLICITLY_VERSIONED",
        blocker: "HYBRID_REQUIRES_TWO_ELIGIBLE_CONTEXT_METHODS",
      },
    ])
  })

  it("keeps score execution disabled", () => {
    expect(PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_EVIDENCE_SUFFICIENCY.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_EVIDENCE_SUFFICIENCY.scoreExecutionEnabled).toBe(false)
  })
})
