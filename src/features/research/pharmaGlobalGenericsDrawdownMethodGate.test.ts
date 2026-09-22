import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE,
  assessGlobalGenericsDrawdownMethodReadiness,
} from "./pharmaGlobalGenericsDrawdownMethodGate"

describe("PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE", () => {
  it("keeps every drawdown methodology unapproved by default", () => {
    expect(PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE.approvedMethod).toBeNull()
    expect(PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE.numericDrawdownCurveReady).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE.ownerApprovalRequired).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE.scoreExecutionEnabled).toBe(false)
  })

  it("prohibits BANK/NBFC inheritance and hidden defaults", () => {
    const defaults = PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE.prohibitedDefaults

    expect(defaults.bankNbfcBandsInherited).toBe(false)
    expect(defaults.zeroToNeutralSubstitutionAllowed).toBe(false)
    expect(defaults.genericSectorPercentileWithoutReviewedCohortAllowed).toBe(false)
    expect(defaults.silentBenchmarkSelectionAllowed).toBe(false)
    expect(defaults.hiddenHybridWeightingAllowed).toBe(false)
  })

  it("only exposes absolute bands when empirical Pharma evidence exists", () => {
    const result = assessGlobalGenericsDrawdownMethodReadiness({
      empiricalPharmaBandEvidenceAvailable: true,
      reviewedSamePrimaryPeerCohortAvailable: false,
      approvedPharmaBenchmarkAvailable: false,
      sufficientComparableSelfHistoryAvailable: false,
    })

    expect(result.eligibleMethods).toEqual(["ABSOLUTE_BANDS"])
    expect(result.approvedMethod).toBeNull()
    expect(result.numericDrawdownCurveReady).toBe(false)
  })

  it("only exposes peer-relative normalization when a reviewed same-primary cohort exists", () => {
    const result = assessGlobalGenericsDrawdownMethodReadiness({
      empiricalPharmaBandEvidenceAvailable: false,
      reviewedSamePrimaryPeerCohortAvailable: true,
      approvedPharmaBenchmarkAvailable: false,
      sufficientComparableSelfHistoryAvailable: false,
    })

    expect(result.eligibleMethods).toEqual(["SAME_SUBPROFILE_PEER_RELATIVE"])
  })

  it("requires an approved Pharma benchmark before benchmark-relative normalization can even be eligible", () => {
    const result = assessGlobalGenericsDrawdownMethodReadiness({
      empiricalPharmaBandEvidenceAvailable: false,
      reviewedSamePrimaryPeerCohortAvailable: false,
      approvedPharmaBenchmarkAvailable: true,
      sufficientComparableSelfHistoryAvailable: false,
    })

    expect(result.eligibleMethods).toEqual(["BENCHMARK_RELATIVE"])
  })

  it("offers hybrid only when at least two evidence-backed methods are independently eligible", () => {
    const result = assessGlobalGenericsDrawdownMethodReadiness({
      empiricalPharmaBandEvidenceAvailable: false,
      reviewedSamePrimaryPeerCohortAvailable: true,
      approvedPharmaBenchmarkAvailable: false,
      sufficientComparableSelfHistoryAvailable: true,
    })

    expect(result.eligibleMethods).toEqual([
      "SAME_SUBPROFILE_PEER_RELATIVE",
      "SELF_HISTORY_RELATIVE",
      "HYBRID_EXPLICITLY_VERSIONED",
    ])
    expect(result.ownerApprovalRequired).toBe(true)
    expect(result.numericDrawdownCurveReady).toBe(false)
  })
})
