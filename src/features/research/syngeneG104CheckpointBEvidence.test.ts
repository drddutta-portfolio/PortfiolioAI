import { describe, expect, it } from "vitest"
import {
  SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE,
  SYNGENE_G10_4_MANDATORY_EVIDENCE_BLOCKERS,
} from "./syngeneG104CheckpointBEvidence"

describe("Gate J G10.4 SYNGENE bounded evidence package", () => {
  it("keeps the evidence package read-only and non-persisting", () => {
    expect(SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE.symbol).toBe("SYNGENE")
    expect(SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE.materialOverlays).toEqual([])
    expect(SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE.overlayNumericParticipation).toBe(false)
    expect(SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE.scorePersistenceEnabled).toBe(false)
    expect(SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE.recommendationPersistenceEnabled).toBe(false)
  })

  it("preserves official operating evidence without turning partial evidence into a score", () => {
    expect(SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE.observed.fy25.operatingCashFlowCr).toBe(1168)
    expect(SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE.observed.fy25.largeMoleculeRevenueSharePercent).toBe(25)
    expect(SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE.observed.fy26.revenueFromOperationsMn).toBe(37387)
    expect(SYNGENE_G10_4_MANDATORY_EVIDENCE_BLOCKERS.length).toBeGreaterThanOrEqual(6)
  })

  it("keeps client concentration and utilization gaps explicit", () => {
    const durability = SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE.dimensionEvidence.find(
      (item) => item.dimension === "BUSINESS_DURABILITY",
    )
    expect(durability?.state).toBe("INCOMPLETE")
    expect(durability?.reason).toContain("client concentration")
    expect(durability?.reason).toContain("capacity-utilization")
  })
})
