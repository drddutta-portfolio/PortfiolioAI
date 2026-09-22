import { describe, expect, it } from "vitest"
import {
  SECTOR_ENGINE_REGISTRY,
  UNIVERSAL_SECTOR_ENGINE_SEMANTICS,
  sectorEngineForProfileCode,
} from "./sectorEngineRegistry"

describe("SECTOR_ENGINE_CONTRACT_V1", () => {
  it("contains exactly the two inherited engines plus the ten frozen K4 packages", () => {
    expect(SECTOR_ENGINE_REGISTRY).toHaveLength(12)
    expect(SECTOR_ENGINE_REGISTRY.filter((entry) => entry.lifecycle === "K4_FROZEN_PENDING")).toHaveLength(9)
  })

  it("prohibits runtime symbol-specific methodology and cross-sector fallback", () => {
    for (const entry of SECTOR_ENGINE_REGISTRY) {
      expect(entry.runtimeSymbolSpecific).toBe(false)
      expect(entry.fallbackPolicy).toBe("NONE_FAIL_CLOSED")
    }
  })

  it("keeps sector-only specialised routing prohibited", () => {
    expect(UNIVERSAL_SECTOR_ENGINE_SEMANTICS.sectorOnlySpecialisedRoutingAllowed).toBe(false)
  })

  it("carries forward fail-closed recommendation safety semantics", () => {
    expect(UNIVERSAL_SECTOR_ENGINE_SEMANTICS.missingMandatoryEvidence).toBe("SCORE_NOT_COMPUTABLE")
    expect(UNIVERSAL_SECTOR_ENGINE_SEMANTICS.missingRecommendationFloorData).toBe("INSUFFICIENT")
    expect(UNIVERSAL_SECTOR_ENGINE_SEMANTICS.failedRoleFloor).toBe("ROLE_INELIGIBLE_CONTINUE_DOWN_LADDER")
    expect(UNIVERSAL_SECTOR_ENGINE_SEMANTICS.scoreReconstructionFromIncompleteMandatoryInputs).toBe(false)
    expect(UNIVERSAL_SECTOR_ENGINE_SEMANTICS.recommendationComputationWrites).toBe(false)
  })

  it("resolves inherited implemented profile codes without inventing pending K4 routing", () => {
    expect(sectorEngineForProfileCode("PHARMA")?.engineCode).toBe("PHARMA_V1")
    expect(sectorEngineForProfileCode("BANK")?.engineCode).toBe("BANK_NBFC")
    expect(sectorEngineForProfileCode("NBFC_LENDING")?.engineCode).toBe("BANK_NBFC")
    expect(sectorEngineForProfileCode("IT_SERVICES")).toMatchObject({
      engineCode: "IT_TECH",
      lifecycle: "IMPLEMENTED",
    })
    expect(sectorEngineForProfileCode("PROJECT_EPC")).toMatchObject({
      engineCode: "INDUSTRIALS_CAPITAL_GOODS",
      lifecycle: "K4_FROZEN_PENDING",
    })
    expect(sectorEngineForProfileCode("CAPITAL_EQUIPMENT_ELECTRICAL")?.engineCode).toBe("INDUSTRIALS_CAPITAL_GOODS")
    expect(sectorEngineForProfileCode("DEFENCE_AEROSPACE")?.engineCode).toBe("INDUSTRIALS_CAPITAL_GOODS")
  })

  it("does not place universal numeric recommendation thresholds in the registry", () => {
    const serialized = JSON.stringify(SECTOR_ENGINE_REGISTRY)
    expect(serialized).not.toContain("coreMinScore")
    expect(serialized).not.toContain("satelliteMinScore")
    expect(serialized).not.toContain("watchMinScore")
  })
})
