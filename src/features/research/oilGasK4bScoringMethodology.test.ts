import { describe, expect, it } from "vitest"
import {
  OIL_GAS_K4B_SAFETY,
  oilGasK4bSignalRules,
  scoreOilGasK4b,
} from "./oilGasK4bScoringMethodology"

function readySignals(
  subprofile: "UPSTREAM_E_AND_P" | "MIDSTREAM_CITY_GAS" | "INTEGRATED_REFINING_PETCHEM",
  score = 70,
) {
  return [
    ...oilGasK4bSignalRules(subprofile).map((rule) => ({
      signalCode: rule.signalCode,
      normalizedScore: score,
      observationCount: rule.minimumObservations,
      state: "FRESH" as const,
    })),
    {
      signalCode: "SUBPROFILE_OPERATING_CONTEXT",
      normalizedScore: null,
      observationCount: 1,
      state: "FRESH" as const,
    },
  ]
}

describe("OIL_GAS_V1 K4 Checkpoint B deterministic scoring", () => {
  it("scores upstream deterministically and symbol-independently", () => {
    const a = scoreOilGasK4b({
      securitySymbol: "ONGC",
      industry: "Oil Exploration & Production",
      signals: readySignals("UPSTREAM_E_AND_P", 73),
    })
    const b = scoreOilGasK4b({
      securitySymbol: "FUTUREEANDP",
      industry: "Oil Exploration & Production",
      signals: readySignals("UPSTREAM_E_AND_P", 73),
    })
    expect(a.state).toBe("SCORE_READY")
    expect(a.overallScore).toBe(73)
    expect(b.overallScore).toBe(73)
  })

  it("uses distinct growth contracts for all three oil/gas curves", () => {
    expect(oilGasK4bSignalRules("UPSTREAM_E_AND_P").map((item) => item.signalCode))
      .toContain("PRODUCTION_RESERVE_AND_REALIZATION_GROWTH")
    expect(oilGasK4bSignalRules("MIDSTREAM_CITY_GAS").map((item) => item.signalCode))
      .toContain("VOLUME_THROUGHPUT_AND_NETWORK_GROWTH")
    expect(oilGasK4bSignalRules("INTEGRATED_REFINING_PETCHEM").map((item) => item.signalCode))
      .toContain("THROUGHPUT_SEGMENT_AND_MARGIN_GROWTH")
  })

  it("fails closed when subprofile operating context is missing", () => {
    const result = scoreOilGasK4b({
      securitySymbol: "GAIL",
      industry: "Gas Transmission",
      signals: readySignals("MIDSTREAM_CITY_GAS", 75).filter(
        (signal) => signal.signalCode !== "SUBPROFILE_OPERATING_CONTEXT",
      ),
    })
    expect(result.state).toBe("SCORE_NOT_COMPUTABLE")
    expect(result.reasonCodes).toContain("MANDATORY_SIGNAL_NOT_READY:SUBPROFILE_OPERATING_CONTEXT")
  })

  it("fails closed on insufficient through-cycle history", () => {
    const signals = readySignals("INTEGRATED_REFINING_PETCHEM", 75).map((signal) =>
      signal.signalCode === "CYCLE_NORMALIZED_EARNINGS_QUALITY"
        ? { ...signal, observationCount: 2 }
        : signal,
    )
    expect(scoreOilGasK4b({
      securitySymbol: "RELIANCE",
      industry: "Integrated Oil & Gas",
      signals,
    }).state).toBe("SCORE_NOT_COMPUTABLE")
  })

  it("returns METHOD_NOT_AVAILABLE for unsupported Industry", () => {
    expect(scoreOilGasK4b({
      securitySymbol: "UNKNOWN",
      industry: "Retailing",
      signals: [],
    }).state).toBe("METHOD_NOT_AVAILABLE")
  })

  it("keeps cycle-aware scoring read-only and RELIANCE non-exclusive", () => {
    expect(OIL_GAS_K4B_SAFETY.cycleNormalizationRequired).toBe(true)
    expect(OIL_GAS_K4B_SAFETY.subprofileOperatingContextRequired).toBe(true)
    expect(OIL_GAS_K4B_SAFETY.mixedBusinessControlIsSoleAnchor).toBe(false)
    expect(OIL_GAS_K4B_SAFETY.writes).toBe(0)
  })
})
