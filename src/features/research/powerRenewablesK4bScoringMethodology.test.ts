import { describe, expect, it } from "vitest"
import {
  POWER_RENEWABLES_K4B_SAFETY,
  powerRenewablesK4bSignalRules,
  scorePowerRenewablesK4b,
} from "./powerRenewablesK4bScoringMethodology"

function readySignals(
  subprofile: "REGULATED_NETWORK" | "GENERATION_INTEGRATED_UTILITY" | "RENEWABLE_IPP",
  score = 70,
) {
  return [
    ...powerRenewablesK4bSignalRules(subprofile).map((rule) => ({
      signalCode: rule.signalCode,
      normalizedScore: score,
      observationCount: rule.minimumObservations,
      state: "FRESH" as const,
    })),
    {
      signalCode: "TARIFF_PPA_OFFTAKER_GRID_CONTEXT",
      normalizedScore: null,
      observationCount: 1,
      state: "FRESH" as const,
    },
  ]
}

describe("POWER_RENEWABLES_V1 K4 Checkpoint B deterministic scoring", () => {
  it("scores regulated-network businesses deterministically and symbol-independently", () => {
    const a = scorePowerRenewablesK4b({
      securitySymbol: "POWERGRID",
      industry: "Power Transmission",
      signals: readySignals("REGULATED_NETWORK", 74),
    })
    const b = scorePowerRenewablesK4b({
      securitySymbol: "FUTUREGRID",
      industry: "Power Transmission",
      signals: readySignals("REGULATED_NETWORK", 74),
    })
    expect(a.state).toBe("SCORE_READY")
    expect(a.overallScore).toBe(74)
    expect(b.overallScore).toBe(74)
  })

  it("uses distinct growth contracts for all three power curves", () => {
    expect(powerRenewablesK4bSignalRules("REGULATED_NETWORK").map((item) => item.signalCode))
      .toContain("REGULATED_ASSET_NETWORK_AND_COMMISSIONING_GROWTH")
    expect(powerRenewablesK4bSignalRules("GENERATION_INTEGRATED_UTILITY").map((item) => item.signalCode))
      .toContain("CAPACITY_GENERATION_AND_ASSET_MIX_GROWTH")
    expect(powerRenewablesK4bSignalRules("RENEWABLE_IPP").map((item) => item.signalCode))
      .toContain("OPERATING_AND_PIPELINE_CAPACITY_GROWTH")
  })

  it("fails closed when tariff/PPA/offtaker/grid context is missing", () => {
    const result = scorePowerRenewablesK4b({
      securitySymbol: "ACMESOLAR",
      industry: "Renewable Energy",
      signals: readySignals("RENEWABLE_IPP", 76).filter(
        (signal) => signal.signalCode !== "TARIFF_PPA_OFFTAKER_GRID_CONTEXT",
      ),
    })
    expect(result.state).toBe("SCORE_NOT_COMPUTABLE")
    expect(result.reasonCodes).toContain("MANDATORY_SIGNAL_NOT_READY:TARIFF_PPA_OFFTAKER_GRID_CONTEXT")
  })

  it("fails closed when leverage/refinancing evidence is missing", () => {
    const result = scorePowerRenewablesK4b({
      securitySymbol: "TATAPOWER",
      industry: "Integrated Power Utilities",
      signals: readySignals("GENERATION_INTEGRATED_UTILITY", 73).filter(
        (signal) => signal.signalCode !== "NET_DEBT_INTEREST_COVERAGE_AND_REFINANCING",
      ),
    })
    expect(result.state).toBe("SCORE_NOT_COMPUTABLE")
  })

  it("returns METHOD_NOT_AVAILABLE for unsupported Industry", () => {
    expect(scorePowerRenewablesK4b({
      securitySymbol: "UNKNOWN",
      industry: "Packaged Foods",
      signals: [],
    }).state).toBe("METHOD_NOT_AVAILABLE")
  })

  it("remains read-only, non-persisting and fail-closed", () => {
    expect(POWER_RENEWABLES_K4B_SAFETY.tariffPpaOfftakerGridContextRequired).toBe(true)
    expect(POWER_RENEWABLES_K4B_SAFETY.noMissingInputRenormalization).toBe(true)
    expect(POWER_RENEWABLES_K4B_SAFETY.noCrossSubprofilePercentiles).toBe(true)
    expect(POWER_RENEWABLES_K4B_SAFETY.writes).toBe(0)
  })
})
