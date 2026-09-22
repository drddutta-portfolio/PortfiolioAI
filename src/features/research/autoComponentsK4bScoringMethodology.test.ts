import { describe, expect, it } from "vitest"
import {
  AUTO_COMPONENTS_K4B_SAFETY,
  autoComponentsK4bSignalRules,
  scoreAutoComponentsK4b,
} from "./autoComponentsK4bScoringMethodology"

function readySignals(subprofile: "AUTO_OEM" | "AUTO_COMPONENTS", score = 70) {
  return autoComponentsK4bSignalRules(subprofile).map((rule) => ({
    signalCode: rule.signalCode,
    normalizedScore: score,
    observationCount: rule.minimumObservations,
    state: "FRESH" as const,
  }))
}

describe("AUTO_COMPONENTS K4 Checkpoint B deterministic scoring", () => {
  it("scores OEM methodology deterministically and symbol-independently", () => {
    const a = scoreAutoComponentsK4b({
      securitySymbol: "M&M",
      industry: "Cars & Utility Vehicles",
      signals: readySignals("AUTO_OEM", 72),
    })
    const b = scoreAutoComponentsK4b({
      securitySymbol: "FUTUREOEM",
      industry: "Cars & Utility Vehicles",
      signals: readySignals("AUTO_OEM", 72),
    })
    expect(a.state).toBe("SCORE_READY")
    expect(a.overallScore).toBe(72)
    expect(b.overallScore).toBe(a.overallScore)
  })

  it("uses different growth contracts for OEM and components", () => {
    expect(autoComponentsK4bSignalRules("AUTO_OEM").map((item) => item.signalCode))
      .toContain("VOLUME_AND_REVENUE_GROWTH_MULTI_PERIOD")
    expect(autoComponentsK4bSignalRules("AUTO_COMPONENTS").map((item) => item.signalCode))
      .toContain("REVENUE_GROWTH_MULTI_PERIOD")
  })

  it("fails closed when cash conversion is missing", () => {
    const signals = readySignals("AUTO_COMPONENTS", 75).filter(
      (signal) => signal.signalCode !== "CFO_OR_FCF_CONVERSION",
    )
    const result = scoreAutoComponentsK4b({
      securitySymbol: "MOTHERSON",
      industry: "Auto Parts & Equipment",
      signals,
    })
    expect(result.state).toBe("SCORE_NOT_COMPUTABLE")
    expect(result.overallScore).toBeNull()
    expect(result.reasonCodes).toContain("MANDATORY_SIGNAL_NOT_READY:CFO_OR_FCF_CONVERSION")
  })

  it("fails closed for insufficient quarterly growth history", () => {
    const signals = readySignals("AUTO_OEM", 75).map((signal) =>
      signal.signalCode === "VOLUME_AND_REVENUE_GROWTH_MULTI_PERIOD"
        ? { ...signal, observationCount: 2 }
        : signal,
    )
    expect(scoreAutoComponentsK4b({
      securitySymbol: "TVSMOTOR",
      industry: "2/3 Wheelers",
      signals,
    }).state).toBe("SCORE_NOT_COMPUTABLE")
  })

  it("returns METHOD_NOT_AVAILABLE for unsupported Industry", () => {
    expect(scoreAutoComponentsK4b({
      securitySymbol: "UNKNOWN",
      industry: "Retailing",
      signals: [],
    }).state).toBe("METHOD_NOT_AVAILABLE")
  })

  it("does not create an independent EV-transition score", () => {
    expect(AUTO_COMPONENTS_K4B_SAFETY.evTransitionCreatesIndependentScore).toBe(false)
    expect(AUTO_COMPONENTS_K4B_SAFETY.noMissingInputRenormalization).toBe(true)
    expect(AUTO_COMPONENTS_K4B_SAFETY.runtimeSymbolSpecific).toBe(false)
    expect(AUTO_COMPONENTS_K4B_SAFETY.writes).toBe(0)
  })
})
