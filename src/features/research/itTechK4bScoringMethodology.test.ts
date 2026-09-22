import { describe, expect, it } from "vitest"
import { scoreItTechK4b, itTechK4bSignalRules, IT_TECH_K4B_SAFETY } from "./itTechK4bScoringMethodology"

function readySignals(subprofile: "IT_SERVICES" | "SOFTWARE_PRODUCTS_PLATFORMS" | "DIGITAL_INFRA_HARDWARE", score = 70) {
  return itTechK4bSignalRules(subprofile).map((rule) => ({
    signalCode: rule.signalCode,
    normalizedScore: score,
    observationCount: rule.minimumObservations,
    state: "FRESH" as const,
  }))
}

describe("IT_TECH K4 Checkpoint B deterministic scoring", () => {
  it("scores IT services deterministically without ticker-specific logic", () => {
    const a = scoreItTechK4b({
      securitySymbol: "INFY",
      industry: "Computers - Software & Consulting",
      signals: readySignals("IT_SERVICES", 70),
    })
    const b = scoreItTechK4b({
      securitySymbol: "FUTUREITSVC",
      industry: "Computers - Software & Consulting",
      signals: readySignals("IT_SERVICES", 70),
    })
    expect(a.state).toBe("SCORE_READY")
    expect(a.overallScore).toBe(70)
    expect(b.overallScore).toBe(a.overallScore)
    expect(b.subprofile).toBe("IT_SERVICES")
  })

  it("scores digital infrastructure through a different cash-flow contract", () => {
    const result = scoreItTechK4b({
      securitySymbol: "NETWEB",
      industry: "Computer Hardware",
      signals: readySignals("DIGITAL_INFRA_HARDWARE", 65),
    })
    expect(result.state).toBe("SCORE_READY")
    expect(result.overallScore).toBe(65)
    expect(result.subprofile).toBe("DIGITAL_INFRA_HARDWARE")
    expect(itTechK4bSignalRules("DIGITAL_INFRA_HARDWARE").map((item) => item.signalCode))
      .toContain("WORKING_CAPITAL_AND_CASH_CONVERSION")
  })

  it("fails closed rather than renormalizing around one missing mandatory signal", () => {
    const signals = readySignals("IT_SERVICES", 75).filter((signal) => signal.signalCode !== "FCF_CONVERSION")
    const result = scoreItTechK4b({
      securitySymbol: "PERSISTENT",
      industry: "IT Services",
      signals,
    })
    expect(result.state).toBe("SCORE_NOT_COMPUTABLE")
    expect(result.overallScore).toBeNull()
    expect(result.reasonCodes).toContain("MANDATORY_SIGNAL_NOT_READY:FCF_CONVERSION")
  })

  it("fails closed for stale or insufficient-history evidence", () => {
    const signals = readySignals("IT_SERVICES", 75).map((signal) =>
      signal.signalCode === "REVENUE_GROWTH_MULTI_PERIOD"
        ? { ...signal, observationCount: 1 }
        : signal,
    )
    const result = scoreItTechK4b({
      securitySymbol: "HCLTECH",
      industry: "IT Services",
      signals,
    })
    expect(result.state).toBe("SCORE_NOT_COMPUTABLE")
  })

  it("returns METHOD_NOT_AVAILABLE for unsupported IT industry", () => {
    expect(scoreItTechK4b({
      securitySymbol: "UNKNOWN",
      industry: "Telecom Equipment",
      signals: [],
    }).state).toBe("METHOD_NOT_AVAILABLE")
  })

  it("keeps Checkpoint B read-only and symbol-independent", () => {
    expect(IT_TECH_K4B_SAFETY.runtimeSymbolSpecific).toBe(false)
    expect(IT_TECH_K4B_SAFETY.providerCalls).toBe(0)
    expect(IT_TECH_K4B_SAFETY.writes).toBe(0)
    expect(IT_TECH_K4B_SAFETY.noMissingInputRenormalization).toBe(true)
  })
})
