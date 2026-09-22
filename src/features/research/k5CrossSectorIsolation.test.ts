import { describe, expect, it } from "vitest"
import {
  K5_SAFETY_BOUNDARY,
  k5AuthorityForEngineProfile,
  k5PairwiseEngineIsolationMatrix,
  k5SupportedProfileAuthorities,
} from "./k5CrossSectorValidation"
import { SECTOR_ENGINE_REGISTRY } from "./sectorEngineRegistry"

describe("Gate K5 cross-sector isolation matrix", () => {
  it("has all ten K4 packages in durable IMPLEMENTED state", () => {
    const k4 = SECTOR_ENGINE_REGISTRY.filter(
      (entry) => entry.engineCode !== "PHARMA_V1" && entry.engineCode !== "BANK_NBFC",
    )
    expect(k4).toHaveLength(10)
    expect(k4.every((entry) => entry.lifecycle === "IMPLEMENTED")).toBe(true)
  })

  it("owns each supported profile exactly once", () => {
    const authorities = k5SupportedProfileAuthorities()
    const profileCodes = authorities.map((item) => item.profileCode)
    expect(new Set(profileCodes).size).toBe(profileCodes.length)

    for (const authority of authorities) {
      expect(k5AuthorityForEngineProfile(authority.engineCode, authority.profileCode))
        .toEqual(authority)
    }
  })

  it("automatically denies every ordered cross-engine authority lookup", () => {
    const matrix = k5PairwiseEngineIsolationMatrix()
    expect(matrix).toHaveLength(SECTOR_ENGINE_REGISTRY.length * (SECTOR_ENGINE_REGISTRY.length - 1))

    for (const pair of matrix) {
      expect(pair.foreignProfilesResolvableBySource).toEqual([])
      expect(pair.sourceFallbackPolicy).toBe("NONE_FAIL_CLOSED")
    }
  })

  it("cannot retrieve another engine's methodology, benchmark, valuation or recommendation authority", () => {
    for (const source of SECTOR_ENGINE_REGISTRY) {
      for (const target of SECTOR_ENGINE_REGISTRY) {
        if (source.engineCode === target.engineCode) continue
        for (const targetProfile of target.profileCodes) {
          expect(k5AuthorityForEngineProfile(source.engineCode, targetProfile)).toBeNull()
        }
      }
    }
  })

  it("preserves the K5 safety boundary", () => {
    expect(K5_SAFETY_BOUNDARY).toEqual({
      providerCalls: 0,
      productionMutation: false,
      productionMigration: false,
      scorePersistence: false,
      recommendationPersistence: false,
      positionSizing: false,
      schedulerMutation: false,
      deployment: false,
      prMerge: false,
      automaticTrading: false,
    })
  })
})
