import { describe, expect, it } from "vitest"
import { resolveScoringProfile } from "./scoringProfileResolution"
import { sectorEngineForProfileCode } from "./sectorEngineRegistry"

describe("Gate K3 BANK_NBFC portability boundary", () => {
  it("routes arbitrary bank classification to BANK_NBFC without a symbol", () => {
    expect(resolveScoringProfile("Banking", "Banks", null)).toMatchObject({
      profileCode: "BANK_NBFC",
      ruleProfile: "BANK_NBFC",
      profileSource: "SECTOR_RULE",
    })
  })

  it("routes NBFC classification to the BANK_NBFC engine family", () => {
    expect(resolveScoringProfile("Financial Services", "NBFC", null)).toMatchObject({
      profileCode: "BANK_NBFC",
      ruleProfile: "BANK_NBFC",
    })
  })

  it("fails closed when Banking lacks Industry", () => {
    expect(resolveScoringProfile("Banking", null, null)).toMatchObject({
      profileCode: "GENERAL",
      ruleProfile: "GENERAL",
      profileSource: "GENERAL_FALLBACK",
    })
  })

  it("keeps PHARMA isolated from BANK_NBFC", () => {
    expect(resolveScoringProfile("Healthcare", "Pharmaceuticals", null).profileCode).toBe("PHARMA_V1")
    expect(resolveScoringProfile("Banking", "Banks", null).profileCode).toBe("BANK_NBFC")
  })

  it("registers BANK_NBFC as non-symbol-specific while retaining HDFCBANK only as validation reference", () => {
    const engine = sectorEngineForProfileCode("BANK")
    expect(engine?.engineCode).toBe("BANK_NBFC")
    expect(engine?.runtimeSymbolSpecific).toBe(false)
    expect(engine?.referenceValidationSymbols).toContain("HDFCBANK")
  })
})
