import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE,
  assessGlobalGenericsVolatilityContextReadiness,
} from "./pharmaGlobalGenericsVolatilityContextMethodGate"

describe("PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE", () => {
  it("requires context and prohibits standalone absolute volatility scoring", () => {
    const gate = PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE
    expect(gate.contextRequired).toBe(true)
    expect(gate.standaloneAbsoluteBandsAllowed).toBe(false)
    expect(gate.prohibitedDefaults.absoluteVolatilityOnlyScoringAllowed).toBe(false)
    expect(gate.numericVolatilityCurveReady).toBe(false)
  })

  it("does not inherit BANK/NBFC thresholds or generic sector peers", () => {
    const defaults = PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE.prohibitedDefaults
    expect(defaults.bankNbfcBandsInherited).toBe(false)
    expect(defaults.genericSectorPeerSetWithoutReviewedPrimaryAllowed).toBe(false)
    expect(defaults.silentBenchmarkSelectionAllowed).toBe(false)
    expect(defaults.hiddenHybridWeightingAllowed).toBe(false)
    expect(defaults.missingEvidenceMayBecomeNeutral).toBe(false)
  })

  it("exposes peer-relative only when a reviewed same-primary cohort exists", () => {
    const result = assessGlobalGenericsVolatilityContextReadiness({
      reviewedSamePrimaryPeerCohortAvailable: true,
      approvedPharmaBenchmarkAvailable: false,
      sufficientComparableSelfHistoryAvailable: false,
      externalContextAvailableForSelfHistory: false,
    })
    expect(result.eligibleMethods).toEqual(["SAME_SUBPROFILE_PEER_RELATIVE"])
  })

  it("exposes benchmark-relative only when a Pharma benchmark is explicitly approved", () => {
    const result = assessGlobalGenericsVolatilityContextReadiness({
      reviewedSamePrimaryPeerCohortAvailable: false,
      approvedPharmaBenchmarkAvailable: true,
      sufficientComparableSelfHistoryAvailable: false,
      externalContextAvailableForSelfHistory: false,
    })
    expect(result.eligibleMethods).toEqual(["BENCHMARK_RELATIVE"])
  })

  it("requires both self-history and external context before self-history can be eligible", () => {
    expect(assessGlobalGenericsVolatilityContextReadiness({
      reviewedSamePrimaryPeerCohortAvailable: false,
      approvedPharmaBenchmarkAvailable: false,
      sufficientComparableSelfHistoryAvailable: true,
      externalContextAvailableForSelfHistory: false,
    }).eligibleMethods).toEqual([])

    expect(assessGlobalGenericsVolatilityContextReadiness({
      reviewedSamePrimaryPeerCohortAvailable: false,
      approvedPharmaBenchmarkAvailable: false,
      sufficientComparableSelfHistoryAvailable: true,
      externalContextAvailableForSelfHistory: true,
    }).eligibleMethods).toEqual(["SELF_HISTORY_WITH_EXTERNAL_CONTEXT"])
  })

  it("offers hybrid only when two independent context methods are eligible", () => {
    const result = assessGlobalGenericsVolatilityContextReadiness({
      reviewedSamePrimaryPeerCohortAvailable: true,
      approvedPharmaBenchmarkAvailable: true,
      sufficientComparableSelfHistoryAvailable: false,
      externalContextAvailableForSelfHistory: false,
    })
    expect(result.eligibleMethods).toEqual([
      "SAME_SUBPROFILE_PEER_RELATIVE",
      "BENCHMARK_RELATIVE",
      "HYBRID_EXPLICITLY_VERSIONED",
    ])
    expect(result.approvedMethod).toBeNull()
    expect(result.ownerApprovalRequired).toBe(true)
  })
})
