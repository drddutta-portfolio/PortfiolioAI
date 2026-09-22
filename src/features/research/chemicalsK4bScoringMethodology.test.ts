import { describe, expect, it } from "vitest"
import {
  CHEMICALS_K4B_SAFETY,
  chemicalsK4bSignalRules,
  scoreChemicalsK4b,
} from "./chemicalsK4bScoringMethodology"

function readySignals(
  subprofile: "SPECIALTY_CHEMICALS" | "AGRO_FERTILISER" | "COMMODITY_PROCESS_CHEMICALS",
  score = 70,
) {
  return chemicalsK4bSignalRules(subprofile).map((rule) => ({
    signalCode: rule.signalCode,
    normalizedScore: score,
    observationCount: rule.minimumObservations,
    state: "FRESH" as const,
  }))
}

describe("CHEMICALS_V1 K4 Checkpoint B deterministic scoring", () => {
  it("scores Specialty Chemicals deterministically and symbol-independently", () => {
    const a = scoreChemicalsK4b({
      securitySymbol: "VINATIORGA",
      industry: "Specialty Chemicals",
      signals: readySignals("SPECIALTY_CHEMICALS", 73),
    })
    const b = scoreChemicalsK4b({
      securitySymbol: "FUTURECHEM",
      industry: "Specialty Chemicals",
      signals: readySignals("SPECIALTY_CHEMICALS", 73),
    })
    expect(a.state).toBe("SCORE_READY")
    expect(a.overallScore).toBe(73)
    expect(b.overallScore).toBe(a.overallScore)
  })

  it("uses distinct growth contracts by subprofile", () => {
    expect(chemicalsK4bSignalRules("SPECIALTY_CHEMICALS").map((item) => item.signalCode))
      .toContain("REVENUE_GROWTH_MULTI_PERIOD")
    expect(chemicalsK4bSignalRules("AGRO_FERTILISER").map((item) => item.signalCode))
      .toContain("REVENUE_AND_VOLUME_GROWTH_MULTI_PERIOD")
    expect(chemicalsK4bSignalRules("COMMODITY_PROCESS_CHEMICALS").map((item) => item.signalCode))
      .toContain("VOLUME_PRICE_MIX_GROWTH")
  })

  it("fails closed when cash conversion is missing", () => {
    const signals = readySignals("AGRO_FERTILISER", 75).filter(
      (signal) => signal.signalCode !== "CFO_OR_FCF_CONVERSION",
    )
    const result = scoreChemicalsK4b({
      securitySymbol: "DEEPAKFERT",
      industry: "Fertilisers",
      signals,
    })
    expect(result.state).toBe("SCORE_NOT_COMPUTABLE")
    expect(result.overallScore).toBeNull()
  })

  it("fails closed for insufficient quarterly growth depth", () => {
    const signals = readySignals("COMMODITY_PROCESS_CHEMICALS", 75).map((signal) =>
      signal.signalCode === "VOLUME_PRICE_MIX_GROWTH"
        ? { ...signal, observationCount: 2 }
        : signal,
    )
    expect(scoreChemicalsK4b({
      securitySymbol: "SRF",
      industry: "Commodity Chemicals",
      signals,
    }).state).toBe("SCORE_NOT_COMPUTABLE")
  })

  it("returns METHOD_NOT_AVAILABLE for unsupported Industry", () => {
    expect(scoreChemicalsK4b({
      securitySymbol: "UNKNOWN",
      industry: "Retailing",
      signals: [],
    }).state).toBe("METHOD_NOT_AVAILABLE")
  })

  it("keeps cycle-aware scoring read-only and non-persisting", () => {
    expect(CHEMICALS_K4B_SAFETY.cycleNormalizationRequired).toBe(true)
    expect(CHEMICALS_K4B_SAFETY.noMissingInputRenormalization).toBe(true)
    expect(CHEMICALS_K4B_SAFETY.runtimeSymbolSpecific).toBe(false)
    expect(CHEMICALS_K4B_SAFETY.writes).toBe(0)
  })
})
