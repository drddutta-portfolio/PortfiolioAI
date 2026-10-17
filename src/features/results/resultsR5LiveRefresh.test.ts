import { describe, expect, it } from "vitest"
import type { ResultsSourceObservation } from "./resultsSourceRepository"
import { resultsEvidenceEqual, shouldRefreshResultsEvidence, RESULTS_R5_REFRESH_INTERVAL_MS } from "./resultsR5LiveRefresh"

const selected: ResultsSourceObservation = {
  id: "fact-1", securityId: "equity-1", code: "OPERATING_REVENUE_QUARTER",
  value: "125.00", periodStart: "2025-07-01", periodEnd: "2025-09-30",
  currency: "INR", unit: "INR_CRORE", scope: "CONSOLIDATED",
  source: "COMPANY_EXCHANGE_FILING", sourceRecordId: "original-1",
  publishedAt: null, retrievedAt: "2026-10-16T17:00:00Z", selected: true,
}

describe("R5-F qualified evidence refresh without duplicate collection", () => {
  it("checks every ten minutes while visible, and checks again on foreground resume", () => {
    expect(RESULTS_R5_REFRESH_INTERVAL_MS).toBe(600000)
    expect(shouldRefreshResultsEvidence(0, true)).toBe(false)
    expect(shouldRefreshResultsEvidence(59999, true)).toBe(false)
    expect(shouldRefreshResultsEvidence(60000, true)).toBe(true)
    expect(shouldRefreshResultsEvidence(RESULTS_R5_REFRESH_INTERVAL_MS, true)).toBe(true)
    expect(shouldRefreshResultsEvidence(RESULTS_R5_REFRESH_INTERVAL_MS, false)).toBe(false)
  })

  it("retains the memoized R5 projection when R4 has made no changes", () => {
    expect(resultsEvidenceEqual([selected], [{ ...selected }])).toBe(true)
    expect(resultsEvidenceEqual([], [])).toBe(true)
    expect(resultsEvidenceEqual([selected], [])).toBe(false)
    expect(resultsEvidenceEqual([selected], [selected, { ...selected, id: "fact-2" }])).toBe(false)
  })

  it("recomputes when R4 qualifies existing observations or adds new originals", () => {
    const pending = { ...selected, selected: false }
    expect(resultsEvidenceEqual([pending], [selected])).toBe(false)
    expect(resultsEvidenceEqual([selected], [{ ...selected, value: "130" }])).toBe(false)
    expect(resultsEvidenceEqual([selected], [{ ...selected, sourceRecordId: "corrected-issuer" }])).toBe(false)
    expect(resultsEvidenceEqual([selected], [{ ...selected, originalShareBasis: true }])).toBe(false)
    expect(resultsEvidenceEqual([selected], [{ ...selected, scope: "STANDALONE" }])).toBe(false)
    expect(resultsEvidenceEqual([selected], [{ ...selected, publishedAt: "2025-11-01T11:00:00Z" }])).toBe(false)
  })

  it("does not reuse another company's or a different-quarter evidence", () => {
    expect(resultsEvidenceEqual([selected], [{ ...selected, securityId: "equity-2" }])).toBe(false)
    expect(resultsEvidenceEqual([selected], [{ ...selected, periodEnd: "2025-12-31" }])).toBe(false)
    expect(resultsEvidenceEqual([selected], [{ ...selected, code: "NET_PROFIT_QUARTER" }])).toBe(false)
  })
})
