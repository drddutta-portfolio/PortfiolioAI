import { describe, expect, it } from "vitest"
import { guardedNumericEvidenceState, normalizeNumericEvidence, planEvidenceRequirement } from "./p7-ic-evidence-normalization"

const result = (lines: string) => JSON.stringify({ markdown_data: "123|Example|EXAMPLE|500000|2026-09-29\\n" + lines })
const normalize = (lines: string, code: string, minimum: number) => normalizeNumericEvidence({ providerResult: result(lines), expectedSymbol: "EXAMPLE", expectedInstrumentId: "123", requirements: [planEvidenceRequirement(code, minimum)] })[0]
describe("V1-4 historical-period normalization guard", () => {
  it("guards cached AVAILABLE label payloads without mutating the retained evidence", () => {
    const cached = Object.freeze({ state: "AVAILABLE", matchedSections: Object.freeze([{ label: "Revenue 1Y Growth %", numericValue: 10 }, { label: "Revenue 3Y Growth %", numericValue: 12 }]) })
    expect(guardedNumericEvidenceState(cached.state, cached, 2)).toBe("EVIDENCE_PRESENT_REVIEW_REQUIRED")
    expect(cached.state).toBe("AVAILABLE")
    expect(cached.matchedSections).toHaveLength(2)
  })
  it("does not alter ownership/history aggregates or existing terminal evidence states", () => {
    expect(guardedNumericEvidenceState("AVAILABLE", { series: { Promoter: [] } }, 4)).toBe("AVAILABLE")
    expect(guardedNumericEvidenceState("CONFLICTING", { matchedSections: [] }, 8)).toBe("CONFLICTING")
    expect(guardedNumericEvidenceState("MISSING", null, 8)).toBe("MISSING")
  })
  it("does not count different growth horizons as historical reporting periods", () => {
    const row = normalize("Revenue 1Y Growth %\\nEXAMPLE:10\\n---\\nRevenue 3Y Growth %\\nEXAMPLE:12\\n---\\nRevenue 5Y Growth %\\nEXAMPLE:14", "REVENUE_GROWTH_MULTI_PERIOD", 3)
    expect(row.matchedSections).toHaveLength(3)
    expect(row).toMatchObject({ state: "EVIDENCE_PRESENT_REVIEW_REQUIRED", reasonCode: "DATED_REPORTING_PERIODS_NOT_PROVEN", deterministicScoreReady: false })
  })
  it("does not promote an eight-period requirement from a single TTM metric", () => {
    expect(normalize("OPM TTM %\\nEXAMPLE:24.46", "OPERATING_MARGIN_HISTORY", 8).state).toBe("EVIDENCE_PRESENT_REVIEW_REQUIRED")
  })
  it("retains an explicitly single-observation requirement without inventing history", () => {
    expect(normalize("OPM TTM %\\nEXAMPLE:24.46", "OPERATING_MARGIN_HISTORY", 1)).toMatchObject({ state: "AVAILABLE", matchedSections: [{ label: "OPM TTM %", numericValue: 24.46 }] })
  })
  it("preserves missing observations instead of inserting zero", () => {
    expect(normalize("OPM TTM %\\nEXAMPLE:None", "OPERATING_MARGIN_HISTORY", 8)).toMatchObject({ state: "MISSING", matchedSections: [] })
  })
  it("rejects provider identity mismatches before normalization", () => {
    expect(() => normalizeNumericEvidence({ providerResult: result("OPM TTM %\\nEXAMPLE:24.46"), expectedSymbol: "OTHER", expectedInstrumentId: "123", requirements: [planEvidenceRequirement("OPERATING_MARGIN_HISTORY", 8)] })).toThrow("PROVIDER_PRIMARY_ENTITY_MISMATCH")
  })
})
