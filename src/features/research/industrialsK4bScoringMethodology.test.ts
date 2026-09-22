import { describe, expect, it } from "vitest"
import {
  INDUSTRIALS_K4B_SAFETY,
  industrialsK4bSignalRules,
  scoreIndustrialsK4b,
} from "./industrialsK4bScoringMethodology"

function readySignals(
  subprofile: "PROJECT_EPC" | "CAPITAL_EQUIPMENT_ELECTRICAL" | "DEFENCE_AEROSPACE",
  score = 70,
) {
  return industrialsK4bSignalRules(subprofile).map((rule) => ({
    signalCode: rule.signalCode,
    normalizedScore: score,
    observationCount: rule.minimumObservations,
    state: "FRESH" as const,
  }))
}

describe("INDUSTRIALS K4 Checkpoint B deterministic scoring", () => {
  it("scores PROJECT_EPC deterministically and symbol-independently", () => {
    const a = scoreIndustrialsK4b({
      securitySymbol: "LT",
      industry: "Civil Construction",
      signals: readySignals("PROJECT_EPC", 72),
    })
    const b = scoreIndustrialsK4b({
      securitySymbol: "FUTUREEPC",
      industry: "Civil Construction",
      signals: readySignals("PROJECT_EPC", 72),
    })
    expect(a.state).toBe("SCORE_READY")
    expect(a.overallScore).toBe(72)
    expect(b.overallScore).toBe(a.overallScore)
  })

  it("uses different growth/cash contracts for equipment and defence", () => {
    const equipmentCodes = industrialsK4bSignalRules("CAPITAL_EQUIPMENT_ELECTRICAL").map((item) => item.signalCode)
    const defenceCodes = industrialsK4bSignalRules("DEFENCE_AEROSPACE").map((item) => item.signalCode)
    expect(equipmentCodes).toContain("REVENUE_AND_ORDER_GROWTH_MULTI_PERIOD")
    expect(equipmentCodes).toContain("CFO_FCF_AND_WORKING_CAPITAL")
    expect(defenceCodes).toContain("ORDER_BOOK_AND_EXECUTION_GROWTH")
    expect(defenceCodes).toContain("CFO_FCF_CONVERSION")
  })

  it("fails closed when working-capital/cash-conversion evidence is missing", () => {
    const signals = readySignals("PROJECT_EPC", 75).filter(
      (signal) => signal.signalCode !== "WORKING_CAPITAL_AND_CASH_CONVERSION",
    )
    const result = scoreIndustrialsK4b({
      securitySymbol: "LT",
      industry: "Civil Construction",
      signals,
    })
    expect(result.state).toBe("SCORE_NOT_COMPUTABLE")
    expect(result.overallScore).toBeNull()
    expect(result.reasonCodes).toContain(
      "MANDATORY_SIGNAL_NOT_READY:WORKING_CAPITAL_AND_CASH_CONVERSION",
    )
  })

  it("fails closed for insufficient order-history depth", () => {
    const signals = readySignals("DEFENCE_AEROSPACE", 75).map((signal) =>
      signal.signalCode === "ORDER_BOOK_AND_EXECUTION_GROWTH"
        ? { ...signal, observationCount: 1 }
        : signal,
    )
    expect(scoreIndustrialsK4b({
      securitySymbol: "BEL",
      industry: "Aerospace & Defence",
      signals,
    }).state).toBe("SCORE_NOT_COMPUTABLE")
  })

  it("returns METHOD_NOT_AVAILABLE for unsupported Industry", () => {
    expect(scoreIndustrialsK4b({
      securitySymbol: "UNKNOWN",
      industry: "Textiles",
      signals: [],
    }).state).toBe("METHOD_NOT_AVAILABLE")
  })

  it("remains read-only and non-persisting", () => {
    expect(INDUSTRIALS_K4B_SAFETY.runtimeSymbolSpecific).toBe(false)
    expect(INDUSTRIALS_K4B_SAFETY.noMissingInputRenormalization).toBe(true)
    expect(INDUSTRIALS_K4B_SAFETY.providerCalls).toBe(0)
    expect(INDUSTRIALS_K4B_SAFETY.writes).toBe(0)
  })
})
