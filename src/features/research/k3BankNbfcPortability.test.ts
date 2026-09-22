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

  it("keeps NBFC_LENDING in the BANK_NBFC family but blocks scoring until its methodology authority exists", () => {
    expect(sectorEngineForProfileCode("NBFC_LENDING")?.engineCode).toBe("BANK_NBFC")
    expect(sectorEngineForProfileCode("NBFC_LENDING")?.profileAuthorities?.NBFC_LENDING?.state).toBe("PENDING_METHODOLOGY")
    expect(resolveScoringProfile("Financial Services", "NBFC", null)).toMatchObject({
      profileCode: null,
      ruleProfile: null,
      profileSource: "METHODOLOGY_UNAVAILABLE",
      methodologyState: "METHODOLOGY_NOT_AVAILABLE",
    })
  })

  it("fails closed when Banking lacks Industry", () => {
    expect(resolveScoringProfile("Banking", null, null)).toMatchObject({
      profileCode: null,
      ruleProfile: null,
      profileSource: "METHODOLOGY_UNAVAILABLE",
      methodologyState: "REVIEW_REQUIRED",
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
