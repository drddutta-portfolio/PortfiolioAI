import { describe, expect, it } from "vitest"
import { compareQuarterMetric, explainQuarterlyComparisons } from "./quarterlyR5"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

function row(periodEnd: string, value: string, code = "OPERATING_REVENUE_QUARTER"): ResultsSourceObservation {
  const [year, month] = periodEnd.split("-").map(Number)
  const start = new Date(Date.UTC(year!, month! - 3, 1)).toISOString().slice(0, 10)
  return { id: periodEnd + code, securityId: "security-1", code, value,
    periodEnd, periodStart: start, unit: "INR_CRORE", currency: "INR",
    scope: "CONSOLIDATED", source: "COMPANY_EXCHANGE_FILING",
    sourceRecordId: periodEnd + "-issuer", publishedAt: null,
    retrievedAt: "2026-10-15T00:00:00Z", selected: true }
}
describe("Results R5 source-qualified period comparisons", () => {
  it("calculates exact QoQ and YoY with matching quarters and half-up rounding", () => {
    const rows = [row("2026-06-30", "120"), row("2026-03-31", "100"), row("2025-06-30", "80")]
    const result = compareQuarterMetric(rows, "security-1", "2026-06-30", "OPERATING_REVENUE_QUARTER")
    expect(result.qoq).toBe("20.00")
    expect(result.yoy).toBe("50.00")
  })
  it("does not use earlier observations unless canonical source selections exist", () => {
    const rows = [row("2026-06-30", "120"), {...row("2026-03-31", "100"), selected: false}]
    const result = compareQuarterMetric(rows, "security-1", "2026-06-30", "OPERATING_REVENUE_QUARTER")
    expect(result.qoq).toBeNull()
    expect(result.qoqLimitation).toMatch(/selection/)
  })
  it("rejects scope mixing and zero/negative baselines", () => {
    const current = row("2026-06-30", "120")
    expect(compareQuarterMetric([current, {...row("2026-03-31", "100"), scope: "STANDALONE"}], "security-1", "2026-06-30", current.code).qoq).toBeNull()
    expect(compareQuarterMetric([current, row("2026-03-31", "0")], "security-1", "2026-06-30", current.code).qoqLimitation).toMatch(/Zero/)
  })
  it("rejects period and metric substitutions, not just mismatched quarter ends", () => {
    const current = row("2026-06-30", "120")
    const bad = {...row("2026-03-31", "100"), periodStart: "2025-04-01"}
    expect(compareQuarterMetric([current, bad], "security-1", "2026-06-30", current.code).qoq).toBeNull()
    expect(compareQuarterMetric([current, row("2026-03-31", "100", "NET_PROFIT_QUARTER")], "security-1", "2026-06-30", current.code).qoq).toBeNull()
  })
  it("preserves split-affected EPS restrictions and avoids false thesis claims", () => {
    const eps = (end: string, value: string) => ({...row(end, value, "EPS_DILUTED"), unit: "INR_PER_SHARE"})
    const current = eps("2026-06-30", "12")
    const baseline = {...eps("2026-03-31", "10"), originalShareBasis: true}
    const result = compareQuarterMetric([current, baseline], "security-1", "2026-06-30", "EPS_DILUTED")
    expect(result.qoq).toBeNull()
    expect(result.qoqLimitation).toMatch(/Split-affected/)
    expect(explainQuarterlyComparisons([result], false).at(-1)).toContain("Not assessed")
  })
})
