import { describe, expect, it } from "vitest"
import {
  METALS_COMMODITIES_K4B_SAFETY,
  metalsCommoditiesK4bSignalRules,
  scoreMetalsCommoditiesK4b,
} from "./metalsCommoditiesK4bScoringMethodology"

function readySignals(
  subprofile: "STEEL_FERROUS" | "NON_FERROUS_DIVERSIFIED_METALS",
  score = 70,
) {
  return [
    ...metalsCommoditiesK4bSignalRules(subprofile).map((rule) => ({
      signalCode: rule.signalCode,
      normalizedScore: score,
      observationCount: rule.minimumObservations,
      state: "FRESH" as const,
    })),
    {
      signalCode: "COMMODITY_EXPOSURE_METADATA",
      normalizedScore: null,
      observationCount: 1,
      state: "FRESH" as const,
    },
  ]
}

describe("METALS_COMMODITIES K4 Checkpoint B deterministic scoring", () => {
  it("scores steel deterministically and symbol-independently", () => {
    const a = scoreMetalsCommoditiesK4b({
      securitySymbol: "JINDALSTEL",
      industry: "Iron & Steel",
      signals: readySignals("STEEL_FERROUS", 71),
    })
    const b = scoreMetalsCommoditiesK4b({
      securitySymbol: "FUTURESTEEL",
      industry: "Iron & Steel",
      signals: readySignals("STEEL_FERROUS", 71),
    })
    expect(a.state).toBe("SCORE_READY")
    expect(a.overallScore).toBe(71)
    expect(b.overallScore).toBe(71)
  })

  it("uses different growth contracts for steel and non-ferrous", () => {
    expect(metalsCommoditiesK4bSignalRules("STEEL_FERROUS").map((item) => item.signalCode))
      .toContain("VOLUME_REALIZATION_AND_SPREAD_GROWTH")
    expect(metalsCommoditiesK4bSignalRules("NON_FERROUS_DIVERSIFIED_METALS").map((item) => item.signalCode))
      .toContain("PRODUCTION_VOLUME_REALIZATION_GROWTH")
  })

  it("fails closed when commodity exposure metadata is missing", () => {
    const signals = readySignals("NON_FERROUS_DIVERSIFIED_METALS", 74)
      .filter((signal) => signal.signalCode !== "COMMODITY_EXPOSURE_METADATA")
    const result = scoreMetalsCommoditiesK4b({
      securitySymbol: "HINDALCO",
      industry: "Non Ferrous Metals",
      signals,
    })
    expect(result.state).toBe("SCORE_NOT_COMPUTABLE")
    expect(result.reasonCodes).toContain("MANDATORY_SIGNAL_NOT_READY:COMMODITY_EXPOSURE_METADATA")
  })

  it("fails closed when through-cycle history is insufficient", () => {
    const signals = readySignals("STEEL_FERROUS", 75).map((signal) =>
      signal.signalCode === "THROUGH_CYCLE_MARGIN_QUALITY"
        ? { ...signal, observationCount: 2 }
        : signal,
    )
    expect(scoreMetalsCommoditiesK4b({
      securitySymbol: "JINDALSTEL",
      industry: "Steel",
      signals,
    }).state).toBe("SCORE_NOT_COMPUTABLE")
  })

  it("returns METHOD_NOT_AVAILABLE for unsupported Industry", () => {
    expect(scoreMetalsCommoditiesK4b({
      securitySymbol: "UNKNOWN",
      industry: "Retailing",
      signals: [],
    }).state).toBe("METHOD_NOT_AVAILABLE")
  })

  it("keeps through-cycle scoring read-only and prohibits spot-PE-only valuation", () => {
    expect(METALS_COMMODITIES_K4B_SAFETY.throughCycleNormalizationRequired).toBe(true)
    expect(METALS_COMMODITIES_K4B_SAFETY.commodityExposureMetadataRequired).toBe(true)
    expect(METALS_COMMODITIES_K4B_SAFETY.spotPeSoleAnchorAllowed).toBe(false)
    expect(METALS_COMMODITIES_K4B_SAFETY.writes).toBe(0)
  })
})
