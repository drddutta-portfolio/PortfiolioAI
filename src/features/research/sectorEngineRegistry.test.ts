import { describe, expect, it } from "vitest"
import {
  SECTOR_ENGINE_REGISTRY,
  UNIVERSAL_SECTOR_ENGINE_SEMANTICS,
  sectorEngineForProfileCode,
} from "./sectorEngineRegistry"

describe("SECTOR_ENGINE_CONTRACT_V1", () => {
  it("contains exactly the two inherited engines plus ten K4 packages across implemented/pending lifecycle", () => {
    expect(SECTOR_ENGINE_REGISTRY).toHaveLength(12)
    const k4Entries = SECTOR_ENGINE_REGISTRY.filter(
      (entry) => entry.engineCode !== "PHARMA_V1" && entry.engineCode !== "BANK_NBFC",
    )
    expect(k4Entries).toHaveLength(10)
    expect(
      k4Entries.every(
        (entry) => entry.lifecycle === "IMPLEMENTED" || entry.lifecycle === "K4_FROZEN_PENDING",
      ),
    ).toBe(true)
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
      lifecycle: "IMPLEMENTED",
    })
    expect(sectorEngineForProfileCode("CAPITAL_EQUIPMENT_ELECTRICAL")?.engineCode).toBe("INDUSTRIALS_CAPITAL_GOODS")
    expect(sectorEngineForProfileCode("DEFENCE_AEROSPACE")?.engineCode).toBe("INDUSTRIALS_CAPITAL_GOODS")
    expect(sectorEngineForProfileCode("AUTO_OEM")).toMatchObject({
      engineCode: "AUTO_COMPONENTS",
      lifecycle: "IMPLEMENTED",
    })
    expect(sectorEngineForProfileCode("AUTO_COMPONENTS")?.engineCode).toBe("AUTO_COMPONENTS")
    expect(sectorEngineForProfileCode("SPECIALTY_CHEMICALS")).toMatchObject({
      engineCode: "CHEMICALS_V1",
      lifecycle: "IMPLEMENTED",
    })
    expect(sectorEngineForProfileCode("AGRO_FERTILISER")?.engineCode).toBe("CHEMICALS_V1")
    expect(sectorEngineForProfileCode("COMMODITY_PROCESS_CHEMICALS")?.engineCode).toBe("CHEMICALS_V1")
    expect(sectorEngineForProfileCode("HOSPITAL")?.engineCode).toBe("HEALTHCARE_SERVICES_V1")
    expect(sectorEngineForProfileCode("CAPITAL_MARKETS_AMC")?.engineCode).toBe("FIN_SERVICES_NON_LENDER")
    expect(sectorEngineForProfileCode("INSURANCE")?.engineCode).toBe("FIN_SERVICES_NON_LENDER")
    expect(sectorEngineForProfileCode("FINTECH_PLATFORM")?.engineCode).toBe("FIN_SERVICES_NON_LENDER")
    expect(sectorEngineForProfileCode("STEEL_FERROUS")?.engineCode).toBe("METALS_COMMODITIES")
    expect(sectorEngineForProfileCode("NON_FERROUS_DIVERSIFIED_METALS")?.engineCode).toBe("METALS_COMMODITIES")
    expect(sectorEngineForProfileCode("BRANDED_CONSUMER_FMCG")?.engineCode).toBe("CONSUMER_FMCG")
    expect(sectorEngineForProfileCode("UPSTREAM_E_AND_P")?.engineCode).toBe("OIL_GAS_V1")
    expect(sectorEngineForProfileCode("MIDSTREAM_CITY_GAS")?.engineCode).toBe("OIL_GAS_V1")
    expect(sectorEngineForProfileCode("INTEGRATED_REFINING_PETCHEM")?.engineCode).toBe("OIL_GAS_V1")
    expect(sectorEngineForProfileCode("REGULATED_NETWORK")?.engineCode).toBe("POWER_RENEWABLES_V1")
    expect(sectorEngineForProfileCode("GENERATION_INTEGRATED_UTILITY")?.engineCode).toBe("POWER_RENEWABLES_V1")
    expect(sectorEngineForProfileCode("RENEWABLE_IPP")?.engineCode).toBe("POWER_RENEWABLES_V1")
  })

  it("does not place universal numeric recommendation thresholds in the registry", () => {
    const serialized = JSON.stringify(SECTOR_ENGINE_REGISTRY)
    expect(serialized).not.toContain("coreMinScore")
    expect(serialized).not.toContain("satelliteMinScore")
    expect(serialized).not.toContain("watchMinScore")
  })
})
