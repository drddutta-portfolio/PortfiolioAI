import { describe, expect, it } from "vitest"
import { TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET } from "./torntpharmGateH2DomesticPeerSet"

describe("TORNTPHARM H2 Domestic Formulations peer set", () => {
  it("locks exactly the owner-approved minimum three-peer cohort", () => {
    expect(TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET.peers.map((peer) => peer.symbol))
      .toEqual(["MANKIND", "ERIS", "EMCURE"])
    expect(TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET.minimumEligiblePeerCount).toBe(3)
    expect(TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET.cohortMinimumSatisfiedByOwnerReview).toBe(true)
  })

  it("requires both approved peer valuation metric families", () => {
    expect(TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET.requiredMetricFamilies)
      .toEqual(["PE_TTM", "EV_EBITDA"])
    expect(TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET.aggregationStatistic).toBe("MEDIAN")
  })

  it("keeps canonical persistence and score execution disabled", () => {
    expect(TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET.productionAssignmentPersistenceApproved).toBe(false)
    expect(TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET.scoreExecutionEnabled).toBe(false)
    expect(TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET.persistedScoreRunEnabled).toBe(false)
  })
})
