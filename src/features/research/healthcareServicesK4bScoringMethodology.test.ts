import { describe, expect, it } from "vitest"
import {
  HEALTHCARE_SERVICES_K4B_SAFETY,
  healthcareServicesK4bSignalRules,
  scoreHealthcareServicesK4b,
} from "./healthcareServicesK4bScoringMethodology"

function readySignals(score = 70) {
  return healthcareServicesK4bSignalRules().map((rule) => ({
    signalCode: rule.signalCode,
    normalizedScore: score,
    observationCount: rule.minimumObservations,
    state: "FRESH" as const,
  }))
}

describe("HEALTHCARE_SERVICES_V1 K4 Checkpoint B deterministic scoring", () => {
  it("scores hospital operators deterministically and symbol-independently", () => {
    const a = scoreHealthcareServicesK4b({
      securitySymbol: "MAXHEALTH",
      industry: "Hospitals",
      signals: readySignals(74),
    })
    const b = scoreHealthcareServicesK4b({
      securitySymbol: "FUTUREHOSPITAL",
      industry: "Hospitals",
      signals: readySignals(74),
    })
    expect(a.state).toBe("SCORE_READY")
    expect(a.overallScore).toBe(74)
    expect(b.overallScore).toBe(a.overallScore)
  })

  it("requires hospital operating durability rather than generic growth only", () => {
    expect(healthcareServicesK4bSignalRules().map((item) => item.signalCode))
      .toContain("HOSPITAL_OPERATING_DURABILITY")
  })

  it("fails closed when hospital operating evidence is missing", () => {
    const signals = readySignals(75).filter(
      (signal) => signal.signalCode !== "HOSPITAL_OPERATING_DURABILITY",
    )
    const result = scoreHealthcareServicesK4b({
      securitySymbol: "MEDANTA",
      industry: "Hospitals",
      signals,
    })
    expect(result.state).toBe("SCORE_NOT_COMPUTABLE")
    expect(result.overallScore).toBeNull()
  })

  it("fails closed for insufficient operating-history depth", () => {
    const signals = readySignals(75).map((signal) =>
      signal.signalCode === "HOSPITAL_OPERATING_DURABILITY"
        ? { ...signal, observationCount: 2 }
        : signal,
    )
    expect(scoreHealthcareServicesK4b({
      securitySymbol: "YATHARTH",
      industry: "Hospital & Healthcare Services",
      signals,
    }).state).toBe("SCORE_NOT_COMPUTABLE")
  })

  it("requires separate review rather than using hospital scoring for diagnostics", () => {
    const result = scoreHealthcareServicesK4b({
      securitySymbol: "DIAGNOSTIC",
      industry: "Diagnostics",
      signals: readySignals(80),
    })
    expect(result.state).toBe("REVIEW_REQUIRED")
    expect(result.overallScore).toBeNull()
    expect(result.reasonCodes).toContain("DIAGNOSTICS_REQUIRES_SEPARATE_METHODOLOGY")
  })

  it("remains read-only and non-persisting", () => {
    expect(HEALTHCARE_SERVICES_K4B_SAFETY.diagnosticsScoringEnabled).toBe(false)
    expect(HEALTHCARE_SERVICES_K4B_SAFETY.noMissingInputRenormalization).toBe(true)
    expect(HEALTHCARE_SERVICES_K4B_SAFETY.runtimeSymbolSpecific).toBe(false)
    expect(HEALTHCARE_SERVICES_K4B_SAFETY.writes).toBe(0)
  })
})
