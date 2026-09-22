import { describe, expect, it } from "vitest"
import {
  PHARMA_GATE_G_FINAL_4_CLOSURE_CANDIDATE,
  PHARMA_GATE_G_FINAL_4_HAND_CHECK,
  PHARMA_GATE_G_FINAL_4_SYNTHETIC_DRY_RUN,
  TORNTPHARM_GATE_G_FINAL_4_CURRENT_STATE_DRY_RUN,
} from "./pharmaGateGFinal4EndToEndDryRun"

describe("G-FINAL-4 end-to-end read-only dry run", () => {
  it("calculates all ten synthetic dimensions through the real read-only adapter", () => {
    expect(PHARMA_GATE_G_FINAL_4_SYNTHETIC_DRY_RUN.dimensions).toHaveLength(10)
    expect(
      PHARMA_GATE_G_FINAL_4_SYNTHETIC_DRY_RUN.dimensions.every(
        (row) => row.finalScore !== null,
      ),
    ).toBe(true)
    expect(PHARMA_GATE_G_FINAL_4_SYNTHETIC_DRY_RUN.overallPreviewState).toBe(
      "READY",
    )
  })

  it("applies approved overlay modifiers without a second stock score", () => {
    const byDimension = new Map(
      PHARMA_GATE_G_FINAL_4_SYNTHETIC_DRY_RUN.dimensions.map((row) => [
        row.dimensionCode,
        row,
      ]),
    )
    expect(byDimension.get("GROWTH")?.finalScore).toBe(76)
    expect(byDimension.get("BUSINESS_DURABILITY")?.finalScore).toBe(71.5)
    expect(byDimension.get("RISK")?.finalScore).toBe(68.75)
    expect(PHARMA_GATE_G_FINAL_4_HAND_CHECK.secondStockScoreCreated).toBe(false)
  })

  it("matches the independently hand-verifiable fixed-weight total", () => {
    const handTotal = PHARMA_GATE_G_FINAL_4_HAND_CHECK.dimensionContributions
      .reduce((sum, row) => sum + row.contribution, 0)

    expect(handTotal).toBeCloseTo(73.435, 6)
    expect(PHARMA_GATE_G_FINAL_4_HAND_CHECK.expectedOverallScore).toBe(73.435)
    expect(PHARMA_GATE_G_FINAL_4_SYNTHETIC_DRY_RUN.overallScore).toBe(73.435)
    expect(PHARMA_GATE_G_FINAL_4_HAND_CHECK.hiddenReweightingUsed).toBe(false)
  })

  it("keeps current TORNTPHARM fail-closed instead of manufacturing an overall score", () => {
    expect(
      TORNTPHARM_GATE_G_FINAL_4_CURRENT_STATE_DRY_RUN.overallPreviewState,
    ).toBe("NOT_CURRENTLY_COMPUTABLE")
    expect(TORNTPHARM_GATE_G_FINAL_4_CURRENT_STATE_DRY_RUN.overallScore).toBeNull()
    expect(
      TORNTPHARM_GATE_G_FINAL_4_CURRENT_STATE_DRY_RUN
        .firstTorntpharmDeterministicScoreReady,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_G_FINAL_4_CURRENT_STATE_DRY_RUN.gateHEntryState,
    ).toBe("FAIL_CLOSED_EVIDENCE_COMPLETION_REQUIRED")
  })

  it("separates engine-contract completion from company evidence completeness", () => {
    expect(
      TORNTPHARM_GATE_G_FINAL_4_CURRENT_STATE_DRY_RUN
        .gateGEngineContractReproducible,
    ).toBe(true)
    expect(PHARMA_GATE_G_FINAL_4_CLOSURE_CANDIDATE.syntheticEngineDryRunReady).toBe(
      true,
    )
    expect(
      PHARMA_GATE_G_FINAL_4_CLOSURE_CANDIDATE.gateGClosureEligibleCandidate,
    ).toBe(true)
    expect(PHARMA_GATE_G_FINAL_4_CLOSURE_CANDIDATE.gateHFirstScoreReady).toBe(
      false,
    )
  })

  it("keeps every downstream execution boundary off", () => {
    expect(PHARMA_GATE_G_FINAL_4_SYNTHETIC_DRY_RUN.scoreExecutionEnabled).toBe(false)
    expect(PHARMA_GATE_G_FINAL_4_SYNTHETIC_DRY_RUN.persistedScoreRunEnabled).toBe(
      false,
    )
    expect(
      TORNTPHARM_GATE_G_FINAL_4_CURRENT_STATE_DRY_RUN.scoreExecutionEnabled,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_G_FINAL_4_CURRENT_STATE_DRY_RUN.persistedScoreRunEnabled,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_G_FINAL_4_CURRENT_STATE_DRY_RUN.recommendationEnabled,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_G_FINAL_4_CURRENT_STATE_DRY_RUN.positionSizingEnabled,
    ).toBe(false)
  })
})
