import Decimal from "decimal.js"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

/**
 * Quarterly operating-performance signal, deliberately independent of V1-4
 * research readiness, recommendation scores and canonical evidence selection.
 * It uses only individually selected and same-period observations; negative
 * numbers are not automatically scored as bad without metric semantics.
 */
export type QuarterlyPerformance = "IMPROVING" | "DETERIORATING" | "MIXED" | "INSUFFICIENT_DATA"

export interface QuarterlyPerformanceAssessment {
  readonly status: QuarterlyPerformance
  readonly explanation: string
  readonly supportingMetrics: readonly string[]
}

const BANK_GROWTH = ["ADVANCES_GROWTH_YOY", "DEPOSITS_GROWTH_YOY"] as const

export function assessQuarterlyPerformance(
  observations: readonly ResultsSourceObservation[],
  industry: string | null,
): QuarterlyPerformanceAssessment {
  const selected = observations.filter((row) => row.selected)
  const isBank = /bank/i.test(industry ?? "")
  if (!isBank) {
    return {
      status: "INSUFFICIENT_DATA",
      explanation: "Reported revenue and profit growth need comparable, verified prior periods. This page does not infer growth from an isolated quarter.",
      supportingMetrics: [],
    }
  }
  const unique = BANK_GROWTH.map((code) => selected.filter((row) => row.code === code))
  if (unique.some((matches) => matches.length !== 1)) {
    return { status: "INSUFFICIENT_DATA", explanation: "Both selected advances and deposits YoY growth are required for this limited banking activity signal.", supportingMetrics: [] }
  }
  const rows = unique.map((matches) => matches[0]!)
  if (rows.some((row) => row.unit !== "PERCENT" || row.scope === null || row.scope === "UNKNOWN" || row.publishedAt === null)
    || new Set(rows.map((row) => row.periodEnd)).size !== 1
    || new Set(rows.map((row) => row.scope)).size !== 1) {
    return { status: "INSUFFICIENT_DATA", explanation: "Bank growth observations have missing or incompatible scope, units, period or publication evidence.", supportingMetrics: [] }
  }
  let values: Decimal[]
  try {
    values = rows.map((row) => new Decimal(row.value))
    if (values.some((value) => !value.isFinite())) throw new Error("Invalid growth value")
  } catch {
    return { status: "INSUFFICIENT_DATA", explanation: "Bank growth observations are not valid decimals.", supportingMetrics: [] }
  }
  const signals = values.map((value) => value.gt(0) ? 1 : value.lt(0) ? -1 : 0)
  const status = signals.every((signal) => signal > 0) ? "IMPROVING"
    : signals.every((signal) => signal < 0) ? "DETERIORATING" : "MIXED"
  return {
    status,
    explanation: "Directional bank advances/deposit growth signal only; not a full quarterly earnings grade, asset-quality assessment or investment recommendation.",
    supportingMetrics: [...BANK_GROWTH],
  }
}
