import { describe, expect, it } from "vitest"
import {
  FIN_SERVICES_NON_LENDER_K4B_SAFETY,
  finServicesNonLenderK4bSignalRules,
  scoreFinServicesNonLenderK4b,
} from "./finServicesNonLenderK4bScoringMethodology"

function readySignals(
  subprofile: "CAPITAL_MARKETS_AMC" | "INSURANCE" | "FINTECH_PLATFORM",
  score = 70,
) {
  return finServicesNonLenderK4bSignalRules(subprofile).map((rule) => ({
    signalCode: rule.signalCode,
    normalizedScore: score,
    observationCount: rule.minimumObservations,
    state: "FRESH" as const,
  }))
}

describe("FIN_SERVICES_NON_LENDER K4 Checkpoint B deterministic scoring", () => {
  it("scores capital-markets/AMC deterministically and symbol-independently", () => {
    const a = scoreFinServicesNonLenderK4b({
      securitySymbol: "HDFCAMC",
      industry: "Asset Management Company",
      signals: readySignals("CAPITAL_MARKETS_AMC", 76),
    })
    const b = scoreFinServicesNonLenderK4b({
      securitySymbol: "FUTUREAMC",
      industry: "Asset Management Company",
      signals: readySignals("CAPITAL_MARKETS_AMC", 76),
    })
    expect(a.state).toBe("SCORE_READY")
    expect(a.overallScore).toBe(76)
    expect(b.overallScore).toBe(76)
  })

  it("uses insurance-specific quality/capital contracts", () => {
    const codes = finServicesNonLenderK4bSignalRules("INSURANCE").map((item) => item.signalCode)
    expect(codes).toContain("UNDERWRITING_OR_RESERVING_QUALITY")
    expect(codes).toContain("SOLVENCY_OR_CAPITAL_ADEQUACY")
    expect(codes).not.toContain("CFO_OR_FCF_CONVERSION")
  })

  it("uses platform unit economics and funding runway for fintech", () => {
    const codes = finServicesNonLenderK4bSignalRules("FINTECH_PLATFORM").map((item) => item.signalCode)
    expect(codes).toContain("CONTRIBUTION_MARGIN_OR_UNIT_ECONOMICS")
    expect(codes).toContain("NET_CASH_OR_FUNDING_RUNWAY")
  })

  it("fails closed when mandatory subprofile evidence is missing", () => {
    const signals = readySignals("INSURANCE", 75).filter(
      (signal) => signal.signalCode !== "UNDERWRITING_OR_RESERVING_QUALITY",
    )
    const result = scoreFinServicesNonLenderK4b({
      securitySymbol: "STARHEALTH",
      industry: "Health Insurance",
      signals,
    })
    expect(result.state).toBe("SCORE_NOT_COMPUTABLE")
    expect(result.overallScore).toBeNull()
  })

  it("returns METHOD_NOT_AVAILABLE for lending NBFC classification", () => {
    expect(scoreFinServicesNonLenderK4b({
      securitySymbol: "NBFCX",
      industry: "NBFC",
      signals: [],
    }).state).toBe("METHOD_NOT_AVAILABLE")
  })

  it("prohibits lender inheritance and remains read-only", () => {
    expect(FIN_SERVICES_NON_LENDER_K4B_SAFETY.lenderMetricInheritance).toBe(false)
    expect(FIN_SERVICES_NON_LENDER_K4B_SAFETY.noMissingInputRenormalization).toBe(true)
    expect(FIN_SERVICES_NON_LENDER_K4B_SAFETY.runtimeSymbolSpecific).toBe(false)
    expect(FIN_SERVICES_NON_LENDER_K4B_SAFETY.writes).toBe(0)
  })
})
