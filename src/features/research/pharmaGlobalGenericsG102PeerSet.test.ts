import { describe, expect, it } from "vitest"
import { PHARMA_GLOBAL_GENERICS_G10_2_PEER_SET } from "./pharmaGlobalGenericsG102PeerSet"

describe("G10.2 reviewed Global Generics peer set", () => {
  it("locks exactly three reviewed same-primary peers", () => {
    expect(PHARMA_GLOBAL_GENERICS_G10_2_PEER_SET.peerCount).toBe(3)
    expect(PHARMA_GLOBAL_GENERICS_G10_2_PEER_SET.peers.map((peer) => peer.symbol)).toEqual([
      "DRREDDY",
      "LUPIN",
      "ZYDUSLIFE",
    ])
    expect(PHARMA_GLOBAL_GENERICS_G10_2_PEER_SET.peers.every(
      (peer) => peer.reviewedPrimary === "GLOBAL_GENERICS",
    )).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_G10_2_PEER_SET.samePrimaryRequirementSatisfied).toBe(true)
  })

  it("remains review-only and non-persisting", () => {
    expect(PHARMA_GLOBAL_GENERICS_G10_2_PEER_SET.classificationPersistencePerformed).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_G10_2_PEER_SET.scorePersistencePerformed).toBe(false)
  })
})
