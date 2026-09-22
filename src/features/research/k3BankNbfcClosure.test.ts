import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { sectorEngineForProfileCode } from "./sectorEngineRegistry"
import { resolveScoringProfile } from "./scoringProfileResolution"

const refreshSource = readFileSync(
  resolve(process.cwd(), "supabase/functions/refresh-bank-benchmark/index.ts"),
  "utf8",
)

describe("Gate K3 BANK_NBFC closure contract", () => {
  it("keeps Cash Flow explicitly N/A for lender methodology", () => {
    const bank = sectorEngineForProfileCode("BANK")
    expect(bank?.notApplicableDimensions).toContain("CASH_FLOW")
    expect(bank?.allowedDimensions).not.toContain("CASH_FLOW")
  })

  it("freezes BANK and NBFC_LENDING as separate methodology authorities inside one engine family", () => {
    const engine = sectorEngineForProfileCode("BANK")
    expect(engine?.engineCode).toBe("BANK_NBFC")
    expect(engine?.profileAuthorities?.BANK.state).toBe("SUPPORTED")
    expect(engine?.profileAuthorities?.NBFC_LENDING.state).toBe("PENDING_METHODOLOGY")
  })

  it("permits BANK scoring from classification alone but blocks NBFC scoring until its authority exists", () => {
    expect(resolveScoringProfile("Banking", "Banks", null).profileCode).toBe("BANK_NBFC")
    expect(resolveScoringProfile("Financial Services", "NBFC", null).profileCode).toBe("GENERAL")
  })

  it("makes the NIFTY Bank operational refresh classification-driven rather than HDFCBANK-driven", () => {
    expect(refreshSource).toContain('from("current_security_enrichment_v1").select("sector,industry")')
    expect(refreshSource).toContain('key(classification.data.sector) !== "BANKING"')
    expect(refreshSource).toContain('key(classification.data.industry) !== "BANKS"')
    expect(refreshSource).not.toContain('security.data.symbol !== "HDFCBANK"')
  })

  it("explicitly prevents NBFC_LENDING from inheriting NIFTY Bank benchmark authority", () => {
    expect(refreshSource).toContain("NBFC_LENDING requires its own approved benchmark authority")
    expect(sectorEngineForProfileCode("NBFC_LENDING")?.profileAuthorities?.NBFC_LENDING.benchmarkAuthority)
      .toBe("NBFC_LENDING_BENCHMARK_PENDING")
  })

  it("keeps HDFCBANK as a validation anchor only", () => {
    const engine = sectorEngineForProfileCode("BANK")
    expect(engine?.referenceValidationSymbols).toEqual(["HDFCBANK"])
    expect(engine?.runtimeSymbolSpecific).toBe(false)
  })
})
