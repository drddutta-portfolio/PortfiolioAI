import { describe, expect, it } from "vitest"
import {
  TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT,
  TORNTPHARM_GATE_H2_GLOBAL_GENERICS_ELIGIBILITY_CHECK,
  TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK,
} from "./torntpharmGateH2RemainingEvidenceLock"

describe("TORNTPHARM H2 remaining evidence lock", () => {
  it("records that canonical TORNTPHARM market history is absent", () => {
    expect(
      TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT.canonicalDatabase
        .marketMetricObservationsForTorntpharm,
    ).toBe(0)
    expect(
      TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT.canonicalDatabase
        .marketPriceHistoryRowsForTorntpharm,
    ).toBe(0)
  })

  it("fails Valuation closed on stale self-history and missing market/peer authority", () => {
    expect(
      TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT.valuation
        .latestAvailableSelfHistoryObservation.staleAtSnapshot,
    ).toBe(true)
    expect(
      TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK.dimensions.valuation.scoreReady,
    ).toBe(false)
  })

  it("fails Momentum and Risk market lanes closed without canonical history", () => {
    expect(
      TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK.dimensions.momentum.scoreReady,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK.dimensions.risk.scoreReady,
    ).toBe(false)
  })

  it("preserves the regulatory REVIEW_REQUIRED runtime", () => {
    expect(
      TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT.governanceRuntime.gateState,
    ).toBe("REVIEW_REQUIRED")
  })

  it("detects the Global Generics 12.05 percent versus 15 percent eligibility conflict", () => {
    expect(
      TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT.overlay
        .evidenceBasisEconomicMaterialityPercent,
    ).toBe(12.05)
    expect(
      TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT.overlay
        .contractMinimumMaterialOverlayPercent,
    ).toBe(15)
    expect(TORNTPHARM_GATE_H2_GLOBAL_GENERICS_ELIGIBILITY_CHECK.modifierState)
      .toBe("REVIEW_REQUIRED")
    expect(TORNTPHARM_GATE_H2_GLOBAL_GENERICS_ELIGIBILITY_CHECK.reasonCodes)
      .toContain("MATERIAL_OVERLAY_REQUIRES_REVIEWED_MATERIALITY")
  })

  it("does not allow H2 exit or score persistence", () => {
    expect(TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK.h2ExitEligible).toBe(false)
    expect(
      TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK.scoreExecutionEnabled,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK.persistedScoreRunEnabled,
    ).toBe(false)
  })
})
